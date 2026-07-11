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
        <div className="flex pt-16">
          <Sidebar isOpen={sidebarOpen} />
          <main
            className={`flex-1 overflow-auto transition-all duration-300 pb-28 md:pb-0 ${sidebarOpen ? "md:ml-64" : "md:ml-0"}`}
          >
            <div className="container-page py-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              {children}
            </div>
          </main>
          <MobileTabBar />
        </div>
      </>
    )
  }

  // Unauthenticated non-auth page — middleware handles redirect, show nothing
  return null
}
