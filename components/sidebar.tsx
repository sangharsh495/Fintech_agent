"use client"

import { BarChart3, Calculator, Brain, TrendingUp, Settings, LogOut, User, ChevronRight, LineChart, Upload, ChevronUp } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

const navItems = [
  { icon: BarChart3, label: "Dashboard", href: "/", description: "Financial overview" },
  { icon: LineChart, label: "Analytics", href: "/analytics", description: "Deep insights" },
  { icon: Upload, label: "Upload", href: "/upload", description: "Add bank statements" },
  { icon: Calculator, label: "Tools", href: "/calculators", description: "Financial calculators" },
  { icon: Brain, label: "AI Virtual CA", href: "/ai-ca", description: "AI-powered advice" },
  { icon: TrendingUp, label: "Tax Engine", href: "/tax", description: "Tax optimization" },
  { icon: Settings, label: "Settings", href: "/settings", description: "Account settings" },
]

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" })
  }

  const userName = session?.user?.name || "User Account"
  const userEmail = session?.user?.email || "user@example.com"

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-[var(--header-height-desktop)] z-[var(--z-sticky)] w-[var(--sidebar-width-default)] border-r border-border bg-background/95 backdrop-blur-[20px] flex flex-col justify-between transition-all duration-[var(--duration-normal)] ease-out",
          "h-[calc(100vh-var(--header-height-desktop))]",
          isOpen ? "translate-x-0 opacity-100 visible" : "-translate-x-full opacity-0 invisible",
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex flex-col h-full overflow-y-auto overflow-x-hidden no-scrollbar">
          {/* Main Navigation */}
          <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
            <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Menu
            </div>
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex min-h-[var(--touch-target-min)] items-center gap-3 overflow-hidden rounded-[var(--radius-md)] px-3 text-sm transition-colors duration-[var(--duration-fast)] group",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                  )}
                  style={{ transitionDelay: `${index * 15}ms` }}
                >
                  <Icon
                    className={cn(
                      "size-[var(--icon-md)] transition-transform duration-[var(--duration-fast)] group-hover:scale-110",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                    )}
                  />
                  <span className="flex-1 tracking-tight">{item.label}</span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-primary rounded-r-full" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Profile & Actions (Bottom) */}
          <div className="border-t border-border bg-card/30 p-3">
            <button
              onClick={handleLogout}
              className="mb-2 flex min-h-[var(--touch-target-min)] w-full items-center gap-3 rounded-[var(--radius-md)] px-3 text-sm text-destructive transition-colors duration-[var(--duration-fast)] hover:bg-destructive/10 group"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span className="font-medium tracking-tight">Log out</span>
            </button>

            <Link href="/settings" className="flex min-h-[var(--touch-target-min)] items-center gap-3 rounded-[var(--radius-md)] px-3 transition-colors duration-[var(--duration-fast)] hover:bg-secondary group">
              <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary shadow-inner">
                <User className="w-[18px] h-[18px] text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
              <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[calc(var(--z-sticky)-1)] bg-foreground/40 backdrop-blur-sm lg:hidden transition-opacity duration-[var(--duration-normal)]"
          onClick={() => window.dispatchEvent(new CustomEvent("sidebar-close"))}
          aria-hidden="true"
        />
      )}
    </>
  )
}
