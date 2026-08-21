"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  CheckCircle2,
  Building2,
  User,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Lock,
  Zap,
  TrendingUp,
  Brain,
  Layers,
  ArrowRight,
  Shield,
} from "lucide-react"
import { AIWidget } from "@/components/ai-sidebar"

const POPULAR_BANKS = [
  { name: "HDFC Bank", short: "HDFC", color: "from-blue-600 to-blue-800" },
  { name: "ICICI Bank", short: "ICICI", color: "from-orange-600 to-amber-700" },
  { name: "State Bank of India", short: "SBI", color: "from-sky-600 to-blue-700" },
  { name: "Axis Bank", short: "Axis", color: "from-rose-600 to-pink-800" },
  { name: "Kotak Mahindra Bank", short: "Kotak", color: "from-red-600 to-red-800" },
  { name: "Bank of Baroda", short: "BOB", color: "from-amber-600 to-orange-700" },
  { name: "Punjab National Bank", short: "PNB", color: "from-yellow-600 to-amber-800" },
  { name: "IndusInd Bank", short: "IndusInd", color: "from-red-700 to-rose-900" },
]

const ALL_BANKS = [
  ...POPULAR_BANKS.map((b) => b.name),
  "Canara Bank",
  "Union Bank of India",
  "IDFC FIRST Bank",
  "Federal Bank",
  "Yes Bank",
  "RBL Bank",
  "Zerodha / Broking Account",
  "Groww",
  "Other Bank / Institution",
]

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Other",
]

const INCOME_TIERS = [
  { id: "below_3l", label: "Below ₹3 Lakhs", sub: "Rebate Tier • Zero Tax Liability", badge: "0% Slab" },
  { id: "3l_5l", label: "₹3L – ₹5L", sub: "Emerging Wealth • Standard Deductions", badge: "5% Slab" },
  { id: "5l_10l", label: "₹5L – ₹10L", sub: "Growth Tier • 80C/80D Maximization", badge: "10-15% Slab" },
  { id: "10l_25l", label: "₹10L – ₹25L", sub: "High Earner • HRA & NPS Optimization", badge: "20-30% Slab" },
  { id: "above_25l", label: "Above ₹25 Lakhs", sub: "HNI Wealth • Institutional Surcharge Strategy", badge: "30% + Surcharge" },
]

