"use client"

import { useState } from "react"
import { Calculator, TrendingUp, Wallet, Building2, Zap, ArrowRight, PiggyBank, Landmark, Shield, Coins, FileText, Anchor, PieChart, Plane, Home, Car, Scale, GraduationCap, Briefcase, Plus, HeartPulse, LineChart } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AIWidget } from "@/components/ai-sidebar"

import EMICalculator from "@/components/calculators/emi-calculator"
import SIPCalculator from "@/components/calculators/sip-calculator"
import BudgetPlanner from "@/components/calculators/budget-planner"
import LoanComparison from "@/components/calculators/loan-comparison"
import FDCalculator from "@/components/calculators/fd-calculator"
import RDCalculator from "@/components/calculators/rd-calculator"
import UniversalCalculator from "@/components/calculators/universal-calculator"
import { calculatorConfigs, generateGenericConfig } from "@/lib/calculator-configs"

const essentialTools = [
  { id: "emi", name: "EMI Calculator", icon: Calculator, desc: "Calculate loan EMIs", color: "from-blue-500 to-cyan-500" },
  { id: "sip", name: "SIP Calculator", icon: TrendingUp, desc: "Plan your investments", color: "from-emerald-500 to-teal-500" },
  { id: "fd", name: "Fixed Deposit", icon: Landmark, desc: "Maturity on lump sum", color: "from-indigo-500 to-purple-500" },
  { id: "rd", name: "Recurring Deposit", icon: PiggyBank, desc: "Maturity on monthly deposits", color: "from-fuchsia-500 to-pink-500" },
]

const moreTools = [
  { id: "budget", name: "Budget Planner", icon: Wallet, color: "from-orange-500 to-amber-500" },
  { id: "loan", name: "Loan Comparison", icon: Building2, color: "from-purple-500 to-pink-500" },
  { id: "retirement", name: "Retirement", icon: Anchor, color: "from-stone-500 to-neutral-500" },
  { id: "inflation", name: "Inflation", icon: ArrowRight, color: "from-red-500 to-rose-500" },
  { id: "ppf", name: "PPF Calculator", icon: Shield, color: "from-amber-600 to-orange-600" },
  { id: "mf", name: "Mutual Fund", icon: PieChart, color: "from-lime-500 to-green-500" },
  { id: "hra", name: "HRA Exemption", icon: Home, color: "from-sky-500 to-blue-500" },
  { id: "networth", name: "Net Worth", icon: LineChart, color: "from-emerald-400 to-emerald-600" },
  { id: "tax", name: "Income Tax", icon: FileText, color: "from-red-400 to-red-600" },
  { id: "cagr", name: "CAGR", icon: TrendingUp, color: "from-cyan-400 to-cyan-600" },
  { id: "epf", name: "EPF Calculator", icon: Briefcase, color: "from-blue-600 to-blue-800" },
  { id: "nps", name: "NPS Calculator", icon: Shield, color: "from-teal-500 to-emerald-600" },
  { id: "swp", name: "SWP Calculator", icon: Coins, color: "from-purple-400 to-purple-600" },
  { id: "car", name: "Car Loan", icon: Car, color: "from-zinc-500 to-zinc-700" },
  { id: "education", name: "Education", icon: GraduationCap, color: "from-yellow-400 to-yellow-600" },
  { id: "insurance", name: "Life Insurance", icon: HeartPulse, color: "from-rose-400 to-rose-600" },
]

