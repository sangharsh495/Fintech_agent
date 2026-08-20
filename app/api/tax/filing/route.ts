/**
 * app/api/tax/filing/route.ts
 *
 * The filing draft for one financial year.
 *
 * GET  — returns the saved draft, or builds a fresh one if none exists.
 * POST — rebuilds the draft from the current documents plus the user's
 *        wizard inputs (deductions, capital gains, declarations) and saves it.
 *
 * The engine runs server-side on every request rather than trusting client-sent
 * figures: the numbers on a return must be derivable from what the user
 * uploaded, not from what a browser posted.
 */

import { NextRequest, NextResponse } from "next/server"
import { eq, and } from "drizzle-orm"
import { z } from "zod"
import { getSession } from "@/server/lib/get-session"
import { withUserScopedDb } from "@/server/db/rls-connection"
import { taxFilings } from "@/server/db/schema"
import { safeLogError } from "@/server/lib/safe-log"
import {
  buildFilingDraft,
  loadWizardInputs,
  persistFilingDraft,
  resolveFinancialYear,
  type BuildFilingOptions,
} from "@/server/services/tax/filing.service"
import { RATE_SPLIT_CAVEAT } from "@/server/services/tax/tax-calculator"

// ─── Request schema ─────────────────────────────────────────

const nonNegative = z.number().nonnegative().max(1_000_000_000)

const filingRequestSchema = z.object({
  fy: z.string().optional(),
  userDeductions: z
    .object({
      section80C: nonNegative.optional(),
      section80CCD1B: nonNegative.optional(),
      section80CCD2: nonNegative.optional(),
      section80D: nonNegative.optional(),
      section80DD: nonNegative.optional(),
      section80DDB: nonNegative.optional(),
      section80E: nonNegative.optional(),
      section80EEA: nonNegative.optional(),
      section80EEB: nonNegative.optional(),
      section80G: nonNegative.optional(),
      section80GG: nonNegative.optional(),
      section80TTA: nonNegative.optional(),
      section80TTB: nonNegative.optional(),
      section80U: nonNegative.optional(),
      section24b: nonNegative.optional(),
      otherDeductions: nonNegative.optional(),
    })
    .optional(),
  capitalGains: z
    .object({
      stcg111A: nonNegative,
      ltcg112A: nonNegative,
      otherCapitalGains: nonNegative,
    })
    .optional(),
  presumptive: z
    .object({
      scheme: z.enum(["44AD", "44ADA", "44AE"]),
      turnover: nonNegative,
      income: nonNegative,
    })
    .optional(),
  advanceTaxPaid: nonNegative.optional(),
  regimeOverride: z.enum(["OLD", "NEW"]).optional(),
  declarations: z
    .object({
      hasForeignAssets: z.boolean().optional(),
      hasForeignIncome: z.boolean().optional(),
      isCompanyDirector: z.boolean().optional(),
      holdsUnlistedEquity: z.boolean().optional(),
      hasFnOTrading: z.boolean().optional(),
      housePropertyCount: z.number().int().min(0).max(20).optional(),
      agriculturalIncome: nonNegative.optional(),
    })
    .optional(),
})

// ─── Response shaping ───────────────────────────────────────

function shapeDraft(draft: Awaited<ReturnType<typeof buildFilingDraft>>) {
  const chosen = draft.selectedRegime === "OLD" ? draft.computation.old : draft.computation.new

  return {
    financialYear: draft.financialYear,
    assessmentYear: draft.assessmentYear,
    selectedRegime: draft.selectedRegime,
    recommendedRegime: draft.computation.recommendedRegime,
    savingsWithRecommended: draft.computation.savingsWithRecommended,

    computation: draft.computation,
    summary: {
      grossTotalIncome: chosen.grossTotalIncome,
      totalDeductions: chosen.totalDeductions,
      taxableIncome: chosen.taxableIncome,
      totalTaxPayable: chosen.totalTaxPayable,
      taxCredit: draft.reconciliation.totalTaxCredit,
      netPayable: chosen.netPayable,
      refundDue: Math.max(0, -chosen.netPayable),
    },

    itrForm: draft.itrSelection.form,
    itrFormReasons: draft.itrSelection.reasons,
    itrFormDisqualifiers: draft.itrSelection.disqualifiers,
    itrFormWarnings: draft.itrSelection.warnings,

    findings: draft.reconciliation.findings,
    gaps: draft.reconciliation.gaps,
    sourcesUsed: draft.reconciliation.sourcesUsed,

    documentsAvailable: {
      form16: Boolean(draft.documents.form16),
      ais: Boolean(draft.documents.ais),
      cas: Boolean(draft.documents.cas),
    },

    profile: {
      pan: draft.context.pan,
      fullName: draft.context.fullName,
      age: draft.context.age,
      city: draft.context.city,
      state: draft.context.state,
      hasBankAccount: draft.context.bankAccountCount > 0,
    },

    caveats:
      draft.financialYear === "2024-2025" && chosen.specialRateTax > 0
        ? [RATE_SPLIT_CAVEAT]
        : [],
  }
}

