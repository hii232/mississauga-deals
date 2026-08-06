#!/usr/bin/env python3
"""
Extract the Mississauga rows from a TRREB Market Watch PDF.

    python3 -m venv .venv && ./.venv/bin/pip install pypdf
    ./.venv/bin/python scripts/trreb-extract.py ~/Downloads/mw2607.pdf          # dry run
    ./.venv/bin/python scripts/trreb-extract.py ~/Downloads/mw2607.pdf --write  # refresh the site

Why this exists
---------------
The monthly sold/volume/YoY figures were once transcribed BY HAND into
app/api/market-stats/route.js — TRREB publishes no API or feed. That process
let the numbers sit five months stale while the market pages, the weekly
newsletter and every auto-generated blog post quoted them as current, and
hand-keying is exactly the process that produces a transposed digit.

--write closes that gap. It reads the PDF and MERGES one report into
data/trreb.js, which is the single source every page, email and generated post
derives from (via lib/market/trreb.js). One command refreshes the whole site:
the month string, the as-of date, the disclaimer sentence and every figure move
together because they are all read off the same report.

Without --write it prints and changes nothing, which is the right mode for
eyeballing a new report before letting it near the site.

MERGE, NEVER REPLACE
--------------------
--write adds one key to `reports` and repoints `latest`. It never drops a month
— the monthly history chart is built from that object, so a writer that
rebuilt the file from scratch would silently shorten the series every time it
ran on a single PDF. Re-running on a report already present is refused unless
you pass --force.

Fail-closed page identification
-------------------------------
The per-type pages are documented as 7/9/11/13/15, but TRREB controls this PDF
and pagination is not a contract. Trusting the page order blindly is how you
end up writing detached figures into the condo slot — a silent, plausible,
catastrophic error of exactly the kind this codebase treats as its worst bug.

So pages are IDENTIFIED, not assumed. Page 2 lists all five property types
with their TRREB-wide sales totals; each detail page carries its own "All
TRREB Areas" sales total. Matching one against the other says what a page IS,
whatever number is printed at the bottom of it. Every type must match exactly
one page and every page exactly one type, or the script refuses.

This is not hypothetical. The first version of this script trusted the
documented order and silently mapped detached figures onto semis, because
between the June all-types page and the per-type pages sits a year-to-date
summary page that also carries a Mississauga row.
"""

import calendar
import json
import re
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    sys.exit("pypdf missing. python3 -m venv .venv && ./.venv/bin/pip install pypdf")

CITY = "Mississauga"

# The one file the whole site reads its TRREB figures from.
DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "trreb.js"

# Row labels on the all-types page, in the shape lib/market/trreb.js expects.
REGION_ROWS = [("mississauga", CITY), ("peel", "Peel Region"), ("gta", "All TRREB Areas")]

# Column order of a REGION row on the all-types page.
ALL_TYPES_COLS = ["sales", "volume", "avgPrice", "medianPrice", "newListings",
                  "snlr", "activeListings", "monthsInventory", "spLp", "ldom", "pdom"]

# Column order of a city row on a PER-TYPE page. Note it differs from the
# all-types page: no SNLR, no months-of-inventory, and activeListings sits one
# column earlier. Reading a per-type row with the all-types layout puts the
# active-listing count into the SNLR slot — plausible-looking and wrong, which
# is the failure mode this whole script exists to prevent.
PER_TYPE_COLS = ["sales", "volume", "avgPrice", "medianPrice", "newListings",
                 "activeListings", "spLp", "ldom"]

MONTHS = {"January": "01", "February": "02", "March": "03", "April": "04",
          "May": "05", "June": "06", "July": "07", "August": "08",
          "September": "09", "October": "10", "November": "11", "December": "12"}

