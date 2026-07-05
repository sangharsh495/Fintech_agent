/**
 * FinFlow Transaction Seed Data Generator
 * Generates 1200+ realistic Indian financial transactions over 12 months
 * Output: ml-service/data/transactions.json
 */

import * as fs from "fs"
import * as path from "path"

// ─── Configuration ─────────────────────────────────────────

const USER_ID = "user_001"
const START_DATE = new Date("2025-03-01")
const END_DATE = new Date("2026-02-28")
const INITIAL_BALANCE = 125000
const MONTHLY_SALARY = 85000

// ─── Merchant & Category Definitions ───────────────────────

interface MerchantDef {
  name: string
  category: string
  subcategory: string
  amountRange: [number, number]
  paymentMethods: string[]
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "occasional"
  isRecurring: boolean
  tags: string[]
  hourRange: [number, number]
}

const CREDIT_SOURCES: MerchantDef[] = [
  {
    name: "Employer - TechCorp India",
    category: "salary",
    subcategory: "monthly_salary",
    amountRange: [85000, 85000],
    paymentMethods: ["neft"],
    frequency: "monthly",
    isRecurring: true,
    tags: ["income", "salary", "regular"],
    hourRange: [9, 11],
  },
  {
    name: "Freelance Client - WebDev",
    category: "freelance",
    subcategory: "web_development",
    amountRange: [5000, 35000],
    paymentMethods: ["upi", "neft", "imps"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["income", "freelance", "variable"],
    hourRange: [10, 18],
  },
  {
    name: "Zerodha - Dividend",
    category: "investment_return",
    subcategory: "stock_dividend",
    amountRange: [500, 8000],
    paymentMethods: ["neft"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["income", "investment", "dividend"],
    hourRange: [9, 16],
  },
  {
    name: "Amazon Refund",
    category: "refund",
    subcategory: "product_return",
    amountRange: [200, 5000],
    paymentMethods: ["imps", "upi"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["refund", "shopping"],
    hourRange: [8, 20],
  },
  {
    name: "Family Transfer",
    category: "gift_received",
    subcategory: "family_support",
    amountRange: [2000, 15000],
    paymentMethods: ["upi", "imps"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["income", "family", "gift"],
    hourRange: [8, 21],
  },
]

const DEBIT_MERCHANTS: MerchantDef[] = [
  // ── Food & Dining ──
  {
    name: "Swiggy",
    category: "food_dining",
    subcategory: "food_delivery",
    amountRange: [150, 800],
    paymentMethods: ["upi", "credit_card", "wallet"],
    frequency: "daily",
    isRecurring: false,
    tags: ["food", "delivery", "online"],
    hourRange: [11, 22],
  },
  {
    name: "Zomato",
    category: "food_dining",
    subcategory: "food_delivery",
    amountRange: [200, 1000],
    paymentMethods: ["upi", "credit_card", "wallet"],
    frequency: "daily",
    isRecurring: false,
    tags: ["food", "delivery", "online"],
    hourRange: [11, 23],
  },
  {
    name: "Starbucks India",
    category: "food_dining",
    subcategory: "cafe",
    amountRange: [250, 650],
    paymentMethods: ["upi", "credit_card", "debit_card"],
    frequency: "weekly",
    isRecurring: false,
    tags: ["food", "cafe", "lifestyle"],
    hourRange: [8, 19],
  },
  {
    name: "Local Restaurant",
    category: "food_dining",
    subcategory: "dining_out",
    amountRange: [300, 2500],
    paymentMethods: ["upi", "cash", "credit_card"],
    frequency: "weekly",
    isRecurring: false,
    tags: ["food", "dining", "social"],
    hourRange: [12, 22],
  },

  // ── Groceries ──
  {
    name: "BigBasket",
    category: "groceries",
    subcategory: "online_grocery",
    amountRange: [500, 3500],
    paymentMethods: ["upi", "credit_card", "net_banking"],
    frequency: "weekly",
    isRecurring: false,
    tags: ["groceries", "household", "essentials"],
    hourRange: [9, 20],
  },
  {
    name: "DMart",
    category: "groceries",
    subcategory: "supermarket",
    amountRange: [800, 4000],
    paymentMethods: ["upi", "debit_card", "cash"],
    frequency: "biweekly",
    isRecurring: false,
    tags: ["groceries", "household", "bulk"],
    hourRange: [10, 19],
  },

  // ── Transportation ──
  {
    name: "Uber India",
    category: "transportation",
    subcategory: "ride_hailing",
    amountRange: [100, 600],
    paymentMethods: ["upi", "wallet", "credit_card"],
    frequency: "daily",
    isRecurring: false,
    tags: ["transport", "commute"],
    hourRange: [7, 23],
  },
  {
    name: "Ola Cabs",
    category: "transportation",
    subcategory: "ride_hailing",
    amountRange: [80, 500],
    paymentMethods: ["upi", "wallet"],
    frequency: "daily",
    isRecurring: false,
    tags: ["transport", "commute"],
    hourRange: [7, 22],
  },
  {
    name: "Metro Smart Card",
    category: "transportation",
    subcategory: "public_transport",
    amountRange: [200, 500],
    paymentMethods: ["debit_card", "upi"],
    frequency: "monthly",
    isRecurring: true,
    tags: ["transport", "metro", "recharge"],
    hourRange: [8, 10],
  },

  // ── Fuel ──
  {
    name: "HP Petrol Pump",
    category: "fuel",
    subcategory: "petrol",
    amountRange: [500, 3000],
    paymentMethods: ["upi", "debit_card", "credit_card"],
    frequency: "weekly",
    isRecurring: false,
    tags: ["fuel", "vehicle", "commute"],
    hourRange: [7, 20],
  },

  // ── Utilities ──
  {
    name: "Tata Power - Electricity",
    category: "utilities",
    subcategory: "electricity",
    amountRange: [1200, 3500],
    paymentMethods: ["auto_debit", "upi", "net_banking"],
    frequency: "monthly",
    isRecurring: true,
    tags: ["utilities", "electricity", "bill"],
    hourRange: [9, 18],
  },
  {
    name: "Jio Fiber - Internet",
    category: "utilities",
    subcategory: "internet",
    amountRange: [999, 1499],
    paymentMethods: ["auto_debit", "upi"],
    frequency: "monthly",
    isRecurring: true,
    tags: ["utilities", "internet", "bill"],
    hourRange: [9, 12],
  },
  {
    name: "Airtel Mobile",
    category: "utilities",
    subcategory: "mobile_recharge",
    amountRange: [299, 999],
    paymentMethods: ["upi", "auto_debit"],
    frequency: "monthly",
    isRecurring: true,
    tags: ["utilities", "mobile", "recharge"],
    hourRange: [9, 20],
  },
  {
    name: "Municipal Water Board",
    category: "utilities",
    subcategory: "water",
    amountRange: [300, 800],
    paymentMethods: ["upi", "net_banking"],
    frequency: "monthly",
    isRecurring: true,
    tags: ["utilities", "water", "bill"],
    hourRange: [10, 16],
  },

  // ── Rent ──
  {
    name: "Landlord - Rent",
    category: "rent",
    subcategory: "house_rent",
    amountRange: [18000, 18000],
    paymentMethods: ["neft", "upi"],
    frequency: "monthly",
    isRecurring: true,
    tags: ["rent", "housing", "essential"],
    hourRange: [9, 12],
  },

  // ── EMI & Loans ──
  {
    name: "HDFC Bank - Car EMI",
    category: "emi_loan",
    subcategory: "car_loan",
    amountRange: [12500, 12500],
    paymentMethods: ["auto_debit"],
    frequency: "monthly",
    isRecurring: true,
    tags: ["emi", "car", "loan"],
    hourRange: [6, 8],
  },

  // ── Insurance ──
  {
    name: "ICICI Prudential - Life",
    category: "insurance",
    subcategory: "life_insurance",
    amountRange: [2500, 2500],
    paymentMethods: ["auto_debit"],
    frequency: "monthly",
    isRecurring: true,
    tags: ["insurance", "life", "protection"],
    hourRange: [6, 8],
  },
  {
    name: "Star Health Insurance",
    category: "insurance",
    subcategory: "health_insurance",
    amountRange: [1800, 1800],
    paymentMethods: ["auto_debit"],
    frequency: "monthly",
    isRecurring: true,
    tags: ["insurance", "health", "protection"],
    hourRange: [6, 8],
  },

  // ── Healthcare ──
  {
    name: "Apollo Pharmacy",
    category: "healthcare",
    subcategory: "medicine",
    amountRange: [200, 2000],
    paymentMethods: ["upi", "cash", "credit_card"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["health", "medicine", "pharmacy"],
    hourRange: [9, 20],
  },
  {
    name: "Dr. Sharma Clinic",
    category: "healthcare",
    subcategory: "doctor_visit",
    amountRange: [500, 2500],
    paymentMethods: ["upi", "cash"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["health", "doctor", "checkup"],
    hourRange: [10, 17],
  },

  // ── Entertainment ──
  {
    name: "Netflix India",
    category: "subscriptions",
    subcategory: "streaming",
    amountRange: [649, 649],
    paymentMethods: ["auto_debit", "credit_card"],
    frequency: "monthly",
    isRecurring: true,
    tags: ["entertainment", "streaming", "subscription"],
    hourRange: [0, 23],
  },
  {
    name: "Spotify Premium",
    category: "subscriptions",
    subcategory: "music",
    amountRange: [119, 119],
    paymentMethods: ["auto_debit"],
    frequency: "monthly",
    isRecurring: true,
    tags: ["entertainment", "music", "subscription"],
    hourRange: [0, 23],
  },
  {
    name: "PVR Cinemas",
    category: "entertainment",
    subcategory: "movies",
    amountRange: [300, 1200],
    paymentMethods: ["upi", "credit_card"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["entertainment", "movies", "social"],
    hourRange: [14, 22],
  },
  {
    name: "BookMyShow",
    category: "entertainment",
    subcategory: "events",
    amountRange: [500, 3000],
    paymentMethods: ["upi", "credit_card"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["entertainment", "events", "social"],
    hourRange: [10, 21],
  },

  // ── Shopping ──
  {
    name: "Amazon India",
    category: "shopping",
    subcategory: "online_shopping",
    amountRange: [200, 15000],
    paymentMethods: ["credit_card", "upi", "net_banking"],
    frequency: "weekly",
    isRecurring: false,
    tags: ["shopping", "online", "ecommerce"],
    hourRange: [9, 23],
  },
  {
    name: "Flipkart",
    category: "shopping",
    subcategory: "online_shopping",
    amountRange: [300, 12000],
    paymentMethods: ["credit_card", "upi", "wallet"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["shopping", "online", "ecommerce"],
    hourRange: [10, 22],
  },
  {
    name: "Myntra",
    category: "shopping",
    subcategory: "fashion",
    amountRange: [500, 5000],
    paymentMethods: ["credit_card", "upi"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["shopping", "fashion", "clothing"],
    hourRange: [11, 22],
  },

  // ── Travel ──
  {
    name: "MakeMyTrip",
    category: "travel",
    subcategory: "flight_booking",
    amountRange: [3000, 25000],
    paymentMethods: ["credit_card", "net_banking"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["travel", "flight", "booking"],
    hourRange: [10, 22],
  },
  {
    name: "OYO Rooms",
    category: "travel",
    subcategory: "hotel_booking",
    amountRange: [1500, 8000],
    paymentMethods: ["credit_card", "upi"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["travel", "hotel", "accommodation"],
    hourRange: [12, 22],
  },

  // ── Education ──
  {
    name: "Udemy Course",
    category: "education",
    subcategory: "online_course",
    amountRange: [399, 3000],
    paymentMethods: ["credit_card", "upi"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["education", "learning", "skill"],
    hourRange: [18, 23],
  },

  // ── Personal Care ──
  {
    name: "Urban Company",
    category: "personal_care",
    subcategory: "grooming",
    amountRange: [300, 2000],
    paymentMethods: ["upi", "credit_card"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["personal", "grooming", "service"],
    hourRange: [10, 18],
  },

  // ── Charity ──
  {
    name: "Ketto Donation",
    category: "charity",
    subcategory: "donation",
    amountRange: [100, 2000],
    paymentMethods: ["upi"],
    frequency: "occasional",
    isRecurring: false,
    tags: ["charity", "donation", "social"],
    hourRange: [9, 21],
  },

  // ── Miscellaneous ──
  {
    name: "ATM Withdrawal",
    category: "miscellaneous",
    subcategory: "cash_withdrawal",
    amountRange: [500, 10000],
    paymentMethods: ["debit_card"],
    frequency: "weekly",
    isRecurring: false,
    tags: ["cash", "withdrawal", "atm"],
    hourRange: [8, 21],
  },
]

// ─── Utility Functions ─────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomFloat(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateId(): string {
  return "txn_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
}

function generateRefId(): string {
  return "REF" + Date.now().toString().slice(-8) + Math.random().toString(36).substring(2, 6).toUpperCase()
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

// ─── Transaction Generator ─────────────────────────────────

interface SeedTransaction {
  id: string
  userId: string
  type: "credit" | "debit"
  amount: number
  category: string
  subcategory: string
  description: string
  merchant: string
  paymentMethod: string
  status: "completed" | "pending" | "failed"
  date: string
  dayOfWeek: number
  hourOfDay: number
  isRecurring: boolean
  tags: string
  balanceAfter: number
  // Cluster fields (null initially, filled by ML)
  spendingCluster: number | null
  sizeCluster: number | null
  temporalCluster: number | null
  categoryCluster: number | null
  isAnomaly: boolean
  anomalyScore: number | null
}

function generateTransactions(): SeedTransaction[] {
  const transactions: SeedTransaction[] = []
  let balance = INITIAL_BALANCE
  const currentDate = new Date(START_DATE)

  while (currentDate <= END_DATE) {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const day = currentDate.getDate()
    const dayOfWeek = currentDate.getDay()

    // ── Monthly recurring credits (salary on 1st) ──
    if (day === 1) {
      const salarySource = CREDIT_SOURCES[0]
      const salaryVariation = MONTHLY_SALARY + randomBetween(-500, 2000) // small variation for bonus
      balance += salaryVariation
      transactions.push({
        id: generateId(),
        userId: USER_ID,
        type: "credit",
        amount: salaryVariation,
        category: salarySource.category,
        subcategory: salarySource.subcategory,
        description: `Salary credit for ${currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`,
        merchant: salarySource.name,
        paymentMethod: pickRandom(salarySource.paymentMethods),
        status: "completed",
        date: new Date(year, month, day, randomBetween(9, 11), randomBetween(0, 59)).toISOString(),
        dayOfWeek,
        hourOfDay: randomBetween(9, 11),
        isRecurring: true,
        tags: salarySource.tags.join(","),
        balanceAfter: balance,
        spendingCluster: null,
        sizeCluster: null,
        temporalCluster: null,
        categoryCluster: null,
        isAnomaly: false,
        anomalyScore: null,
      })
    }

    // ── Monthly recurring debits (rent, EMI, insurance, utilities, subscriptions) ──
    if (day <= 5) {
      const monthlyMerchants = DEBIT_MERCHANTS.filter(
        (m) => m.frequency === "monthly" && m.isRecurring
      )
      for (const merchant of monthlyMerchants) {
        if (day === randomBetween(1, 5) || (day === 1 && merchant.category === "rent")) {
          const amount = merchant.amountRange[0] === merchant.amountRange[1]
            ? merchant.amountRange[0]
            : randomFloat(merchant.amountRange[0], merchant.amountRange[1])
          balance -= amount
          const hour = randomBetween(merchant.hourRange[0], merchant.hourRange[1])
          transactions.push({
            id: generateId(),
            userId: USER_ID,
            type: "debit",
            amount,
            category: merchant.category,
            subcategory: merchant.subcategory,
            description: `${merchant.name} - ${currentDate.toLocaleDateString("en-IN", { month: "short" })} payment`,
            merchant: merchant.name,
            paymentMethod: pickRandom(merchant.paymentMethods),
            status: "completed",
            date: new Date(year, month, day, hour, randomBetween(0, 59)).toISOString(),
            dayOfWeek,
            hourOfDay: hour,
            isRecurring: true,
            tags: merchant.tags.join(","),
            balanceAfter: balance,
            spendingCluster: null,
            sizeCluster: null,
            temporalCluster: null,
            categoryCluster: null,
            isAnomaly: false,
            anomalyScore: null,
          })
        }
      }
    }

    // ── Daily variable spending ──
    const dailyTransactionCount = dayOfWeek === 0 || dayOfWeek === 6
      ? randomBetween(2, 5) // weekends: more spending
      : randomBetween(1, 4) // weekdays

    for (let i = 0; i < dailyTransactionCount; i++) {
      // Pick a random non-recurring merchant
      const eligibleMerchants = DEBIT_MERCHANTS.filter((m) => !m.isRecurring)

      // Weight selection: food/transport more likely
      const weights: Record<string, number> = {
        food_dining: 4,
        groceries: 2,
        transportation: 3,
        fuel: 1,
        shopping: 2,
        entertainment: dayOfWeek === 0 || dayOfWeek === 6 ? 3 : 1,
        healthcare: 0.3,
        education: 0.2,
        personal_care: 0.5,
        travel: 0.3,
        charity: 0.1,
        miscellaneous: 1,
      }

      // Weighted random selection
      const weightedMerchants: MerchantDef[] = []
      for (const m of eligibleMerchants) {
        const weight = weights[m.category] || 1
        for (let w = 0; w < weight * 10; w++) {
          weightedMerchants.push(m)
        }
      }

      const merchant = pickRandom(weightedMerchants)
      const amount = randomFloat(merchant.amountRange[0], merchant.amountRange[1])
      balance -= amount
      const hour = randomBetween(merchant.hourRange[0], Math.min(merchant.hourRange[1], 23))

      transactions.push({
        id: generateId(),
        userId: USER_ID,
        type: "debit",
        amount,
        category: merchant.category,
        subcategory: merchant.subcategory,
        description: `${merchant.name} purchase`,
        merchant: merchant.name,
        paymentMethod: pickRandom(merchant.paymentMethods),
        status: Math.random() > 0.98 ? "failed" : "completed", // 2% fail rate
        date: new Date(year, month, day, hour, randomBetween(0, 59)).toISOString(),
        dayOfWeek,
        hourOfDay: hour,
        isRecurring: false,
        tags: merchant.tags.join(","),
        balanceAfter: balance,
        spendingCluster: null,
        sizeCluster: null,
        temporalCluster: null,
        categoryCluster: null,
        isAnomaly: false,
        anomalyScore: null,
      })
    }

    // ── Occasional credits (freelance, dividends, refunds) ──
    if (Math.random() < 0.08) {
      // ~8% chance per day
      const creditSource = pickRandom(CREDIT_SOURCES.slice(1)) // exclude salary
      const amount = randomFloat(creditSource.amountRange[0], creditSource.amountRange[1])
      balance += amount
      const hour = randomBetween(creditSource.hourRange[0], creditSource.hourRange[1])

      transactions.push({
        id: generateId(),
        userId: USER_ID,
        type: "credit",
        amount,
        category: creditSource.category,
        subcategory: creditSource.subcategory,
        description: `${creditSource.name} - ${creditSource.subcategory.replace(/_/g, " ")}`,
        merchant: creditSource.name,
        paymentMethod: pickRandom(creditSource.paymentMethods),
        status: "completed",
        date: new Date(year, month, day, hour, randomBetween(0, 59)).toISOString(),
        dayOfWeek,
        hourOfDay: hour,
        isRecurring: false,
        tags: creditSource.tags.join(","),
        balanceAfter: balance,
        spendingCluster: null,
        sizeCluster: null,
        temporalCluster: null,
        categoryCluster: null,
        isAnomaly: false,
        anomalyScore: null,
      })
    }

    // ── Inject some anomalous transactions (large unusual purchases) ──
    if (Math.random() < 0.01) {
      // ~1% chance = anomalies
      const anomalyMerchants = [
        { name: "International Transfer", category: "transfer", amount: randomBetween(25000, 75000) },
        { name: "Luxury Store Purchase", category: "shopping", amount: randomBetween(15000, 50000) },
        { name: "Emergency Hospital", category: "healthcare", amount: randomBetween(10000, 40000) },
        { name: "Late Night Online Shopping", category: "shopping", amount: randomBetween(8000, 30000) },
      ]
      const anomaly = pickRandom(anomalyMerchants)
      balance -= anomaly.amount
      const hour = randomBetween(0, 23)

      transactions.push({
        id: generateId(),
        userId: USER_ID,
        type: "debit",
        amount: anomaly.amount,
        category: anomaly.category,
        subcategory: "anomalous",
        description: `${anomaly.name} - unusual transaction`,
        merchant: anomaly.name,
        paymentMethod: pickRandom(["credit_card", "net_banking", "neft"]),
        status: "completed",
        date: new Date(year, month, day, hour, randomBetween(0, 59)).toISOString(),
        dayOfWeek,
        hourOfDay: hour,
        isRecurring: false,
        tags: "anomaly,unusual,flagged",
        balanceAfter: balance,
        spendingCluster: null,
        sizeCluster: null,
        temporalCluster: null,
        categoryCluster: null,
        isAnomaly: false, // ML will determine this
        anomalyScore: null,
      })
    }

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Sort by date
  transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return transactions
}

// ─── Generate and Save ─────────────────────────────────────

function main() {
  console.log("🏦 FinFlow Seed Data Generator")
  console.log("================================")

  const transactions = generateTransactions()

  // Stats
  const credits = transactions.filter((t) => t.type === "credit")
  const debits = transactions.filter((t) => t.type === "debit")
  const totalCredit = credits.reduce((sum, t) => sum + t.amount, 0)
  const totalDebit = debits.reduce((sum, t) => sum + t.amount, 0)
  const categories = new Set(transactions.map((t) => t.category))
  const merchants = new Set(transactions.map((t) => t.merchant))

  console.log(`\n📊 Generation Summary:`)
  console.log(`   Total Transactions: ${transactions.length}`)
  console.log(`   Credits: ${credits.length} (₹${totalCredit.toLocaleString("en-IN")})`)
  console.log(`   Debits: ${debits.length} (₹${totalDebit.toLocaleString("en-IN")})`)
  console.log(`   Net Flow: ₹${(totalCredit - totalDebit).toLocaleString("en-IN")}`)
  console.log(`   Categories: ${categories.size}`)
  console.log(`   Unique Merchants: ${merchants.size}`)
  console.log(`   Date Range: ${transactions[0].date.split("T")[0]} to ${transactions[transactions.length - 1].date.split("T")[0]}`)
  console.log(`   Final Balance: ₹${transactions[transactions.length - 1].balanceAfter.toLocaleString("en-IN")}`)

  // Write to ml-service/data
  const outputDir = path.join(__dirname, "..", "..", "ml-service", "data")
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = path.join(outputDir, "transactions.json")
  fs.writeFileSync(outputPath, JSON.stringify(transactions, null, 2))
  console.log(`\n✅ Data written to: ${outputPath}`)

  // Also write a summary stats file
  const stats = {
    generatedAt: new Date().toISOString(),
    totalTransactions: transactions.length,
    dateRange: {
      start: transactions[0].date,
      end: transactions[transactions.length - 1].date,
    },
    summary: {
      totalCredits: credits.length,
      totalDebits: debits.length,
      totalCreditAmount: Math.round(totalCredit),
      totalDebitAmount: Math.round(totalDebit),
      netFlow: Math.round(totalCredit - totalDebit),
      initialBalance: INITIAL_BALANCE,
      finalBalance: Math.round(transactions[transactions.length - 1].balanceAfter),
    },
    categoryBreakdown: Array.from(categories).map((cat) => {
      const catTxns = transactions.filter((t) => t.category === cat)
      return {
        category: cat,
        count: catTxns.length,
        totalAmount: Math.round(catTxns.reduce((s, t) => s + t.amount, 0)),
        avgAmount: Math.round(catTxns.reduce((s, t) => s + t.amount, 0) / catTxns.length),
      }
    }).sort((a, b) => b.totalAmount - a.totalAmount),
  }

  fs.writeFileSync(
    path.join(outputDir, "data_summary.json"),
    JSON.stringify(stats, null, 2)
  )
  console.log(`📋 Summary written to: ${path.join(outputDir, "data_summary.json")}`)
}

main()
