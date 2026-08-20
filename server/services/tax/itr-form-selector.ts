/**
 * server/services/tax/itr-form-selector.ts
 *
 * Decides which ITR form a taxpayer must file, and — just as importantly —
 * explains why, because a wrong form is a defective return under Sec 139(9).
 *
 * The rules encoded here are the eligibility conditions published with the
 * ITR-1 (Sahaj) and ITR-4 (Sugam) forms. Both are *restrictive* forms: they may
 * be used only if none of a list of disqualifying conditions apply. The logic
 * therefore works by disqualification, not by pattern matching, so an unhandled
 * situation escalates to a broader form rather than silently choosing a
 * narrower one.
 */

export type ITRForm = "ITR-1" | "ITR-2" | "ITR-3" | "ITR-4"

export interface TaxpayerProfile {
  /** Total income for the year, in rupees. */
  grossIncome: number
  residentialStatus?: "RESIDENT" | "RNOR" | "NON_RESIDENT"
  age?: number

  hasSalaryIncome: boolean
  /** Number of house properties owned and reported. */
  housePropertyCount: number
  /** Any brought-forward or current-year house property loss to carry forward. */
  hasHousePropertyLossCarryForward?: boolean

  hasBusinessIncome: boolean
  hasPresumptiveIncome: boolean
  /** Turnover for a presumptive claim, used to test the 44AD/44ADA ceilings. */
  presumptiveTurnover?: number
  presumptiveScheme?: "44AD" | "44ADA" | "44AE"
  /** F&O and intraday are business income, never capital gains. */
  hasFnOTrading: boolean

  hasCapitalGains: boolean
  hasForeignAssets: boolean
  hasForeignIncome?: boolean
  /** Agricultural income above Rs. 5,000 disqualifies ITR-1 and ITR-4. */
  agriculturalIncome?: number
  /** Winnings from lottery, betting, or online gaming (Sec 115BB/115BBJ). */
  hasLotteryOrGamblingIncome?: boolean
  /** Director in any company, or holder of unlisted equity shares. */
  isCompanyDirector?: boolean
  holdsUnlistedEquity?: boolean
  /** TDS deducted under Sec 194N on large cash withdrawals. */
  hasSection194NTds?: boolean
  /** ESOP tax deferred by an eligible start-up under Sec 191(2)/192(1C). */
  hasDeferredESOPTax?: boolean
}

export interface ITRSelection {
  form: ITRForm
  /** Plain-language reasons the chosen form is the right one. */
  reasons: string[]
  /** Conditions that ruled out a simpler form. */
  disqualifiers: string[]
  /** Things the user must confirm before filing — not blockers, but risks. */
  warnings: string[]
}

const ITR1_INCOME_CEILING = 5000000
const ITR4_INCOME_CEILING = 5000000
const SEC_44AD_TURNOVER_CEILING = 30000000 // Rs. 3 crore, with the 95% digital receipts condition
const SEC_44ADA_TURNOVER_CEILING = 7500000 // Rs. 75 lakh, with the 95% digital receipts condition

