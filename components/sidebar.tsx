"use client"

import {
  LayoutDashboard,
  LineChart,
  Upload,
  Brain,
  TrendingUp,
  FileText,
  Calculator,
  Settings,
  LogOut,
  User,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

const navigationGroups = [
  {
    title: "Overview",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/", badge: null },
      { icon: LineChart, label: "Analytics & Trends", href: "/analytics", badge: "ML" },
      { icon: Upload, label: "Upload Statements", href: "/upload", badge: null },
    ],
  },
  {
    title: "Tax & Compliance",
    items: [
      { icon: TrendingUp, label: "Tax Engine", href: "/tax", badge: "Budget '25" },
      { icon: ShieldCheck, label: "ITR Filing Wizard", href: "/tax/filing", badge: null },
      { icon: FileText, label: "CA Audit Working Paper", href: "/tax/report", badge: null },
    ],
  },
  {
    title: "Intelligence & Tools",
    items: [
      { icon: Brain, label: "AI Virtual CA", href: "/ai-ca", badge: "AI" },
      { icon: Calculator, label: "30+ Financial Tools", href: "/calculators", badge: null },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Settings, label: "Settings & KYC", href: "/settings", badge: null },
    ],
  },
]

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" })
  }

  const userName = session?.user?.name || "Member"
  const userEmail = session?.user?.email || "user@finflow.app"

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 w-[18rem] border-r border-border/60 bg-background/95 backdrop-blur-2xl flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.2,0,0,1)]",
          "h-[calc(100vh-4rem)] shadow-sm",
          isOpen ? "translate-x-0 opacity-100 visible" : "-translate-x-full opacity-0 invisible",
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden no-scrollbar p-3 space-y-6">
          
          {/* Main Navigation Groups */}
          <nav className="space-y-5" aria-label="Main navigation">
            {navigationGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 py-1 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider">
                  {group.title}
                </div>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href) && (item.href.length > 4 || pathname === item.href))
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.25 rounded-xl transition-all duration-200 text-sm group relative",
                          isActive
                            ? "bg-primary/10 text-primary font-semibold shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/70",
                        )}
                      >
                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground shadow-xs shadow-primary/20"
                              : "bg-secondary/60 text-muted-foreground group-hover:text-foreground group-hover:bg-secondary"
                          )}
                        >
                          <Icon className="w-3.75 h-3.75" />
                        </div>
                        <span className="flex-1 tracking-tight truncate text-xs font-medium">{item.label}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "text-[10px] font-bold px-1.75 py-0.5 rounded-md",
                              isActive
                                ? "bg-primary/20 text-primary"
                                : "bg-secondary text-muted-foreground group-hover:text-foreground"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                        {isActive && (
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-l-full" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Quick AI Promotion / Insight Pill */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20 shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
              <span className="text-xs font-bold text-foreground">Virtual CA Copilot</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
              Ask real-time questions about your tax deductions and wealth trajectory.
            </p>
            <Link
              href="/ai-ca"
              className="inline-flex items-center justify-center w-full py-1.5 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs"
            >
              Ask Virtual CA
            </Link>
          </div>

          {/* User Profile & Actions (Bottom) */}
          <div className="pt-3 border-t border-border/50 mt-auto">
            <Link
              href="/settings"
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary/70 transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex flex-shrink-0 items-center justify-center shadow-xs text-primary-foreground font-bold text-xs">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{userName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 mt-1 rounded-xl hover:bg-destructive/10 transition-colors text-xs font-medium text-destructive/80 hover:text-destructive"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out session</span>
            </button>
          </div>

        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => window.dispatchEvent(new CustomEvent("sidebar-close"))}
          aria-hidden="true"
        />
      )}
    </>
  )
}