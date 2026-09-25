/**
 * server/services/tax/tax-optimizer.ts
 *
 * Professional Chartered Accountant (CA) Statutory Rules Engine &
 * Personalized Tax-Saving Strategy Optimizer.
 *
 * Encodes all statutory tax-reduction provisions, exemptions, and allowances
 * under the Income Tax Act 1961 (amended for AY 2024-25, AY 2025-26, and AY 2026-27).
 *
 * Provides:
 * 1. Complete statutory knowledge graph of deduction caps and rules.
 * 2. Unutilized allowance and gap detection based on taxpayer profile.
 * 3. Personalized, prioritized tax-saving strategies ranked by capital efficiency (ROI).
 * 4. Section 87A marginal relief and threshold proximity arbitrage.
 * 5. Section 44AD/44ADA presumptive taxation optimization for professionals.
 */

import {
  type DeductionInput,
  type FinancialYear,
  type TaxComputationInput,
  type TaxComputationResult,
} from "./types.ts"
import { computeIndianTax } from "./tax-calculator.ts"

// ─── Statutory Rules Registry ────────────────────────────────

export interface StatutoryRule {
  section: string
  title: string
  description: string
  statutoryCeiling: number
  regimes: ("OLD" | "NEW")[]
  category: "investment" | "health" | "housing" | "retirement" | "education" | "donation" | "business" | "relief"
  eligibleInstruments: string[]
  lockInPeriodYears?: number
  citation: string
  riskLevel: "low" | "medium" | "none"
  notes: string
}