// ─── GET ────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const financialYear = resolveFinancialYear(req.nextUrl.searchParams.get("fy"))
  if (!financialYear) {
    return NextResponse.json({ error: "Unsupported financial year" }, { status: 400 })
  }

  return withUserScopedDb(userId, async (db) => {
    try {
      const [saved] = await db
        .select()
        .from(taxFilings)
        .where(and(eq(taxFilings.userId, userId), eq(taxFilings.financialYear, financialYear)))
        .limit(1)

      // Always recompute: documents may have been added since the draft was
      // saved, and a stale computation on a tax return is worse than a slow one.
      // The user's own declarations are replayed on top so a rebuild never
      // silently drops a deduction they entered.
      const savedInputs = await loadWizardInputs(db, userId, financialYear)
      const draft = await buildFilingDraft(db, userId, financialYear, {
        ...savedInputs,
        regimeOverride:
          (saved?.selectedRegime as "OLD" | "NEW" | undefined) ?? savedInputs.regimeOverride,
      })

      return NextResponse.json({
        ...shapeDraft(draft),
        status: saved?.status ?? "draft",
        acknowledgementNumber: saved?.acknowledgementNumber ?? null,
        filedAt: saved?.filedAt ?? null,
        hasGeneratedJson: Boolean(saved?.itrJson),
      })
    } catch (error) {
      safeLogError("[TAX FILING GET]", error)
      return NextResponse.json({ error: "Failed to build the filing draft" }, { status: 500 })
    }
  })
}

// ─── POST ───────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  let body: z.infer<typeof filingRequestSchema>
  try {
    body = filingRequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message ?? "Invalid request" }, { status: 400 })
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const financialYear = resolveFinancialYear(body.fy ?? null)
  if (!financialYear) {
    return NextResponse.json({ error: "Unsupported financial year" }, { status: 400 })
  }

  return withUserScopedDb(userId, async (db) => {
    try {
      // Only keys the client actually sent take part in the merge — spreading
      // an explicit `undefined` would erase a previously saved declaration.
      const options: BuildFilingOptions = {}
      if (body.userDeductions !== undefined) options.userDeductions = body.userDeductions
      if (body.capitalGains !== undefined) options.capitalGains = body.capitalGains
      if (body.presumptive !== undefined) options.presumptive = body.presumptive
      if (body.advanceTaxPaid !== undefined) options.advanceTaxPaid = body.advanceTaxPaid
      if (body.regimeOverride !== undefined) options.regimeOverride = body.regimeOverride
      if (body.declarations !== undefined) options.declarations = body.declarations

      // Merge over what was already declared so a partial update (e.g. only
      // changing the regime) does not wipe the rest of the wizard.
      const merged: BuildFilingOptions = {
        ...(await loadWizardInputs(db, userId, financialYear)),
        ...options,
      }

      const draft = await buildFilingDraft(db, userId, financialYear, merged)
      await persistFilingDraft(db, userId, draft, merged)

      return NextResponse.json({ ...shapeDraft(draft), status: "reconciled" })
    } catch (error) {
      safeLogError("[TAX FILING POST]", error)
      return NextResponse.json({ error: "Failed to update the filing draft" }, { status: 500 })
    }
  })
}
