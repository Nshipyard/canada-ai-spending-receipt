#!/usr/bin/env python3
"""Build data/*.json + public/data/*.csv from the researched CSVs in
~/workspace/build-specs-20261009/ai-receipt-data/.

Inputs:
  contracts.csv: contract_id, department, vendor_raw, amount_cad, fiscal_year,
                 award_date, description, kind, source_type, source_url, notes
  vendors.csv: canonical_vendor, hq_country, ownership, ownership_evidence_url,
               name_variants (| separated)

Outputs:
  data/contracts.json, data/vendors.json, data/summary.json
  public/data/contracts.csv, public/data/vendors.csv

Rules: no invented values. Rows with unparseable amounts or missing source_url
are quarantined and listed on stdout, never silently fixed.
"""
import csv
import json
import os
import re
import shutil
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC_DIR = os.path.expanduser("~/workspace/build-specs-20261009/ai-receipt-data")

DEPT_SHORT = {
    "Public Services and Procurement Canada": "PSPC",
    "Innovation, Science and Economic Development Canada": "ISED",
    "Department of National Defence": "DND",
    "Canada Revenue Agency": "CRA",
    "Treasury Board of Canada Secretariat": "TBS",
    "Shared Services Canada": "SSC",
    "Employment and Social Development Canada": "ESDC",
}


