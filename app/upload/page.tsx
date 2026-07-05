"use client"

import { useRouter } from "next/navigation"
import { UploadStatement } from "@/components/upload-statement"
import { Card } from "@/components/ui/card"
import { Upload, Zap, Shield, Clock } from "lucide-react"

export default function UploadPage() {
  const router = useRouter()

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col pt-16">
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/5 mb-8">

        {/* Decorative Blurs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000 delay-300"></div>

        <div className="relative z-10 px-6 lg:px-8 py-12 md:py-16 flex flex-col items-center justify-center text-center">
          <div className="section-header slide-up max-w-2xl float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md">
              <Upload className="w-4 h-4" />
              Upload Data
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground drop-shadow-sm">
              Upload <span className="gradient-text">Bank Statement</span>
            </h1>
            <p className="text-lg text-muted-foreground w-full">
              Add your transaction data to unlock AI insights, ML clustering, and tax calculations.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 w-full">

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Zap, title: "Instant Processing", desc: "Transactions extracted & categorized automatically" },
            { icon: Shield, title: "Privacy First", desc: "Your data is encrypted and never shared" },
            { icon: Clock, title: "Smart Deduplication", desc: "Monthly uploads merge seamlessly" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-3 rounded-xl border border-border bg-card">
              <Icon className="w-5 h-5 text-primary mb-2" />
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          ))}
        </div>

        {/* Upload Widget */}
        <Card className="p-6">
          <UploadStatement onSuccess={() => setTimeout(() => router.push("/"), 2000)} />
        </Card>

        {/* Supported Formats */}
        <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border">
          <p className="text-sm font-semibold mb-3">How to get your bank statement</p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><span className="font-medium text-foreground">PDF:</span> Download from your bank's internet banking portal → Statements → Download</div>
            <div><span className="font-medium text-foreground">Excel:</span> Some banks offer Excel export from the transaction history page</div>
            <div><span className="font-medium text-foreground">CSV:</span> HDFC, ICICI and most major banks support CSV export</div>
          </div>
        </div>
      </div>
    </div>
  )
}
