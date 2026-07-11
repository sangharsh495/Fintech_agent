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
  { href: "/ai-ca", label: "AI Virtual CA", icon: Brain },
  { href: "/calculators", label: "Tools", icon: Calculator },
  { href: "/tax", label: "Tax Engine", icon: TrendingUp },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container-page">
          <div className="flex justify-between items-center h-[4rem] md:h-[4rem]">
            <div className="flex items-center gap-3 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-foreground hover:bg-secondary transition-all duration-200 hover:scale-105 touch-target-comfortable"
                onClick={() => onSidebarToggle?.()}
                title="Toggle sidebar"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Logo / Title with Active Tab */}
              <div className="flex items-center gap-1.5 select-none">
                <Link href="/" className="font-bold text-lg text-foreground hover:text-primary transition-colors">
                  FinWise
                </Link>
                {currentTabName && (
                  <>
                    <span className="text-muted-foreground/40 font-normal">/</span>
                    <span className="text-primary text-body-sm font-semibold">{currentTabName}</span>
                  </>
                )}
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2.5 rounded-lg text-body-sm font-medium transition-all duration-200 text-foreground hover:text-primary hover:bg-primary/5 flex items-center gap-2 group touch-target-comfortable"
                  >
                    <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                    {link.label}
                  </Link>
                )
              })}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl text-foreground hover:bg-secondary transition-all duration-200 hover:scale-105 touch-target-comfortable"
                onClick={() => setSearchOpen(true)}
                aria-label="Search (⌘K)"
              >
                <Search className="w-5 h-5" />
              </Button>

              <Link href="/settings">
                <button
                  title="Profile & Settings"
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-110 border-2 border-primary-foreground/20 touch-target-comfortable"
                >
                  <User className="w-5 h-5 text-primary-foreground" />
                </button>
              </Link>
            </div>
          </div>

          {/* Mobile Menu Removed */}
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
          <div className="search-input-wrapper fade-in">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pages... (Press Esc to close)"
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-body-lg"
                autoFocus
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchOpen(false)
                  setSearchQuery("")
                }}
                className="hover:bg-secondary rounded-lg touch-target-comfortable"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Search Results */}
            <div className="p-2 max-h-[320px] overflow-y-auto">
              {searchQuery.trim() === "" ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-body-sm">Type to search pages</p>
                  <p className="text-body-xs mt-2">
                    Press <kbd className="px-2 py-1 rounded bg-secondary text-foreground border border-border text-body-xs">⌘K</kbd> anytime to search
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="stagger-children">
                  {searchResults.map((result) => {
                    const Icon = result.icon
                    return (
                      <button
                        key={result.href}
                        onClick={() => handleSearchSelect(result.href)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-all duration-200 text-left group touch-target-comfortable"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{result.label}</p>
                          <p className="text-body-xs text-muted-foreground">{result.href}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-body-sm">No results found for "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}