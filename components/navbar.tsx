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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const searchableCatalog = [
  // Core Pages
  { href: "/", label: "Dashboard", category: "Navigation", icon: LayoutDashboard },
  { href: "/analytics", label: "Financial Analytics & Trends", category: "Navigation", icon: BarChart3 },
  { href: "/analytics/clusters", label: "ML Spending Clusters & Anomalies", category: "Navigation", icon: Brain },
  { href: "/ai-ca", label: "AI Virtual Chartered Accountant", category: "Navigation", icon: Brain },
  { href: "/tax", label: "Tax Optimization Engine (Old vs New)", category: "Navigation", icon: TrendingUp },
  { href: "/tax/filing", label: "ITR-1 (Sahaj) Autonomous Filing Wizard", category: "Tax Filing", icon: ShieldCheck },
  { href: "/tax/report", label: "Certified CA Tax Audit Working Paper", category: "Tax Report", icon: FileText },
  { href: "/upload", label: "Upload Bank Statement (PDF/CSV/Excel)", category: "Data Ingestion", icon: Upload },
  { href: "/settings", label: "Settings & Linked Bank Accounts", category: "Settings", icon: Settings },
  
  // Calculators & Tools
  { href: "/calculators?tool=sip", label: "SIP Calculator (Systematic Investment)", category: "Calculators", icon: TrendingUp },
  { href: "/calculators?tool=emi", label: "EMI Calculator (Loans & Mortgages)", category: "Calculators", icon: Calculator },
  { href: "/calculators?tool=fd", label: "Fixed Deposit (FD) Calculator", category: "Calculators", icon: Landmark },
  { href: "/calculators?tool=rd", label: "Recurring Deposit (RD) Calculator", category: "Calculators", icon: PiggyBank },
  { href: "/calculators?tool=budget", label: "50/30/20 Budget Planner", category: "Calculators", icon: Wallet },
  { href: "/calculators?tool=loan", label: "Loan Comparison Matrix", category: "Calculators", icon: Calculator },
  { href: "/calculators?tool=ppf", label: "Public Provident Fund (PPF) Calculator", category: "Calculators", icon: Shield },
  { href: "/calculators?tool=nps", label: "National Pension Scheme (NPS) Calculator", category: "Calculators", icon: ShieldCheck },
  { href: "/calculators?tool=epf", label: "Employee Provident Fund (EPF) Calculator", category: "Calculators", icon: Briefcase },
  { href: "/calculators?tool=swp", label: "Systematic Withdrawal Plan (SWP) Calculator", category: "Calculators", icon: Coins },
  { href: "/calculators?tool=hra", label: "HRA Tax Exemption Calculator (Sec 10(13A))", category: "Tax Tools", icon: Home },
  { href: "/calculators?tool=cagr", label: "CAGR Compound Annual Growth Calculator", category: "Calculators", icon: TrendingUp },
  
  // Tax Law Concepts
  { href: "/tax", label: "Section 80C Deductions (ELSS, PPF, LIC - ₹1.5L)", category: "Tax Codex", icon: FileText },
  { href: "/tax", label: "Section 80D Health Insurance (Self & Parents)", category: "Tax Codex", icon: FileText },
  { href: "/tax", label: "Section 80CCD(1B) Additional NPS (₹50,000)", category: "Tax Codex", icon: FileText },
  { href: "/tax", label: "Section 24(b) Home Loan Interest (₹2 Lakhs)", category: "Tax Codex", icon: Home },
  { href: "/tax", label: "Section 87A Full Tax Rebate (Zero Tax under ₹7L)", category: "Tax Codex", icon: ShieldCheck },
]

const navLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/ai-ca", label: "AI CA", icon: Brain },
  { href: "/calculators", label: "Tools", icon: Calculator },
  { href: "/tax", label: "Tax", icon: TrendingUp },
]

export default function Navbar({
  sidebarOpen,
  onSidebarToggle,
  isDark,
  toggleTheme,
}: {
  sidebarOpen?: boolean;
  onSidebarToggle?: () => void;
  isDark?: boolean;
  toggleTheme?: () => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<typeof searchableCatalog>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  const getTabName = (path: string) => {
    if (path === "/") return "Dashboard"
    if (path === "/analytics") return "Analytics"
    if (path === "/ai-ca") return "AI Virtual CA"
    if (path === "/calculators") return "Tools"
    if (path === "/tax") return "Tax Engine"
    if (path === "/upload") return "Upload"
    if (path === "/settings") return "Settings"
    return ""
  }
  const currentTabName = getTabName(pathname)

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const filtered = searchableCatalog.filter(
        (item) => item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
      )
      setSearchResults(filtered)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
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

  return (
    <>
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container-page">
          <div className="flex justify-between items-center h-[4rem]">
            <div className="flex items-center gap-4 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors duration-200"
                onClick={() => onSidebarToggle?.()}
                title="Toggle sidebar"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-[18px] h-[18px]" />
              </Button>

              {/* Logo / Title */}
              <div className="flex items-center gap-2 select-none">
                <Link href="/" className="flex items-center gap-2 group">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-inner">
                    <TrendingUp className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-bold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors">
                    FinFlow
                  </span>
                </Link>
                {currentTabName && (
                  <>
                    <span className="text-border mx-1">/</span>
                    <span className="text-foreground text-sm font-medium tracking-tight">{currentTabName}</span>
                  </>
                )}
              </div>
            </div>

            {/* Desktop Navigation (Subdued) */}
            <div className="hidden lg:flex items-center gap-1 mx-4">
              {navLinks.map((link) => {
                const Icon = link.icon
                const isActive = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2 group",
                      isActive
                        ? "bg-secondary text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                    )}
                  >
                    <Icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 justify-end flex-1">
              {/* Search Button */}
              <Button
                variant="ghost"
                className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-full px-3 h-9 bg-secondary/30 border border-transparent hover:border-border/50 transition-all"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
                <span className="text-xs font-normal">Search...</span>
                <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-full h-9 w-9"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>

              {/* Theme Toggle Button */}
              {toggleTheme && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-full h-9 w-9 transition-colors"
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Search Overlay */}
      {searchOpen && (
        <div
          className="search-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSearchOpen(false)
              setSearchQuery("")
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="search-input-wrapper fade-in mt-[10vh]">
            <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-card">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages, tools, or analytics..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchOpen(false)
                  setSearchQuery("")
                }}
                className="hover:bg-secondary/80 rounded-lg text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Search Results */}
            <div className="p-2 max-h-[400px] overflow-y-auto bg-card/95 backdrop-blur-xl">
              {searchQuery.trim() === "" ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">What are you looking for?</p>
                  <p className="text-xs mt-2 opacity-70">
                    Use <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px]">↓</kbd> to navigate
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((result) => {
                    const Icon = result.icon
                    return (
                      <button
                        key={`${result.href}-${result.label}`}
                        onClick={() => handleSearchSelect(result.href)}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/80 transition-colors text-left group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-background transition-colors border border-transparent group-hover:border-border/50 shrink-0">
                            <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">{result.label}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate">{result.href}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground group-hover:text-foreground shrink-0 ml-2">
                          {result.category}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}