def norm_name(s):
    s = (s or "").strip().upper()
    s = re.sub(r"[.,;:'\"()\[\]]", "", s)
    s = re.sub(r"\b(LTD|LIMITED|INC|INCORPORATED|CORP|CORPORATION|LLC|LLP|CO|COMPANY|S\.?A\.?R\.?L\.?)\b\.?", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def parse_amount(raw, cid):
    if raw is None:
        return None
    t = str(raw).strip().replace("$", "").replace(",", "").replace(" ", "")
    try:
        v = float(t)
    except ValueError:
        return None
    if v <= 0 or v > 1e12:
        return None
    return v


def main():
    c_path = os.path.join(SRC_DIR, "contracts.csv")
    v_path = os.path.join(SRC_DIR, "vendors.csv")
    for p in (c_path, v_path):
        if not os.path.exists(p):
            print(f"MISSING INPUT: {p}")
            sys.exit(1)

    with open(v_path, newline="", encoding="utf-8") as f:
        vendor_rows = list(csv.DictReader(f))

    # canonical vendor table keyed by normalized name; every listed variant
    # also resolves to the same vendor
    vendors = {}
    variant_to_key = {}
    vid_seq = 0
    for r in vendor_rows:
        canon = (r.get("canonical_vendor") or "").strip()
        if not canon:
            continue
        key = norm_name(canon)
        own = (r.get("ownership") or "uncertain").strip().lower()
        if own not in ("canadian", "foreign", "uncertain"):
            own = "uncertain"
        variants = [x.strip() for x in (r.get("name_variants") or "").split("|") if x.strip()]
        vid_seq += 1
        vendors[key] = {
            "id": f"V{vid_seq:05d}",
            "name": canon,
            "hq_country": (r.get("hq_country") or "Unknown").strip(),
            "ownership": own,
            "ownership_evidence": (r.get("ownership_evidence_url") or "").strip(),
            "spend": 0.0,
            "contracts": 0,
            "variants": sorted(set(variants + [canon])),
            "departments": set(),
            "fiscal_years": set(),
        }
        for var in variants:
            variant_to_key[norm_name(var)] = key

    contracts = []
    quarantined = []
    with open(c_path, newline="", encoding="utf-8") as f:
        for r in csv.DictReader(f):
            cid = (r.get("contract_id") or "").strip() or f"C{len(contracts)+1:05d}"
            raw_vendor = (r.get("vendor_raw") or "").strip()
            amount = parse_amount(r.get("amount_cad"), cid)
            source_url = (r.get("source_url") or "").strip()
            if amount is None or not raw_vendor or not source_url:
                quarantined.append({"id": cid, "reason": "unparseable amount, missing vendor, or missing source_url"})
                continue
            key = norm_name(raw_vendor)
            key = variant_to_key.get(key, key)
            if key not in vendors:
                # auto-register as uncertain; the row is real and sourced, so keep it
                # flagged rather than drop it
                vid_seq += 1
                vendors[key] = {
                    "id": f"V{vid_seq:05d}",
                    "name": raw_vendor,
                    "hq_country": "Unknown",
                    "ownership": "uncertain",
                    "ownership_evidence": "",
                    "spend": 0.0,
                    "contracts": 0,
                    "variants": [raw_vendor],
                    "departments": set(),
                    "fiscal_years": set(),
                }
            v = vendors[key]
            dept = (r.get("department") or "").strip()
            fy = (r.get("fiscal_year") or "").strip()
            kind = (r.get("kind") or "procurement").strip().lower()
            if kind not in ("procurement", "investment"):
                kind = "procurement"
            c = {
                "id": cid,
                "department": dept,
                "department_short": DEPT_SHORT.get(dept, ""),
                "vendor_id": v["id"],
                "vendor_raw": raw_vendor,
                "amount_cad": amount,
                "fiscal_year": fy,
                "award_date": (r.get("award_date") or "").strip() or None,
                "description": (r.get("description") or "").strip(),
                "kind": kind,
                "source_type": (r.get("source_type") or "press").strip().lower(),
                "source_url": source_url,
                "notes": (r.get("notes") or "").strip(),
            }
            contracts.append(c)
            v["spend"] += amount
            v["contracts"] += 1
            if dept:
                v["departments"].add(dept)
            if fy:
                v["fiscal_years"].add(fy)

    vendor_list = []
    for v in sorted(vendors.values(), key=lambda x: -x["spend"]):
        vendor_list.append({
            **v,
            "departments": sorted(v["departments"]),
            "fiscal_years": sorted(v["fiscal_years"]),
        })

    tracked = sum(c["amount_cad"] for c in contracts)
    own = {"canadian": 0.0, "foreign": 0.0, "uncertain": 0.0}
    kind_totals = {"procurement": 0.0, "investment": 0.0}
    by_dept = {}
    by_year = {}
    vmap = {v["id"]: v for v in vendor_list}
    for c in contracts:
        o = vmap[c["vendor_id"]]["ownership"]
        own[o] += c["amount_cad"]
        kind_totals[c["kind"]] += c["amount_cad"]
        d = c["department"] or "Unknown"
        by_dept.setdefault(d, {"department": d, "spend": 0.0, "contracts": 0})
        by_dept[d]["spend"] += c["amount_cad"]
        by_dept[d]["contracts"] += 1
        if c["fiscal_year"]:
            by_year.setdefault(c["fiscal_year"], {"fiscal_year": c["fiscal_year"], "spend": 0.0, "contracts": 0})
            by_year[c["fiscal_year"]]["spend"] += c["amount_cad"]
            by_year[c["fiscal_year"]]["contracts"] += 1

    summary = {
        "meta": {
            "retrieved": "2026-10-09",
            "data_vintage": "Contracts 2023-2026; sources retrieved Oct 2026",
            "topline_cad": 800000000,
            "topline_source": "Canadian Press, May 13, 2026",
            "topline_url": "https://dailyguardian.ca/ottawa-spent-more-than-800m-on-ai-contracts-over-3-years-data-shows/",
            "counting_rule_en": "Tracked contracts plus the $240M Cohere strategic investment, which is an investment, not a procurement contract. Totals are reported both ways: the combined figure for the full $800M+ picture, and procurement-only when testing the Buy Canadian Policy.",
            "counting_rule_fr": "Contrats suivis plus l'investissement stratégique de 240 M$ dans Cohere, qui est un investissement et non un contrat d'approvisionnement. Les totaux sont présentés des deux façons.",
            "coverage_note_en": "This is a compiled sample of verifiable contracts, not the full $800M+. The compiled contracts cover the portion of the topline that could be verified from public sources at build time.",
            "coverage_note_fr": "Il s'agit d'un échantillon compilé de contrats vérifiables, et non du montant total de 800 M$+.",
            "excluded_note_en": "CSE and CSIS declined the MP's request; the RCMP had no centralized data. The vendor split inherits this coverage gap from the Canadian Press topline.",
            "excluded_note_fr": "Le CST et le SCRS ont refusé la demande du député; la GRC n'avait pas de données centralisées.",
            "uncertain_note_en": "Vendors coded 'uncertain' are shown separately and excluded from the Canadian and foreign shares.",
            "uncertain_note_fr": "Les fournisseurs au statut incertain sont présentés séparément.",
        },
        "tracked_spend": tracked,
        "procurement_spend": kind_totals["procurement"],
        "investment_spend": kind_totals["investment"],
        "canadian_spend": own["canadian"],
        "foreign_spend": own["foreign"],
        "uncertain_spend": own["uncertain"],
        "contract_count": len(contracts),
        "vendor_count": len(vendor_list),
        "by_department": sorted(by_dept.values(), key=lambda x: -x["spend"]),
        "by_year": sorted(by_year.values(), key=lambda x: x["fiscal_year"]),
        "top_vendor_ids": [v["id"] for v in vendor_list[:10]],
        "quarantined": quarantined,
    }

    os.makedirs(os.path.join(ROOT, "data"), exist_ok=True)
    os.makedirs(os.path.join(ROOT, "public", "data"), exist_ok=True)
    with open(os.path.join(ROOT, "data", "contracts.json"), "w", encoding="utf-8") as f:
        json.dump(contracts, f, ensure_ascii=False, indent=1)
    with open(os.path.join(ROOT, "data", "vendors.json"), "w", encoding="utf-8") as f:
        json.dump(vendor_list, f, ensure_ascii=False, indent=1)
    with open(os.path.join(ROOT, "data", "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, ensure_ascii=False, indent=1)
    shutil.copy(c_path, os.path.join(ROOT, "public", "data", "contracts.csv"))
    shutil.copy(v_path, os.path.join(ROOT, "public", "data", "vendors.csv"))

    print(f"contracts: {len(contracts)}  vendors: {len(vendor_list)}  tracked: ${tracked:,.0f}")
    print(f"canadian: ${own['canadian']:,.0f}  foreign: ${own['foreign']:,.0f}  uncertain: ${own['uncertain']:,.0f}")
    print(f"procurement: ${kind_totals['procurement']:,.0f}  investment: ${kind_totals['investment']:,.0f}")
    print(f"quarantined: {len(quarantined)}")
    for q in quarantined:
        print(f"  QUARANTINED {q['id']}: {q['reason']}")


if __name__ == "__main__":
    main()
