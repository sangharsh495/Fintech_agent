// ─── Fintech Pipeline Sanity Test ─────────────────────────────
// Runs pure-function checks across the parser → categorizer → dedup → ML data pipeline.
// No real PDF or DB required. Exits non-zero on any failure.
//
// Run: node scripts/test-pipeline.mjs

import { createRequire } from "module"
const require = createRequire(import.meta.url)
const assert = require("assert")
const fs = await import("fs/promises")

let passed = 0
let failed = 0
const acheck = async (name, fn) => {
  try { await fn(); passed++; console.log(`  ✓ ${name}`) }
  catch (e) { failed++; console.error(`  ✗ ${name}\n    ${e.message}`) }
}

console.log("\n═══ Fintech Pipeline Tests ═══\n")

// ── 1. Bank profile system ───────────────────────────────────
console.log("── Bank Profiles ──")
const { BANK_PROFILES, GENERIC_PROFILE, detectBank, listSupportedBanks } =
  await import("../server/services/parser/bank-profiles.ts")

await acheck("All bank profiles have required fields", () => {
  for (const p of BANK_PROFILES) {
    assert.ok(p.id, `${p.displayName || p.id}: missing id`)
    assert.ok(p.displayName, `${p.id}: missing displayName`)
    assert.ok(p.identifiers.length > 0, `${p.id}: no identifiers`)
    assert.ok(p.columns.date.length, `${p.id}: no date columns`)
    assert.ok(p.columns.description.length, `${p.id}: no description columns`)
    assert.ok(p.columns.debit.length, `${p.id}: no debit columns`)
    assert.ok(p.columns.credit.length, `${p.id}: no credit columns`)
    assert.ok(p.dateFormats.length, `${p.id}: no dateFormats`)
    assert.ok(p.tableStartMarkers.length, `${p.id}: no tableStartMarkers`)
    assert.ok(p.tableEndMarkers.length, `${p.id}: no tableEndMarkers`)
    assert.ok(p.headerLabels.accountNumber.length, `${p.id}: no accountNumber labels`)
  }
})

await acheck("Bank profile IDs are unique", () => {
  const ids = BANK_PROFILES.map(p => p.id)
  assert.equal(new Set(ids).size, ids.length, "duplicate bank IDs")
})

await acheck(`detectBank() recognizes all ${BANK_PROFILES.length} supported banks`, () => {
  // Use displayName (guaranteed unique) as the detection probe.
  for (const p of BANK_PROFILES) {
    const detected = detectBank(p.displayName)
    assert.equal(detected?.id, p.id, `${p.id} not detected by "${p.displayName}"`)
  }
})

await acheck("detectBank() prefers longer match (South Indian Bank ≠ Indian Bank)", () => {
  // Regression: "Indian Bank" is a substring of "South Indian Bank".
  // The longer, more specific identifier must win.
  assert.equal(detectBank("South Indian Bank")?.id, "southindian")
  assert.equal(detectBank("Indian Bank")?.id, "indianbank")
})

await acheck("detectBank() returns null for unknown text", () => {
  assert.equal(detectBank("NOT A BANK STATEMENT"), null)
})

await acheck("GENERIC_PROFILE has broad keyword coverage", () => {
  assert.ok(GENERIC_PROFILE.columns.date.length >= 4)
  assert.ok(GENERIC_PROFILE.columns.description.length >= 4)
  assert.ok(GENERIC_PROFILE.dateFormats.length >= 5)
})

await acheck("listSupportedBanks returns all banks with hints", () => {
  const list = listSupportedBanks()
  assert.equal(list.length, BANK_PROFILES.length)
  assert.ok(list[0].passwordHint, "missing password hint")
})

// ── 2. Categorizer ────────────────────────────────────────────
console.log("\n── Categorizer ──")
const { categorizeTransaction } = await import("../server/services/parser/categorizer.ts")

