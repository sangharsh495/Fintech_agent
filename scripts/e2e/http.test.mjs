// End-to-end test against a running production build and a local Postgres.
// Run through scripts/e2e/run.sh, which sets everything up and tears it down.
// Usage: node http.test.mjs <repoDir> <tmpDir> <envFile> [scannedPdf]
import fs from "node:fs"
import path from "node:path"
import { execFileSync } from "node:child_process"
import { createRequire } from "node:module"

const [repo, scratch, envFile, scanPdf] = process.argv.slice(2)
const require = createRequire(path.join(repo, "package.json"))
const { SignJWT } = require("jose")
const env = Object.fromEntries(fs.readFileSync(envFile, "utf8").trim().split("\n").map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]))

const BASE = "http://127.0.0.1:3123"
const A = "11111111-1111-1111-1111-111111111111"
const B = "22222222-2222-2222-2222-222222222222"
const ACCT = { sbi: "aaaaaaaa-0000-0000-0000-000000000001", hdfc: "aaaaaaaa-0000-0000-0000-000000000002", other: "aaaaaaaa-0000-0000-0000-000000000003", bIcici: "bbbbbbbb-0000-0000-0000-000000000001" }

const sql = (q) => execFileSync("psql", ["-h", "127.0.0.1", "-p", "55432", "-U", "postgres", "-d", "finflow", "-At", "-c", q], { encoding: "utf8" }).trim()
const token = (id, email) => new SignJWT({ id, email, name: "E2E", image: null, type: "mobile" })
  .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h").setSubject(id)
  .sign(new TextEncoder().encode(env.AUTH_SECRET))

let failures = 0
const check = (name, ok, detail) => { console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  ${String(JSON.stringify(detail)).slice(0, 400)}`}`); if (!ok) failures++ }

async function upload(tok, file, account, extra = {}, route = "/api/upload/statement", name) {
  const form = new FormData()
  form.append("file", new Blob([fs.readFileSync(file)], { type: "application/pdf" }), name ?? path.basename(file))
  if (account) form.append("bankAccountId", account)
  for (const [k, v] of Object.entries(extra)) form.append(k, v)
  const res = await fetch(BASE + route, { method: "POST", body: form, headers: tok ? { authorization: `Bearer ${tok}` } : {} })
  let body = null
  try { body = await res.json() } catch { body = null }
  return { status: res.status, body }
}

const e1 = (bank, id) => path.join(repo, "eval/corpus/e1/pdfs", bank, `${bank}_${id}.pdf`)
const gt = (bank, id) => JSON.parse(fs.readFileSync(path.join(repo, "eval/corpus/e1/ground_truth", bank, `${bank}_${id}.json`), "utf8"))

const tA = await token(A, "e2e-a@finflow.test")
const tB = await token(B, "e2e-b@finflow.test")

// 1. Authentication
check("upload without a token → 401", (await upload(null, e1("SBI", "001"), ACCT.sbi)).status === 401)
check("/api/parse-statement without a token → 401", (await upload(null, e1("SBI", "001"), null, {}, "/api/parse-statement")).status === 401)
const forged = await new SignJWT({ id: A, type: "mobile" }).setProtectedHeader({ alg: "HS256" }).setSubject(A).setExpirationTime("1h").sign(new TextEncoder().encode("wrong-secret"))
check("forged token → 401", (await upload(forged, e1("SBI", "001"), ACCT.sbi)).status === 401)