export function determineITRForm(profile: TaxpayerProfile): ITRSelection {
  const disqualifiers: string[] = []
  const warnings: string[] = []

  // ── Conditions that bar BOTH of the simplified forms (ITR-1 and ITR-4) ──

  const simplifiedFormBars: string[] = []

  if (profile.residentialStatus && profile.residentialStatus !== "RESIDENT") {
    simplifiedFormBars.push("You are not a resident and ordinarily resident — ITR-1 and ITR-4 are for residents only.")
  }
  if (profile.hasForeignAssets) {
    simplifiedFormBars.push("You hold assets outside India, which must be reported in Schedule FA.")
  }
  if (profile.hasForeignIncome) {
    simplifiedFormBars.push("You have income from a source outside India.")
  }
  if ((profile.agriculturalIncome ?? 0) > 5000) {
    simplifiedFormBars.push("Agricultural income exceeds Rs. 5,000.")
  }
  if (profile.isCompanyDirector) {
    simplifiedFormBars.push("You are a director in a company.")
  }
  if (profile.holdsUnlistedEquity) {
    simplifiedFormBars.push("You held unlisted equity shares at any time during the year.")
  }
  if (profile.hasLotteryOrGamblingIncome) {
    simplifiedFormBars.push("You have winnings taxable at the special rate under Sec 115BB / 115BBJ.")
  }
  if (profile.hasDeferredESOPTax) {
    simplifiedFormBars.push("Tax on start-up ESOPs has been deferred under Sec 191(2).")
  }
  if (profile.housePropertyCount > 1) {
    simplifiedFormBars.push("You own more than one house property.")
  }
  if (profile.hasHousePropertyLossCarryForward) {
    simplifiedFormBars.push("You are carrying forward a loss under the head house property.")
  }

  // ── ITR-3: business or professional income on regular books ──

  if (profile.hasFnOTrading) {
    disqualifiers.push("Futures & options and intraday trading are business income, not capital gains.")
    return {
      form: "ITR-3",
      reasons: [
        "F&O and intraday trading are treated as business income under Sec 28, which only ITR-3 can report.",
        "ITR-3 also accommodates any salary, house property, capital gains and other-source income you have.",
      ],
      disqualifiers,
      warnings: [
        ...warnings,
        "Business income requires a profit & loss account and balance sheet in Schedule P&L and Schedule BS. A tax audit under Sec 44AB may apply depending on turnover and profit.",
      ],
    }
  }

  if (profile.hasBusinessIncome && !profile.hasPresumptiveIncome) {
    disqualifiers.push("You have business or professional income assessed on regular books of account.")
    return {
      form: "ITR-3",
      reasons: [
        "Business or professional income computed on regular books can only be reported in ITR-3.",
      ],
      disqualifiers,
      warnings: [
        ...warnings,
        "Check whether a tax audit under Sec 44AB is required before filing.",
      ],
    }
  }

  // ── ITR-4 (Sugam): presumptive income ──

  if (profile.hasPresumptiveIncome) {
    const turnover = profile.presumptiveTurnover ?? 0
    const scheme = profile.presumptiveScheme

    const ceilingBreached =
      (scheme === "44ADA" && turnover > SEC_44ADA_TURNOVER_CEILING) ||
      (scheme === "44AD" && turnover > SEC_44AD_TURNOVER_CEILING)

    if (ceilingBreached) {
      disqualifiers.push(
        `Turnover of Rs. ${turnover.toLocaleString("en-IN")} exceeds the ${scheme} presumptive ceiling, so the presumptive scheme is not available.`
      )
      return {
        form: "ITR-3",
        reasons: ["Turnover exceeds the presumptive scheme ceiling, so income must be computed on regular books in ITR-3."],
        disqualifiers,
        warnings: [...warnings, "A tax audit under Sec 44AB is likely to apply."],
      }
    }

    if (profile.hasCapitalGains) {
      disqualifiers.push("You have capital gains, which ITR-4 (Sugam) cannot report.")
      return {
        form: "ITR-3",
        reasons: [
          "Presumptive business income can be reported in ITR-3 alongside capital gains; ITR-4 has no capital gains schedule.",
        ],
        disqualifiers,
        warnings,
      }
    }

    if (profile.grossIncome > ITR4_INCOME_CEILING) {
      disqualifiers.push(`Total income of Rs. ${profile.grossIncome.toLocaleString("en-IN")} exceeds the Rs. 50,00,000 ITR-4 ceiling.`)
      return {
        form: "ITR-3",
        reasons: ["Total income above Rs. 50,00,000 takes you out of Sugam and into ITR-3."],
        disqualifiers,
        warnings,
      }
    }

    if (simplifiedFormBars.length > 0) {
      disqualifiers.push(...simplifiedFormBars)
      return {
        form: "ITR-3",
        reasons: ["Presumptive income combined with a condition that Sugam does not permit requires ITR-3."],
        disqualifiers,
        warnings,
      }
    }

    if (turnover > 0 && scheme) {
      warnings.push(
        scheme === "44ADA"
          ? "The Rs. 75,00,000 ceiling under Sec 44ADA applies only if at least 95% of receipts are through banking channels; otherwise the limit is Rs. 50,00,000."
          : "The Rs. 3,00,00,000 ceiling under Sec 44AD applies only if at least 95% of receipts are through banking channels; otherwise the limit is Rs. 2,00,00,000."
      )
    }

    return {
      form: "ITR-4",
      reasons: [
        `Income is declared on a presumptive basis under Sec ${scheme ?? "44AD/44ADA"}, which is what Sugam is designed for.`,
        "Total income is within Rs. 50,00,000 and there are no capital gains or foreign assets.",
      ],
      disqualifiers,
      warnings,
    }
  }

  // ── ITR-2: everything a salaried filer can have except business income ──

  if (profile.hasCapitalGains) {
    disqualifiers.push("You have capital gains, which ITR-1 (Sahaj) cannot report.")
  }
  if (profile.grossIncome > ITR1_INCOME_CEILING) {
    disqualifiers.push(`Total income of Rs. ${profile.grossIncome.toLocaleString("en-IN")} exceeds the Rs. 50,00,000 ITR-1 ceiling.`)
  }
  disqualifiers.push(...simplifiedFormBars)

  if (disqualifiers.length > 0) {
    return {
      form: "ITR-2",
      reasons: [
        "ITR-2 covers salary, multiple house properties, capital gains, foreign assets and other sources — everything except business or professional income.",
      ],
      disqualifiers,
      warnings,
    }
  }

  // ── ITR-1 (Sahaj) ──

  if (profile.hasSection194NTds) {
    warnings.push(
      "TDS under Sec 194N on cash withdrawals cannot be claimed as a credit in ITR-1. If you have such a credit, file ITR-2 instead."
    )
  }

  return {
    form: "ITR-1",
    reasons: [
      "Resident individual with salary income, at most one house property and income from other sources.",
      "Total income is within Rs. 50,00,000, with no capital gains, business income, foreign assets or agricultural income above Rs. 5,000.",
    ],
    disqualifiers,
    warnings,
  }
}