export const STATUTORY_RULES: Record<string, StatutoryRule> = {
  section80C: {
    section: "Section 80C",
    title: "Diversified Investments & Mandatory Outlays",
    description: "Covers EPF, PPF, ELSS mutual funds, life insurance premiums, home loan principal repayment, children's tuition fees, 5-year tax-saving FDs, NSC, and Sukanya Samriddhi.",
    statutoryCeiling: 150000,
    regimes: ["OLD"],
    category: "investment",
    eligibleInstruments: ["ELSS (Equity Linked Savings Scheme)", "Public Provident Fund (PPF)", "Voluntary Provident Fund (VPF)", "National Savings Certificate (NSC)", "Tax-saving 5-yr FD", "Home Loan Principal"],
    lockInPeriodYears: 3, // ELSS is lowest at 3 years; PPF 15 yrs
    citation: "Sec 80C read with Sec 80CCE of Income Tax Act, 1961",
    riskLevel: "low",
    notes: "Aggregated ceiling with 80CCC (pension funds) and 80CCD(1) under Sec 80CCE is capped at ₹1,50,000.",
  },

  section80CCD1B: {
    section: "Section 80CCD(1B)",
    title: "National Pension System (NPS) Tier-1 Additional Deduction",
    description: "Exclusive dedicated deduction for voluntary contributions to NPS Tier-1 accounts, over and above the ₹1,50,000 Sec 80C limit.",
    statutoryCeiling: 50000,
    regimes: ["OLD"],
    category: "retirement",
    eligibleInstruments: ["NPS Tier-1 Account"],
    lockInPeriodYears: 60, // Till retirement age 60
    citation: "Sec 80CCD(1B) of Income Tax Act, 1961",
    riskLevel: "low",
    notes: "Saves up to ₹15,600 for taxpayers in the 30% slab (+4% cess). 60% corpus withdrawable tax-free at age 60.",
  },

  section80CCD2: {
    section: "Section 80CCD(2)",
    title: "Employer Contribution to National Pension System",
    description: "Employer contribution towards employee NPS Tier-1. ALLOWED UNDER BOTH OLD AND NEW REGIMES.",
    statutoryCeiling: 14, // Percentage of Basic + DA (10% private, 14% govt; 14% all in New Regime from FY24-25)
    regimes: ["OLD", "NEW"],
    category: "retirement",
    eligibleInstruments: ["Corporate NPS via Employer Payroll"],
    citation: "Sec 80CCD(2) read with Sec 115BAC of Income Tax Act, 1961",
    riskLevel: "none",
    notes: "Restructuring CTC to divert up to 10% (or 14%) of Basic into NPS provides immediate tax shield with zero personal out-of-pocket investment.",
  },

  section80D_Self: {
    section: "Section 80D (Self & Family)",
    title: "Health Insurance Premium & Preventive Health Checkup",
    description: "Deduction for medical insurance premium for self, spouse, and dependent children. Includes up to ₹5,000 for preventive health checkups within ceiling.",
    statutoryCeiling: 25000, // ₹50,000 if self/spouse is senior citizen
    regimes: ["OLD"],
    category: "health",
    eligibleInstruments: ["Comprehensive Health Insurance Policy", "Preventive Health Checkup"],
    citation: "Sec 80D(2)(a) & Sec 80D(2)(b)",
    riskLevel: "none",
    notes: "Preventive health checkup up to ₹5,000 can be paid in cash; insurance premium must be paid digitally.",
  },

  section80D_Parents: {
    section: "Section 80D (Parents)",
    title: "Health Insurance for Parents",
    description: "Additional deduction for health insurance for parents. ₹25,000 for non-senior parents; ₹50,000 if either parent is 60+ years old.",
    statutoryCeiling: 50000,
    regimes: ["OLD"],
    category: "health",
    eligibleInstruments: ["Parental Health Insurance Policy", "Senior Citizen Medical Expenditure (if uninsured)"],
    citation: "Sec 80D(2)(d) of Income Tax Act, 1961",
    riskLevel: "none",
    notes: "Under Sec 80D(2)(c), medical expenditure up to ₹50,000 on uninsured senior citizen parents is fully deductible.",
  },

  section24b: {
    section: "Section 24(b)",
    title: "Interest on Borrowed Capital for Housing Loan",
    description: "Deduction on home loan interest paid for self-occupied property. Uncapped for let-out property (loss set-off capped at ₹2L/yr).",
    statutoryCeiling: 200000,
    regimes: ["OLD"],
    category: "housing",
    eligibleInstruments: ["Home Loan Interest Certificate from Bank/HFC"],
    citation: "Sec 24(b) read with Sec 71(3A) of Income Tax Act, 1961",
    riskLevel: "low",
    notes: "Self-occupied house loss cannot be set off under the New Tax Regime.",
  },

  section80E: {
    section: "Section 80E",
    title: "Interest on Higher Education Loan",
    description: "Full interest deduction on education loan for self, spouse, children or student for whom taxpayer is legal guardian. NO MONETARY CEILING.",
    statutoryCeiling: 1000000, // Virtually uncapped
    regimes: ["OLD"],
    category: "education",
    eligibleInstruments: ["Higher Education Loan Interest Certificate"],
    lockInPeriodYears: 8,
    citation: "Sec 80E of Income Tax Act, 1961",
    riskLevel: "none",
    notes: "Available for 8 consecutive assessment years starting from the year repayment commences.",
  },

  section80EEA: {
    section: "Section 80EEA",
    title: "Additional Interest on Affordable Housing Loan",
    description: "Additional interest deduction up to ₹1,50,000 for first-time home buyers with stamp value up to ₹45L (sanctioned 1 Apr 2019 - 31 Mar 2022).",
    statutoryCeiling: 150000,
    regimes: ["OLD"],
    category: "housing",
    eligibleInstruments: ["Affordable Housing Loan"],
    citation: "Sec 80EEA of Income Tax Act, 1961",
    riskLevel: "low",
    notes: "Available over and above the ₹2,00,000 ceiling of Section 24(b).",
  },

  section80EEB: {
    section: "Section 80EEB",
    title: "Interest on Electric Vehicle (EV) Loan",
    description: "Deduction for interest paid on loan taken for purchase of an electric vehicle (sanctioned 1 Apr 2019 - 31 Mar 2023).",
    statutoryCeiling: 150000,
    regimes: ["OLD"],
    category: "investment",
    eligibleInstruments: ["EV Auto Loan Interest Certificate"],
    citation: "Sec 80EEB of Income Tax Act, 1961",
    riskLevel: "none",
    notes: "Vehicle must be an authentic electric vehicle registered under Motor Vehicles Act.",
  },

  section80G: {
    section: "Section 80G",
    title: "Donations to Charitable Organizations & Relief Funds",
    description: "Deduction of 50% or 100% of donations made to approved charitable trusts and government relief funds (PMNRF, PM CARES, etc.).",
    statutoryCeiling: 100000, // Qualifying limit 10% of Adjusted Gross Total Income for private trusts
    regimes: ["OLD"],
    category: "donation",
    eligibleInstruments: ["80G Donation Receipt with 10BE Form Number"],
    citation: "Sec 80G of Income Tax Act, 1961",
    riskLevel: "low",
    notes: "Cash donations exceeding ₹2,000 are strictly disqualified from deduction.",
  },

  section80GG: {
    section: "Section 80GG",
    title: "Rent Paid by Individuals Not Receiving HRA",
    description: "Deduction for rent paid on residential accommodation when taxpayer does not receive HRA from employer and owns no house in city of employment.",
    statutoryCeiling: 60000, // Least of ₹5k/mo, 25% total income, rent minus 10% income
    regimes: ["OLD"],
    category: "housing",
    eligibleInstruments: ["Rent Receipts with Landlord PAN (Form 10BA)"],
    citation: "Sec 80GG read with Rule 11B",
    riskLevel: "low",
    notes: "Maximum deduction is ₹5,000/month (₹60,000 annually).",
  },

  section80TTA: {
    section: "Section 80TTA",
    title: "Deduction on Savings Account Interest (Under 60)",
    description: "Deduction on interest earned from savings bank accounts in commercial banks, cooperative banks, or post offices.",
    statutoryCeiling: 10000,
    regimes: ["OLD"],
    category: "relief",
    eligibleInstruments: ["Savings Bank Account Interest"],
    citation: "Sec 80TTA of Income Tax Act, 1961",
    riskLevel: "none",
    notes: "Does not apply to term deposits / fixed deposits. Senior citizens use Sec 80TTB instead.",
  },

  section80TTB: {
    section: "Section 80TTB",
    title: "Interest Income Deduction for Senior Citizens (Age 60+)",
    description: "Deduction on all interest income (savings accounts AND fixed/recurring deposits) earned by resident senior citizens.",
    statutoryCeiling: 50000,
    regimes: ["OLD"],
    category: "relief",
    eligibleInstruments: ["Fixed Deposits", "Recurring Deposits", "Savings Accounts"],
    citation: "Sec 80TTB of Income Tax Act, 1961",
    riskLevel: "none",
    notes: "Replaces 80TTA entirely for senior citizens. Eliminates TDS up to ₹50,000 interest.",
  },

  section44ADA: {
    section: "Section 44ADA",
    title: "Presumptive Taxation for Specified Professionals",
    description: "Special tax scheme for software consultants, engineers, doctors, lawyers, accountants, and designers. Exactly 50% of gross receipts is deemed taxable profit!",
    statutoryCeiling: 7500000, // ₹75 Lakhs if 95%+ digital receipts; otherwise ₹50L
    regimes: ["OLD", "NEW"],
    category: "business",
    eligibleInstruments: ["Gross Professional Invoices / Receipts"],
    citation: "Sec 44ADA of Income Tax Act, 1961",
    riskLevel: "none",
    notes: "Eliminates requirement of maintaining books of accounts or statutory tax audit under Sec 44AB. Immediate 50% expense shelter!",
  },

  section44AD: {
    section: "Section 44AD",
    title: "Presumptive Taxation for Small Businesses & Traders",
    description: "Presumptive scheme for small retail traders and business enterprises: deemed profit is 6% on digital turnover and 8% on cash turnover.",
    statutoryCeiling: 30000000, // ₹3 Crore if 95%+ digital turnover; otherwise ₹2 Cr
    regimes: ["OLD", "NEW"],
    category: "business",
    eligibleInstruments: ["Business Sales / Turnover Records"],
    citation: "Sec 44AD of Income Tax Act, 1961",
    riskLevel: "none",
    notes: "Requires no books of accounts. Taxpayer cannot opt out and return for 5 years.",
  },

  section87A_MarginalRelief: {
    section: "Section 87A",
    title: "Full Tax Rebate & Non-Linear Marginal Relief",
    description: "Zero tax liability up to ₹7,00,000 taxable income in New Regime, with marginal relief capping tax to the excess income above ₹7L up to ₹7,27,777.",
    statutoryCeiling: 25000, // Max rebate ₹25k in New Regime; ₹12.5k in Old (up to ₹5L)
    regimes: ["OLD", "NEW"],
    category: "relief",
    eligibleInstruments: ["Taxable Income Threshold Management"],
    citation: "Sec 87A read with Proviso to Sec 115BAC(1A)",
    riskLevel: "none",
    notes: "In FY 2025-26 (Budget 2025), Section 87A rebate ceiling in New Regime is expanded to ₹12,00,000 (tax-free up to ₹12.75L with standard deduction).",
  },
}