// 2. Normal upload: deterministic tier, verified, stored
const sbi = await upload(tA, e1("SBI", "001"), ACCT.sbi)
const sbiRows = gt("SBI", "001").transactions.length
check(`SBI_001 upload → 200, ${sbiRows} rows added`, sbi.status === 200 && sbi.body?.transactionsAdded === sbiRows, sbi)
check("…parsed by the deterministic tier with no continuity warning", sbi.body?.metadata?.engine === "deterministic" && !sbi.body?.continuityWarning && sbi.body?.metadata?.bankProfileId === "sbi", sbi.body?.metadata)
check(`…${sbiRows} rows in the database for user A`, Number(sql(`select count(*) from transactions where user_id='${A}' and bank_account_id='${ACCT.sbi}'`)) === sbiRows)
const dbSum = sql(`select round(sum(case when type='credit' then amount else -amount end)::numeric, 2) from transactions where bank_account_id='${ACCT.sbi}'`)
const g = gt("SBI", "001")
const gtSum = (g.transactions.reduce((s, t) => s + t.credit - t.debit, 0)).toFixed(2)
check("…stored amounts and directions reconcile to the statement's net flow", dbSum === gtSum, { dbSum, gtSum })
const stored = sql(`select balance_after from transactions where statement_upload_id='${sbi.body?.uploadId}' order by balance_after`).split("\n").map(Number)
const expected = g.transactions.map((t) => t.balance).sort((a, b) => a - b)
check("…every stored running balance matches the statement, including the closing one", stored.length === expected.length && stored.every((b, i) => Math.abs(b - expected[i]) < 0.01) && stored.some((b) => Math.abs(b - g.closing_balance) < 0.01), { n: stored.length })
check("…upload record completed", sql(`select processing_status from statement_uploads where user_id='${A}' and bank_account_id='${ACCT.sbi}'`) === "completed")

// Aggregates refreshed for this user straight after the upload
check("…monthly aggregates refreshed for user A", Number(sql(`select count(*) from monthly_summaries where user_id='${A}'`)) > 0)
check("…tax aggregates refreshed for user A", Number(sql(`select count(*) from tax_summaries where user_id='${A}'`)) > 0)
check("…net-worth snapshot written for user A", Number(sql(`select count(*) from net_worth_snapshots where user_id='${A}'`)) === 1)
const snapTotal = Number(sql(`select total_balance from net_worth_snapshots where user_id='${A}'`))
const snapBanks = JSON.parse(sql(`select bank_balances from net_worth_snapshots where user_id='${A}'`) || "[]")
check("…net worth equals the statement's closing balance (last of several same-day rows)", Math.abs(snapTotal - g.closing_balance) < 0.01 && snapBanks.length === 1, { snapTotal, closing: g.closing_balance, accounts: snapBanks.length })
const dash = await fetch(`${BASE}/api/dashboard`, { headers: { authorization: `Bearer ${tA}` } }).then((r) => r.json()).catch(() => ({}))
check("…dashboard lists one account per bank account, with the closing balance", dash.perBankBalances?.length === 1 && Math.abs(dash.perBankBalances[0].balance - g.closing_balance) < 0.01, { accounts: dash.perBankBalances?.length, balance: dash.perBankBalances?.[0]?.balance })
const aggCredits = sql(`select round(sum(total_amount)::numeric, 2) from monthly_summaries where user_id='${A}' and type='credit'`)
const gtCredits = g.transactions.reduce((s, t) => s + t.credit, 0).toFixed(2)
check("…aggregated credits equal the statement's credits", aggCredits === gtCredits, { aggCredits, gtCredits })
check("…no aggregates were written for user B", Number(sql(`select count(*) from monthly_summaries where user_id='${B}'`)) === 0)
check("…tax aggregates use the short financial-year form the readers expect (e.g. 2024-25)", sql(`select string_agg(distinct fy, ',') from tax_summaries where user_id='${A}'`).split(",").every((fy) => /^\d{4}-\d{2}$/.test(fy)), sql(`select string_agg(distinct fy, ',') from tax_summaries where user_id='${A}'`))

// Uploaded ledgers reach the filing engine: a draft for that year uses the
// bank-derived salary (no Form 16 or AIS has been uploaded).
const salaryRow = sql(`select fy || '|' || round(sum(total_amount)::numeric, 2) from tax_summaries where user_id='${A}' and category='salary' and type='credit' group by fy order by sum(total_amount) desc limit 1`)
if (salaryRow) {
  const [shortFy, bankSalary] = salaryRow.split("|")
  const longFy = `${shortFy.slice(0, 4)}-${Number(shortFy.slice(0, 4)) + 1}`
  const draftRes = await fetch(`${BASE}/api/tax/filing`, { method: "POST", headers: { authorization: `Bearer ${tA}`, "content-type": "application/json" }, body: JSON.stringify({ fy: longFy }) })
  const usedSalary = sql(`select round((computation_input->>'salaryIncome')::numeric, 2) from tax_filings where user_id='${A}' and financial_year='${longFy}'`)
  check(`filing draft for FY ${longFy} uses the uploaded statements' salary credits (₹${bankSalary})`, draftRes.status === 200 && usedSalary === bankSalary, { status: draftRes.status, usedSalary, bankSalary })
} else {
  console.log("SKIP  filing draft from bank data (no salary credits in the uploaded statement)")
}

