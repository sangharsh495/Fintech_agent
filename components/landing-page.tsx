"use client"

import React, { useState, useEffect } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function LandingPage() {
  const [income, setIncome] = useState(1200000)
  const [activeFeatureTab, setActiveFeatureTab] = useState("ingestion")
  const [annualBilling, setAnnualBilling] = useState(true)

  // Quick interactive tax calculation for instant wow factor
  const oldRegimeTax = Math.max(0, (income - 300000) * 0.2 + 12500)
  const newRegimeTax = income <= 700000 ? 0 : Math.max(0, (income - 300000) * 0.15)
  const taxSavings = Math.max(0, oldRegimeTax - newRegimeTax)

  const banks = [
    "HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra",
    "Punjab National Bank", "Bank of Baroda", "Canara Bank", "IndusInd Bank", "Yes Bank"
  ]

  const featureTabs = [
    {
      id: "ingestion",
      label: "Smart Ingestion",
      icon: Zap,
      title: "Zero-Manual Data Ingestion across 21+ Indian Banks",
      description: "Drag and drop password-protected PDF, CSV, or Excel statements. FinFlow automatically unlocks with QPDF, extracts transaction tables, standardizes IFSC/merchants, and eliminates duplicates with deterministic SHA-256 hashing.",
      badges: ["QPDF Decryption", "SHA-256 Deduplication", "Balance Math Continuity (ε ≤ 0.01)"]
    },
    {
      id: "virtual-ca",
      label: "AI Virtual CA",
      icon: Bot,
      title: "Legally Authoritative Indian Tax & Finance Copilot",
      description: "Trained on the Income Tax Act 1961, latest Finance Act amendments, and CBDT circulars. Understands your real financial profile to suggest Chapter VI-A deductions, HRA calculations, and Section 44ADA presumptive schemes.",
      badges: ["Income Tax Act 1961 Codex", "Zero-Hallucination Dual Engine", "Context-Isolated Sandbox"]
    },
    {
      id: "ml-clustering",
      label: "ML Analytics",
      icon: Brain,
      title: "Scikit-Learn Spending Cohorts & DBSCAN Anomaly Detection",
      description: "Circular temporal encoding maps transactions to 2D trigonometric coordinates. K-Means clustering segments micro-spend vs lifestyle expenses while DBSCAN flags hidden bank charges and outlier debits.",
      badges: ["K-Means Behavioral Cohorts", "DBSCAN Anomaly Radar", "Circular Time Tracing"]
    },
    {
      id: "itr-filing",
      label: "One-Click ITR",
      icon: FileText,
      title: "Autonomous ITR-1 / 2 / 4 Schema Generation",
      description: "Auto-reconciles Form 16, AIS/TIS, and bank statements. Pre-populates schedules, validates against official Income Tax Department schemas, and generates compliant JSON files ready for immediate upload.",
      badges: ["ITD Schema Verified", "Form 16 + AIS Reconciliation", "One-Click JSON Download"]
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      
      {/* ── 1. HERO SECTION WITH AMBIENT GLOW & LIVE CANVAS MOCKUP ── */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 border-b border-border/40">
        
        {/* Subtle Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] bg-gradient-to-tr from-primary/20 via-accent/15 to-transparent rounded-full blur-[140px] pointer-events-none opacity-60" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container-page relative z-10 flex flex-col items-center text-center">
          
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs md:text-sm font-semibold mb-8 backdrop-blur-md shadow-xs animate-in fade-in slide-in-from-bottom-3 duration-700">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>Budget 2024–26 Tax Slabs & ITR Schema Live</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-5xl leading-[1.1] mb-6 text-foreground">
            The Autonomous <span className="bg-gradient-to-r from-primary via-indigo-500 to-accent bg-clip-text text-transparent">Wealth Intelligence</span> & Tax Filing Platform
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mb-10 leading-relaxed">
            Transform messy bank statements into real-time net-worth clarity, behavioral ML cohorts, and zero-error ITR filing with India's most advanced AI Virtual Chartered Accountant.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto">
            <Link href="/auth/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/calculators" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto h-13 px-8 text-base font-semibold rounded-2xl bg-card/60 backdrop-blur-xl border-border/80 hover:bg-secondary transition-all">
                <Calculator className="w-4 h-4 mr-2 text-primary" /> Try 30+ Free Tools
              </Button>
            </Link>
          </div>

          {/* ── Interactive Wealth Canvas Mockup ── */}
          <div className="w-full max-w-5xl rounded-[2rem] p-2 bg-gradient-to-b from-border/80 via-border/30 to-transparent shadow-2xl backdrop-blur-2xl">
            <div className="rounded-[1.75rem] bg-card/90 border border-border/60 p-6 md:p-8 overflow-hidden">
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 border-b border-border/50 gap-4">
                <div className="text-left">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Consolidated Live Net Worth</span>
                  <div className="flex items-baseline gap-3 mt-1">
                    <span className="text-3xl md:text-5xl font-extrabold text-foreground tracking-tight font-mono">₹48,92,450</span>
                    <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                      +18.4% YoY
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary border border-border text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    3 Banks Synchronized
                  </div>
                </div>
              </div>

              {/* Grid Demo Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-left">
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Monthly Inflow</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-foreground">₹2,85,000</p>
                  <p className="text-[11px] text-emerald-500 mt-1">Salary + Freelance (44ADA)</p>
                </div>
                
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Tax Saved This Year</span>
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-primary">₹78,400</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Via Optimized Chapter VI-A</p>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Virtual CA Health Status</span>
                    <Sparkles className="w-4 h-4 text-accent" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-foreground">940 / 1000</p>
                  <p className="text-[11px] text-emerald-500 mt-1">Ready for ITR-1 E-Filing</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ── 2. SUPPORTED BANKS MARQUEE & SECURITY BADGES ── */}
      <section className="py-12 border-b border-border/40 bg-card/20 overflow-hidden">
        <div className="container-page">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6">
            Trusted Ingestion Engine Compatible With 21+ Leading Indian Banks
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 opacity-75">
            {banks.map((bank) => (
              <span key={bank} className="px-4 py-2 rounded-xl bg-card border border-border/60 text-xs font-semibold text-foreground shadow-xs">
                {bank}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. INTERACTIVE LIVE TAX SAVINGS CALCULATOR (INSTANT ENGAGEMENT) ── */}
      <section className="py-20 md:py-28 border-b border-border/40 relative">
        <div className="container-page max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Calculator className="w-4 h-4" /> Live Tax Simulator
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              See How Much You Save in Under 10 Seconds
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-2xl mx-auto">
              Simulate your annual income and immediately compare Old vs. New Tax Regimes under the latest Indian budget rules.
            </p>
          </div>

          <Card className="p-6 md:p-10 rounded-[2rem] border-border/80 bg-card/60 backdrop-blur-2xl shadow-xl">
            <div className="space-y-6">
              
              <div>
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-foreground">Your Annual Gross Income</label>
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
                  className="w-full h-2.5 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground mt-2">
                  <span>₹4 Lakhs</span>
                  <span>₹20 Lakhs</span>
                  <span>₹40 Lakhs</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
                <div className="p-5 rounded-2xl bg-secondary/40 border border-border/60">
                  <span className="text-xs text-muted-foreground font-medium">Old Regime Tax</span>
                  <p className="text-2xl font-bold font-mono text-foreground mt-1">₹{Math.round(oldRegimeTax * 1.04).toLocaleString("en-IN")}</p>
                  <span className="text-[10px] text-muted-foreground">Standard ₹50k deduction</span>
                </div>

                <div className="p-5 rounded-2xl bg-secondary/40 border border-border/60">
                  <span className="text-xs text-muted-foreground font-medium">New Regime Tax</span>
                  <p className="text-2xl font-bold font-mono text-foreground mt-1">₹{Math.round(newRegimeTax * 1.04).toLocaleString("en-IN")}</p>
                  <span className="text-[10px] text-emerald-500">Standard ₹75k + Rebate 87A</span>
                </div>

                <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30">
                  <span className="text-xs text-primary font-bold">Optimal Regime Savings</span>
                  <p className="text-2xl font-bold font-mono text-primary mt-1">₹{Math.round(taxSavings * 1.04).toLocaleString("en-IN")}</p>
                  <span className="text-[10px] text-primary/80">Calculated automatically</span>
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <Link href="/auth/signup">
                  <Button className="rounded-xl px-8 font-bold h-12">
                    Claim Your Full Tax Optimization Report <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>

            </div>
          </Card>
        </div>
      </section>

      {/* ── 4. FOUR CORE PILLARS SHOWCASE (INTERACTIVE TABS) ── */}
      <section className="py-20 md:py-32 border-b border-border/40 bg-gradient-to-b from-transparent via-card/20 to-transparent">
        <div className="container-page">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Engineered with Institutional-Grade Architecture
            </h2>
            <p className="text-muted-foreground text-sm md:text-base mt-3 max-w-2xl mx-auto">
              Every layer of FinFlow is designed for extreme precision, bank-grade encryption, and zero-hallucination compliance.
            </p>
          </div>

          {/* Feature Selector Buttons */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-12">
            {featureTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeFeatureTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFeatureTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
                      : "bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Active Tab Card */}
          {(() => {
            const currentTab = featureTabs.find((t) => t.id === activeFeatureTab)!
            const Icon = currentTab.icon
            return (
              <Card className="p-8 md:p-12 rounded-[2.5rem] border-border/80 bg-card/60 backdrop-blur-2xl max-w-4xl mx-auto shadow-2xl animate-in fade-in zoom-in-95 duration-400">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{currentTab.title}</h3>
                <p className="text-muted-foreground text-base leading-relaxed mb-8">{currentTab.description}</p>
                <div className="flex flex-wrap gap-2">
                  {currentTab.badges.map((b) => (
                    <span key={b} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary/80 border border-border text-xs font-semibold text-foreground">
                      <CheckCircle className="w-3.5 h-3.5 text-primary" /> {b}
                    </span>
                  ))}
                </div>
              </Card>
            )
          })()}

        </div>
      </section>

      {/* ── 5. RESPONSIVE MULTI-DEVICE PARITY (WEB + TABLET + NATIVE MOBILE APP) ── */}
      <section className="py-20 md:py-28 border-b border-border/40">
        <div className="container-page">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                <Smartphone className="w-4 h-4" /> Native Multi-Device Ecosystem
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
                Flawless Experience Across Desktop, Tablet & Native Mobile App
              </h2>
              <p className="text-muted-foreground text-base leading-relaxed mb-8">
                Whether analyzing your portfolio on ultra-wide desktop monitors or uploading UPI receipts on the go with our React Native Expo iOS/Android app, FinFlow synchronizes effortlessly.
              </p>

              <div className="space-y-4">
                {[
                  { title: "Mobile Tab-Bar & Touch Gestures", desc: "Native bottom sheets, haptic-ready button states, and swipeable statement lists." },
                  { title: "Command-K Quick Search", desc: "Instant desktop keyboard palette to navigate tools, tax schedules, and settings in milliseconds." },
                  { title: "Biometric & Secure Store Auth", desc: "FaceID/Fingerprint login on mobile with encrypted JWT token isolation." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0 mt-1">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="w-full max-w-sm rounded-[2.5rem] p-3 bg-gradient-to-b from-border via-card to-border shadow-2xl border border-border/80">
                <div className="rounded-[2rem] bg-card p-5 border border-border/60 text-left">
                  <div className="flex items-center justify-between pb-4 border-b border-border/40">
                    <span className="text-xs font-bold text-primary">FinFlow Mobile</span>
                    <span className="text-[10px] text-muted-foreground">iOS / Android</span>
                  </div>
                  <div className="py-6 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Quick Upload</p>
                    <p className="text-2xl font-extrabold text-foreground font-mono mt-1">Ready for Sync</p>
                    <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-semibold">
                      Statement Ingestion Complete ✓
                    </div>
                  </div>
                  <div className="h-12 rounded-xl bg-secondary/80 flex items-center justify-around px-4">
                    <span className="text-[10px] font-bold text-primary">Dashboard</span>
                    <span className="text-[10px] text-muted-foreground">Tax</span>
                    <span className="text-[10px] text-muted-foreground">AI CA</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── 6. TRANSPARENT PRICING TIERS ── */}
      <section className="py-20 md:py-28 border-b border-border/40">
        <div className="container-page max-w-5xl text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Transparent, Value-First Pricing
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-12">
            Start completely free. Upgrade only when you want automated ITR e-filing and unlimited AI CA consultations.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            
            {/* Free Tier */}
            <Card className="p-8 rounded-[2rem] border-border bg-card flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Starter</span>
                <h3 className="text-2xl font-bold text-foreground mt-1">Free Forever</h3>
                <p className="text-sm text-muted-foreground mt-2">Perfect for individual expense tracking and basic tax calculations.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold font-mono text-foreground">₹0</span>
                  <span className="text-xs text-muted-foreground"> / month</span>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Unlimited Statement Uploads</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Basic Old vs New Tax Comparison</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 30+ Universal Calculators</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 5 AI CA Messages / day</div>
                </div>
              </div>
              <Link href="/auth/signup" className="mt-8">
                <Button variant="outline" className="w-full rounded-xl font-bold h-12">
                  Get Started Free
                </Button>
              </Link>
            </Card>

            {/* Pro Tier */}
            <Card className="p-8 rounded-[2rem] border-primary/40 bg-gradient-to-b from-primary/10 via-card to-card relative flex flex-col justify-between shadow-xl">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold tracking-wider uppercase">
                Most Popular
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Chartered Pro</span>
                <h3 className="text-2xl font-bold text-foreground mt-1">FinFlow Pro & Filing</h3>
                <p className="text-sm text-muted-foreground mt-2">Comprehensive autonomous tax filing and complete financial mastery.</p>
                <div className="my-6">
                  <span className="text-4xl font-extrabold font-mono text-primary">₹499</span>
                  <span className="text-xs text-muted-foreground"> / year (Special Launch)</span>
                </div>
                <div className="space-y-3 text-sm text-foreground">
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Full ITR-1 / 2 / 4 Schema JSON Generator</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Unlimited Virtual CA Consultations</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Form 16 + AIS 3-Way Reconciliation</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Scikit-Learn ML Behavioral Cohorts</div>
                  <div className="flex items-center gap-2"><Check className="w-4 h-4 text-primary" /> Certified CA Audit Report PDF Export</div>
                </div>
              </div>
              <Link href="/auth/signup" className="mt-8">
                <Button className="w-full rounded-xl font-bold h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                  Upgrade to Pro & File ITR
                </Button>
              </Link>
            </Card>

          </div>
        </div>
      </section>

      {/* ── 7. FINAL CTA BANNER ── */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="container-page max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            Ready for Effortless Wealth Clarity & Tax Mastery?
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto mb-10">
            Join thousands of smart taxpayers and investors who manage their finances with zero manual spreadsheet work.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="h-14 px-10 rounded-2xl font-bold text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl shadow-primary/25">
              Create Your Free Account <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── 8. FOOTER ── */}
      <footer className="py-12 border-t border-border/40 bg-card/40 text-xs text-muted-foreground">
        <div className="container-page flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-xs">
              ₹
            </div>
            <span className="font-bold text-foreground">FinFlow Systems</span>
            <span>© {new Date().getFullYear()} All Rights Reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/tax" className="hover:text-foreground transition-colors">Tax Engine</Link>
            <Link href="/calculators" className="hover:text-foreground transition-colors">Calculators</Link>
            <Link href="/ai-ca" className="hover:text-foreground transition-colors">Virtual CA</Link>
            <Link href="/settings" className="hover:text-foreground transition-colors">Security & Privacy</Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