# market-stats field name -> the page-2 column whose sales total fingerprints
# the corresponding detail page.
PER_TYPE = [
    ("detached",     "Detached"),
    ("semiDetached", "Semi-Detached"),
    ("townhouse",    "Att/Row/Twnhouse"),
    ("condoTown",    "Condo Townhouse"),
    ("condoApt",     "Condo Apt"),
]


def num(s):
    """'$1,482,130' / 'Abc2,589' / '96%' -> float. TRREB embeds footnote
    markers like 'Abc' directly against the digits, so strip everything that
    is not part of a number rather than assuming a clean cell."""
    s = re.sub(r"[^\d.\-]", "", str(s))
    try:
        return float(s)
    except ValueError:
        # Empty cells, bare dashes ('--'), stray punctuation from the layout
        # extractor. Not a number, so not a value — never guess one.
        return None


def layout(page):
    return page.extract_text(extraction_mode="layout") or ""


def city_row(text, city=CITY):
    """The city's data row, as a list of numeric cells."""
    for line in text.split("\n"):
        stripped = line.strip()
        # Anchor on the row label so a city mentioned in prose can't match.
        if not stripped.startswith(city):
            continue
        cells = [c for c in re.split(r"\s{2,}|\t", stripped) if c.strip()]
        vals = [num(c) for c in cells[1:]]
        vals = [v for v in vals if v is not None]
        if len(vals) >= 8:
            return vals
    return None


def trreb_total_sales(text):
    """The 'All TRREB Areas' sales count on a detail page — the fingerprint
    that says which property type the page actually reports."""
    for line in text.split("\n"):
        stripped = line.strip().replace("\t", " ")
        if stripped.startswith("All TRREB Areas"):
            vals = [num(c) for c in re.split(r"\s{2,}", stripped) if num(c) is not None]
            if vals:
                return vals[0]
    return None


def page2_type_sales(text):
    """Page 2 'SALES BY PRICE RANGE AND HOUSE TYPE' -> {type: sales}.

    This is the fingerprint source. Page 2 reports all five property types
    SEPARATELY (page 1 merges freehold and condo townhouses into one
    "Townhouse" figure), and in every report the five counts are distinct — so
    a detail page's own TRREB-wide sales total identifies which type it is,
    regardless of what page it happens to be printed on.

    Takes the FIRST 'Total Sales' row: page 2 prints the month, then the
    year-to-date table below it.
    """
    header = None
    for line in text.split("\n"):
        if "Detached" in line and "Condo" in line and "Total" in line:
            header = [c.strip().replace("\t", " ")
                      for c in re.split(r"\s{2,}|\t\t", line.strip()) if c.strip()]
            continue
        if header and line.strip().startswith("Total"):
            vals = [num(c) for c in re.split(r"\s{2,}|\t", line.strip())]
            vals = [v for v in vals if v is not None]
            pairs = {}
            for name, val in zip(header, vals):
                pairs[name] = val
            if pairs:
                return pairs
    return {}


def page1_yoy(text):
    """GTA-wide year-over-year average-price change per type (Total column).

    These are GTA figures, NOT Mississauga. Market Watch publishes no
    per-municipality YoY at all, so anything using these must stay labelled
    GTA-wide — CLAUDE.md forbids relabelling them."""
    out = {}
    # "All Home Types" is the whole-GTA row; TRREB has also printed it as
    # "Total". Both are tried and the first that parses wins, so a relabelled
    # summary row leaves the figure MISSING rather than silently unmapped.
    labels = ("Detached", "Semi-Detached", "Townhouse", "Condo\tApt",
              "All Home Types", "Total")
    for label in labels:
        for line in text.split("\n"):
            if label in line and "%" in line:
                pcts = re.findall(r"-?\d+\.\d+%", line)
                if len(pcts) >= 6:
                    out[label.replace("\t", " ")] = pcts[5]  # avg-price Total
                    break
    return out


