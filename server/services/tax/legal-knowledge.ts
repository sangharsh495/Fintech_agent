/**
 * server/services/tax/legal-knowledge.ts
 *
 * The statutory reference block injected into the Virtual CA's system prompt —
 * the "legal reasoning" half of the dual-core architecture.
 *
 * This exists so the model reasons from a fixed, citable text rather than from
 * whatever it half-remembers about Indian tax law. It carries *rules and
 * limits*, never computed amounts: every rupee figure in an answer must come
 * from the deterministic engine, which is stated as a hard rule in the prompt.
 *
 * Sourced from the Income Tax Act 1961 as amended by the Finance Acts of 2023,
 * 2024 and 2025. Update this file, not the model's expectations, when the law
 * changes.
 */

import type { FinancialYear } from "./types"

// ─── The five heads of income ───────────────────────────────

const HEADS_OF_INCOME = `
THE FIVE HEADS OF INCOME (Sec 14):

1. SALARIES (Sec 15-17)
   - Sec 17(1) salary, 17(2) perquisites, 17(3) profits in lieu of salary.
   - Sec 10(13A) HRA exemption: least of (a) actual HRA, (b) rent paid minus 10%
     of salary, (c) 50% of salary in Delhi/Mumbai/Kolkata/Chennai else 40%.
     OLD REGIME ONLY.
   - Sec 10(5) leave travel concession: two journeys in a block of four calendar
     years, domestic travel only. OLD REGIME ONLY.
   - Sec 16(ia) standard deduction. Sec 16(iii) professional tax: OLD REGIME ONLY.

2. INCOME FROM HOUSE PROPERTY (Sec 22-27)
   - Net annual value = rent received less municipal taxes actually paid.
   - Sec 24(a): flat 30% of net annual value, irrespective of actual spend.
   - Sec 24(b): interest on borrowed capital. Self-occupied property capped at
     Rs. 2,00,000; let-out property uncapped, but the set-off of house property
     loss against other heads is capped at Rs. 2,00,000 a year (Sec 71(3A)),
     with the excess carried forward for 8 years.
   - Under the NEW regime a self-occupied property loss cannot be set off at all.

3. PROFITS AND GAINS OF BUSINESS OR PROFESSION (Sec 28-44DB)
   - Sec 44ADA (professionals): 50% of gross receipts deemed profit, receipts up
     to Rs. 75,00,000 where at least 95% are received through banking channels,
     otherwise Rs. 50,00,000.
   - Sec 44AD (small business): 8% of turnover deemed profit, or 6% on the
     digitally-received portion; turnover up to Rs. 3,00,00,000 on the same 95%
     condition, otherwise Rs. 2,00,00,000.
   - Sec 44AE: goods carriages, per-vehicle presumptive rates.
   - Opting out of 44AD after opting in bars re-entry for five assessment years.
   - Futures & options and intraday equity are business income, NOT capital gains.

4. CAPITAL GAINS (Sec 45-55A)
   - Sec 111A short-term gains on listed equity and equity mutual funds (STT
     paid): 20% for transfers on or after 23 July 2024; 15% before that date.
   - Sec 112A long-term gains on the same assets: 12.5% on gains above the
     Rs. 1,25,000 annual exemption for transfers on or after 23 July 2024;
     10% above Rs. 1,00,000 before that date. Holding period 12 months.
   - Debt mutual funds bought on or after 1 April 2023 are always short-term and
     taxed at slab rates, with no indexation.
   - Land and buildings: 12.5% without indexation, or 20% with indexation where
     acquired before 23 July 2024 (the taxpayer takes whichever is lower).
   - Where the assessee is resident and other income is below the basic
     exemption limit, the shortfall may be set off against 111A/112A gains.
   - Roll-over exemptions: Sec 54 (residential house into residential house),
     54F (any long-term asset into a residential house), 54EC (into NHAI/REC
     bonds within six months, capped at Rs. 50,00,000).

5. INCOME FROM OTHER SOURCES (Sec 56-59)
   - Savings bank interest, deposit interest, dividends, family pension, gifts
     above Rs. 50,000 from non-relatives, and winnings.
   - Sec 57(iia): family pension deduction of one-third, capped at Rs. 15,000
     (Rs. 25,000 under the new regime from FY 2024-25).
   - Sec 115BB: lottery, crossword and betting winnings taxed at a flat 30% with
     no deduction, no basic exemption and no set-off. Sec 115BBJ covers online
     game winnings at the same rate.
`.trim()