const STEP_CONFIG = [
  { icon: Sparkles, label: "Welcome", title: "Autonomous Wealth Setup" },
  { icon: User, label: "Profile", title: "Tax & Financial Persona" },
  { icon: ShieldCheck, label: "Safeguards", title: "DPDP Privacy & Consent" },
  { icon: Building2, label: "Accounts", title: "Connect Vault Accounts" },
  { icon: CheckCircle2, label: "Activate", title: "Activation Ready" },
]

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [profile, setProfile] = useState({
    dob: "",
    gender: "prefer_not_to_say",
    occupation: "",
    incomeBracket: "5l_10l",
    panNumber: "",
    city: "",
    state: "Maharashtra",
  })

  const [consents, setConsents] = useState({
    consentDataProcessing: true,
    consentMLAnalytics: true,
    consentAIAssistant: true,
    consentMarketing: false,
  })

  const [bank, setBank] = useState({
    bankName: "HDFC Bank",
    accountNickname: "",
    accountLast4: "",
    accountType: "savings" as "savings" | "current" | "salary",
    skip: false,
  })

  const TOTAL_STEPS = 5
  const progress = ((step - 1) / (TOTAL_STEPS - 1)) * 100

  const handleNext = async () => {
    setError("")

    if (step === 3 && !consents.consentDataProcessing) {
      setError("Consent to data processing is required to analyze bank statements securely.")
      return
    }

    if (step === 4) {
      setIsLoading(true)
      try {
        // Save profile and consents
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, ...consents, complete: true }),
        })
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}))
          throw new Error(errData.error || "Failed to save profile")
        }

        // Add primary bank account if not skipping
        if (!bank.skip && bank.bankName) {
          await fetch("/api/banks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              bankName: bank.bankName,
              accountNickname: bank.accountNickname || bank.bankName,
              accountLast4: bank.accountLast4 || undefined,
              accountType: bank.accountType,
            }),
          }).catch(() => {})
        }

        await updateSession({ onboardingComplete: true })
      } catch (err: any) {
        setError(err.message || "Failed to save onboarding settings. Please try again.")
        setIsLoading(false)
        return
      }
      setIsLoading(false)
    }

    setStep((s) => Math.min(s + 1, TOTAL_STEPS))
  }

  const handleBack = () => {
    setError("")
    setStep((s) => Math.max(s - 1, 1))
  }

  const handleFinish = async () => {
    setIsLoading(true)
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, ...consents, complete: true }),
      })
      await updateSession({ onboardingComplete: true })
    } catch {}
    window.location.href = "/"
  }

  const firstName = session?.user?.name?.split(" ")[0] || ""

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 py-12 bg-background overflow-hidden selection:bg-primary/20">
      
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />

      {/* ── Top Header / Stepper ── */}
      <div className="w-full max-w-3xl lg:max-w-4xl mb-8 relative z-10">
        
        {/* Brand Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-indigo-600 to-accent flex items-center justify-center shadow-lg shadow-primary/25 border border-white/10">
              <span className="text-white font-black text-xl">₹</span>
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-foreground">FinFlow</span>
              <span className="text-[10px] block font-mono font-semibold uppercase text-primary tracking-widest">
                Executive Setup
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/80 border border-border text-xs font-mono font-bold text-foreground shadow-xs">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>256-bit Encrypted Setup</span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card/80 border border-border/80 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3 text-xs sm:text-sm">
            <span className="font-bold text-foreground flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center text-[11px] font-mono">
                {step}
              </span>
              <span>Step {step} of {TOTAL_STEPS}: <span className="text-primary font-semibold">{STEP_CONFIG[step - 1]?.title}</span></span>
            </span>
            <span className="font-mono font-bold text-primary">{Math.round(progress)}%</span>
          </div>

          <div className="h-2.5 bg-secondary rounded-full overflow-hidden border border-border/60">
            <div
              className="h-full bg-gradient-to-r from-primary via-indigo-500 to-accent transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Stepper Node Icons */}
          <div className="grid grid-cols-5 gap-2 mt-4">
            {STEP_CONFIG.map(({ icon: Icon, label }, idx) => {
              const isDone = idx + 1 < step
              const isCurrent = idx + 1 === step
              return (
                <div
                  key={label}
                  className={`flex flex-col items-center gap-1.5 transition-all ${
                    isCurrent ? "text-primary font-bold" : isDone ? "text-foreground font-medium" : "text-muted-foreground opacity-60"
                  }`}
                >
                  <div
                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border transition-all ${
                      isDone
                        ? "bg-primary border-primary text-primary-foreground shadow-sm shadow-primary/20"
                        : isCurrent
                        ? "border-primary bg-primary/10 text-primary scale-105 ring-2 ring-primary/20 shadow-md"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className="text-[11px] tracking-tight hidden sm:block">{label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main Onboarding Card Container ── */}
      <Card className="w-full max-w-3xl lg:max-w-4xl p-6 sm:p-10 rounded-3xl border-border/80 bg-card/95 shadow-2xl backdrop-blur-2xl relative z-10 transition-all">
        
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="w-2.5 h-2.5 rounded-full bg-destructive animate-ping shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ════════ STEP 1: WELCOME & PLATFORM PILLARS ════════ */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Institutional-Grade Wealth Management
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                Welcome to FinFlow{firstName ? `, ${firstName}` : ""}
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Your autonomous financial cockpit is ready. Let&apos;s personalize your wealth intelligence, tax deductions, and bank vaults in under 2 minutes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: Brain,
                  title: "ML Spending Clusters",
                  desc: "Scikit-Learn DBSCAN engine detects anomalies & hidden recurring leaks.",
                  accent: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
                },
                {
                  icon: Shield,
                  title: "Virtual CA Copilot",
                  desc: "Instant answers cited directly under Income Tax Act 1961 statutory sections.",
                  accent: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
                },
                {
                  icon: Layers,
                  title: "21+ Multi-Bank Parsing",
                  desc: "Client-side PDF decryption with zero raw storage and AES-256 data vaults.",
                  accent: "text-blue-500 bg-blue-500/10 border-blue-500/20",
                },
                {
                  icon: TrendingUp,
                  title: "Old vs New Tax Engine",
                  desc: "Budget 2024–26 regime comparison to legally maximize 80C/80D/44ADA.",
                  accent: "text-amber-500 bg-amber-500/10 border-amber-500/20",
                },
              ].map((feat) => (
                <div
                  key={feat.title}
                  className="p-5 rounded-2xl border border-border/70 bg-secondary/30 hover:bg-secondary/60 transition-all flex items-start gap-4"
                >
                  <div className={`p-3 rounded-xl border ${feat.accent} shrink-0`}>
                    <feat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{feat.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════ STEP 2: PROFILE & INCOME TIERS ════════ */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 2 of 5</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                Personal Profile &amp; Tax Bracket
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Used to tailor regime optimizations and statutory tax deductions.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) => setProfile((p) => ({ ...p, dob: e.target.value }))}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Gender / Category</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value as any }))}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs font-medium"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Primary Occupation</label>
                <input
                  type="text"
                  value={profile.occupation}
                  onChange={(e) => setProfile((p) => ({ ...p, occupation: e.target.value }))}
                  placeholder="e.g. Software Engineer, Business Owner, Consultant"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  PAN Number <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={profile.panNumber}
                  onChange={(e) => setProfile((p) => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-xs uppercase"
                />
              </div>
            </div>

            {/* Income Bracket Visual Selectors */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-2">Annual Income Range</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {INCOME_TIERS.map((tier) => {
                  const isSelected = profile.incomeBracket === tier.id
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setProfile((p) => ({ ...p, incomeBracket: tier.id as any }))}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-sm"
                          : "border-border/80 bg-secondary/20 hover:bg-secondary/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground">{tier.label}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                          isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        }`}>
                          {tier.badge}
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground mt-1.5">{tier.sub}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  placeholder="e.g. Mumbai, Bengaluru, Delhi NCR"
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">State / UT</label>
                <select
                  value={profile.state}
                  onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))}
                  className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs font-medium"
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ════════ STEP 3: PERMISSIONS & DPDP ACT COMPLIANCE ════════ */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 3 of 5</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                Data Sovereignty &amp; Consent
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Compliant with the Digital Personal Data Protection (DPDP) Act 2023. You retain 100% control.
              </p>
            </div>

            <div className="space-y-3">
              {[
                {
                  key: "consentDataProcessing",
                  title: "Financial Vault Ingestion & Storage",
                  desc: "Authorize encrypted storage of bank statements to compute net worth and track cash flow.",
                  required: true,
                },
                {
                  key: "consentMLAnalytics",
                  title: "Scikit-Learn ML Behavioral Analytics",
                  desc: "Enable local DBSCAN unsupervised clustering to group spending cohorts and flag leaks.",
                  required: false,
                },
                {
                  key: "consentAIAssistant",
                  title: "AI Virtual CA Copilot Access",
                  desc: "Allow Gemini AI to reference your sanitized transaction summaries to provide tax answers.",
                  required: false,
                },
                {
                  key: "consentMarketing",
                  title: "Quarterly Tax & Advance Tax Briefings",
                  desc: "Receive proactive advance tax reminders before June 15, Sept 15, Dec 15, and March 15.",
                  required: false,
                },
              ].map(({ key, title, desc, required }) => {
                const isChecked = consents[key as keyof typeof consents]
                return (
                  <label
                    key={key}
                    className={`flex items-start gap-4 p-4 sm:p-5 rounded-2xl border cursor-pointer transition-all ${
                      isChecked
                        ? "border-primary/40 bg-primary/5 shadow-xs"
                        : "border-border/70 bg-secondary/20 hover:bg-secondary/40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => setConsents((c) => ({ ...c, [key]: e.target.checked }))}
                      className="w-5 h-5 rounded-md text-primary accent-primary mt-0.5 shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-foreground">{title}</span>
                        {required ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            Optional
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* ════════ STEP 4: PRIMARY BANK CONNECTION ════════ */}
        {step === 4 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 4 of 5</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
                  Connect Your Primary Bank
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Select your primary institution. You can add more bank accounts anytime.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setBank((b) => ({ ...b, skip: !b.skip }))}
                className="text-xs font-bold text-primary hover:underline px-3 py-1.5 rounded-lg bg-primary/10"
              >
                {bank.skip ? "Add bank now" : "Skip for now"}
              </button>
            </div>

            {!bank.skip ? (
              <div className="space-y-5">
                {/* 1-Click Popular Banks Grid */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-2.5">Quick Select Popular Banks</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {POPULAR_BANKS.map((item) => {
                      const isSelected = bank.bankName === item.name
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setBank((b) => ({ ...b, bankName: item.name }))}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                            isSelected
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs"
                              : "border-border bg-secondary/20 hover:bg-secondary/40"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.color} text-white font-bold text-[10px] flex items-center justify-center shrink-0`}>
                            {item.short.slice(0, 2)}
                          </div>
                          <span className="text-xs font-bold text-foreground truncate">{item.short}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">All Supported Banks</label>
                    <select
                      value={bank.bankName}
                      onChange={(e) => setBank((b) => ({ ...b, bankName: e.target.value }))}
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs font-medium"
                    >
                      {ALL_BANKS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Account Nickname <span className="text-muted-foreground font-normal">(e.g. Salary Vault)</span>
                    </label>
                    <input
                      type="text"
                      value={bank.accountNickname}
                      onChange={(e) => setBank((b) => ({ ...b, accountNickname: e.target.value }))}
                      placeholder="e.g. Primary Salary Account"
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">Account Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["savings", "salary", "current"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setBank((b) => ({ ...b, accountType: type }))}
                          className={`h-11 rounded-xl border text-xs font-bold capitalize transition-all ${
                            bank.accountType === type
                              ? "border-primary bg-primary text-primary-foreground shadow-xs"
                              : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground mb-1.5">
                      Last 4 Digits <span className="text-muted-foreground font-normal">(Optional identifier)</span>
                    </label>
                    <input
                      type="text"
                      value={bank.accountLast4}
                      onChange={(e) =>
                        setBank((b) => ({
                          ...b,
                          accountLast4: e.target.value.replace(/\D/g, "").slice(0, 4),
                        }))
                      }
                      placeholder="4921"
                      maxLength={4}
                      className="w-full h-11 px-3.5 rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-center text-xs tracking-widest"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl border border-dashed border-border text-center space-y-3">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-sm font-bold text-foreground">You can connect bank accounts later</p>
                <p className="text-xs text-muted-foreground">
                  You can upload statements from 21+ banks directly on the dashboard anytime.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ════════ STEP 5: READY & ACTIVATION ════════ */}
        {step === 5 && (
          <div className="text-center space-y-8 py-4 animate-in fade-in duration-300">
            <div className="relative w-24 h-24 mx-auto">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 animate-ping absolute inset-0" />
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center relative z-10 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-500">Setup 100% Complete</span>
              <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                Your Wealth Intelligence Cockpit is Active!
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Your financial profile, tax optimization strategy, and security vaults are fully configured.
              </p>
            </div>

            <div className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-secondary/30 text-left space-y-3 max-w-xl mx-auto">
              <span className="text-xs font-bold text-foreground">Activated Capabilities:</span>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2.5 text-foreground font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Profile &amp; Tax Persona configured</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>DPDP 2023 Data Sovereignty &amp; 256-bit encryption active</span>
                </div>
                <div className="flex items-center gap-2.5 text-foreground font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>AI Virtual CA &amp; Scikit-Learn spending clusters ready</span>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-14 text-sm font-bold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 cursor-pointer flex items-center justify-center gap-2"
              onClick={handleFinish}
              disabled={isLoading}
            >
              {isLoading ? "Launching Dashboard..." : (
                <>
                  <span>Enter FinFlow Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}

        {/* ── Navigation Bottom Bar ── */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/70">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || isLoading}
              className="h-11 px-5 rounded-xl border-border hover:bg-secondary text-xs font-bold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={isLoading}
              className="h-11 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20 cursor-pointer flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Saving...</span>
                </>
              ) : step === 4 ? (
                <>
                  <span>Complete Setup</span>
                  <Zap className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}

      </Card>

      {/* AI Assistant Widget */}
      <AIWidget pageContext="/onboarding" defaultOpen={false} contextTypes={["profile", "summary"]} maxTokens={1000} />
    </div>
  )
}
