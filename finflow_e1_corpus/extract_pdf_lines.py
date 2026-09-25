#!/usr/bin/env python3
"""
Extracts plain text lines from all 120 PDFs in the E1 corpus using pdfplumber.
Outputs finflow_e1_corpus/extracted_pdf_lines.json
"""

import os
import json
import csv
import pdfplumber

def main():
    corpus_dir = "finflow_e1_corpus"
    manifest_path = os.path.join(corpus_dir, "manifest.csv")
    out_path = os.path.join(corpus_dir, "extracted_pdf_lines.json")

    with open(manifest_path, "r") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Extracting lines from {len(rows)} PDFs...")
    corpus_extracted = {}

    for i, row in enumerate(rows):
        stmt_id = row["statement_id"]
        pdf_path = os.path.join(corpus_dir, row["pdf_path"])
        lines = []

        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    for l in text.split("\n"):
                        l_clean = l.strip()
                        if l_clean:
                            lines.append(l_clean)

        corpus_extracted[stmt_id] = {
            "statement_id": stmt_id,
            "bank": row["bank"],
            "line_count": len(lines),
            "lines": lines
        }

        if (i + 1) % 20 == 0 or (i + 1) == len(rows):
            print(f"  Processed {i+1}/{len(rows)} statements...")

    with open(out_path, "w") as f:
        json.dump(corpus_extracted, f, indent=2)

    print(f"Saved extracted lines for {len(corpus_extracted)} statements to {out_path}")

if __name__ == "__main__":
    main()
