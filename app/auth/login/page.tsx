"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Mail, Lock, ShieldAlert, CheckCircle2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotOtp, setForgotOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [forgotStep, setForgotStep] = useState<"email" | "otp" | "success">("email")
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotError, setForgotError] = useState("")

  // Unverified account verification modal
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verifyEmail, setVerifyEmail] = useState("")
  const [verifyOtp, setVerifyOtp] = useState("")
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyError, setVerifyError] = useState("")
  const [verifySuccess, setVerifySuccess] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [needsVerification, setNeedsVerification] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) return
    setForgotLoading(true)
    setForgotError("")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send reset code")
      setForgotStep("otp")
    } catch (err: any) {
      setForgotError(err.message || "Failed to send reset code")
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail || !forgotOtp || !newPassword) return
    setForgotLoading(true)
    setForgotError("")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          otp: forgotOtp.trim(),
          newPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to reset password")
      setForgotStep("success")
    } catch (err: any) {
      setForgotError(err.message || "Failed to reset password")
    } finally {
      setForgotLoading(false)
    }
  }

  const handleDirectVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!verifyEmail || !verifyOtp) return
    setVerifyLoading(true)
    setVerifyError("")
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: verifyEmail.trim().toLowerCase(),
          otp: verifyOtp.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Invalid verification code")
      setVerifySuccess(true)
    } catch (err: any) {
      setVerifyError(err.message || "Failed to verify email")
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleResendVerificationCode = async () => {
    if (!verifyEmail) return
    setVerifyLoading(true)
    setVerifyError("")
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to resend code")
      setVerifyError("A new verification code has been dispatched to your email.")
    } catch (err: any) {
      setVerifyError(err.message || "Failed to resend code")
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setNeedsVerification(false)
    setIsLoading(true)

    const cleanEmail = email.trim().toLowerCase()

    if (!cleanEmail || !password) {
      setError("Please fill in all fields")
      setIsLoading(false)
      return
    }

    try {
      const result = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (
          result.error === "EMAIL_NOT_VERIFIED" ||
          (result as any).code === "EMAIL_NOT_VERIFIED" ||
          result.error?.includes("EMAIL_NOT_VERIFIED")
        ) {
          setError("Your email is not verified yet. Please enter your verification code.")
          setNeedsVerification(true)
          setVerifyEmail(cleanEmail)
        } else if (result.error === "CredentialsSignin" || result.error === "Configuration") {
          setError("Invalid email or password. Please check your credentials.")
        } else {
          setError("Invalid email or password")
        }
        setIsLoading(false)
        return
      }

      // Success — redirect
      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md p-8 card-hover">
      {/* Logo & Title */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">₹</span>
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-2">Welcome Back</h1>
        <p className="text-muted-foreground text-sm">Sign in to your FinFlow account</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm space-y-2">
          <div>{error}</div>
          {needsVerification && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full mt-2 text-xs border-destructive/30 hover:bg-destructive/10"
              onClick={() => {
                setShowVerifyModal(true)
                handleResendVerificationCode()
              }}
            >
              Verify Email with OTP →
            </Button>
          )}
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-semibold mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        </div>

        {/* Remember Me & Forgot */}
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border"
            />
            <span className="text-muted-foreground">Remember me</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setForgotEmail(email.trim())
              setShowForgotModal(true)
            }}
            className="text-primary hover:underline font-medium text-xs sm:text-sm"
          >
            Forgot password?
          </button>
        </div>

        {/* Login Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="animate-spin inline-block mr-2">⏳</span>
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">OR</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* Security Message */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground text-center">
        Your data is encrypted & secure. Protected by institutional-grade authentication protocols.
      </div>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{" "}
        <Link href="/auth/signup" className="text-primary font-semibold hover:underline">
          Sign up
        </Link>
      </p>

      {/* Verification Modal for unverified accounts */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Verify Your Email</h3>
            </div>

            {verifyError && (
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs">
                {verifyError}
              </div>
            )}

            {!verifySuccess ? (
              <form onSubmit={handleDirectVerify} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code dispatched to <strong className="text-foreground">{verifyEmail}</strong>.
                </p>
                <div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verifyOtp}
                    onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-3 py-2 text-base rounded-lg border border-border bg-background text-foreground font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleResendVerificationCode}
                    disabled={verifyLoading}
                    className="text-primary hover:underline font-medium"
                  >
                    Resend Code
                  </button>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowVerifyModal(false)
                      setVerifyError("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={verifyLoading || verifyOtp.length !== 6}>
                    {verifyLoading ? "Verifying..." : "Verify Code"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Your email has been verified successfully! You can now sign in with your password.
                </div>
                <Button
                  type="button"
                  className="w-full"
                  size="sm"
                  onClick={() => {
                    setShowVerifyModal(false)
                    setError("")
                    setNeedsVerification(false)
                  }}
                >
                  Continue to Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Reset Password</h3>

            {forgotError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {forgotError}
              </div>
            )}

            {forgotStep === "email" && (
              <form onSubmit={handleRequestOtp} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Enter your registered email address. We will send a 6-digit verification code.
                </p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowForgotModal(false)
                      setForgotStep("email")
                      setForgotError("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={forgotLoading}>
                    {forgotLoading ? "Sending..." : "Send OTP"}
                  </Button>
                </div>
              </form>
            )}

            {forgotStep === "otp" && (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code sent to <strong className="text-foreground">{forgotEmail}</strong> and your new password.
                </p>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">Verification Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-muted-foreground">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForgotStep("email")}
                  >
                    Back
                  </Button>
                  <Button type="submit" size="sm" disabled={forgotLoading}>
                    {forgotLoading ? "Updating..." : "Set New Password"}
                  </Button>
                </div>
              </form>
            )}

            {forgotStep === "success" && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs">
                  Your password has been reset successfully! You can now log in with your new credentials.
                </div>
                <Button
                  type="button"
                  className="w-full"
                  size="sm"
                  onClick={() => {
                    setShowForgotModal(false)
                    setForgotStep("email")
                    setForgotError("")
                  }}
                >
                  Back to Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
