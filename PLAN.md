# FinFlow — Complete Application Architecture Plan

## User's Chosen Configuration
- **Statement Formats**: PDF + Excel + CSV
- **AI Provider**: Groq (install @ai-sdk/groq)
- **Bank Connection**: Manual upload only
- **Auth Verification**: Email OTP (otplib — already installed)

---

## CURRENT STATE SUMMARY
| Area | Status |
|---|---|
| Auth | Mock (localStorage only) |
| Database Schema | Partial (transactions only, no users) |
| Dashboard/Analytics | Hardcoded data |
| AI-CA | Mock responses |
| Tax | Manual input only |
| Server routes | All empty scaffolds |
| ML Service | Working (seed data only, not per-user) |

---

## PHASE 1 — Database & Authentication Foundation
*"The identity and data backbone of everything"*

### 1A. Database Schema Expansion
**File:** `server/db/schema/users.ts` ← NEW

Tables to add:
```
users
  id (uuid, pk)
  email (varchar, unique)
  emailVerified (timestamp)
  name (varchar)
  passwordHash (varchar)
  phone (varchar)
  createdAt, updatedAt

otpVerifications
  id (uuid, pk)
  email (varchar)
  otp (varchar 6)
  expiresAt (timestamp)
  used (boolean)
  createdAt

sessions (handled by NextAuth + Drizzle adapter)
accounts (handled by NextAuth + Drizzle adapter)

userProfiles
  id (uuid, pk)
  userId (uuid, fk → users.id) UNIQUE
  dob (date)
  gender (enum: male/female/other)
  occupation (varchar)
  incomeBracket (enum: <3L / 3-5L / 5-10L / 10-25L / 25L+)
  panNumber (varchar)
  aadhaarLast4 (varchar)
  city (varchar)
  state (varchar)
  onboardingComplete (boolean default false)
  taxRegime (enum: old/new default new)
  createdAt, updatedAt

bankAccounts
  id (uuid, pk)
  userId (uuid, fk → users.id)
  bankName (varchar) — HDFC, ICICI, SBI, Axis, Kotak etc.
  accountNickname (varchar) — user's friendly name
  accountLast4 (varchar) — last 4 digits
  accountType (enum: savings/current/salary)
  isActive (boolean default true)
  currency (varchar default INR)
  createdAt, updatedAt

statementUploads
  id (uuid, pk)
  userId (uuid, fk → users.id)
  bankAccountId (uuid, fk → bankAccounts.id)
  fileName (varchar)
  fileType (enum: pdf/xlsx/csv)
  s3Key (varchar) — path in S3
  fileSize (integer)
  statementMonth (varchar) — "2025-03"
  statementYear (integer)
  processingStatus (enum: pending/processing/completed/failed)
  transactionsExtracted (integer)
  transactionsDuplicate (integer)
  errorMessage (text)
  processedAt (timestamp)
  createdAt
```

**Update:** `server/db/schema/transactions.ts`
- Add `bankAccountId` (uuid, fk → bankAccounts.id) column
- Add `statementUploadId` (uuid, fk → statementUploads.id) column
- Add `rawDescription` (text) — original text before categorization
- Add `hash` (varchar) — SHA256(date+amount+description) for dedup

**File:** `server/db/schema/index.ts` — Export all schemas

### 1B. NextAuth Configuration
**File:** `server/auth/config.ts` ← NEW
- Credentials provider (email + hashed password)
- Session strategy: JWT
- Custom pages: /auth/login, /auth/signup
- Drizzle adapter for users/sessions/accounts tables

**File:** `app/api/auth/[...nextauth]/route.ts` — Update to use real config

### 1C. Auth Service
**File:** `server/services/auth.service.ts` ← NEW
```typescript
Functions:
  hashPassword(password) → bcrypt hash
  verifyPassword(password, hash) → boolean
  generateOTP() → 6-digit string (otplib)
  storeOTP(email, otp) → save to otpVerifications table (5 min TTL)
  verifyOTP(email, otp) → check table, mark used
  sendOTPEmail(email, otp) → send via nodemailer or Resend
  createUser(email, hashedPassword, name) → insert to users
  getUserByEmail(email) → fetch from DB
```

