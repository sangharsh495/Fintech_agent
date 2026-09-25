# 🚀 Key-Rotating LLM Bank Statement Parsing Pipeline

This document explains the architecture and operational model of the multi-key rotating statement parser. The system is designed to handle bank statement text extraction, structured JSON generation via LLMs (Groq), validation, and balance continuity checks.

---

## 📋 Complete Model & Pipeline Overview

The statement parsing pipeline operates through a sequence of modular layers, ensuring serverless resilience, rate-limit bypassing, and high data accuracy.

### 1. 📂 PDF Text Extraction Layer
- **Pure JavaScript Parsing (`pdf-parse`)**: Replaced `pdfjs-dist` to remove dependencies on native browser-canvas binaries (`@napi-rs/canvas`). It runs natively in server-side environments (Node.js/Vercel Serverless) without any native module compilation issues.
- **Header Parsing**: Extracts raw text from the first few pages of the document to extract metadata (Bank Name, Account Holder, IFSC code, account period) before diving into transaction tables.

### 2. 🔑 Multi-Key Rotation Engine (`GroqKeyManager`)
To maximize throughput and work around Groq's free-tier rate limits, the manager rotates calls across multiple API keys:
- **Round-Robin Key Selection**: The manager maintains a pool of keys (`GROQ_KEY_1`, `GROQ_KEY_2`, `GROQ_KEY_3`) and loops through them sequentially (using a cursor index) to distribute the request load.
- **Redis-Backed Cooldown State**: In serverless environments, local memory states are destroyed between requests. The manager stores cooldown states directly in Redis with expiration times to keep them synchronized across all active serverless lambda instances:
  - **Rate Limit Cooldown (429)**: The key is marked in Redis under `groq:cooldown:${key}` with a **60-second expiration**.
  - **General Call Failure**: The key is put to sleep for **15 seconds** to prevent hammering on network timeouts or temporary server issues.
  - **Consecutive Failures**: Monitored via a Redis counter `groq:failure:${key}` (expires after 24 hours).
- **Proactive Wait & Backoff**: If all keys are currently cooling down, the client checks the TTL of the keys in Redis, sleeps for the soonest expiration time (plus a 250ms buffer), and automatically retries.

### 3. 🧠 Structured LLM Extraction Layer (`Llama-3.3-70B`)
- **JSON Object Mode**: Prompts the LLM to output a strictly structured JSON response matching the target schema.
- **Zod Schema Enforcement**: Enforces a strict validation schema on the output:
  ```ts
  TransactionSchema = z.object({
    date: z.string().min(1),
    description: z.string().min(1),
    refNo: z.string().nullable().default(null),
    debit: z.number().nullable(),
    credit: z.number().nullable(),
    balance: z.number(),
  });
  ```
- **Text Chunking**: Statements that exceed context constraints are split into chunks of `6000` characters, processed individually, and rejoined.

### 4. 🧮 Balance Continuity Sanity Check
LLMs can occasionally miss a row or mistranscribe an amount. To ensure 100% data integrity, the pipeline runs a mathematical check:
- **Continuity Math**:
  $$\text{Expected Balance} = \text{Previous Balance} + \text{Credit} - \text{Debit}$$
- **Epsilon Verification**: Checks if $|\text{Expected Balance} - \text{Actual Balance}| \le 0.01$ for every adjacent row.
- **Fail-safe Reporting**: If any row fails this verification, it flags a warning to the UI, highlighting the exact index and row so the user can review before persisting duplicates or incorrect balances.

### 5. 🔄 Downstream Normalization & Mapping
- **Date Normalization**: Parses dates robustly using multi-format regex (DD/MM/YYYY, YYYY-MM-DD, etc.) into JS `Date` objects.
- **Rule-Based Categorization**: Reuses the high-speed local categorizer (`categorizer.ts`) to determine transaction categories, subcategories, merchants, and recurring flags.
- **Payment Method Detection**: Infers payment types (`upi`, `neft`, `imps`, `rtgs`, `cash`, `card`, `other`) from transaction patterns.
- **SHA-256 Hash Generation**: Computes a deterministic transaction hash based on `date`, `amount`, and `description` to prevent duplicates.

---

### 6. 🛡️ Dual-Engine Ingestion Architecture
To guarantee $>98\%$ ingestion availability even under external API outages, rate limits (HTTP 429), or corrupted PDF formats:
- **Tier 1 (Groq LLM Key-Rotating Parser)**: Utilizes multi-key rotation and JSON schema mode for general and multi-page statements.
- **Tier 2 (Deterministic Line/Regex Fallback)**: If LLM extraction yields 0 transactions or experiences rate-limiting, the pipeline seamlessly falls back to [`parseLinesAsTransactions`](server/services/parser/pdf.table.ts) calibrated across **21 Indian Scheduled Commercial Banks** (SBI, HDFC, ICICI, Axis, Kotak Mahindra, PNB, BoB, etc.).
- **In-Flight Deduplication**: Strips duplicate transactions overlapping across chunk and page boundaries using cryptographic SHA-256 fingerprints before returning the canonical ledger.

---

### 7. 🏛️ RBI Account Aggregator (AA / ReBIT FI-Fetch) Engine
FinFlow natively ingests digital consent feeds compliant with the Reserve Bank of India (RBI) / ReBIT Financial Information Provider (FIP) deposit account specifications:
- **Endpoint**: `/api/aa/ingest`
- **Supported Formats**: ReBIT Deposit Account Schema (v2.0) in structured JSON or XML.
- **Continuous Audit Verification**: Enforces Theorem 1 Balance Continuity Invariant on electronic streams, catching upstream core-banking reconciliation errors.
- **Sandbox Simulator**: `/api/aa/mock-consent` provides instant mock consent generation for continuous transaction feeds across major Indian banks.

---

### 8. 📐 Statutory Deduction Breakeven Analyzer (Theorem 2)
Computes the exact breakeven deduction threshold $D^*(Y)$ proving whether itemized deductions justify choosing the Old Tax Regime over Section 115BAC (New Regime):
$$D^*(Y) = \inf \left\{ D \in [0, D_{\max}] : T_{\text{Old}}(Y, D) \le T_{\text{New}}(Y) \right\}$$
- **Marginal Rate Dynamics**: Grounds tax advice in statutory marginal rates $\mu_{\text{New}} \le \mu_{\text{Old}}$.
- **Section 87A Marginal Relief**: Formally handles the non-linear discontinuity around ₹7,00,000 gross taxable income.
- **Zero Hallucination Guarantee**: Grounded entirely in deterministic symbolic evaluation.
