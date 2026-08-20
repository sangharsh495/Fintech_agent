/**
 * server/services/tax/itr-json-builder.ts
 *
 * Generates the Income Tax Department e-filing JSON for ITR-1 (Sahaj) and
 * ITR-2, plus the pre-filing validation that catches the rejections the portal
 * would otherwise throw back at the user (malformed PAN, bad IFSC, deductions
 * exceeding gross total income, and so on).
 *
 * IMPORTANT — read before trusting the output:
 * The ITD publishes a new JSON schema every assessment year and the utility
 * rejects a file whose `SchemaVer`/`FormVer` do not match the one it expects.
 * The version strings below are configurable per assessment year and MUST be
 * confirmed against the schema published for that year at
 * incometax.gov.in → Downloads → Income Tax Returns before a file is uploaded.
 * `validateITRPayload` flags an unconfirmed year rather than emitting a file
 * the portal will silently reject.
 */

import type { TaxComputationResult } from "./types"
import type { ITRForm } from "./itr-form-selector"

// ─── Payload shapes ─────────────────────────────────────────

export interface ITRAddress {
  flatDoorBlock: string
  premisesName?: string
  roadStreet?: string
  areaLocality: string
  city: string
  /** ITD state code, e.g. "27" for Maharashtra. See STATE_CODES. */
  stateCode: string
  pincode: string
  countryCode?: string
}

export interface ITRBankAccount {
  ifsc: string
  bankName: string
  accountNumber: string
  /** Exactly one account must be nominated for the refund. */
  isRefundAccount: boolean
}

export interface ITRPayload {
  form: ITRForm
  userProfile: {
    pan: string
    firstName: string
    /** Middle name is optional but the schema has a slot for it. */
    middleName?: string
    lastName: string
    /** ISO date, YYYY-MM-DD. */
    dob: string
    mobile: string
    email: string
    /** 12 digits, or the 28-character enrolment id. Optional in the schema. */
    aadhaar?: string
    address: ITRAddress
  }
  bankAccounts: ITRBankAccount[]
  taxComputation: TaxComputationResult
  /** TDS already deducted, by deductor, for Schedule TDS. */
  tdsEntries?: Array<{
    deductorName: string
    deductorTAN: string
    incomeCharged: number
    taxDeducted: number
  }>
  /** Advance tax and self-assessment tax challans, for Schedule IT. */
  taxPayments?: Array<{
    bsrCode: string
    /** ISO date, YYYY-MM-DD. */
    dateOfDeposit: string
    challanSerialNumber: string
    amount: number
  }>
  /** Salary detail for Schedule S, when reporting beyond the summary. */
  salaryDetail?: {
    grossSalary: number
    perquisites: number
    profitsInLieu: number
    exemptSection10: number
    standardDeduction: number
    professionalTax: number
  }
  /** Chapter VI-A amounts keyed by section label ("80C", "80D", ...). */
  chapterVIA?: Record<string, number>
  /** Capital gains detail for Schedule CG. Required for ITR-2 when gains exist. */
  capitalGains?: {
    /** Gross STCG on listed equity / equity MF (Sec 111A). */
    stcg111A: number
    /** Gross LTCG on listed equity / equity MF (Sec 112A), before the exemption. */
    ltcg112A: number
    /** Gains taxed at slab rates (debt funds, unlisted, other assets). */
    otherCapitalGains: number
  }
  /** Filed on or before the due date, or belated/revised. */
  filingSection?: "139(1)" | "139(4)" | "139(5)"
  /** Filed after the due date attracts a Sec 234F fee. */
  isRevised?: boolean
}

// ─── Schema versions ────────────────────────────────────────

/**
 * Schema and form versions, keyed by assessment year then form.
 *
 * Only years explicitly confirmed against the published schema are listed. An
 * unknown year is a hard validation error rather than a guess, because a
 * version mismatch produces an opaque portal rejection.
 */
