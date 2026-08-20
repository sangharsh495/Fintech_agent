/**
 * app/api/tax/filing/json/route.ts
 *
 * Generates the ITD e-filing JSON for the current draft.
 *
 * The identity, address and bank details required by the schema are NOT stored
 * in the app's profile in full (there is no house number or IFSC on
 * user_profiles), so they are supplied by the wizard on this request and used
 * for generation only — never persisted beyond the generated file itself.
 *
 * Generation always runs validation first. A payload with any error-severity
 * issue returns 422 with the issue list rather than a downloadable file the
 * portal would reject.
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
} from "@/server/services/tax/filing.service"
import {
  generateITRJSON,
  stateCodeFor,
  type ITRPayload,
} from "@/server/services/tax/itr-json-builder"

const jsonRequestSchema = z.object({
  fy: z.string().optional(),
  identity: z.object({
    pan: z.string().trim().length(10),
    firstName: z.string().trim().min(1).max(64),
    middleName: z.string().trim().max(64).optional(),
    lastName: z.string().trim().min(1).max(64),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD"),
    mobile: z.string().trim().min(10).max(13),
    email: z.string().email(),
    aadhaar: z.string().trim().optional(),
  }),
  address: z.object({
    flatDoorBlock: z.string().trim().min(1).max(128),
    premisesName: z.string().trim().max(128).optional(),
    roadStreet: z.string().trim().max(128).optional(),
    areaLocality: z.string().trim().min(1).max(128),
    city: z.string().trim().min(1).max(64),
    /** Either an ITD numeric code or a state name we can resolve. */
    state: z.string().trim().min(2).max(64),
    pincode: z.string().trim().regex(/^\d{6}$/),
  }),
  bankAccounts: z
    .array(
      z.object({
        ifsc: z.string().trim().min(11).max(11),
        bankName: z.string().trim().min(1).max(128),
        accountNumber: z.string().trim().min(5).max(20),
        isRefundAccount: z.boolean(),
      })
    )
    .min(1)
    .max(10),
  tdsEntries: z
    .array(
      z.object({
        deductorName: z.string().trim().min(1).max(128),
        deductorTAN: z.string().trim().length(10),
        incomeCharged: z.number().nonnegative(),
        taxDeducted: z.number().nonnegative(),
      })
    )
    .optional(),
  taxPayments: z
    .array(
      z.object({
        bsrCode: z.string().trim().min(7).max(7),
        dateOfDeposit: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        challanSerialNumber: z.string().trim().min(1).max(10),
        amount: z.number().nonnegative(),
      })
    )
    .optional(),
  filingSection: z.enum(["139(1)", "139(4)", "139(5)"]).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  let body: z.infer<typeof jsonRequestSchema>
  try {
    body = jsonRequestSchema.parse(await req.json())
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Some filing details are missing or malformed.",
          issues: error.errors.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
            severity: "error" as const,
          })),
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const financialYear = resolveFinancialYear(body.fy ?? null)
  if (!financialYear) {
    return NextResponse.json({ error: "Unsupported financial year" }, { status: 400 })
  }

  // A state name is friendlier to collect than a two-digit ITD code, so accept
  // either and resolve here.
  const stateCode = /^\d{2}$/.test(body.address.state)
    ? body.address.state
    : stateCodeFor(body.address.state)

  if (!stateCode) {
    return NextResponse.json(
      {
        error: `"${body.address.state}" is not a recognised Indian state or union territory.`,
        issues: [{ field: "address.state", message: "Unrecognised state", severity: "error" }],
      },
      { status: 400 }
    )
  }

  return withUserScopedDb(userId, async (db) => {
    try {
      const savedInputs = await loadWizardInputs(db, userId, financialYear)
      const draft = await buildFilingDraft(db, userId, financialYear, savedInputs)

      // The engine's Chapter VI-A figures drive Schedule VIA, so the file can
      // never disagree with the computation shown in the wizard.
      const deductions = draft.reconciliation.input.deductions
      const chapterVIA: Record<string, number> = {}
      const addSection = (label: string, amount: number) => {
        if (amount > 0) chapterVIA[label] = amount
      }
      addSection("80C", deductions.section80C)
      addSection("80CCD1B", deductions.section80CCD1B)
      addSection("80CCD2", deductions.section80CCD2)
      addSection("80D", deductions.section80D)
      addSection("80DD", deductions.section80DD)
      addSection("80DDB", deductions.section80DDB)
      addSection("80E", deductions.section80E)
      addSection("80EEA", deductions.section80EEA)
      addSection("80EEB", deductions.section80EEB)
      addSection("80G", deductions.section80G)
      addSection("80GG", deductions.section80GG)
      addSection("80TTA", deductions.section80TTA)
      addSection("80TTB", deductions.section80TTB)
      addSection("80U", deductions.section80U)

      const form16 = draft.documents.form16

      const payload: ITRPayload = {
        form: draft.itrSelection.form,
        userProfile: {
          pan: body.identity.pan.toUpperCase(),
          firstName: body.identity.firstName,
          middleName: body.identity.middleName,
          lastName: body.identity.lastName,
          dob: body.identity.dob,
          mobile: body.identity.mobile,
          email: body.identity.email,
          aadhaar: body.identity.aadhaar,
          address: {
            flatDoorBlock: body.address.flatDoorBlock,
            premisesName: body.address.premisesName,
            roadStreet: body.address.roadStreet,
            areaLocality: body.address.areaLocality,
            city: body.address.city,
            stateCode,
            pincode: body.address.pincode,
          },
        },
        bankAccounts: body.bankAccounts,
        taxComputation: draft.computation,
        tdsEntries:
          body.tdsEntries ??
          // Fall back to the employer TDS the Form 16 already certifies.
          (form16 && form16.totalTdsDeposited > 0 && form16.employer.tan
            ? [
                {
                  deductorName: form16.employer.name ?? "Employer",
                  deductorTAN: form16.employer.tan,
                  incomeCharged: form16.grossSalary,
                  taxDeducted: form16.totalTdsDeposited,
                },
              ]
            : undefined),
        taxPayments: body.taxPayments,
        salaryDetail: form16
          ? {
              grossSalary: form16.grossSalary,
              perquisites: form16.perquisites,
              profitsInLieu: form16.profitsInLieu,
              exemptSection10: form16.exemptions.total,
              standardDeduction: form16.standardDeduction,
              professionalTax: form16.professionalTax,
            }
          : undefined,
        chapterVIA,
        capitalGains: savedInputs.capitalGains,
        filingSection: body.filingSection,
      }

      const result = generateITRJSON(payload)

      // The draft row must exist before the update below can land on it — a
      // user can reach this endpoint without ever having saved the wizard.
      await persistFilingDraft(db, userId, draft, savedInputs)

      // Persist the attempt either way — the validation issues are as useful to
      // the user as the file would have been.
      await db
        .update(taxFilings)
        .set({
          itrForm: result.form,
          itrJson: result.isValid ? (result.json as Record<string, unknown>) : null,
          validationIssues: result.issues,
          status: result.isValid ? "json_generated" : "reconciled",
          jsonGeneratedAt: result.isValid ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(and(eq(taxFilings.userId, userId), eq(taxFilings.financialYear, financialYear)))

      if (!result.isValid) {
        return NextResponse.json(
          {
            error: "The return cannot be generated yet — fix the issues below and try again.",
            issues: result.issues,
            form: result.form,
          },
          { status: 422 }
        )
      }

      return NextResponse.json({
        form: result.form,
        assessmentYear: result.assessmentYear,
        fileName: result.fileName,
        json: result.json,
        warnings: result.issues.filter((issue) => issue.severity === "warning"),
      })
    } catch (error) {
      safeLogError("[TAX FILING JSON]", error)
      return NextResponse.json({ error: "Failed to generate the return" }, { status: 500 })
    }
  })
}