// ─── Strategy & Optimization Engine ──────────────────────────

export interface TaxSavingStrategy {
  rank: number
  section: string
  title: string
  actionableStep: string
  outlayRequired: number
  immediateTaxSaved: number
  effectiveROI: number // percentage immediate tax return on invested capital
  category: StatutoryRule["category"]
  regimeSuitability: "OLD_ONLY" | "BOTH"
  lockInPeriod: string
  statutoryCitation: string
  rationale: string
}

export interface TaxpayerFinancialProfile {
  grossIncome: number
  age: number
  isSeniorCitizen: boolean
  isSalaried: boolean
  isProfessional: boolean
  currentRegime: "OLD" | "NEW"
  financialYear: FinancialYear
  declaredDeductions: Partial<DeductionInput>
  hasParentsHealthPolicy?: boolean
  parentsAge?: number
  hasHomeLoan?: boolean
  homeLoanInterest?: number
  hasEducationLoan?: boolean
  educationLoanInterest?: number
  rentPaidMonthly?: number
  receivesHRA?: boolean
}

export interface OptimizationReport {
  grossIncome: number
  marginalTaxRatePercent: number
  currentTaxLiability: {
    oldRegime: number
    newRegime: number
    recommended: "OLD" | "NEW"
    currentSavings: number
  }
  totalUnutilizedDeductions: number
  totalPotentialAdditionalTaxSavings: number
  strategies: TaxSavingStrategy[]
  thresholdOpportunities: string[]
  presumptiveArbitrage?: {
    eligible: boolean
    grossReceipts: number
    standardTaxableIncome: number
    presumptiveTaxableIncome: number
    potentialTaxSavings: number
  }
  executiveSummary: string
}