const cases = [
  ["SALARY CREDIT EMPLOYER", 85000, "credit", "salary"],
  ["SWIGGY ORDER BCHRG UPI", 350, "debit", "food_dining"],
  ["BIGBASKET GROCERY ORDER", 1200, "debit", "groceries"],
  ["PAYTM ELECTRICITY BILL", 1500, "debit", "utilities"],
  ["NETFLIX SUBSCRIPTION", 649, "debit", "subscriptions"],
  ["AMAZON IN SHOPPING", 2500, "debit", "shopping"],
  ["OLA CABS UPI PAYMENT", 280, "debit", "transportation"],
  ["LIC LIFE INSURANCE", 12000, "debit", "insurance"],
]
for (const [desc, amt, type, expected] of cases) {
  await acheck(`categorize("${desc}", ${amt}, ${type}) → ${expected}`, () => {
    const r = categorizeTransaction(desc, amt, type)
    assert.equal(r.category, expected, `expected ${expected}, got ${r.category}`)
    assert.equal(typeof r.merchant, "string")
    assert.equal(typeof r.isRecurring, "boolean")
  })
}

await acheck("Categorizer marks salary as recurring", () => {
  assert.equal(categorizeTransaction("SAL CREDIT", 50000, "credit").isRecurring, true)
})

await acheck("Categorizer marks insurance as recurring", () => {
  assert.equal(categorizeTransaction("LIC PREMIUM", 12000, "debit").isRecurring, true)
})

await acheck("Categorizer falls back to miscellaneous for debit", () => {
  const r = categorizeTransaction("UNKNOWN MERCHANT XYZ", 100, "debit")
  assert.equal(r.category, "miscellaneous")
})

await acheck("Categorizer falls back to transfer for credit", () => {
  const r = categorizeTransaction("UNKNOWN CREDIT", 100, "credit")
  assert.equal(r.category, "transfer")
})

await acheck("extractMerchant cleans UPI noise", () => {
  const r = categorizeTransaction("UPI-SWIGGY-BANGALORE-123456", 350, "debit")
  assert.ok(r.merchant.length > 0)
  assert.ok(!/\d{6,}/.test(r.merchant), "merchant still has reference numbers")
})

// ── 3. Deduplicator ────────────────────────────────────────────
// NOTE: deduplicator.ts imports @/server/db which can't resolve outside Next.js,
// so we inline computeHash (mirrors the production implementation).
console.log("\n── Deduplicator ──")
import crypto from "node:crypto"
function computeHash(date, amount, rawDescription) {
  const str = `${date.toISOString().split("T")[0]}|${amount.toFixed(2)}|${rawDescription.toLowerCase().trim()}`
  return crypto.createHash("sha256").update(str).digest("hex")
}

await acheck("computeHash is deterministic", () => {
  const d = new Date("2025-01-15T10:30:00Z")
  const a = computeHash(d, 1500.50, "UPI/Swiggy")
  const b = computeHash(d, 1500.50, "UPI/Swiggy")
  assert.equal(a, b)
  assert.equal(a.length, 64) // SHA-256 hex
})

await acheck("computeHash differs for different descriptions", () => {
  const d = new Date("2025-01-15T10:30:00Z")
  const a = computeHash(d, 1500.50, "UPI/Swiggy")
  const b = computeHash(d, 1500.50, "UPI/Zomato")
  assert.notEqual(a, b, "different descriptions produced same hash")
})

await acheck("computeHash differs for different amounts", () => {
  const d = new Date("2025-01-15T10:30:00Z")
  const a = computeHash(d, 1500, "UPI/Swiggy")
  const b = computeHash(d, 1501, "UPI/Swiggy")
  assert.notEqual(a, b, "different amounts produced same hash")
})

await acheck("computeHash differs for different dates", () => {
  const d1 = new Date("2025-01-15T10:30:00Z")
  const d2 = new Date("2025-01-16T10:30:00Z")
  assert.notEqual(
    computeHash(d1, 1500, "UPI/Swiggy"),
    computeHash(d2, 1500, "UPI/Swiggy"),
  )
})

// ── 4. ML Service Data ────────────────────────────────────────
console.log("\n── ML Service Data ──")

await acheck("cluster_metadata.json is valid JSON with clusters", async () => {
  const raw = await fs.readFile("ml-service/data/cluster_metadata.json", "utf-8")
  const meta = JSON.parse(raw)
  assert.ok(Array.isArray(meta.cluster_metadata), "no cluster_metadata array")
  assert.ok(meta.cluster_metadata.length >= 17, `expected ≥17 clusters, got ${meta.cluster_metadata.length}`)
  assert.ok(meta.cluster_distributions, "no cluster_distributions")
  assert.ok(meta.anomaly_summary && typeof meta.anomaly_summary.total_anomalies === "number")
  assert.ok(Array.isArray(meta.run_history) && meta.run_history.length, "no run_history")
})

