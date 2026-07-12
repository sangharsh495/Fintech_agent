"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Upload, BarChart3, Bot, Calculator, ArrowRight, Building2 } from "lucide-react"

type Section = "dashboard" | "analytics" | "transactions" | "ai-ca" | "tax"

interface EmptyStateProps {
  section: Section
  hasBank?: boolean
}

const SECTION_CONFIG: Record<
  Section,
  {
    icon: React.ReactNode
    title: string
    description: string
    cta: string
    ctaHref: string
  }
> = {
  dashboard: {
    icon: <BarChart3 className="w-10 h-10 text-primary/60" />,
    title: "Your financial overview awaits",
    description:
      "Your financial overview will appear here once you upload a bank statement. See your balance, income, expenses, and trends at a glance.",
    cta: "Upload Your First Statement",
    ctaHref: "/upload",
  },
  analytics: {
    icon: <BarChart3 className="w-10 h-10 text-primary/60" />,
    title: "Insights powered by AI",
    description:
      "Spending patterns, cluster insights, and trends will be revealed after your first upload. Our ML engine categorizes and analyzes every transaction.",
    cta: "Upload Statement to Unlock",
    ctaHref: "/upload",
  },
  transactions: {
    icon: <ArrowRight className="w-10 h-10 text-primary/60" />,
    title: "No transactions yet",
    description:
      "Your transaction history will appear here once you upload a bank statement. Filter by bank, category, date range, and more.",
    cta: "Upload Bank Statement",
    ctaHref: "/upload",
  },
  "ai-ca": {
    icon: <Bot className="w-10 h-10 text-primary/60" />,
    title: "Your AI Financial Assistant",
    description:
      "Your AI financial assistant will be able to answer personalized questions about your finances after data upload. Ask anything — from spending habits to tax optimization.",
    cta: "Add Data to Chat",
    ctaHref: "/upload",
  },
  tax: {
    icon: <Calculator className="w-10 h-10 text-primary/60" />,
    title: "Tax calculations need your data",
    description:
      "Tax calculations will be based on your actual salary and deductions detected from uploaded statements. Old vs New regime comparison, Section 80C, 80D, HRA, and more.",
    cta: "Upload Statement for Tax Insights",
    ctaHref: "/upload",
  },
}

export function EmptyState({ section, hasBank = false }: EmptyStateProps) {
  const config = SECTION_CONFIG[section]

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      {/* Blurred Preview Skeleton */}
      <div className="w-full max-w-2xl mb-8 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background z-10" />
        <div className="space-y-3 opacity-30 blur-[2px] pointer-events-none select-none">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-muted border border-border" />
            ))}
          </div>
          <div className="h-48 rounded-xl bg-muted border border-border" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 rounded-xl bg-muted border border-border" />
            <div className="h-32 rounded-xl bg-muted border border-border" />
          </div>
        </div>
      </div>

      {/* Empty State Content */}
      <div className="text-center max-w-md space-y-4">
        <div className="mx-auto flex size-[var(--avatar-2xl)] items-center justify-center rounded-[var(--radius-lg)] border border-primary/20 bg-primary/10">
          {config.icon}
        </div>
        <div>
          <h3 className="app-heading-3 mb-2">{config.title}</h3>
          <p className="app-body-sm app-muted">{config.description}</p>
        </div>

        {!hasBank ? (
          <div className="space-y-3">
            <Link href="/onboarding">
              <Button className="w-full flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Add Your Bank Account First
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">Takes 30 seconds. No bank login required.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Link href={config.ctaHref}>
              <Button className="w-full flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {config.cta}
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              Supports PDF, Excel (.xlsx), and CSV bank statements
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