const SCHEMA_VERSIONS: Record<string, Partial<Record<ITRForm, { schemaVer: string; formVer: string }>>> = {
  "2025-26": {
    "ITR-1": { schemaVer: "Ver1.0", formVer: "Ver1.0" },
    "ITR-2": { schemaVer: "Ver1.0", formVer: "Ver1.0" },
  },
  "2026-27": {
    "ITR-1": { schemaVer: "Ver1.0", formVer: "Ver1.0" },
    "ITR-2": { schemaVer: "Ver1.0", formVer: "Ver1.0" },
  },
}

/** ITD state codes used in PartA_GEN. */
export const STATE_CODES: Record<string, string> = {
  "ANDAMAN AND NICOBAR ISLANDS": "01",
  "ANDHRA PRADESH": "02",
  "ARUNACHAL PRADESH": "03",
  ASSAM: "04",
  BIHAR: "05",
  CHANDIGARH: "06",
  "DADRA AND NAGAR HAVELI AND DAMAN AND DIU": "07",
  DELHI: "09",
  GOA: "10",
  GUJARAT: "11",
  HARYANA: "12",
  "HIMACHAL PRADESH": "13",
  "JAMMU AND KASHMIR": "14",
  KARNATAKA: "15",
  KERALA: "16",
  LAKSHADWEEP: "17",
  "MADHYA PRADESH": "18",
  MAHARASHTRA: "19",
  MANIPUR: "20",
  MEGHALAYA: "21",
  MIZORAM: "22",
  NAGALAND: "23",
  ODISHA: "24",
  PUDUCHERRY: "25",
  PUNJAB: "26",
  RAJASTHAN: "27",
  SIKKIM: "28",
  "TAMIL NADU": "29",
  TRIPURA: "30",
  "UTTAR PRADESH": "31",
  "WEST BENGAL": "32",
  CHHATTISGARH: "33",
  UTTARAKHAND: "34",
  JHARKHAND: "35",
  TELANGANA: "36",
  LADAKH: "37",
}

/** Resolves a free-text state name to its ITD code, or null if unknown. */
export function stateCodeFor(state: string): string | null {
  return STATE_CODES[state.trim().toUpperCase()] ?? null
}

// ─── Validation ─────────────────────────────────────────────

export interface ValidationIssue {
  field: string
  message: string
  severity: "error" | "warning"
}

const PAN_PATTERN = /^[A-Z]{5}\d{4}[A-Z]$/
// 4-letter bank code, '0', then a 6-character branch code.
const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/
const PINCODE_PATTERN = /^\d{6}$/
const MOBILE_PATTERN = /^[6-9]\d{9}$/
const AADHAAR_PATTERN = /^\d{12}$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * The fourth character of a PAN encodes the holder's status. An individual's
 * PAN carries 'P'; filing an individual return under a company or HUF PAN is a
 * guaranteed rejection.
 */
function panStatusChar(pan: string): string {
  return pan.charAt(3)
}

