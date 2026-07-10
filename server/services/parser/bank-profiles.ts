// ─── Bank Profile System ────────────────────────────────────
// Each bank has a datasheet defining its PDF format quirks.
// Adding a new bank = adding one BankProfile object. No code changes elsewhere.

// ─── Types ──────────────────────────────────────────────────

export interface BankProfile {
  /** Unique slug: "hdfc", "icici", "sbi", etc. */
  id: string

  /** Display name shown in UI */
  displayName: string

  /** Strings to search in PDF text to auto-identify this bank (case-insensitive) */
  identifiers: string[]

  /** What the password typically is, shown to user as input hint */
  passwordHint: string

  /** Column header keywords — how this bank labels its table columns */
  columns: {
    date: string[]
    description: string[]
    debit: string[]
    credit: string[]
    balance: string[]
    reference?: string[]
    valueDate?: string[]
  }

  /** Date formats used in transaction rows (tried in order) */
  dateFormats: string[]

  /** Labels used in the header/metadata section of the PDF */
  headerLabels: {
    accountNumber: string[]
    holderName: string[]
    statementPeriod: string[]
    ifsc: string[]
    branch: string[]
  }

  /** Text markers that signal the start of the transaction table (the header row) */
  tableStartMarkers: string[]

  /** Text markers that signal the end of the transaction table */
  tableEndMarkers: string[]

  /** Amount formatting quirks */
  amountFormat: {
    /** Does this bank use Dr/Cr suffixes on amounts? */
    usesDrCr: boolean
    /** Does this bank use negative signs for debits? */
    usesNegative: boolean
    /** Thousands separator */
    thousandsSep: string
    /** Decimal separator */
    decimalSep: string
  }
}

// ─── Pre-built Bank Profiles ────────────────────────────────

