"""
Downloads the AgamiAI Indian-Bank-Statements dataset (Apache-2.0,
https://huggingface.co/datasets/AgamiAI/Indian-Bank-Statements) and converts its
ground truth into the FinFlow evaluation corpus format (manifest.csv +
ground_truth/<BANK>/<id>.json), so scripts/eval/parser-benchmark.ts can score it.

It is an independent synthetic corpus, from a different author and generator
than E1: 200 digital and 200 scanned statements in two layouts (separate
debit/credit columns; a single amount column with a Cr/Dr column), fictional
bank names, two-line headers, wrapped narrations and a watermark.

Rows marked "failed" in the source (zero amount, balance unchanged) are not
transactions and are left out of the ground truth.

Note: about 12% of the source rows do not reconcile with the previous balance
(a property of that generator, not of real bank ledgers), so the balance
continuity check correctly declines to verify these statements.

    python3 eval/corpus/external/fetch_agami.py --out eval/corpus/external/agami [--scanned]
"""

import argparse
import concurrent.futures as cf
import json
import os
import urllib.request

REPO = "AgamiAI/Indian-Bank-Statements"
API = f"https://huggingface.co/api/datasets/{REPO}"
RAW = f"https://huggingface.co/datasets/{REPO}/resolve/main"


def ymd(value: str) -> str:
    value = value.split(" ")[0]
    if "/" in value:
        d, m, y = value.split("/")
        return f"{y}-{m}-{d}"
    return value


def download(files, root):
    def get(name):
        dest = os.path.join(root, name)
        if os.path.exists(dest):
            return
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        urllib.request.urlretrieve(f"{RAW}/{name}", dest)

    with cf.ThreadPoolExecutor(12) as pool:
        list(pool.map(get, files))


def convert(root, out, kind):
    os.makedirs(out, exist_ok=True)
    rows = ["statement_id,bank,pdf_path,ground_truth_path,transaction_count,opening_balance,closing_balance,amount_style"]
    for layout, code in [("Type1", "AGAMI1"), ("Type2", "AGAMI2")]:
        folder = os.path.join(root, "train", f"India_Bank_Statement_{kind}_{layout}")
        for name in sorted(f for f in os.listdir(folder) if f.endswith(".json")):
            src = json.load(open(os.path.join(folder, name)))
            sid = f"{code}_{name[:-5]}"
            txns = []
            for t in src["transactions"]:
                if t["failed"]:
                    continue
                if layout == "Type1":
                    debit, credit, balance, date = t["debit"] or 0.0, t["credit"] or 0.0, t["balance"], t["date"]
                else:
                    amount = t["transaction_amount"]
                    debit, credit = (amount, 0.0) if t["cr_dr"] == "DR" else (0.0, amount)
                    balance, date = t["available_balance"], t["value_date"]
                txns.append({
                    "date": ymd(date), "narration": t["description"], "ref": t.get("cheque_no", ""),
                    "debit": debit, "credit": credit, "balance": balance, "type": "debit" if debit else "credit",
                })
            gt_dir = os.path.join(out, "ground_truth", code)
            os.makedirs(gt_dir, exist_ok=True)
            json.dump({
                "statement_id": sid, "bank": code,
                "opening_balance": src["opening_balance"], "closing_balance": src["closing_balance"],
                "transactions": txns,
            }, open(os.path.join(gt_dir, f"{sid}.json"), "w"))
            pdf = os.path.relpath(os.path.join(folder, name[:-5] + ".pdf"), out)
            style = "separate_dr_cr" if layout == "Type1" else "amount_crdr_column"
            rows.append(f"{sid},{code},{pdf},ground_truth/{code}/{sid}.json,{len(txns)},{src['opening_balance']},{src['closing_balance']},{style}")
    open(os.path.join(out, "manifest.csv"), "w").write("\n".join(rows) + "\n")
    return len(rows) - 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="eval/corpus/external/agami")
    parser.add_argument("--scanned", action="store_true", help="also fetch the scanned set (about 1.3 GB)")
    args = parser.parse_args()

    listing = json.load(urllib.request.urlopen(API))
    wanted = ["Digital"] + (["Scanned"] if args.scanned else [])
    files = [s["rfilename"] for s in listing["siblings"]
             if s["rfilename"].startswith("train/") and any(f"_{k}_" in s["rfilename"] for k in wanted)]
    raw = os.path.join(args.out, "raw")
    download(files, raw)
    for kind in wanted:
        n = convert(raw, os.path.join(args.out, kind.lower()), kind)
        print(f"{kind}: {n} statements -> {os.path.join(args.out, kind.lower())}")


if __name__ == "__main__":
    main()