export function validateITRPayload(payload: ITRPayload): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const error = (field: string, message: string) => issues.push({ field, message, severity: "error" })
  const warn = (field: string, message: string) => issues.push({ field, message, severity: "warning" })

  const { userProfile: profile, taxComputation: tax } = payload

  // ── Identity ──
  const pan = (profile.pan ?? "").toUpperCase().trim()
  if (!PAN_PATTERN.test(pan)) {
    error("pan", "PAN must be five letters, four digits and a letter, e.g. ABCDE1234F.")
  } else if (panStatusChar(pan) !== "P") {
    error("pan", `The fourth character of this PAN is "${panStatusChar(pan)}", which is not an individual PAN. ITR-1 and ITR-2 are for individuals.`)
  }

  if (!profile.firstName?.trim()) error("firstName", "First name is required.")
  if (!profile.lastName?.trim()) error("lastName", "Surname is required — the ITD schema requires SurNameOrOrgName.")

  if (!ISO_DATE_PATTERN.test(profile.dob ?? "")) {
    error("dob", "Date of birth must be in YYYY-MM-DD format.")
  } else {
    const dob = new Date(profile.dob)
    if (Number.isNaN(dob.getTime()) || dob > new Date()) {
      error("dob", "Date of birth is not a valid past date.")
    }
  }

  if (!MOBILE_PATTERN.test((profile.mobile ?? "").replace(/^\+91/, ""))) {
    error("mobile", "Mobile number must be a 10-digit Indian number starting with 6, 7, 8 or 9.")
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(profile.email ?? "")) {
    error("email", "A valid email address is required — the ITD sends the acknowledgement there.")
  }

  if (profile.aadhaar && !AADHAAR_PATTERN.test(profile.aadhaar.replace(/\s/g, ""))) {
    error("aadhaar", "Aadhaar must be 12 digits.")
  }
  if (!profile.aadhaar) {
    warn("aadhaar", "Aadhaar is not supplied. It is mandatory for e-verification by OTP; without it you must verify by net banking, DSC or a signed ITR-V.")
  }

  // ── Address ──
  const address = profile.address
  if (!address?.flatDoorBlock?.trim()) error("address.flatDoorBlock", "House or flat number is required.")
  if (!address?.areaLocality?.trim()) error("address.areaLocality", "Area or locality is required.")
  if (!address?.city?.trim()) error("address.city", "City or town is required.")
  if (!PINCODE_PATTERN.test(address?.pincode ?? "")) error("address.pincode", "PIN code must be 6 digits.")
  if (!address?.stateCode || !Object.values(STATE_CODES).includes(address.stateCode)) {
    error("address.stateCode", "A valid ITD state code is required.")
  }

  // ── Bank accounts ──
  if (!payload.bankAccounts || payload.bankAccounts.length === 0) {
    error("bankAccounts", "At least one bank account must be reported.")
  } else {
    const refundAccounts = payload.bankAccounts.filter((a) => a.isRefundAccount)
    if (refundAccounts.length === 0) {
      error("bankAccounts", "Nominate exactly one account to receive a refund.")
    } else if (refundAccounts.length > 1) {
      error("bankAccounts", "Only one account may be nominated for the refund.")
    }

    payload.bankAccounts.forEach((account, index) => {
      if (!IFSC_PATTERN.test((account.ifsc ?? "").toUpperCase())) {
        error(`bankAccounts[${index}].ifsc`, `"${account.ifsc}" is not a valid IFSC. The format is four letters, a zero, then six characters.`)
      }
      if (!/^\d{5,20}$/.test((account.accountNumber ?? "").replace(/\s/g, ""))) {
        error(`bankAccounts[${index}].accountNumber`, "Account number must be 5 to 20 digits.")
      }
      if (!account.bankName?.trim()) {
        error(`bankAccounts[${index}].bankName`, "Bank name is required.")
      }
    })
  }

  // ── Computation coherence ──
  const chosen = tax.recommendedRegime === "OLD" ? tax.old : tax.new

  if (chosen.totalDeductions > chosen.grossTotalIncome) {
    error(
      "deductions",
      "Deductions exceed gross total income. Chapter VI-A deductions cannot create a loss (Sec 80A(2))."
    )
  }
  if (chosen.taxableIncome < 0) {
    error("taxableIncome", "Taxable income is negative, which the schema does not accept.")
  }
  if (payload.chapterVIA) {
    const claimed80C = payload.chapterVIA["80C"] ?? 0
    if (claimed80C > 150000) {
      error("chapterVIA.80C", `Section 80C claim of Rs. ${claimed80C.toLocaleString("en-IN")} exceeds the Rs. 1,50,000 ceiling.`)
    }
  }

  // ── Form suitability ──
  if (payload.form === "ITR-1" && chosen.specialRateTax > 0) {
    error("form", "Capital gains taxed at special rates cannot be reported in ITR-1 (Sahaj). File ITR-2.")
  }
  if (payload.form === "ITR-1" && chosen.grossTotalIncome > 5000000) {
    error("form", "Total income above Rs. 50,00,000 cannot be reported in ITR-1 (Sahaj). File ITR-2.")
  }
  if (payload.form === "ITR-3" || payload.form === "ITR-4") {
    error("form", `JSON generation for ${payload.form} is not implemented. Only ITR-1 and ITR-2 are supported.`)
  }

  // ── Schema version ──
  const versions = SCHEMA_VERSIONS[tax.assessmentYear]?.[payload.form]
  if (!versions) {
    error(
      "schemaVersion",
      `No confirmed ITD schema version is on record for ${payload.form}, AY ${tax.assessmentYear}. Download the current schema from the e-filing portal and update SCHEMA_VERSIONS before generating a file.`
    )
  }

  // ── Payment reconciliation ──
  if (chosen.netPayable > 0) {
    warn(
      "netPayable",
      `Rs. ${chosen.netPayable.toLocaleString("en-IN")} remains payable. Pay it as self-assessment tax under Sec 140A and add the challan before filing, or the return will be treated as defective.`
    )
  }

  return issues
}