// ─── Chapter VI-A ───────────────────────────────────────────

const CHAPTER_VIA = `
CHAPTER VI-A DEDUCTIONS — OLD REGIME ONLY unless marked otherwise:

  Sec 80C      Rs. 1,50,000 combined ceiling with 80CCC and 80CCD(1) under
               Sec 80CCE. Covers EPF, PPF, ELSS, life insurance premium,
               principal repayment of a housing loan, children's tuition fees,
               5-year tax-saving deposits, NSC, Sukanya Samriddhi.
  Sec 80CCD(1B) Rs. 50,000 additional NPS Tier-1, over and above the 80CCE cap.
  Sec 80CCD(2) Employer NPS contribution. AVAILABLE UNDER BOTH REGIMES.
               Capped at 10% of salary (14% for a government employer, and 14%
               under the new regime for any employer from FY 2024-25).
  Sec 80D      Health insurance: Rs. 25,000 for self/spouse/children
               (Rs. 50,000 if the insured is 60+), plus the same again for
               parents. Includes up to Rs. 5,000 of preventive health check-up
               inside those limits.
  Sec 80DD     Rs. 75,000 for a disabled dependant; Rs. 1,25,000 for severe
               disability. A flat deduction, not linked to spend.
  Sec 80DDB    Specified illnesses: actual spend up to Rs. 40,000
               (Rs. 1,00,000 where the patient is a senior citizen).
  Sec 80E      Interest on an education loan. No ceiling, available for eight
               consecutive assessment years from the year repayment begins.
  Sec 80EE/EEA Additional housing loan interest: Rs. 50,000 / Rs. 1,50,000, for
               loans sanctioned in the specified windows only.
  Sec 80EEB    Electric vehicle loan interest, Rs. 1,50,000, loans sanctioned
               between 1 April 2019 and 31 March 2023.
  Sec 80G      Donations at 50% or 100% of the amount, some subject to a
               qualifying limit of 10% of adjusted gross total income. Cash
               donations above Rs. 2,000 are not deductible at all.
  Sec 80GG     Rent paid where no HRA is received: least of Rs. 5,000 a month,
               25% of total income, or rent paid minus 10% of total income.
  Sec 80TTA    Rs. 10,000 of savings bank interest, for taxpayers under 60.
  Sec 80TTB    Rs. 50,000 of interest income (savings AND deposits) for senior
               citizens. Mutually exclusive with 80TTA.
  Sec 80U      Rs. 75,000 for the taxpayer's own disability; Rs. 1,25,000 if
               severe.

  Sec 80A(2): total Chapter VI-A deductions can never exceed gross total income.
  Chapter VI-A deductions cannot be set off against income taxed at the special
  rates under Sec 111A or 112A.
`.trim()

// ─── Rates by year ──────────────────────────────────────────

const RATE_TABLES: Record<FinancialYear, string> = {
  "2023-2024": `
FY 2023-24 (AY 2024-25) RATES:
  New regime (Sec 115BAC, default): nil to 3L; 5% 3-6L; 10% 6-9L; 15% 9-12L;
  20% 12-15L; 30% above 15L. Standard deduction Rs. 50,000.
  Sec 87A rebate: full relief up to Rs. 7,00,000 taxable income (max Rs. 25,000).
  Old regime: nil to 2.5L (3L if 60+, 5L if 80+); 5% to 5L; 20% to 10L; 30% above.
  Standard deduction Rs. 50,000. Sec 87A up to Rs. 5,00,000 (max Rs. 12,500).
  STCG 111A 15%; LTCG 112A 10% above Rs. 1,00,000.
`.trim(),

  "2024-2025": `
FY 2024-25 (AY 2025-26) RATES:
  New regime: nil to 3L; 5% 3-7L; 10% 7-10L; 15% 10-12L; 20% 12-15L; 30% above
  15L. Standard deduction Rs. 75,000.
  Sec 87A rebate: full relief up to Rs. 7,00,000 taxable income (max Rs. 25,000),
  with marginal relief just above that threshold.
  Old regime: unchanged from FY 2023-24. Standard deduction Rs. 50,000.
  Capital gains changed mid-year: transfers on or after 23 July 2024 attract
  STCG 111A at 20% and LTCG 112A at 12.5% above Rs. 1,25,000; earlier transfers
  keep 15% and 10% above Rs. 1,00,000.
`.trim(),

  "2025-2026": `
FY 2025-26 (AY 2026-27) RATES:
  New regime (Finance Act 2025): nil to 4L; 5% 4-8L; 10% 8-12L; 15% 12-16L;
  20% 16-20L; 25% 20-24L; 30% above 24L. Standard deduction Rs. 75,000.
  Sec 87A rebate: full relief up to Rs. 12,00,000 taxable income (max
  Rs. 60,000), with marginal relief above it. A salaried taxpayer therefore pays
  no tax up to Rs. 12,75,000 of gross salary.
  Old regime: unchanged. Standard deduction Rs. 50,000, Sec 87A up to
  Rs. 5,00,000.
  STCG 111A 20%; LTCG 112A 12.5% above Rs. 1,25,000.
`.trim(),
}

