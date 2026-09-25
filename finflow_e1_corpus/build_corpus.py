"""
Builds the E1 evaluation corpus: for every bank profile, generates
STATEMENTS_PER_BANK statements with TXNS_PER_STATEMENT transactions
each, renders each as a position-accurate PDF, and writes a matching
ground-truth JSON plus a corpus-wide manifest CSV.

Usage:
    python build_corpus.py [--per-bank 10] [--txns 40] [--out ./corpus]
"""

import argparse
import csv
import json
import os
import random
from datetime import datetime

from bank_profiles import PROFILES, ALL_BANK_IDS
from transaction_gen import generate_statement_transactions
from render_pdf import render_statement_pdf

HOLDER_NAMES = ["Sangharsh G.", "Aarav Sharma", "Priya Patel", "Rohan Mehta",
                 "Ananya Iyer", "Vikram Nair", "Sneha Reddy", "Karan Malhotra"]


def build(out_dir: str, per_bank: int, txns_per_stmt_range=(25, 55), seed_base=1000):
    pdf_dir = os.path.join(out_dir, "pdfs")
    gt_dir = os.path.join(out_dir, "ground_truth")
    os.makedirs(pdf_dir, exist_ok=True)
    os.makedirs(gt_dir, exist_ok=True)

    manifest_rows = []
    stmt_counter = 0

    for bank_id in ALL_BANK_IDS:
        profile = PROFILES[bank_id]
        bank_pdf_dir = os.path.join(pdf_dir, bank_id)
        bank_gt_dir = os.path.join(gt_dir, bank_id)
        os.makedirs(bank_pdf_dir, exist_ok=True)
        os.makedirs(bank_gt_dir, exist_ok=True)

        for i in range(per_bank):
            stmt_counter += 1
            seed = seed_base + stmt_counter
            rng = random.Random(seed)

            statement_id = f"{bank_id}_{i+1:03d}"
            opening_balance = round(rng.uniform(5000, 150000), 2)
            n_txns = rng.randint(*txns_per_stmt_range)
            year = rng.choice([2025, 2026])
            month = rng.randint(1, 9 if year == 2026 else 12)
            start_date = datetime(year, month, 1)
            holder = rng.choice(HOLDER_NAMES)
            acct_no = str(rng.randint(10, 99)) + "".join(str(rng.randint(0, 9)) for _ in range(10))
            ifsc = f"{bank_id[:4]}0{rng.randint(100000, 999999)}"[:11]

            txns, closing_balance = generate_statement_transactions(
                opening_balance, n_txns, start_date, seed=seed)

            pdf_path = os.path.join(bank_pdf_dir, f"{statement_id}.pdf")
            render_statement_pdf(
                pdf_path, profile, holder, acct_no, ifsc,
                f"{start_date.strftime('%d-%b-%Y')} to {start_date.strftime('%d-%b')} (statement end)",
                opening_balance, txns, closing_balance,
            )

            gt = {
                "statement_id": statement_id,
                "bank": bank_id,
                "bank_display_name": profile.display_name,
                "account_holder": holder,
                "account_number": acct_no,
                "ifsc": ifsc,
                "opening_balance": opening_balance,
                "closing_balance": closing_balance,
                "transaction_count": len(txns),
                "transactions": txns,
            }
            gt_path = os.path.join(bank_gt_dir, f"{statement_id}.json")
            with open(gt_path, "w") as f:
                json.dump(gt, f, indent=2)

            manifest_rows.append({
                "statement_id": statement_id,
                "bank": bank_id,
                "pdf_path": os.path.relpath(pdf_path, out_dir),
                "ground_truth_path": os.path.relpath(gt_path, out_dir),
                "transaction_count": len(txns),
                "opening_balance": opening_balance,
                "closing_balance": closing_balance,
                "amount_style": profile.amount_style,
            })

    manifest_path = os.path.join(out_dir, "manifest.csv")
    with open(manifest_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(manifest_rows[0].keys()))
        writer.writeheader()
        writer.writerows(manifest_rows)

    return manifest_path, len(manifest_rows)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--per-bank", type=int, default=10)
    parser.add_argument("--txns", type=int, nargs=2, default=[25, 55])
    parser.add_argument("--out", type=str, default="./corpus")
    args = parser.parse_args()

    manifest_path, count = build(args.out, args.per_bank, tuple(args.txns))
    print(f"Built {count} statements across {len(ALL_BANK_IDS)} banks -> {args.out}")
    print(f"Manifest: {manifest_path}")
