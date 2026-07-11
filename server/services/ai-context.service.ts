import { db } from "@/server/db"
import { transactions, bankAccounts, userProfiles, clusterMetadata } from "@/server/db/schema"
import { eq, and, desc, gte, lte, sum, sql } from "drizzle-orm"
import { oracleAccessControl, type UserAccessContext, type PageAccessPolicy } from "@/server/services/oracle-access-control.service"

// Slabs for tax calculation (identical to tax route)
const OLD_REGIME_SLABS = [
  { min: 0, max: 250000, rate: 0 },
  { min: 250000, max: 500000, rate: 0.05 },
  { min: 500000, max: 1000000, rate: 0.20 },
  { min: 1000000, max: Infinity, rate: 0.30 },
]

const NEW_REGIME_SLABS = [
  { min: 0, max: 300000, rate: 0 },
  { min: 300000, max: 600000, rate: 0.05 },
  { min: 600000, max: 900000, rate: 0.10 },
  { min: 900000, max: 1200000, rate: 0.15 },
  { min: 1200000, max: 1500000, rate: 0.20 },
  { min: 1500000, max: Infinity, rate: 0.30 },
]

function calcTax(income: number, slabs: typeof OLD_REGIME_SLABS): number {
  let tax = 0
  for (const slab of slabs) {
    if (income <= slab.min) break
    tax += (Math.min(income, slab.max) - slab.min) * slab.rate
  }
  return tax * 1.04 // 4% cess
}

interface PageContextConfig {
  path: string
  contextTypes: string[]
  prioritySections: string[]
  maxTokens: number
}

// Page-specific context configurations
const PAGE_CONTEXT_CONFIGS: Record<string, PageContextConfig> = {
  "/": {
    path: "/",
    contextTypes: ["profile", "transactions", "tax", "analytics", "summary"],
    prioritySections: ["profile", "analytics", "tax"],
    maxTokens: 2000,
  },
  "/dashboard": {
    path: "/dashboard",
    contextTypes: ["profile", "transactions", "tax", "analytics", "summary", "ml-clusters"],
    prioritySections: ["profile", "analytics", "tax", "ml-clusters"],
    maxTokens: 3000,
  },
  "/analytics": {
    path: "/analytics",
    contextTypes: ["profile", "transactions", "analytics", "ml-clusters", "full-context"],
    prioritySections: ["analytics", "ml-clusters", "transactions"],
    maxTokens: 4000,
  },
  "/tax": {
    path: "/tax",
    contextTypes: ["profile", "transactions", "tax", "analytics", "documents"],
    prioritySections: ["tax", "profile", "transactions"],
    maxTokens: 3500,
  },
  "/onboarding": {
    path: "/onboarding",
    contextTypes: ["profile", "summary"],
    prioritySections: ["profile"],
    maxTokens: 1000,
  },
  "/settings": {
    path: "/settings",
    contextTypes: ["profile", "summary"],
    prioritySections: ["profile"],
    maxTokens: 1000,
  },
  "/upload": {
    path: "/upload",
    contextTypes: ["profile", "transactions", "summary"],
    prioritySections: ["profile", "transactions"],
    maxTokens: 1500,
  },
  "/calculators": {
    path: "/calculators",
    contextTypes: ["profile", "tax", "analytics", "summary"],
    prioritySections: ["tax", "profile", "analytics"],
    maxTokens: 2000,
  },
  "/ai-ca": {
    path: "/ai-ca",
    contextTypes: ["profile", "transactions", "tax", "analytics", "ml-clusters", "documents", "full-context"],
    prioritySections: ["full-context", "profile", "analytics", "tax", "ml-clusters"],
    maxTokens: 4000,
  },
  "/profile": {
    path: "/profile",
    contextTypes: ["profile", "summary"],
    prioritySections: ["profile"],
    maxTokens: 1000,
  },
}

function getPageConfig(currentPath: string): PageContextConfig {
  const normalizedPath = currentPath.split("/")[1] ? `/${currentPath.split("/")[1]}` : "/"
  return PAGE_CONTEXT_CONFIGS[normalizedPath] || PAGE_CONTEXT_CONFIGS["/"]
}