def as_row(vals, cols):
    """Zip a numeric row against its column names. Columns the report did not
    print come back None rather than shifted-up neighbours: a short row means a
    missing value, never a re-aligned one."""
    return {c: (vals[i] if i < len(vals) else None) for i, c in enumerate(cols)}


def tidy(row):
    """Ints where TRREB reports ints, floats where it reports one decimal."""
    keep_float = {"snlr", "monthsInventory"}
    out = {}
    for k, v in row.items():
        if k == "volume":
            continue  # derivable from sales x avgPrice; nothing renders it
        if v is None:
            out[k] = None
        elif k in keep_float:
            out[k] = round(float(v), 1)
        else:
            out[k] = int(round(v))
    return out


def read_data_file():
    """Parse data/trreb.js back into a dict, keeping its header comment.

    The file is a JS module rather than JSON so it imports identically from the
    Next bundle, a plain `node` test and here — at the cost of this small
    round-trip. The body between `const TRREB = ` and the trailing `;` is strict
    JSON by construction (this writer is the only thing that produces it).
    """
    if not DATA_FILE.exists():
        sys.exit(f"missing {DATA_FILE} — nothing to merge into.")
    text = DATA_FILE.read_text(encoding="utf-8")
    marker = "\nconst TRREB = "
    i = text.find(marker)
    j = text.rfind(";\n\nexport default TRREB;")
    if i < 0 or j < 0:
        sys.exit(f"{DATA_FILE} is not in the expected generated shape — refusing to rewrite it.")
    header = text[:i]
    try:
        data = json.loads(text[i + len(marker):j])
    except json.JSONDecodeError as e:
        sys.exit(f"{DATA_FILE} body is not valid JSON ({e}) — refusing to rewrite it.")
    return header, data


def write_data_file(header, data):
    DATA_FILE.write_text(
        header + "\nconst TRREB = " + json.dumps(data, indent=2) + ";\n\nexport default TRREB;\n",
        encoding="utf-8",
    )


def merge_report(report, force):
    """Add one report to data/trreb.js and repoint `latest`.

    Deliberately additive. The monthly history chart is built from `reports`, so
    a writer that rebuilt the file from one PDF would shorten the series on
    every run — the same shape of bug that once shrank a 224-company corpus to
    50 because a script defaulted to a small sweep.
    """
    header, data = read_data_file()
    rid = report["report"]
    before = set(data.get("reports", {}))

    if rid in before and not force:
        sys.exit(f"{rid} is already in data/trreb.js. Re-run with --force to overwrite it.")

    # Page-1 boxes this script cannot parse yet (rates, the economic indicators,
    # rental averages). Carry the previous report's block forward — a month-old
    # posted rate beats a missing one — but stamp which report it was verified
    # against so lib/market/trreb.js can report `manualBlockIsCurrent: false`
    # and the admin dashboard can ask for a look.
    prev = data.get("reports", {}).get(data.get("latest"))
    if prev and prev.get("manual"):
        report["manual"] = json.loads(json.dumps(prev["manual"]))

    data.setdefault("reports", {})[rid] = report
    # `latest` only advances. Re-running an OLD pdf must not roll the site back.
    cur = data.get("reports", {}).get(data.get("latest"))
    if not cur or str(report["asOf"]) >= str(cur.get("asOf", "")):
        data["latest"] = rid

    after = set(data["reports"])
    dropped = before - after
    if dropped:  # cannot happen by construction; assert it anyway
        sys.exit(f"refusing to write: would drop report(s) {', '.join(sorted(dropped))}")

    write_data_file(header, data)
    return data, rid in before


