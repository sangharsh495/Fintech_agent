"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/components/navbar"
import Sidebar from "@/components/sidebar"
import MobileTabBar from "@/components/mobile-tab-bar"
import { useIsMobile } from "@/components/ui/use-mobile"
import LaunchScreen from "@/components/launch-screen"
import Footer from "@/components/footer"

const LAUNCH_SCREEN_INTERVAL_MS = 24 * 60 * 60 * 1000

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showLaunchScreen, setShowLaunchScreen] = useState(true)
  const isMobile = useIsMobile()
  const pathname = usePathname()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    } else {
      setSidebarOpen(true)
    }
  }, [isMobile])

  // On phones the sidebar is a drawer: close it when a page is picked, when
  // the backdrop is tapped (sidebar.tsx dispatches "sidebar-close") or on Escape.
  useEffect(() => {
    if (isMobile) setSidebarOpen(false)
  }, [pathname, isMobile])

  useEffect(() => {
    const close = () => setSidebarOpen(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && window.matchMedia("(max-width: 767px)").matches) close()
    }
    window.addEventListener("sidebar-close", close)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("sidebar-close", close)
      window.removeEventListener("keydown", onKey)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    let savedTheme = "light"
    try {
      savedTheme = localStorage.getItem("theme") || "light"
    } catch {}
    setIsDark(savedTheme === "dark")
    document.documentElement.classList.toggle("dark", savedTheme === "dark")

    // Show the intro at most once a day. sessionStorage is per tab, so the
    // old check replayed the splash in every new tab and blocked every tap.
    try {
      const seenAt = Number(localStorage.getItem("launch_seen_at") || 0)
      if (Date.now() - seenAt < LAUNCH_SCREEN_INTERVAL_MS) setShowLaunchScreen(false)
    } catch {
      setShowLaunchScreen(false)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark"
    setIsDark(!isDark)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark")
  }

  if (!mounted || status === "loading") return null

  const isAuthPage = pathname?.startsWith("/auth")
  const isOnboardingPage = pathname?.startsWith("/onboarding")
  const isPublicPage = pathname === "/" || pathname?.startsWith("/calculators")
  const isAuthenticated = !!session?.user

  // Auth page — show as-is
  if (isAuthPage) return <>{children}</>

  // Onboarding page — full screen without sidebar/navbar
  if (isOnboardingPage) return <>{children}</>

  // Public landing & calculators page for unauthenticated visitors
  if (!isAuthenticated && isPublicPage) return <>{children}</>

  // Authenticated — show full layout
  if (isAuthenticated) {
    const isChatPage = pathname === "/ai-ca"

    return (
      <>
        {showLaunchScreen && (
          <LaunchScreen
            onComplete={() => {
              try {
                localStorage.setItem("launch_seen_at", String(Date.now()))
              } catch {}
              setShowLaunchScreen(false)
            }}
          />
        )}
        <Navbar
          isDark={isDark}
          toggleTheme={toggleTheme}
          sidebarOpen={sidebarOpen}
          onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        {/* No top padding: the navbar is sticky, so it already takes its 4rem in
            the flow. pt-16 added a second, blank 4rem band under it on every page. */}
        <div className="flex">
          <Sidebar isOpen={sidebarOpen} />
          <main
            className={`flex-1 min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-auto transition-all duration-300 ${isChatPage ? "pb-24 md:pb-0 md:overflow-hidden" : "pb-28 md:pb-0"} ${sidebarOpen ? "md:ml-[18rem]" : "md:ml-0"}`}
          >
            <div className={isChatPage ? "w-full flex-1 flex flex-col min-h-0" : "container-page py-4 sm:py-8 w-full flex-1 animate-in fade-in slide-in-from-bottom-4 duration-500"}>
              {children}
            </div>
            {!isChatPage && <Footer />}
          </main>
          <MobileTabBar />
        </div>
      </>
    )
  }

  // Unauthenticated non-auth page — middleware handles redirect, show nothing
  return null
}
