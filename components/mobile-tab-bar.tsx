"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
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
  ChevronRight
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
  { href: "/ai-ca", label: "AI CA", icon: Brain },
]

export default function MobileTabBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/auth/login" })
  }

  const isTabActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(href)
  }

  const isMoreActive = () => {
    const activePaths = ["/tax", "/calculators", "/settings"]
    return activePaths.some(path => pathname?.startsWith(path))
  }

  const userName = session?.user?.name || "User Account"
  const userEmail = session?.user?.email || ""

  return (
    <div className="fixed bottom-6 left-4 right-4 z-40 md:hidden">
      {/* Floating Bottom Tab Bar */}
      <div className="flex h-16 w-full items-center justify-around rounded-2xl border border-border/80 bg-card/75 backdrop-blur-xl px-2 shadow-2xl shadow-black/30 dark:shadow-black/50 transition-all duration-300">
        {mainNavItems.map((item) => {
          const Icon = item.icon
          const active = isTabActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center group"
            >
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                  active
                    ? "bg-primary/10 text-primary scale-110"
                    : "text-muted-foreground group-hover:text-foreground group-hover:scale-105"
                )}
              >
                <Icon className="w-5 h-5" />
                {active && (
                  <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-primary animate-pulse-subtle" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold mt-0.5 tracking-tight transition-colors duration-200",
                  active ? "text-primary font-bold" : "text-muted-foreground group-hover:text-foreground"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}

        {/* Drawer / Bottom Sheet trigger for More options */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full py-1 text-center group focus:outline-none">
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
                  isMoreActive() || drawerOpen
                    ? "bg-primary/10 text-primary scale-110"
                    : "text-muted-foreground group-hover:text-foreground group-hover:scale-105"
                )}
              >
                <Menu className="w-5 h-5" />
                {(isMoreActive() || drawerOpen) && (
                  <span className="absolute -bottom-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
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

          <DrawerContent className="border-t border-border/80 bg-card/95 backdrop-blur-2xl px-4 pb-8 max-h-[85vh] rounded-t-[2rem]">
            <div className="mx-auto w-12 h-1.5 rounded-full bg-muted-foreground/20 mt-4 mb-6" />
            
            <DrawerHeader className="text-left px-2 mb-2">
              <DrawerTitle className="text-xl font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                Financial Suite
              </DrawerTitle>
              <DrawerDescription>
                Access calculators, tax settings, and manage your account options.
              </DrawerDescription>
            </DrawerHeader>

            {/* Profile Quick Access */}
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border/60 mb-5 mx-2">
              <Link href="/settings" onClick={() => setDrawerOpen(false)} className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20 transition-transform duration-300">
                  <User className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{userName}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{userEmail || "Manage account profile"}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </Link>
            </div>

            {/* Grid of secondary actions */}
            <div className="grid grid-cols-1 gap-2 px-2">
              <Link
                href="/calculators"
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300",
                  pathname?.startsWith("/calculators")
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "bg-background/40 border-border/50 hover:bg-secondary/40 text-foreground"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Calculator className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold block text-sm">Universal Calculators</span>
                  <span className="text-[11px] text-muted-foreground">30+ dynamic tools & visual compounding</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                href="/tax"
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300",
                  pathname?.startsWith("/tax")
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "bg-background/40 border-border/50 hover:bg-secondary/40 text-foreground"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold block text-sm">Tax Engine</span>
                  <span className="text-[11px] text-muted-foreground">Regime comparison and optimization strategies</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>

              <Link
                href="/settings"
                onClick={() => setDrawerOpen(false)}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-2xl border transition-all duration-300",
                  pathname?.startsWith("/settings")
                    ? "bg-primary/10 border-primary/30 text-foreground"
                    : "bg-background/40 border-border/50 hover:bg-secondary/40 text-foreground"
                )}
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold block text-sm">System Settings</span>
                  <span className="text-[11px] text-muted-foreground">Tax profiles, consent settings & preferences</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            </div>

            {/* Logout button in drawer */}
            <div className="mt-6 px-2">
              <button
                onClick={() => {
                  setDrawerOpen(false)
                  handleLogout()
                }}
                className="w-full flex items-center gap-4 p-3 rounded-2xl bg-destructive/10 hover:bg-destructive/15 text-destructive border border-destructive/10 transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5" />
                </div>
                <span className="font-semibold text-sm">Logout Session</span>
              </button>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  )
}
