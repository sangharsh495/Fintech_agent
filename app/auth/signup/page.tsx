"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, ShieldCheck } from "lucide-react"

type Step = "form" | "otp"

export default function SignupPage() {
  const [step, setStep] = useState<Step>("form")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [otp, setOtp] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [agreed, setAgreed] = useState(false)
  const router = useRouter()

  const passwordStrength = {
    length: formData.password.length >= 8,
    uppercase: /[A-Z]/.test(formData.password),
    number: /[0-9]/.test(formData.password),
    special: /[!@#$%^&*]/.test(formData.password),
  }

  const isPasswordStrong = Object.values(passwordStrength).filter(Boolean).length >= 3

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields")
      return
    }

    if (!isPasswordStrong) {
      setError("Password is not strong enough")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!agreed) {
      setError("You must agree to the terms and conditions")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed")
        setIsLoading(false)
        return
      }

      // Move to OTP step
      setStep("otp")
      setIsLoading(false)
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (otp.length !== 6) {
      setError("Please enter the 6-digit code")
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid OTP")
        setIsLoading(false)
        return
      }

      // Auto sign in after verification
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })

      if (result?.error) {
        setError("Verification successful but login failed. Please sign in manually.")
        router.push("/auth/login")
        return
      }

      // Redirect to onboarding
      router.push("/onboarding")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsResending(true)
    setError("")
    try {
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      })
    } catch {
      // Silent fail — don't confuse user
    }
    setIsResending(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // ── OTP Step ──────────────────────────────────────────────
  if (step === "otp") {
    return (
      <Card className="w-full max-w-md p-8 card-hover">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Verify Email</h1>
          <p className="text-muted-foreground text-sm">
            We sent a 6-digit code to{" "}
            <span className="font-semibold text-foreground">{formData.email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-center">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="w-full text-center text-3xl font-mono tracking-[0.5em] py-4 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 6}>
            {isLoading ? (
              <>
                <span className="animate-spin inline-block mr-2">⏳</span>
                Verifying...
              </>
            ) : (
              "Verify & Continue"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Didn&apos;t receive it?{" "}
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={isResending}
              className="text-primary hover:underline font-semibold disabled:opacity-50"
            >
              {isResending ? "Sending..." : "Resend OTP"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep("form")}
            className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Change email address
          </button>
        </form>
      </Card>
    )
  }

  // ── Signup Step ───────────────────────────────────────────
  return (
    <Card className="w-full max-w-md p-8 card-hover">
      {/* Logo & Title */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">₹</span>
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Get Started</h1>
        <p className="text-muted-foreground text-sm">Create your FinFlow account in seconds</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Signup Form */}
      <form onSubmit={handleSignup} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-semibold mb-2">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Arjun Sharma"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-semibold mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-semibold mb-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Password Strength */}
          <div className="mt-3 space-y-1.5">
            {[
              { key: "length", label: "At least 8 characters", ok: passwordStrength.length },
              { key: "uppercase", label: "Uppercase letter", ok: passwordStrength.uppercase },
              { key: "number", label: "Number", ok: passwordStrength.number },
              { key: "special", label: "Special character (!@#$)", ok: passwordStrength.special },
            ].map((item) => (
              <div key={item.key} className="flex items-center gap-2 text-xs">
                {item.ok ? (
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-border shrink-0" />
                )}
                <span className={item.ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-semibold mb-2">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-border bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="text-xs text-destructive mt-1">Passwords do not match</p>
          )}
          {formData.confirmPassword && formData.password === formData.confirmPassword && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">Passwords match ✓</p>
          )}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2 text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 rounded border-border mt-0.5"
          />
          <span className="text-muted-foreground">
            I agree to the{" "}
            <Link href="#" className="text-primary hover:underline">Terms of Service</Link>{" "}
            and{" "}
            <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
          </span>
        </label>

        <Button type="submit" className="w-full" disabled={isLoading || !isPasswordStrong || !agreed}>
          {isLoading ? (
            <>
              <span className="animate-spin inline-block mr-2">⏳</span>
              Creating account...
            </>
          ) : (
            "Create Account →"
          )}
        </Button>
      </form>

      <div className="mt-6 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground text-center">
        Your account is protected with encryption. No data is shared with third parties.
      </div>

      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  )
}
