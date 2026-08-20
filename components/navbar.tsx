"use client"

import {
  Menu,
  Search,
  X,
  User,
  BarChart3,
  Brain,
  Calculator,
  TrendingUp,
  LayoutDashboard,
  Sun,
  Moon,
  Upload,
  Settings,
  ShieldCheck,
  PiggyBank,
  Landmark,
  Wallet,
  Coins,
  FileText,
  Home,
  Briefcase,
  Shield,
  Sparkles,
  Command,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

const searchableCatalog = [
  // Core Navigation
  { href: "/", label: "Dashboard", category: "Navigation", icon: LayoutDashboard, keywords: "home net worth overview balance" },
  { href: "/analytics", label: "Financial Analytics & Cashflow", category: "Analytics", icon: BarChart3, keywords: "trends spending charts income expense" },
  { href: "/analytics/clusters", label: "ML Spending Clusters & Anomalies", category: "Analytics", icon: Brain, keywords: "dbscan k-means ai anomalies outliers" },
  { href: "/ai-ca", label: "AI Virtual Chartered Accountant", category: "AI Intelligence", icon: Brain, keywords: "chat copilot advice deductions 80c 80d" },
  { href: "/tax", label: "Tax Optimization Engine (Old vs New)", category: "Tax Engine", icon: TrendingUp, keywords: "regime slabs save rebate 87a" },
  { href: "/tax/filing", label: "ITR-1 (Sahaj) Autonomous Filing Wizard", category: "Tax Filing", icon: ShieldCheck, keywords: "return e-filing json download itr" },
  { href: "/tax/report", label: "Certified CA Tax Audit Working Paper", category: "Tax Report", icon: FileText, keywords: "working paper pdf audit certificate" },
  { href: "/upload", label: "Upload Bank Statement (PDF/CSV/Excel)", category: "Data Ingestion", icon: Upload, keywords: "hdfc sbi icici axis statement parse" },
  { href: "/settings", label: "Settings & Linked Bank Accounts", category: "Settings", icon: Settings, keywords: "profile kyc 2fa security password" },
  
  // Calculators & Tools
  { href: "/calculators?tool=sip", label: "SIP Calculator (Systematic Investment)", category: "Calculators", icon: TrendingUp, keywords: "mutual fund returns compounding" },
  { href: "/calculators?tool=emi", label: "EMI Calculator (Loans & Mortgages)", category: "Calculators", icon: Calculator, keywords: "home loan car loan monthly installment" },
  { href: "/calculators?tool=fd", label: "Fixed Deposit (FD) Calculator", category: "Calculators", icon: Landmark, keywords: "term deposit bank interest" },
  { href: "/calculators?tool=rd", label: "Recurring Deposit (RD) Calculator", category: "Calculators", icon: PiggyBank, keywords: "monthly savings maturity" },
  { href: "/calculators?tool=budget", label: "50/30/20 Budget Planner", category: "Calculators", icon: Wallet, keywords: "needs wants savings rule" },
  { href: "/calculators?tool=loan", label: "Loan Comparison Matrix", category: "Calculators", icon: Calculator, keywords: "compare interest rates bank tenure" },
  { href: "/calculators?tool=ppf", label: "Public Provident Fund (PPF) Calculator", category: "Calculators", icon: Shield, keywords: "government 15 year tax free" },
  { href: "/calculators?tool=nps", label: "National Pension Scheme (NPS) Calculator", category: "Calculators", icon: ShieldCheck, keywords: "retirement 80ccd 50000" },
  { href: "/calculators?tool=epf", label: "Employee Provident Fund (EPF) Calculator", category: "Calculators", icon: Briefcase, keywords: "provident fund salary retirement" },
  { href: "/calculators?tool=swp", label: "Systematic Withdrawal Plan (SWP) Calculator", category: "Calculators", icon: Coins, keywords: "monthly income pension withdrawal" },
  { href: "/calculators?tool=hra", label: "HRA Tax Exemption Calculator (Sec 10(13A))", category: "Tax Tools", icon: Home, keywords: "house rent allowance exemption rent" },
  { href: "/calculators?tool=cagr", label: "CAGR Compound Annual Growth Calculator", category: "Calculators", icon: TrendingUp, keywords: "growth rate investment performance" },
]

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/tax", label: "Tax Engine", icon: TrendingUp },
  { href: "/ai-ca", label: "AI Virtual CA", icon: Brain },
  { href: "/calculators", label: "Calculators", icon: Calculator },
]

