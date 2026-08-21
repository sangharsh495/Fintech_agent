"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard,
  BarChart3,
  Upload,
  Brain,
  Menu,
  Calculator,
  TrendingUp,
  Settings,
  LogOut,
  User,
  ChevronRight,
  ShieldCheck,
  FileText,
  Sparkles,
  PieChart,
  Lock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/tax", label: "Tax", icon: TrendingUp },
]

export default function MobileTabBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" })
  }

  const isTabActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname?.startsWith(href)
  }

  const isMoreActive = () => {
    const activePaths = ["/calculators", "/settings", "/ai-ca", "/tax/filing", "/tax/report", "/analytics/clusters"]
    return activePaths.some(path => pathname?.startsWith(path))
  }

  const userName = session?.user?.name || "User Account"
  const userEmail = session?.user?.email || ""

  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 md:hidden pb-safe">
      {/* ── Glassmorphic Floating Bottom Tab Bar ── */}
      <div className="flex h-16 w-full items-center justify-around rounded-2xl border border-border/80 dark:border-white/10 bg-card/85 dark:bg-slate-950/85 backdrop-blur-2xl px-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-all duration-300">
        {mainNavItems.map((item) => {
          const Icon = item.icon
          const active = isTabActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center group active:scale-95 transition-transform duration-150"
            >
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                <Icon className="w-4.5 h-4.5" />
                {active && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-card" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold mt-0.5 tracking-tight transition-colors duration-200",
                  active ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* ── Drawer / Bottom Sheet trigger for More options ── */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center group focus:outline-none active:scale-95 transition-transform duration-150 cursor-pointer">
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                  isMoreActive() || drawerOpen
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105"
                    : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                <Menu className="w-4.5 h-4.5" />
                {(isMoreActive() || drawerOpen) && (
                  <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-card" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold mt-0.5 tracking-tight transition-colors duration-200",
                  isMoreActive() || drawerOpen ? "text-primary font-bold" : "text-muted-foreground"
                )}
              >
                More
              </span>
            </button>
          </DrawerTrigger>

          <DrawerContent className="border-t border-border/80 dark:border-white/10 bg-card/95 dark:bg-slate-950/95 backdrop-blur-3xl px-4 pb-8 max-h-[90vh] rounded-t-[2.25rem]">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/30 mt-3 mb-4" />
            
            <DrawerHeader className="text-left px-1 mb-2">
              <DrawerTitle className="text-lg font-extrabold flex items-center gap-2 text-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                FinFlow Intelligence & Tools
              </DrawerTitle>
              <DrawerDescription className="text-xs text-muted-foreground">
                Access calculators, tax audit papers, AI virtual CA, and account security.
              </DrawerDescription>
            </DrawerHeader>

            {/* Profile Quick Access Card */}
            <div className="p-3.5 rounded-2xl bg-secondary/50 dark:bg-slate-900 border border-border/60 mb-4 mx-1 shadow-xs">
              <Link href="/settings" onClick={() => setDrawerOpen(false)} className="flex items-center gap-3.5 group">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-primary-foreground font-bold shadow-md shadow-primary/20">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-foreground truncate">{userName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{userEmail || "Account Settings & KYC"}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>

            {/* Grid of full application suite */}
            <div className="grid grid-cols-1 gap-2 mx-1 overflow-y-auto max-h-[50vh] pr-1">
              
              {/* Virtual CA Page */}
              <Link
                href="/ai-ca"
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 shadow-xs",
                  pathname === "/ai-ca"
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-background/40 hover:bg-secondary/50 border-border/50 text-foreground"
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-xs">
                  <Brain className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs">AI Virtual Chartered Accountant</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/20 text-primary">LIVE</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate block">Comprehensive audit & tax planning chat</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>

              {/* ITR Filing Wizard */}
              <Link
                href="/tax/filing"
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 shadow-xs",
                  pathname?.startsWith("/tax/filing")
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-background/40 hover:bg-secondary/50 border-border/50 text-foreground"
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xs">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="font-bold text-xs block">ITR-1 (Sahaj) Filing Wizard</span>
                  <span className="text-[11px] text-muted-foreground truncate block">4-step automated e-filing JSON generator</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>

              {/* CA Audit Working Paper */}
              <Link
                href="/tax/report"
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 shadow-xs",
                  pathname?.startsWith("/tax/report")
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-background/40 hover:bg-secondary/50 border-border/50 text-foreground"
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xs">
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="font-bold text-xs block">Certified CA Audit Paper</span>
                  <span className="text-[11px] text-muted-foreground truncate block">3-way reconciliation PDF audit report</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>

              {/* 30+ Financial Calculators */}
              <Link
                href="/calculators"
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 shadow-xs",
                  pathname?.startsWith("/calculators")
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-background/40 hover:bg-secondary/50 border-border/50 text-foreground"
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-xs">
                  <Calculator className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="font-bold text-xs block">30+ Financial Calculators</span>
                  <span className="text-[11px] text-muted-foreground truncate block">EMI, SIP, FD, RD, Budget, PPF, NPS & FIRE</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>

              {/* ML Clusters & Anomalies */}
              <Link
                href="/analytics/clusters"
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 shadow-xs",
                  pathname?.startsWith("/analytics/clusters")
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-background/40 hover:bg-secondary/50 border-border/50 text-foreground"
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center text-white shadow-xs">
                  <PieChart className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="font-bold text-xs block">ML Clusters & Anomaly Radar</span>
                  <span className="text-[11px] text-muted-foreground truncate block">DBSCAN behavioral outlier detection</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>

              {/* Settings & Security */}
              <Link
                href="/settings"
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 shadow-xs",
                  pathname?.startsWith("/settings")
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-background/40 hover:bg-secondary/50 border-border/50 text-foreground"
                )}
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-600 to-slate-800 flex items-center justify-center text-white shadow-xs">
                  <Settings className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <span className="font-bold text-xs block">Settings & KYC Preferences</span>
                  <span className="text-[11px] text-muted-foreground truncate block">Two-factor auth, linked accounts, export</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>
            </div>

            {/* Logout button */}
            <div className="mt-4 mx-1">
              <button
                onClick={() => {
                  setDrawerOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-destructive/10 hover:bg-destructive/15 text-destructive border border-destructive/20 font-bold text-xs transition-all duration-200 active:scale-98 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Current Session</span>
              </button>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
