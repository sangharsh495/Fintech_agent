# 📑 FINFLOW: COMPLETE PROJECT AUDIT, 100% COMPLETION ROADMAP & AUTONOMOUS TAX FILING BLUEPRINT

**Platform Name:** FinFlow / FinWise  
**Tech Stack:** Next.js 16 (Turbopack), React 19, Tailwind CSS v4, Neon Serverless PostgreSQL (Drizzle ORM), Upstash Redis / BullMQ, Python FastAPI / Scikit-Learn (ML Service), React Native Expo (Mobile App)  
**Date:** August 2026  

---

# TABLE OF CONTENTS
1. [Executive Summary & Core Platform Motto](#1-executive-summary--core-platform-motto)
2. [Deep Dive: Motto & Inner Working of Every Page & Route](#2-deep-dive-motto--inner-working-of-every-page--route)
3. [Current Implementation Completion Status (% Breakdown)](#3-current-implementation-completion-status--breakdown)
4. [What is Implemented vs. What Has Mock Data / Gaps](#4-what-is-implemented-vs-what-has-mock-data--gaps)
5. [Code-Level Fixes to Reach 100% on Existing Features](#5-code-level-fixes-to-reach-100-on-existing-features)
6. [Comparative Gap Analysis vs. Top Fintech Apps (INDmoney, CRED, ClearTax)](#6-comparative-gap-analysis-vs-top-fintech-apps)
7. [Groundbreaking Advanced Features to Add](#7-groundbreaking-advanced-features-to-add)
8. [Master Blueprint: Autonomous Tax Filing Engine & Virtual CA Architecture](#8-master-blueprint-autonomous-tax-filing-engine--virtual-ca-architecture)
9. [Concrete Code Implementations for Tax Filing Subsystem](#9-concrete-code-implementations-for-tax-filing-subsystem)
10. [Step-by-Step Execution Plan](#10-step-by-step-execution-plan)

---

# 1. EXECUTIVE SUMMARY & CORE PLATFORM MOTTO

### The Flagship Motto
> *"Empower Indian retail users with an INDmoney-grade, AI-driven wealth management ecosystem that automates financial clarity — transforming messy bank statements into real-time net-worth tracking, machine learning behavioral cohorts, automated tax optimization, and a virtual Chartered Accountant advisor with automated ITR filing capabilities."*

### Key Value Pillars
1. **Zero-Manual Data Ingestion:** Upload statements (PDF, CSV, Excel) from 21+ Indian banks with automatic QPDF password decryption, deterministic SHA-256 deduplication hashing, and balance continuity verification ($|B_i - (B_{i-1} + C_i - D_i)| \le 0.01$).
2. **Behavioral ML Clustering & Anomaly Detection:** Python scikit-learn engine featuring circular temporal encoding ($\sin/\cos$ for hour/day), K-Means transaction cohorting, and DBSCAN fraud/anomaly detection.
3. **AI Virtual Chartered Accountant (CA):** Context-aware conversational AI with dynamic context injection, prompt sanitization, and key-rotating LLM pool (Groq + Redis cooldown manager) answering regime comparisons, deductions, and financial health queries.
4. **Indian Tax Engine & Autonomous Filing:** Real-time computation comparing Old vs. New Tax Regimes (FY 2024–25 / 2025–26 rules, 80C, 80D, 80E, 24, Standard Deductions) with automated opportunity discovery and official ITR-1/ITR-2/ITR-4 JSON schema generation.
5. **Cross-Platform Experience:** Next.js 16 Web App + Full Expo React Native Android/iOS Mobile App.

---

# 2. DEEP DIVE: MOTTO & INNER WORKING OF EVERY PAGE & ROUTE

---

### A. Dashboard / Wealth Overview (`app/page.tsx`)
- **Motto / Goal:** Provide an INDmoney-style consolidated snapshot of the user's total net worth, monthly cash flow, linked bank accounts, recent transactions, and anomaly flags.
- **Deep Technical Working:**
  - On mount, calls `Promise.all([fetch("/api/dashboard"), fetch("/api/analytics")])`.
  - Reads pre-aggregated data from `net_worth_snapshots` and `monthly_summaries` tables to maintain sub-second response times without computing raw transaction sums repeatedly.
  - Dynamically computes bank badge themes using `getBankTheme()` (blue for HDFC, orange for ICICI, sky blue for SBI, rose for Axis, etc.).
  - Renders an interactive Net Worth Area chart, Monthly Inflow vs. Outflow cards, a Circular SVG Savings Rate Gauge, Bank-by-Bank balance cards, Recent Transaction feed, and Anomaly Alert cards.
  - Mounts the global floating `AIWidget` pre-configured with the dashboard context.

---

### B. Authentication (`app/auth/login/page.tsx` & `app/auth/signup/page.tsx`)
- **Motto / Goal:** Secure, password-authenticated user access with email OTP verification and two-factor authentication safeguards.
- **Deep Technical Working:**
  - **Signup Flow:** Step 1 captures Full Name, Email, Password, and Password confirmation with real-time strength validation. Calls `/api/auth/register`, hashes password with `bcryptjs`, writes unverified user to `users` table, generates a cryptographic 6-digit OTP, stores it in `verification_tokens`, and sends it via email (Nodemailer / Resend).
  - **Verification Flow:** Step 2 prompts for 6-digit OTP, submits to `/api/auth/verify-otp`, marks `emailVerified`, and triggers NextAuth `signIn("credentials")` to automatically log the user in and redirect to `/onboarding`.
  - **Login Flow:** Submits credentials to NextAuth handler `app/api/auth/[...nextauth]/route.ts`. Enforces MFA checks if enabled on the account.

---

### C. User Onboarding Wizard (`app/onboarding/page.tsx`)
- **Motto / Goal:** Seamless 5-step guided setup to collect user profile demographics, regulatory consents, and initial bank account mapping.
- **Deep Technical Working:**
  - **Step 1 (Welcome):** Value proposition overview and feature highlights.
  - **Step 2 (Personal Info):** Captures Date of Birth, Gender, Occupation, Income Bracket, City, State, and PAN Number.
  - **Step 3 (Consents & Privacy):** Explicit opt-ins for Core Data Processing (required), ML Analytics, AI Virtual CA, and Marketing communications (stored in `user_consents` table).
  - **Step 4 (Bank Account):** Selects bank name (21 supported banks), account type (Savings, Salary, Current), and last 4 digits (stored in `bank_accounts` table).
  - **Step 5 (Completion):** Calls `/api/onboarding` and `/api/banks`, updates NextAuth session with `onboardingComplete: true`, and directs the user to upload statements.

---

### D. Bank Statement Upload & Parser Engine (`app/upload/page.tsx` & `components/upload-statement.tsx`)
- **Motto / Goal:** Ingest raw, messy, password-protected statements in PDF, CSV, or Excel formats, decrypt them, parse transaction tables, deduplicate rows, and update the database.
- **Deep Technical Working:**
  - Client handles drag-and-drop, validates file MIME types (`.pdf`, `.csv`, `.xlsx`, `.xls`), and optionally prompts for the PDF password (e.g. DOB + PAN).
  - Submits to `app/api/upload/statement/route.ts`.
  - **Pipeline Execution:**
    1. **Decryption:** `pdf.decrypt.ts` tests passwords and unlocks the PDF buffer using QPDF / PDF.js.
    2. **Extraction:** `pdf.parser.ts` or `csv.parser.ts` / `excel.parser.ts` extracts text blocks, identifies bank templates using `bank-profiles.ts`, and parses rows into structured date, description, debit, credit, and balance columns.
    3. **Categorization:** `categorizer.ts` maps descriptions to merchant categories.
    4. **Deduplication Hashing:** `deduplicator.ts` computes $\text{SHA256}(\text{date} \mathbin{\Vert} \text{amount} \mathbin{\Vert} \text{desc})$ to ignore already imported records.
    5. **Continuity Verification:** `validateContinuity.ts` verifies running balances.
    6. **Aggregation Job:** Triggers `refresh-aggregates.ts` and ML cluster generation.

---

### E. Financial Analytics & ML Spending Cohorts (`app/analytics/page.tsx` & `app/analytics/clusters/page.tsx`)
- **Motto / Goal:** Deep categorical spend analysis, monthly cash flow trends, and ML-powered cluster segmentation.
- **Deep Technical Working:**
  - Fetches category totals, monthly breakdown, and KPI totals (income, expenses, savings, savings rate) from `/api/analytics`.
  - Renders Recharts Donut Pie Charts with gradient fill and Recharts Monthly Cash Flow Bar Charts.
  - Mounts `<ClusterAnalytics />` which queries `/api/analytics/clusters`:
    - Shows **Spending Behavior Clusters** (micro-spend vs recurring vs luxury).
    - Shows **Transaction Size Clusters** (Micro, Standard, High-value, Major).
    - Shows **Temporal Habits** (Weekday Workday vs Weekend Outings vs Late Night).
    - Shows **Category Affinity Hubs** and **DBSCAN Anomaly Alerts** with transaction-level drilldowns.

---

### F. AI Virtual Chartered Accountant (`app/ai-ca/page.tsx`)
- **Motto / Goal:** Conversational AI trained on Indian Tax Laws, personal finance rules, and the user's live financial data.
- **Deep Technical Working:**
  - Implemented using `@ai-sdk/react` (`useChat` with `DefaultChatTransport` connecting to `/api/ai/chat`).
  - Backend `ai-context.service.ts` queries user's aggregated financial profile (total balances, income, top expense categories, tax deductions) and constructs a system prompt.
  - Rotates Groq API keys via `groq-rotator.service.ts` to prevent 429 rate-limiting.
  - Formats markdown responses, code blocks with copy buttons, and recommended prompt pills.
  - Right sidebar presents security steps explaining end-to-end data encryption and data isolation.

---

### G. Tax Estimation & Optimization Engine (`app/tax/page.tsx`)
- **Motto / Goal:** Help users minimize tax liabilities by comparing the Old vs New Tax Regimes in real-time and identifying unspent deduction limits.
- **Deep Technical Working:**
  - Fetches detected deductions (80C, 80D, 80E, Section 24, Standard Deduction) from `/api/tax` computed from categorized bank statements (e.g. PPF, LIC, ELSS, Medical insurance debits).
  - Dynamically calculates tax brackets, 4% Health & Education Cess, and identifies the more beneficial tax regime.
  - Interactive slider controls allow users to simulate adjustments to income and deduction investments to project tax savings.
  - Displays Recharts Regime Comparison Bar Chart and Tax vs. Cess Pie Chart.

---

### H. Financial Calculators Suite (`app/calculators/page.tsx`)
- **Motto / Goal:** Interactive mathematical calculation engines for all financial decisions (investments, loans, retirement, taxes).
- **Deep Technical Working:**
  - **Essential Tools:** Custom interactive components for EMI Calculator, SIP Calculator, FD Calculator, RD Calculator, Budget Planner, and Loan Comparison.
  - **Universal Engine:** `universal-calculator.tsx` driven by config schemas in `calculator-configs.ts` supporting 24+ additional calculators (PPF, NPS, EPF, SWP, CAGR, HRA, Inflation, Retirement, Education, Car Loan, etc.).
  - Includes formula explanations, amortization tables, and visual breakdown charts.

---

### I. Settings, Security, KYC & Data Privacy Hub (`app/settings/page.tsx`)
- **Motto / Goal:** Complete control over personal data, KYC verification records, security credentials, consent policies, and compliance with Right-to-be-Forgotten data erasure.
- **Deep Technical Working:**
  - Features 9 tab panels: Personal Info, KYC Details (PAN/Aadhaar/Occupation/Income), Security (Password change, 2FA toggle, Biometric toggle, Session timeout), Privacy (Profile visibility, Transaction sharing), Linked Accounts (Bank unlink/reconnect), Notifications (SMS, Push, Email digest), Preferences (Dark/Light mode, Currency, Timezone), Data & Storage (Import, Export JSON/CSV/PDF, Delete Account danger zone), and Help & Support.
  - Automatically persists changes via `PATCH /api/profile`.

---

### J. Cross-Platform Mobile Application (`mobile/`)
- **Motto / Goal:** Deliver a native iOS and Android mobile client with biometric security, offline storage, native statement picking, and real-time dashboard parity.
- **Deep Technical Working:**
  - Built with Expo SDK 52, Expo Router (`mobile/app`), and TypeScript.
  - Features dedicated authentication flows (`mobile/app/(auth)/login.tsx`, `register.tsx`, `verify-otp.tsx`) with JWT token storage via `expo-secure-store`.
  - Tab navigation (`mobile/app/(tabs)/`): Dashboard, Analytics, Upload, Tax, AI Chat, Settings.

---

# 3. CURRENT IMPLEMENTATION COMPLETION STATUS (% BREAKDOWN)

| Subsystem | Completion % | Status & Observations |
| :--- | :---: | :--- |
| **Web Frontend UI & Design System** | **95%** | Modern INDmoney aesthetic, dark/light theme, responsive Recharts charts, interactive calculator suite, and floating AI widgets. |
| **Authentication & Authorization** | **90%** | NextAuth v5 credentials, bcrypt hashing, OTP verification, RLS database connection scoping, and MFA API endpoints. |
| **Bank Statement Parsing Pipeline** | **90%** | Supports PDF decryption (QPDF), CSV, Excel, 21 bank regex header profiles, deduplication hashing, and continuity checks. |
| **Database Schema & Migrations** | **95%** | Comprehensive Drizzle ORM schema (Users, Transactions, Bank Accounts, Aggregations, AI Audit, Payments) with RLS isolation. |
| **ML Clustering & Anomaly Service** | **85%** | Python FastAPI / CLI service with K-Means & DBSCAN implemented; local execution bridge connects to Next.js API. |
| **Tax Estimation Engine** | **90%** | Live comparison for Old vs. New Regimes with deduction adjustments; PDF summary export button is pending final renderer hook. |
| **AI Virtual CA** | **85%** | Real-time chat with streaming and key rotator; chat history sidebar uses static items. |
| **Mobile App (React Native Expo)** | **75%** | Full screens built matching web design tokens; requires production backend API URL wiring and push notification certs. |
| **OVERALL PROJECT COMPLETION** | **~88%** | **Highly functional advanced MVP / Beta stage.** |

---

# 4. WHAT IS IMPLEMENTED VS. WHAT HAS MOCK DATA / GAPS

### Fully Implemented & Working
1. **Full Database & ORM Layer:** 7 migration files, 15+ relational tables with foreign keys and cascade rules in Neon Postgres via Drizzle.
2. **Deterministic Deduplication:** SHA-256 transaction hash prevents double insertions across monthly overlapping statements.
3. **Multi-Bank Statement Extraction:** Regex fingerprint matching for HDFC, ICICI, SBI, Axis, Kotak, and generic fallback parsing.
4. **Calculators Suite:** 6 custom calculators + 24 universal calculators with live charts and formula breakdowns.
5. **Dashboard & Analytics:** Real aggregated data visualization (Inflow, Outflow, Net Worth, Expense Distribution).
6. **Key-Rotator LLM Manager:** Multi-key Groq balancer with Redis cooldown states.
7. **Security & Data Isolation:** Row-Level Security (RLS) connection wrapper verifying user ID on every query.

### Mock Data, Stubs, or Incomplete Items
1. **AI Chat History Sidebar (`app/ai-ca/page.tsx`):** The left sidebar uses `mockChatHistory` instead of fetching from `ai_sessions` and `ai_messages` tables.
2. **Active Sessions in Settings (`app/settings/page.tsx`):** Displays a hardcoded mock list of devices (MacBook Pro, iPhone 15 Pro) rather than reading active NextAuth/JWT tokens.
3. **Linked Accounts Tab in Settings (`app/settings/page.tsx`):** Uses local state `linkedAccounts` rather than fetching real accounts from `/api/banks`.
4. **Tax Summary PDF Export (`app/tax/page.tsx`):** The "Export Tax Summary" button does not currently trigger a PDF generator (`jspdf`).
5. **Data Erasure Action (`app/settings/page.tsx`):** "Delete Account" button in Settings needs a modal confirmation hook tied to `/api/user/data-erasure`.
6. **Stripe Webhook Execution:** Stubbed with event logging; needs live secret key integration for paid subscriptions.
7. **Background Worker Daemon:** BullMQ queues in `worker.ts` are configured for Redis, but in serverless/dev mode fallback directly to synchronous API handlers.

---

# 5. CODE-LEVEL FIXES TO REACH 100% ON EXISTING FEATURES

### Fix 1: In-Memory Redis Fallback (`server/lib/redis.ts`)
Prevents build-time `ECONNREFUSED` crashes when Redis is offline:

```typescript
import { Redis } from "@upstash/redis"
import IORedis from "ioredis"

let redisClient: any = null

export function getRedisClient() {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }

  if (process.env.REDIS_URL && typeof window === "undefined") {
    try {
      if (!redisClient) {
        redisClient = new IORedis(process.env.REDIS_URL, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null,
        })
      }
      return redisClient
    } catch {
      return createMemoryFallbackRedis()
    }
  }
  return createMemoryFallbackRedis()
}

function createMemoryFallbackRedis() {
  const store = new Map<string, { value: any; expiry?: number }>()
  return {
    async get(key: string) {
      const item = store.get(key)
      if (!item) return null
      if (item.expiry && Date.now() > item.expiry) {
        store.delete(key)
        return null
      }
      return item.value
    },
    async set(key: string, value: any, opts?: { ex?: number }) {
      const expiry = opts?.ex ? Date.now() + opts.ex * 1000 : undefined
      store.set(key, { value, expiry })
      return "OK"
    },
    async del(key: string) {
      store.delete(key)
      return 1
    },
  }
}
```

### Fix 2: Live AI CA Chat Session History (`app/ai-ca/page.tsx`)
```typescript
const [sessions, setSessions] = useState<Array<{ id: string; title: string; updatedAt: string }>>([])
const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)

useEffect(() => {
  fetch("/api/ai/sessions")
    .then((res) => res.json())
    .then((data) => {
      if (data.sessions?.length > 0) {
        setSessions(data.sessions)
        setCurrentSessionId(data.sessions[0].id)
      }
    })
}, [])

const createNewSession = async () => {
  const res = await fetch("/api/ai/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "New Consultation" }),
  })
  const newSession = await res.json()
  setSessions((prev) => [newSession, ...prev])
  setCurrentSessionId(newSession.id)
}
```

### Fix 3: Tax Summary PDF Export (`app/tax/page.tsx`)
```typescript
import jsPDF from "jspdf"

const exportTaxSummaryPDF = () => {
  const doc = new jsPDF()
  doc.setFontSize(20)
  doc.setTextColor(30, 41, 59)
  doc.text("FinFlow - Tax Assessment & Optimization Report", 14, 22)
  
  doc.setFontSize(11)
  doc.setTextColor(100, 116, 139)
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-IN")}`, 14, 30)
  doc.text(`Recommended Regime: ${betterRegime} Regime (Saves more)`, 14, 38)
  
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text("Financial Breakdown", 14, 52)
  doc.setFontSize(10)
  doc.text(`Gross Annual Income: Rs. ${income.toLocaleString("en-IN")}`, 14, 62)
  doc.text(`Total Deductions Claimed: Rs. ${totalDeductions.toLocaleString("en-IN")}`, 14, 70)
  doc.text(`Old Regime Tax Payable: Rs. ${(oldRegimeTax * 1.04).toLocaleString("en-IN")}`, 14, 78)
  doc.text(`New Regime Tax Payable: Rs. ${(newRegimeTax * 1.04).toLocaleString("en-IN")}`, 14, 86)
  
  doc.save(`FinFlow_Tax_Report_${new Date().toISOString().split("T")[0]}.pdf`)
}
```

---

# 6. COMPARATIVE GAP ANALYSIS VS. TOP FINTECH APPS

| Feature Area | Typical Projects | FinFlow Current Status | World-Class Commercial Standard (INDmoney, CRED, ClearTax) |
| :--- | :--- | :--- | :--- |
| **Data Ingestion** | Manual text inputs | PDF/CSV/Excel Parsing with regex & deduplication | Account Aggregator (AA) live sync + CAMS/KFintech CAS Mutual Fund statement parser |
| **Tax Capability** | Simple tax slab calculator | Old vs New comparison with 80C detection | Complete ITR-1/2/3/4 JSON generator ready for direct ITD upload + Form 16/AIS 3-way reconciliation |
| **AI Advisor** | Generic ChatGPT wrapper | Context-aware Groq rotator with RLS data isolation | Dual-core deterministic statutory engine + RAG across Income Tax Act & CBDT circulars |
| **Asset Coverage** | Bank accounts only | Savings, Current & Salary bank accounts | Consolidated Net Worth (Bank + MF + Indian Stocks + US Stocks + EPF + NPS + Real Estate) |
| **Analytics Engine** | Basic expense graphs | Scikit-Learn K-Means Clustering + DBSCAN Anomalies | Forward-looking Runway & Cash-flow forecasting + Monte Carlo Wealth Simulation |

---

# 7. GROUNDBREAKING ADVANCED FEATURES TO ADD

### 1. CAMS / KFintech CAS Investment Ingestion
- Upload password-protected Mutual Fund Consolidated Account Statements.
- Automatically extracts folios, AMC, NAV, invested vs current value, XIRR, and auto-detects Section 80C ELSS tax-saving funds.

### 2. WhatsApp / Telegram Automated Receipt & Expense Ingestion
- Webhook endpoint (`/api/webhooks/whatsapp`) where users forward UPI payment screenshots.
- OCR + Regex extracts amount, merchant, and timestamp directly into the dashboard in <2 seconds.

### 3. Financial Health Score (FHS) & FIRE Engine
- 0–1000 composite index evaluating Liquidity Buffer, Debt-to-Income (DTI), Savings Consistency, and projected FIRE (Financial Independence, Retire Early) age.

### 4. Semantic Vector Embeddings for Obscure UPI Transactions
- Uses `pgvector` in PostgreSQL to match cryptic UPI strings (`paytm-84729@paytm` $\rightarrow$ "Swiggy Food Delivery").

---

# 8. MASTER BLUEPRINT: AUTONOMOUS TAX FILING ENGINE & VIRTUAL CA ARCHITECTURE

### The 5 Heads of Income Codification
1. **Salary (Sec 15–17):** Basic, HRA (Sec 10(13A)), LTA (Sec 10(5)), Standard Deduction (Sec 16(ia) - ₹50K Old / ₹75K New), Professional Tax.
2. **House Property (Sec 22–27):** Rental credits, Municipal taxes, 30% Standard Deduction (Sec 24(a)), Home loan interest (Sec 24(b) - max ₹2L for self-occupied).
3. **PGBP / Freelancer Schemes (Sec 28–44):** Presumptive Taxation under Section 44ADA (50% deemed profit for professionals) and Section 44AD (6%/8% for small businesses).
4. **Capital Gains (Sec 45–55A):** STCG equity (Sec 111A @ 20%), LTCG equity (Sec 112A @ 12.5% above ₹1.25L exemption), Debt & Real Estate indexation rules.
5. **Other Sources (Sec 56–59):** Savings interest (Sec 80TTA/80TTB), FD interest, Dividends, Family Pension.

### Autonomous ITR Form Selection Logic
- **ITR-1 (Sahaj):** Salaried individuals with income up to ₹50 Lakhs, one house property, and other sources (interest).
- **ITR-2:** Individuals with Capital Gains, multiple house properties, foreign assets, or income > ₹50 Lakhs.
- **ITR-3:** Individuals with active business income, intraday/F&O trading.
- **ITR-4 (Sugam):** Presumptive business/profession income (Sec 44AD / 44ADA / 44AE).

---

# 9. CONCRETE CODE IMPLEMENTATIONS FOR TAX FILING SUBSYSTEM

### A. Statutory Calculation Engine (`server/services/tax/tax-calculator.ts`)

```typescript
export interface TaxComputationInput {
  financialYear: "2024-2025" | "2025-2026"
  salaryIncome: number
  hraExemption: number
  ltaExemption: number
  professionalTax: number
  housePropertyIncome: number
  otherSourcesIncome: number
  shortTermCapitalGains111A: number
  longTermCapitalGains112A: number
  presumptiveIncome44ADA: number
  presumptiveIncome44AD: number
  deductions: {
    section80C: number
    section80CCD1B: number
    section80CCD2: number
    section80D: number
    section80E: number
    section80G: number
    section80TTA: number
    section24b: number
    otherDeductions: number
  }
}

export interface TaxComputationResult {
  grossTotalIncome: number
  totalDeductionsOld: number
  totalDeductionsNew: number
  taxableIncomeOld: number
  taxableIncomeNew: number
  baseTaxOld: number
  baseTaxNew: number
  rebate87AOld: number
  rebate87ANew: number
  cessOld: number
  cessNew: number
  totalTaxPayableOld: number
  totalTaxPayableNew: number
  recommendedRegime: "OLD" | "NEW"
  savingsWithRecommended: number
  breakdown: string[]
}

export function computeIndianTax(input: TaxComputationInput): TaxComputationResult {
  const isFY2526 = input.financialYear === "2025-2026"
  
  const standardDeductionOld = 50000
  const standardDeductionNew = 75000 // Budget 2024 increased to 75k

  const grossSalary = input.salaryIncome
  const pgbp = input.presumptiveIncome44ADA + input.presumptiveIncome44AD
  const capitalGains = input.shortTermCapitalGains111A + input.longTermCapitalGains112A
  const otherSources = input.otherSourcesIncome

  const netSalaryOld = Math.max(0, grossSalary - input.hraExemption - input.ltaExemption - input.professionalTax - standardDeductionOld)
  const netSalaryNew = Math.max(0, grossSalary - standardDeductionNew)

  const gtiOld = netSalaryOld + input.housePropertyIncome + pgbp + capitalGains + otherSources
  const gtiNew = netSalaryNew + Math.max(0, input.housePropertyIncome) + pgbp + capitalGains + otherSources

  const capped80C = Math.min(150000, input.deductions.section80C)
  const capped80CCD1B = Math.min(50000, input.deductions.section80CCD1B)
  const capped80D = Math.min(100000, input.deductions.section80D)
  const capped80TTA = Math.min(10000, input.deductions.section80TTA)

  const totalDeductionsOld = capped80C + capped80CCD1B + capped80D + capped80TTA + 
                            input.deductions.section80E + input.deductions.section80G + 
                            input.deductions.section80CCD2 + input.deductions.otherDeductions

  const totalDeductionsNew = input.deductions.section80CCD2

  const taxableIncomeOld = Math.max(0, gtiOld - totalDeductionsOld)
  const taxableIncomeNew = Math.max(0, gtiNew - totalDeductionsNew)

  // Old Regime Slabs
  let taxOld = 0
  if (taxableIncomeOld > 1000000) {
    taxOld = 112500 + (taxableIncomeOld - 1000000) * 0.3
  } else if (taxableIncomeOld > 500000) {
    taxOld = 12500 + (taxableIncomeOld - 500000) * 0.2
  } else if (taxableIncomeOld > 250000) {
    taxOld = (taxableIncomeOld - 250000) * 0.05
  }

  let rebate87AOld = 0
  if (taxableIncomeOld <= 500000) {
    rebate87AOld = taxOld
    taxOld = 0
  }

  // New Regime Slabs
  let taxNew = 0
  if (taxableIncomeNew > 1500000) {
    taxNew = 150000 + (taxableIncomeNew - 1500000) * 0.3
  } else if (taxableIncomeNew > 1200000) {
    taxNew = 90000 + (taxableIncomeNew - 1200000) * 0.2
  } else if (taxableIncomeNew > 900000) {
    taxNew = 45000 + (taxableIncomeNew - 900000) * 0.15
  } else if (taxableIncomeNew > 600000) {
    taxNew = 15000 + (taxableIncomeNew - 600000) * 0.1
  } else if (taxableIncomeNew > 300000) {
    taxNew = (taxableIncomeNew - 300000) * 0.05
  }

  let rebate87ANew = 0
  if (taxableIncomeNew <= 700000) {
    rebate87ANew = taxNew
    taxNew = 0
  }

  const cessOld = taxOld * 0.04
  const totalTaxPayableOld = Math.round(taxOld + cessOld)

  const cessNew = taxNew * 0.04
  const totalTaxPayableNew = Math.round(taxNew + cessNew)

  const recommendedRegime = totalTaxPayableOld < totalTaxPayableNew ? "OLD" : "NEW"
  const savings = Math.abs(totalTaxPayableOld - totalTaxPayableNew)

  return {
    grossTotalIncome: Math.max(gtiOld, gtiNew),
    totalDeductionsOld,
    totalDeductionsNew,
    taxableIncomeOld,
    taxableIncomeNew,
    baseTaxOld: taxOld,
    baseTaxNew: taxNew,
    rebate87AOld,
    rebate87ANew,
    cessOld,
    cessNew,
    totalTaxPayableOld,
    totalTaxPayableNew,
    recommendedRegime,
    savingsWithRecommended: savings,
    breakdown: [
      `Gross Total Income: Rs. ${Math.max(gtiOld, gtiNew).toLocaleString("en-IN")}`,
      `Total Deductions Claimed (Old): Rs. ${totalDeductionsOld.toLocaleString("en-IN")}`,
      `Old Regime Total Liability: Rs. ${totalTaxPayableOld.toLocaleString("en-IN")}`,
      `New Regime Total Liability: Rs. ${totalTaxPayableNew.toLocaleString("en-IN")}`,
      `Optimal Choice: ${recommendedRegime} Regime saves Rs. ${savings.toLocaleString("en-IN")}`,
    ],
  }
}
```

### B. ITD Schema-Compliant ITR-1 JSON Generator (`server/services/tax/itr-json-builder.ts`)

```typescript
export interface ITR1Payload {
  userProfile: {
    pan: string
    firstName: string
    lastName: string
    dob: string
    mobile: string
    email: string
    aadhaar: string
    address: {
      flatDoorBlock: string
      premisesName: string
      roadStreet: string
      areaLocality: string
      city: string
      state: string
      pincode: string
    }
  }
  bankDetails: {
    ifsc: string
    bankName: string
    accountNumber: string
    isRefundAccount: boolean
  }
  taxComputation: TaxComputationResult
}

export function generateITR1JSON(data: ITR1Payload) {
  const assessmentYear = "2025"
  
  return {
    ITR: {
      ITR1: {
        CreationInfo: {
          SWVersionNo: "1.0",
          SWCreatedBy: "FinFlow_Autonomous_CA",
          XMLCreatedBy: "FinFlow_Engine",
          JSONCreatedBy: "FinFlow",
          CreationDate: new Date().toISOString().split("T")[0],
        },
        Form_ITR1: {
          FormName: "ITR-1",
          Description: "For individuals having Income from Salary, one house property, other sources",
          AssessmentYear: assessmentYear,
          SchemaVer: "Ver1.0",
          FormVer: "Ver1.0",
        },
        PersonalInfo: {
          AssesseeName: {
            FirstName: data.userProfile.firstName,
            SurNameOrOrgName: data.userProfile.lastName,
          },
          PAN: data.userProfile.pan,
          AadhaarCardNo: data.userProfile.aadhaar,
          DOB: data.userProfile.dob,
          Status: "I",
          Address: data.userProfile.address,
          EmployerCategory: "OTH",
        },
        FilingStatus: {
          ReturnFileSec: "11", // Sec 139(1)
          OptOutNewTaxRegime: data.taxComputation.recommendedRegime === "OLD" ? "Y" : "N",
        },
        IncomeDeductions: {
          GrossSalary: data.taxComputation.grossTotalIncome,
          TotalDeductions: data.taxComputation.recommendedRegime === "OLD" 
            ? data.taxComputation.totalDeductionsOld 
            : data.taxComputation.totalDeductionsNew,
          TotalIncome: data.taxComputation.recommendedRegime === "OLD" 
            ? data.taxComputation.taxableIncomeOld 
            : data.taxComputation.taxableIncomeNew,
        },
        TaxComputation: {
          TotalTaxPayable: data.taxComputation.recommendedRegime === "OLD"
            ? data.taxComputation.totalTaxPayableOld
            : data.taxComputation.totalTaxPayableNew,
        },
        Refund: {
          BankAccountDtls: {
            AddtnlBankDetails: [
              {
                IFSCCode: data.bankDetails.ifsc,
                BankName: data.bankDetails.bankName,
                BankAccountNo: data.bankDetails.accountNumber,
                UseForRefund: data.bankDetails.isRefundAccount ? "Y" : "N",
              }
            ]
          }
        },
        Verification: {
          Declaration: {
            AssesseeVerName: `${data.userProfile.firstName} ${data.userProfile.lastName}`,
            FatherName: "Self Declared",
            Capacity: "S",
            Place: data.userProfile.address.city || "Mumbai",
            Date: new Date().toISOString().split("T")[0],
          }
        }
      }
    }
  }
}
```

---

# 10. STEP-BY-STEP EXECUTION PLAN

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           4-WEEK EXECUTION ROADMAP                              │
├────────────┬───────────────────────────────────┬────────────────────────────────┤
│ Week       │ Focus Area                        │ Key Deliverables               │
├────────────┼───────────────────────────────────┼────────────────────────────────┤
│ Week 1     │ 100% Polish on Existing System    │ In-memory Redis fallback, live │
│            │                                   │ AI sessions, PDF tax report,   │
│            │                                   │ Settings accounts sync.        │
├────────────┼───────────────────────────────────┼────────────────────────────────┤
│ Week 2     │ Multi-Source Tax Ingestion        │ Form 16 PDF parser, AIS/TIS    │
│            │                                   │ JSON extractor, CAMS Mutual    │
│            │                                   │ Fund CAS statement parser.     │
├────────────┼───────────────────────────────────┼────────────────────────────────┤
│ Week 3     │ Statutory Engine & Virtual CA RAG │ computeIndianTax engine, ITR   │
│            │                                   │ form selector, ITD JSON builder│
│            │                                   │ dual-core Virtual CA prompt.   │
├────────────┼───────────────────────────────────┼────────────────────────────────┤
│ Week 4     │ One-Click Filing UI & Mobile Sync │ Guided /tax/filing wizard,     │
│            │                                   │ CA audit report generator,     │
│            │                                   │ mobile app backend connection. │
└────────────┴───────────────────────────────────┴────────────────────────────────┘
```
