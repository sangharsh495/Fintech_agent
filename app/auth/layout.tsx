import type React from "react"
import { BarChart3, Shield, TrendingUp } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      {/* Left side - Auth Form */}
      <div className="flex items-center justify-center p-[var(--container-padding-mobile)] md:p-[var(--section-spacing-desktop)]">
        <div className="w-full max-w-[var(--content-max-sm)] animate-in fade-in slide-in-from-bottom-4 duration-[var(--duration-slower)]">
          {children}
        </div>
      </div>

      {/* Right side - Visual Panel */}
      <div className="hidden select-none items-center justify-center bg-primary p-[var(--section-spacing-desktop)] text-primary-foreground md:flex">
        <div className="max-w-[var(--content-max-sm)] space-y-8 animate-in fade-in slide-in-from-right duration-[var(--duration-slower)]">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-[var(--radius-lg)] border border-primary-foreground/30 bg-primary-foreground/10">
              <TrendingUp className="size-[var(--icon-lg)]" />
            </div>
            <span className="app-heading-3 text-primary-foreground">FinFlow</span>
          </div>

          <div className="space-y-4">
            <h2 className="app-heading-1 text-primary-foreground">
              Smarter wealth tracking and tax optimization
            </h2>
            <p className="app-body-lg opacity-90">
              Consolidate your bank accounts, get automated ML spending categories, and optimize your taxes in one secure dashboard.
            </p>
          </div>

          {/* Mini-Features grid */}
          <div className="grid grid-cols-2 gap-6 border-t border-primary-foreground/20 pt-6">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-[var(--radius-sm)] bg-primary-foreground/10 p-2"><BarChart3 className="size-[var(--icon-sm)]" /></div>
              <div>
                <p className="app-body-sm font-bold">Wealth Insights</p>
                <p className="text-xs opacity-75">Consolidated analytics and performance</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-[var(--radius-sm)] bg-primary-foreground/10 p-2"><Shield className="size-[var(--icon-sm)]" /></div>
              <div>
                <p className="app-body-sm font-bold">Secure & Private</p>
                <p className="text-xs opacity-75">Bank-grade encryption, your data is safe</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
