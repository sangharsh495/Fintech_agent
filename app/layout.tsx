import type React from "react"

import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import ClientLayout from "./_clientLayout"
import { Providers } from "./providers"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          <ClientLayout>{children}</ClientLayout>
        </Providers>
      </body>
    </html>
  )
}

export const metadata = {
  generator: "v0.app",
}