/**
 * Derives the marginal tax rate (including 4% cess) for a given gross income under Old and New Regimes.
 */
function getMarginalTaxRate(income: number, regime: "OLD" | "NEW"): number {
  if (regime === "OLD") {
    if (income <= 250000) return 0.0
    if (income <= 500000) return 0.052 // 5% + 4% cess
    if (income <= 1000000) return 0.208 // 20% + 4% cess
    return 0.312 // 30% + 4% cess
  } else {
    // New Regime (FY 2024-25 baseline)
    if (income <= 300000) return 0.0
    if (income <= 700000) return 0.052
    if (income <= 1000000) return 0.104
    if (income <= 1200000) return 0.156
    if (income <= 1500000) return 0.208
    return 0.312
  }
}

/**
 * Optimizes tax deductions and generates personalized financial strategies for the user.
 */
export function optimizeTaxSavings(profile: TaxpayerFinancialProfile): OptimizationReport {
  const currentDeds = profile.declaredDeductions
  const gross = profile.grossIncome
  const fy = profile.financialYear || "2024-2025"

  // Compute baseline tax
  const computationInput: TaxComputationInput = {
    financialYear: fy,
    salaryIncome: profile.isSalaried ? gross : 0,
    hraExemption: 0,
    ltaExemption: 0,
    professionalTax: profile.isSalaried ? 2500 : 0,
    housePropertyIncome: -(profile.homeLoanInterest || 0),
    presumptiveIncome44ADA: 0,
    presumptiveIncome44AD: 0,
    businessIncome: !profile.isSalaried ? gross : 0,
    shortTermCapitalGains111A: 0,
    longTermCapitalGains112A: 0,
    otherCapitalGains: 0,
    otherSourcesIncome: 0,
    savingsInterest: 0,
    deductions: {
      section80C: currentDeds.section80C || 0,
      section80CCD1B: currentDeds.section80CCD1B || 0,
      section80CCD2: currentDeds.section80CCD2 || 0,
      section80D: currentDeds.section80D || 0,
      section80DD: currentDeds.section80DD || 0,
      section80DDB: currentDeds.section80DDB || 0,
      section80E: currentDeds.section80E || 0,
      section80EEA: currentDeds.section80EEA || 0,
      section80EEB: currentDeds.section80EEB || 0,
      section80G: currentDeds.section80G || 0,
      section80GG: currentDeds.section80GG || 0,
      section80TTA: currentDeds.section80TTA || 0,
      section80TTB: currentDeds.section80TTB || 0,
      section80U: currentDeds.section80U || 0,
    },
  }

  const baselineTax = computeIndianTax(computationInput)
  const marginalRate = getMarginalTaxRate(gross, "OLD")
  const strategies: TaxSavingStrategy[] = []
  const thresholdOpportunities: string[] = []

  // 1. Section 80C Gap Analysis
  const used80C = currentDeds.section80C || 0
  const cap80C = STATUTORY_RULES.section80C.statutoryCeiling
  const gap80C = Math.max(0, cap80C - used80C)
  if (gap80C > 0 && marginalRate > 0) {
    const taxSaved = Math.round(gap80C * marginalRate)
    strategies.push({
      rank: 0, // Assigned later
      section: "Section 80C",
      title: "Utilize Unclaimed Section 80C Limit",
      actionableStep: `Invest ₹${gap80C.toLocaleString("en-IN")} in ELSS Mutual Funds or PPF before 31st March to fully claim your ₹1,50,000 threshold.`,
      outlayRequired: gap80C,
      immediateTaxSaved: taxSaved,
      effectiveROI: Math.round((taxSaved / gap80C) * 100),
      category: "investment",
      regimeSuitability: "OLD_ONLY",
      lockInPeriod: "3 years for ELSS (lowest in 80C) or 15 years for PPF",
      statutoryCitation: "Sec 80C read with Sec 80CCE",
      rationale: `You have ₹${gap80C.toLocaleString("en-IN")} unutilized in 80C. Claiming this provides an immediate guaranteed return of ${Math.round(marginalRate * 100)}% via tax avoidance.`,
    })
  }

  // 2. Section 80CCD(1B) Dedicated NPS Tier-1
  const used80CCD1B = currentDeds.section80CCD1B || 0
  const cap80CCD1B = STATUTORY_RULES.section80CCD1B.statutoryCeiling
  const gap80CCD1B = Math.max(0, cap80CCD1B - used80CCD1B)
  if (gap80CCD1B > 0 && marginalRate > 0) {
    const taxSaved = Math.round(gap80CCD1B * marginalRate)
    strategies.push({
      rank: 0,
      section: "Section 80CCD(1B)",
      title: "Dedicated ₹50,000 NPS Tier-1 Deduction",
      actionableStep: `Open an NPS Tier-1 account and contribute ₹${gap80CCD1B.toLocaleString("en-IN")} over and above your Section 80C investments.`,
      outlayRequired: gap80CCD1B,
      immediateTaxSaved: taxSaved,
      effectiveROI: Math.round((taxSaved / gap80CCD1B) * 100),
      category: "retirement",
      regimeSuitability: "OLD_ONLY",
      lockInPeriod: "Till age 60 (retirement)",
      statutoryCitation: "Sec 80CCD(1B) of Income Tax Act, 1961",
      rationale: `Section 80CCD(1B) is an exclusive booster window. Putting ₹50,000 saves ₹${taxSaved.toLocaleString("en-IN")} directly from your tax bill.`,
    })
  }

  // 3. Section 80CCD(2) Employer NPS Restructuring (WORKS IN BOTH REGIMES!)
  if (profile.isSalaried && gross > 600000) {
    const estimatedBasic = gross * 0.40 // Basic salary is typically ~40% of CTC
    const maxEmployerNps = Math.round(estimatedBasic * 0.10)
    const currentEmployerNps = currentDeds.section80CCD2 || 0
    const gapEmployerNps = Math.max(0, maxEmployerNps - currentEmployerNps)

    if (gapEmployerNps > 10000) {
      const activeMarginalRate = profile.currentRegime === "NEW" ? getMarginalTaxRate(gross, "NEW") : marginalRate
      const taxSaved = Math.round(gapEmployerNps * activeMarginalRate)
      strategies.push({
        rank: 0,
        section: "Section 80CCD(2)",
        title: "Employer Corporate NPS (Zero Out-of-Pocket Cost)",
        actionableStep: `Request your employer's HR/Payroll to restructure ₹${gapEmployerNps.toLocaleString("en-IN")}/year (up to 10% of Basic) into Corporate NPS.`,
        outlayRequired: 0, // Diverted from existing CTC salary, zero extra cash outlay
        immediateTaxSaved: taxSaved,
        effectiveROI: 100, // Infinite/maximum ROI since it replaces taxed salary
        category: "retirement",
        regimeSuitability: "BOTH",
        lockInPeriod: "Till age 60",
        statutoryCitation: "Sec 80CCD(2) read with Sec 115BAC",
        rationale: `Section 80CCD(2) is deductible under BOTH Old and New regimes! It diverts salary into a tax-shielded retirement asset with ₹0 personal expense.`,
      })
    }
  }

  // 4. Section 80D Health Insurance (Self & Parents)
  const used80D = currentDeds.section80D || 0
  const maxSelf80D = profile.isSeniorCitizen ? 50000 : 25000
  const maxParents80D = 50000 // assuming senior parents
  const totalPotential80D = maxSelf80D + maxParents80D
  const gap80D = Math.max(0, totalPotential80D - used80D)

  if (gap80D > 0 && marginalRate > 0) {
    const recommendedOutlay = Math.min(gap80D, 40000) // realistic policy cost
    const taxSaved = Math.round(recommendedOutlay * marginalRate)
    strategies.push({
      rank: 0,
      section: "Section 80D",
      title: "Health Insurance for Self & Senior Parents",
      actionableStep: `Pay health insurance premiums for parents (up to ₹50,000) and self/family (up to ₹25,000), including ₹5,000 preventive checkup.`,
      outlayRequired: recommendedOutlay,
      immediateTaxSaved: taxSaved,
      effectiveROI: Math.round((taxSaved / recommendedOutlay) * 100),
      category: "health",
      regimeSuitability: "OLD_ONLY",
      lockInPeriod: "1 year renewable coverage",
      statutoryCitation: "Sec 80D(2)(a) & Sec 80D(2)(d)",
      rationale: `Purchasing health insurance directly shields personal medical risks while earning a statutory tax discount of ${Math.round(marginalRate * 100)}%.`,
    })
  }

  // 5. Section 24(b) Home Loan Interest
  if (profile.hasHomeLoan && profile.homeLoanInterest) {
    const loanInterest = profile.homeLoanInterest
    const claimable = Math.min(loanInterest, STATUTORY_RULES.section24b.statutoryCeiling)
    const taxSaved = Math.round(claimable * marginalRate)
    strategies.push({
      rank: 0,
      section: "Section 24(b)",
      title: "Home Loan Interest Certificate Deduction",
      actionableStep: `Obtain the annual interest certificate from your lending bank and declare ₹${claimable.toLocaleString("en-IN")} under Section 24(b).`,
      outlayRequired: 0, // already being paid as EMI
      immediateTaxSaved: taxSaved,
      effectiveROI: 100,
      category: "housing",
      regimeSuitability: "OLD_ONLY",
      lockInPeriod: "Active loan tenure",
      statutoryCitation: "Sec 24(b) of Income Tax Act, 1961",
      rationale: `Section 24(b) allows up to ₹2,00,000 of interest paid on self-occupied housing loans to be written off against salary income.`,
    })
  }

  // 6. Section 80GG Rent Paid (if no HRA)
  if (!profile.receivesHRA && profile.rentPaidMonthly && profile.rentPaidMonthly > 0) {
    const annualRent = profile.rentPaidMonthly * 12
    const tenPercentIncome = gross * 0.10
    const rentMinusTenPercent = Math.max(0, annualRent - tenPercentIncome)
    const twentyFivePercentIncome = gross * 0.25
    const cap60k = 60000
    const allowable80GG = Math.min(cap60k, twentyFivePercentIncome, rentMinusTenPercent)

    if (allowable80GG > 0 && marginalRate > 0) {
      const taxSaved = Math.round(allowable80GG * marginalRate)
      strategies.push({
        rank: 0,
        section: "Section 80GG",
        title: "Rent Deduction for Non-HRA Taxpayers",
        actionableStep: `File Form 10BA and claim ₹${allowable80GG.toLocaleString("en-IN")} deduction under Section 80GG for house rent paid.`,
        outlayRequired: 0, // Rent is already an existing expense
        immediateTaxSaved: taxSaved,
        effectiveROI: 100,
        category: "housing",
        regimeSuitability: "OLD_ONLY",
        lockInPeriod: "None",
        statutoryCitation: "Sec 80GG read with Rule 11B",
        rationale: `Even if your company does not offer HRA, Section 80GG lets you deduct up to ₹60,000/year in rent paid against gross income.`,
      })
    }
  }

  // 7. Presumptive Taxation Section 44ADA Arbitrage (For Professionals/Consultants)
  let presumptiveArbitrageData = undefined
  if (profile.isProfessional || (!profile.isSalaried && gross <= 7500000)) {
    const grossReceipts = gross
    const presumptiveProfit = Math.round(grossReceipts * 0.50)
    const standardTaxable = gross
    const taxUnderPresumptive = computeIndianTax({
      financialYear: fy,
      salaryIncome: 0,
      hraExemption: 0,
      ltaExemption: 0,
      professionalTax: 0,
      housePropertyIncome: 0,
      presumptiveIncome44ADA: presumptiveProfit,
      presumptiveIncome44AD: 0,
      businessIncome: 0,
      shortTermCapitalGains111A: 0,
      longTermCapitalGains112A: 0,
      otherCapitalGains: 0,
      otherSourcesIncome: 0,
      savingsInterest: 0,
      deductions: computationInput.deductions,
    })

    const taxSavingsPresumptive = Math.max(0, baselineTax.totalTaxPayableNew - taxUnderPresumptive.totalTaxPayableNew)
    presumptiveArbitrageData = {
      eligible: true,
      grossReceipts,
      standardTaxableIncome: standardTaxable,
      presumptiveTaxableIncome: presumptiveProfit,
      potentialTaxSavings: taxSavingsPresumptive,
    }

    if (taxSavingsPresumptive > 15000) {
      strategies.push({
        rank: 0,
        section: "Section 44ADA",
        title: "Opt into Presumptive Taxation for Professionals",
        actionableStep: `File under Section 44ADA declaring 50% deemed expenses on your gross receipts of ₹${grossReceipts.toLocaleString("en-IN")}.`,
        outlayRequired: 0,
        immediateTaxSaved: taxSavingsPresumptive,
        effectiveROI: 100,
        category: "business",
        regimeSuitability: "BOTH",
        lockInPeriod: "Annual election",
        statutoryCitation: "Sec 44ADA of Income Tax Act, 1961",
        rationale: `Section 44ADA deems exactly 50% of your gross billing as expenses without requiring receipts or audit, slashing your taxable base in half!`,
      })
    }
  }

  // 8. Section 87A Marginal Relief & Threshold Optimization
  if (gross > 700000 && gross <= 740000) {
    const excess = gross - 700000
    thresholdOpportunities.push(
      `CRITICAL MARGINAL RELIEF ZONE: Your income of ₹${gross.toLocaleString("en-IN")} is just ₹${excess.toLocaleString("en-IN")} above the ₹7,00,000 zero-tax threshold. In New Regime, you pay tax solely on this excess. In Old Regime, a small investment of ₹${excess.toLocaleString("en-IN")} reduces taxable income to ₹5,00,000, eliminating tax entirely!`
    )
  }

  // Rank strategies by capital efficiency (immediate tax saved per rupee of outlay)
  strategies.sort((a, b) => {
    // Zero outlay items (pure salary restructuring or existing expense claims) first
    if (a.outlayRequired === 0 && b.outlayRequired > 0) return -1
    if (b.outlayRequired === 0 && a.outlayRequired > 0) return 1
    return b.immediateTaxSaved - a.immediateTaxSaved
  })

  // Assign 1-indexed ranks
  strategies.forEach((s, idx) => {
    s.rank = idx + 1
  })

  const totalPotentialSavings = strategies.reduce((sum, s) => sum + s.immediateTaxSaved, 0)
  const totalUnclaimedDeductions = strategies.reduce((sum, s) => sum + s.outlayRequired, 0)

  const executiveSummary = [
    `CA AUDIT SUMMARY: For gross income of ₹${gross.toLocaleString("en-IN")}, your recommended baseline is the ${baselineTax.recommendedRegime} Regime (Saving ₹${baselineTax.savingsWithRecommended.toLocaleString("en-IN")}).`,
    `We identified ${strategies.length} active statutory optimization opportunities capable of generating up to ₹${totalPotentialSavings.toLocaleString("en-IN")} in additional net tax savings.`,
    `Top Priority: ${strategies[0] ? `${strategies[0].section} (${strategies[0].title}) — saves ₹${strategies[0].immediateTaxSaved.toLocaleString("en-IN")}.` : "All standard statutory deductions are currently optimized."}`,
  ].join(" ")

  return {
    grossIncome: gross,
    marginalTaxRatePercent: Math.round(marginalRate * 100),
    currentTaxLiability: {
      oldRegime: baselineTax.totalTaxPayableOld,
      newRegime: baselineTax.totalTaxPayableNew,
      recommended: baselineTax.recommendedRegime,
      currentSavings: baselineTax.savingsWithRecommended,
    },
    totalUnutilizedDeductions: totalUnclaimedDeductions,
    totalPotentialAdditionalTaxSavings: totalPotentialSavings,
    strategies,
    thresholdOpportunities,
    presumptiveArbitrage: presumptiveArbitrageData,
    executiveSummary,
  }
}
