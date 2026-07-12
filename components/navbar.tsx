"use client"

import { Menu, Search, X, User, BarChart3, Brain, Calculator, TrendingUp, LayoutDashboard, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

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
  const [searchResults, setSearchResults] = useState<typeof navLinks>([])
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
      const filtered = navLinks.filter((link) =>
        link.label.toLowerCase().includes(searchQuery.toLowerCase())
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
      <nav className="fixed inset-x-0 top-0 z-[var(--z-fixed)] border-b border-border bg-background/90 backdrop-blur-[20px]">
        <div className="page-shell max-w-none">
          <div className="flex h-[var(--header-height-desktop)] items-center justify-between">
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
                  <div className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] bg-primary shadow-inner">
                    <TrendingUp className="size-4 text-primary-foreground" />
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
                      "flex min-h-[var(--touch-target-min)] items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors duration-[var(--duration-fast)] group",
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
                className="hidden sm:flex h-[var(--touch-target-min)] items-center gap-2 rounded-[var(--radius-md)] border border-border bg-secondary px-3 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
                <span className="text-xs font-normal">Search...</span>
                <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                  <span className="text-xs">Cmd</span>K
                </kbd>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden text-muted-foreground hover:text-foreground"
                onClick={() => setSearchOpen(true)}
              >
                <Search className="w-4 h-4" />
              </Button>

              {/* Theme Toggle Button */}
              {toggleTheme && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground"
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
          <div className="search-input-wrapper fade-in mt-[10vh] w-[min(42rem,calc(100vw-2rem))] overflow-hidden rounded-[var(--radius-2xl)] border border-border bg-card shadow-[var(--shadow-xl)]">
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
                        key={result.href}
                        onClick={() => handleSearchSelect(result.href)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/80 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center group-hover:bg-background transition-colors border border-transparent group-hover:border-border/50">
                          <Icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-foreground">{result.label}</p>
                          <p className="text-xs text-muted-foreground">{result.href}</p>
                        </div>
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
