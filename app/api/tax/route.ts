/**
 * app/api/tax/route.ts
 *
 * The tax overview for a financial year, used by the web /tax page and by the
 * mobile app's tax tab.
 *
 * Computation is delegated to server/services/tax/tax-calculator so this
 * endpoint, the filing wizard and the AI assistant cannot disagree about a
 * number. Reads come from the pre-aggregated tax_summaries table, never from
 * raw transactions.
 *
 * The response is deliberately a superset: flat fields for the web page and
 * nested per-regime objects for the mobile screen. Both name the same figures.
 */

import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { getSession } from "@/server/lib/get-session"
import { withUserScopedDb } from "@/server/db/rls-connection"
import { taxSummaries, userProfiles } from "@/server/db/schema"
import { safeLogError } from "@/server/lib/safe-log"
import { computeIndianTax } from "@/server/services/tax/tax-calculator"
import {
  emptyDeductions,
  normaliseFinancialYear,
  shortFinancialYear,
  type FinancialYear,
} from "@/server/services/tax/types"

/** Chapter VI-A sections the statement pipeline can tag a transaction with. */
const DEDUCTION_SECTIONS: Array<{
  section: string
  label: string
  description: string
  limit: number
  /** Key on DeductionInput this maps to. */
  key: keyof ReturnType<typeof emptyDeductions>
}> = [
  { section: "80C", label: "Section 80C", description: "PPF, ELSS, LIC premium, EPF, tuition fees", limit: 150000, key: "section80C" },
  { section: "80CCD(1B)", label: "Section 80CCD(1B)", description: "Additional NPS Tier-1 contribution", limit: 50000, key: "section80CCD1B" },
  { section: "80D", label: "Section 80D", description: "Health insurance premium for you and your parents", limit: 75000, key: "section80D" },
  { section: "80E", label: "Section 80E", description: "Interest on an education loan (no upper limit)", limit: 0, key: "section80E" },
  { section: "80G", label: "Section 80G", description: "Donations to approved institutions", limit: 0, key: "section80G" },
  { section: "80TTA", label: "Section 80TTA", description: "Savings bank interest", limit: 10000, key: "section80TTA" },
]

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const requestedFy = req.nextUrl.searchParams.get("fy") ?? "2025-26"
  const financialYear: FinancialYear = normaliseFinancialYear(requestedFy) ?? "2025-2026"
  const shortFy = shortFinancialYear(financialYear)

  return withUserScopedDb(userId, async (db) => {
    try {
      const [profile] = await db
        .select({ taxRegime: userProfiles.taxRegime, dob: userProfiles.dob })
        .from(userProfiles)
        .where(eq(userProfiles.userId, userId))
        .limit(1)

      const taxRegime: "old" | "new" = profile?.taxRegime ?? "new"

      // Age changes the old-regime basic exemption and the 80D/80TTB ceilings.
      let age = 35
      if (profile?.dob) {
        const dob = new Date(profile.dob)
        if (!Number.isNaN(dob.getTime())) {
          const now = new Date()
          age = now.getFullYear() - dob.getFullYear()
          if (
            now.getMonth() < dob.getMonth() ||
            (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
          ) {
            age--
          }
        }
      }

      // ── Read from the aggregate table ──
      const summaries = await db
        .select({
          section: taxSummaries.section,
          category: taxSummaries.category,
          type: taxSummaries.type,
          totalAmount: taxSummaries.totalAmount,
          txCount: taxSummaries.txCount,
        })
        .from(taxSummaries)
        .where(and(eq(taxSummaries.userId, userId), eq(taxSummaries.fy, shortFy)))

      const sumWhere = (predicate: (row: (typeof summaries)[number]) => boolean) =>
        summaries.filter(predicate).reduce((total, row) => total + (parseFloat(row.totalAmount) || 0), 0)

      const grossIncome = sumWhere((row) => row.category === "salary" && row.type === "credit")
      const savingsInterest = sumWhere((row) => row.type === "credit" && /interest/i.test(row.category))
      const rentalIncome = sumWhere((row) => row.category === "rental_income" && row.type === "credit")

      // ── Assemble deductions ──
      const deductions = emptyDeductions()
      const deductionList = DEDUCTION_SECTIONS.map((definition) => {
        const detected = sumWhere((row) => row.section === definition.section && row.type === "debit")
        deductions[definition.key] = detected
        return {
          section: definition.section,
          label: definition.label,
          description: definition.description,
          amount: detected,
          limit: definition.limit || null,
          detected: detected > 0,
        }
      }).filter((item) => item.amount > 0)

      // 80TTA is capped by the interest actually earned, not by spending.
      deductions.section80TTA = Math.min(savingsInterest, 10000)

      // ── Run the deterministic engine ──
      const result = computeIndianTax({
        financialYear,
        age,
        salaryIncome: grossIncome,
        hraExemption: 0,
        ltaExemption: 0,
        professionalTax: 0,
        // 30% standard deduction under Sec 24(a) on let-out property.
        housePropertyIncome: rentalIncome * 0.7,
        presumptiveIncome44ADA: 0,
        presumptiveIncome44AD: 0,
        businessIncome: 0,
        shortTermCapitalGains111A: 0,
        longTermCapitalGains112A: 0,
        otherCapitalGains: 0,
        otherSourcesIncome: 0,
        savingsInterest,
        deductions,
      })

      const active = taxRegime === "old" ? result.old : result.new
      const effectiveRate =
        active.grossTotalIncome > 0
          ? Math.round((active.totalTaxPayable / active.grossTotalIncome) * 1000) / 10
          : 0

      // ── Opportunities ──
      const opportunities: string[] = []
      const remaining80C = Math.max(0, 150000 - deductions.section80C)
      if (remaining80C > 0 && taxRegime === "old") {
        opportunities.push(
          `Investing ₹${remaining80C.toLocaleString("en-IN")} more under Section 80C (ELSS, PPF or LIC) would reduce your taxable income by the same amount. The saving depends on your marginal slab.`
        )
      }
      if (deductions.section80CCD1B < 50000) {
        opportunities.push(
          "Section 80CCD(1B) allows an extra ₹50,000 for NPS Tier-1, over and above the 80C ceiling. It is available under the old regime only."
        )
      }
      if (result.recommendedRegime.toLowerCase() !== taxRegime && result.savingsWithRecommended > 0) {
        opportunities.push(
          `The ${result.recommendedRegime === "OLD" ? "old" : "new"} regime would cost ₹${result.savingsWithRecommended.toLocaleString("en-IN")} less on these figures. You may switch when you file.`
        )
      }
      if (savingsInterest > 10000 && age < 60) {
        opportunities.push(
          `Savings interest of ₹${Math.round(savingsInterest).toLocaleString("en-IN")} exceeds the ₹10,000 Section 80TTA limit. The excess is taxable at your slab rate.`
        )
      }

      const shapeRegime = (computation: typeof result.old) => ({
        regime: computation.regime,
        grossTotalIncome: computation.grossTotalIncome,
        totalDeductions: computation.totalDeductions,
        taxableIncome: computation.taxableIncome,
        taxPayable: computation.totalTaxPayable,
        effectiveRate:
          computation.grossTotalIncome > 0
            ? Math.round((computation.totalTaxPayable / computation.grossTotalIncome) * 1000) / 10
            : 0,
        rebate87A: computation.rebate87A,
        surcharge: computation.surcharge,
        cess: computation.cess,
        workings: computation.workings,
      })

      return NextResponse.json({
        // ── Shared ──
        fy: shortFy,
        financialYear,
        assessmentYear: result.assessmentYear,
        hasData: grossIncome > 0 || summaries.length > 0,

        // ── Mobile shape ──
        regime: taxRegime,
        oldRegime: shapeRegime(result.old),
        newRegime: shapeRegime(result.new),
        savingsComparison: result.savingsWithRecommended,
        deductionList,
        suggestions: opportunities,

        // ── Web shape (unchanged field names) ──
        grossIncome: active.grossTotalIncome,
        taxRegime,
        deductions: {
          "80C": deductions.section80C,
          "80D": deductions.section80D,
          "80E": deductions.section80E,
          "80G": deductions.section80G,
          "80TTA": deductions.section80TTA,
          standard: grossIncome > 0 ? (taxRegime === "old" ? 50000 : 75000) : 0,
          total: active.totalDeductions,
        },
        taxableIncome: active.taxableIncome,
        taxPayable: active.totalTaxPayable,
        effectiveRate,
        oldRegimeTax: result.totalTaxPayableOld,
        newRegimeTax: result.totalTaxPayableNew,
        betterRegime: result.recommendedRegime.toLowerCase(),
        savingsVsOtherRegime: result.savingsWithRecommended,
        opportunities,
        drillDownAvailable: true,
      })
    } catch (error) {
      safeLogError("[TAX]", error)
      return NextResponse.json({ error: "Failed to calculate tax" }, { status: 500 })
    }
  })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  return withUserScopedDb(session.user.id, async (db) => {
    try {
      const { regime } = await req.json()
      if (!["old", "new"].includes(regime)) {
        return NextResponse.json({ error: "Invalid regime" }, { status: 400 })
      }

      await db
        .update(userProfiles)
        .set({ taxRegime: regime, updatedAt: new Date() })
        .where(eq(userProfiles.userId, session.user.id))

      return NextResponse.json({ success: true, regime })
    } catch (error) {
      safeLogError("[TAX REGIME]", error)
      return NextResponse.json({ error: "Failed to update regime" }, { status: 500 })
    }
  })
}