const toolDescriptions: Record<string, { title: string, content: React.ReactNode }> = {
  emi: {
    title: "How EMI is Calculated",
    content: (
      <div className="space-y-4 text-muted-foreground text-sm">
        <p>EMI (Equated Monthly Installment) is a fixed payment amount made by a borrower to a lender at a specified date each calendar month. EMIs are applied to both interest and principal each month so that over a specified number of years, the loan is paid off in full.</p>
        <p>The mathematical formula for calculating EMI is: <strong className="text-foreground">E = P × r × (1 + r)^n / ((1 + r)^n - 1)</strong></p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><strong>E</strong> is EMI</li>
          <li><strong>P</strong> is Principal Loan Amount</li>
          <li><strong>r</strong> is rate of interest calculated on monthly basis</li>
          <li><strong>n</strong> is loan tenure in months</li>
        </ul>
      </div>
    )
  },
  sip: {
    title: "Understanding SIP Investments",
    content: (
      <div className="space-y-4 text-muted-foreground text-sm">
        <p>A Systematic Investment Plan (SIP) allows you to invest a fixed amount regularly in mutual fund schemes, typically equity mutual funds. It helps in rupee cost averaging and benefits from the power of compounding.</p>
        <p>Instead of trying to time the market, investing regularly ensures that you buy more units when prices are low and fewer units when prices are high. The power of compounding works best when you invest long-term.</p>
      </div>
    )
  },
  fd: {
    title: "How Fixed Deposits Work",
    content: (
      <div className="space-y-4 text-muted-foreground text-sm">
        <p>A Fixed Deposit (FD) is a financial instrument provided by banks which provides investors a higher rate of interest than a regular savings account, until the given maturity date.</p>
        <p>Interest on FDs is generally compounded quarterly. This means the interest earned in one quarter is added to the principal for the next quarter's interest calculation, resulting in faster compounding of your wealth.</p>
      </div>
    )
  },
  rd: {
    title: "How Recurring Deposits Work",
    content: (
      <div className="space-y-4 text-muted-foreground text-sm">
        <p>A Recurring Deposit (RD) is a special kind of term deposit offered by banks which help people with regular incomes to deposit a fixed amount every month into their recurring deposit account and earn interest at the rate applicable to Fixed Deposits.</p>
        <p>Unlike an FD where you make a lump sum investment, an RD allows you to build your savings gradually through monthly installments.</p>
      </div>
    )
  },
  budget: {
    title: "Understanding Budgeting",
    content: (
      <div className="space-y-4 text-muted-foreground text-sm">
        <p>Budgeting is the process of creating a plan to spend your money. This spending plan is called a budget. Creating this spending plan allows you to determine in advance whether you will have enough money to do the things you need to do or would like to do.</p>
      </div>
    )
  },
  loan: {
    title: "Comparing Loans",
    content: (
      <div className="space-y-4 text-muted-foreground text-sm">
        <p>Loan comparison helps you evaluate different loan offers based on their interest rates, processing fees, and tenure to identify the most cost-effective option for your borrowing needs.</p>
      </div>
    )
  },
}