const cron = await fetch(`${BASE}/api/jobs/refresh-aggregates`, { method: "POST" })
check("all-user refresh endpoint without CRON_SECRET → refused (503) in production", cron.status === 503, cron.status)

// 3. Same file again → recognised as a duplicate, nothing re-inserted
const again = await upload(tA, e1("SBI", "001"), ACCT.sbi)
check("same file again → duplicate, no new rows", again.status === 200 && again.body?.duplicate === true && again.body?.transactionsAdded === 0 && Number(sql(`select count(*) from transactions where bank_account_id='${ACCT.sbi}'`)) === sbiRows, again.body)

// 4. Encrypted statement, uploaded into the SBI account
const tmp = fs.mkdtempSync(path.join(scratch, "e2e-"))
const locked = path.join(tmp, "statement.pdf")
execFileSync("qpdf", ["--encrypt", "01011990", "01011990", "256", "--", e1("SBI", "002"), locked])
const noPw = await upload(tA, locked, ACCT.sbi)
check("encrypted, no password → 422 password_required", noPw.status === 422 && noPw.body?.error === "password_required", noPw.body)
check("…with the bank-specific hint (bank from the account)", noPw.body?.detectedBankId === "sbi" && /Date of Birth/.test(noPw.body?.passwordHint ?? ""), noPw.body)
const wrongPw = await upload(tA, locked, ACCT.sbi, { password: "12345678" })
check("encrypted, wrong password → 422 password_required", wrongPw.status === 422 && wrongPw.body?.error === "password_required", wrongPw.body)
const withPw = await upload(tA, locked, ACCT.sbi, { password: "01011990" })
const sbi2Rows = gt("SBI", "002").transactions.length
check(`encrypted, right password → 200, ${sbi2Rows} rows (retry after the failed attempts works)`, withPw.status === 200 && withPw.body?.transactionsAdded === sbi2Rows && withPw.body?.metadata?.wasEncrypted === true, withPw.body)

// 5. Second bank, different layout
const hdfc = await upload(tA, e1("HDFC", "002"), ACCT.hdfc)
check("HDFC_002 → 200, all rows, deterministic", hdfc.status === 200 && hdfc.body?.transactionsAdded === gt("HDFC", "002").transactions.length && hdfc.body?.metadata?.engine === "deterministic", hdfc.body)

// 6. A statement whose own ledger does not reconcile (external dataset); the LLM tier is unavailable here
const extPdf = path.join(repo, "eval/corpus/external/agami/raw/train/India_Bank_Statement_Digital_Type1/00001.pdf")
if (!fs.existsSync(extPdf)) console.log("SKIP  non-reconciling statement (fetch the external corpus to include it)")
const ext = fs.existsSync(extPdf) ? await upload(tA, extPdf, ACCT.other) : null
if (ext) check("non-reconciling statement → stored with a continuity warning listing breaks", ext.status === 200 && ext.body?.transactionsAdded > 0 && typeof ext.body?.continuityWarning === "string" && Array.isArray(ext.body?.continuityErrors) && ext.body.continuityErrors.length > 0, { status: ext.status, added: ext.body?.transactionsAdded, warn: ext.body?.continuityWarning, errors: ext.body?.continuityErrors?.length })

// 7. A PDF with no transaction table, LLM unavailable → rejected, upload marked failed
const blank = path.join(tmp, "letter.pdf")
execFileSync("python3", ["-I", "-c", `from reportlab.pdfgen import canvas; c=canvas.Canvas(${JSON.stringify(blank)}); c.drawString(72,800,"Dear customer, thank you for banking with us."); c.save()`])
const none = await upload(tA, blank, ACCT.hdfc)
check("PDF without a table and no LLM → 422, nothing stored", none.status === 422, none)

