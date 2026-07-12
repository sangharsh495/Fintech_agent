"use client"

import { useRouter } from "next/navigation"
import { Clock, FileSpreadsheet, FileText, Shield, Upload, Zap } from "lucide-react"

import { AIWidget } from "@/components/ai-sidebar"
import { UploadStatement } from "@/components/upload-statement"
import { Card, CardContent } from "@/components/ui/card"

export default function UploadPage() {
  const router = useRouter()

  return (
    <div className="min-h-[calc(100vh-var(--header-height-desktop))] bg-background">
      <main className="mx-auto w-full max-w-[var(--content-max-md)] py-[var(--section-spacing-desktop)]">
        <header className="mb-[var(--card-padding-xl)] text-center">
          <Upload className="mx-auto mb-4 size-[var(--icon-3xl)] text-primary" />
          <h1 className="app-heading-1">Upload Bank Statement</h1>
          <p className="app-body-lg app-muted mt-2">
            Add PDF, Excel, or CSV statements to unlock analytics, calculators, and tax intelligence.
          </p>
        </header>

        <section className="mb-[var(--card-padding-lg)] grid gap-3 md:grid-cols-3">
          {[
            { icon: Zap, title: "Fast parsing", desc: "Extract transactions quickly." },
            { icon: Shield, title: "Private by design", desc: "Sensitive data stays protected." },
            { icon: Clock, title: "Clean history", desc: "Uploads merge with existing data." },
          ].map(({ icon: Icon, title, desc }) => (
            <Card key={title}>
              <CardContent className="p-[var(--card-padding-md)]">
                <Icon className="mb-2 size-[var(--icon-lg)] text-primary" />
                <p className="app-body-sm font-semibold">{title}</p>
                <p className="app-body-sm app-muted mt-1">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <Card>
          <CardContent className="p-[var(--card-padding-xl)]">
            <div className="rounded-[var(--radius-lg)] border-2 border-dashed border-border bg-muted p-[var(--card-padding-xl)] text-center transition-colors hover:border-primary">
              <UploadStatement onSuccess={() => setTimeout(() => router.push("/"), 2000)} />
            </div>
          </CardContent>
        </Card>

        <section className="mt-[var(--card-padding-lg)] rounded-[var(--radius-lg)] border border-border bg-card p-[var(--card-padding-lg)]">
          <h2 className="app-heading-3 mb-4">Supported formats</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: FileText, label: "PDF statements" },
              { icon: FileSpreadsheet, label: "Excel exports" },
              { icon: FileText, label: "CSV transaction files" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-muted p-4">
                <Icon className="size-[var(--icon-md)] text-primary" />
                <span className="app-body-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <AIWidget pageContext="/upload" defaultOpen={false} contextTypes={["profile", "transactions"]} maxTokens={1500} />
    </div>
  )
}