export default function CalculatorsPage() {
  const [activeCalculator, setActiveCalculator] = useState("emi")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [showMoreTools, setShowMoreTools] = useState(false)

  const activeTool = [...essentialTools, ...moreTools].find((t) => t.id === activeCalculator)

  const handleCalculatorChange = (id: string) => {
    if (id === activeCalculator) return
    setIsTransitioning(true)
    setTimeout(() => {
      setActiveCalculator(id)
      setIsTransitioning(false)
    }, 200)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col pt-16">
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/5">

        {/* Decorative Blurs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000 delay-300"></div>

        <div className="relative z-10 px-4 md:px-6 lg:px-8 py-12 md:py-16 flex flex-col items-center justify-center text-center">
          <div className="section-header slide-up max-w-3xl float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md">
              <Zap className="w-4 h-4" />
              Smart Tools
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground drop-shadow-sm">
              Financial <span className="gradient-text">Tools</span>
            </h1>
            <p className="text-lg text-muted-foreground w-full">
              Powerful calculators for EMI, SIP, budgeting, and loan comparison to help you make smarter financial decisions.
            </p>
          </div>
        </div>
      </div>

      {/* Calculator Selector */}
      <div className="flex-1 px-4 md:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-12">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Essential Tools</h2>
            <p className="text-sm text-muted-foreground hidden sm:block">Frequently used calculators</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
            {essentialTools.map((calc) => {
              const Icon = calc.icon
              const isActive = activeCalculator === calc.id
              return (
                <button
                  key={calc.id}
                  onClick={() => handleCalculatorChange(calc.id)}
                  className={cn(
                    "p-5 rounded-xl border-2 transition-all duration-300 text-left group relative overflow-hidden",
                    isActive
                      ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
                      : "border-border hover:border-primary/50 bg-card hover:shadow-lg",
                  )}
                >
                  <div
                    className={cn(
                      "absolute top-0 right-0 w-20 h-20 rounded-full -mr-10 -mt-10 transition-all duration-500",
                      isActive ? "bg-primary/10" : "bg-secondary group-hover:bg-primary/5",
                    )}
                  />
                  <div className="relative z-10">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all duration-300 bg-gradient-to-br shadow-lg",
                        calc.color,
                        isActive && "scale-110",
                      )}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-bold text-base mb-1">{calc.name}</p>
                    <p className="text-xs text-muted-foreground">{calc.desc}</p>
                    {isActive && (
                      <div className="flex items-center gap-1 text-primary text-xs font-medium mt-2">
                        <span>Active</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Active Calculator Component */}
        <div
          className={cn(
            "transition-all duration-500 scroll-mt-24",
            isTransitioning ? "opacity-0 translate-y-4 scale-[0.98]" : "opacity-100 translate-y-0 scale-100",
          )}
        >
          {activeCalculator === "emi" && <EMICalculator />}
          {activeCalculator === "sip" && <SIPCalculator />}
          {activeCalculator === "fd" && <FDCalculator />}
          {activeCalculator === "rd" && <RDCalculator />}
          {activeCalculator === "budget" && <BudgetPlanner />}
          {activeCalculator === "loan" && <LoanComparison />}
          {!["emi", "sip", "fd", "rd", "budget", "loan"].includes(activeCalculator) && (
            <UniversalCalculator
              key={activeCalculator} // Force re-mount on change so charts animate fresh
              config={calculatorConfigs[activeCalculator] || generateGenericConfig(activeTool?.name || "Tool", activeCalculator)}
            />
          )}
        </div>

        {/* Dynamic Tool Explanation */}
        <div className="mt-12 bg-gradient-to-br from-card to-card/50 border border-primary/10 rounded-3xl p-6 lg:p-8 animate-in slide-in-from-bottom-4 duration-500 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none -mr-10 -mt-20"></div>
          <div className="relative z-10">
            {toolDescriptions[activeCalculator] ? (
              <>
                <h3 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-foreground">
                  <FileText className="w-5 h-5 text-primary" />
                  {toolDescriptions[activeCalculator].title}
                </h3>
                {toolDescriptions[activeCalculator].content}
              </>
            ) : (
              <>
                <h3 className="text-xl font-extrabold mb-4 flex items-center gap-2 text-foreground">
                  <FileText className="w-5 h-5 text-primary" />
                  About this Tool
                </h3>
                <p className="text-muted-foreground text-sm max-w-3xl leading-relaxed">
                  This mathematical financial engine provides interactive data visualization to help you understand your financial projections better. Input your exact parameters using the controls above, and watch the dynamic charts update in real-time to reflect compound growth, interest distributions, and precise totals.
                </p>
              </>
            )}
          </div>
        </div>

        {/* More Tools Section */}
        <div className="space-y-8 pt-16 border-t border-border mt-16 pb-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Looking for specific calculators?</h2>
            <p className="text-muted-foreground max-w-lg">We offer over 30+ specialized financial tools ranging from Income Tax optimizations to Net Worth projections.</p>
            <Button
              onClick={() => setShowMoreTools(!showMoreTools)}
              variant="outline"
              className="mt-4 rounded-full px-8 py-6 flex items-center gap-3 text-base border-primary/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
            >
              <Plus className={cn("w-5 h-5 transition-transform duration-300", showMoreTools && "rotate-45")} />
              {showMoreTools ? "Hide Tools Panel" : "Explore All Tools"}
            </Button>
          </div>

          <div className={cn(
            "pt-8 transition-all duration-500 overflow-hidden",
            showMoreTools ? "opacity-100 max-h-[1000px] translate-y-0" : "opacity-0 max-h-0 -translate-y-4"
          )}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {moreTools.map((calc) => {
                const Icon = calc.icon
                const isActive = activeCalculator === calc.id
                return (
                  <button
                    key={calc.id}
                    onClick={() => {
                      handleCalculatorChange(calc.id)
                      window.scrollTo({ top: 400, behavior: 'smooth' })
                    }}
                    className={cn(
                      "flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-300 text-center hover:shadow-md",
                      isActive
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-105"
                        : "border-border bg-card hover:border-primary/40 hover:-translate-y-1"
                    )}
                  >
                    <div className={cn("w-10 h-10 flex items-center justify-center rounded-lg bg-gradient-to-br shadow-sm", calc.color)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-semibold">{calc.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* AI Assistant Widget - Calculators context */}
      <AIWidget pageContext="/calculators" defaultOpen={false}
        contextTypes={["profile", "summary", "transactions"]}
        maxTokens={1500}
      />
    </div>
  )
}
