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

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme") || "light"
    setIsDark(savedTheme === "dark")
    document.documentElement.classList.toggle("dark", savedTheme === "dark")

    // Check session storage to only show launch screen once per session
    const isLaunchComplete = sessionStorage.getItem("launch_complete") === "true"
    if (isLaunchComplete) {
      setShowLaunchScreen(false)
    }
  }, [])

  useEffect(() => {
    const closeSidebar = () => setSidebarOpen(false)
    window.addEventListener("sidebar-close", closeSidebar)
    return () => window.removeEventListener("sidebar-close", closeSidebar)
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
  const isAuthenticated = !!session?.user

  // Auth page — show as-is
  if (isAuthPage) return <>{children}</>

  // Onboarding page — full screen without sidebar/navbar
  if (isOnboardingPage) return <>{children}</>

  // Authenticated — show full layout
  if (isAuthenticated) {
    return (
      <>
        {showLaunchScreen && (
          <LaunchScreen
            onComplete={() => {
              sessionStorage.setItem("launch_complete", "true")
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
        <div className="flex pt-[var(--header-height-desktop)]">
          <Sidebar isOpen={sidebarOpen} />
          <main
            className={`flex-1 min-h-[calc(100vh-var(--header-height-desktop))] flex flex-col justify-between overflow-auto transition-[margin] duration-[var(--duration-normal)] pb-[calc(var(--mobile-tab-height)+1.5rem)] md:pb-0 ${sidebarOpen ? "md:ml-[var(--sidebar-width-default)]" : "md:ml-0"}`}
          >
            <div className="page-shell py-[var(--card-padding-xl)] w-full flex-1 animate-in fade-in slide-in-from-bottom-4 duration-[var(--duration-slower)]">
              {children}
            </div>
            <Footer />
          </main>
          <MobileTabBar />
        </div>
      </>
    )
  }

  // Unauthenticated non-auth page — middleware handles redirect, show nothing
  return null
}
