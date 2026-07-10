"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import Navbar from "@/components/navbar"
import Sidebar from "@/components/sidebar"
import MobileTabBar from "@/components/mobile-tab-bar"
import { useIsMobile } from "@/components/ui/use-mobile"

export default function ClientLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
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
            <div className="max-w-[480px] md:max-w-none w-full mx-auto">
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