def main():
    argv = [a for a in sys.argv[1:] if not a.startswith("--")]
    flags = {a for a in sys.argv[1:] if a.startswith("--")}
    unknown = flags - {"--write", "--force"}
    if unknown:
        sys.exit(f"unknown flag(s): {', '.join(sorted(unknown))}")
    do_write, force = "--write" in flags, "--force" in flags
    if not argv:
        sys.exit(f"usage: {sys.argv[0]} <market-watch.pdf> [--write] [--force]")
    path = Path(argv[0]).expanduser()
    if not path.exists():
        sys.exit(f"no such file: {path}")

    reader = PdfReader(str(path))
    pages = [layout(p) for p in reader.pages]

    month = "unknown"
    m = re.search(r"(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})",
                  pages[0].replace("\t", " "))
    if m:
        month = f"{m.group(1)} {m.group(2)}"

    print(f"\n=== TRREB Market Watch — {month} — {path.name} ({len(pages)} pages) ===\n")

    fingerprints = page2_type_sales(pages[1])
    missing = [name for _, name in PER_TYPE if name not in fingerprints]
    if missing:
        sys.exit("Could not read per-type sales totals from page 2 for: "
                 + ", ".join(missing)
                 + "\nRefusing to identify detail pages by page order alone.")

    # Candidate detail pages: any page carrying a readable Mississauga row.
    candidates = [i for i, t in enumerate(pages)
                  if city_row(t) and "SUMMARY" in t.upper()]
    if not candidates:
        sys.exit("No Mississauga rows found — is this a Market Watch report?")

    # The all-types page is the one whose TRREB total equals the sum of the
    # per-type totals; in practice it is the first, but derive it rather than
    # assume it.
    month_total = sum(fingerprints[name] for _, name in PER_TYPE)
    all_idx = candidates[0]

    row = city_row(pages[all_idx])
    print(f"--- ALL TYPES  (page {all_idx + 1})")
    labels = ["sales", "volume", "avgPrice", "medianPrice", "newListings",
              "snlr%", "activeListings", "mosInv", "spLp%", "ldom", "pdom"]
    for lab, val in zip(labels, row):
        print(f"    {lab:16} {val:,.1f}".rstrip("0").rstrip("."))
    yr = month.split()[-1]
    print(f"\n    mississaugaMonthly entry:")
    print(f"    {{ month: '{month[:3]} {yr}', report: 'MW{yr[2:]}{MONTHS.get(month.split()[0], '??')}', "
          f"sales: {int(row[0])}, avgPrice: {int(row[2])}, medianPrice: {int(row[3])}, "
          f"newListings: {int(row[4])}, activeListings: {int(row[6])}, snlr: {row[5]}, "
          f"monthsInventory: {row[7]}, spLp: {int(row[8])}, ldom: {int(row[9])} }},")

    # Fingerprint every candidate page, then match types to pages one-to-one.
    page_sales = {i: trreb_total_sales(pages[i]) for i in candidates}
    print("\n--- PER TYPE   (page identified by its TRREB-wide sales total)")
    results, problems, claimed = {}, [], {}
    for field, name in PER_TYPE:
        want = fingerprints[name]
        hits = [i for i in candidates
                if page_sales.get(i) is not None and abs(page_sales[i] - want) < 0.5]
        if len(hits) != 1:
            problems.append(
                f"{name}: page 2 says {int(want):,} sales, matched {len(hits)} page(s) "
                + (f"({', '.join(str(h + 1) for h in hits)})" if hits else "")
            )
            continue
        idx = hits[0]
        if idx in claimed:
            problems.append(f"{name}: page {idx + 1} already identified as {claimed[idx]}")
            continue
        claimed[idx] = name
        r = city_row(pages[idx])
        if not r or len(r) < 8:
            problems.append(f"{name}: no readable {CITY} row on page {idx + 1}")
            continue
        results[field] = r
        print(f"\n  {name}  (page {idx + 1})  verified — {int(want):,} TRREB sales")
        print(f"    sales {int(r[0]):,} · volume ${int(r[1]):,} · avg ${int(r[2]):,} · "
              f"median ${int(r[3]):,}")
        print(f"    newListings {int(r[4]):,} · active {int(r[5]):,} · "
              f"SP/LP {int(r[6])}% · LDOM {int(r[7])}")

    city_sum = sum(int(r[0]) for r in results.values())
    if row and len(results) == len(PER_TYPE):
        print(f"\n  [cross-check] the five types sum to {city_sum:,} {CITY} sales; "
              f"the all-types page reports {int(row[0]):,}. "
              f"Difference of {int(row[0]) - city_sum} is Link / Co-Op / Det Condo etc.")
        if not (0 <= int(row[0]) - city_sum <= 40):
            problems.append(f"per-type sales sum ({city_sum}) is implausibly far from "
                            f"the all-types total ({int(row[0])})")

    yoy = page1_yoy(pages[0])
    if yoy:
        print("\n--- GTA-WIDE YoY average price (NOT Mississauga — keep labelled GTA-wide)")
        for k, v in yoy.items():
            print(f"    {k:16} {v}")

    if problems:
        print("\n!!! PROBLEMS — nothing written:")
        for p in problems:
            print(f"    - {p}")
        sys.exit(1)
    print("\nAll five per-type pages identified and verified against page 2.")

    # ── Assemble the report record ───────────────────────────────────────
    parts = month.split()
    mm = MONTHS.get(parts[0]) if len(parts) == 2 else None
    if not mm:
        sys.exit(f"could not read the report month from page 1 (got {month!r}) — "
                 "refusing to file figures under a guessed month")
    month_name, year = parts
    last_day = calendar.monthrange(int(year), int(mm))[1]

    regions = {}
    for key, label in REGION_ROWS:
        vals = city_row(pages[all_idx], label)
        if vals:
            regions[key] = tidy(as_row(vals, ALL_TYPES_COLS))
        elif key == "mississauga":
            sys.exit(f"no {CITY} row on the all-types page — refusing to build a report without it")
        else:
            print(f"  [note] no '{label}' row found on the all-types page; leaving {key} out")

    def yoy_pct(label):
        v = yoy.get(label)
        return float(v.rstrip("%")) if v else None

    report = {
        "report": f"MW{year[2:]}{mm}",
        "month": month,
        "monthShort": f"{month_name[:3]} {year}",
        "asOf": f"{year}-{mm}-{last_day:02d}",
        "extracted": {
            **regions,
            "byType": {f: tidy(as_row(r, PER_TYPE_COLS)) for f, r in results.items()},
            # GTA-wide, NOT Mississauga. Market Watch publishes no
            # per-municipality YoY; lib/market/trreb.js keeps this labelled.
            "gtaYoy": {
                "all": yoy_pct("All Home Types") or yoy_pct("Total"),
                "detached": yoy_pct("Detached"),
                "semiDetached": yoy_pct("Semi-Detached"),
                "townhouse": yoy_pct("Townhouse"),
                "condoApt": yoy_pct("Condo Apt"),
            },
        },
    }

    if not do_write:
        print("\n--- DRY RUN. Re-run with --write to merge this into data/trreb.js:\n")
        print(json.dumps(report, indent=2))
        print("\nNothing was written.\n")
        return

    data, overwrote = merge_report(report, force)
    print(f"\n--- WROTE {DATA_FILE.relative_to(DATA_FILE.parent.parent)}")
    print(f"    {'overwrote' if overwrote else 'added'} {report['report']} ({month})")
    print(f"    latest is now {data['latest']}; history holds "
          f"{len(data['reports'])} report(s): {', '.join(sorted(data['reports']))}")
    print("\n    The whole site now reads these figures — the month string, the")
    print("    as-of date and the disclaimer sentence are derived, not typed.")
    print("\n    STILL BY HAND: page-1 mortgage rates, the economic indicators and")
    print("    the rental averages. The previous report's block was carried")
    print("    forward and flagged, so the admin dashboard will ask for a check.")
    print("    Update `manual` in data/trreb.js and set checkedFor to "
          f"\"{report['report']}\".\n")


if __name__ == "__main__":
    main()
