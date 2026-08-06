/**
 * GENERATED DATA - THE single source for every TRREB Market Watch figure.
 *
 * THE single source for every TRREB Market Watch figure on this site.
 *
 * Nothing in app/, components/ or lib/ may hardcode a TRREB number. They all
 * read lib/market/trreb.js, which reads this file. scripts/compliance-check.mjs
 * fails the build if a TRREB figure is typed anywhere else.
 *
 * HOW TO REFRESH when a new Market Watch lands:
 *     ./.venv/bin/python scripts/trreb-extract.py ~/Downloads/mw2608.pdf --write
 * That MERGES one new report into `reports` below. It never removes a month,
 * and it refuses to overwrite an existing report unless given --force.
 *
 * `extracted` is machine-written from the PDF - do not hand-edit it.
 * `manual` holds the page-1 boxes the extractor cannot parse yet; the writer
 * carries the previous month's block forward and flags it so you know to check
 * it. `latest` is set by the writer and is what the site publishes.
 *
 * WHY A .js FILE AND NOT .json: it has to import identically from the Next
 * bundle (app/api/market-stats), from a plain `node` test, and from a script.
 * A static ESM import needs no import attributes, no fs read, and no bundler
 * tracing hints - the file simply travels with the code that uses it.
 */

const TRREB = {
  "generator": "scripts/trreb-extract.py",
  "latest": "MW2607",
  "reports": {
    "MW2602": {
      "report": "MW2602",
      "month": "February 2026",
      "monthShort": "Feb 2026",
      "asOf": "2026-02-28",
      "extracted": {
        "mississauga": {
          "sales": 345,
          "avgPrice": 963747,
          "medianPrice": 850000,
          "newListings": 940,
          "activeListings": 1748,
          "snlr": 32.4,
          "monthsInventory": 5.2,
          "spLp": 96,
          "ldom": 36,
          "pdom": null
        }
      }
    },
    "MW2603": {
      "report": "MW2603",
      "month": "March 2026",
      "monthShort": "Mar 2026",
      "asOf": "2026-03-31",
      "extracted": {
        "mississauga": {
          "sales": 452,
          "avgPrice": 966615,
          "medianPrice": 860000,
          "newListings": 1322,
          "activeListings": 1933,
          "snlr": 32.7,
          "monthsInventory": 5.2,
          "spLp": 97,
          "ldom": 36,
          "pdom": null
        }
      }
    },
    "MW2604": {
      "report": "MW2604",
      "month": "April 2026",
      "monthShort": "Apr 2026",
      "asOf": "2026-04-30",
      "extracted": {
        "mississauga": {
          "sales": 516,
          "avgPrice": 980653,
          "medianPrice": 900000,
          "newListings": 1517,
          "activeListings": 2277,
          "snlr": 33.2,
          "monthsInventory": 5.1,
          "spLp": 97,
          "ldom": 31,
          "pdom": null
        }
      }
    },
    "MW2605": {
      "report": "MW2605",
      "month": "May 2026",
      "monthShort": "May 2026",
      "asOf": "2026-05-31",
      "extracted": {
        "mississauga": {
          "sales": 568,
          "avgPrice": 971047,
          "medianPrice": 896500,
          "newListings": 1582,
          "activeListings": 2465,
          "snlr": 34.4,
          "monthsInventory": 5.0,
          "spLp": 97,
          "ldom": 30,
          "pdom": null
        }
      }
    },
    "MW2606": {
      "report": "MW2606",
      "month": "June 2026",
      "monthShort": "Jun 2026",
      "asOf": "2026-06-30",
      "extracted": {
        "mississauga": {
          "sales": 567,
          "avgPrice": 1014120,
          "medianPrice": 880000,
          "newListings": 1632,
          "activeListings": 2589,
          "snlr": 35.1,
          "monthsInventory": 4.9,
          "spLp": 97,
          "ldom": 29,
          "pdom": null
        }
      }
    },
    "MW2607": {
      "report": "MW2607",
      "month": "July 2026",
      "monthShort": "Jul 2026",
      "asOf": "2026-07-31",
      "extracted": {
        "mississauga": {
          "sales": 500,
          "avgPrice": 899002,
          "medianPrice": 860000,
          "newListings": 1388,
          "activeListings": 2518,
          "snlr": 35.4,
          "monthsInventory": 4.9,
          "spLp": 97,
          "ldom": 32,
          "pdom": 47
        },
        "peel": {
          "sales": 1053,
          "avgPrice": 910007,
          "medianPrice": 851000,
          "newListings": null,
          "activeListings": 5055,
          "snlr": null,
          "monthsInventory": null,
          "spLp": null,
          "ldom": null,
          "pdom": null
        },
        "gta": {
          "sales": 5995,
          "avgPrice": 1003956,
          "medianPrice": 860000,
          "newListings": 14484,
          "activeListings": 26098,
          "snlr": null,
          "monthsInventory": null,
          "spLp": null,
          "ldom": 32,
          "pdom": 45
        },
        "byType": {
          "detached": {
            "sales": 184,
            "avgPrice": 1256800,
            "medianPrice": 1187500,
            "newListings": null,
            "activeListings": null,
            "spLp": 96,
            "ldom": 28
          },
          "semiDetached": {
            "sales": 69,
            "avgPrice": 891613,
            "medianPrice": 880000,
            "newListings": null,
            "activeListings": null,
            "spLp": 98,
            "ldom": 26
          },
          "townhouse": {
            "sales": 23,
            "avgPrice": 911812,
            "medianPrice": 870000,
            "newListings": null,
            "activeListings": null,
            "spLp": 98,
            "ldom": 31
          },
          "condoTown": {
            "sales": 95,
            "avgPrice": 712285,
            "medianPrice": null,
            "newListings": null,
            "activeListings": null,
            "spLp": 98,
            "ldom": 31
          },
          "condoApt": {
            "sales": 124,
            "avgPrice": 511649,
            "medianPrice": 478450,
            "newListings": null,
            "activeListings": null,
            "spLp": 97,
            "ldom": 41
          }
        },
        "gtaYoy": {
          "all": -4.5,
          "detached": -5.1,
          "semiDetached": -7.4,
          "townhouse": -3.9,
          "condoApt": -2.3
        }
      },
      "manual": {
        "_note": "Page-1 boxes the extractor does not parse yet. Re-check every month.",
        "checkedFor": "MW2607",
        "gtaSalesYoy": -0.9,
        "gtaNewListingsYoy": -17.8,
        "gtaActiveListingsYoy": -12.1,
        "economic": {
          "gdpGrowth": -0.1,
          "gdpGrowthAsOf": "Q1 2026",
          "employmentGrowth": 0.9,
          "unemployment": 7.2,
          "inflation": 2.8,
          "indicatorsAsOf": "June 2026 (Toronto)",
          "bocRate": 2.3,
          "primeRate": 4.5
        },
        "rates": {
          "posted": true,
          "variable": 4.45,
          "fixed1yr": 5.49,
          "fixed3yr": 6.05,
          "fixed5yr": 6.09
        },
        "rental": {
          "avg1Bed": 2100,
          "avg2Bed": 2700,
          "avg3Bed": 3200,
          "rentalYoyChange": -3.2
        }
      }
    }
  }
};

export default TRREB;
