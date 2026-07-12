"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  Activity,
  ArrowRight,
  BarChart3,
  Building2,
  Calculator,
  FileUp,
  Landmark,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"

import { AIWidget } from "@/components/ai-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardData {
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  netWorth: number
  savingsRate: number
  recentTransactions: any[]
  perBankBalances: Array<{
    bankId: string
    bankName: string
    accountLast4: string | null
    accountType: string
    balance: number
  }>
}

const currency = (value = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)

export default function Dashboard() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [hasData, setHasData] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((json) => {
        setHasData(json.hasData)
        if (json.hasData) {
          setData({
            totalBalance: json.totalBalance || 0,
            monthlyIncome: json.monthlyIncome || 0,
            monthlyExpense: json.monthlyExpense || 0,
            netWorth: json.netWorth || 0,
            savingsRate: json.savingsRate || 0,
            recentTransactions: json.recentTransactions || [],
            perBankBalances: json.perBankBalances || [],
          })
        }
      })
      .catch(() => setHasData(false))
      .finally(() => setIsLoading(false))
  }, [])

  const firstName = session?.user?.name?.split(" ")[0] || "there"
  const summary = data ?? {
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    netWorth: 0,
    savingsRate: 0,
    recentTransactions: [],
    perBankBalances: [],
  }

  const stats = [
    { label: "Net worth", value: currency(summary.netWorth), icon: Wallet, helper: "Across linked accounts" },
    { label: "Monthly inflow", value: currency(summary.monthlyIncome), icon: TrendingUp, helper: "Detected credits" },
    { label: "Monthly outflow", value: currency(summary.monthlyExpense), icon: TrendingDown, helper: "Detected debits" },
    { label: "Savings rate", value: `${summary.savingsRate}%`, icon: ShieldCheck, helper: "Income retained" },
  ]

  return (
    <div className="min-h-[calc(100vh-var(--header-height-desktop))] bg-background">
      <section className="page-section">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="app-body-sm app-muted mb-3">Good to see you, {firstName}</p>
            <h1 className="text-display-lg font-extrabold leading-tight tracking-normal">
              FinFlow
            </h1>
            <p className="app-body-lg app-muted mt-4 max-w-[var(--content-max-md)]">
              A professional command center for statement uploads, spending analytics, tax planning, and AI-assisted finance workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/upload">
                  <FileUp className="size-[var(--icon-md)]" />
                  Upload Statement
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/analytics">
                  View Analytics
                  <ArrowRight className="size-[var(--icon-md)]" />
                </Link>
              </Button>
            </div>
          </div>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Financial Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-36 w-full" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <p className="app-body-sm app-muted">Total balance</p>
                    <p className="numeric-xl mt-1">{currency(summary.totalBalance)}</p>
                  </div>
                  <div className="grid grid-cols-12 items-end gap-2" aria-hidden="true">
                    {[42, 58, 36, 72, 64, 84, 52, 70, 92, 76, 88, 96].map((height, index) => (
                      <div key={index} className="rounded-[var(--radius-xs)] bg-primary/15" style={{ height: `${height}px` }}>
                        <div className="h-1/2 rounded-[var(--radius-xs)] bg-primary" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, helper }) => (
          <Card key={label} variant="default">
            <CardContent className="p-[var(--card-padding-lg)]">
              <Icon className="mb-3 size-[var(--icon-xl)] text-primary" />
              <p className="numeric-lg">{isLoading ? "..." : value}</p>
              <p className="app-body-sm mt-1 font-medium">{label}</p>
              <p className="app-body-sm app-muted mt-1">{helper}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="page-section grid gap-6 lg:grid-cols-3">
        {[
          { icon: BarChart3, title: "Analytics", desc: "Scan cash flow, categories, and month-over-month movement.", href: "/analytics" },
          { icon: Calculator, title: "Calculators", desc: "Plan EMI, SIP, deposits, budgets, and major financial goals.", href: "/calculators" },
          { icon: PieChart, title: "Tax Engine", desc: "Estimate regimes, deductions, cess, and savings opportunities.", href: "/tax" },
        ].map(({ icon: Icon, title, desc, href }) => (
          <Card key={title} variant="interactive">
            <CardContent className="p-[var(--card-padding-lg)]">
              <Icon className="mb-4 size-[var(--icon-2xl)] text-primary" />
              <h2 className="app-heading-3">{title}</h2>
              <p className="app-body-md app-muted mt-2">{desc}</p>
              <Button asChild variant="ghost" className="mt-5 px-0">
                <Link href={href}>
                  Open
                  <ArrowRight className="size-[var(--icon-sm)]" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {(summary.recentTransactions.length ? summary.recentTransactions.slice(0, 5) : [{ description: hasData === false ? "Upload a statement to see activity" : "No recent transactions", amount: 0, date: new Date().toISOString(), type: "debit" }]).map((tx, index) => (
                <div key={tx.id || index} className="flex items-center justify-between gap-4 py-4 first:pt-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-muted text-primary">
                      <Activity className="size-[var(--icon-md)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="app-body-md truncate font-medium">{tx.merchant || tx.description}</p>
                      <p className="app-body-sm app-muted">{new Date(tx.date).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                  <p className="app-body-md font-semibold">{tx.amount ? currency(Number(tx.amount)) : "--"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle>Linked Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(summary.perBankBalances.length ? summary.perBankBalances : [{ bankId: "empty", bankName: "No accounts linked", accountType: "savings", accountLast4: null, balance: 0 }]).map((bank) => (
                <div key={bank.bankId} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-primary/10 text-primary">
                      <Landmark className="size-[var(--icon-md)]" />
                    </div>
                    <div>
                      <p className="app-body-md font-medium">{bank.bankName}</p>
                      <p className="app-body-sm app-muted">{bank.accountType} {bank.accountLast4 ? `••${bank.accountLast4}` : ""}</p>
                    </div>
                  </div>
                  <p className="app-body-md font-semibold">{bank.balance ? currency(bank.balance) : "--"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="page-section">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="grid gap-6 p-[var(--card-padding-xl)] md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Sparkles className="mb-3 size-[var(--icon-2xl)]" />
              <h2 className="app-heading-2 text-primary-foreground">Keep your financial picture current</h2>
              <p className="app-body-lg mt-2 opacity-90">Upload a fresh statement whenever your bank cycle closes.</p>
            </div>
            <Button asChild variant="secondary" size="lg">
              <Link href="/upload">
                Upload Now
                <Building2 className="size-[var(--icon-md)]" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <AIWidget pageContext="/" defaultOpen={false} />
    </div>
  )
}
