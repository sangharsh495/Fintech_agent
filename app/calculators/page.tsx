"use client"

import { useState } from "react"
import { ArrowRight, Building2, Calculator, Landmark, PiggyBank, TrendingUp, Wallet } from "lucide-react"

import { AIWidget } from "@/components/ai-sidebar"
import BudgetPlanner from "@/components/calculators/budget-planner"
import EMICalculator from "@/components/calculators/emi-calculator"
import FDCalculator from "@/components/calculators/fd-calculator"
import LoanComparison from "@/components/calculators/loan-comparison"
import RDCalculator from "@/components/calculators/rd-calculator"
import SIPCalculator from "@/components/calculators/sip-calculator"
import UniversalCalculator from "@/components/calculators/universal-calculator"
import { calculatorConfigs, generateGenericConfig } from "@/lib/calculator-configs"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const tools = [
  { id: "emi", name: "EMI Calculator", desc: "Loan payment planning", icon: Calculator, tag: "Loan" },
  { id: "sip", name: "SIP Calculator", desc: "Recurring investment growth", icon: TrendingUp, tag: "Invest" },
  { id: "fd", name: "Fixed Deposit", desc: "Lump sum maturity", icon: Landmark, tag: "Deposit" },
  { id: "rd", name: "Recurring Deposit", desc: "Monthly deposit maturity", icon: PiggyBank, tag: "Deposit" },
  { id: "budget", name: "Budget Planner", desc: "Income and expense planning", icon: Wallet, tag: "Budget" },
  { id: "loan", name: "Loan Comparison", desc: "Compare offers side by side", icon: Building2, tag: "Loan" },
  { id: "tax", name: "Income Tax", desc: "Estimate liability", icon: Calculator, tag: "Tax" },
  { id: "cagr", name: "CAGR", desc: "Annualized return", icon: TrendingUp, tag: "Return" },
]

export default function CalculatorsPage() {
  const [activeCalculator, setActiveCalculator] = useState("emi")
  const activeTool = tools.find((tool) => tool.id === activeCalculator) || tools[0]
  const ActiveIcon = activeTool.icon

  return (
    <div className="min-h-[calc(100vh-var(--header-height-desktop))] bg-background">
      <main className="mx-auto w-full max-w-[var(--content-max-xl)] py-[var(--section-spacing-desktop)]">
        <header className="mb-[var(--card-padding-xl)] text-center">
          <h1 className="app-heading-1">Financial Calculators</h1>
          <p className="app-body-lg app-muted mx-auto mt-2 max-w-[var(--content-max-md)]">
            Use practical tools for loans, deposits, investments, budgets, and tax planning.
          </p>
        </header>

        <section className="mb-[var(--card-padding-xl)] rounded-[var(--radius-lg)] border border-primary bg-primary p-[var(--card-padding-xl)] text-primary-foreground">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="app-body-sm mb-2 font-medium opacity-85">Featured calculator</p>
              <h2 className="app-heading-2 text-primary-foreground">{activeTool.name}</h2>
              <p className="app-body-lg mt-2 opacity-90">{activeTool.desc}</p>
            </div>
            <ActiveIcon className="hidden size-[var(--icon-3xl)] md:block" />
          </div>
        </section>

        <section className="mb-[var(--card-padding-xl)] grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map(({ id, name, desc, icon: Icon, tag }) => {
            const isActive = activeCalculator === id
            return (
              <button
                key={id}
                onClick={() => setActiveCalculator(id)}
                className={cn(
                  "rounded-[var(--radius-lg)] border bg-card p-[var(--card-padding-lg)] text-left shadow-[var(--shadow-md)] transition-[border-color,box-shadow,transform] duration-[var(--duration-normal)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive && "border-primary",
                )}
              >
                <Icon className="mb-4 size-[var(--icon-2xl)] text-primary" />
                <h2 className="app-heading-3">{name}</h2>
                <p className="app-body-md app-muted mt-2">{desc}</p>
                <span className="mt-4 inline-flex rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">{tag}</span>
              </button>
            )
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Card>
            <CardContent className="p-[var(--card-padding-xl)]">
              {activeCalculator === "emi" && <EMICalculator />}
              {activeCalculator === "sip" && <SIPCalculator />}
              {activeCalculator === "fd" && <FDCalculator />}
              {activeCalculator === "rd" && <RDCalculator />}
              {activeCalculator === "budget" && <BudgetPlanner />}
              {activeCalculator === "loan" && <LoanComparison />}
              {!["emi", "sip", "fd", "rd", "budget", "loan"].includes(activeCalculator) && (
                <UniversalCalculator
                  key={activeCalculator}
                  config={calculatorConfigs[activeCalculator] || generateGenericConfig(activeTool.name, activeCalculator)}
                />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-[var(--card-padding-lg)]">
              <h2 className="app-heading-3">Categories</h2>
              <div className="mt-5 space-y-3">
                {["Loans", "Investments", "Deposits", "Tax", "Budgeting"].map((category, index) => (
                  <div key={category} className="flex items-center justify-between rounded-[var(--radius-md)] border border-border p-4">
                    <span className="app-body-md font-medium">{category}</span>
                    <span className="app-body-sm app-muted">{index + 2} tools</span>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-6 w-full">
                Browse all
                <ArrowRight className="size-[var(--icon-sm)]" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <AIWidget pageContext="/calculators" defaultOpen={false} />
    </div>
  )
}