// 8. A scanned statement: OCR → deterministic tier
const scan = scanPdf
const t0 = Date.now()
if (scan && fs.existsSync(scan)) {
  const scanned = await upload(tA, scan, ACCT.other)
  check(`scanned statement → OCR'd and stored (${((Date.now() - t0) / 1000).toFixed(1)} s)`, scanned.status === 200 && scanned.body?.metadata?.ocr === true && scanned.body?.transactionsAdded > 100, { status: scanned.status, added: scanned.body?.transactionsAdded, ocr: scanned.body?.metadata?.ocr, err: scanned.body?.error })
} else {
  console.log("SKIP  scanned statement (fetch the external corpus with --scanned to include it)")
}

// Spending clusters: Python when available, otherwise the rule-based fallback
const clusterRes = await fetch(`${BASE}/api/analytics/run-clustering`, { method: "POST", headers: { authorization: `Bearer ${tA}` } })
const clusterBody = await clusterRes.json().catch(() => null)
const clustered = Number(sql(`select count(*) from transactions where user_id='${A}' and size_cluster is not null`))
const totalA = Number(sql(`select count(*) from transactions where user_id='${A}'`))
check(`clustering → 200 and every one of user A's ${totalA} rows gets a cluster (${clusterBody?.result?.algorithm})`, clusterRes.status === 200 && clustered === totalA, { status: clusterRes.status, clustered, totalA, err: clusterBody?.error })
const run = sql(`select algorithm || '|' || coalesce(silhouette_score::text, 'null') from cluster_runs where user_id='${A}' order by run_at desc limit 1`)
check("…the run records the algorithm that actually ran, with no invented score for the fallback", !!run && (!run.startsWith("rule-based") || run.endsWith("|null")), run)

// 9. Isolation between users
const bView = await fetch(`${BASE}/api/transactions?limit=100`, { headers: { authorization: `Bearer ${tB}` } }).then((r) => r.json())
check("user B sees none of user A's transactions", Array.isArray(bView.transactions) && bView.transactions.length === 0, bView)
const aView = await fetch(`${BASE}/api/transactions?limit=100&bankId=${ACCT.sbi}`, { headers: { authorization: `Bearer ${tA}` } }).then((r) => r.json())
check("user A sees their own transactions through the API", Array.isArray(aView.transactions) && aView.transactions.length > 0, { n: aView.transactions?.length })
const intoA = await upload(tB, e1("ICICI", "001"), ACCT.sbi)
check("user B cannot upload into user A's account → 404", intoA.status === 404, intoA)
check("…and nothing was written for user B", Number(sql(`select count(*) from transactions where user_id='${B}'`)) === 0)
const rlsLeak = execFileSync("psql", ["postgres://finflow_app_login:apppass@127.0.0.1:55432/finflow", "-At", "-c", `begin; select set_config('app.current_user_id', '${B}', true); select count(*) from transactions; commit;`], { encoding: "utf8" }).trim().split("\n").filter((l) => /^\d+$/.test(l)).pop()
check("database RLS: user B's scope sees 0 rows directly in Postgres", rlsLeak === "0", rlsLeak)

// 10. Size limits (user B, to stay inside user A's upload rate limit)
const big = path.join(tmp, "big.pdf")
fs.writeFileSync(big, Buffer.concat([fs.readFileSync(e1("SBI", "003")), Buffer.alloc(11 * 1024 * 1024)]))
const bigUp = await upload(tB, big, ACCT.bIcici)
check("upload over 10 MB → 413 File too large", bigUp.status === 413 && /too large/i.test(bigUp.body?.error ?? ""), bigUp)
const bigParse = await upload(tB, big, null, {}, "/api/parse-statement")
check("/api/parse-statement over 10 MB → 413", bigParse.status === 413, bigParse)

fs.rmSync(tmp, { recursive: true, force: true })
console.log(failures ? `\n${failures} failed` : "\nAll end-to-end checks passed")
process.exitCode = failures ? 1 : 0