### 1D. Auth API Routes
**File:** `app/api/auth/send-otp/route.ts` ← NEW
- POST: email → generate OTP → store → send email → return {success}

**File:** `app/api/auth/verify-otp/route.ts` ← NEW
- POST: {email, otp} → verify → mark email verified → return {success}

**File:** `app/api/auth/register/route.ts` ← NEW
- POST: {name, email, password} → hash → insert user → send OTP

### 1E. Update Client Auth
**File:** `app/_clientLayout.tsx` — Replace localStorage with useSession()
**File:** `app/auth/login/page.tsx` — Connect to NextAuth signIn()
**File:** `app/auth/signup/page.tsx` — Add OTP step, connect to /api/auth/register

### 1F. Auth Middleware
**File:** `middleware.ts` ← NEW (at project root)
- Protect all routes except /auth/* and /api/auth/*
- Redirect unauthenticated users to /auth/login

---

## PHASE 2 — Onboarding Flow
*"First impression after signup"*

### 2A. Onboarding Page
**File:** `app/onboarding/page.tsx` ← NEW

5-step wizard:
```
Step 1 — Welcome
  "Welcome to FinFlow, [name]! Let's set you up in 3 minutes."
  Brief app description + what to expect

Step 2 — Personal Information
  Fields: DOB, gender, occupation, income bracket
  City, state
  PAN number (optional, for tax features)
  Save to: userProfiles table

Step 3 — Permissions & Consent
  ✓ Consent to process financial data
  ✓ Enable ML analytics on transactions
  ✓ Enable AI financial assistant
  Optional: Marketing emails
  GDPR-style clear language

Step 4 — Add Your Bank Account
  Input: Bank name (dropdown: HDFC, ICICI, SBI, Axis, Kotak, Other)
  Input: Account nickname ("My Salary Account")
  Input: Account type (Savings / Salary / Current)
  Input: Last 4 digits (optional, for display)
  Can skip → goes to step 5

Step 5 — Upload First Statement (or skip)
  If bank added in step 4 → show upload widget
  "Upload your bank statement to get started"
  Supported: PDF, Excel, CSV
  Can skip → goes to dashboard empty state
```

**File:** `app/onboarding/layout.tsx` ← NEW
- Full-screen layout without sidebar/navbar
- Progress bar at top (5 steps)

**File:** `server/services/onboarding.service.ts` ← NEW
```typescript
Functions:
  saveUserProfile(userId, profileData) → upsert userProfiles
  markOnboardingComplete(userId) → set onboardingComplete=true
  addBankAccount(userId, bankData) → insert bankAccounts
  getUserOnboardingStatus(userId) → check userProfiles.onboardingComplete
```

### 2B. Onboarding Guard
**File:** `middleware.ts` — Update to check onboarding status
- If authenticated but onboarding incomplete → redirect to /onboarding

---

## PHASE 3 — Bank Statement Upload & Processing
*"The core data ingestion engine"*

### 3A. File Upload API
**File:** `app/api/upload/statement/route.ts` ← NEW (replaces empty /api/upload)
- POST: multipart/form-data {file, bankAccountId, statementMonth}
- Validate file type (pdf/xlsx/csv), max size 10MB
- Upload raw file to S3 at: `statements/{userId}/{bankAccountId}/{filename}`
- Create statementUploads record with status=pending
- Enqueue BullMQ job for processing
- Return {uploadId, status: "processing"}

### 3B. Statement Parser Service
**File:** `server/services/parser/` ← NEW directory

**File:** `server/services/parser/pdf.parser.ts`
```typescript
Uses pdf-parse library
Strategy:
  1. Extract raw text from PDF
  2. Find transaction table sections
  3. Parse rows using regex patterns for Indian bank formats
  4. Detect: HDFC, ICICI, SBI, Axis, Kotak formats
  5. Extract: date, description, debit amount, credit amount, balance
  Return: ParsedTransaction[]
```

**File:** `server/services/parser/excel.parser.ts`
```typescript
Uses xlsx library
Strategy:
  1. Open workbook, find first sheet with transaction data
  2. Detect header row (Date, Description, Debit, Credit, Balance)
  3. Parse each row
  4. Handle multiple date formats (DD/MM/YYYY, MM-DD-YYYY, etc.)
  Return: ParsedTransaction[]
```

**File:** `server/services/parser/csv.parser.ts`
```typescript
Uses papaparse library
Strategy:
  1. Auto-detect delimiter (comma, semicolon, pipe)
  2. Find header row
  3. Map columns to fields
  4. Parse amounts (remove commas, handle Dr/Cr suffixes)
  Return: ParsedTransaction[]
```

**File:** `server/services/parser/categorizer.ts`
```typescript
Merchant → Category mapping engine
Strategy:
  1. Build keyword lookup table (500+ merchant keywords → category)
     swiggy/zomato/food → food_dining
     hdfc emi/loan emi → emi_loan
     salary/sal/ctc → salary
     amazon/flipkart/myntra → shopping
     electricity/power/bescom → utilities
     petrol/fuel/hp/iocl → fuel
     etc.
  2. For unknown merchants → use amount + time + keywords to guess
  3. Return: category, subcategory, isRecurring flag
```

**File:** `server/services/parser/deduplicator.ts`
```typescript
Overlap detection for monthly statement uploads
Strategy:
  1. Load existing transaction hashes for this bankAccountId
  2. Hash = SHA256(date + amount + rawDescription)
  3. For each new transaction:
     - Compute hash
     - If hash exists in DB → skip (duplicate)
     - If hash doesn't exist → insert
  4. Find "last transaction date" in overlap
  5. Return: {new: T[], duplicates: T[], startDate: Date}
```

### 3C. Background Processing Job
**File:** `server/jobs/process-statement.job.ts` ← NEW
```typescript
BullMQ Worker for async statement processing
Flow:
  1. Receive {uploadId, userId, bankAccountId, fileType, s3Key}
  2. Update statementUploads status = 'processing'
  3. Download file from S3
  4. Parse file using appropriate parser (pdf/xlsx/csv)
  5. Categorize each transaction
  6. Run deduplication check
  7. Insert new transactions to DB (with userId, bankAccountId, statementUploadId)
  8. Update statementUploads: status='completed', transactionsExtracted=N
  9. Trigger ML clustering job for this user
  10. Update statementUploads status = 'completed'
  On error: status = 'failed', errorMessage = error.message
```

**File:** `server/jobs/cluster-user.job.ts` ← NEW
```typescript
BullMQ Worker that runs ML clustering for a specific user
Flow:
  1. Receive {userId}
  2. Fetch all transactions for this userId from DB
  3. Save to temp file: /tmp/user_{userId}_transactions.json
  4. Run Python clustering script as child process
  5. Read output cluster assignments
  6. Update transaction rows with cluster IDs
  7. Save cluster metadata for this user
```

### 3D. Upload UI Component
**File:** `components/upload-statement.tsx` ← NEW
```
Features:
  - Drag & drop zone
  - Bank account selector (existing accounts or "Add New")
  - Statement month picker
  - File preview before upload
  - Real-time processing status with progress steps:
    "Uploading file..." → "Extracting transactions..." → "Categorizing..." → "Done! 127 transactions added"
  - Error state with retry
  - Duplicate warning (e.g., "38 duplicate transactions skipped")
```

### 3E. Bank Account Management API
**File:** `app/api/banks/route.ts` ← NEW
- GET: List user's bank accounts
- POST: Add new bank account

**File:** `app/api/banks/[bankId]/route.ts` ← NEW
- GET: Get bank account details + recent uploads
- PATCH: Update account nickname
- DELETE: Soft-delete account

---

## PHASE 4 — Empty States & User Data Pipeline
*"The experience before the experience"*

### 4A. Empty State Component
**File:** `components/empty-state.tsx` ← NEW
```typescript
Props: {
  section: "dashboard" | "analytics" | "transactions" | "ai-ca" | "tax"
  hasBank: boolean
}
Shows:
  - Blurred/skeleton preview of what the section will look like
  - Single sentence explanation:
    dashboard: "Your financial overview will appear here once you upload a bank statement."
    analytics: "Spending patterns, cluster insights, and trends will be revealed after your first upload."
    ai-ca: "Your AI financial assistant will be able to answer questions about your finances after data upload."
    tax: "Tax calculations will be based on your actual salary and deductions from uploaded statements."
  - CTA button: "Upload Your First Statement →"
```

### 4B. Data Existence Check Hook
**File:** `hooks/use-user-data.ts` ← NEW
```typescript
useUserData() hook:
  - Fetches user profile, bank accounts, transaction count
  - Returns: { hasData, hasBanks, transactionCount, latestUpload }
  - Used by every page to decide: show empty state OR real data
```

### 4C. Update Dashboard to Use Real Data
**File:** `app/api/dashboard/route.ts` ← NEW
```typescript
GET /api/dashboard?period=this-month
  Auth guard: session.user.id
  Returns:
    totalBalance (latest balanceAfter from most recent transaction per bank)
    monthlyIncome (sum of credits this month for this user)
    monthlyExpense (sum of debits this month for this user)
    netWorth (totalBalance across all banks)
    recentTransactions (last 10)
    alerts (budget exceeded, anomalies)
    savingsRate
    perBankBalances [{bankName, balance, accountLast4}]
```

---

## PHASE 5 — Dashboard & Analytics with Real Data
*"Replacing hardcoded with live"*

### 5A. Transactions API
**File:** `app/api/transactions/route.ts` ← NEW
```typescript
GET /api/transactions?page=1&limit=50&bankId=uuid&category=food_dining&type=debit&from=2025-03&to=2025-06
  - Auth guard (userId from session)
  - Paginated, filterable by bank/category/type/date
  - Returns transactions with cluster labels
```

### 5B. Analytics API
**File:** `app/api/analytics/route.ts` ← NEW
```typescript
GET /api/analytics?period=last-6-months&bankId=all
  - Monthly income/expense breakdown
  - Category breakdown with percentages
  - Trend data (daily/weekly/monthly)
  - Budget vs actual
  - Returns real data from DB filtered by userId
```

### 5C. Update Analytics Page
**File:** `app/analytics/page.tsx` — Refactor
- Replace all hardcoded arrays with useSWR/fetch calls to /api/analytics
- Pass bankId filter from URL params
- Keep existing chart components, just wire to real data

### 5D. Update Dashboard Page
**File:** `app/page.tsx` — Refactor
- Replace hardcoded KPIs with fetch to /api/dashboard
- Show per-bank balance breakdown
- Show real recent transactions

### 5E. Multi-Bank Filter UI
**File:** `components/bank-selector.tsx` ← NEW
- Dropdown: "All Banks" | "HDFC - Salary" | "ICICI - Savings"
- Updates URL param ?bankId=uuid
- Used in dashboard and analytics pages

---

## PHASE 6 — AI Assistant with Groq
*"Your personal CFO powered by LLM"*

### 6A. Install Groq
```bash
pnpm add @ai-sdk/groq
```

### 6B. AI Context Builder
**File:** `server/services/ai-context.service.ts` ← NEW
```typescript
buildUserContext(userId: string) → string
  Queries DB for this user only:
    - Last 3 months transactions
    - Category breakdown
    - Monthly income vs expense
    - Savings rate
    - Bank accounts
    - Tax regime preference
    - Budget status
  Formats as structured text for the LLM prompt:
    "User has 3 bank accounts totaling ₹X balance.
     Last month income: ₹85,000. Expenses: ₹42,500.
     Top spending: Food ₹12K, Transport ₹8K, EMI ₹12.5K.
     Savings rate: 50%.
     Tax regime: New.
     ..."
  IMPORTANT: Only queries WHERE userId = session.user.id
```

### 6C. AI API Route
**File:** `app/api/ai/chat/route.ts` ← NEW
```typescript
POST /api/ai/chat
  Body: { messages: Message[], userId from session }

  1. Auth guard — get userId from session
  2. Build user financial context (only their data)
  3. Create Groq client (@ai-sdk/groq)
  4. System prompt:
     "You are FinFlow AI, a personal financial assistant for Indian users.
      You have access to the user's real financial data below.
      Always give specific answers using actual numbers from their data.
      For tax questions, reference Indian Income Tax Act sections.
      Never discuss other users' data.
      User Financial Context:
      {context}"
  5. Stream response using Vercel AI SDK streamText()
  6. Return streaming response
```

### 6D. Update AI-CA Page
**File:** `app/ai-ca/page.tsx` — Replace mock with real
- Use useChat() hook from Vercel AI SDK
- Connect to /api/ai/chat
- Remove hardcoded mock responses
- Add context-aware suggested queries based on user's actual data
  ("How much did I spend on food last month?" — personalized)
- Keep existing UI, just wire to real streaming API

---

## PHASE 7 — Tax System with Real Data
*"Smart tax optimization using actual transactions"*

### 7A. Tax Data Service
**File:** `server/services/tax.service.ts` ← NEW
```typescript
Functions:
  getAnnualIncome(userId, year) → sum salary credits for FY
  getDeductibleExpenses(userId, year):
    80C: insurance premiums from transactions
    80D: health insurance premiums
    Section 24: home loan EMI interest portion
    HRA: rent payments
    80E: education loan EMI
  calculateTax(income, deductions, regime) → {
    taxableIncome, taxPayable, effectiveRate,
    savingsVsOtherRegime
  }
  getTaxSavingOpportunities(userId) → [
    "You've used ₹24,000 of ₹1,50,000 80C limit.
     Invest ₹1,26,000 more in ELSS/PPF to save ₹39,060 in tax."
  ]
```

### 7B. Tax API Routes
**File:** `app/api/tax/route.ts` ← NEW
```typescript
GET /api/tax?fy=2025-26
  - Auth guard
  - Returns: income, deductions found, both regime calculations
  - Suggestions for tax saving

POST /api/tax/regime
  - Body: {regime: "old" | "new"}
  - Update userProfiles.taxRegime
```

### 7C. Update Tax Page
**File:** `app/tax/page.tsx` — Partial refactor
- Fetch real income from /api/tax
- Show actual deductions found from uploaded statements
- Pre-fill sliders with real values
- Add "detected from your statements" labels on deduction items
- Manual override still allowed

---

## DATA ISOLATION ARCHITECTURE
*"Every query is filtered by userId — no exceptions"*

```
Rule: EVERY database query MUST include WHERE userId = session.user.id

Enforcement layers:
1. Middleware validates session token on every /api/* request
2. API routes extract userId from session.user.id (never from request body)
3. All service functions require userId as first parameter
4. Drizzle queries always include .where(eq(transactions.userId, userId))
5. S3 paths: statements/{userId}/... (user can only access their prefix)
6. ML clustering: runs per-user in isolated temp files
7. AI context: buildUserContext(userId) queries only that user's data

Multi-user isolation model:
  User A's transactions → NEVER visible to User B
  Bank accounts are userId-scoped
  Cluster results are userId-scoped
  AI context is userId-scoped
  S3 files are in userId-namespaced paths
```

---

## INCREMENTAL UPLOAD LOGIC (Monthly Statements)
*"Smart deduplication across monthly uploads"*

```
Scenario: User uploads March statement, then April statement

April statement processing:
  1. Extract all transactions from April PDF
  2. For each transaction, compute hash = SHA256(date + amount + description)
  3. Query DB: SELECT hash FROM transactions WHERE userId=X AND bankAccountId=Y
  4. Find matching hashes → these are duplicates (overlap period)
  5. Find "first new transaction date" after overlap
  6. Insert only non-duplicate transactions
  7. Log: "127 new, 3 skipped (duplicates from March)"

Scenario: Gap in uploads (no February, now uploading March)
  1. Check latest transaction date for this bank in DB (e.g., January 31)
  2. March statement starts from March 1 — no overlap
  3. Insert all March transactions with no dedup needed
  4. Warn user: "Gap detected: Feb 1–Mar 1 has no data.
     Consider uploading February statement."

Scenario: User adds a second bank (ICICI)
  1. Separate bankAccountId in DB
  2. Balance shown separately on dashboard
  3. Analytics aggregates both (total spending = HDFC + ICICI)
  4. Filter allows viewing each bank independently
  5. ML clustering runs on all transactions regardless of bank
```

---

## FILE STRUCTURE TO CREATE

```
NEW FILES TO CREATE:
server/
  auth/
    config.ts                     ← NextAuth config
  db/
    schema/
      users.ts                    ← users, profiles, banks, uploads
  services/
    auth.service.ts               ← OTP, password, user creation
    onboarding.service.ts         ← Profile saving, bank setup
    ai-context.service.ts         ← Build LLM context from user data
    tax.service.ts                ← Tax calculation from real data
    parser/
      pdf.parser.ts               ← PDF statement parsing
      excel.parser.ts             ← Excel parsing
      csv.parser.ts               ← CSV parsing
      categorizer.ts              ← Merchant → category mapping
      deduplicator.ts             ← Duplicate transaction detection
  jobs/
    process-statement.job.ts      ← BullMQ: parse + store transactions
    cluster-user.job.ts           ← BullMQ: trigger per-user ML
  middleware/
    auth.middleware.ts            ← Session validation helpers

app/
  api/
    auth/
      register/route.ts           ← POST: create user
      send-otp/route.ts           ← POST: send OTP email
      verify-otp/route.ts         ← POST: verify OTP
    banks/
      route.ts                    ← GET list, POST add bank
      [bankId]/route.ts           ← GET/PATCH/DELETE bank
    upload/
      statement/route.ts          ← POST: upload statement file
    transactions/
      route.ts                    ← GET: paginated transactions
    dashboard/
      route.ts                    ← GET: KPIs + recent txns
    analytics/
      route.ts                    ← GET: charts data
    ai/
      chat/route.ts               ← POST: Groq streaming chat
    tax/
      route.ts                    ← GET: tax calculation
  onboarding/
    page.tsx                      ← 5-step wizard
    layout.tsx                    ← Full-screen without sidebar

middleware.ts                     ← Route protection + onboarding check

components/
  upload-statement.tsx            ← File upload widget
  empty-state.tsx                 ← Pre-data placeholder UI
  bank-selector.tsx               ← Multi-bank filter dropdown

hooks/
  use-user-data.ts                ← Check if user has data

FILES TO MODIFY:
app/_clientLayout.tsx             ← useSession instead of localStorage
app/auth/login/page.tsx           ← Connect to NextAuth signIn()
app/auth/signup/page.tsx          ← Add OTP step
app/page.tsx                      ← Real data from /api/dashboard
app/analytics/page.tsx            ← Real data from /api/analytics
app/ai-ca/page.tsx                ← Real Groq streaming
app/tax/page.tsx                  ← Real data from /api/tax
app/settings/page.tsx             ← Real profile data from DB
server/db/schema/transactions.ts  ← Add bankAccountId, hash, rawDescription
server/db/schema/index.ts         ← Export users schema
```

---

## EXECUTION ORDER

1. **Phase 1** → Schema + Auth (foundation everything else depends on)
2. **Phase 2** → Onboarding (new user experience)
3. **Phase 3** → Upload + Parser (data ingestion engine)
4. **Phase 4** → Empty states + data hooks (UX for no-data state)
5. **Phase 5** → Dashboard/Analytics with real data
6. **Phase 6** → AI Groq integration
7. **Phase 7** → Tax with real data

Total new files: ~28
Total modified files: ~8
