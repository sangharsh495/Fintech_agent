"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  TrendingUp,
  Shield,
  Zap,
  Brain,
  Calculator,
  Lock,
  ArrowRight,
  CheckCircle,
  FileText,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Star,
  Download,
  Smartphone,
  Laptop,
  Check,
  Building2,
  PieChart,
  BarChart3,
  Bot,
  HelpCircle,
  Activity,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  RefreshCw,
  Terminal,
  Layers,
  Fingerprint,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  ArrowUpRight,
  Eye,
  Sliders,
  DollarSign,
  Briefcase,
  Play,
  Copy,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// ─── Supported Banks List ─────────────────────────────────────
const ALL_BANKS = [
  { name: "HDFC Bank", category: "Private", format: "PDF, CSV, XLSX" },
  { name: "ICICI Bank", category: "Private", format: "PDF, CSV, XLSX" },
  { name: "State Bank of India", category: "PSU", format: "PDF, CSV" },
  { name: "Axis Bank", category: "Private", format: "PDF, CSV, XLSX" },
  { name: "Kotak Mahindra Bank", category: "Private", format: "PDF, CSV" },
  { name: "Punjab National Bank", category: "PSU", format: "PDF, CSV" },
  { name: "Bank of Baroda", category: "PSU", format: "PDF, CSV" },
  { name: "Canara Bank", category: "PSU", format: "PDF, CSV" },
  { name: "IndusInd Bank", category: "Private", format: "PDF, CSV, XLSX" },
  { name: "Yes Bank", category: "Private", format: "PDF, CSV" },
  { name: "IDFC FIRST Bank", category: "Private", format: "PDF, CSV, XLSX" },
  { name: "Federal Bank", category: "Private", format: "PDF, CSV" },
  { name: "Standard Chartered", category: "MNC", format: "PDF, CSV" },
  { name: "HSBC India", category: "MNC", format: "PDF, CSV" },
  { name: "Union Bank of India", category: "PSU", format: "PDF, CSV" },
  { name: "Bank of India", category: "PSU", format: "PDF, CSV" },
]

// ─── Interactive AI CA Chat Previews ─────────────────────────
const AI_CA_DEMOS = [
  {
    question: "Can I claim both HRA exemption and Section 24(b) Home Loan deduction together?",
    answer:
      "Yes! Under Section 10(13A) and Section 24(b) of the Income Tax Act 1961, you can claim BOTH if you live in a rented property in one city (or near your workplace) while your owned self-occupied house is located elsewhere or currently under construction. You must maintain genuine rent receipts, landlord PAN (if rent > ₹1L/yr), and lender interest certificates.",
    reference: "IT Act 1961 §10(13A), §24(b) • CBDT Circular No. 8/2013",
    confidence: "99.8%",
    category: "Real Estate & HRA",
  },
  {
    question: "How does Section 44ADA Presumptive Taxation benefit freelancers and tech consultants?",
    answer:
      "Section 44ADA allows eligible professionals (software developers, designers, consultants, CA, lawyers) with gross receipts up to ₹75 Lakhs (with ≤5% cash receipts) to declare 50% as taxable profit with NO mandatory maintenance of books of account or auditing under Section 44AB. The remaining 50% is treated as allowable professional expense deductions automatically.",
    reference: "IT Act 1961 §44ADA • Finance Act 2023 Amendment",
    confidence: "100%",
    category: "Presumptive Tax",
  },
  {
    question: "How can I maximize health insurance tax deductions under Section 80D?",
    answer:
      "You can claim up to ₹25,000 for self, spouse, and dependent children (<60 years). An ADDITIONAL ₹50,000 deduction is available for senior citizen parents (≥60 years), plus up to ₹5,000 for preventive health check-ups within these sub-limits, achieving a maximum total deduction of ₹75,000 to ₹1,00,000 per financial year.",
    reference: "IT Act 1961 §80D • Circular 01/2024",
    confidence: "99.9%",
    category: "Chapter VI-A",
  },
]

// ─── Interactive Statement Ingestion Demo Files ──────────────
const DEMO_FILES = [
  {
    id: "hdfc",
    name: "HDFC_Salary_Account_Oct-Mar.pdf",
    bank: "HDFC Bank",
    format: "PDF (Encrypted)",
    size: "412 KB",
    transactionsCount: 168,
    sampleBalance: "₹4,12,850",
  },
  {
    id: "icici",
    name: "ICICI_Wealth_Current_FY24-25.xlsx",
    bank: "ICICI Bank",
    format: "Excel / Spreadsheet",
    size: "820 KB",
    transactionsCount: 342,
    sampleBalance: "₹18,45,200",
  },
  {
    id: "sbi",
    name: "SBI_Savings_Passbook_Statement.csv",
    bank: "State Bank of India",
    format: "Structured CSV",
    size: "185 KB",
    transactionsCount: 94,
    sampleBalance: "₹2,74,100",
  },
]

