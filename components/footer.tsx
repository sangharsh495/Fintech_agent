"use client"

import Link from "next/link"

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-border bg-card/10 py-6">
      <div className="page-shell flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground md:flex-row">
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
