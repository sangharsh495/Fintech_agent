"use client"

import { BarChart3, Calculator, Brain, TrendingUp, Settings, LogOut, User, ChevronRight, LineChart, Upload } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
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
  const userEmail = session?.user?.email || ""

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-16 z-40 w-72 border-r border-border bg-card/50 backdrop-blur-lg flex-col overflow-y-auto transition-all duration-500 ease-out",
          "h-[calc(100vh-4rem)]",
          isOpen ? "translate-x-0 opacity-100 visible" : "-translate-x-full opacity-0 invisible",
        )}
      >
        {/* User Profile Section */}
        <div className="p-6 border-b border-border">
          <Link href="/settings" className="flex items-center gap-4 group">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-300 group-hover:scale-105">
              <User className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail || "Manage profile"}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-2 stagger-children">
          {navItems.map((item, index) => {
            const Icon = item.icon
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 text-sm group relative overflow-hidden",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-foreground hover:bg-secondary",
                )}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300",
                    isActive ? "bg-primary-foreground/20" : "bg-primary/10 group-hover:bg-primary/20",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                      isActive ? "text-primary-foreground" : "text-primary",
                    )}
                  />
                </div>
                <div className="flex-1">
                  <span className="font-medium block">{item.label}</span>
                  <span className={cn("text-xs", isActive ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {item.description}
                  </span>
                </div>
                {isActive && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-foreground rounded-l-full" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-destructive/10 transition-all duration-300 text-sm text-destructive group"
          >
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
              <LogOut className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1" />
            </div>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