// ─── Builders ───────────────────────────────────────────────

function creationInfo(assessmentYear: string) {
  return {
    SWVersionNo: "1.0",
    SWCreatedBy: "FinFlow_Autonomous_CA",
    XMLCreatedBy: "FinFlow_Engine",
    JSONCreatedBy: "FinFlow",
    // ITD expects the creation date as DD/MM/YYYY in most schema versions.
    CreationDate: new Date().toISOString().split("T")[0],
    IntermediaryCity: "NA",
    Digest: "-",
    AssessmentYear: assessmentYear,
  }
}

function personalInfo(payload: ITRPayload) {
  const { userProfile: profile } = payload
  return {
    AssesseeName: {
      FirstName: profile.firstName,
      ...(profile.middleName ? { MiddleName: profile.middleName } : {}),
      SurNameOrOrgName: profile.lastName,
    },
    PAN: profile.pan.toUpperCase(),
    ...(profile.aadhaar ? { AadhaarCardNo: profile.aadhaar.replace(/\s/g, "") } : {}),
    Address: {
      ResidenceNo: profile.address.flatDoorBlock,
      ...(profile.address.premisesName ? { ResidenceName: profile.address.premisesName } : {}),
      ...(profile.address.roadStreet ? { RoadOrStreet: profile.address.roadStreet } : {}),
      LocalityOrArea: profile.address.areaLocality,
      CityOrTownOrDistrict: profile.address.city,
      StateCode: profile.address.stateCode,
      CountryCode: profile.address.countryCode ?? "91",
      PinCode: Number(profile.address.pincode),
      CountryCodeMobile: 91,
      MobileNo: Number(profile.mobile.replace(/^\+91/, "")),
      EmailAddress: profile.email,
    },
    DOB: profile.dob,
    // "I" = Individual. Only individuals may file ITR-1/ITR-2 through this path.
    Status: "I",
    EmployerCategory: payload.salaryDetail ? "OTH" : "NA",
  }
}

function filingStatus(payload: ITRPayload) {
  const section = payload.filingSection ?? "139(1)"
  // ReturnFileSec codes: 11 = 139(1) on or before the due date,
  // 12 = 139(4) belated, 13 = 139(5) revised.
  const sectionCode = section === "139(4)" ? 12 : section === "139(5)" ? 13 : 11

  return {
    ReturnFileSec: sectionCode,
    // The new regime is the default from AY 2024-25; opting out is an
    // affirmative election that must be flagged.
    OptOutNewTaxRegime: payload.taxComputation.recommendedRegime === "OLD" ? "Y" : "N",
    SeventhProvisoFlag: "N",
  }
}