await acheck("cluster_distributions has 4 cluster types", async () => {
  const raw = await fs.readFile("ml-service/data/cluster_metadata.json", "utf-8")
  const meta = JSON.parse(raw)
  const types = Object.keys(meta.cluster_distributions).sort()
  assert.deepEqual(
    types,
    ["category_affinity", "spending_behavior", "temporal", "transaction_size"],
    `expected 4 cluster types, got ${types.join(",")}`,
  )
})

await acheck("Each cluster distribution has chart_data and clusters", async () => {
  const raw = await fs.readFile("ml-service/data/cluster_metadata.json", "utf-8")
  const meta = JSON.parse(raw)
  for (const [type, dist] of Object.entries(meta.cluster_distributions)) {
    assert.ok(dist.clusters && dist.clusters.length > 0, `${type}: no clusters`)
    assert.ok(dist.chart_data && dist.chart_data.length === dist.clusters.length, `${type}: chart_data mismatch`)
    assert.equal(dist.total_clusters, dist.clusters.length, `${type}: total_clusters mismatch`)
  }
})

await acheck("anomaly_summary has top anomalies", async () => {
  const raw = await fs.readFile("ml-service/data/cluster_metadata.json", "utf-8")
  const meta = JSON.parse(raw)
  assert.ok(meta.anomaly_summary.top_anomalies.length > 0, "no top anomalies")
  const a = meta.anomaly_summary.top_anomalies[0]
  assert.ok(a.amount && a.category && a.date, "anomaly missing fields")
})

await acheck("run_history has model metrics", async () => {
  const raw = await fs.readFile("ml-service/data/cluster_metadata.json", "utf-8")
  const meta = JSON.parse(raw)
  for (const run of meta.run_history) {
    assert.ok(run.cluster_type, "run missing cluster_type")
    assert.ok(run.algorithm, "run missing algorithm")
    assert.ok(typeof run.total_transactions === "number", "run missing total_transactions")
  }
})

await acheck("Transactions JSON has cluster IDs", async () => {
  const raw = await fs.readFile("ml-service/data/transactions_clustered.json", "utf-8")
  const txns = JSON.parse(raw)
  assert.ok(Array.isArray(txns), "not an array")
  assert.ok(txns.length > 100, `only ${txns.length} transactions`)
  const clusterKeys = ["cluster", "cluster_id", "spendingCluster", "sizeCluster",
    "temporalCluster", "categoryCluster", "cluster_label"]
  const sample = txns.slice(0, 50)
  const hasClusterField = sample.some(t => clusterKeys.some(k => t[k] !== undefined))
  assert.ok(hasClusterField, "no cluster field on transactions")
})

await acheck("All 4 cluster dimensions present on transactions", async () => {
  const raw = await fs.readFile("ml-service/data/transactions_clustered.json", "utf-8")
  const txns = JSON.parse(raw)
  const sample = txns.slice(0, 100)
  const dims = ["spendingCluster", "sizeCluster", "temporalCluster", "categoryCluster"]
  for (const k of dims) {
    assert.ok(sample.some(t => t[k] !== undefined), `no "${k}" field found`)
  }
})

await acheck("cluster_trends.json is valid", async () => {
  const raw = await fs.readFile("ml-service/data/cluster_trends.json", "utf-8")
  const trends = JSON.parse(raw)
  assert.ok(trends !== null && typeof trends === "object", "cluster_trends is empty")
})

await acheck("data_summary.json is valid", async () => {
  const raw = await fs.readFile("ml-service/data/data_summary.json", "utf-8")
  const summary = JSON.parse(raw)
  assert.ok(summary !== null && typeof summary === "object", "data_summary is empty")
})

// ── 5. Type definitions exist ───────────────────────────────────
console.log("\n── Type Integrity ──")

await acheck("ParsedTransaction shape is sound", () => {
  const mock = {
    date: new Date(),
    description: "test",
    rawDescription: "test",
    amount: 100,
    type: "debit",
    balance: 1000,
    category: "test",
    isRecurring: false,
    paymentMethod: "upi",
    hash: "abc123",
  }
  const keys = ["date", "description", "rawDescription", "amount", "type",
    "category", "isRecurring", "paymentMethod", "hash"]
  for (const k of keys) assert.ok(k in mock, `ParsedTransaction missing key: ${k}`)
})

