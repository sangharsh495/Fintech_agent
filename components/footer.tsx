"use client"

import Link from "next/link"
import { ShieldCheck, Lock, Activity, TrendingUp, Sparkles } from "lucide-react"

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/60 py-8 bg-card/40 backdrop-blur-md mt-auto">
      <div className="container-page">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-border/40 text-xs text-muted-foreground">
          {/* Brand & Security Badges */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 justify-center lg:justify-start">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground shadow-xs">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span>FinFlow Wealth</span>
            </div>

            <div className="hidden sm:block h-4 w-px bg-border/80" />

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full border border-border/50">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>256-Bit Bank-Grade Encryption</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full border border-border/50">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Income Tax Act 1961 Compliant</span>
            </div>
          </div>

          {/* System Operational Status */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">All Systems Operational</span>
          </div>
        </div>

        {/* Links & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} FinFlow Technologies Pvt Ltd. Designed for Indian Wealth & Tax Intelligence.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/tax" className="hover:text-foreground transition-colors">Tax Codex</Link>
            <Link href="/calculators" className="hover:text-foreground transition-colors">Financial Tools</Link>
            <Link href="/ai-ca" className="hover:text-foreground transition-colors">AI Virtual CA</Link>
            <Link href="/settings" className="hover:text-foreground transition-colors">Privacy & Security</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

