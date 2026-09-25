#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// finflow_e1_corpus/evaluate_deterministic.mjs
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");

// server/services/parser/bank-profiles.ts
var BANK_PROFILES = [
  // ── HDFC Bank ───────────────────────────────────────────
  {
    id: "hdfc",
    displayName: "HDFC Bank",
    identifiers: ["HDFC BANK", "HDFC Bank Ltd", "hdfcbank.com", "HDFC BANK LIMITED", "HDFCBANK"],
    passwordHint: "Customer ID (8 digits) OR Date of Birth (DDMMYYYY) OR First 4 letters of name + DDMM",
    columns: {
      date: ["Date", "Txn Date"],
      description: ["Narration", "Description"],
      debit: ["Withdrawal Amt.", "Withdrawal Amt", "Debit", "Withdrawal"],
      credit: ["Deposit Amt.", "Deposit Amt", "Credit", "Deposit"],
      balance: ["Closing Balance", "Balance"],
      reference: ["Chq./Ref.No.", "Ref No.", "Chq / Ref number"],
      valueDate: ["Value Dt", "Value Date"]
    },
    dateFormats: ["DD/MM/YY", "DD/MM/YYYY"],
    headerLabels: {
      accountNumber: ["Account No", "Account Number", "A/C No"],
      holderName: ["Account Name", "Name", "Customer Name"],
      statementPeriod: ["Statement From", "Period", "Statement of Account from"],
      ifsc: ["IFSC", "IFSC Code", "IFS Code"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Date", "Narration", "Chq./Ref.No."],
    tableEndMarkers: ["Statement Summary", "This is a computer generated", "Opening Balance"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── ICICI Bank ──────────────────────────────────────────
  {
    id: "icici",
    displayName: "ICICI Bank",
    identifiers: ["ICICI Bank", "ICICI BANK LIMITED", "icicibank.com", "ICICI BANK LTD", "ICICIBANK"],
    passwordHint: "First 4 letters of name (lowercase) + DDMM of birth (e.g. rahul2508) OR Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Transaction Date", "Txn Date", "Date"],
      description: ["Transaction Remarks", "Particulars", "Description"],
      debit: ["Withdrawal Amount (INR)", "Withdrawal Amount", "Debit", "Withdrawal"],
      credit: ["Deposit Amount (INR)", "Deposit Amount", "Credit", "Deposit"],
      balance: ["Balance (INR)", "Balance"],
      reference: ["Cheque Number", "Chq No"],
      valueDate: ["Value Date"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/C Number"],
      holderName: ["Account Name", "Customer Name", "Name of Account Holder"],
      statementPeriod: ["Statement Period", "From", "Statement for the period"],
      ifsc: ["IFS Code", "IFSC", "IFSC Code"],
      branch: ["Branch", "Home Branch"]
    },
    tableStartMarkers: ["S No.", "Transaction Date", "Value Date", "Txn Date"],
    tableEndMarkers: ["This is a computer generated", "Thank you for banking", "Statement Summary"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── State Bank of India ─────────────────────────────────
  {
    id: "sbi",
    displayName: "State Bank of India",
    identifiers: ["State Bank of India", "STATE BANK OF INDIA", "SBI", "onlinesbi.com", "sbi.co.in", "onlinesbi.sbi"],
    passwordHint: "Last 5 digits of registered mobile + DDMM of birth (9 digits) OR 11-digit Account Number OR DOB (DDMMYYYY)",
    columns: {
      date: ["Txn Date", "Transaction Date", "Date"],
      description: ["Description", "Narration", "Particulars"],
      debit: ["Debit", "Withdrawal", "Dr"],
      credit: ["Credit", "Deposit", "Cr"],
      balance: ["Balance", "Running Balance"],
      reference: ["Ref No./Cheque No.", "Ref No", "Chq No"],
      valueDate: ["Value Date"]
    },
    dateFormats: ["DD MMM YYYY", "DD-MMM-YYYY", "DD/MM/YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "A/C No", "Account No"],
      holderName: ["Account Holder", "Name", "Customer Name"],
      statementPeriod: ["Statement Period", "Period", "From", "Statement From"],
      ifsc: ["IFSC Code", "IFS Code", "IFSC"],
      branch: ["Branch", "Branch Name", "Branch Code"]
    },
    tableStartMarkers: ["Txn Date", "Value Date", "Description"],
    tableEndMarkers: ["This is a system generated", "Statement Summary", "computer generated"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── Axis Bank ───────────────────────────────────────────
  {
    id: "axis",
    displayName: "Axis Bank",
    identifiers: ["Axis Bank", "AXIS BANK LIMITED", "axisbank.com", "AXIS BANK LTD", "AXISBANK"],
    passwordHint: "First 4 letters of name (CAPITALS) + DDMM of birth (e.g. RAHU1504) OR First 4 letters + Last 4 digits of Account Number",
    columns: {
      date: ["Tran Date", "Transaction Date", "Date"],
      description: ["Particulars", "Description", "Narration"],
      debit: ["Dr Amount", "Debit", "Withdrawal"],
      credit: ["Cr Amount", "Credit", "Deposit"],
      balance: ["Balance", "Running Balance"],
      reference: ["Chq No", "Ref No"]
    },
    dateFormats: ["DD-MM-YYYY", "DD/MM/YYYY"],
    headerLabels: {
      accountNumber: ["Account No", "Account Number", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name"],
      statementPeriod: ["Statement Period", "Period", "Statement of account for"],
      ifsc: ["IFSC Code", "IFSC", "IFS Code"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Tran Date", "Particulars", "Dr Amount"],
    tableEndMarkers: ["This is a computer generated", "End of Statement"],
    amountFormat: {
      usesDrCr: true,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── Kotak Mahindra Bank ─────────────────────────────────
  {
    id: "kotak",
    displayName: "Kotak Mahindra Bank",
    identifiers: ["Kotak Mahindra", "KOTAK MAHINDRA BANK", "kotak.com", "Kotak Mahindra Bank Limited", "KOTAK"],
    passwordHint: "Customer Relationship Number (CRN - 9 digits) OR Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Date", "Txn Date", "Transaction Date"],
      description: ["Description", "Narration", "Particulars"],
      debit: ["Debit", "Dr", "Withdrawal"],
      credit: ["Credit", "Cr", "Deposit"],
      balance: ["Balance", "Running Balance", "Closing Balance"],
      reference: ["Chq/Ref No", "Reference"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD-MMM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/C No"],
      holderName: ["Customer Name", "Account Holder Name", "Name"],
      statementPeriod: ["Statement Period", "From", "Statement From"],
      ifsc: ["IFSC Code", "IFSC", "IFS Code"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Date", "Description", "Debit"],
    tableEndMarkers: ["This is a computer generated", "Statement Summary"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── Punjab National Bank ────────────────────────────────
  {
    id: "pnb",
    displayName: "Punjab National Bank",
    identifiers: ["Punjab National Bank", "PUNJAB NATIONAL BANK", "PNB", "pnbindia.in"],
    passwordHint: "Customer ID (9 characters) OR 16-digit Account Number OR Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Transaction Date", "Txn Date", "Date"],
      description: ["Particulars", "Description", "Narration"],
      debit: ["Debit", "Withdrawal", "Dr"],
      credit: ["Credit", "Deposit", "Cr"],
      balance: ["Balance", "Running Balance"],
      reference: ["Cheque No", "Ref No"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "A/C No", "Account No"],
      holderName: ["Account Holder", "Name", "Customer Name"],
      statementPeriod: ["Statement Period", "Period"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Particulars"],
    tableEndMarkers: ["This is a computer generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── Bank of Baroda ──────────────────────────────────────
  {
    id: "bob",
    displayName: "Bank of Baroda",
    identifiers: ["Bank of Baroda", "BANK OF BARODA", "BOB", "bankofbaroda.in", "bankofbaroda.co.in"],
    passwordHint: "First 4 letters of name (CAPITALS) + Last 4 digits of registered mobile OR Account Number",
    columns: {
      date: ["Transaction Date", "Tran Date", "Date"],
      description: ["Description", "Narration", "Particulars"],
      debit: ["Debit", "Withdrawal", "Dr Amount"],
      credit: ["Credit", "Deposit", "Cr Amount"],
      balance: ["Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/C No"],
      holderName: ["Customer Name", "Account Holder", "Name"],
      statementPeriod: ["Statement Period", "Period"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Description"],
    tableEndMarkers: ["This is a computer generated", "auto generated"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── IndusInd Bank ───────────────────────────────────────
  {
    id: "indusind",
    displayName: "IndusInd Bank",
    identifiers: ["IndusInd Bank", "INDUSIND BANK", "indusind.com", "IndusInd Bank Ltd"],
    passwordHint: "Date of Birth (DDMMYYYY) OR First 4 letters of name (CAPITALS) + DDMM of birth",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Transaction Particulars", "Description", "Narration", "Particulars"],
      debit: ["Debit", "Withdrawal", "Amount Debited"],
      credit: ["Credit", "Deposit", "Amount Credited"],
      balance: ["Balance", "Running Balance"],
      reference: ["Reference No", "Ref No", "Cheque No"]
    },
    dateFormats: ["DD-MM-YYYY", "DD/MM/YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No"],
      holderName: ["Customer Name", "Name", "Account Holder"],
      statementPeriod: ["Statement Period", "Period", "Statement From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Transaction Particulars"],
    tableEndMarkers: ["This is a system generated", "auto generated"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── Yes Bank ─────────────────────────────────────────────
  {
    id: "yesbank",
    displayName: "Yes Bank",
    identifiers: ["Yes Bank", "YES BANK", "YESBANK", "yesbank.in", "Yes Bank Ltd"],
    passwordHint: "First 4 letters of name (CAPITALS) + DDMM of birth OR Customer ID",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date", "Value Date"],
      description: ["Transaction Description", "Narration", "Particulars", "Description", "Remarks"],
      debit: ["Debit", "Withdrawal", "Dr.", "Dr Amount"],
      credit: ["Credit", "Deposit", "Cr.", "Cr Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Reference No", "Ref No", "Cheque No"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD MMM YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Holder Name", "Name"],
      statementPeriod: ["Statement Period", "Period", "Statement of Account"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Transaction Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: true,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── Union Bank of India ──────────────────────────────────
  {
    id: "unionbank",
    displayName: "Union Bank of India",
    identifiers: ["Union Bank of India", "UNION BANK OF INDIA", "UnionBank", "unionbankofindia.co.in", "corporation bank", "andhra bank"],
    passwordHint: "First 4 letters of name (CAPITALS) + DDMM of birth OR PAN (in uppercase)",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Narration", "Description", "Particulars", "Transaction Particulars"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr. Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr. Amount"],
      balance: ["Balance", "Running Balance", "Closing Balance"],
      reference: ["Chq./Ref.No.", "Ref No.", "Cheque Number"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD-MMM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name", "Account Holder"],
      statementPeriod: ["Statement Period", "Period", "From", "Statement of Account"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name", "Home Branch"]
    },
    tableStartMarkers: ["Transaction Date", "Narration", "Description"],
    tableEndMarkers: ["This is a computer generated", "system generated", "Statement Summary"],
    amountFormat: {
      usesDrCr: true,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── Canara Bank ──────────────────────────────────────────
  {
    id: "canara",
    displayName: "Canara Bank",
    identifiers: ["Canara Bank", "CANARA BANK", "canarabank.in", "CanBank"],
    passwordHint: "First 4 letters of name (CAPITALS) + Last 4 digits of registered mobile OR Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Transaction Date", "Date", "Tran Date", "Posting Date"],
      description: ["Description", "Narration", "Particulars", "Transaction Remarks"],
      debit: ["Debit", "Withdrawal", "Dr.", "Dr Amount"],
      credit: ["Credit", "Deposit", "Cr.", "Cr Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Reference"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD-MMM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Holder", "Name", "Name of Account Holder"],
      statementPeriod: ["Statement Period", "Period", "For the period from"],
      ifsc: ["IFSC Code", "IFSC", "IFS Code"],
      branch: ["Branch", "Branch Name", "Branch Code"]
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Account Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── Bank of India ────────────────────────────────────────
  {
    id: "boi",
    displayName: "Bank of India",
    identifiers: ["Bank of India", "BANK OF INDIA", "BOI", "bankofindia.co.in", "bankofindia.com"],
    passwordHint: "First 4 letters of name (CAPITALS) + Last 4 digits of registered mobile OR Account Number",
    columns: {
      date: ["Transaction Date", "Date", "Tran Date"],
      description: ["Description", "Narration", "Particulars"],
      debit: ["Debit", "Withdrawal", "Dr", "Withdrawal Amount"],
      credit: ["Credit", "Deposit", "Cr", "Deposit Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Chq No"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/C No"],
      holderName: ["Customer Name", "Account Name", "Name"],
      statementPeriod: ["Statement Period", "Period", "Statement From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── Indian Bank ──────────────────────────────────────────
  {
    id: "indianbank",
    displayName: "Indian Bank",
    identifiers: ["Indian Bank", "INDIAN BANK", "indianbank.in", "indianbank.net.in"],
    passwordHint: "11-digit Account Number OR Customer CIF Number",
    columns: {
      date: ["Transaction Date", "Date", "Tran Date"],
      description: ["Particulars", "Description", "Narration", "Transaction Description"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Chq No", "Ref No", "Cheque No"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name"],
      statementPeriod: ["Statement Period", "Period", "From"],
      ifsc: ["IFSC Code", "IFSC", "IFS Code"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Particulars", "Description"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── IDBI Bank ────────────────────────────────────────────
  {
    id: "idbi",
    displayName: "IDBI Bank",
    identifiers: ["IDBI Bank", "IDBI BANK", "IDBI Bank Ltd", "idbibank.co.in", "idbi.co.in"],
    passwordHint: "Customer ID (Cust ID) OR Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Description", "Narration", "Particulars", "Transaction Remarks"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr. Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr. Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Chq. No"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD-MMM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Holder", "Name"],
      statementPeriod: ["Statement Period", "Period", "From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "Statement Summary"],
    amountFormat: {
      usesDrCr: true,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── Federal Bank ─────────────────────────────────────────
  {
    id: "federal",
    displayName: "Federal Bank",
    identifiers: ["Federal Bank", "FEDERAL BANK", "federalbank.co.in", "federalbank.in", "Federal Bank Ltd"],
    passwordHint: "Date of Birth in DDMMYYYY format",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Particulars", "Description", "Narration", "Transaction Description"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr. Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr. Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Chq No"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name", "Account Holder"],
      statementPeriod: ["Statement Period", "Period", "Statement From"],
      ifsc: ["IFSC", "IFSC Code"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Particulars", "Description"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── South Indian Bank ────────────────────────────────────
  {
    id: "southindian",
    displayName: "South Indian Bank",
    identifiers: ["South Indian Bank", "SOUTH INDIAN BANK", "southindianbank.co.in", "southindianbank.in"],
    passwordHint: "Date of Birth (DDMMYYYY) OR 16-digit Account Number",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Particulars", "Description", "Narration", "Transaction Description"],
      debit: ["Debit", "Withdrawal", "Dr", "Withdrawal Amount"],
      credit: ["Credit", "Deposit", "Cr", "Deposit Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Cheque No", "Ref No", "Chq No"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account No", "Account Number", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name"],
      statementPeriod: ["Statement Period", "Period", "From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Particulars", "Description"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── Bandhan Bank ─────────────────────────────────────────
  {
    id: "bandhan",
    displayName: "Bandhan Bank",
    identifiers: ["Bandhan Bank", "BANDHAN BANK", "bandhanbank.com", "Bandhan Bank Ltd"],
    passwordHint: "First 4 letters of name (CAPITALS) + DDMM of birth OR Customer CIF",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Description", "Narration", "Particulars", "Transaction Particulars"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name"],
      statementPeriod: ["Statement Period", "Period", "From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "Statement Summary"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── RBL Bank ─────────────────────────────────────────────
  {
    id: "rbl",
    displayName: "RBL Bank",
    identifiers: ["RBL Bank", "RBL BANK", "Ratnakar Bank", "rblbank.com", "RBL Bank Ltd"],
    passwordHint: "Customer ID (CIF) OR Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Description", "Narration", "Particulars", "Transaction Remarks"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr. Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr. Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Chq No"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Holder", "Name"],
      statementPeriod: ["Statement Period", "Period", "Statement From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── IDFC First Bank ──────────────────────────────────────
  {
    id: "idfcfirst",
    displayName: "IDFC First Bank",
    identifiers: ["IDFC First Bank", "IDFC FIRST BANK", "IDFC", "idfcfirstbank.com", "IDFC FIRST Bank Ltd", "IDFCFIRST"],
    passwordHint: "Date of Birth (DDMMYYYY) OR Registered Mobile Number (10 digits)",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Description", "Narration", "Particulars", "Transaction Remarks"],
      debit: ["Debit", "Withdrawal", "Dr", "Dr. Amount"],
      credit: ["Credit", "Deposit", "Cr", "Cr. Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Chq No"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD-MMM-YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name", "Account Holder"],
      statementPeriod: ["Statement Period", "Period", "Statement From", "From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── DBS Bank ─────────────────────────────────────────────
  {
    id: "dbs",
    displayName: "DBS Bank",
    identifiers: ["DBS Bank", "DBS BANK", "dbs.com", "DBS Bank India", "DBS Treasures", "DBS"],
    passwordHint: "Date of Birth (DDMMYYYY) OR First 4 letters of name (CAPITALS) + DDMM of birth",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date", "Posting Date", "Value Date"],
      description: ["Description", "Narration", "Details", "Transaction Details"],
      debit: ["Debit", "Withdrawal", "Dr", "Amount (Dr)"],
      credit: ["Credit", "Deposit", "Cr", "Amount (Cr)"],
      balance: ["Balance", "Closing Balance", "Available Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Reference No"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD MMM YYYY", "MM/DD/YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name", "Account Holder Name"],
      statementPeriod: ["Statement Period", "Period", "From", "Statement From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration", "Value Date"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  },
  // ── Standard Chartered ───────────────────────────────────
  {
    id: "stanchart",
    displayName: "Standard Chartered Bank",
    identifiers: ["Standard Chartered", "STANDARD CHARTERED", "sc.com", "Standard Chartered Bank", "SCBPL", "StanChart"],
    passwordHint: "First 4 letters of name (CAPITALS) + Year of birth (YYYY) OR Date of Birth (DDMMYYYY)",
    columns: {
      date: ["Transaction Date", "Date", "Txn Date"],
      description: ["Description", "Narration", "Particulars", "Details"],
      debit: ["Debit", "Withdrawal", "Dr.", "Dr. Amount"],
      credit: ["Credit", "Deposit", "Cr.", "Cr. Amount"],
      balance: ["Balance", "Closing Balance", "Running Balance"],
      reference: ["Ref No", "Cheque No", "Reference"]
    },
    dateFormats: ["DD/MM/YYYY", "DD-MM-YYYY", "DD MMM YYYY", "MM/DD/YYYY"],
    headerLabels: {
      accountNumber: ["Account Number", "Account No", "A/c No"],
      holderName: ["Customer Name", "Account Name", "Name", "Account Holder Name"],
      statementPeriod: ["Statement Period", "Period", "From", "Statement From"],
      ifsc: ["IFSC Code", "IFSC"],
      branch: ["Branch", "Branch Name"]
    },
    tableStartMarkers: ["Transaction Date", "Description", "Narration"],
    tableEndMarkers: ["This is a computer generated", "system generated", "End of Statement"],
    amountFormat: {
      usesDrCr: false,
      usesNegative: false,
      thousandsSep: ",",
      decimalSep: "."
    }
  }
];
var GENERIC_PROFILE = {
  id: "generic",
  displayName: "Unknown Bank",
  identifiers: [],
  passwordHint: "Enter the statement PDF password (typically DOB DDMMYYYY, Customer ID, or PAN)",
  columns: {
    date: [
      "Date",
      "Txn Date",
      "Transaction Date",
      "Tran Date",
      "Value Date",
      "Posting Date"
    ],
    description: [
      "Narration",
      "Description",
      "Particulars",
      "Details",
      "Remarks",
      "Transaction Remarks",
      "Transaction Particulars"
    ],
    debit: [
      "Debit",
      "Withdrawal",
      "Dr",
      "Dr Amount",
      "Withdrawal Amt.",
      "Withdrawal Amount",
      "Withdrawal Amount (INR)",
      "Amount Debited",
      "Amount (Dr)"
    ],
    credit: [
      "Credit",
      "Deposit",
      "Cr",
      "Cr Amount",
      "Deposit Amt.",
      "Deposit Amount",
      "Deposit Amount (INR)",
      "Amount Credited",
      "Amount (Cr)"
    ],
    balance: [
      "Balance",
      "Closing Balance",
      "Running Balance",
      "Available Balance",
      "Balance (INR)"
    ],
    reference: [
      "Chq./Ref.No.",
      "Ref No.",
      "Cheque Number",
      "Chq No",
      "Reference",
      "Ref No./Cheque No.",
      "Reference No"
    ],
    valueDate: ["Value Date", "Value Dt"]
  },
  dateFormats: [
    "DD/MM/YYYY",
    "DD-MM-YYYY",
    "DD/MM/YY",
    "DD-MMM-YYYY",
    "DD MMM YYYY",
    "MM/DD/YYYY",
    "YYYY-MM-DD"
  ],
  headerLabels: {
    accountNumber: ["Account Number", "Account No", "A/C No", "A/c No", "A/C Number"],
    holderName: ["Customer Name", "Account Name", "Name", "Account Holder", "Account Holder Name", "Name of Account Holder"],
    statementPeriod: ["Statement Period", "Period", "Statement From", "From", "Statement of Account from", "Statement for the period", "Statement of account for"],
    ifsc: ["IFSC Code", "IFSC", "IFS Code"],
    branch: ["Branch", "Branch Name", "Home Branch", "Branch Code"]
  },
  tableStartMarkers: ["Date", "Narration", "Description", "Particulars"],
  tableEndMarkers: ["This is a computer generated", "This is a system generated", "Statement Summary", "auto generated", "End of Statement"],
  amountFormat: {
    usesDrCr: false,
    usesNegative: false,
    thousandsSep: ",",
    decimalSep: "."
  }
};
function detectBank(text2) {
  const upper = text2.toUpperCase();
  let bestMatch = null;
  for (const profile of BANK_PROFILES) {
    for (const identifier of profile.identifiers) {
      const idUpper = identifier.toUpperCase();
      if (upper.includes(idUpper)) {
        const words = idUpper.split(/\s+/).length;
        const score = idUpper.length + words * 10;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { profile, score };
        }
      }
    }
  }
  return bestMatch?.profile ?? null;
}
function getBankProfile(bankId) {
  return BANK_PROFILES.find((p) => p.id === bankId) ?? null;
}

// server/services/parser/categorizer.ts
var RULES = [
  // Income
  { keywords: ["salary", "sal credit", "ctc", "payroll", "pay credit", "monthly pay", "basic salary", "net salary"], category: "salary", isRecurring: true },
  { keywords: ["freelance", "upwork", "fiverr", "toptal", "consulting fee"], category: "freelance" },
  { keywords: ["dividend", "interest credit", "fd interest", "mutual fund"], category: "investment_return" },
  { keywords: ["refund", "cashback", "reversal", "return credit"], category: "refund" },
  { keywords: ["rental income", "rent received"], category: "rental_income" },
  // Food
  { keywords: ["swiggy", "zomato", "food panda", "uber eats", "blinkit food"], category: "food_dining", subcategory: "food_delivery" },
  { keywords: ["mcdonald", "kfc", "domino", "pizza hut", "burger king", "subway", "starbucks", "cafe coffee day", "ccd", "barista"], category: "food_dining", subcategory: "restaurant" },
  { keywords: ["restaurant", "dhaba", "biryani", "canteen", "tiffin", "hotel food"], category: "food_dining" },
  // Groceries
  { keywords: ["bigbasket", "big basket", "grofers", "blinkit", "zepto", "dunzo", "jiomart", "instamart"], category: "groceries", subcategory: "online_grocery" },
  { keywords: ["dmart", "d-mart", "reliance fresh", "reliance smart", "nature's basket", "spencers", "star bazaar"], category: "groceries", subcategory: "supermarket" },
  { keywords: ["grocery", "vegetables", "fruits", "milk", "dairy", "kirana", "supermarket", "provision"], category: "groceries" },
  // Transport
  { keywords: ["ola", "uber", "rapido", "meru", "taxi", "cab booking"], category: "transportation", subcategory: "ride_hailing" },
  { keywords: ["metro", "dmrc", "bmtc", "best bus", "bus pass", "local train"], category: "transportation", subcategory: "public_transport" },
  { keywords: ["irctc", "rail ticket", "railway"], category: "travel", subcategory: "train" },
  // Fuel
  { keywords: ["petrol", "diesel", "fuel", "hp fuel", "iocl", "bpcl", "bharat petroleum", "hindustan petroleum", "indian oil", "shell", "essar fuel"], category: "fuel" },
  // Utilities
  { keywords: ["electricity", "power bill", "bescom", "msedcl", "tpddl", "bses", "kseb", "tangedco", "adani electricity"], category: "utilities", subcategory: "electricity", isRecurring: true },
  { keywords: ["water bill", "water charges", "jal board"], category: "utilities", subcategory: "water", isRecurring: true },
  { keywords: ["gas bill", "piped gas", "indane gas", "bharat gas", "hp gas", "mahanagar gas", "igl", "mgl"], category: "utilities", subcategory: "gas", isRecurring: true },
  { keywords: ["broadband", "internet", "wifi", "jio fiber", "airtel fiber", "bsnl broadband", "act fiber"], category: "utilities", subcategory: "internet", isRecurring: true },
  { keywords: ["mobile recharge", "phone bill", "airtel", "vodafone", "vi ", "jio prepaid", "bsnl", "tata docomo"], category: "utilities", subcategory: "mobile", isRecurring: true },
  // Rent
  { keywords: ["rent", "house rent", "pg rent", "accommodation", "flat rent", "apartment rent", "nobroker"], category: "rent", isRecurring: true },
  // EMI
  { keywords: ["emi", "loan emi", "home loan", "car loan", "personal loan emi", "bike emi", "consumer loan"], category: "emi_loan", isRecurring: true },
  { keywords: ["credit card bill", "cc payment", "hdfc cc", "icici cc", "sbi card", "axis cc", "kotak cc", "amex"], category: "emi_loan", subcategory: "credit_card", isRecurring: true },
  // Insurance
  { keywords: ["insurance", "premium", "lic", "life insurance", "health insurance", "term insurance", "vehicle insurance", "niva bupa", "star health", "hdfc life", "sbi life", "bajaj allianz"], category: "insurance", isRecurring: true },
  // Healthcare
  { keywords: ["hospital", "clinic", "doctor", "medical", "pharmacy", "apollo", "fortis", "medplus", "netmeds", "1mg", "pharmeasy", "diagnostic"], category: "healthcare" },
  // Education
  { keywords: ["school fees", "college fees", "tuition", "coaching", "byju", "unacademy", "vedantu", "coursera", "udemy", "course fee", "exam fee"], category: "education" },
  // Streaming/Subscriptions
  { keywords: ["netflix", "hotstar", "amazon prime", "zee5", "sonyliv", "voot", "jiocinema", "spotify", "gaana", "youtube premium"], category: "subscriptions", subcategory: "streaming", isRecurring: true },
  // Entertainment
  { keywords: ["movie", "pvr", "inox", "cinepolis", "cinema", "bookmyshow", "theatre", "concert"], category: "entertainment", subcategory: "movies" },
  { keywords: ["gaming", "steam", "playstation", "xbox", "dream11", "fantasy"], category: "entertainment", subcategory: "gaming" },
  // Shopping
  { keywords: ["amazon", "flipkart", "myntra", "ajio", "nykaa", "meesho", "snapdeal", "shopsy", "tata cliq", "reliance digital", "croma", "vijay sales"], category: "shopping", subcategory: "online" },
  { keywords: ["clothes", "fashion", "apparel", "shoes", "footwear", "mall", "jewellery"], category: "shopping", subcategory: "fashion" },
  { keywords: ["electronics", "mobile phone", "laptop", "gadget", "appliances"], category: "shopping", subcategory: "electronics" },
  // Travel
  { keywords: ["makemytrip", "goibibo", "yatra", "cleartrip", "ixigo", "booking.com", "oyo", "airbnb", "hotel", "resort"], category: "travel", subcategory: "hotel" },
  { keywords: ["indigo", "air india", "vistara", "spicejet", "go air", "akasa", "flight", "airline", "air ticket"], category: "travel", subcategory: "flight" },
  // Personal Care
  { keywords: ["salon", "spa", "haircut", "manicure", "pedicure", "beauty", "lakme", "loreal"], category: "personal_care" },
  // Charity
  { keywords: ["donation", "charity", "ngo", "temple", "church", "mosque", "gurudwara", "pm relief", "pm cares"], category: "charity" },
  // Transfer
  { keywords: ["neft", "rtgs", "imps transfer", "upi transfer", "sent to", "transfer to", "self transfer", "atm withdrawal", "cash withdrawal"], category: "transfer" }
];
function categorizeTransaction(description, amount, type) {
  const lower = description.toLowerCase();
  if (type === "credit") {
    const incomeCategories = ["salary", "freelance", "investment_return", "refund", "rental_income", "gift_received"];
    for (const rule of RULES) {
      if (incomeCategories.includes(rule.category) && rule.keywords.some((kw) => lower.includes(kw))) {
        return { category: rule.category, subcategory: rule.subcategory, isRecurring: rule.isRecurring ?? false, merchant: extractMerchant(description) };
      }
    }
    return { category: "transfer", isRecurring: false, merchant: extractMerchant(description) };
  }
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return { category: rule.category, subcategory: rule.subcategory, isRecurring: rule.isRecurring ?? false, merchant: extractMerchant(description) };
    }
  }
  return { category: "miscellaneous", isRecurring: false, merchant: extractMerchant(description) };
}
function extractMerchant(description) {
  const cleaned = description.replace(/UPI-/gi, "").replace(/NEFT-/gi, "").replace(/IMPS-/gi, "").replace(/\d{6,}/g, "").replace(/\s+/g, " ").trim();
  return cleaned.split(/[-\/|]/)[0]?.trim().slice(0, 40) || description.slice(0, 40);
}

// server/services/parser/deduplicator.ts
var import_crypto = __toESM(require("crypto"));

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/entity.js
var entityKind = Symbol.for("drizzle:entityKind");
var hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(
      `Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`
    );
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/column.js
var Column = class {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = void 0;
  generated = void 0;
  generatedIdentity = void 0;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  // ** @internal */
  shouldDisableInsert() {
    return this.config.generated !== void 0 && this.config.generated.type !== "byDefault";
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/column-builder.js
var ColumnBuilder = class {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: void 0,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: void 0,
      uniqueType: void 0,
      dataType,
      columnType,
      generated: void 0
    };
  }
  /**
   * Changes the data type of the column. Commonly used with `json` columns. Also, useful for branded types.
   *
   * @example
   * ```ts
   * const users = pgTable('users', {
   * 	id: integer('id').$type<UserId>().primaryKey(),
   * 	details: json('details').$type<UserDetails>().notNull(),
   * });
   * ```
   */
  $type() {
    return this;
  }
  /**
   * Adds a `not null` clause to the column definition.
   *
   * Affects the `select` model of the table - columns *without* `not null` will be nullable on select.
   */
  notNull() {
    this.config.notNull = true;
    return this;
  }
  /**
   * Adds a `default <value>` clause to the column definition.
   *
   * Affects the `insert` model of the table - columns *with* `default` are optional on insert.
   *
   * If you need to set a dynamic default value, use {@link $defaultFn} instead.
   */
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Adds a dynamic default value to the column.
   * The function will be called when the row is inserted, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $defaultFn}.
   */
  $default = this.$defaultFn;
  /**
   * Adds a dynamic update value to the column.
   * The function will be called when the row is updated, and the returned value will be used as the column value if none is provided.
   * If no `default` (or `$defaultFn`) value is provided, the function will be called when the row is inserted as well, and the returned value will be used as the column value.
   *
   * **Note:** This value does not affect the `drizzle-kit` behavior, it is only used at runtime in `drizzle-orm`.
   */
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  /**
   * Alias for {@link $onUpdateFn}.
   */
  $onUpdate = this.$onUpdateFn;
  /**
   * Adds a `primary key` clause to the column definition. This implicitly makes the column `not null`.
   *
   * In SQLite, `integer primary key` implicitly makes the column auto-incrementing.
   */
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  /** @internal Sets the name of the column to the key within the table definition if a name was not given. */
  setName(name) {
    if (this.config.name !== "") return;
    this.config.name = name;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/table.utils.js
var TableName = Symbol.for("drizzle:Name");

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/foreign-keys.js
var ForeignKeyBuilder = class {
  static [entityKind] = "PgForeignKeyBuilder";
  /** @internal */
  reference;
  /** @internal */
  _onUpdate = "no action";
  /** @internal */
  _onDelete = "no action";
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action === void 0 ? "no action" : action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action === void 0 ? "no action" : action;
    return this;
  }
  /** @internal */
  build(table) {
    return new ForeignKey(table, this);
  }
};
var ForeignKey = class {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "PgForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}
var UniqueConstraintBuilder = class {
  constructor(columns, name) {
    this.name = name;
    this.columns = columns;
  }
  static [entityKind] = "PgUniqueConstraintBuilder";
  /** @internal */
  columns;
  /** @internal */
  nullsNotDistinctConfig = false;
  nullsNotDistinct() {
    this.nullsNotDistinctConfig = true;
    return this;
  }
  /** @internal */
  build(table) {
    return new UniqueConstraint(table, this.columns, this.nullsNotDistinctConfig, this.name);
  }
};
var UniqueOnConstraintBuilder = class {
  static [entityKind] = "PgUniqueOnConstraintBuilder";
  /** @internal */
  name;
  constructor(name) {
    this.name = name;
  }
  on(...columns) {
    return new UniqueConstraintBuilder(columns, this.name);
  }
};
var UniqueConstraint = class {
  constructor(table, columns, nullsNotDistinct, name) {
    this.table = table;
    this.columns = columns;
    this.name = name ?? uniqueKeyName(this.table, this.columns.map((column) => column.name));
    this.nullsNotDistinct = nullsNotDistinct;
  }
  static [entityKind] = "PgUniqueConstraint";
  columns;
  name;
  nullsNotDistinct = false;
  getName() {
    return this.name;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/utils/array.js
function parsePgArrayValue(arrayString, startFrom, inQuotes) {
  for (let i = startFrom; i < arrayString.length; i++) {
    const char2 = arrayString[i];
    if (char2 === "\\") {
      i++;
      continue;
    }
    if (char2 === '"') {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i + 1];
    }
    if (inQuotes) {
      continue;
    }
    if (char2 === "," || char2 === "}") {
      return [arrayString.slice(startFrom, i).replace(/\\/g, ""), i];
    }
  }
  return [arrayString.slice(startFrom).replace(/\\/g, ""), arrayString.length];
}
function parsePgNestedArray(arrayString, startFrom = 0) {
  const result = [];
  let i = startFrom;
  let lastCharIsComma = false;
  while (i < arrayString.length) {
    const char2 = arrayString[i];
    if (char2 === ",") {
      if (lastCharIsComma || i === startFrom) {
        result.push("");
      }
      lastCharIsComma = true;
      i++;
      continue;
    }
    lastCharIsComma = false;
    if (char2 === "\\") {
      i += 2;
      continue;
    }
    if (char2 === '"') {
      const [value2, startFrom2] = parsePgArrayValue(arrayString, i + 1, true);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    if (char2 === "}") {
      return [result, i + 1];
    }
    if (char2 === "{") {
      const [value2, startFrom2] = parsePgNestedArray(arrayString, i + 1);
      result.push(value2);
      i = startFrom2;
      continue;
    }
    const [value, newStartFrom] = parsePgArrayValue(arrayString, i, false);
    result.push(value);
    i = newStartFrom;
  }
  return [result, i];
}
function parsePgArray(arrayString) {
  const [result] = parsePgNestedArray(arrayString, 1);
  return result;
}
function makePgArray(array) {
  return `{${array.map((item) => {
    if (Array.isArray(item)) {
      return makePgArray(item);
    }
    if (typeof item === "string") {
      return `"${item.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    }
    return `${item}`;
  }).join(",")}}`;
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/common.js
var PgColumnBuilder = class extends ColumnBuilder {
  foreignKeyConfigs = [];
  static [entityKind] = "PgColumnBuilder";
  array(size) {
    return new PgArrayBuilder(this.config.name, this, size);
  }
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name, config) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    this.config.uniqueType = config?.nulls;
    return this;
  }
  generatedAlwaysAs(as) {
    this.config.generated = {
      as,
      type: "always",
      mode: "stored"
    };
    return this;
  }
  /** @internal */
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return iife(
        (ref2, actions2) => {
          const builder = new ForeignKeyBuilder(() => {
            const foreignColumn = ref2();
            return { columns: [column], foreignColumns: [foreignColumn] };
          });
          if (actions2.onUpdate) {
            builder.onUpdate(actions2.onUpdate);
          }
          if (actions2.onDelete) {
            builder.onDelete(actions2.onDelete);
          }
          return builder.build(table);
        },
        ref,
        actions
      );
    });
  }
  /** @internal */
  buildExtraConfigColumn(table) {
    return new ExtraConfigColumn(table, this.config);
  }
};
var PgColumn = class extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "PgColumn";
};
var ExtraConfigColumn = class extends PgColumn {
  static [entityKind] = "ExtraConfigColumn";
  getSQLType() {
    return this.getSQLType();
  }
  indexConfig = {
    order: this.config.order ?? "asc",
    nulls: this.config.nulls ?? "last",
    opClass: this.config.opClass
  };
  defaultConfig = {
    order: "asc",
    nulls: "last",
    opClass: void 0
  };
  asc() {
    this.indexConfig.order = "asc";
    return this;
  }
  desc() {
    this.indexConfig.order = "desc";
    return this;
  }
  nullsFirst() {
    this.indexConfig.nulls = "first";
    return this;
  }
  nullsLast() {
    this.indexConfig.nulls = "last";
    return this;
  }
  /**
   * ### PostgreSQL documentation quote
   *
   * > An operator class with optional parameters can be specified for each column of an index.
   * The operator class identifies the operators to be used by the index for that column.
   * For example, a B-tree index on four-byte integers would use the int4_ops class;
   * this operator class includes comparison functions for four-byte integers.
   * In practice the default operator class for the column's data type is usually sufficient.
   * The main point of having operator classes is that for some data types, there could be more than one meaningful ordering.
   * For example, we might want to sort a complex-number data type either by absolute value or by real part.
   * We could do this by defining two operator classes for the data type and then selecting the proper class when creating an index.
   * More information about operator classes check:
   *
   * ### Useful links
   * https://www.postgresql.org/docs/current/sql-createindex.html
   *
   * https://www.postgresql.org/docs/current/indexes-opclass.html
   *
   * https://www.postgresql.org/docs/current/xindex.html
   *
   * ### Additional types
   * If you have the `pg_vector` extension installed in your database, you can use the
   * `vector_l2_ops`, `vector_ip_ops`, `vector_cosine_ops`, `vector_l1_ops`, `bit_hamming_ops`, `bit_jaccard_ops`, `halfvec_l2_ops`, `sparsevec_l2_ops` options, which are predefined types.
   *
   * **You can always specify any string you want in the operator class, in case Drizzle doesn't have it natively in its types**
   *
   * @param opClass
   * @returns
   */
  op(opClass) {
    this.indexConfig.opClass = opClass;
    return this;
  }
};
var IndexedColumn = class {
  static [entityKind] = "IndexedColumn";
  constructor(name, keyAsName, type, indexConfig) {
    this.name = name;
    this.keyAsName = keyAsName;
    this.type = type;
    this.indexConfig = indexConfig;
  }
  name;
  keyAsName;
  type;
  indexConfig;
};
var PgArrayBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgArrayBuilder";
  constructor(name, baseBuilder, size) {
    super(name, "array", "PgArray");
    this.config.baseBuilder = baseBuilder;
    this.config.size = size;
  }
  /** @internal */
  build(table) {
    const baseColumn = this.config.baseBuilder.build(table);
    return new PgArray(
      table,
      this.config,
      baseColumn
    );
  }
};
var PgArray = class _PgArray extends PgColumn {
  constructor(table, config, baseColumn, range) {
    super(table, config);
    this.baseColumn = baseColumn;
    this.range = range;
    this.size = config.size;
  }
  size;
  static [entityKind] = "PgArray";
  getSQLType() {
    return `${this.baseColumn.getSQLType()}[${typeof this.size === "number" ? this.size : ""}]`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      value = parsePgArray(value);
    }
    return value.map((v) => this.baseColumn.mapFromDriverValue(v));
  }
  mapToDriverValue(value, isNestedArray = false) {
    const a = value.map(
      (v) => v === null ? null : is(this.baseColumn, _PgArray) ? this.baseColumn.mapToDriverValue(v, true) : this.baseColumn.mapToDriverValue(v)
    );
    if (isNestedArray) return a;
    return makePgArray(a);
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/enum.js
var PgEnumObjectColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumObjectColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumObjectColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumObjectColumn(
      table,
      this.config
    );
  }
};
var PgEnumObjectColumn = class extends PgColumn {
  static [entityKind] = "PgEnumObjectColumn";
  enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
var isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}
var PgEnumColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgEnumColumnBuilder";
  constructor(name, enumInstance) {
    super(name, "string", "PgEnumColumn");
    this.config.enum = enumInstance;
  }
  /** @internal */
  build(table) {
    return new PgEnumColumn(
      table,
      this.config
    );
  }
};
var PgEnumColumn = class extends PgColumn {
  static [entityKind] = "PgEnumColumn";
  enum = this.config.enum;
  enumValues = this.config.enum.enumValues;
  constructor(table, config) {
    super(table, config);
    this.enum = config.enum;
  }
  getSQLType() {
    return this.enum.enumName;
  }
};
function pgEnum(enumName, input) {
  return Array.isArray(input) ? pgEnumWithSchema(enumName, [...input], void 0) : pgEnumObjectWithSchema(enumName, input, void 0);
}
function pgEnumWithSchema(enumName, values, schema) {
  const enumInstance = Object.assign(
    (name) => new PgEnumColumnBuilder(name ?? "", enumInstance),
    {
      enumName,
      enumValues: values,
      schema,
      [isPgEnumSym]: true
    }
  );
  return enumInstance;
}
function pgEnumObjectWithSchema(enumName, values, schema) {
  const enumInstance = Object.assign(
    (name) => new PgEnumObjectColumnBuilder(name ?? "", enumInstance),
    {
      enumName,
      enumValues: Object.values(values),
      schema,
      [isPgEnumSym]: true
    }
  );
  return enumInstance;
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/subquery.js
var Subquery = class {
  static [entityKind] = "Subquery";
  constructor(sql2, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql: sql2,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
  // getSQL(): SQL<unknown> {
  // 	return new SQL([this]);
  // }
};
var WithSubquery = class extends Subquery {
  static [entityKind] = "WithSubquery";
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/version.js
var version = "0.45.1";

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version);
    }
    return iife(
      (otel2, rawTracer2) => rawTracer2.startActiveSpan(
        name,
        (span) => {
          try {
            return fn(span);
          } catch (e) {
            span.setStatus({
              code: otel2.SpanStatusCode.ERROR,
              message: e instanceof Error ? e.message : "Unknown error"
              // eslint-disable-line no-instanceof/no-instanceof
            });
            throw e;
          } finally {
            span.end();
          }
        }
      ),
      otel,
      rawTracer
    );
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/table.js
var Schema = Symbol.for("drizzle:Schema");
var Columns = Symbol.for("drizzle:Columns");
var ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = Symbol.for("drizzle:OriginalName");
var BaseName = Symbol.for("drizzle:BaseName");
var IsAlias = Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");
var Table = class {
  static [entityKind] = "Table";
  /** @internal */
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  /**
   * @internal
   * Can be changed if the table is aliased.
   */
  [TableName];
  /**
   * @internal
   * Used to store the original name of the table, before any aliasing.
   */
  [OriginalName];
  /** @internal */
  [Schema];
  /** @internal */
  [Columns];
  /** @internal */
  [ExtraConfigColumns];
  /**
   *  @internal
   * Used to store the table name before the transformation via the `tableCreator` functions.
   */
  [BaseName];
  /** @internal */
  [IsAlias] = false;
  /** @internal */
  [IsDrizzleTable] = true;
  /** @internal */
  [ExtraConfigBuilder] = void 0;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/sql/sql.js
var FakePrimitiveParam = class {
  static [entityKind] = "FakePrimitiveParam";
};
function isSQLWrapper(value) {
  return value !== null && value !== void 0 && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}
var StringChunk = class {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
};
var SQL = class _SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(
          schemaName === void 0 ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]
        );
      }
    }
  }
  static [entityKind] = "SQL";
  /** @internal */
  decoder = noopDecoder;
  shouldInlineParams = false;
  /** @internal */
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === void 0) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, _SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === void 0 || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === void 0 ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === void 0 || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, _SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, _SQL.Aliased) && chunk.fieldAlias !== void 0) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === void 0) {
      return this;
    }
    return new _SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  /**
   * This method is used to conditionally include a part of the query.
   *
   * @param condition - Condition to check
   * @returns itself if the condition is `true`, otherwise `undefined`
   */
  if(condition) {
    return condition ? this : void 0;
  }
};
var Name = class {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};
var Param = class {
  /**
   * @param value - Parameter value
   * @param encoder - Encoder to convert the value to a driver parameter
   */
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
};
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== void 0) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {
  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    /** @internal */
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    /** @internal */
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));
var Placeholder = class {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
};
var IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");
var View = class {
  static [entityKind] = "View";
  /** @internal */
  [ViewBaseConfig];
  /** @internal */
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
};
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/utils.js
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder();

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/int.common.js
var PgIntColumnBaseBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgIntColumnBaseBuilder";
  generatedAlwaysAsIdentity(sequence) {
    if (sequence) {
      const { name, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "always",
        sequenceName: name,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "always"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
  generatedByDefaultAsIdentity(sequence) {
    if (sequence) {
      const { name, ...options } = sequence;
      this.config.generatedIdentity = {
        type: "byDefault",
        sequenceName: name,
        sequenceOptions: options
      };
    } else {
      this.config.generatedIdentity = {
        type: "byDefault"
      };
    }
    this.config.hasDefault = true;
    this.config.notNull = true;
    return this;
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/bigint.js
var PgBigInt53Builder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgBigInt53Builder";
  constructor(name) {
    super(name, "number", "PgBigInt53");
  }
  /** @internal */
  build(table) {
    return new PgBigInt53(table, this.config);
  }
};
var PgBigInt53 = class extends PgColumn {
  static [entityKind] = "PgBigInt53";
  getSQLType() {
    return "bigint";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
};
var PgBigInt64Builder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgBigInt64Builder";
  constructor(name) {
    super(name, "bigint", "PgBigInt64");
  }
  /** @internal */
  build(table) {
    return new PgBigInt64(
      table,
      this.config
    );
  }
};
var PgBigInt64 = class extends PgColumn {
  static [entityKind] = "PgBigInt64";
  getSQLType() {
    return "bigint";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
};
function bigint(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "number") {
    return new PgBigInt53Builder(name);
  }
  return new PgBigInt64Builder(name);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/bigserial.js
var PgBigSerial53Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgBigSerial53Builder";
  constructor(name) {
    super(name, "number", "PgBigSerial53");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgBigSerial53(
      table,
      this.config
    );
  }
};
var PgBigSerial53 = class extends PgColumn {
  static [entityKind] = "PgBigSerial53";
  getSQLType() {
    return "bigserial";
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") {
      return value;
    }
    return Number(value);
  }
};
var PgBigSerial64Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgBigSerial64Builder";
  constructor(name) {
    super(name, "bigint", "PgBigSerial64");
    this.config.hasDefault = true;
  }
  /** @internal */
  build(table) {
    return new PgBigSerial64(
      table,
      this.config
    );
  }
};
var PgBigSerial64 = class extends PgColumn {
  static [entityKind] = "PgBigSerial64";
  getSQLType() {
    return "bigserial";
  }
  // eslint-disable-next-line unicorn/prefer-native-coercion-functions
  mapFromDriverValue(value) {
    return BigInt(value);
  }
};
function bigserial(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "number") {
    return new PgBigSerial53Builder(name);
  }
  return new PgBigSerial64Builder(name);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/boolean.js
var PgBooleanBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgBooleanBuilder";
  constructor(name) {
    super(name, "boolean", "PgBoolean");
  }
  /** @internal */
  build(table) {
    return new PgBoolean(table, this.config);
  }
};
var PgBoolean = class extends PgColumn {
  static [entityKind] = "PgBoolean";
  getSQLType() {
    return "boolean";
  }
};
function boolean(name) {
  return new PgBooleanBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/char.js
var PgCharBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCharBuilder";
  constructor(name, config) {
    super(name, "string", "PgChar");
    this.config.length = config.length;
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgChar(
      table,
      this.config
    );
  }
};
var PgChar = class extends PgColumn {
  static [entityKind] = "PgChar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === void 0 ? `char` : `char(${this.length})`;
  }
};
function char(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgCharBuilder(name, config);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/cidr.js
var PgCidrBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCidrBuilder";
  constructor(name) {
    super(name, "string", "PgCidr");
  }
  /** @internal */
  build(table) {
    return new PgCidr(table, this.config);
  }
};
var PgCidr = class extends PgColumn {
  static [entityKind] = "PgCidr";
  getSQLType() {
    return "cidr";
  }
};
function cidr(name) {
  return new PgCidrBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/custom.js
var PgCustomColumnBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "PgCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  /** @internal */
  build(table) {
    return new PgCustomColumn(
      table,
      this.config
    );
  }
};
var PgCustomColumn = class extends PgColumn {
  static [entityKind] = "PgCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
};
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new PgCustomColumnBuilder(name, config, customTypeParams);
  };
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/date.common.js
var PgDateColumnBaseBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgDateColumnBaseBuilder";
  defaultNow() {
    return this.default(sql`now()`);
  }
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/date.js
var PgDateBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateBuilder";
  constructor(name) {
    super(name, "date", "PgDate");
  }
  /** @internal */
  build(table) {
    return new PgDate(table, this.config);
  }
};
var PgDate = class extends PgColumn {
  static [entityKind] = "PgDate";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return new Date(value);
    return value;
  }
  mapToDriverValue(value) {
    return value.toISOString();
  }
};
var PgDateStringBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgDateStringBuilder";
  constructor(name) {
    super(name, "string", "PgDateString");
  }
  /** @internal */
  build(table) {
    return new PgDateString(
      table,
      this.config
    );
  }
};
var PgDateString = class extends PgColumn {
  static [entityKind] = "PgDateString";
  getSQLType() {
    return "date";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return value.toISOString().slice(0, -14);
  }
};
function date(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "date") {
    return new PgDateBuilder(name);
  }
  return new PgDateStringBuilder(name);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/double-precision.js
var PgDoublePrecisionBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgDoublePrecisionBuilder";
  constructor(name) {
    super(name, "number", "PgDoublePrecision");
  }
  /** @internal */
  build(table) {
    return new PgDoublePrecision(
      table,
      this.config
    );
  }
};
var PgDoublePrecision = class extends PgColumn {
  static [entityKind] = "PgDoublePrecision";
  getSQLType() {
    return "double precision";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  }
};
function doublePrecision(name) {
  return new PgDoublePrecisionBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/inet.js
var PgInetBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgInetBuilder";
  constructor(name) {
    super(name, "string", "PgInet");
  }
  /** @internal */
  build(table) {
    return new PgInet(table, this.config);
  }
};
var PgInet = class extends PgColumn {
  static [entityKind] = "PgInet";
  getSQLType() {
    return "inet";
  }
};
function inet(name) {
  return new PgInetBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/integer.js
var PgIntegerBuilder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgIntegerBuilder";
  constructor(name) {
    super(name, "number", "PgInteger");
  }
  /** @internal */
  build(table) {
    return new PgInteger(table, this.config);
  }
};
var PgInteger = class extends PgColumn {
  static [entityKind] = "PgInteger";
  getSQLType() {
    return "integer";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      return Number.parseInt(value);
    }
    return value;
  }
};
function integer(name) {
  return new PgIntegerBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/interval.js
var PgIntervalBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgIntervalBuilder";
  constructor(name, intervalConfig) {
    super(name, "string", "PgInterval");
    this.config.intervalConfig = intervalConfig;
  }
  /** @internal */
  build(table) {
    return new PgInterval(table, this.config);
  }
};
var PgInterval = class extends PgColumn {
  static [entityKind] = "PgInterval";
  fields = this.config.intervalConfig.fields;
  precision = this.config.intervalConfig.precision;
  getSQLType() {
    const fields = this.fields ? ` ${this.fields}` : "";
    const precision = this.precision ? `(${this.precision})` : "";
    return `interval${fields}${precision}`;
  }
};
function interval(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgIntervalBuilder(name, config);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/json.js
var PgJsonBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgJsonBuilder";
  constructor(name) {
    super(name, "json", "PgJson");
  }
  /** @internal */
  build(table) {
    return new PgJson(table, this.config);
  }
};
var PgJson = class extends PgColumn {
  static [entityKind] = "PgJson";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "json";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
};
function json(name) {
  return new PgJsonBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/jsonb.js
var PgJsonbBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgJsonbBuilder";
  constructor(name) {
    super(name, "json", "PgJsonb");
  }
  /** @internal */
  build(table) {
    return new PgJsonb(table, this.config);
  }
};
var PgJsonb = class extends PgColumn {
  static [entityKind] = "PgJsonb";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "jsonb";
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return value;
  }
};
function jsonb(name) {
  return new PgJsonbBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/line.js
var PgLineBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgLineBuilder";
  constructor(name) {
    super(name, "array", "PgLine");
  }
  /** @internal */
  build(table) {
    return new PgLineTuple(
      table,
      this.config
    );
  }
};
var PgLineTuple = class extends PgColumn {
  static [entityKind] = "PgLine";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b, c] = value.slice(1, -1).split(",");
    return [Number.parseFloat(a), Number.parseFloat(b), Number.parseFloat(c)];
  }
  mapToDriverValue(value) {
    return `{${value[0]},${value[1]},${value[2]}}`;
  }
};
var PgLineABCBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgLineABCBuilder";
  constructor(name) {
    super(name, "json", "PgLineABC");
  }
  /** @internal */
  build(table) {
    return new PgLineABC(
      table,
      this.config
    );
  }
};
var PgLineABC = class extends PgColumn {
  static [entityKind] = "PgLineABC";
  getSQLType() {
    return "line";
  }
  mapFromDriverValue(value) {
    const [a, b, c] = value.slice(1, -1).split(",");
    return { a: Number.parseFloat(a), b: Number.parseFloat(b), c: Number.parseFloat(c) };
  }
  mapToDriverValue(value) {
    return `{${value.a},${value.b},${value.c}}`;
  }
};
function line(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (!config?.mode || config.mode === "tuple") {
    return new PgLineBuilder(name);
  }
  return new PgLineABCBuilder(name);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/macaddr.js
var PgMacaddrBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgMacaddrBuilder";
  constructor(name) {
    super(name, "string", "PgMacaddr");
  }
  /** @internal */
  build(table) {
    return new PgMacaddr(table, this.config);
  }
};
var PgMacaddr = class extends PgColumn {
  static [entityKind] = "PgMacaddr";
  getSQLType() {
    return "macaddr";
  }
};
function macaddr(name) {
  return new PgMacaddrBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/macaddr8.js
var PgMacaddr8Builder = class extends PgColumnBuilder {
  static [entityKind] = "PgMacaddr8Builder";
  constructor(name) {
    super(name, "string", "PgMacaddr8");
  }
  /** @internal */
  build(table) {
    return new PgMacaddr8(table, this.config);
  }
};
var PgMacaddr8 = class extends PgColumn {
  static [entityKind] = "PgMacaddr8";
  getSQLType() {
    return "macaddr8";
  }
};
function macaddr8(name) {
  return new PgMacaddr8Builder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/numeric.js
var PgNumericBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericBuilder";
  constructor(name, precision, scale) {
    super(name, "string", "PgNumeric");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumeric(table, this.config);
  }
};
var PgNumeric = class extends PgColumn {
  static [entityKind] = "PgNumeric";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    return String(value);
  }
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
var PgNumericNumberBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericNumberBuilder";
  constructor(name, precision, scale) {
    super(name, "number", "PgNumericNumber");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumericNumber(
      table,
      this.config
    );
  }
};
var PgNumericNumber = class extends PgColumn {
  static [entityKind] = "PgNumericNumber";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue(value) {
    if (typeof value === "number") return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
var PgNumericBigIntBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgNumericBigIntBuilder";
  constructor(name, precision, scale) {
    super(name, "bigint", "PgNumericBigInt");
    this.config.precision = precision;
    this.config.scale = scale;
  }
  /** @internal */
  build(table) {
    return new PgNumericBigInt(
      table,
      this.config
    );
  }
};
var PgNumericBigInt = class extends PgColumn {
  static [entityKind] = "PgNumericBigInt";
  precision;
  scale;
  constructor(table, config) {
    super(table, config);
    this.precision = config.precision;
    this.scale = config.scale;
  }
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    if (this.precision !== void 0 && this.scale !== void 0) {
      return `numeric(${this.precision}, ${this.scale})`;
    } else if (this.precision === void 0) {
      return "numeric";
    } else {
      return `numeric(${this.precision})`;
    }
  }
};
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new PgNumericNumberBuilder(name, config?.precision, config?.scale) : mode === "bigint" ? new PgNumericBigIntBuilder(name, config?.precision, config?.scale) : new PgNumericBuilder(name, config?.precision, config?.scale);
}
var decimal = numeric;

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/point.js
var PgPointTupleBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgPointTupleBuilder";
  constructor(name) {
    super(name, "array", "PgPointTuple");
  }
  /** @internal */
  build(table) {
    return new PgPointTuple(
      table,
      this.config
    );
  }
};
var PgPointTuple = class extends PgColumn {
  static [entityKind] = "PgPointTuple";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x, y] = value.slice(1, -1).split(",");
      return [Number.parseFloat(x), Number.parseFloat(y)];
    }
    return [value.x, value.y];
  }
  mapToDriverValue(value) {
    return `(${value[0]},${value[1]})`;
  }
};
var PgPointObjectBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgPointObjectBuilder";
  constructor(name) {
    super(name, "json", "PgPointObject");
  }
  /** @internal */
  build(table) {
    return new PgPointObject(
      table,
      this.config
    );
  }
};
var PgPointObject = class extends PgColumn {
  static [entityKind] = "PgPointObject";
  getSQLType() {
    return "point";
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") {
      const [x, y] = value.slice(1, -1).split(",");
      return { x: Number.parseFloat(x), y: Number.parseFloat(y) };
    }
    return value;
  }
  mapToDriverValue(value) {
    return `(${value.x},${value.y})`;
  }
};
function point(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (!config?.mode || config.mode === "tuple") {
    return new PgPointTupleBuilder(name);
  }
  return new PgPointObjectBuilder(name);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/postgis_extension/utils.js
function hexToBytes(hex) {
  const bytes = [];
  for (let c = 0; c < hex.length; c += 2) {
    bytes.push(Number.parseInt(hex.slice(c, c + 2), 16));
  }
  return new Uint8Array(bytes);
}
function bytesToFloat64(bytes, offset) {
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, bytes[offset + i]);
  }
  return view.getFloat64(0, true);
}
function parseEWKB(hex) {
  const bytes = hexToBytes(hex);
  let offset = 0;
  const byteOrder = bytes[offset];
  offset += 1;
  const view = new DataView(bytes.buffer);
  const geomType = view.getUint32(offset, byteOrder === 1);
  offset += 4;
  let _srid;
  if (geomType & 536870912) {
    _srid = view.getUint32(offset, byteOrder === 1);
    offset += 4;
  }
  if ((geomType & 65535) === 1) {
    const x = bytesToFloat64(bytes, offset);
    offset += 8;
    const y = bytesToFloat64(bytes, offset);
    offset += 8;
    return [x, y];
  }
  throw new Error("Unsupported geometry type");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/postgis_extension/geometry.js
var PgGeometryBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgGeometryBuilder";
  constructor(name) {
    super(name, "array", "PgGeometry");
  }
  /** @internal */
  build(table) {
    return new PgGeometry(
      table,
      this.config
    );
  }
};
var PgGeometry = class extends PgColumn {
  static [entityKind] = "PgGeometry";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    return parseEWKB(value);
  }
  mapToDriverValue(value) {
    return `point(${value[0]} ${value[1]})`;
  }
};
var PgGeometryObjectBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgGeometryObjectBuilder";
  constructor(name) {
    super(name, "json", "PgGeometryObject");
  }
  /** @internal */
  build(table) {
    return new PgGeometryObject(
      table,
      this.config
    );
  }
};
var PgGeometryObject = class extends PgColumn {
  static [entityKind] = "PgGeometryObject";
  getSQLType() {
    return "geometry(point)";
  }
  mapFromDriverValue(value) {
    const parsed = parseEWKB(value);
    return { x: parsed[0], y: parsed[1] };
  }
  mapToDriverValue(value) {
    return `point(${value.x} ${value.y})`;
  }
};
function geometry(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (!config?.mode || config.mode === "tuple") {
    return new PgGeometryBuilder(name);
  }
  return new PgGeometryObjectBuilder(name);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/real.js
var PgRealBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgRealBuilder";
  constructor(name, length) {
    super(name, "number", "PgReal");
    this.config.length = length;
  }
  /** @internal */
  build(table) {
    return new PgReal(table, this.config);
  }
};
var PgReal = class extends PgColumn {
  static [entityKind] = "PgReal";
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return "real";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number.parseFloat(value);
    }
    return value;
  };
};
function real(name) {
  return new PgRealBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/serial.js
var PgSerialBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSerialBuilder";
  constructor(name) {
    super(name, "number", "PgSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgSerial(table, this.config);
  }
};
var PgSerial = class extends PgColumn {
  static [entityKind] = "PgSerial";
  getSQLType() {
    return "serial";
  }
};
function serial(name) {
  return new PgSerialBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/smallint.js
var PgSmallIntBuilder = class extends PgIntColumnBaseBuilder {
  static [entityKind] = "PgSmallIntBuilder";
  constructor(name) {
    super(name, "number", "PgSmallInt");
  }
  /** @internal */
  build(table) {
    return new PgSmallInt(table, this.config);
  }
};
var PgSmallInt = class extends PgColumn {
  static [entityKind] = "PgSmallInt";
  getSQLType() {
    return "smallint";
  }
  mapFromDriverValue = (value) => {
    if (typeof value === "string") {
      return Number(value);
    }
    return value;
  };
};
function smallint(name) {
  return new PgSmallIntBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/smallserial.js
var PgSmallSerialBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSmallSerialBuilder";
  constructor(name) {
    super(name, "number", "PgSmallSerial");
    this.config.hasDefault = true;
    this.config.notNull = true;
  }
  /** @internal */
  build(table) {
    return new PgSmallSerial(
      table,
      this.config
    );
  }
};
var PgSmallSerial = class extends PgColumn {
  static [entityKind] = "PgSmallSerial";
  getSQLType() {
    return "smallserial";
  }
};
function smallserial(name) {
  return new PgSmallSerialBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/text.js
var PgTextBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgTextBuilder";
  constructor(name, config) {
    super(name, "string", "PgText");
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgText(table, this.config);
  }
};
var PgText = class extends PgColumn {
  static [entityKind] = "PgText";
  enumValues = this.config.enumValues;
  getSQLType() {
    return "text";
  }
};
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgTextBuilder(name, config);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/time.js
var PgTimeBuilder = class extends PgDateColumnBaseBuilder {
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTime");
    this.withTimezone = withTimezone;
    this.precision = precision;
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  static [entityKind] = "PgTimeBuilder";
  /** @internal */
  build(table) {
    return new PgTime(table, this.config);
  }
};
var PgTime = class extends PgColumn {
  static [entityKind] = "PgTime";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `time${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
};
function time(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgTimeBuilder(name, config.withTimezone ?? false, config.precision);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/timestamp.js
var PgTimestampBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "date", "PgTimestamp");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestamp(table, this.config);
  }
};
var PgTimestamp = class extends PgColumn {
  static [entityKind] = "PgTimestamp";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : ` (${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return new Date(this.withTimezone ? value : value + "+0000");
    return value;
  }
  mapToDriverValue = (value) => {
    return value.toISOString();
  };
};
var PgTimestampStringBuilder = class extends PgDateColumnBaseBuilder {
  static [entityKind] = "PgTimestampStringBuilder";
  constructor(name, withTimezone, precision) {
    super(name, "string", "PgTimestampString");
    this.config.withTimezone = withTimezone;
    this.config.precision = precision;
  }
  /** @internal */
  build(table) {
    return new PgTimestampString(
      table,
      this.config
    );
  }
};
var PgTimestampString = class extends PgColumn {
  static [entityKind] = "PgTimestampString";
  withTimezone;
  precision;
  constructor(table, config) {
    super(table, config);
    this.withTimezone = config.withTimezone;
    this.precision = config.precision;
  }
  getSQLType() {
    const precision = this.precision === void 0 ? "" : `(${this.precision})`;
    return `timestamp${precision}${this.withTimezone ? " with time zone" : ""}`;
  }
  mapFromDriverValue(value) {
    if (typeof value === "string") return value;
    const shortened = value.toISOString().slice(0, -1).replace("T", " ");
    if (this.withTimezone) {
      const offset = value.getTimezoneOffset();
      const sign = offset <= 0 ? "+" : "-";
      return `${shortened}${sign}${Math.floor(Math.abs(offset) / 60).toString().padStart(2, "0")}`;
    }
    return shortened;
  }
};
function timestamp(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "string") {
    return new PgTimestampStringBuilder(name, config.withTimezone ?? false, config.precision);
  }
  return new PgTimestampBuilder(name, config?.withTimezone ?? false, config?.precision);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/uuid.js
var PgUUIDBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgUUIDBuilder";
  constructor(name) {
    super(name, "string", "PgUUID");
  }
  /**
   * Adds `default gen_random_uuid()` to the column definition.
   */
  defaultRandom() {
    return this.default(sql`gen_random_uuid()`);
  }
  /** @internal */
  build(table) {
    return new PgUUID(table, this.config);
  }
};
var PgUUID = class extends PgColumn {
  static [entityKind] = "PgUUID";
  getSQLType() {
    return "uuid";
  }
};
function uuid(name) {
  return new PgUUIDBuilder(name ?? "");
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/varchar.js
var PgVarcharBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgVarcharBuilder";
  constructor(name, config) {
    super(name, "string", "PgVarchar");
    this.config.length = config.length;
    this.config.enumValues = config.enum;
  }
  /** @internal */
  build(table) {
    return new PgVarchar(
      table,
      this.config
    );
  }
};
var PgVarchar = class extends PgColumn {
  static [entityKind] = "PgVarchar";
  length = this.config.length;
  enumValues = this.config.enumValues;
  getSQLType() {
    return this.length === void 0 ? `varchar` : `varchar(${this.length})`;
  }
};
function varchar(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgVarcharBuilder(name, config);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/vector_extension/bit.js
var PgBinaryVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgBinaryVectorBuilder";
  constructor(name, config) {
    super(name, "string", "PgBinaryVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgBinaryVector(
      table,
      this.config
    );
  }
};
var PgBinaryVector = class extends PgColumn {
  static [entityKind] = "PgBinaryVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `bit(${this.dimensions})`;
  }
};
function bit(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgBinaryVectorBuilder(name, config);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/vector_extension/halfvec.js
var PgHalfVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgHalfVectorBuilder";
  constructor(name, config) {
    super(name, "array", "PgHalfVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgHalfVector(
      table,
      this.config
    );
  }
};
var PgHalfVector = class extends PgColumn {
  static [entityKind] = "PgHalfVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `halfvec(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v) => Number.parseFloat(v));
  }
};
function halfvec(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgHalfVectorBuilder(name, config);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/vector_extension/sparsevec.js
var PgSparseVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgSparseVectorBuilder";
  constructor(name, config) {
    super(name, "string", "PgSparseVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgSparseVector(
      table,
      this.config
    );
  }
};
var PgSparseVector = class extends PgColumn {
  static [entityKind] = "PgSparseVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `sparsevec(${this.dimensions})`;
  }
};
function sparsevec(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgSparseVectorBuilder(name, config);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/vector_extension/vector.js
var PgVectorBuilder = class extends PgColumnBuilder {
  static [entityKind] = "PgVectorBuilder";
  constructor(name, config) {
    super(name, "array", "PgVector");
    this.config.dimensions = config.dimensions;
  }
  /** @internal */
  build(table) {
    return new PgVector(
      table,
      this.config
    );
  }
};
var PgVector = class extends PgColumn {
  static [entityKind] = "PgVector";
  dimensions = this.config.dimensions;
  getSQLType() {
    return `vector(${this.dimensions})`;
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
  mapFromDriverValue(value) {
    return value.slice(1, -1).split(",").map((v) => Number.parseFloat(v));
  }
};
function vector(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  return new PgVectorBuilder(name, config);
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/columns/all.js
function getPgColumnBuilders() {
  return {
    bigint,
    bigserial,
    boolean,
    char,
    cidr,
    customType,
    date,
    doublePrecision,
    inet,
    integer,
    interval,
    json,
    jsonb,
    line,
    macaddr,
    macaddr8,
    numeric,
    point,
    geometry,
    real,
    serial,
    smallint,
    smallserial,
    text,
    time,
    timestamp,
    uuid,
    varchar,
    bit,
    halfvec,
    sparsevec,
    vector
  };
}

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/table.js
var InlineForeignKeys = Symbol.for("drizzle:PgInlineForeignKeys");
var EnableRLS = Symbol.for("drizzle:EnableRLS");
var PgTable = class extends Table {
  static [entityKind] = "PgTable";
  /** @internal */
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys,
    EnableRLS
  });
  /**@internal */
  [InlineForeignKeys] = [];
  /** @internal */
  [EnableRLS] = false;
  /** @internal */
  [Table.Symbol.ExtraConfigBuilder] = void 0;
  /** @internal */
  [Table.Symbol.ExtraConfigColumns] = {};
};
function pgTableWithSchema(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new PgTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getPgColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.build(rawTable);
      rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
      return [name2, column];
    })
  );
  const builtColumnsForExtraConfig = Object.fromEntries(
    Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
      const colBuilder = colBuilderBase;
      colBuilder.setName(name2);
      const column = colBuilder.buildExtraConfigColumn(rawTable);
      return [name2, column];
    })
  );
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumnsForExtraConfig;
  if (extraConfig) {
    table[PgTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return Object.assign(table, {
    enableRLS: () => {
      table[PgTable.Symbol.EnableRLS] = true;
      return table;
    }
  });
}
var pgTable = (name, columns, extraConfig) => {
  return pgTableWithSchema(name, columns, extraConfig, void 0);
};

// node_modules/.pnpm/drizzle-orm@0.45.1_@neondatabase+serverless@1.0.2_@opentelemetry+api@1.9.0_@types+pg@8._54c7b4416d87fee2eef4c96e51d29778/node_modules/drizzle-orm/pg-core/indexes.js
var IndexBuilderOn = class {
  constructor(unique, name) {
    this.unique = unique;
    this.name = name;
  }
  static [entityKind] = "PgIndexBuilderOn";
  on(...columns) {
    return new IndexBuilder(
      columns.map((it) => {
        if (is(it, SQL)) {
          return it;
        }
        it = it;
        const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
        it.indexConfig = JSON.parse(JSON.stringify(it.defaultConfig));
        return clonedIndexedColumn;
      }),
      this.unique,
      false,
      this.name
    );
  }
  onOnly(...columns) {
    return new IndexBuilder(
      columns.map((it) => {
        if (is(it, SQL)) {
          return it;
        }
        it = it;
        const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
        it.indexConfig = it.defaultConfig;
        return clonedIndexedColumn;
      }),
      this.unique,
      true,
      this.name
    );
  }
  /**
   * Specify what index method to use. Choices are `btree`, `hash`, `gist`, `spgist`, `gin`, `brin`, or user-installed access methods like `bloom`. The default method is `btree.
   *
   * If you have the `pg_vector` extension installed in your database, you can use the `hnsw` and `ivfflat` options, which are predefined types.
   *
   * **You can always specify any string you want in the method, in case Drizzle doesn't have it natively in its types**
   *
   * @param method The name of the index method to be used
   * @param columns
   * @returns
   */
  using(method, ...columns) {
    return new IndexBuilder(
      columns.map((it) => {
        if (is(it, SQL)) {
          return it;
        }
        it = it;
        const clonedIndexedColumn = new IndexedColumn(it.name, !!it.keyAsName, it.columnType, it.indexConfig);
        it.indexConfig = JSON.parse(JSON.stringify(it.defaultConfig));
        return clonedIndexedColumn;
      }),
      this.unique,
      true,
      this.name,
      method
    );
  }
};
var IndexBuilder = class {
  static [entityKind] = "PgIndexBuilder";
  /** @internal */
  config;
  constructor(columns, unique, only, name, method = "btree") {
    this.config = {
      name,
      columns,
      unique,
      only,
      method
    };
  }
  concurrently() {
    this.config.concurrently = true;
    return this;
  }
  with(obj) {
    this.config.with = obj;
    return this;
  }
  where(condition) {
    this.config.where = condition;
    return this;
  }
  /** @internal */
  build(table) {
    return new Index(this.config, table);
  }
};
var Index = class {
  static [entityKind] = "PgIndex";
  config;
  constructor(config, table) {
    this.config = { ...config, table };
  }
};
function index(name) {
  return new IndexBuilderOn(false, name);
}
function uniqueIndex(name) {
  return new IndexBuilderOn(true, name);
}

// server/db/schema/transactions.ts
var transactionTypeEnum = pgEnum("transaction_type", ["credit", "debit"]);
var transactionStatusEnum = pgEnum("transaction_status", ["completed", "pending", "failed"]);
var categoryEnum = pgEnum("category", [
  "salary",
  "freelance",
  "investment_return",
  "refund",
  "gift_received",
  "rental_income",
  "food_dining",
  "groceries",
  "transportation",
  "fuel",
  "utilities",
  "rent",
  "emi_loan",
  "insurance",
  "healthcare",
  "education",
  "entertainment",
  "shopping",
  "travel",
  "subscriptions",
  "personal_care",
  "charity",
  "miscellaneous",
  "transfer"
]);
var paymentMethodEnum = pgEnum("payment_method", [
  "upi",
  "neft",
  "imps",
  "credit_card",
  "debit_card",
  "cash",
  "net_banking",
  "wallet",
  "auto_debit",
  "cheque"
]);
var transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  subcategory: varchar("subcategory", { length: 64 }),
  description: text("description"),
  merchant: varchar("merchant", { length: 128 }),
  paymentMethod: varchar("payment_method", { length: 32 }).notNull(),
  status: transactionStatusEnum("status").default("completed").notNull(),
  date: timestamp("date").notNull(),
  dayOfWeek: integer("day_of_week").notNull(),
  // 0=Sun, 6=Sat
  hourOfDay: integer("hour_of_day").notNull(),
  // 0-23
  isRecurring: boolean("is_recurring").default(false),
  tags: text("tags"),
  // comma-separated tags
  balanceAfter: decimal("balance_after", { precision: 12, scale: 2 }),
  // ── Bank / Upload references ──
  bankAccountId: uuid("bank_account_id"),
  // FK → bankAccounts.id
  statementUploadId: uuid("statement_upload_id"),
  // FK → statementUploads.id
  rawDescription: text("raw_description"),
  // Original description before categorization
  hash: varchar("hash", { length: 64 }),
  // SHA256(date+amount+rawDescription) for dedup
  // ── Cluster assignments (populated by ML service) ──
  spendingCluster: integer("spending_cluster"),
  // Behavioral cluster ID
  sizeCluster: integer("size_cluster"),
  // Transaction size cluster ID
  temporalCluster: integer("temporal_cluster"),
  // Time-based pattern cluster ID
  categoryCluster: integer("category_cluster"),
  // Category affinity cluster ID
  isAnomaly: boolean("is_anomaly").default(false),
  // Anomaly flag from DBSCAN
  anomalyScore: real("anomaly_score"),
  // Anomaly confidence score
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var clusterMetadata = pgTable("cluster_metadata", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  clusterType: varchar("cluster_type", { length: 32 }).notNull(),
  // spending_behavior | transaction_size | temporal | category_affinity
  clusterId: integer("cluster_id").notNull(),
  label: varchar("label", { length: 64 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }).notNull(),
  // hex color for UI
  centroid: text("centroid"),
  // JSON string of centroid vector
  transactionCount: integer("transaction_count").default(0),
  totalAmount: real("total_amount").default(0),
  avgAmount: real("avg_amount").default(0),
  minAmount: real("min_amount"),
  maxAmount: real("max_amount"),
  dominantCategory: varchar("dominant_category", { length: 64 }),
  dominantPaymentMethod: varchar("dominant_payment_method", { length: 32 }),
  percentageOfTotal: real("percentage_of_total"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var clusterRuns = pgTable("cluster_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 128 }).notNull(),
  clusterType: varchar("cluster_type", { length: 32 }).notNull(),
  algorithm: varchar("algorithm", { length: 32 }).notNull(),
  // kmeans | dbscan | agglomerative
  nClusters: integer("n_clusters").notNull(),
  silhouetteScore: real("silhouette_score"),
  inertia: real("inertia"),
  totalTransactions: integer("total_transactions").notNull(),
  parameters: text("parameters"),
  // JSON of hyperparameters used
  status: varchar("status", { length: 16 }).default("completed"),
  runAt: timestamp("run_at").defaultNow().notNull()
});

// server/db/schema/users.ts
var genderEnum = pgEnum("gender", ["male", "female", "other", "prefer_not_to_say"]);
var incomeBracketEnum = pgEnum("income_bracket", [
  "below_3l",
  "3l_5l",
  "5l_10l",
  "10l_25l",
  "above_25l"
]);
var taxRegimeEnum = pgEnum("tax_regime", ["old", "new"]);
var accountTypeEnum = pgEnum("account_type", ["savings", "current", "salary"]);
var fileTypeEnum = pgEnum("file_type", ["pdf", "xlsx", "csv"]);
var processingStatusEnum = pgEnum("processing_status", [
  "pending",
  "processing",
  "completed",
  "failed"
]);
var users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: timestamp("email_verified"),
  name: varchar("name", { length: 128 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  image: varchar("image", { length: 512 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripePaymentMethodId: varchar("stripe_payment_method_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: varchar("token_type", { length: 255 }),
  scope: varchar("scope", { length: 255 }),
  idToken: text("id_token"),
  sessionState: varchar("session_state", { length: 255 })
});
var sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull()
});
var verificationTokens = pgTable("verification_tokens", {
  identifier: varchar("identifier", { length: 255 }).notNull(),
  token: varchar("token", { length: 255 }).notNull(),
  expires: timestamp("expires").notNull()
});
var otpVerifications = pgTable("otp_verifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var userTotpSecrets = pgTable("user_totp_secrets", {
  userId: uuid("user_id").notNull().primaryKey().references(() => users.id, { onDelete: "cascade" }),
  secret: varchar("secret", { length: 255 }).notNull(),
  isVerified: boolean("is_verified").default(false).notNull()
});
var user2faBackupCodes = pgTable("user_2fa_backup_codes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 255 }).notNull(),
  used: boolean("used").default(false).notNull()
});
var userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  dob: date("dob"),
  gender: genderEnum("gender"),
  occupation: varchar("occupation", { length: 128 }),
  incomeBracket: incomeBracketEnum("income_bracket"),
  panNumber: varchar("pan_number", { length: 10 }),
  aadhaarLast4: varchar("aadhaar_last4", { length: 4 }),
  city: varchar("city", { length: 64 }),
  state: varchar("state", { length: 64 }),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  taxRegime: taxRegimeEnum("tax_regime").default("new").notNull(),
  // Permissions / Consent
  consentDataProcessing: boolean("consent_data_processing").default(false),
  consentMLAnalytics: boolean("consent_ml_analytics").default(false),
  consentAIAssistant: boolean("consent_ai_assistant").default(false),
  consentMarketing: boolean("consent_marketing").default(false),
  preferences: text("preferences"),
  // JSON stringified preferences (jsonb not available in all Neon versions by default without casting, text is safer for simple JSON)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var bankAccounts = pgTable("bank_accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bankName: varchar("bank_name", { length: 64 }).notNull(),
  accountNickname: varchar("account_nickname", { length: 128 }),
  accountLast4: varchar("account_last4", { length: 4 }),
  accountType: accountTypeEnum("account_type").default("savings").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  currency: varchar("currency", { length: 3 }).default("INR").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var statementUploads = pgTable("statement_uploads", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bankAccountId: uuid("bank_account_id").notNull().references(() => bankAccounts.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  fileHash: varchar("file_hash", { length: 64 }),
  // SHA-256 of raw file buffer for dedup
  s3Key: varchar("s3_key", { length: 512 }),
  fileSize: integer("file_size"),
  statementMonth: varchar("statement_month", { length: 7 }),
  // "2025-03"
  statementYear: integer("statement_year"),
  processingStatus: processingStatusEnum("processing_status").default("pending").notNull(),
  transactionsExtracted: integer("transactions_extracted").default(0),
  transactionsDuplicate: integer("transactions_duplicate").default(0),
  errorMessage: text("error_message"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// server/db/schema/payments.ts
var payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }).unique(),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }).unique(),
  status: varchar("status", { length: 64 }).notNull(),
  processedAt: timestamp("processed_at"),
  refundedAt: timestamp("refunded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }).notNull().unique(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
  endedAt: timestamp("ended_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// server/db/schema/ai.ts
var aiModelProviderEnum = pgEnum("ai_model_provider", [
  "oracle_cloud",
  "groq",
  "fallback"
]);
var aiPageEnum = pgEnum("ai_page", [
  "/",
  "/analytics",
  "/calculators",
  "/tax",
  "/upload",
  "/onboarding",
  "/settings",
  "/ai-ca"
]);
var aiContextTypeEnum = pgEnum("ai_context_type", [
  "profile",
  "aggregates",
  "transactions",
  "analytics",
  "ml-clusters",
  "tax",
  "documents",
  "summary",
  "full-context"
]);
var chatRoleEnum = pgEnum("chat_role", [
  "user",
  "assistant",
  "system"
]);
var aiChatLogs = pgTable("ai_chat_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  page: aiPageEnum("page").notNull(),
  contextTypes: jsonb("context_types").$type().default([]),
  modelProvider: aiModelProviderEnum("model_provider").notNull(),
  modelName: varchar("model_name", { length: 128 }).notNull(),
  messagesCount: integer("messages_count").default(0).notNull(),
  tokensUsed: integer("tokens_used").default(0),
  promptTokens: integer("prompt_tokens").default(0),
  completionTokens: integer("completion_tokens").default(0),
  costEstimated: varchar("cost_estimated", { length: 32 }),
  userMessage: text("user_message"),
  assistantMessage: text("assistant_message"),
  responseTimeMs: integer("response_time_ms"),
  isError: boolean("is_error").default(false),
  errorMessage: text("error_message"),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var aiAccessPolicies = pgTable("ai_access_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  allowedPages: jsonb("allowed_pages").$type().default([
    "/",
    "/analytics",
    "/calculators",
    "/tax",
    "/upload",
    "/onboarding"
  ]),
  allowedContextTypes: jsonb("allowed_context_types").$type().default([
    "profile",
    "transactions",
    "analytics",
    "ml-clusters",
    "tax",
    "documents",
    "summary",
    "full-context"
  ]),
  maxTokensPerRequest: integer("max_tokens_per_request").default(4096),
  maxDailyRequests: integer("max_daily_requests").default(50),
  maxDailyTokens: integer("max_daily_tokens").default(5e4),
  isEnabled: boolean("is_enabled").default(true).notNull(),
  rateLimitMessage: varchar("rate_limit_message", { length: 255 }),
  subscriptionTier: varchar("subscription_tier", { length: 32 }).default("free"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var aiAuditLog = pgTable("ai_audit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id"),
  // FK to chat_sessions (nullable for one-off chats)
  contextHash: varchar("context_hash", { length: 64 }).notNull(),
  // SHA-256 of system prompt (NOT raw content)
  inputTokenCount: integer("input_token_count").default(0),
  outputTokenCount: integer("output_token_count").default(0),
  outputSummary: varchar("output_summary", { length: 255 }),
  // First 255 chars of response (truncated)
  modelUsed: varchar("model_used", { length: 128 }).notNull(),
  modelProvider: varchar("model_provider", { length: 32 }).notNull(),
  latencyMs: integer("latency_ms"),
  pageContext: varchar("page_context", { length: 64 }),
  isError: boolean("is_error").default(false),
  errorType: varchar("error_type", { length: 64 }),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var chatSessions = pgTable("chat_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).default("New Chat"),
  pageContext: varchar("page_context", { length: 64 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  sessionId: uuid("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  tokenCount: integer("token_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// server/db/schema/aggregations.ts
var monthlySummaries = pgTable("monthly_summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  month: varchar("month", { length: 7 }).notNull(),
  // "2025-07"
  category: varchar("category", { length: 64 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  // "credit" | "debit"
  totalAmount: decimal("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  txCount: integer("tx_count").notNull().default(0),
  avgAmount: decimal("avg_amount", { precision: 14, scale: 2 }).default("0"),
  minAmount: decimal("min_amount", { precision: 14, scale: 2 }),
  maxAmount: decimal("max_amount", { precision: 14, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var taxSummaries = pgTable("tax_summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fy: varchar("fy", { length: 10 }).notNull(),
  // "2025-26"
  section: varchar("section", { length: 32 }).notNull(),
  // "80C", "80D", "salary", "rental_income"
  category: varchar("category", { length: 64 }).notNull(),
  type: varchar("type", { length: 10 }).notNull(),
  // "credit" | "debit"
  totalAmount: decimal("total_amount", { precision: 14, scale: 2 }).notNull().default("0"),
  txCount: integer("tx_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
var netWorthSnapshots = pgTable("net_worth_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  snapshotDate: date("snapshot_date").notNull(),
  totalBalance: decimal("total_balance", { precision: 14, scale: 2 }).notNull().default("0"),
  bankBalances: text("bank_balances"),
  // JSON: [{ bankId, bankName, balance }]
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 14, scale: 2 }),
  currentAmount: decimal("current_amount", { precision: 14, scale: 2 }).default("0"),
  deadline: date("deadline"),
  category: varchar("category", { length: 64 }),
  priority: varchar("priority", { length: 16 }).default("medium"),
  status: varchar("status", { length: 16 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// server/db/schema/tax.ts
var taxDocumentTypeEnum = pgEnum("tax_document_type", [
  "form16",
  "ais",
  "tis",
  "form26as",
  "cas",
  "capital_gains"
]);
var taxDocumentStatusEnum = pgEnum("tax_document_status", [
  "pending",
  "parsed",
  "failed",
  "superseded"
]);
var itrFormEnum = pgEnum("itr_form", ["ITR-1", "ITR-2", "ITR-3", "ITR-4"]);
var filingStatusEnum = pgEnum("filing_status", [
  "draft",
  "reconciled",
  "ready",
  "json_generated",
  "filed"
]);
var holdingCategoryEnum = pgEnum("holding_category", [
  "EQUITY",
  "DEBT",
  "HYBRID",
  "ELSS",
  "OTHER"
]);
var taxDocuments = pgTable(
  "tax_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    financialYear: varchar("financial_year", { length: 9 }).notNull(),
    // "2025-2026"
    documentType: taxDocumentTypeEnum("document_type").notNull(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    /** SHA-256 of the raw upload, for idempotent re-uploads. */
    fileHash: varchar("file_hash", { length: 64 }),
    s3Key: varchar("s3_key", { length: 512 }),
    fileSize: integer("file_size"),
    status: taxDocumentStatusEnum("status").default("pending").notNull(),
    /** Parser output: Form16Data | AISData | CASData. */
    parsedData: jsonb("parsed_data"),
    /** 0–1 parser confidence; low values prompt manual confirmation. */
    confidence: real("confidence"),
    /** Fields the parser could not find, surfaced in the wizard. */
    missingFields: jsonb("missing_fields").$type().default([]),
    errorMessage: text("error_message"),
    parsedAt: timestamp("parsed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (table) => ({
    userFyIdx: index("tax_documents_user_fy_idx").on(table.userId, table.financialYear),
    // The same file uploaded twice for the same year is the same document.
    userHashUnique: uniqueIndex("tax_documents_user_hash_unique").on(
      table.userId,
      table.financialYear,
      table.fileHash
    )
  })
);
var taxFilings = pgTable(
  "tax_filings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    financialYear: varchar("financial_year", { length: 9 }).notNull(),
    assessmentYear: varchar("assessment_year", { length: 7 }).notNull(),
    status: filingStatusEnum("status").default("draft").notNull(),
    itrForm: itrFormEnum("itr_form"),
    /** Why that form was selected — reasons, disqualifiers, warnings. */
    itrFormRationale: jsonb("itr_form_rationale"),
    /**
     * The wizard's own inputs — declared deductions, capital gains, presumptive
     * income and yes/no declarations. Stored separately from the computation so
     * a rebuild after a new document upload keeps what the user asserted.
     */
    wizardInputs: jsonb("wizard_inputs"),
    /** TaxComputationInput after reconciliation. */
    computationInput: jsonb("computation_input"),
    /** TaxComputationResult, both regimes. */
    computationResult: jsonb("computation_result"),
    /** ReconciliationFinding[]. */
    reconciliationFindings: jsonb("reconciliation_findings"),
    selectedRegime: varchar("selected_regime", { length: 4 }),
    // "OLD" | "NEW"
    grossTotalIncome: decimal("gross_total_income", { precision: 14, scale: 2 }),
    taxableIncome: decimal("taxable_income", { precision: 14, scale: 2 }),
    totalTaxPayable: decimal("total_tax_payable", { precision: 14, scale: 2 }),
    taxCreditClaimed: decimal("tax_credit_claimed", { precision: 14, scale: 2 }),
    /** Negative means a refund is due. */
    netPayable: decimal("net_payable", { precision: 14, scale: 2 }),
    /** The generated ITD JSON, kept so the same file can be re-downloaded. */
    itrJson: jsonb("itr_json"),
    /** ValidationIssue[] from the last generation attempt. */
    validationIssues: jsonb("validation_issues"),
    jsonGeneratedAt: timestamp("json_generated_at"),
    /** Set by the user after they upload the JSON to the ITD portal. */
    acknowledgementNumber: varchar("acknowledgement_number", { length: 32 }),
    filedAt: timestamp("filed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (table) => ({
    // One live draft per year keeps the wizard unambiguous.
    userFyUnique: uniqueIndex("tax_filings_user_fy_unique").on(table.userId, table.financialYear)
  })
);
var portfolioHoldings = pgTable(
  "portfolio_holdings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    /** The CAS upload this holding came from. */
    sourceDocumentId: uuid("source_document_id").references(() => taxDocuments.id, {
      onDelete: "set null"
    }),
    folioNumber: varchar("folio_number", { length: 64 }).notNull(),
    schemeName: varchar("scheme_name", { length: 255 }).notNull(),
    amc: varchar("amc", { length: 128 }),
    isin: varchar("isin", { length: 12 }),
    category: holdingCategoryEnum("category").default("OTHER").notNull(),
    /** MF units carry 3–4 decimals, so this is wider than a money column. */
    units: decimal("units", { precision: 18, scale: 4 }).notNull().default("0"),
    currentNav: decimal("current_nav", { precision: 12, scale: 4 }),
    investedValue: decimal("invested_value", { precision: 14, scale: 2 }).notNull().default("0"),
    currentValue: decimal("current_value", { precision: 14, scale: 2 }).notNull().default("0"),
    /** ELSS holdings feed the Sec 80C total. */
    isElss: boolean("is_elss").default(false).notNull(),
    /** Annualised return across the folio's dated cash flows, as a fraction. */
    xirr: real("xirr"),
    statementDate: timestamp("statement_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull()
  },
  (table) => ({
    userIdx: index("portfolio_holdings_user_idx").on(table.userId),
    // A folio + scheme pair is the natural key; re-uploading a newer CAS
    // updates the same row rather than duplicating the holding.
    userFolioSchemeUnique: uniqueIndex("portfolio_holdings_user_folio_scheme_unique").on(
      table.userId,
      table.folioNumber,
      table.schemeName
    )
  })
);

// server/services/parser/deduplicator.ts
function computeHash(date2, amount, rawDescription, userId) {
  const userPrefix = userId ? `${userId}|` : "";
  const str = `${userPrefix}${date2.toISOString().split("T")[0]}|${amount.toFixed(2)}|${rawDescription.toLowerCase().trim()}`;
  return import_crypto.default.createHash("sha256").update(str).digest("hex");
}

// server/services/parser/pdf.table.ts
function finalizeTransaction(partial, rawDescription, profile) {
  const { date: date2, amount, type, balance } = partial;
  if (!date2 || !amount || amount <= 0 || !type) return null;
  const cleanedDesc = rawDescription.replace(/\s{2,}/g, " ").trim();
  if (!cleanedDesc) return null;
  const cat = categorizeTransaction(cleanedDesc, amount, type);
  const hash = computeHash(date2, amount, cleanedDesc);
  return {
    date: date2,
    description: cat.merchant || cleanedDesc,
    rawDescription: cleanedDesc,
    amount,
    type,
    balance,
    category: cat.category,
    subcategory: cat.subcategory,
    merchant: cat.merchant,
    isRecurring: cat.isRecurring,
    paymentMethod: detectPaymentMethod(cleanedDesc),
    hash
  };
}
function parseAmount(rawStr, profile) {
  if (!rawStr) return 0;
  let cleaned = rawStr.trim();
  if (profile.amountFormat.usesDrCr) {
    cleaned = cleaned.replace(/\s*(?:Dr|Cr)\.?(?:\s|$)/gi, "").trim();
    cleaned = cleaned.replace(/[()]/g, "").trim();
  }
  cleaned = cleaned.replace(/[₹$€£¥]/g, "").trim();
  if (profile.amountFormat.thousandsSep) {
    const sep = escapeRegexForAmount(profile.amountFormat.thousandsSep);
    cleaned = cleaned.replace(new RegExp(sep, "g"), "");
  }
  if (profile.amountFormat.decimalSep !== ",") {
    cleaned = cleaned.replace(/,/g, "");
  } else {
    cleaned = cleaned.replace(/\./g, "");
  }
  cleaned = cleaned.replace(/[()]/g, "").trim();
  cleaned = cleaned.replace(/^-/, "").replace(/-$/, "").trim();
  if (profile.amountFormat.decimalSep && profile.amountFormat.decimalSep !== ".") {
    const lastIdx = cleaned.lastIndexOf(profile.amountFormat.decimalSep);
    if (lastIdx !== -1) {
      cleaned = cleaned.substring(0, lastIdx) + "." + cleaned.substring(lastIdx + 1);
    }
  }
  cleaned = cleaned.replace(/[^\d.]/g, "");
  if (!cleaned || cleaned === ".") return 0;
  const value = parseFloat(cleaned);
  if (isNaN(value)) return 0;
  return Math.abs(value);
}
function escapeRegexForAmount(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function parseTransactionDate(str, dateFormats) {
  if (!str) return null;
  const cleaned = str.trim();
  const dmy4 = cleaned.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (dmy4) {
    const [, d2, m, y] = dmy4;
    const isMonthFirst = dateFormats.some((f) => f.startsWith("MM"));
    const month = isMonthFirst ? parseInt(d2) : parseInt(m);
    const day = isMonthFirst ? parseInt(m) : parseInt(d2);
    const date2 = new Date(parseInt(y), month - 1, day);
    return isNaN(date2.getTime()) ? null : date2;
  }
  const dmy2 = cleaned.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2})$/);
  if (dmy2) {
    const [, d2, m, y] = dmy2;
    const year = parseInt(y) + 2e3;
    const month = parseInt(m);
    const day = parseInt(d2);
    const date2 = new Date(year, month - 1, day);
    return isNaN(date2.getTime()) ? null : date2;
  }
  const dMonY = cleaned.match(/^(\d{1,2})[\s\-]([A-Za-z]{3})[\s\-](\d{2,4})$/);
  if (dMonY) {
    const [, d2, mon, y] = dMonY;
    const yearStr = y.length === 2 ? `20${y}` : y;
    const date2 = /* @__PURE__ */ new Date(`${mon} ${d2}, ${yearStr}`);
    return isNaN(date2.getTime()) ? null : date2;
  }
  const iso = cleaned.match(/^(\d{4})[/\-](\d{1,2})[/\-](\d{1,2})$/);
  if (iso) {
    const [, y, m, d2] = iso;
    const date2 = new Date(parseInt(y), parseInt(m) - 1, parseInt(d2));
    return isNaN(date2.getTime()) ? null : date2;
  }
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}
function parseLinesAsTransactions(lines, profile) {
  const transactions2 = [];
  let pendingDesc = "";
  let pendingTx = null;
  const datePattern = buildDateRegex(profile.dateFormats);
  for (const line2 of lines) {
    const trimmed = line2.trim();
    if (!trimmed) continue;
    const dateMatch = trimmed.match(datePattern);
    if (dateMatch) {
      if (pendingTx) {
        const finalized = finalizeTransaction(pendingTx, pendingDesc, profile);
        if (finalized) transactions2.push(finalized);
      }
      const dateStr = dateMatch[0];
      const date2 = parseTransactionDate(dateStr, profile.dateFormats);
      if (!date2) continue;
      const restOfLine = trimmed.substring(dateMatch[0].length).trim();
      const { description, amount, type } = extractAmountFromLine(restOfLine, profile);
      pendingTx = { date: date2, amount, type };
      pendingDesc = description || restOfLine;
    } else if (pendingTx) {
      if (!looksLikeAmountOnly(trimmed)) {
        pendingDesc += " " + trimmed;
      }
    }
  }
  if (pendingTx) {
    const finalized = finalizeTransaction(pendingTx, pendingDesc, profile);
    if (finalized) transactions2.push(finalized);
  }
  return transactions2;
}
function buildDateRegex(dateFormats) {
  return /^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b|^\d{1,2}\s[A-Z][a-z]{2}(?:\s\d{2,4}|\b)/;
}
function extractAmountFromLine(line2, profile) {
  const hasDr = /Dr\.?/i.test(line2);
  const hasCr = /Cr\.?/i.test(line2);
  const amountMatches = line2.match(/[\d,]+\.?\d*/g);
  let amount = 0;
  if (amountMatches) {
    const lastMatch = amountMatches[amountMatches.length - 1];
    amount = parseAmount(lastMatch, profile);
    const descPart = line2.replace(lastMatch, "").trim();
    return {
      description: descPart,
      amount,
      type: hasCr ? "credit" : "debit"
    };
  }
  return {
    description: line2,
    amount: 0,
    type: hasDr ? "debit" : "credit"
  };
}
function looksLikeAmountOnly(text2) {
  return /^[\d,.\s₹$€£¥()\-DrCr]+$/.test(text2.trim());
}
function detectPaymentMethod(desc) {
  const lower = desc.toLowerCase();
  if (lower.includes("upi")) return "upi";
  if (lower.includes("neft")) return "neft";
  if (lower.includes("rtgs")) return "neft";
  if (lower.includes("imps")) return "imps";
  if (lower.includes("atm") || lower.includes("cash withdrawal")) return "cash";
  if (lower.includes("credit card") || lower.includes("cc ")) return "credit_card";
  if (lower.includes("debit card")) return "debit_card";
  if (lower.includes("auto debit") || lower.includes("nach") || lower.includes("ecs")) return "auto_debit";
  if (lower.includes("cheque") || lower.includes("chq") || lower.includes("chqclg")) return "cheque";
  return "net_banking";
}

// lib/parser/validateContinuity.ts
var EPSILON = 0.01;
function validateBalanceContinuity(transactions2) {
  const errors = [];
  for (let i = 1; i < transactions2.length; i++) {
    const prev = transactions2[i - 1];
    const curr = transactions2[i];
    if (prev?.balance != null && curr?.balance != null) {
      const delta = (curr.credit ?? 0) - (curr.debit ?? 0);
      const expected = round2(prev.balance + delta);
      const actual = round2(curr.balance);
      if (Math.abs(expected - actual) > EPSILON) {
        errors.push({ index: i, expected, actual, row: curr });
      }
    }
  }
  return { valid: errors.length === 0, errors };
}
function round2(n) {
  return Math.round(n * 100) / 100;
}

// finflow_e1_corpus/evaluate_deterministic.mjs
var import_meta = {};
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var AMOUNT_EPSILON = 0.05;
function normDate(d) {
  if (!d) return "";
  const s = String(d).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const slashMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, "0");
    const month = slashMatch[2].padStart(2, "0");
    let year = slashMatch[3];
    if (year.length === 2) year = (parseInt(year) > 50 ? "19" : "20") + year;
    return `${year}-${month}-${day}`;
  }
  const monMatch = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (monMatch) {
    const months = {
      jan: "01",
      feb: "02",
      mar: "03",
      apr: "04",
      may: "05",
      jun: "06",
      jul: "07",
      aug: "08",
      sep: "09",
      oct: "10",
      nov: "11",
      dec: "12"
    };
    const day = monMatch[1].padStart(2, "0");
    const month = months[monMatch[2].toLowerCase()] || "01";
    return `${monMatch[3]}-${month}-${day}`;
  }
  try {
    const dt = new Date(s);
    if (!isNaN(dt.getTime())) return dt.toISOString().split("T")[0];
  } catch {
  }
  return s;
}
function parseCSV(content) {
  const lines = content.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line2 = lines[i].trim();
    if (!line2) continue;
    const parts = line2.split(",").map((p) => p.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = parts[idx];
    });
    rows.push(row);
  }
  return rows;
}
function matchTransactions(gt, extracted) {
  const gtUsed = /* @__PURE__ */ new Set();
  const matches = [];
  let tp = 0;
  for (let ei = 0; ei < extracted.length; ei++) {
    const e = extracted[ei];
    const eDebit = e.debit ?? 0;
    const eCredit = e.credit ?? 0;
    let bestGtIdx = -1;
    let bestScore = Infinity;
    for (let gi = 0; gi < gt.length; gi++) {
      if (gtUsed.has(gi)) continue;
      const g = gt[gi];
      const dateMatch = normDate(e.date) === normDate(g.date);
      if (!dateMatch) continue;
      const debitDiff = Math.abs(eDebit - g.debit);
      const creditDiff = Math.abs(eCredit - g.credit);
      if (debitDiff > AMOUNT_EPSILON || creditDiff > AMOUNT_EPSILON) continue;
      const balDiff = e.balance != null ? Math.abs(e.balance - g.balance) : 999;
      if (balDiff < bestScore) {
        bestScore = balDiff;
        bestGtIdx = gi;
      }
    }
    if (bestGtIdx >= 0) {
      gtUsed.add(bestGtIdx);
      tp++;
      matches.push({
        matched: true,
        gtIndex: bestGtIdx,
        extractedIndex: ei
      });
    }
  }
  const fp = extracted.length - tp;
  const fn = gt.length - tp;
  return { tp, fp, fn, matches };
}
function f1Score(p, r) {
  if (p + r === 0) return 0;
  return 2 * p * r / (p + r);
}
async function main() {
  const corpusDir = import_path.default.resolve(__dirname);
  const manifestPath = import_path.default.join(corpusDir, "manifest.csv");
  const extractedLinesPath = import_path.default.join(corpusDir, "extracted_pdf_lines.json");
  const outputPath = import_path.default.join(corpusDir, "results_deterministic.json");
  console.log(`
======================================================================`);
  console.log(`  E2/E3 Evaluation Harness \u2014 FinFlow Deterministic Parser`);
  console.log(`  Corpus Dir: ${corpusDir}`);
  console.log(`======================================================================
`);
  if (!import_fs.default.existsSync(extractedLinesPath)) {
    console.error(`Error: ${extractedLinesPath} not found. Run extract_pdf_lines.py first.`);
    process.exit(1);
  }
  const extractedLinesData = JSON.parse(import_fs.default.readFileSync(extractedLinesPath, "utf-8"));
  const manifestRaw = import_fs.default.readFileSync(manifestPath, "utf-8");
  const rows = parseCSV(manifestRaw);
  const results = [];
  const bankAgg = {};
  let bankDetectionCorrect = 0;
  let zeroExtractions = 0;
  for (const row of rows) {
    const stmtId = row.statement_id;
    const gtPath = import_path.default.join(corpusDir, row.ground_truth_path);
    if (!import_fs.default.existsSync(gtPath)) {
      console.warn(`Missing GT for ${stmtId}`);
      continue;
    }
    const gt = JSON.parse(import_fs.default.readFileSync(gtPath, "utf-8"));
    const stmtLinesObj = extractedLinesData[stmtId];
    const lines = stmtLinesObj ? stmtLinesObj.lines : [];
    const fullText = lines.slice(0, 15).join(" ");
    const detected = detectBank(fullText);
    const bankMatches = detected && detected.id.toLowerCase() === row.bank.toLowerCase();
    if (bankMatches) bankDetectionCorrect++;
    const activeProfile = detected || getBankProfile(row.bank.toLowerCase()) || GENERIC_PROFILE;
    const extractedRaw = parseLinesAsTransactions(lines, activeProfile);
    if (extractedRaw.length === 0) {
      zeroExtractions++;
    }
    const extracted = extractedRaw.map((t) => ({
      date: t.date instanceof Date ? t.date.toISOString().split("T")[0] : String(t.date),
      description: t.description || "",
      debit: t.type === "debit" ? t.amount : 0,
      credit: t.type === "credit" ? t.amount : 0,
      balance: t.balance != null ? t.balance : null
    }));
    const { tp, fp, fn } = matchTransactions(gt.transactions, extracted);
    const precision = extracted.length > 0 ? tp / extracted.length : 0;
    const recall = gt.transactions.length > 0 ? tp / gt.transactions.length : 0;
    const f1 = f1Score(precision, recall);
    const continuityRes = validateBalanceContinuity(extractedRaw);
    const stmtRes = {
      statement_id: stmtId,
      bank: row.bank,
      gt_count: gt.transactions.length,
      extracted_count: extracted.length,
      tp,
      fp,
      fn,
      precision,
      recall,
      f1,
      continuity_valid: continuityRes.valid,
      continuity_errors: continuityRes.errors.length,
      bank_detected: detected ? detected.id : null
    };
    results.push(stmtRes);
    if (!bankAgg[row.bank]) {
      bankAgg[row.bank] = {
        bank: row.bank,
        statements: 0,
        gt_txns: 0,
        ext_txns: 0,
        tp: 0,
        fp: 0,
        fn: 0,
        continuity_passes: 0,
        extraction_ratios: []
      };
    }
    const b = bankAgg[row.bank];
    b.statements++;
    b.gt_txns += gt.transactions.length;
    b.ext_txns += extracted.length;
    b.tp += tp;
    b.fp += fp;
    b.fn += fn;
    if (continuityRes.valid) b.continuity_passes++;
    b.extraction_ratios.push(gt.transactions.length > 0 ? extracted.length / gt.transactions.length : 0);
  }
  const bankSummaries = Object.values(bankAgg).map((b) => {
    const precision = b.ext_txns > 0 ? b.tp / b.ext_txns : 0;
    const recall = b.gt_txns > 0 ? b.tp / b.gt_txns : 0;
    const f1 = f1Score(precision, recall);
    const continuity_pass_rate = b.statements > 0 ? b.continuity_passes / b.statements : 0;
    const mean_extraction_ratio = b.extraction_ratios.reduce((a, c) => a + c, 0) / b.extraction_ratios.length;
    return {
      bank: b.bank,
      statements: b.statements,
      total_gt_txns: b.gt_txns,
      total_extracted_txns: b.ext_txns,
      total_tp: b.tp,
      total_fp: b.fp,
      total_fn: b.fn,
      precision: Math.round(precision * 1e4) / 1e4,
      recall: Math.round(recall * 1e4) / 1e4,
      f1: Math.round(f1 * 1e4) / 1e4,
      continuity_pass_rate: Math.round(continuity_pass_rate * 1e4) / 1e4,
      mean_extraction_ratio: Math.round(mean_extraction_ratio * 1e4) / 1e4
    };
  });
  const totalGt = bankSummaries.reduce((a, b) => a + b.total_gt_txns, 0);
  const totalExt = bankSummaries.reduce((a, b) => a + b.total_extracted_txns, 0);
  const totalTp = bankSummaries.reduce((a, b) => a + b.total_tp, 0);
  const totalFp = bankSummaries.reduce((a, b) => a + b.total_fp, 0);
  const totalFn = bankSummaries.reduce((a, b) => a + b.total_fn, 0);
  const microPrecision = totalExt > 0 ? totalTp / totalExt : 0;
  const microRecall = totalGt > 0 ? totalTp / totalGt : 0;
  const microF1 = f1Score(microPrecision, microRecall);
  const totalContinuityPasses = results.filter((r) => r.continuity_valid).length;
  const continuityPassRate = results.length > 0 ? totalContinuityPasses / results.length : 0;
  const overall = {
    total_statements: results.length,
    total_gt_transactions: totalGt,
    total_extracted_transactions: totalExt,
    total_true_positives: totalTp,
    total_false_positives: totalFp,
    total_false_negatives: totalFn,
    micro_precision: Math.round(microPrecision * 1e4) / 1e4,
    micro_recall: Math.round(microRecall * 1e4) / 1e4,
    micro_f1: Math.round(microF1 * 1e4) / 1e4,
    continuity_pass_rate: Math.round(continuityPassRate * 1e4) / 1e4,
    zero_extraction_count: zeroExtractions,
    bank_detection_accuracy: Math.round(bankDetectionCorrect / results.length * 1e4) / 1e4
  };
  console.log("\u2550".repeat(70));
  console.log("  OVERALL RESULTS \u2014 Deterministic Parser");
  console.log("\u2550".repeat(70));
  console.log(`  Statements evaluated:   ${overall.total_statements}`);
  console.log(`  Ground truth txns:      ${overall.total_gt_transactions}`);
  console.log(`  Extracted txns:         ${overall.total_extracted_transactions}`);
  console.log(`  True positives:         ${overall.total_true_positives}`);
  console.log(`  False positives:        ${overall.total_false_positives}`);
  console.log(`  False negatives:        ${overall.total_false_negatives}`);
  console.log(`  Micro Precision:        ${overall.micro_precision}`);
  console.log(`  Micro Recall:           ${overall.micro_recall}`);
  console.log(`  Micro F1:               ${overall.micro_f1}`);
  console.log(`  Continuity pass rate:   ${overall.continuity_pass_rate}`);
  console.log(`  Zero-extraction stmts:  ${overall.zero_extraction_count}`);
  console.log(`  Bank detection acc:     ${overall.bank_detection_accuracy}`);
  console.log("\u2550".repeat(70));
  console.log("\n  PER-BANK BREAKDOWN:");
  console.log("  " + "-".repeat(68));
  console.log("  Bank     | Stmts | Prec   | Recall | F1     | Cont%  | ExtRatio");
  console.log("  " + "-".repeat(68));
  for (const b of bankSummaries.sort((a, b2) => a.bank.localeCompare(b2.bank))) {
    console.log(
      `  ${b.bank.padEnd(8)} | ${String(b.statements).padStart(5)} | ${b.precision.toFixed(4)} | ${b.recall.toFixed(4)} | ${b.f1.toFixed(4)} | ${b.continuity_pass_rate.toFixed(4)} | ${b.mean_extraction_ratio.toFixed(4)}`
    );
  }
  console.log("  " + "-".repeat(68));
  const output = {
    metadata: {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      engine: "deterministic-regex",
      corpus_dir: corpusDir,
      total_statements: results.length
    },
    overall,
    per_bank: bankSummaries,
    per_statement: results
  };
  import_fs.default.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`
  Results written to: ${outputPath}
`);
}
main().catch((err) => {
  console.error("Evaluation error:", err);
  process.exit(1);
});