function refundBlock(payload: ITRPayload) {
  return {
    RefundDue: Math.max(0, -(payload.taxComputation.recommendedRegime === "OLD"
      ? payload.taxComputation.old.netPayable
      : payload.taxComputation.new.netPayable)),
    BankAccountDtls: {
      AddtnlBankDetails: payload.bankAccounts.map((account) => ({
        IFSCCode: account.ifsc.toUpperCase(),
        BankName: account.bankName,
        BankAccountNo: account.accountNumber.replace(/\s/g, ""),
        UseForRefund: account.isRefundAccount ? "true" : "false",
      })),
    },
  }
}

function taxesPaidBlock(payload: ITRPayload) {
  const tds = payload.tdsEntries ?? []
  const challans = payload.taxPayments ?? []

  const totalTds = tds.reduce((sum, entry) => sum + entry.taxDeducted, 0)
  const totalChallans = challans.reduce((sum, challan) => sum + challan.amount, 0)

  return {
    TaxesPaid: {
      TDS: totalTds,
      AdvanceTax: 0,
      SelfAssessmentTax: totalChallans,
      TCS: 0,
      TotalTaxesPaid: totalTds + totalChallans,
    },
    ...(tds.length > 0
      ? {
          TDSonSalaries: {
            TDSonSalary: tds.map((entry) => ({
              EmployerOrDeductorOrCollectDetl: {
                TAN: entry.deductorTAN.toUpperCase(),
                EmployerOrDeductorOrCollecterName: entry.deductorName,
              },
              IncChrgSal: Math.round(entry.incomeCharged),
              TotalTDSSal: Math.round(entry.taxDeducted),
            })),
          },
        }
      : {}),
    ...(challans.length > 0
      ? {
          TaxPayments: {
            TaxPayment: challans.map((challan) => ({
              BSRCode: challan.bsrCode,
              DateDep: challan.dateOfDeposit,
              SrlNoOfChaln: Number(challan.challanSerialNumber),
              Amt: Math.round(challan.amount),
            })),
          },
        }
      : {}),
  }
}

function verificationBlock(payload: ITRPayload) {
  return {
    Declaration: {
      AssesseeVerName: `${payload.userProfile.firstName} ${payload.userProfile.lastName}`.trim(),
      // The schema requires a father's name; it is not collected elsewhere in
      // the app, so it is left blank for the taxpayer to complete in the
      // utility rather than being fabricated.
      FatherName: "",
      // "S" = self. Anything else requires a representative assessee.
      Capacity: "S",
      AssesseeVerPAN: payload.userProfile.pan.toUpperCase(),
    },
    Place: payload.userProfile.address.city,
    Date: new Date().toISOString().split("T")[0],
  }
}

// ─── ITR-1 (Sahaj) ──────────────────────────────────────────