export default function Navbar({
  sidebarOpen,
  onSidebarToggle,
  isDark,
  toggleTheme,
}: {
  sidebarOpen?: boolean
  onSidebarToggle?: () => void
  isDark?: boolean
  toggleTheme?: () => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<typeof searchableCatalog>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()

  const getTabBreadcrumb = (path: string) => {
    if (path === "/") return { title: "Dashboard", category: "Wealth Pulse" }
    if (path === "/analytics") return { title: "Analytics", category: "Cashflow Intelligence" }
    if (path === "/analytics/clusters") return { title: "ML Clusters", category: "Behavioral Analytics" }
    if (path === "/ai-ca") return { title: "Virtual CA", category: "Tax Copilot" }
    if (path === "/calculators") return { title: "Calculators", category: "Financial Suite" }
    if (path === "/tax") return { title: "Tax Engine", category: "Income Tax Act" }
    if (path === "/tax/filing") return { title: "ITR Filing", category: "Return Wizard" }
    if (path === "/tax/report") return { title: "Audit Report", category: "CA Working Paper" }
    if (path === "/upload") return { title: "Upload Statements", category: "Data Ingestion" }
    if (path === "/settings") return { title: "Settings", category: "Preferences" }
    return null
  }
  const breadcrumb = getTabBreadcrumb(pathname)

  // Filter search catalog
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const filtered = searchableCatalog.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.keywords && item.keywords.toLowerCase().includes(q))
      )
      setSearchResults(filtered)
      setSelectedIndex(0)
    } else {
      setSearchResults(searchableCatalog.slice(0, 8))
      setSelectedIndex(0)
    }
  }, [searchQuery])

  // Focus input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [searchOpen])

  // Global keyboard shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
      }
      if (e.key === "Escape") {
        setSearchOpen(false)
        setSearchQuery("")
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleSearchSelect = (href: string) => {
    router.push(href)
    setSearchOpen(false)
    setSearchQuery("")
  }

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % searchResults.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (searchResults[selectedIndex]) {
        handleSearchSelect(searchResults[selectedIndex].href)
      }
    }
  }

  const userName = session?.user?.name || "Member"

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/60 transition-all duration-300">
        <div className="container-page">
          <div className="flex justify-between items-center h-16">
            
            {/* Left: Menu Toggle + Brand Logo + Breadcrumb */}
            <div className="flex items-center gap-3 md:gap-4 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl w-9 h-9 transition-colors"
                onClick={() => onSidebarToggle?.()}
                title="Toggle sidebar"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-4.5 h-4.5" />
              </Button>

              {/* Logo / Title */}
              <div className="flex items-center gap-2 select-none">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-primary via-indigo-600 to-accent flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-4.5 h-4.5 text-primary-foreground" />
                  </div>
                  <span className="font-extrabold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                    FinFlow
                  </span>
                </Link>

                {breadcrumb && (
                  <div className="hidden sm:flex items-center gap-2 ml-1">
                    <span className="text-border/80">/</span>
                    <span className="text-foreground text-xs font-semibold tracking-tight">{breadcrumb.title}</span>
                    <span className="text-[10px] text-muted-foreground bg-secondary/70 border border-border/50 px-2 py-0.5 rounded-full font-medium">
                      {breadcrumb.category}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Middle: Desktop Navigation Pills */}
            <div className="hidden lg:flex items-center gap-1 mx-4 bg-secondary/40 border border-border/50 p-1 rounded-2xl backdrop-blur-md">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2",
                      isActive
                        ? "bg-card text-foreground shadow-xs border border-border/60"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Right: Quick Search Button + Theme Toggle + User Avatar */}
            <div className="flex items-center gap-2 justify-end flex-1">
              
              {/* Search Trigger Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl px-3 py-1.5 h-9 bg-secondary/40 border border-border/50 transition-all cursor-pointer group"
                aria-label="Search pages and financial tools"
              >
                <Search className="w-3.75 h-3.75 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="text-xs font-medium hidden sm:inline-block">Quick search...</span>
                <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded-md border border-border/80 bg-muted/60 px-1.5 font-mono text-[10px] font-semibold text-muted-foreground">
                  <span>⌘</span>K
                </kbd>
              </button>

              {/* Theme Toggle Button */}
              {toggleTheme && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl h-9 w-9 transition-transform active:scale-95"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-700" />}
                </Button>
              )}

              {/* User Account Quick Link */}
              <Link href="/settings">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-xs shadow-xs hover:scale-105 transition-transform" title={userName}>
                  {userName.charAt(0).toUpperCase()}
                </div>
              </Link>

            </div>
          </div>
        </div>
      </nav>

      {/* Modern ⌘K Command Palette Overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 md:p-12 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSearchOpen(false)
              setSearchQuery("")
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Command search"
        >
          <div
            className="w-full max-w-2xl bg-card border border-border/70 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
            onKeyDown={handleModalKeyDown}
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border/60 bg-muted/30">
              <Search className="w-5 h-5 text-primary shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools, tax codes, deductions, pages..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground text-xs"
                >
                  Clear
                </button>
              )}
              <kbd className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold bg-secondary border border-border rounded-md text-muted-foreground">
                ESC
              </kbd>
            </div>

            {/* Results Stream */}
            <div className="p-2 overflow-y-auto flex-1 divide-y divide-border/20">
              {searchResults.length > 0 ? (
                <div className="space-y-1 p-1">
                  {searchResults.map((result, idx) => {
                    const Icon = result.icon
                    const isSelected = idx === selectedIndex
                    return (
                      <button
                        key={`${result.href}-${result.label}`}
                        onClick={() => handleSearchSelect(result.href)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={cn(
                          "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left cursor-pointer group",
                          isSelected
                            ? "bg-primary/10 border border-primary/20 text-foreground"
                            : "hover:bg-secondary/60 text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={cn(
                              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                              isSelected
                                ? "bg-primary text-primary-foreground shadow-xs shadow-primary/20"
                                : "bg-secondary text-muted-foreground group-hover:text-foreground"
                            )}
                          >
                            <Icon className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <p
                              className={cn(
                                "font-semibold text-sm truncate",
                                isSelected ? "text-foreground" : "text-foreground/90 group-hover:text-foreground"
                              )}
                            >
                              {result.label}
                            </p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">{result.href}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary border border-border/40 text-muted-foreground">
                            {result.category}
                          </span>
                          <ArrowRight
                            className={cn(
                              "w-4 h-4 transition-transform",
                              isSelected ? "text-primary translate-x-0.5" : "opacity-0"
                            )}
                          />
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="py-16 text-center text-muted-foreground space-y-2">
                  <p className="text-base font-semibold text-foreground">No matches found for "{searchQuery}"</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Try searching for "SIP", "Old vs New", "HRA", "Upload", or "80C".
                  </p>
                </div>
              )}
            </div>

            {/* Footer keyboard guide */}
            <div className="p-3 bg-muted/40 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground px-4">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono">↓</kbd> to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono">↵</kbd> to select
                </span>
              </div>
              <span className="hidden sm:inline">FinFlow Intelligence Codex</span>
            </div>

          </div>
        </div>
      )}
    </>
  )
}