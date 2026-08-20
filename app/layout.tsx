import type React from "react"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import ClientLayout from "./_clientLayout"
import { Providers } from "./providers"
import type { Metadata, Viewport } from "next"

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#090d16" },
  ],
}

export const metadata: Metadata = {
  title: {
    default: "FinFlow — Autonomous Wealth Intelligence & Tax Optimization",
    template: "%s | FinFlow",
  },
  description:
    "Institutional-grade financial intelligence, multi-bank statement ingestion, ML spending clusters, and AI-powered Indian tax optimization.",
  keywords: [
    "Fintech",
    "Tax Optimization",
    "ITR-1 Filing",
    "Wealth Intelligence",
    "Personal Finance",
    "SIP Calculator",
    "Virtual CA",
    "Income Tax India",
    "Net Worth Tracker",
  ],
  authors: [{ name: "FinFlow Team" }],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-primary">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  )
}