export default function LandingPage() {
  // ── State ───────────────────────────────────────────────────
  const [activePlatformTab, setActivePlatformTab] = useState<"cockpit" | "ml" | "virtual-ca" | "reconciler">("cockpit")
  const [annualBilling, setAnnualBilling] = useState(true)
  const [bankSearch, setBankSearch] = useState("")

  // Interactive Tax Simulator State
  const [income, setIncome] = useState(1400000)
  const [has80C, setHas80C] = useState(true)
  const [has80D, setHas80D] = useState(true)
  const [hasNPS, setHasNPS] = useState(true)
  const [hasHRA, setHasHRA] = useState(true)
  const [hasHomeLoan, setHasHomeLoan] = useState(false)
  const [is44ADA, setIs44ADA] = useState(false)

  // Ingestion Simulator State
  const [selectedDemoFile, setSelectedDemoFile] = useState(DEMO_FILES[0])
  const [ingestionStep, setIngestionStep] = useState<"idle" | "running" | "complete">("idle")
  const [ingestionProgress, setIngestionProgress] = useState(0)
  const [ingestionLogs, setIngestionLogs] = useState<string[]>([])

  // AI CA Simulator State
  const [activeAiDemoIndex, setActiveAiDemoIndex] = useState(0)

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  // ── Tax Calculations ────────────────────────────────────────
  const deductionsTotal = useMemo(() => {
    let total = 50000 // Standard deduction in old regime
    if (has80C) total += 150000
    if (has80D) total += 50000
    if (hasNPS) total += 50000
    if (hasHRA) total += 120000
    if (hasHomeLoan) total += 200000
    return total
  }, [has80C, has80D, hasNPS, hasHRA, hasHomeLoan])

  const taxableIncomeOld = is44ADA ? Math.max(0, income * 0.5 - (deductionsTotal - 50000)) : Math.max(0, income - deductionsTotal)
  const taxableIncomeNew = is44ADA ? Math.max(0, income * 0.5 - 75000) : Math.max(0, income - 75000)

  // Old Regime Tax (with 4% Cess)
  const calculateOldTax = (taxable: number) => {
    if (taxable <= 250000) return 0
    let tax = 0
    if (taxable <= 500000) {
      tax = (taxable - 250000) * 0.05
    } else if (taxable <= 1000000) {
      tax = 12500 + (taxable - 500000) * 0.2
    } else {
      tax = 112500 + (taxable - 1000000) * 0.3
    }
    if (taxable <= 500000) tax = 0 // Rebate u/s 87A
    return Math.round(tax * 1.04)
  }

  // New Regime Tax (Budget 2024–26 slabs with 4% Cess)
  const calculateNewTax = (taxable: number) => {
    if (taxable <= 300000) return 0
    let tax = 0
    if (taxable <= 700000) {
      tax = (taxable - 300000) * 0.05
    } else if (taxable <= 1000000) {
      tax = 20000 + (taxable - 700000) * 0.1
    } else if (taxable <= 1200000) {
      tax = 50000 + (taxable - 1000000) * 0.15
    } else if (taxable <= 1500000) {
      tax = 80000 + (taxable - 1200000) * 0.2
    } else {
      tax = 140000 + (taxable - 1500000) * 0.3
    }
    if (taxable <= 700000) tax = 0 // Rebate u/s 87A (New Regime up to 7L)
    return Math.round(tax * 1.04)
  }

  const oldTax = calculateOldTax(taxableIncomeOld)
  const newTax = calculateNewTax(taxableIncomeNew)
  const optimalSavings = Math.abs(oldTax - newTax)
  const recommendedRegime = newTax <= oldTax ? "New Regime" : "Old Regime"

  // ── Ingestion Simulation Handler ───────────────────────────
  const runIngestionSimulation = () => {
    setIngestionStep("running")
    setIngestionProgress(10)
    setIngestionLogs(["[INITIALIZE] Loading file stream: " + selectedDemoFile.name])

    setTimeout(() => {
      setIngestionProgress(35)
      setIngestionLogs((prev) => [
        ...prev,
        "[QPDF CIPHER] Cryptographic key match found. Master PDF unlocked without decrypt artifacts.",
      ])
    }, 600)

    setTimeout(() => {
      setIngestionProgress(65)
      setIngestionLogs((prev) => [
        ...prev,
        `[PARSER] Extracted ${selectedDemoFile.transactionsCount} transaction rows. Normalized IFSC, merchant aliases, and UPI handles.`,
      ])
    }, 1200)

    setTimeout(() => {
      setIngestionProgress(90)
      setIngestionLogs((prev) => [
        ...prev,
        "[HASHING] Generated SHA-256 determinism matrix. Checked against existing database: 0 duplicates.",
      ])
    }, 1700)

    setTimeout(() => {
      setIngestionProgress(100)
      setIngestionStep("complete")
      setIngestionLogs((prev) => [
        ...prev,
        `[AUDIT SUCCESS] Mathematical balance continuity verified: Running Balance ε = 0.00. Balance: ${selectedDemoFile.sampleBalance}`,
      ])
    }, 2200)
  }

  // Filtered Banks
  const filteredBanks = useMemo(() => {
    if (!bankSearch.trim()) return ALL_BANKS
    return ALL_BANKS.filter((b) => b.name.toLowerCase().includes(bankSearch.toLowerCase()))
  }, [bankSearch])

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary overflow-x-hidden font-sans">
      
      {/* ── 0. TOP ANNOUNCEMENT BAR ── */}
      <div className="w-full bg-gradient-to-r from-primary/15 via-indigo-500/10 to-accent/15 border-b border-primary/20 py-2.5 px-4 text-xs font-medium text-center relative overflow-hidden backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 flex-wrap text-foreground">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" /> FinFlow 2.0 Live
          </span>
          <span className="text-muted-foreground">
            Budget 2024–26 Slabs, QPDF Multi-Bank Ingestion, and Autonomous ITR-1 / 2 Generation Active
          </span>
          <Link href="/auth/signup" className="text-primary font-bold hover:underline inline-flex items-center gap-0.5 ml-1">
            Claim Free Account <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ── 1. FLOATING NAVIGATION BAR ── */}
      <nav className="sticky top-0 z-40 w-full backdrop-blur-xl bg-background/80 border-b border-border/50 transition-all duration-300">
        <div className="container-page flex items-center justify-between h-16 md:h-18">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-indigo-600 to-accent flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform">
              ₹
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight gradient-text">FinFlow</span>
              <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase -mt-1">
                Autonomous Wealth & Tax
              </span>
            </div>
          </Link>

          {/* Center Links */}
          <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-muted-foreground">
            <a href="#cockpit" className="hover:text-foreground transition-colors">Platform</a>
            <a href="#live-sandbox" className="hover:text-foreground transition-colors">Statement Ingestion</a>
            <a href="#tax-simulator" className="hover:text-foreground transition-colors">Tax Simulator</a>
            <a href="#ml-cohorts" className="hover:text-foreground transition-colors">ML Analytics</a>
            <a href="#virtual-ca" className="hover:text-foreground transition-colors">Virtual CA</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <Link href="/calculators" className="hidden sm:inline-flex">
              <Button variant="ghost" size="sm" className="text-xs font-semibold rounded-xl text-muted-foreground hover:text-foreground">
                <Calculator className="w-3.5 h-3.5 mr-1.5 text-primary" /> 30+ Free Tools
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="text-xs font-semibold rounded-xl border-border/80 hover:bg-secondary">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20 hover:scale-[1.02] transition-transform">
                Get Started Free <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>

        </div>
      </nav>

      {/* ── 2. HERO SECTION WITH AMBIENT AURORA & FLOATING TELEMETRY ── */}
      <section className="relative pt-16 pb-24 md:pt-28 md:pb-36 overflow-hidden border-b border-border/40">
        
        {/* Animated Aurora Light Beams & Grid */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[55rem] h-[35rem] bg-gradient-to-tr from-primary/25 via-indigo-500/20 to-accent/15 rounded-full blur-[150px] pointer-events-none opacity-70 animate-aurora" />
        <div className="absolute -top-10 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: "36px 36px",
          }}
        />

        <div className="container-page relative z-10 flex flex-col items-center text-center">
          
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs md:text-sm font-bold mb-8 backdrop-blur-xl shadow-xs animate-in fade-in slide-in-from-bottom-3 duration-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Autonomous Wealth Intelligence & Tax Automation</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.08] mb-6 text-foreground">
            Complete Financial Clarity. <br />
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-accent bg-clip-text text-transparent">
              Zero Manual Spreadsheets.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mb-10 leading-relaxed font-normal">
            Ingest password-protected statements across 21+ Indian banks, decode spending with Scikit-Learn DBSCAN cohorts, and file error-free ITRs with India&apos;s most sophisticated AI Virtual CA.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-14 px-9 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-[0.98] transition-all">
                Launch Autonomous Dashboard <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#tax-simulator" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-semibold rounded-2xl bg-card/70 backdrop-blur-xl border-border/80 hover:bg-secondary transition-all">
                <Sliders className="w-4 h-4 mr-2 text-primary" /> Try Live Tax Simulator
              </Button>
            </a>
          </div>

          {/* Micro Trust Proofs */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-semibold text-muted-foreground mb-12">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>AES-256 Bank-Grade Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>&lt;120ms Statement Parser</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>100% ITD Schema Compliant</span>
            </div>
          </div>

          {/* ── FLOATING TELEMETRY MINI CARDS OVER PLATFORM PREVIEW ── */}
          <div className="w-full max-w-5xl relative">
            
            {/* Left Floating Pill */}
            <div className="hidden md:flex absolute -left-8 top-12 z-20 items-center gap-3 p-3.5 rounded-2xl bg-card/90 backdrop-blur-xl border border-emerald-500/30 shadow-2xl animate-float text-left">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-500 font-bold">
                ₹
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">₹1,24,500 Tax Saved</p>
                <p className="text-[10px] text-emerald-500 font-medium">80CCD(1B) NPS + HRA Optimized</p>
              </div>
            </div>

            {/* Right Floating Pill */}
            <div className="hidden md:flex absolute -right-8 top-24 z-20 items-center gap-3 p-3.5 rounded-2xl bg-card/90 backdrop-blur-xl border border-primary/30 shadow-2xl animate-float-delayed text-left">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">DBSCAN Anomaly Radar</p>
                <p className="text-[10px] text-primary font-medium">0 Duplicate Charges Flagged</p>
              </div>
            </div>

            {/* ── 3. INTERACTIVE 4-IN-1 PLATFORM COCKPIT (THE HERO SHOWCASE) ── */}
            <div id="cockpit" className="w-full rounded-[2.5rem] p-2 bg-gradient-to-b from-border/90 via-border/40 to-transparent shadow-2xl backdrop-blur-2xl">
              <div className="rounded-[2.2rem] bg-card/95 border border-border/80 p-6 md:p-8 overflow-hidden text-left">
                
                {/* Platform Tab Switcher Header */}
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between pb-6 border-b border-border/60 gap-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">Interactive Live Platform Preview</span>
                    <h3 className="text-xl md:text-2xl font-bold text-foreground mt-0.5">Autonomous Wealth & Tax Operations</h3>
                  </div>

                  {/* Cockpit Mode Tabs */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-secondary/80 border border-border/80">
                    {[
                      { id: "cockpit", label: "Executive Cockpit", icon: TrendingUp },
                      { id: "ml", label: "ML Cohorts", icon: Brain },
                      { id: "virtual-ca", label: "AI Virtual CA", icon: Bot },
                      { id: "reconciler", label: "3-Way ITR", icon: FileText },
                    ].map((tab) => {
                      const Icon = tab.icon
                      const active = activePlatformTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActivePlatformTab(tab.id as any)}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer",
                            active
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ── Cockpit Tab 1: Executive Wealth ── */}
                {activePlatformTab === "cockpit" && (
                  <div className="mt-6 space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className="p-5 rounded-2xl bg-gradient-to-br from-secondary/50 to-secondary/20 border border-border/60">
                        <span className="text-xs text-muted-foreground font-medium">Consolidated Real-Time Net Worth</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl md:text-4xl font-extrabold font-mono text-foreground">₹48,92,450</span>
                          <span className="text-xs font-bold text-emerald-500">+18.4% YoY</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/40">
                          <span>Liquid Cash: ₹12.4L</span>
                          <span>Mutual Funds: ₹36.5L</span>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-gradient-to-br from-secondary/50 to-secondary/20 border border-border/60">
                        <span className="text-xs text-muted-foreground font-medium">Monthly Inflow Velocity</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl md:text-4xl font-extrabold font-mono text-foreground">₹2,85,000</span>
                          <span className="text-xs font-bold text-primary">Salary + Freelance</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/40">
                          <span>Expenses: ₹92,400</span>
                          <span className="text-emerald-500 font-semibold">Savings Rate: 67.5%</span>
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/25">
                        <span className="text-xs text-primary font-bold">Tax Efficiency Score</span>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl md:text-4xl font-extrabold font-mono text-primary">940 / 1000</span>
                          <span className="text-xs font-bold text-emerald-500">Tier 1 Elite</span>
                        </div>
                        <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground pt-3 border-t border-border/40">
                          <span>Unclaimed Deductions: ₹0</span>
                          <span className="text-primary font-semibold">ITR-1 Ready</span>
                        </div>
                      </div>

                    </div>

                    {/* Synchronized Bank Stream Bar */}
                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="font-semibold text-foreground">3 Ingestion Pipelines Live:</span>
                        <span className="text-muted-foreground">HDFC Bank (•••• 4921) • ICICI Bank (•••• 8820) • SBI (•••• 1039)</span>
                      </div>
                      <span className="font-mono text-muted-foreground">Balance Math ε ≤ 0.00001 Verified ✓</span>
                    </div>
                  </div>
                )}

                {/* ── Cockpit Tab 2: Neural ML Spending Clusters ── */}
                {activePlatformTab === "ml" && (
                  <div className="mt-6 space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      <div className="p-5 rounded-2xl bg-secondary/40 border border-border/60">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-foreground">K-Means Circular Behavioral Cohorts</h4>
                          <span className="text-xs text-primary font-mono font-semibold">k = 4 Clusters</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">
                          Transactions encoded onto 2D trigonometric coordinates (hour-of-day & day-of-week) for behavioral discovery.
                        </p>
                        
                        <div className="space-y-2.5">
                          {[
                            { label: "SIPs & Systematic Wealth Accumulation", pct: "42%", count: "14 txns", color: "bg-primary text-primary" },
                            { label: "Essential Utilities & Household Living", pct: "28%", count: "62 txns", color: "bg-emerald-500 text-emerald-500" },
                            { label: "Lifestyle, Dining & Travel Discretionary", pct: "18%", count: "48 txns", color: "bg-amber-500 text-amber-500" },
                            { label: "High-Frequency Micro-UPI Spends (&lt;₹200)", pct: "12%", count: "124 txns", color: "bg-purple-500 text-purple-500" },
                          ].map((item) => (
                            <div key={item.label} className="p-3 rounded-xl bg-background/80 border border-border/50 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", item.color)} />
                                <span className="font-medium text-foreground">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-3 font-mono">
                                <span className="text-muted-foreground">{item.count}</span>
                                <span className="font-bold text-foreground">{item.pct}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-secondary/40 border border-border/60 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-foreground">DBSCAN Anomaly Radar</h4>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                              Radar Active
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-4">
                            Density-based spatial clustering filters statistical noise and isolates hidden charges or duplicate debits.
                          </p>

                          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 space-y-1 mb-3">
                            <p className="font-bold">✓ Zero Critical Outliers Flagged</p>
                            <p className="text-[11px] opacity-90">All 248 statement debits match normal variance boundaries (eps=0.45, min_samples=3).</p>
                          </div>

                          <div className="p-3.5 rounded-xl bg-secondary/80 border border-border text-xs space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Sample Micro-Audit</span>
                            <p className="font-medium text-foreground">₹2,499 Spotify Annual • Classified to Discretionary Entertainment</p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                          <span>Scikit-Learn DBSCAN v1.4</span>
                          <span className="text-primary">Latency: 14ms</span>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* ── Cockpit Tab 3: Virtual CA ── */}
                {activePlatformTab === "virtual-ca" && (
                  <div className="mt-6 space-y-4 animate-in fade-in duration-300">
                    <div className="flex flex-wrap gap-2 mb-2">
                      {AI_CA_DEMOS.map((demo, idx) => (
                        <button
                          key={demo.category}
                          onClick={() => setActiveAiDemoIndex(idx)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer",
                            activeAiDemoIndex === idx
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {demo.category}
                        </button>
                      ))}
                    </div>

                    <div className="p-5 rounded-2xl bg-secondary/40 border border-border/60 space-y-4">
                      {/* User Prompt */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                          You
                        </div>
                        <div className="p-3.5 rounded-2xl bg-background border border-border/60 text-xs font-medium text-foreground max-w-xl">
                          {AI_CA_DEMOS[activeAiDemoIndex].question}
                        </div>
                      </div>

                      {/* AI CA Response */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs shrink-0">
                          CA
                        </div>
                        <div className="p-4 rounded-2xl bg-card border border-primary/25 text-xs text-foreground max-w-2xl space-y-3 shadow-md">
                          <div className="flex items-center justify-between text-[11px] pb-2 border-b border-border/40">
                            <span className="font-bold text-primary flex items-center gap-1.5">
                              <Bot className="w-3.5 h-3.5" /> FinFlow Virtual CA
                            </span>
                            <span className="text-emerald-500 font-mono font-semibold">
                              Confidence: {AI_CA_DEMOS[activeAiDemoIndex].confidence}
                            </span>
                          </div>
                          <p className="leading-relaxed">{AI_CA_DEMOS[activeAiDemoIndex].answer}</p>
                          <div className="pt-2 flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                            <Shield className="w-3 h-3 text-primary" />
                            <span>{AI_CA_DEMOS[activeAiDemoIndex].reference}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Cockpit Tab 4: 3-Way ITR Reconciler ── */}
                {activePlatformTab === "reconciler" && (
                  <div className="mt-6 space-y-4 animate-in fade-in duration-300">
                    <div className="p-5 rounded-2xl bg-secondary/40 border border-border/60">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-bold text-foreground">3-Way E-Filing Tax Reconciliation</h4>
                          <p className="text-xs text-muted-foreground">Automatic cross-verification of Employer Form 16, ITD AIS/TIS, and Bank Statements.</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-mono text-xs font-bold">
                          100% Match ✓
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3.5 rounded-xl bg-background border border-border/60">
                          <span className="text-muted-foreground font-medium">Source 1: Form 16 (Part B)</span>
                          <p className="text-base font-bold font-mono text-foreground mt-1">₹14,00,000</p>
                          <span className="text-[10px] text-emerald-500">TDS: ₹1,12,000 Deducted</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-background border border-border/60">
                          <span className="text-muted-foreground font-medium">Source 2: AIS / TIS Feed</span>
                          <p className="text-base font-bold font-mono text-foreground mt-1">₹14,00,000</p>
                          <span className="text-[10px] text-emerald-500">Interest: ₹14,200 Matched</span>
                        </div>
                        <div className="p-3.5 rounded-xl bg-background border border-border/60">
                          <span className="text-muted-foreground font-medium">Source 3: Bank Ingestion</span>
                          <p className="text-base font-bold font-mono text-foreground mt-1">₹14,00,000</p>
                          <span className="text-[10px] text-primary">0 Unaccounted Deposits</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">Ready for Automated ITR-1 Schema Upload</span>
                        <Button size="sm" className="h-9 px-4 rounded-xl text-xs font-bold">
                          <Download className="w-3.5 h-3.5 mr-1.5" /> Download ITD JSON File
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ── 3. LIVE INTERACTIVE STATEMENT INGESTION SANDBOX ── */}
      <section id="live-sandbox" className="py-20 md:py-32 border-b border-border/40 relative bg-gradient-to-b from-transparent via-card/30 to-transparent">
        <div className="container-page max-w-5xl">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              <Terminal className="w-3.5 h-3.5" /> Interactive Sandbox
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Try the Autonomous Ingestion Engine Live
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-2xl mx-auto">
              Select a sample Indian bank statement below and watch our deterministic QPDF &amp; SHA-256 deduplication pipeline execute in real time.
            </p>
          </div>

          <Card className="p-6 md:p-10 rounded-[2.5rem] border-border/80 bg-card/80 backdrop-blur-2xl shadow-2xl space-y-8">
            
            {/* 1. Select Demo File */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Step 1: Choose Sample Statement File
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {DEMO_FILES.map((file) => {
                  const isSelected = selectedDemoFile.id === file.id
                  return (
                    <button
                      key={file.id}
                      onClick={() => {
                        setSelectedDemoFile(file)
                        setIngestionStep("idle")
                        setIngestionProgress(0)
                        setIngestionLogs([])
                      }}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer",
                        isSelected
                          ? "bg-primary/10 border-primary shadow-sm"
                          : "bg-secondary/40 border-border/70 hover:bg-secondary"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-foreground">{file.bank}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-background border border-border text-muted-foreground">
                          {file.format}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-muted-foreground truncate">{file.name}</p>
                      <p className="text-[11px] font-semibold text-primary mt-2">{file.transactionsCount} Transactions</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Run Pipeline Action */}
            <div className="p-6 rounded-2xl bg-secondary/30 border border-border/60 relative overflow-hidden">
              {ingestionStep === "running" && (
                <div className="absolute inset-0 bg-primary/5 pointer-events-none animate-scanline" />
              )}

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" /> Autonomous Ingestion Pipeline
                  </h4>
                  <p className="text-xs text-muted-foreground">Deterministic table parsing with running balance verification.</p>
                </div>

                <Button
                  onClick={runIngestionSimulation}
                  disabled={ingestionStep === "running"}
                  className="rounded-xl px-6 font-bold text-xs"
                >
                  {ingestionStep === "running" ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> Ingesting...
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 mr-2" /> Run Ingestion Engine
                    </>
                  )}
                </Button>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-secondary rounded-full h-2 overflow-hidden mb-4">
                <div
                  className="bg-gradient-to-r from-primary to-accent h-full transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${ingestionProgress}%` }}
                />
              </div>

              {/* Terminal Logs Stream */}
              <div className="rounded-xl bg-slate-950 p-4 font-mono text-[11px] text-slate-300 space-y-1.5 max-h-48 overflow-y-auto border border-slate-800">
                <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                  FinFlow Ingestion Stream • Engine Ready
                </div>
                {ingestionLogs.length === 0 ? (
                  <p className="text-slate-600 italic">Click &quot;Run Ingestion Engine&quot; to begin zero-hallucination processing...</p>
                ) : (
                  ingestionLogs.map((log, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-primary font-bold">➜</span>
                      <span className={log.includes("AUDIT SUCCESS") ? "text-emerald-400 font-bold" : ""}>
                        {log}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>

          </Card>
        </div>
      </section>

      {/* ── 4. INTERACTIVE DUAL-REGIME TAX STRATEGY SIMULATOR ── */}
      <section id="tax-simulator" className="py-20 md:py-32 border-b border-border/40 relative">
        <div className="container-page max-w-5xl">
          
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              <Calculator className="w-3.5 h-3.5" /> Budget 2024–26 Live Slabs
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Old vs. New Tax Regime Simulator
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-2xl mx-auto">
              Simulate your annual income, toggle your actual deductions, and let FinFlow compute your exact optimal tax liability.
            </p>
          </div>

          <Card className="p-6 md:p-10 rounded-[2.5rem] border-border/80 bg-card/80 backdrop-blur-2xl shadow-2xl space-y-8">
            
            {/* Income Slider */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-bold text-foreground">Annual Gross Income</label>
                <span className="text-2xl md:text-3xl font-extrabold text-primary font-mono">
                  ₹{(income / 100000).toFixed(2)} Lakhs
                </span>
              </div>
              <input
                type="range"
                min="400000"
                max="4000000"
                step="50000"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="w-full h-3 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground mt-2 font-mono">
                <span>₹4 Lakhs</span>
                <span>₹15 Lakhs</span>
                <span>₹40 Lakhs</span>
              </div>
            </div>

            {/* Deduction Checkboxes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Eligible Deductions (Old Regime Benefits)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: "Section 80C (PPF, ELSS, EPF)", amount: "₹1,50,000", state: has80C, setter: setHas80C },
                  { label: "Section 80D (Health Insurance)", amount: "₹50,000", state: has80D, setter: setHas80D },
                  { label: "Section 80CCD(1B) (NPS Tier 1)", amount: "₹50,000", state: hasNPS, setter: setHasNPS },
                  { label: "Section 10(13A) (HRA Exemption)", amount: "₹1,20,000", state: hasHRA, setter: setHasHRA },
                  { label: "Section 24(b) (Home Loan Interest)", amount: "₹2,00,000", state: hasHomeLoan, setter: setHasHomeLoan },
                  { label: "Section 44ADA (50% Freelance Profit)", amount: "50% Deduct", state: is44ADA, setter: setIs44ADA },
                ].map((item) => (
                  <label
                    key={item.label}
                    className={cn(
                      "flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none text-xs",
                      item.state
                        ? "bg-primary/10 border-primary/40 text-foreground"
                        : "bg-secondary/30 border-border/60 text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={item.state}
                      onChange={(e) => item.setter(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{item.label}</p>
                      <span className="text-[10px] text-primary font-mono">{item.amount}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Comparison Output Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
              
              <div className="p-5 rounded-2xl bg-secondary/40 border border-border/60">
                <span className="text-xs text-muted-foreground font-medium">Old Regime Liability</span>
                <p className="text-2xl font-bold font-mono text-foreground mt-1">₹{oldTax.toLocaleString("en-IN")}</p>
                <span className="text-[11px] text-muted-foreground font-mono">Deductions: ₹{deductionsTotal.toLocaleString("en-IN")}</span>
              </div>

              <div className="p-5 rounded-2xl bg-secondary/40 border border-border/60">
                <span className="text-xs text-muted-foreground font-medium">New Regime Liability</span>
                <p className="text-2xl font-bold font-mono text-foreground mt-1">₹{newTax.toLocaleString("en-IN")}</p>
                <span className="text-[11px] text-emerald-500 font-mono">Std ₹75k + Rebate 87A</span>
              </div>

              <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30 relative overflow-hidden">
                <span className="text-xs text-primary font-bold">Optimal Recommendation</span>
                <p className="text-xl font-extrabold text-foreground mt-1">{recommendedRegime}</p>
                <p className="text-xs text-emerald-500 font-bold font-mono mt-1">
                  Save ₹{optimalSavings.toLocaleString("en-IN")}
                </p>
              </div>

            </div>

            {/* CTA */}
            <div className="pt-2 flex justify-center">
              <Link href="/auth/signup">
                <Button className="rounded-xl px-8 font-bold h-12 text-sm shadow-xl shadow-primary/20">
                  Generate Complete Tax Optimization Report <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

          </Card>
        </div>
      </section>

      {/* ── 5. INTERACTIVE 21+ INDIAN BANKS COMPATIBILITY ── */}
      <section className="py-20 md:py-28 border-b border-border/40 bg-card/20">
        <div className="container-page">
          
          <div className="max-w-xl mx-auto text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Universal Indian Banking Coverage
            </h2>
            <p className="text-muted-foreground text-xs md:text-sm mt-2">
              Ingest statements in PDF, CSV, Excel, and CAS formats with 100% client-side cryptographic parsing.
            </p>

            {/* Search Filter Input */}
            <div className="relative mt-6">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                placeholder="Search your bank (e.g. HDFC, ICICI, SBI, Axis)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-card text-xs font-medium text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
            {filteredBanks.map((bank) => (
              <div
                key={bank.name}
                className="p-3.5 rounded-xl bg-card border border-border/60 shadow-xs flex items-center justify-between text-xs hover:border-primary/40 transition-colors"
              >
                <div>
                  <p className="font-bold text-foreground">{bank.name}</p>
                  <span className="text-[10px] text-muted-foreground font-mono">{bank.format}</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-semibold text-primary">
                  {bank.category}
                </span>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── 6. CRYPTOGRAPHIC VAULT & SECURITY ARCHITECTURE ── */}
      <section id="security" className="py-20 md:py-32 border-b border-border/40">
        <div className="container-page">
          
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              <Lock className="w-3.5 h-3.5" /> Cryptographic Integrity
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Institutional-Grade Data Security
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-3">
              We never sell your financial records. Your data is isolated in secure PostgreSQL Row-Level Security (RLS) tenants with zero third-party leakage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <Card className="p-8 rounded-[2rem] border-border/80 bg-card/60 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">AES-256 Field Encryption</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  PAN cards, Aadhaar tokens, and bank account identifiers are encrypted at rest using AES-256-GCM before writing to the database.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 text-[11px] font-mono text-primary">
                FIPS 140-2 Compliant
              </div>
            </Card>

            <Card className="p-8 rounded-[2rem] border-border/80 bg-card/60 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">PostgreSQL RLS Tenant Isolation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Database queries strictly enforce PostgreSQL Row-Level Security (`current_setting(&apos;app.current_user_id&apos;)`), guaranteeing complete tenant data isolation.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 text-[11px] font-mono text-emerald-500">
                Zero Cross-Tenant Leakage
              </div>
            </Card>

            <Card className="p-8 rounded-[2rem] border-border/80 bg-card/60 backdrop-blur-xl flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">In-Memory Stream Parsing</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  PDF and Excel statements are processed exclusively in volatile RAM streams and wiped immediately following transaction extraction.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border/40 text-[11px] font-mono text-accent">
                Zero Disk Persistence
              </div>
            </Card>

          </div>

        </div>
      </section>

      {/* ── 7. TRANSPARENT VALUE-FIRST PRICING ── */}
      <section id="pricing" className="py-20 md:py-32 border-b border-border/40">
        <div className="container-page max-w-5xl text-center">
          
          <div className="mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Transparent, Value-Driven Pricing
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-2">
              Start completely free. Upgrade only when you want automated ITR-1 e-filing JSON export and unlimited Virtual CA consultations.
            </p>

            {/* Billing Toggle */}
            <div className="mt-8 flex items-center justify-center gap-3">
              <span className={cn("text-xs font-semibold", !annualBilling ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
              <button
                onClick={() => setAnnualBilling(!annualBilling)}
                className="w-12 h-6 rounded-full bg-secondary border border-border p-0.5 cursor-pointer transition-colors relative"
              >
                <div
                  className={cn(
                    "w-5 h-5 rounded-full bg-primary transition-transform duration-200",
                    annualBilling ? "translate-x-6" : "translate-x-0"
                  )}
                />
              </button>
              <span className={cn("text-xs font-semibold flex items-center gap-1", annualBilling ? "text-foreground" : "text-muted-foreground")}>
                Annual Billing <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[10px] font-extrabold">Save 20%</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            
            {/* Free Tier */}
            <Card className="p-8 rounded-[2.5rem] border-border bg-card flex flex-col justify-between shadow-lg">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Community Starter</span>
                <h3 className="text-2xl font-bold text-foreground mt-1">Free Forever</h3>
                <p className="text-xs text-muted-foreground mt-2">Perfect for expense tracking, wealth monitoring, and tax calculations.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold font-mono text-foreground">₹0</span>
                  <span className="text-xs text-muted-foreground"> / forever</span>
                </div>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Unlimited Bank Statement Ingestion (21+ Banks)</div>
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Real-time Net Worth &amp; Spending Analytics</div>
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> Dual-Regime Tax Strategy Simulator</div>
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> 30+ Universal Financial &amp; Tax Calculators</div>
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-emerald-500 shrink-0" /> 5 AI Virtual CA messages / day</div>
                </div>
              </div>
              <Link href="/auth/signup" className="mt-8">
                <Button variant="outline" className="w-full rounded-xl font-bold h-12 text-xs">
                  Create Free Account
                </Button>
              </Link>
            </Card>

            {/* Chartered Pro Tier */}
            <Card className="p-8 rounded-[2.5rem] border-primary/40 bg-gradient-to-b from-primary/10 via-card to-card relative flex flex-col justify-between shadow-2xl">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold tracking-wider uppercase">
                Most Popular
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Chartered Pro</span>
                <h3 className="text-2xl font-bold text-foreground mt-1">FinFlow Pro &amp; E-Filing</h3>
                <p className="text-xs text-muted-foreground mt-2">Complete autonomous tax optimization and direct ITR filing.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold font-mono text-primary">₹{annualBilling ? "499" : "59"}</span>
                  <span className="text-xs text-muted-foreground"> / {annualBilling ? "year" : "month"}</span>
                </div>
                <div className="space-y-3 text-xs text-foreground font-medium">
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-primary shrink-0" /> Validated ITR-1 / 2 / 4 JSON Schema Generator</div>
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-primary shrink-0" /> Unlimited AI Virtual CA Consultations (IT Act 1961)</div>
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-primary shrink-0" /> Form 16 + AIS + Bank 3-Way Reconciliation</div>
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-primary shrink-0" /> Scikit-Learn K-Means &amp; DBSCAN Anomaly Radar</div>
                  <div className="flex items-center gap-2.5"><Check className="w-4 h-4 text-primary shrink-0" /> Certified CA Audit Report PDF Generation</div>
                </div>
              </div>
              <Link href="/auth/signup" className="mt-8">
                <Button className="w-full rounded-xl font-bold h-12 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                  Upgrade to Chartered Pro
                </Button>
              </Link>
            </Card>

          </div>

        </div>
      </section>

      {/* ── 8. INTERACTIVE FAQ ACCORDION ── */}
      <section id="faq" className="py-20 md:py-28 border-b border-border/40">
        <div className="container-page max-w-4xl">
          
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-sm mt-2">
              Everything you need to know about FinFlow&apos;s security, tax models, and autonomous filing.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "How does FinFlow unlock my password-protected bank PDF statement?",
                a: "FinFlow uses an isolated client-side QPDF cryptographic decryption stream. Standard Indian bank password formats (e.g. first 4 letters of name + DOB DDMM) are evaluated in volatile RAM memory and immediately discarded once table data is parsed.",
              },
              {
                q: "Is the AI Virtual CA legally compliant with Indian Tax Laws?",
                a: "Yes. Our AI CA is grounded strictly on the Income Tax Act 1961, Finance Act 2023/2024 amendments, and official CBDT circulars. Every recommendation includes statutory section citations and adheres to zero-hallucination guardrails.",
              },
              {
                q: "Can I generate and upload official ITR JSON files to the Income Tax Portal?",
                a: "Yes! FinFlow Pro reconciles your statements with Form 16 and AIS to produce a 100% compliant ITD JSON schema ready for one-click upload on incometax.gov.in.",
              },
              {
                q: "Is my financial data shared or sold to third-party lenders?",
                a: "Never. FinFlow enforces strict privacy isolation. Your records are protected with AES-256 field encryption and PostgreSQL Row-Level Security (RLS). We do not run ads or sell data.",
              },
            ].map((faq, index) => {
              const isOpen = openFaq === index
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-border/70 bg-card overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-secondary/40 transition-colors"
                  >
                    <span className="text-sm font-bold text-foreground">{faq.q}</span>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0", isOpen && "rotate-180 text-primary")} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

        </div>
      </section>

      {/* ── 9. FINAL CTA BANNER ── */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        <div className="container-page max-w-4xl text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-accent flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-xl shadow-primary/30">
            ₹
          </div>
          <h2 className="text-3xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            Ready for Autonomous Wealth &amp; Tax Intelligence?
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto mb-10">
            Join thousands of smart professionals and investors who track their portfolio and optimize their taxes with zero spreadsheet work.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="h-14 px-10 rounded-2xl font-bold text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/30 hover:scale-[1.03] transition-all">
              Create Your Free Account Now <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── 10. HIGH-TECH FOOTER ── */}
      <footer className="py-12 border-t border-border/50 bg-card/60 text-xs text-muted-foreground">
        <div className="container-page flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
              ₹
            </div>
            <span className="font-bold text-foreground">FinFlow Systems</span>
            <span>• © {new Date().getFullYear()} All Rights Reserved.</span>
          </div>

          <div className="flex items-center gap-6">
            <a href="#cockpit" className="hover:text-foreground transition-colors">Platform</a>
            <Link href="/tax" className="hover:text-foreground transition-colors">Tax Engine</Link>
            <Link href="/calculators" className="hover:text-foreground transition-colors">Calculators</Link>
            <Link href="/ai-ca" className="hover:text-foreground transition-colors">Virtual CA</Link>
            <Link href="/settings" className="hover:text-foreground transition-colors">Security Vault</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