export async function buildUserContext(
  userId: string,
  currentPath: string = "/",
  userEmail?: string
): Promise<{ context: string; accessContext: UserAccessContext; pagePolicy: PageAccessPolicy }> {
  const pageConfig = getPageConfig(currentPath)
  
  // Verify page access via Oracle Cloud Access Control
  const pagePolicy = await oracleAccessControl.verifyPageAccess(userId, userEmail || "", currentPath)
  
  // Get user access context from Oracle Cloud
  const accessContext = await oracleAccessControl.getUserAccessContext(userId, userEmail || "", currentPath)
  
  // Log access attempt
  await oracleAccessControl.logAccessAttempt(
    userId,
    userEmail || "",
    "ai_context_build",
    currentPath,
    pagePolicy.allowed
  )

  if (!pagePolicy.allowed) {
    return {
      context: "Access to this page is restricted. Please contact support.",
      accessContext,
      pagePolicy,
    }
  }

  // Adjust context types based on page policy data scope
  let allowedContextTypes = pageConfig.contextTypes
  if (pagePolicy.dataScope === "summary") {
    allowedContextTypes = allowedContextTypes.filter(t => !["documents", "full-context", "ml-clusters"].includes(t))
  } else if (pagePolicy.dataScope === "restricted") {
    allowedContextTypes = ["profile", "summary"]
  }

  // Verify AI model access with requested context types
  const aiAccess = await oracleAccessControl.verifyAIModelAccess(
    userId,
    userEmail || "",
    allowedContextTypes,
    pageConfig.maxTokens
  )

  if (!aiAccess.allowed) {
    // Fallback to limited context
    allowedContextTypes = ["profile", "summary"]
  }

  try {
    // 1. Fetch profile and bank details with strict user isolation filters
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1)
    const banks = await db.select().from(bankAccounts).where(and(eq(bankAccounts.userId, userId), eq(bankAccounts.isActive, true)))

    // 2. Fetch income and insurance deductions for current financial year
    const currentYear = new Date().getFullYear()
    const fyStart = new Date(`${currentYear}-04-01`)
    const fyEnd = new Date(`${currentYear + 1}-03-31`)

    const [incomeResult, insuranceResult] = await Promise.all([
      db.select({ total: sum(transactions.amount) }).from(transactions).where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "credit"),
          eq(transactions.category, "salary"),
          gte(transactions.date, fyStart),
          lte(transactions.date, fyEnd)
        )
      ),
      db.select({ total: sum(transactions.amount) }).from(transactions).where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, "debit"),
          eq(transactions.category, "insurance"),
          gte(transactions.date, fyStart),
          lte(transactions.date, fyEnd)
        )
      ),
    ])

    // Calculate Tax Liability & Opportunities
    const grossIncome = parseFloat(incomeResult[0]?.total || "0")
    const deduction80C = Math.min(parseFloat(insuranceResult[0]?.total || "0"), 150000)
    const taxRegime = profile?.taxRegime || "new"
    const standardOld = 50000
    const standardNew = 75000

    const oldTax = calcTax(Math.max(0, grossIncome - deduction80C - standardOld), OLD_REGIME_SLABS)
    const newTax = calcTax(Math.max(0, grossIncome - standardNew), NEW_REGIME_SLABS)
    const taxPayable = taxRegime === "old" ? oldTax : newTax
    const effectiveRate = grossIncome > 0 ? (taxPayable / grossIncome) * 100 : 0
    const betterRegime = oldTax < newTax ? "old" : "new"

    const taxOpportunities: string[] = []
    const remaining80C = Math.max(0, 150000 - deduction80C)
    if (remaining80C > 0) {
      taxOpportunities.push(`Invest ₹${remaining80C.toLocaleString("en-IN")} more in 80C (ELSS/PPF/LIC) to save up to ₹${Math.round(remaining80C * 0.3).toLocaleString("en-IN")} in tax.`)
    }
    if (grossIncome > 1000000) {
      taxOpportunities.push("Consider NPS (₹50,000 under 80CCD(1B)) for extra deduction.")
    }

    // 3. Fetch monthly trends and category breakdowns
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const monthly = await db.select({
      month: sql<string>`to_char(date, 'YYYY-MM')`,
      income: sql<number>`sum(case when type = 'credit' then amount::numeric else 0 end)`,
      expenses: sql<number>`sum(case when type = 'debit' then amount::numeric else 0 end)`,
    }).from(transactions).where(and(eq(transactions.userId, userId), gte(transactions.date, threeMonthsAgo)))
      .groupBy(sql`to_char(date, 'YYYY-MM')`).orderBy(sql`to_char(date, 'YYYY-MM')`)

    const categories = await db.select({
      category: transactions.category,
      total: sum(transactions.amount),
    }).from(transactions).where(and(eq(transactions.userId, userId), eq(transactions.type, "debit"), gte(transactions.date, threeMonthsAgo)))
      .groupBy(transactions.category).orderBy(desc(sum(transactions.amount))).limit(5)

    const bankNames = banks.map((b) => `${b.bankName} (${b.accountNickname || b.accountType})`).join(", ")
    const avgIncome = monthly.length ? monthly.reduce((s, m) => s + Number(m.income || 0), 0) / monthly.length : 0
    const avgExpense = monthly.length ? monthly.reduce((s, m) => s + Number(m.expenses || 0), 0) / monthly.length : 0
    const savingsRate = avgIncome > 0 ? Math.round(((avgIncome - avgExpense) / avgIncome) * 100) : 0

    const topCategories = categories.map((c) =>
      `${c.category}: ₹${Math.round(Number(c.total || 0)).toLocaleString("en-IN")}`
    ).join(", ")

    const monthlyTrends = monthly.map((m) =>
      `${m.month}: Income ₹${Math.round(Number(m.income || 0)).toLocaleString("en-IN")}, Expenses ₹${Math.round(Number(m.expenses || 0)).toLocaleString("en-IN")}`
    ).join("\n")

    // KYC Status checks
    const hasPan = !!profile?.panNumber
    const hasAadhaar = !!profile?.aadhaarLast4
    const kycStatus = (hasPan && hasAadhaar) ? "VERIFIED" : "PENDING"

    // Fetch dynamic DBMS-computed ML clustering categories
    const userClusters = await db
      .select()
      .from(clusterMetadata)
      .where(eq(clusterMetadata.userId, userId))

    let clusterContext = ""
    if (userClusters.length > 0) {
      clusterContext = userClusters
        .map(
          (m) =>
            `- [${m.clusterType.toUpperCase()}] ${m.label}: ${m.description} (${m.transactionCount} transactions, avg ₹${Math.round(m.avgAmount ?? 0)})`
        )
        .join("\n")
    }

    // Build context sections based on allowed context types
    const contextSections: Record<string, string> = {}

    // Profile section
    if (allowedContextTypes.includes("profile")) {
      contextSections.profile = `
USER PROFILE & ACCOUNT DETAILS:
- Name/ID: ${userId}
- Occupation: ${profile?.occupation || "not specified"}
- Income bracket: ${profile?.incomeBracket || "not specified"}
- City & State: ${profile?.city || "unknown"}, ${profile?.state || "unknown"}
- KYC Status: ${kycStatus} (PAN: ${hasPan ? "provided" : "missing"}, Aadhaar Last 4: ${hasAadhaar ? "provided" : "missing"})
- Linked Accounts: ${banks.length} bank(s) active (${bankNames || "none linked"})
- AI consent: ${profile?.consentAIAssistant ? "approved" : "revoked"}
- ML analytics consent: ${profile?.consentMLAnalytics ? "approved" : "revoked"}
- Data Access Level: ${accessContext.dataAccessLevel}
`.trim()
    }

    // Tax section
    if (allowedContextTypes.includes("tax")) {
      contextSections.tax = `
TAX LIABILITY SUMMARY (FY ${currentYear}-${currentYear + 1}):
- Tax Regime Preference: ${taxRegime.toUpperCase()} regime
- Better Alternative: ${betterRegime.toUpperCase()} regime (Potential savings vs other: ₹${Math.abs(Math.round(oldTax - newTax)).toLocaleString("en-IN")})
- Gross FY Salary Income: ₹${Math.round(grossIncome).toLocaleString("en-IN")}
- Standard Deduction Applied: ₹${(taxRegime === "old" ? standardOld : standardNew).toLocaleString("en-IN")}
- 80C Deductions Utilized: ₹${Math.round(deduction80C).toLocaleString("en-IN")}
- Current Estimated Tax Payable: ₹${Math.round(taxPayable).toLocaleString("en-IN")}
- Effective Tax Rate: ${effectiveRate.toFixed(1)}%

TAX SAVING OPPORTUNITIES:
${taxOpportunities.length > 0 ? taxOpportunities.map(o => `- ${o}`).join("\n") : "- Fully optimized! No current opportunities found."}
`.trim()
    }

    // Analytics section
    if (allowedContextTypes.includes("analytics") || allowedContextTypes.includes("summary")) {
      contextSections.analytics = `
DBMS-COMPUTED ML CLUSTERING SAMPLES:
${clusterContext || "- No dynamic ML clusters computed yet. Ask the user to upload statement PDFs first."}

LAST 3 MONTHS SPENDING METRICS:
- Average monthly income: ₹${Math.round(avgIncome).toLocaleString("en-IN")}
- Average monthly expenses: ₹${Math.round(avgExpense).toLocaleString("en-IN")}
- Average monthly savings: ₹${Math.round(avgIncome - avgExpense).toLocaleString("en-IN")} (${savingsRate}% savings rate)

TOP SPENDING CATEGORIES:
${topCategories || "No data available"}

MONTHLY TRENDS:
${monthlyTrends || "No data available"}
`.trim()
    }

    // Full context / ML clusters detailed
    if (allowedContextTypes.includes("full-context") || allowedContextTypes.includes("ml-clusters")) {
      contextSections.fullContext = `
DETAILED ML BEHAVIORAL CLUSTERS:
${clusterContext || "- No dynamic ML clusters computed yet."}

TRANSACTION PATTERN ANALYSIS:
- Total categories tracked: ${categories.length}
- Active bank accounts: ${banks.length}
- Data completeness: ${profile?.onboardingComplete ? "Complete" : "Incomplete (onboarding pending)"}
`.trim()
    }

    // Documents section (for tax page with document access)
    if (allowedContextTypes.includes("documents")) {
      contextSections.documents = `
DOCUMENT ACCESS STATUS:
- Tax documents: Available for FY ${currentYear}-${currentYear + 1}
- Bank statements: ${banks.length} account(s) with uploaded statements
- KYC documents: ${kycStatus === "VERIFIED" ? "Verified" : "Pending verification"}
`.trim()
    }

    // Route-sensitive context assembly based on page priority
    const prioritySections = pageConfig.prioritySections
    let finalContext = ""

    // Add priority sections first
    for (const section of prioritySections) {
      if (contextSections[section]) {
        finalContext += contextSections[section] + "\n\n"
      }
    }

    // Add remaining sections
    for (const [key, value] of Object.entries(contextSections)) {
      if (!prioritySections.includes(key)) {
        finalContext += value + "\n\n"
      }
    }

    // Trim to max tokens (rough estimation: 1 token ≈ 4 chars)
    const maxChars = pageConfig.maxTokens * 4
    if (finalContext.length > maxChars) {
      finalContext = finalContext.substring(0, maxChars) + "\n\n[Context truncated due to token limit]"
    }

    return {
      context: `
${finalContext}

IMPORTANT: Only discuss this user's own financial data. Never reference other users. Keep recommendations private.
PAGE CONTEXT: ${currentPath} (Data scope: ${pagePolicy.dataScope}, Operations: ${pagePolicy.allowedOperations.join(", ")})
`.trim(),
      accessContext,
      pagePolicy,
    }
  } catch (err) {
    console.error("[AI Context Builders Failed]", err)
    return {
      context: "User financial data unavailable. Please ask them to upload bank statements first.",
      accessContext,
      pagePolicy,
    }
  }
}