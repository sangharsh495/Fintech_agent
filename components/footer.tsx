"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/50 py-6 bg-card/10 mt-auto">
      <div className="container-page flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>
          © {new Date().getFullYear()} FinFlow. All rights reserved.
        </div>
        <div className="flex items-center gap-6">
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
        </div>
      </div>
    </footer>
  )
}
