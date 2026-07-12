"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  CheckCircle,
  Building2,
  User,
  Shield,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from "lucide-react"
import { AIWidget } from "@/components/ai-sidebar"

const BANKS = [
  "HDFC Bank",
  "ICICI Bank",
  "State Bank of India",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
  "Bank of Baroda",
  "Canara Bank",
  "IndusInd Bank",
  "Yes Bank",
  "Other",
]

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Chandigarh", "Other",
]

const STEP_CONFIG = [
  { icon: Sparkles, label: "Welcome" },
  { icon: User, label: "Profile" },
  { icon: Shield, label: "Permissions" },
  { icon: Building2, label: "Bank" },
  { icon: CheckCircle, label: "Done" },
]

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [profile, setProfile] = useState({
    dob: "",
    gender: "",
    occupation: "",
    incomeBracket: "",
    panNumber: "",
    city: "",
    state: "",
  })

  const [consents, setConsents] = useState({
    consentDataProcessing: false,
    consentMLAnalytics: false,
    consentAIAssistant: false,
    consentMarketing: false,
  })

  const [bank, setBank] = useState({
    bankName: "",
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
      setError("You must consent to data processing to use FinFlow")
      return
    }

    if (step === 4) {
      setIsLoading(true)
      try {
        // Save profile + consents
        const res = await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, ...consents }),
        })
        if (!res.ok) throw new Error("Failed to save profile")

        // Add bank if not skipping
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
          })
        }

        // Mark onboarding complete
        await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, ...consents, complete: true }),
        })
        
        await updateSession({ onboardingComplete: true })
      } catch {
        setError("Failed to save. Please try again.")
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

  const firstName = session?.user?.name?.split(" ")[0] || ""

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12">
      {/* Progress Bar */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </span>
          <span className="text-sm text-muted-foreground">{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-3">
          {STEP_CONFIG.map(({ icon: Icon, label }, idx) => (
            <div
              key={label}
              className={`flex flex-col items-center gap-1 ${idx + 1 <= step ? "text-primary" : "text-muted-foreground"}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  idx + 1 < step
                    ? "bg-primary border-primary"
                    : idx + 1 === step
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background"
                }`}
              >
                {idx + 1 < step ? (
                  <CheckCircle className="w-4 h-4 text-white" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className="text-xs hidden sm:block">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <Card className="w-full max-w-lg p-8">
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* ── Step 1: Welcome ── */}
        {step === 1 && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-4xl">₹</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text mb-2">
                Welcome to FinFlow{firstName ? `, ${firstName}!` : "!"}
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Your personal AI-powered financial dashboard. Let&apos;s set you up in about 2 minutes.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-left">
              {[
                { icon: "📊", title: "Smart Analytics", desc: "ML-powered spending insights" },
                { icon: "🤖", title: "AI Assistant", desc: "Personal CFO in your pocket" },
                { icon: "🏦", title: "Multi-Bank", desc: "Connect all your accounts" },
                { icon: "💰", title: "Tax Engine", desc: "Optimize your tax savings" },
              ].map((f) => (
                <div key={f.title} className="p-3 rounded-xl border border-border bg-muted/30">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <div className="font-semibold text-sm">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Personal Info ── */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-2xl font-bold mb-1">Personal Information</h2>
              <p className="text-muted-foreground text-sm">
                Used for personalized tax and financial advice. All fields are optional.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) => setProfile((p) => ({ ...p, dob: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Gender</label>
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile((p) => ({ ...p, gender: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Occupation</label>
              <input
                type="text"
                value={profile.occupation}
                onChange={(e) => setProfile((p) => ({ ...p, occupation: e.target.value }))}
                placeholder="e.g. Software Engineer, Business Owner, Doctor"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Annual Income Bracket</label>
              <select
                value={profile.incomeBracket}
                onChange={(e) => setProfile((p) => ({ ...p, incomeBracket: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">Select income range</option>
                <option value="below_3l">Below ₹3 Lakh</option>
                <option value="3l_5l">₹3L – ₹5L</option>
                <option value="5l_10l">₹5L – ₹10L</option>
                <option value="10l_25l">₹10L – ₹25L</option>
                <option value="above_25l">Above ₹25L</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">City</label>
                <input
                  type="text"
                  value={profile.city}
                  onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
                  placeholder="Mumbai"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">State</label>
                <select
                  value={profile.state}
                  onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                >
                  <option value="">Select state</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">
                PAN Number{" "}
                <span className="text-muted-foreground font-normal">(Optional, for tax features)</span>
              </label>
              <input
                type="text"
                value={profile.panNumber}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, panNumber: e.target.value.toUpperCase() }))
                }
                placeholder="ABCDE1234F"
                maxLength={10}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Permissions ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-2xl font-bold mb-1">Permissions & Consent</h2>
              <p className="text-muted-foreground text-sm">
                We are transparent about how we use your data. Your privacy is our priority.
              </p>
            </div>
            {[
              {
                key: "consentDataProcessing",
                title: "Process Financial Data",
                desc: "Allow FinFlow to store and process your bank statement data to generate insights.",
                required: true,
              },
              {
                key: "consentMLAnalytics",
                title: "ML-Powered Analytics",
                desc: "Enable AI clustering and pattern detection on your transactions for smarter insights.",
                required: false,
              },
              {
                key: "consentAIAssistant",
                title: "AI Financial Assistant",
                desc: "Allow the AI assistant to access your financial data to answer personalized questions.",
                required: false,
              },
              {
                key: "consentMarketing",
                title: "Product Updates",
                desc: "Receive tips, feature updates, and personalized financial advice via email.",
                required: false,
              },
            ].map(({ key, title, desc, required }) => (
              <label
                key={key}
                className="flex items-start gap-4 p-4 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={consents[key as keyof typeof consents]}
                  onChange={(e) =>
                    setConsents((c) => ({ ...c, [key]: e.target.checked }))
                  }
                  className="w-5 h-5 rounded border-border mt-0.5 shrink-0"
                />
                <div>
                  <div className="font-semibold text-sm flex items-center gap-2">
                    {title}
                    {required && (
                      <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </label>
            ))}
            <p className="text-xs text-muted-foreground text-center">
              You can change these preferences anytime in Settings → Privacy
            </p>
          </div>
        )}

        {/* ── Step 4: Bank Setup ── */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-2xl font-bold mb-1">Add Your Bank Account</h2>
              <p className="text-muted-foreground text-sm">
                You can add more accounts later. We never connect to your bank directly.
              </p>
            </div>
            {!bank.skip ? (
              <>
                <div>
                  <label className="block text-sm font-semibold mb-1">Bank Name</label>
                  <select
                    value={bank.bankName}
                    onChange={(e) => setBank((b) => ({ ...b, bankName: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  >
                    <option value="">Select your bank</option>
                    {BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Account Nickname{" "}
                    <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={bank.accountNickname}
                    onChange={(e) =>
                      setBank((b) => ({ ...b, accountNickname: e.target.value }))
                    }
                    placeholder="e.g. My Salary Account"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1">Account Type</label>
                    <select
                      value={bank.accountType}
                      onChange={(e) =>
                        setBank((b) => ({
                          ...b,
                          accountType: e.target.value as "savings" | "current" | "salary",
                        }))
                      }
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    >
                      <option value="savings">Savings</option>
                      <option value="salary">Salary</option>
                      <option value="current">Current</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1">
                      Last 4 digits{" "}
                      <span className="text-muted-foreground font-normal">(Optional)</span>
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
                      placeholder="XXXX"
                      maxLength={4}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-center text-sm"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBank((b) => ({ ...b, skip: true }))}
                  className="text-sm text-muted-foreground hover:text-foreground underline"
                >
                  Skip for now, I&apos;ll add a bank later
                </button>
              </>
            ) : (
              <div className="text-center py-8 space-y-3">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground text-sm">
                  You can add your bank accounts from the Dashboard at any time.
                </p>
                <button
                  type="button"
                  onClick={() => setBank((b) => ({ ...b, skip: false }))}
                  className="text-sm text-primary hover:underline"
                >
                  + Add a bank account now
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Step 5: Done ── */}
        {step === 5 && (
          <div className="text-center space-y-6 py-4">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-2">You&apos;re all set!</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your FinFlow account is ready. Upload your first bank statement to unlock all features.
              </p>
            </div>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-left space-y-2">
              <p className="text-sm font-semibold">Next steps:</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Account created & verified
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  Profile set up
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <ChevronRight className="w-4 h-4 shrink-0" />
                  Upload your first bank statement
                </div>
                <div className="flex items-center gap-2 opacity-50">
                  <ChevronRight className="w-4 h-4 shrink-0" />
                  View AI-powered insights
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={() => router.push("/")}>
              Go to Dashboard →
            </Button>
          </div>
        )}

        {/* ── Navigation ── */}
        {step < 5 && (
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={handleNext} disabled={isLoading} className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <span className="animate-spin">⏳</span> Saving...
                </>
              ) : step === 4 ? (
                <>
                  Complete Setup <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Continue <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
      
      {/* AI Assistant Widget - Onboarding context */}
      <AIWidget pageContext="/onboarding" defaultOpen={false}
        contextTypes={["profile", "summary"]}
        maxTokens={1000}
      />
    </div>
  )
}