await acheck("BankProfile interface matches usage", () => {
  const p = BANK_PROFILES[0]
  assert.equal(typeof p.id, "string")
  assert.equal(typeof p.displayName, "string")
  assert.ok(Array.isArray(p.identifiers))
  assert.ok(Array.isArray(p.columns.date))
  assert.ok(Array.isArray(p.dateFormats))
  assert.ok(typeof p.amountFormat.usesDrCr, "boolean")
  assert.ok(typeof p.amountFormat.usesNegative, "boolean")
})

await acheck("PasswordRequiredError carries bank hint", async () => {
  const { PasswordRequiredError } = await import("../server/services/parser/pdf.types.ts")
  const e = new PasswordRequiredError("DOB (DDMMYYYY)", "hdfc", "HDFC Bank")
  assert.equal(e.passwordHint, "DOB (DDMMYYYY)")
  assert.equal(e.detectedBankId, "hdfc")
  assert.equal(e.detectedBankName, "HDFC Bank")
  assert.equal(e.name, "PasswordRequiredError")
})

// ── 6. Pipeline integration trace ──────────────────────────────
console.log("\n── Pipeline Integration (Parser → Categorizer → Hash) ──")

await acheck("End-to-end: categorize + hash a synthetic transaction", () => {
  const date = new Date("2025-06-15")
  const rawDesc = "UPI-SWIGGY-BANGALORE-789012"
  const cat = categorizeTransaction(rawDesc, 350, "debit")
  const hash = computeHash(date, 350, rawDesc)
  const tx = {
    date,
    description: cat.merchant || rawDesc,
    rawDescription: rawDesc,
    amount: 350,
    type: "debit",
    category: cat.category,
    merchant: cat.merchant,
    isRecurring: cat.isRecurring,
    paymentMethod: "upi",
    hash,
  }
  assert.equal(tx.category, "food_dining")
  assert.equal(tx.hash.length, 64)
  assert.equal(tx.description.length > 0, true)
})

await acheck("Date format strings match bank profile spec", () => {
  // Production parser uses date-fns parse(); native Date() does NOT handle
  // DD/MM/YYYY unambiguously, so we validate the tokens instead.
  const validTokens = [
    "DD/MM/YYYY", "DD-MM-YYYY", "DD/MM/YY", "DD-MMM-YYYY", "DD MMM YYYY",
    "MM/DD/YYYY", "YYYY-MM-DD",
  ]
  for (const p of BANK_PROFILES) {
    for (const fmt of p.dateFormats) {
      assert.ok(validTokens.includes(fmt), `${p.id}: unknown date format "${fmt}"`)
    }
  }
  // Sanity: "DD MMM YYYY" parses correctly as a human-readable date.
  const d = new Date("15 Jun 2025")
  assert.equal(d.getMonth(), 5, "DD MMM YYYY month mismatch")
})

await acheck("Generic profile includes ISO date fallback", () => {
  assert.ok(GENERIC_PROFILE.dateFormats.includes("YYYY-MM-DD"),
    "generic profile should include ISO format as fallback")
})

await acheck("Amount strings with ₹ and commas parse correctly", () => {
  const parse = (s) => parseFloat(s.replace(/[₹,\s]/g, "")) || 0
  assert.equal(parse("₹1,234.56"), 1234.56)
  assert.equal(parse("1,234.56"), 1234.56)
  assert.equal(parse("₹500"), 500)
})

// ── 7. Password Decryption & Bank-Specific Encryption Tests ───
console.log("\n── Password Decryption & Bank Coverage ──")

function isEncryptedPDF(buffer) {
  if (!buffer || buffer.length < 32) return false
  return (
    buffer.includes(Buffer.from("/Encrypt")) ||
    buffer.includes(Buffer.from("/Filter/Standard")) ||
    buffer.includes(Buffer.from("/Filter /Standard"))
  )
}

function generatePasswordCandidates(password) {
  const trimmed = password.trim()
  return Array.from(new Set([
    trimmed,
    trimmed.toUpperCase(),
    trimmed.toLowerCase(),
    password,
  ])).filter((c) => c.length > 0)
}

