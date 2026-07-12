import type React from "react"
import { TrendingUp, BarChart3, Shield, Sparkles } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-background dark:bg-slate-950">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </div>

      {/* Right side - Visual Panel */}
      <div className="hidden md:flex flex-1 relative bg-gradient-to-br from-primary via-primary/95 to-accent items-center justify-center p-12 overflow-hidden select-none">
        {/* Background Decorative Gradients / Circles */}
        <div className="absolute top-1/4 left-1/4 w-[32rem] h-[32rem] bg-accent/25 rounded-full blur-[128px] pointer-events-none mix-blend-screen animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-[24rem] h-[24rem] bg-white/10 rounded-full blur-[96px] pointer-events-none" />
        
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 max-w-lg text-white text-left space-y-8 animate-in fade-in slide-in-from-right duration-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight">FinFlow</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Smarter wealth tracking and tax optimization
            </h2>
            <p className="text-white/80 text-lg font-light leading-relaxed">
              Consolidate your bank accounts, get automated ML spending categories, and optimize your taxes in one secure dashboard.
            </p>
          </div>

          {/* Mini-Features grid */}
          <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/15">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/10 mt-0.5"><BarChart3 className="w-4 h-4" /></div>
              <div>
                <p className="font-bold text-sm">Wealth Insights</p>
                <p className="text-xs text-white/70">Consolidated analytics and performance</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-white/10 mt-0.5"><Shield className="w-4 h-4" /></div>
              <div>
                <p className="font-bold text-sm">Secure & Private</p>
                <p className="text-xs text-white/70">Bank-grade encryption, your data is safe</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

