"use client"

import { useRouter } from "next/navigation"
import { UploadStatement } from "@/components/upload-statement"
import { Card } from "@/components/ui/card"
import { Upload, Zap, Shield, Clock } from "lucide-react"

export default function UploadPage() {
  const router = useRouter()

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/5 mb-8">
        <div className="absolute top-0 right-1/4 w-[24rem] h-[24rem] bg-primary/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000" />
        <div className="absolute bottom-0 left-1/4 w-[24rem] h-[24rem] bg-accent/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000 delay-300" />

        <div className="relative z-10 px-6 lg:px-8 py-12 md:py-16 flex flex-col items-center justify-center text-center">
          <div className="section-header slide-in-from-bottom-4 max-w-2xl float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md">
              <Upload className="w-4 h-4" />
              Upload Data
            </div>
            <h1 className="text-h1 md:text-display-md font-extrabold tracking-tight mb-4 text-foreground drop-shadow-sm">
              Upload <span className="text-gradient">Bank Statement</span>
            </h1>
            <p className="text-body-xl text-muted-foreground w-full max-w-2xl mx-auto">
              Add your transaction data to unlock AI insights, ML clustering, and tax calculations.
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto w-full">
          {/* Feature Highlights */}
          <section aria-label="Features" className="mb-8">
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { icon: Zap, title: "Instant Processing", desc: "Transactions extracted & categorized automatically" },
                { icon: Shield, title: "Privacy First", desc: "Your data is encrypted and never shared" },
                { icon: Clock, title: "Smart Deduplication", desc: "Monthly uploads merge seamlessly" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-4 rounded-xl border border-border bg-card slide-in-from-bottom-4" style={{ animationDelay: '100ms' }}>
                  <Icon className="w-5 h-5 text-primary mb-2" />
                  <p className="text-body-sm font-semibold">{title}</p>
                  <p className="text-body-xs text-muted-foreground mt-1">{desc}</p>
                </div>
              ))}
            </div>

            {/* Upload Widget */}
            <Card className="p-6 card-hover">
              <UploadStatement onSuccess={() => setTimeout(() => router.push("/"), 2000)} />
            </Card>

            {/* Supported Formats */}
            <div className="mt-6 p-5 rounded-xl bg-muted/30 border border-border slide-in-from-bottom-4">
              <p className="text-body-sm font-semibold mb-3">How to get your bank statement</p>
              <div className="space-y-2 text-body-sm text-muted-foreground">
                <div><span className="font-medium text-foreground">PDF:</span> Download from your bank's internet banking portal → Statements → Download</div>
                <div><span className="font-medium text-foreground">Excel:</span> Some banks offer Excel export from the transaction history page</div>
                <div><span className="font-medium text-foreground">CSV:</span> HDFC, ICICI and most major banks support CSV export</div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}