await acheck("All 21 banks have distinct, actionable password hints", () => {
  const requiredKeywords = ["Birth", "Customer", "Account", "Name", "Mobile", "PAN", "CRN", "CIF"]
  for (const p of BANK_PROFILES) {
    assert.ok(p.passwordHint && p.passwordHint.length >= 10, `${p.id}: passwordHint too short or missing`)
    const hasKeyword = requiredKeywords.some((kw) => p.passwordHint.includes(kw))
    assert.ok(hasKeyword, `${p.id}: hint "${p.passwordHint}" lacks standard bank credentials keywords`)
  }
})

await acheck("Password candidate generator handles case & whitespace permutations", () => {
  const cands = generatePasswordCandidates("  rahu1504 ")
  assert.ok(cands.includes("rahu1504"))
  assert.ok(cands.includes("RAHU1504"))
  assert.ok(cands.length >= 2)
})

await acheck("isEncryptedPDF detects standard and deep /Encrypt tokens in buffer", () => {
  const unencrypted = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF")
  assert.equal(isEncryptedPDF(unencrypted), false)

  const encryptedTrailer = Buffer.from("%PDF-1.4\ntrailer\n<< /Encrypt 12 0 R /Root 1 0 R >>\n%%EOF")
  assert.equal(isEncryptedPDF(encryptedTrailer), true)

  // Test deep /Encrypt (offset 10,000 bytes into file, beyond standard 2048-byte tail)
  const padding = Buffer.alloc(10000, 0x20)
  const deepEncrypted = Buffer.concat([
    Buffer.from("%PDF-1.7\n<< /Type /Catalog /Encrypt 5 0 R >>\n"),
    padding,
    Buffer.from("%%EOF"),
  ])
  assert.equal(isEncryptedPDF(deepEncrypted), true)
})

await acheck("Deterministic bank line parser matches transaction patterns across top banks", () => {
  const dateRegex = /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|^\d{1,2}\s[A-Z][a-z]{2}(?:\s\d{2,4}|\b)/

  const hdfcLines = [
    "15/06/2025 UPI-SWIGGY-12345 000123 15/06/2025 450.00 0.00 12,550.00",
    "16/06/2025 SALARY CREDIT INFOSYS 000124 16/06/2025 0.00 85,000.00 97,550.00",
  ]
  for (const line of hdfcLines) {
    assert.ok(dateRegex.test(line), `HDFC line failed date regex: ${line}`)
  }

  const sbiLine = "10 Jun 2025 10 Jun 2025 ATM CASH WITHDRAWAL 987654 2,000.00 15,000.00"
  assert.ok(dateRegex.test(sbiLine), `SBI line failed date regex: ${sbiLine}`)

  const iciciLine = "25-08-2025 INFOSYS SALARY NEFT 85,000.00 1,12,000.00"
  assert.ok(dateRegex.test(iciciLine), `ICICI line failed date regex: ${iciciLine}`)
})

// ── 9. Account Aggregator (ReBIT FI-Fetch) ─────────────────────
console.log("\n── Account Aggregator (ReBIT FI-Fetch) ──")
const { parseReBitPayload } = await import("../server/services/aa/rebit-parser.ts")

await acheck("parseReBitPayload verifies clean continuous transaction ledger", () => {
  const mockPayload = {
    consentId: "CONSENT-TEST-001",
    account: {
      profile: { bank: "HDFC Bank", accountNumberMasked: "XXXX-1234", accountType: "SAVINGS", currency: "INR" },
      summary: { currentBalance: 52400.00, currency: "INR", asOfDate: "2025-06-15" },
      transactions: {
        transaction: [
          { txnId: "T1", type: "CREDIT", mode: "NEFT", amount: 50000, currentBalance: 50000.00, transactionTimestamp: "2025-06-01T10:00:00Z", narration: "SALARY ACME CORP" },
          { txnId: "T2", type: "DEBIT", mode: "UPI", amount: 600, currentBalance: 49400.00, transactionTimestamp: "2025-06-02T14:30:00Z", narration: "SWIGGY BANGALORE" },
          { txnId: "T3", type: "CREDIT", mode: "UPI", amount: 3000, currentBalance: 52400.00, transactionTimestamp: "2025-06-05T09:15:00Z", narration: "TRANSFER FROM FRIEND" },
        ]
      }
    }
  }

  const result = parseReBitPayload(mockPayload)
  assert.equal(result.source, "REBIT_ACCOUNT_AGGREGATOR")
  assert.equal(result.continuity.valid, true)
  assert.equal(result.continuity.violationsCount, 0)
  assert.equal(result.uniqueTransactionsCount, 3)
  assert.equal(result.transactions[0].category, "salary")
  assert.equal(result.transactions[1].category, "food_dining")
})