const COMMON_RULES = `
SURCHARGE AND CESS (both regimes):
  Surcharge on total income: 10% above Rs. 50,00,000; 15% above Rs. 1,00,00,000;
  25% above Rs. 2,00,00,000; 37% above Rs. 5,00,00,000 — the 37% band does NOT
  apply under the new regime, which caps at 25%.
  Surcharge on Sec 111A/112A income is capped at 15% whatever the total income.
  Marginal relief limits the extra tax at each threshold to the income above it.
  Health and education cess: 4% of tax plus surcharge, no exceptions.

FILING AND COMPLIANCE:
  Due date: 31 July for individuals not subject to audit; 31 October where a
  Sec 44AB audit applies. Belated and revised returns under Sec 139(4)/(5) may
  be filed up to 31 December of the assessment year.
  Sec 234F late fee: Rs. 5,000, reduced to Rs. 1,000 where total income is at
  or below Rs. 5,00,000.
  Sec 234A/B/C interest at 1% a month for late filing, shortfall in advance tax,
  and deferment of advance tax instalments.
  Advance tax is payable where the liability after TDS is Rs. 10,000 or more,
  in four instalments: 15% by 15 June, 45% by 15 September, 75% by 15 December
  and 100% by 15 March.
  A return must be e-verified within 30 days of filing or it is treated as never
  filed.
  Sec 199 read with Rule 37BA: TDS credit is allowable only to the extent it
  appears in Form 26AS.
  The new regime is the default from AY 2024-25. A salaried taxpayer may switch
  between regimes each year; a taxpayer with business income who opts out of the
  new regime may return to it only once.
`.trim()

// ─── Assembly ───────────────────────────────────────────────

/**
 * The statutory block for one financial year. Only the relevant year's rate
 * table is included — carrying three years of slabs invites the model to mix
 * them up, which is precisely the failure this file exists to prevent.
 */
export function buildLegalKnowledgeBlock(financialYear: FinancialYear): string {
  return [
    "STATUTORY REFERENCE — Income Tax Act 1961, as amended.",
    "Use this as the authority for every legal statement you make. Cite the section.",
    "",
    RATE_TABLES[financialYear],
    "",
    HEADS_OF_INCOME,
    "",
    CHAPTER_VIA,
    "",
    COMMON_RULES,
  ].join("\n")
}

/**
 * The dual-core contract: the model explains, the engine computes.
 *
 * This is the single most important instruction in the tax prompt. An LLM doing
 * slab arithmetic in its head is the failure mode that makes AI tax advice
 * dangerous, so the division of labour is stated as an absolute rule rather
 * than a preference.
 */
export const DETERMINISTIC_ENGINE_CONTRACT = `
DUAL-CORE RULE — ARITHMETIC IS NOT YOURS TO DO:

Every rupee figure in the "VERIFIED TAX COMPUTATION" section below was produced
by a deterministic tax engine that implements the slabs, rebate, surcharge,
marginal relief and cess in code. You MUST:

1. Quote those figures exactly. Never recompute, re-derive, round differently,
   or "correct" them.
2. Never perform slab arithmetic yourself. If the user asks what they would owe
   on a different income or with a different deduction, say plainly that you
   need to run the figure through the calculator, and point them at the /tax
   page or the filing wizard — do NOT estimate it in prose.
3. Use the STATUTORY REFERENCE for the law: which section applies, what the
   ceiling is, which regime allows what, what the compliance deadline is. That
   is what you are for.
4. When a number you would need is not in the verified computation, say so.
   "I don't have that figure" is correct; an invented figure is not.
5. Directional statements are fine without arithmetic ("investing more in 80C
   reduces taxable income under the old regime"). Specific savings claims are
   not, unless the verified computation already contains them.
`.trim()
