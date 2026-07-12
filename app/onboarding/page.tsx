"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Building2, CheckCircle, ChevronLeft, ChevronRight, Shield, Sparkles, User } from "lucide-react"

import { AIWidget } from "@/components/ai-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const steps = [
  { label: "Welcome", icon: Sparkles },
  { label: "Profile", icon: User },
  { label: "Consent", icon: Shield },
  { label: "Bank", icon: Building2 },
  { label: "Done", icon: CheckCircle },
]

export default function OnboardingPage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [profile, setProfile] = useState({ dob: "", occupation: "", incomeBracket: "", city: "", state: "", panNumber: "" })
  const [consents, setConsents] = useState({ consentDataProcessing: false, consentMLAnalytics: false, consentAIAssistant: false, consentMarketing: false })
  const [bank, setBank] = useState({ bankName: "", accountNickname: "", accountLast4: "", accountType: "savings", skip: false })

  const progress = ((step - 1) / (steps.length - 1)) * 100

  const handleNext = async () => {
    setError("")
    if (step === 3 && !consents.consentDataProcessing) {
      setError("Data processing consent is required to use FinFlow.")
      return
    }
    if (step === 4) {
      setIsLoading(true)
      try {
        await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, ...consents }),
        })
        if (!bank.skip && bank.bankName) {
          await fetch("/api/banks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bank),
          })
        }
        await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, ...consents, complete: true }),
        })
        await updateSession({ onboardingComplete: true })
      } catch {
        setError("Failed to save onboarding details. Please try again.")
        setIsLoading(false)
        return
      }
      setIsLoading(false)
    }
    setStep((value) => Math.min(value + 1, steps.length))
  }

  return (
    <div className="min-h-screen bg-background px-[var(--container-padding-mobile)] py-[var(--section-spacing-desktop)]">
      <main className="mx-auto w-full max-w-[var(--content-max-md)]">
        <section className="mb-[var(--card-padding-xl)]">
          <div className="mb-3 flex justify-between app-body-sm app-muted">
            <span>Step {step} of {steps.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div className="mb-6 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-[width] duration-[var(--duration-slow)]" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex items-start justify-between">
            {steps.map(({ label, icon: Icon }, index) => {
              const active = index + 1 <= step
              return (
                <div key={label} className="flex flex-col items-center gap-2 text-center">
                  <div className={`flex size-10 items-center justify-center rounded-full border ${active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}>
                    <Icon className="size-[var(--icon-sm)]" />
                  </div>
                  <span className="hidden app-body-sm app-muted sm:block">{label}</span>
                </div>
              )
            })}
          </div>
        </section>

        <Card>
          <CardContent className="p-[var(--card-padding-xl)]">
            {error && <div className="mb-4 rounded-[var(--radius-md)] border border-destructive bg-destructive/10 p-3 app-body-sm text-destructive">{error}</div>}

            {step === 1 && (
              <div className="text-center">
                <Sparkles className="mx-auto mb-4 size-[var(--icon-3xl)] text-primary" />
                <h1 className="app-heading-1">Welcome to FinFlow{session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}</h1>
                <p className="app-body-lg app-muted mx-auto mt-3 max-w-[var(--content-max-sm)]">Set up your profile, consent preferences, and first bank label.</p>
              </div>
            )}

            {step === 2 && (
              <div>
                <h1 className="app-heading-2 mb-2">Profile</h1>
                <p className="app-body-md app-muted mb-6">Used for tax and financial personalization.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["dob", "Date of birth", "date"],
                    ["occupation", "Occupation", "text"],
                    ["incomeBracket", "Income bracket", "text"],
                    ["city", "City", "text"],
                    ["state", "State", "text"],
                    ["panNumber", "PAN", "text"],
                  ].map(([key, label, type]) => (
                    <label key={key} className="app-body-sm font-medium">
                      {label}
                      <Input className="mt-1" type={type} value={(profile as any)[key]} onChange={(event) => setProfile((prev) => ({ ...prev, [key]: event.target.value }))} />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h1 className="app-heading-2 mb-2">Permissions</h1>
                <p className="app-body-md app-muted mb-6">Choose how FinFlow can use your data.</p>
                <div className="space-y-3">
                  {Object.entries(consents).map(([key, value]) => (
                    <label key={key} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border p-4">
                      <input className="mt-1 size-[var(--icon-md)]" type="checkbox" checked={value} onChange={(event) => setConsents((prev) => ({ ...prev, [key]: event.target.checked }))} />
                      <span>
                        <span className="app-body-md block font-medium">{key.replace("consent", "").replace(/([A-Z])/g, " $1").trim()}</span>
                        <span className="app-body-sm app-muted">Enable this permission for personalized workflows.</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h1 className="app-heading-2 mb-2">Bank label</h1>
                <p className="app-body-md app-muted mb-6">No bank login is required. This helps organize statements.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input placeholder="Bank name" value={bank.bankName} onChange={(event) => setBank((prev) => ({ ...prev, bankName: event.target.value }))} />
                  <Input placeholder="Account nickname" value={bank.accountNickname} onChange={(event) => setBank((prev) => ({ ...prev, accountNickname: event.target.value }))} />
                  <Input placeholder="Last 4 digits" value={bank.accountLast4} onChange={(event) => setBank((prev) => ({ ...prev, accountLast4: event.target.value.slice(0, 4) }))} />
                  <Input placeholder="Account type" value={bank.accountType} onChange={(event) => setBank((prev) => ({ ...prev, accountType: event.target.value }))} />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="text-center">
                <CheckCircle className="mx-auto mb-4 size-[var(--icon-3xl)] text-primary" />
                <h1 className="app-heading-2">You are ready</h1>
                <p className="app-body-lg app-muted mt-2">Upload a statement to start building your dashboard.</p>
                <Button className="mt-8" size="lg" onClick={() => router.push("/")}>Go to Dashboard</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {step < 5 && (
          <div className="mt-[var(--card-padding-xl)] flex justify-between gap-4">
            <Button variant="outline" onClick={() => setStep((value) => Math.max(value - 1, 1))} disabled={step === 1 || isLoading}>
              <ChevronLeft className="size-[var(--icon-sm)]" />
              Previous
            </Button>
            <Button onClick={handleNext} disabled={isLoading}>
              {isLoading ? "Saving..." : "Next"}
              <ChevronRight className="size-[var(--icon-sm)]" />
            </Button>
          </div>
        )}
      </main>
      <AIWidget pageContext="/onboarding" defaultOpen={false} />
    </div>
  )
}