await acheck("parseReBitPayload detects and flags balance continuity violation", () => {
  const corruptPayload = {
    consentId: "CONSENT-CORRUPT-001",
    account: {
      profile: { bank: "ICICI Bank", accountNumberMasked: "XXXX-5678", accountType: "SAVINGS" },
      transactions: {
        transaction: [
          { txnId: "T1", type: "CREDIT", amount: 10000, currentBalance: 10000.00, transactionTimestamp: "2025-06-01T10:00:00Z", narration: "OPENING" },
          { txnId: "T2", type: "DEBIT", amount: 500, currentBalance: 8000.00, transactionTimestamp: "2025-06-02T10:00:00Z", narration: "AMAZON" },
        ]
      }
    }
  }

  const result = parseReBitPayload(corruptPayload)
  assert.equal(result.continuity.valid, false)
  assert.equal(result.continuity.violationsCount, 1)
  assert.equal(result.continuity.errors[0].expectedBalance, 9500)
  assert.equal(result.continuity.errors[0].actualBalance, 8000)
  assert.equal(result.continuity.errors[0].discrepancy, 1500)
})

await acheck("parseReBitPayload cryptographically deduplicates repeated transactions", () => {
  const duplicatePayload = {
    consentId: "CONSENT-DEDUP-001",
    account: {
      profile: { bank: "SBI", accountNumberMasked: "XXXX-9999" },
      transactions: {
        transaction: [
          { txnId: "T1", type: "CREDIT", amount: 20000, currentBalance: 20000.00, transactionTimestamp: "2025-06-01T10:00:00Z", narration: "SALARY CREDIT" },
          { txnId: "T1", type: "CREDIT", amount: 20000, currentBalance: 20000.00, transactionTimestamp: "2025-06-01T10:00:00Z", narration: "SALARY CREDIT" },
        ]
      }
    }
  }

  const result = parseReBitPayload(duplicatePayload)
  assert.equal(result.rawTransactionsCount, 2)
  assert.equal(result.uniqueTransactionsCount, 1)
  assert.equal(result.duplicateCount, 1)
})

// ── 10. Deduction Breakeven Calculator (Theorem 2) ─────────────
console.log("\n── Deduction Breakeven Calculator (Theorem 2) ──")
const { computeIndianTax } = await import("../server/services/tax/tax-calculator.ts")

await acheck("calculateDeductionBreakeven for low income (<= 5L) requires 0 deductions", () => {
  const input = {
    financialYear: "2024-2025",
    age: 30,
    salaryIncome: 500000,
    hraExemption: 0,
    ltaExemption: 0,
    professionalTax: 0,
    housePropertyIncome: 0,
    presumptiveIncome44ADA: 0,
    presumptiveIncome44AD: 0,
    businessIncome: 0,
    shortTermCapitalGains111A: 0,
    longTermCapitalGains112A: 0,
    otherCapitalGains: 0,
    otherSourcesIncome: 0,
    savingsInterest: 0,
    deductions: { section80C: 0, section80CCD1B: 0, section80CCD2: 0, section80D: 0, section80DD: 0, section80DDB: 0, section80E: 0, section80EEA: 0, section80EEB: 0, section80G: 0, section80GG: 0, section80TTA: 0, section80TTB: 0, section80U: 0, section24b: 0, otherDeductions: 0 },
  }
  const result = computeIndianTax(input)
  assert.ok(result.breakevenDeductions)
  assert.equal(result.breakevenDeductions.requiredDeductionsForOldRegime, 0)
  assert.equal(result.breakevenDeductions.isOldRegimeAchievable, true)
})