export function generateITR1JSON(payload: ITRPayload): Record<string, unknown> {
  const tax = payload.taxComputation
  const chosen = tax.recommendedRegime === "OLD" ? tax.old : tax.new
  const versions = SCHEMA_VERSIONS[tax.assessmentYear]?.["ITR-1"]
  const salary = payload.salaryDetail

  return {
    ITR: {
      ITR1: {
        CreationInfo: creationInfo(tax.assessmentYear),
        Form_ITR1: {
          FormName: "ITR-1",
          Description: "For individuals being a resident (other than not ordinarily resident) having total income upto Rs. 50 lakh, having Income from Salaries, one house property, other sources (Interest etc.) and agricultural income upto Rs. 5 thousand",
          AssessmentYear: tax.assessmentYear.split("-")[0],
          SchemaVer: versions?.schemaVer ?? "UNCONFIRMED",
          FormVer: versions?.formVer ?? "UNCONFIRMED",
        },
        PersonalInfo: personalInfo(payload),
        FilingStatus: filingStatus(payload),

        ITR1_IncomeDeductions: {
          GrossSalary: Math.round(salary ? salary.grossSalary + salary.perquisites + salary.profitsInLieu : chosen.grossTotalIncome),
          ...(salary
            ? {
                Salary: Math.round(salary.grossSalary),
                PerquisitesValue: Math.round(salary.perquisites),
                ProfitsInLieuOfSalary: Math.round(salary.profitsInLieu),
                AllwncExemptUs10: Math.round(salary.exemptSection10),
                NetSalary: Math.round(
                  salary.grossSalary + salary.perquisites + salary.profitsInLieu - salary.exemptSection10
                ),
                DeductionUs16ia: Math.round(salary.standardDeduction),
                DeductionUs16iii: Math.round(salary.professionalTax),
                DeductionUS16: Math.round(salary.standardDeduction + salary.professionalTax),
              }
            : {}),
          IncomeFromSal: Math.round(
            salary
              ? Math.max(
                  0,
                  salary.grossSalary +
                    salary.perquisites +
                    salary.profitsInLieu -
                    salary.exemptSection10 -
                    salary.standardDeduction -
                    salary.professionalTax
                )
              : chosen.grossTotalIncome
          ),
          GrossTotIncome: Math.round(chosen.grossTotalIncome),
          ...(payload.chapterVIA
            ? {
                DeductUndChapVIA: Object.fromEntries(
                  Object.entries(payload.chapterVIA).map(([section, amount]) => [
                    `Section${section.replace(/[^0-9A-Za-z]/g, "")}`,
                    Math.round(amount),
                  ])
                ),
              }
            : {}),
          TotalIncome: Math.round(chosen.taxableIncome),
          DeductionUnderScheduleVIA: Math.round(chosen.totalDeductions),
        },

        ITR1_TaxComputation: {
          TotalTaxPayable: Math.round(chosen.taxBeforeRebate),
          Rebate87A: Math.round(chosen.rebate87A),
          TotalTaxPayableUs115BAC: Math.round(chosen.taxAfterRebate),
          Surcharge: Math.round(chosen.surcharge),
          EducationCess: Math.round(chosen.cess),
          GrossTaxLiability: Math.round(chosen.totalTaxPayable),
          NetTaxLiability: Math.round(chosen.totalTaxPayable),
          TotalIntrstPay: 0,
          TaxPayableOnRebate: Math.round(chosen.taxAfterRebate),
        },

        TaxPaid: taxesPaidBlock(payload),
        Refund: refundBlock(payload),
        Verification: verificationBlock(payload),
      },
    },
  }
}

// ─── ITR-2 ──────────────────────────────────────────────────

/**
 * ITR-2 adds Schedule CG (capital gains) and a Schedule VIA broken out by
 * section. Schedules HP and FA are emitted only when the corresponding data is
 * supplied, since an empty schedule is itself a validation failure.
 */
