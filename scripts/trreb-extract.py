#!/usr/bin/env python3
"""
Extract the Mississauga rows from a TRREB Market Watch PDF.

    python3 -m venv .venv && ./.venv/bin/pip install pypdf
    ./.venv/bin/python scripts/trreb-extract.py ~/Downloads/mw2607.pdf

Why this exists
---------------
The monthly sold/volume/YoY figures in app/api/market-stats/route.js are
transcribed BY HAND from this PDF — TRREB publishes no API or feed. That
process once let the numbers sit five months stale while the market pages, the
weekly newsletter and every auto-generated blog post quoted them as current,
and hand-keying is exactly the process that produces a transposed digit.

This script does the reading so the human only does the pasting. It prints the
values already shaped like the literals in market-stats/route.js.

It does NOT write to the repo. Transcription stays a deliberate human step —
see CLAUDE.md, which also documents the fields that must move together
(tRREBMonth, tRREBAsOf, the disclaimer string).

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

import re
import sys
from pathlib import Path

try:
    from pypdf import PdfReader
except ImportError:
    sys.exit("pypdf missing. python3 -m venv .venv && ./.venv/bin/pip install pypdf")

CITY = "Mississauga"

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
    for label in ("Detached", "Semi-Detached", "Townhouse", "Condo\tApt"):
        for line in text.split("\n"):
            if label in line and "%" in line:
                pcts = re.findall(r"-?\d+\.\d+%", line)
                if len(pcts) >= 6:
                    out[label.replace("\t", " ")] = pcts[5]  # avg-price Total
                    break
    return out


def main():
    if len(sys.argv) < 2:
        sys.exit(f"usage: {sys.argv[0]} <market-watch.pdf>")
    path = Path(sys.argv[1]).expanduser()
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

    print("\n\n--- PASTE INTO market-stats/route.js  (salesByType)\n")
    print("    salesByType: {")
    for field, _ in PER_TYPE:
        if field in results:
            r = results[field]
            print(f"      {field + ':':14}{{ sales: {int(r[0])}, avgPrice: {int(r[2])}, "
                  f"spLp: {int(r[6])}, ldom: {int(r[7])} }},")
    print("    },")

    yoy = page1_yoy(pages[0])
    if yoy:
        print("\n--- GTA-WIDE YoY average price (NOT Mississauga — keep labelled GTA-wide)")
        for k, v in yoy.items():
            print(f"    {k:16} {v}")

    print(f"\n--- REMEMBER: update tRREBMonth, tRREBAsOf AND the disclaimer string together.")

    if problems:
        print("\n!!! PROBLEMS — do not transcribe until resolved:")
        for p in problems:
            print(f"    - {p}")
        sys.exit(1)
    print("\nAll five per-type pages identified and verified against page 2.\n")


if __name__ == "__main__":
    main()