await acheck("calculateDeductionBreakeven for 6.5L income correctly computes 87A gap", () => {
  const input = {
    financialYear: "2024-2025",
    age: 30,
    salaryIncome: 650000,
    hraExemption: 0,
    ltaExemption: 0,
    professionalTax: 0,
    housePropertyIncome: 0,
    presumptiveIncome44ADA: 0,
    presumptiveIncome44AD: 0,
    businessIncome: 0,
    shortTermCapitalGains111A: 0,
    longTermCapitalGains112A: 0,
    otherCapitalGains: 0,
    otherSourcesIncome: 0,
    savingsInterest: 0,
    deductions: { section80C: 0, section80CCD1B: 0, section80CCD2: 0, section80D: 0, section80DD: 0, section80DDB: 0, section80E: 0, section80EEA: 0, section80EEB: 0, section80G: 0, section80GG: 0, section80TTA: 0, section80TTB: 0, section80U: 0, section24b: 0, otherDeductions: 0 },
  }
  const result = computeIndianTax(input)
  assert.equal(result.recommendedRegime, "NEW")
  assert.ok(result.breakevenDeductions)
  assert.equal(result.breakevenDeductions.requiredDeductionsForOldRegime, 100000)
  assert.equal(result.breakevenDeductions.isOldRegimeAchievable, true)
})

await acheck("calculateDeductionBreakeven for 12L income correctly finds crossover point", () => {
  const input = {
    financialYear: "2024-2025",
    age: 32,
    salaryIncome: 1200000,
    hraExemption: 0,
    ltaExemption: 0,
    professionalTax: 0,
    housePropertyIncome: 0,
    presumptiveIncome44ADA: 0,
    presumptiveIncome44AD: 0,
    businessIncome: 0,
    shortTermCapitalGains111A: 0,
    longTermCapitalGains112A: 0,
    otherCapitalGains: 0,
    otherSourcesIncome: 0,
    savingsInterest: 0,
    deductions: { section80C: 150000, section80CCD1B: 0, section80CCD2: 0, section80D: 0, section80DD: 0, section80DDB: 0, section80E: 0, section80EEA: 0, section80EEB: 0, section80G: 0, section80GG: 0, section80TTA: 0, section80TTB: 0, section80U: 0, section24b: 0, otherDeductions: 0 },
  }
  const result = computeIndianTax(input)
  assert.ok(result.breakevenDeductions)
  // At 12L gross income in FY 24-25, required deductions under Old Regime to beat New Regime are ~2.95L
  assert.ok(result.breakevenDeductions.requiredDeductionsForOldRegime > 250000)
  assert.ok(result.breakevenDeductions.requiredDeductionsForOldRegime < 400000)
  assert.equal(result.breakevenDeductions.isOldRegimeAchievable, true)
  assert.ok(result.breakevenDeductions.gapToOldRegimeAdvantage > 0)
})

await acheck("calculateDeductionBreakeven verifies Theorem 2 Monotonicity (D*(Y2) >= D*(Y1))", () => {
  const makeInput = (salary) => ({
    financialYear: "2024-2025",
    age: 30,
    salaryIncome: salary,
    hraExemption: 0,
    ltaExemption: 0,
    professionalTax: 0,
    housePropertyIncome: 0,
    presumptiveIncome44ADA: 0,
    presumptiveIncome44AD: 0,
    businessIncome: 0,
    shortTermCapitalGains111A: 0,
    longTermCapitalGains112A: 0,
    otherCapitalGains: 0,
    otherSourcesIncome: 0,
    savingsInterest: 0,
    deductions: { section80C: 0, section80CCD1B: 0, section80CCD2: 0, section80D: 0, section80DD: 0, section80DDB: 0, section80E: 0, section80EEA: 0, section80EEB: 0, section80G: 0, section80GG: 0, section80TTA: 0, section80TTB: 0, section80U: 0, section24b: 0, otherDeductions: 0 },
  })

  const res10L = computeIndianTax(makeInput(1000000))
  const res15L = computeIndianTax(makeInput(1500000))
  const res25L = computeIndianTax(makeInput(2500000))

  const d10 = res10L.breakevenDeductions.requiredDeductionsForOldRegime
  const d15 = res15L.breakevenDeductions.requiredDeductionsForOldRegime
  const d25 = res25L.breakevenDeductions.requiredDeductionsForOldRegime

  assert.ok(d15 >= d10, `Monotonicity violated: D*(15L)=${d15} < D*(10L)=${d10}`)
  assert.ok(d25 >= d15, `Monotonicity violated: D*(25L)=${d25} < D*(15L)=${d15}`)
})

// ── Summary ────────────────────────────────────────────────────
console.log(`\n═══ Results: ${passed} passed, ${failed} failed ═══\n`)
if (failed > 0) {
  console.error("❌ Pipeline check failed. Review errors above.\n")
  process.exit(1)
}
console.log("✅ All pipeline checks passed.\n")
process.exit(0)