export const BANK_PROFILES: BankProfile[] = [
  // ── HDFC Bank ───────────────────────────────────────────
  {
    id: "hdfc",
    displayName: "HDFC Bank",
    identifiers: ["HDFC BANK", "HDFC Bank Ltd", "hdfcbank.com", "HDFC BANK LIMITED"],
    passwordHint: "Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Date", "Txn Date"],
      description: ["Narration", "Description"],
      debit: ["Withdrawal Amt.", "Withdrawal Amt", "Debit", "Withdrawal"],
      credit: ["Deposit Amt.", "Deposit Amt", "Credit", "Deposit"],
      balance: ["Closing Balance", "Balance"],
      reference: ["Chq./Ref.No.", "Ref No.", "Chq / Ref number"],
      valueDate: ["Value Dt", "Value Date"],
    },
    dateFormats: ["DD/MM/YY", "DD/MM/YYYY"],
    headerLabels: {
      accountNumber: ["Account No", "Account Number", "A/C No"],
      holderName: ["Account Name", "Name", "Customer Name"],
      statementPeriod: ["Statement From", "Period", "Statement of Account from"],
      ifsc: ["IFSC", "IFSC Code", "IFS Code"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Date", "Narration", "Chq./Ref.No."],
    tableEndMarkers: ["Statement Summary", "This is a computer generated", "Opening Balance"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── ICICI Bank ──────────────────────────────────────────
  {
    id: "icici",
    displayName: "ICICI Bank",
    identifiers: ["ICICI Bank", "ICICI BANK LIMITED", "icicibank.com", "ICICI BANK LTD"],
    passwordHint: "Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Transaction Date", "Txn Date", "Date"],
      description: ["Transaction Remarks", "Particulars", "Description"],
      debit: ["Withdrawal Amount (INR)", "Withdrawal Amount", "Debit", "Withdrawal"],
      credit: ["Deposit Amount (INR)", "Deposit Amount", "Credit", "Deposit"],
      balance: ["Balance (INR)", "Balance"],
      reference: ["Cheque Number", "Chq No"],
      valueDate: ["Value Date"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/C Number"],
      holderName: ["Account Name", "Customer Name", "Name of Account Holder"],
      statementPeriod: ["Statement Period", "From", "Statement for the period"],
      ifsc: ["IFS Code", "IFSC", "IFSC Code"],
      branch: ["Branch", "Home Branch"],
    },
    tableStartMarkers: ["S No.", "Transaction Date", "Value Date", "Txn Date"],
    tableEndMarkers: ["This is a computer generated", "Thank you for banking", "Statement Summary"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── State Bank of India ─────────────────────────────────
  {
    id: "sbi",
    displayName: "State Bank of India",
    identifiers: ["State Bank of India", "STATE BANK OF INDIA", "SBI", "onlinesbi.com", "sbi.co.in"],
    passwordHint: "Date of Birth (DDMMYYYY) or Account Number",
    columns: {
      date: ["Txn Date", "Transaction Date", "Date"],
      description: ["Description", "Narration", "Particulars"],
      debit: ["Debit", "Withdrawal", "Dr"],
      credit: ["Credit", "Deposit", "Cr"],
      balance: ["Balance", "Running Balance"],
      reference: ["Ref No./Cheque No.", "Ref No", "Chq No"],
      valueDate: ["Value Date"],
    },
    dateFormats: ["DD MMM YYYY", "DD-MMM-YYYY", "DD/MM/YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "A/C No", "Account No"],
      holderName: ["Account Holder", "Name", "Customer Name"],
      statementPeriod: ["Statement Period", "Period", "From", "Statement From"],
      ifsc: ["IFSC Code", "IFS Code", "IFSC"],
      branch: ["Branch", "Branch Name", "Branch Code"],
    },
    tableStartMarkers: ["Txn Date", "Value Date", "Description"],
    tableEndMarkers: ["This is a system generated", "Statement Summary", "computer generated"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── Axis Bank ───────────────────────────────────────────
  {
    id: "axis",
    displayName: "Axis Bank",
    identifiers: ["Axis Bank", "AXIS BANK LIMITED", "axisbank.com", "AXIS BANK LTD"],
    passwordHint: "Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Tran Date", "Transaction Date", "Date"],
      description: ["Particulars", "Description", "Narration"],
      debit: ["Dr Amount", "Debit", "Withdrawal"],
      credit: ["Cr Amount", "Credit", "Deposit"],
      balance: ["Balance", "Running Balance"],
      reference: ["Chq No", "Ref No"],
    },
    dateFormats: ["DD-MM-YYYY", "DD/MM/YYYY"],
    headerLabels: {
      accountNumber: ["Account No", "Account Number", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name"],
      statementPeriod: ["Statement Period", "Period", "Statement of account for"],
      ifsc: ["IFSC Code", "IFSC", "IFS Code"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Tran Date", "Particulars", "Dr Amount"],
    tableEndMarkers: ["This is a computer generated", "End of Statement"],
    amountFormat: {
      usesDrCr: true,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── Kotak Mahindra Bank ─────────────────────────────────
  {
    id: "kotak",
    displayName: "Kotak Mahindra Bank",
    identifiers: ["Kotak Mahindra", "KOTAK MAHINDRA BANK", "kotak.com", "Kotak Mahindra Bank Limited"],
    passwordHint: "Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Date", "Txn Date", "Transaction Date"],
      description: ["Description", "Narration", "Particulars"],
      debit: ["Debit", "Dr", "Withdrawal"],
      credit: ["Credit", "Cr", "Deposit"],
      balance: ["Balance", "Running Balance", "Closing Balance"],
      reference: ["Chq/Ref No", "Reference"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD-MMM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/C No"],
      holderName: ["Customer Name", "Account Holder Name", "Name"],
      statementPeriod: ["Statement Period", "From", "Statement From"],
      ifsc: ["IFSC Code", "IFSC", "IFS Code"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Date", "Description", "Debit"],
    tableEndMarkers: ["This is a computer generated", "Statement Summary"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── Punjab National Bank ────────────────────────────────
  {
    id: "pnb",
    displayName: "Punjab National Bank",
    identifiers: ["Punjab National Bank", "PUNJAB NATIONAL BANK", "PNB", "pnbindia.in"],
    passwordHint: "Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Transaction Date", "Txn Date", "Date"],
      description: ["Particulars", "Description", "Narration"],
      debit: ["Debit", "Withdrawal", "Dr"],
      credit: ["Credit", "Deposit", "Cr"],
      balance: ["Balance", "Running Balance"],
      reference: ["Cheque No", "Ref No"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "A/C No", "Account No"],
      holderName: ["Account Holder", "Name", "Customer Name"],
      statementPeriod: ["Statement Period", "Period"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Particulars"],
    tableEndMarkers: ["This is a computer generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── Bank of Baroda ──────────────────────────────────────
  {
    id: "bob",
    displayName: "Bank of Baroda",
    identifiers: ["Bank of Baroda", "BANK OF BARODA", "BOB", "bankofbaroda.in", "bankofbaroda.co.in"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Tran Date", "Date"],
      description: ["Description", "Narration", "Particulars"],
      debit: ["Debit", "Withdrawal", "Dr Amount"],
      credit: ["Credit", "Deposit", "Cr Amount"],
      balance: ["Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/C No"],
      holderName: ["Customer Name", "Account Holder", "Name"],
      statementPeriod: ["Statement Period", "Period"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Description"],
    tableEndMarkers: ["This is a computer generated", "auto generated"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── IndusInd Bank ───────────────────────────────────────
  {
    id: "indusind",
    displayName: "IndusInd Bank",
    identifiers: ["IndusInd Bank", "INDUSIND BANK", "indusind.com", "IndusInd Bank Ltd"],
    passwordHint: "Phone Number or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Transaction Particulars", "Description", "Narration", "Particulars"],
      debit: ["Debit", "Withdrawal", "Amount Debited"],
      credit: ["Credit", "Deposit", "Amount Credited"],
      balance: ["Balance", "Running Balance"],
      reference: ["Reference No", "Ref No", "Cheque No"],
    },
    dateFormats: ["DD-MM-YYYY", "DD/MM/YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No"],
      holderName: ["Customer Name", "Name", "Account Holder"],
      statementPeriod: ["Statement Period", "Period", "Statement From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Transaction Particulars"],
    tableEndMarkers: ["This is a system generated", "auto generated"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── Yes Bank ─────────────────────────────────────────────
  {
    id: "yesbank",
    displayName: "Yes Bank",
    identifiers: ["Yes Bank", "YES BANK", "YESBANK", "yesbank.in", "Yes Bank Ltd"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date", "Value Date"],
      description: ["Transaction Description", "Narration", "Particulars", "Description", "Remarks"],
      debit: ["Debit", "Withdrawal", "Dr.", "Dr Amount"],
      credit: ["Credit", "Deposit", "Cr.", "Cr Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Reference No", "Ref No", "Cheque No"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD MMM YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Holder Name", "Name"],
      statementPeriod: ["Statement Period", "Period", "Statement of Account"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Transaction Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: true,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── Union Bank of India ──────────────────────────────────
  {
    id: "unionbank",
    displayName: "Union Bank of India",
    identifiers: ["Union Bank of India", "UNION BANK OF INDIA", "UnionBank", "unionbankofindia.co.in", "corporation bank", "andhra bank"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Narration", "Description", "Particulars", "Transaction Particulars"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr. Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr. Amount"],
      balance: ["Balance", "Running Balance", "Closing Balance"],
      reference: ["Chq./Ref.No.", "Ref No.", "Cheque Number"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD-MMM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name", "Account Holder"],
      statementPeriod: ["Statement Period", "Period", "From", "Statement of Account"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name", "Home Branch"],
    },
    tableStartMarkers: ["Transaction Date", "Narration", "Description"],
    tableEndMarkers: ["This is a computer generated", "system generated", "Statement Summary"],
    amountFormat: {
      usesDrCr: true,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── Canara Bank ──────────────────────────────────────────
  {
    id: "canara",
    displayName: "Canara Bank",
    identifiers: ["Canara Bank", "CANARA BANK", "canarabank.in", "CanBank"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Tran Date", "Posting Date"],
      description: ["Description", "Narration", "Particulars", "Transaction Remarks"],
      debit: ["Debit", "Withdrawal", "Dr.", "Dr Amount"],
      credit: ["Credit", "Deposit", "Cr.", "Cr Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Reference"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD-MMM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Holder", "Name", "Name of Account Holder"],
      statementPeriod: ["Statement Period", "Period", "For the period from"],
      ifsc: ["IFSC Code", "IFSC", "IFS Code"],
      branch: ["Branch", "Branch Name", "Branch Code"],
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Account Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── Bank of India ────────────────────────────────────────
  {
    id: "boi",
    displayName: "Bank of India",
    identifiers: ["Bank of India", "BANK OF INDIA", "BOI", "bankofindia.co.in", "bankofindia.com"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Tran Date"],
      description: ["Description", "Narration", "Particulars"],
      debit: ["Debit", "Withdrawal", "Dr", "Withdrawal Amount"],
      credit: ["Credit", "Deposit", "Cr", "Deposit Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Chq No"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/C No"],
      holderName: ["Customer Name", "Account Name", "Name"],
      statementPeriod: ["Statement Period", "Period", "Statement From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── Indian Bank ──────────────────────────────────────────
  {
    id: "indianbank",
    displayName: "Indian Bank",
    identifiers: ["Indian Bank", "INDIAN BANK", "indianbank.in", "indianbank.net.in"],
    passwordHint: "Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Transaction Date", "Date", "Tran Date"],
      description: ["Particulars", "Description", "Narration", "Transaction Description"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Chq No", "Ref No", "Cheque No"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name"],
      statementPeriod: ["Statement Period", "Period", "From"],
      ifsc: ["IFSC Code", "IFSC", "IFS Code"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Particulars", "Description"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── IDBI Bank ────────────────────────────────────────────
  {
    id: "idbi",
    displayName: "IDBI Bank",
    identifiers: ["IDBI Bank", "IDBI BANK", "IDBI Bank Ltd", "idbibank.co.in", "idbi.co.in"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Description", "Narration", "Particulars", "Transaction Remarks"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr. Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr. Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Chq. No"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD-MMM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Holder", "Name"],
      statementPeriod: ["Statement Period", "Period", "From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "Statement Summary"],
    amountFormat: {
      usesDrCr: true,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── Federal Bank ─────────────────────────────────────────
  {
    id: "federal",
    displayName: "Federal Bank",
    identifiers: ["Federal Bank", "FEDERAL BANK", "federalbank.co.in", "federalbank.in", "Federal Bank Ltd"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Particulars", "Description", "Narration", "Transaction Description"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr. Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr. Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Chq No"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name", "Account Holder"],
      statementPeriod: ["Statement Period", "Period", "Statement From"],
      ifsc: ["IFSC", "IFSC Code"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Particulars", "Description"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── South Indian Bank ────────────────────────────────────
  {
    id: "southindian",
    displayName: "South Indian Bank",
    identifiers: ["South Indian Bank", "SOUTH INDIAN BANK", "southindianbank.co.in", "southindianbank.in"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Particulars", "Description", "Narration", "Transaction Description"],
      debit: ["Debit", "Withdrawal", "Dr", "Withdrawal Amount"],
      credit: ["Credit", "Deposit", "Cr", "Deposit Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Cheque No", "Ref No", "Chq No"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account No", "Account Number", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name"],
      statementPeriod: ["Statement Period", "Period", "From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Particulars", "Description"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── Bandhan Bank ─────────────────────────────────────────
  {
    id: "bandhan",
    displayName: "Bandhan Bank",
    identifiers: ["Bandhan Bank", "BANDHAN BANK", "bandhanbank.com", "Bandhan Bank Ltd"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Description", "Narration", "Particulars", "Transaction Particulars"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name"],
      statementPeriod: ["Statement Period", "Period", "From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "Statement Summary"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── RBL Bank ─────────────────────────────────────────────
  {
    id: "rbl",
    displayName: "RBL Bank",
    identifiers: ["RBL Bank", "RBL BANK", "Ratnakar Bank", "rblbank.com", "RBL Bank Ltd"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Description", "Narration", "Particulars", "Transaction Remarks"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr. Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr. Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Chq No"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Holder", "Name"],
      statementPeriod: ["Statement Period", "Period", "Statement From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── IDFC First Bank ──────────────────────────────────────
  {
    id: "idfcfirst",
    displayName: "IDFC First Bank",
    identifiers: ["IDFC First Bank", "IDFC FIRST BANK", "IDFC", "idfcfirstbank.com", "IDFC FIRST Bank Ltd"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Description", "Narration", "Particulars", "Transaction Remarks"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr. Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr. Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Chq No"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD-MMM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name", "Account Holder"],
      statementPeriod: ["Statement Period", "Period", "Statement From", "From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── DBS Bank ─────────────────────────────────────────────
  {
    id: "dbs",
    displayName: "DBS Bank",
    identifiers: ["DBS Bank", "DBS BANK", "dbs.com", "DBS Bank India", "DBS Treasures"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date", "Posting Date", "Value Date"],
      description: ["Description", "Narration", "Details", "Transaction Details"],
      debit: ["Debit", "Withdrawal", "Dr", "Amount (Dr)"],
      credit: ["Credit", "Deposit", "Cr", "Amount (Cr)"],
      balance: ["Balance", "Closing Balance", "Available Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Reference No"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD MMM YYYY", "MM/DD/YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name", "Account Holder Name"],
      statementPeriod: ["Statement Period", "Period", "From", "Statement From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration", "Value Date"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },

  // ── Standard Chartered ───────────────────────────────────
  {
    id: "stanchart",
    displayName: "Standard Chartered Bank",
    identifiers: ["Standard Chartered", "STANDARD CHARTERED", "sc.com", "Standard Chartered Bank", "SCBPL"],
    passwordHint: "Date of Birth (DDMMYYYY) or PAN",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Description", "Narration", "Particulars", "Details"],
      debit: ["Debit", "Withdrawal", "Dr.", "Dr. Amount"],
      credit: ["Credit", "Deposit", "Cr.", "Cr. Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Reference"],
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD MMM YYYY", "MM/DD/YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name", "Account Holder Name"],
      statementPeriod: ["Statement Period", "Period", "From", "Statement From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"],
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: ".",
    },
  },
]

// ─── Generic Fallback Profile ───────────────────────────────
// Used when no specific bank matches. Broad keyword lists = union of all banks.

export const GENERIC_PROFILE: BankProfile = {
  id: "generic",
  displayName: "Unknown Bank",
  identifiers: [],
  passwordHint: "Enter the PDF password",
  columns: {
    date: [
      "Date", "Txn Date", "Transaction Date", "Tran Date", "Value Date",
      "Posting Date",
    ],
    description: [
      "Narration", "Description", "Particulars", "Details", "Remarks",
      "Transaction Remarks", "Transaction Particulars",
    ],
    debit: [
      "Debit", "Withdrawal", "Dr", "Dr Amount", "Withdrawal Amt.",
      "Withdrawal Amount", "Withdrawal Amount (INR)", "Amount Debited",
      "Amount (Dr)",
    ],
    credit: [
      "Credit", "Deposit", "Cr", "Cr Amount", "Deposit Amt.",
      "Deposit Amount", "Deposit Amount (INR)", "Amount Credited",
      "Amount (Cr)",
    ],
    balance: [
      "Balance", "Closing Balance", "Running Balance", "Available Balance",
      "Balance (INR)",
    ],
    reference: [
      "Chq./Ref.No.", "Ref No.", "Cheque Number", "Chq No", "Reference",
      "Ref No./Cheque No.", "Reference No",
    ],
    valueDate: ["Value Date", "Value Dt"],
  },
  dateFormats: [
    "DD/MM/YYYY", "DD-MM-YYYY", "DD/MM/YY", "DD-MMM-YYYY", "DD MMM YYYY",
    "MM/DD/YYYY", "YYYY-MM-DD",
  ],
  headerLabels: {
    accountNumber: ["Account Number", "Account No", "A/C No", "A/c No", "A/C Number"],
    holderName: ["Customer Name", "Account Name", "Name", "Account Holder", "Account Holder Name", "Name of Account Holder"],
    statementPeriod: ["Statement Period", "Period", "Statement From", "From", "Statement of Account from", "Statement for the period", "Statement of account for"],
    ifsc: ["IFSC Code", "IFSC", "IFS Code"],
    branch: ["Branch", "Branch Name", "Home Branch", "Branch Code"],
  },
  tableStartMarkers: ["Date", "Narration", "Description", "Particulars"],
  tableEndMarkers: ["This is a computer generated", "This is a system generated", "Statement Summary", "auto generated", "End of Statement"],
  amountFormat: {
    usesDrCr: false,
    usesNegative: false,
    thousandsSep: ",",
    decimalSep: ".",
  },
}

// ─── Helper Functions ───────────────────────────────────────

/**
 * Auto-detect bank from PDF text content.
 * Checks each bank's identifiers against the text (case-insensitive).
 * Returns the first match, or null if no bank is recognized.
 */
export function detectBank(text: string): BankProfile | null {
  const upper = text.toUpperCase()

  for (const profile of BANK_PROFILES) {
    for (const identifier of profile.identifiers) {
      if (upper.includes(identifier.toUpperCase())) {
        return profile
      }
    }
  }

  return null
}

/**
 * Look up a bank profile by explicit ID.
 * Returns null if the ID is not recognized.
 */
export function getBankProfile(bankId: string): BankProfile | null {
  return BANK_PROFILES.find((p) => p.id === bankId) ?? null
}

/**
 * Get list of all supported banks for frontend dropdown.
 * Includes the password hint so the UI can show appropriate placeholder text.
 */
export function listSupportedBanks(): Array<{
  id: string
  displayName: string
  passwordHint: string
}> {
  return BANK_PROFILES.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    passwordHint: p.passwordHint,
  }))
}