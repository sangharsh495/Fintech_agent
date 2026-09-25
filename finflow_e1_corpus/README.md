# FinFlow E1 Evaluation Corpus (starter set)

120 synthetic bank statements across 8 banks (15 each), each with a
position-accurate PDF and a matching ground-truth JSON. Every
statement is internally balance-consistent by construction (checked:
0 continuity errors across all 120).

## Layout

```
corpus/
  manifest.csv                 <- one row per statement, paths + summary stats
  pdfs/<BANK>/<statement_id>.pdf
  ground_truth/<BANK>/<statement_id>.json
```

## Ground truth schema

```json
{
  "statement_id": "HDFC_003",
  "bank": "HDFC",
  "account_holder": "...",
  "account_number": "...",
  "ifsc": "...",
  "opening_balance": 80537.52,
  "closing_balance": 41203.10,
  "transaction_count": 42,
  "transactions": [
    {
      "date": "2025-03-02",
      "narration": "UPI/255567774947/freelance.client/Payment",
      "ref": "255567774947",
      "debit": 1719.65,
      "credit": 0.0,
      "balance": 78817.87,
      "type": "debit"
    }
  ]
}
```

Map this to whatever field names your parser's Zod schema uses before
scoring — the important thing is `date`, `debit`/`credit` (or the
single `amount`+`type` equivalent), and `balance` are the fields to
match per row.

## Banks covered (starter set)

HDFC, ICICI, SBI, Axis, Kotak, PNB, Bank of Baroda, Yes Bank — split
across the two layout families that matter for a parser: separate
Debit/Credit columns (HDFC, ICICI, Axis, PNB, Yes) vs single
Amount+Dr/Cr-suffix column (SBI, Kotak, BoB).

## Extending to all 21 banks

1. Open `bank_profiles.py` and add a new `BankProfile` block for each
   remaining bank — copy the block closest to that bank's real column
   layout (Dr/Cr-suffix vs separate columns) and match its header
   labels/date format to your actual `bank-profiles.ts` definitions.
2. Re-run: `python build_corpus.py --per-bank 15 --out ./corpus`
3. To reach N=200+, either raise `--per-bank` or add more banks — both
   are free (no real PDFs needed, no manual annotation required, since
   the ground truth is generated alongside the PDF).

## Known limitation — be upfront about this in the paper

These are **synthetic** statements: they exercise layout/coordinate
extraction and amount/date parsing fairly, but they don't capture
real-world noise (scanner artifacts, inconsistent real-bank narration
formats, actual OCR errors, genuinely malformed PDFs). For a
defensible evaluation you should pair this synthetic set with a
smaller set of **real anonymized statements** (even 20-30, PII
redacted, across a handful of banks) manually annotated by hand — cite
the synthetic set as your primary large-N corpus and the real set as
a held-out generalization check. Reviewers will ask about this if you
only use synthetic data.

## Next steps (E2/E3)

Run both FinFlow engines (LLM parser, deterministic parser) against
`pdfs/`, compare each statement's output to its `ground_truth/` file,
and compute per-bank precision/recall/F1 plus balance-continuity pass
rate. That comparison script is the next deliverable.