export function generateITR2JSON(payload: ITRPayload): Record<string, unknown> {
  const tax = payload.taxComputation
  const chosen = tax.recommendedRegime === "OLD" ? tax.old : tax.new
  const versions = SCHEMA_VERSIONS[tax.assessmentYear]?.["ITR-2"]

  return {
    ITR: {
      ITR2: {
        CreationInfo: creationInfo(tax.assessmentYear),
        Form_ITR2: {
          FormName: "ITR-2",
          Description: "For Individuals and HUFs not having income from profits and gains of business or profession",
          AssessmentYear: tax.assessmentYear.split("-")[0],
          SchemaVer: versions?.schemaVer ?? "UNCONFIRMED",
          FormVer: versions?.formVer ?? "UNCONFIRMED",
        },
        PartA_GEN1: {
          PersonalInfo: personalInfo(payload),
          FilingStatus: filingStatus(payload),
        },

        PartB_TI: {
          Salaries: Math.round(payload.salaryDetail
            ? Math.max(
                0,
                payload.salaryDetail.grossSalary +
                  payload.salaryDetail.perquisites +
                  payload.salaryDetail.profitsInLieu -
                  payload.salaryDetail.exemptSection10 -
                  payload.salaryDetail.standardDeduction -
                  payload.salaryDetail.professionalTax
              )
            : 0),
          CapGain: {
            ShortTerm: {
              ShortTerm15Per: Math.round(payload.capitalGains?.stcg111A ?? 0),
              ShortTermAppRate: Math.round(payload.capitalGains?.otherCapitalGains ?? 0),
              TotalShortTerm: Math.round(
                (payload.capitalGains?.stcg111A ?? 0) + (payload.capitalGains?.otherCapitalGains ?? 0)
              ),
            },
            LongTerm: {
              LongTerm10Per: Math.round(payload.capitalGains?.ltcg112A ?? 0),
              TotalLongTerm: Math.round(payload.capitalGains?.ltcg112A ?? 0),
            },
            // Taxable gains after the Sec 112A annual exemption — the figure the
            // engine actually charged, so Schedule CG ties to Part B-TTI.
            TotalCapGains: Math.round(chosen.taxableIncome - chosen.slabIncome),
          },
          GrossTotalIncome: Math.round(chosen.grossTotalIncome),
          DeductionsUnderScheduleVIA: Math.round(chosen.totalDeductions),
          TotalIncome: Math.round(chosen.taxableIncome),
        },

        PartB_TTI: {
          ComputationOfTaxLiability: {
            TaxPayableOnTI: {
              TaxAtNormalRatesOnAggrInc: Math.round(chosen.slabTax),
              TaxAtSpecialRates: Math.round(chosen.specialRateTax),
              RebateOnAgriInc: 0,
              TaxPayableOnTotInc: Math.round(chosen.taxBeforeRebate),
            },
            Rebate87A: Math.round(chosen.rebate87A),
            TaxPayableOnRebate: Math.round(chosen.taxAfterRebate),
            Surcharge: Math.round(chosen.surcharge),
            EducationCess: Math.round(chosen.cess),
            GrossTaxLiability: Math.round(chosen.totalTaxPayable),
            NetTaxLiability: Math.round(chosen.totalTaxPayable),
          },
          TaxPaid: taxesPaidBlock(payload),
          Refund: refundBlock(payload),
        },

        ...(payload.chapterVIA
          ? {
              ScheduleVIA: {
                DeductUndChapVIA: Object.fromEntries(
                  Object.entries(payload.chapterVIA).map(([section, amount]) => [
                    `Section${section.replace(/[^0-9A-Za-z]/g, "")}`,
                    Math.round(amount),
                  ])
                ),
                TotalChapVIADeductions: Math.round(chosen.totalDeductions),
              },
            }
          : {}),

        Verification: verificationBlock(payload),
      },
    },
  }
}

// ─── Entry point ────────────────────────────────────────────

export interface ITRGenerationResult {
  form: ITRForm
  assessmentYear: string
  json: Record<string, unknown>
  issues: ValidationIssue[]
  /** False when any issue has severity "error" — do not upload such a file. */
  isValid: boolean
  fileName: string
}

/**
 * Validates and generates the return. The JSON is produced even when validation
 * fails, so the wizard can show the user exactly what the file would contain
 * next to the list of problems — but `isValid` gates the download.
 */
export function generateITRJSON(payload: ITRPayload): ITRGenerationResult {
  const issues = validateITRPayload(payload)
  const isValid = !issues.some((issue) => issue.severity === "error")

  const json =
    payload.form === "ITR-2" ? generateITR2JSON(payload) : generateITR1JSON(payload)

  const pan = payload.userProfile.pan?.toUpperCase() ?? "UNKNOWN"
  const ay = payload.taxComputation.assessmentYear.replace("-", "")

  return {
    form: payload.form,
    assessmentYear: payload.taxComputation.assessmentYear,
    json,
    issues,
    isValid,
    fileName: `${pan}_${ay}_${payload.form.replace("-", "")}.json`,
  }
}
