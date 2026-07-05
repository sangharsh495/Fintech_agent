"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface Loan {
  id: string
  name: string
  principal: number
  rate: number
  tenure: number
}

export default function LoanComparison() {
  const [loans, setLoans] = useState<Loan[]>([
    { id: "1", name: "Bank A", principal: 500000, rate: 8.5, tenure: 5 },
    { id: "2", name: "Bank B", principal: 500000, rate: 8.0, tenure: 5 },
    { id: "3", name: "Bank C", principal: 500000, rate: 7.5, tenure: 5 },
  ])

  const calculateEMI = (principal: number, rate: number, tenure: number) => {
    const R = rate / 100 / 12
    const N = tenure * 12
    return (principal * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1)
  }

  const comparisonData = loans.map((loan) => {
    const emi = calculateEMI(loan.principal, loan.rate, loan.tenure)
    const totalPayable = emi * loan.tenure * 12
    const totalInterest = totalPayable - loan.principal

    return {
      name: loan.name,
      emi: Math.round(emi),
      interest: Math.round(totalInterest),
      total: Math.round(totalPayable),
    }
  })

  const handleUpdate = (id: string, field: string, value: number | string) => {
    setLoans(loans.map((loan) => (loan.id === id ? { ...loan, [field]: value } : loan)))
  }

  return (
    <div className="space-y-6">
      {/* Input Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loans.map((loan) => (
          <Card key={loan.id} className="p-4 card-hover">
            <label className="block text-sm font-semibold mb-3">
              <input
                type="text"
                value={loan.name}
                onChange={(e) => handleUpdate(loan.id, "name", e.target.value)}
                className="w-full px-2 py-1 rounded border border-border bg-card text-foreground mb-2"
              />
            </label>

            <div className="space-y-3 text-sm">
              <label className="block">
                <span className="text-xs text-muted-foreground">Principal</span>
                <input
                  type="number"
                  value={loan.principal}
                  onChange={(e) => handleUpdate(loan.id, "principal", Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-border bg-card text-foreground mt-1"
                />
              </label>

              <label className="block">
                <span className="text-xs text-muted-foreground">Rate (% p.a.)</span>
                <input
                  type="number"
                  step="0.1"
                  value={loan.rate}
                  onChange={(e) => handleUpdate(loan.id, "rate", Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-border bg-card text-foreground mt-1"
                />
              </label>

              <label className="block">
                <span className="text-xs text-muted-foreground">Tenure (years)</span>
                <input
                  type="number"
                  value={loan.tenure}
                  onChange={(e) => handleUpdate(loan.id, "tenure", Number(e.target.value))}
                  className="w-full px-2 py-1 rounded border border-border bg-card text-foreground mt-1"
                />
              </label>
            </div>
          </Card>
        ))}
      </div>

      {/* Comparison Chart */}
      <Card className="p-6 card-hover">
        <h2 className="text-xl font-bold mb-6">EMI Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
              }}
              formatter={(value) => `₹${((value as number) / 1000).toFixed(1)}K`}
            />
            <Legend />
            <Bar dataKey="emi" fill="var(--chart-1)" />
            <Bar dataKey="interest" fill="var(--chart-5)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Detailed Comparison */}
      <Card className="p-6 card-hover">
        <h2 className="text-xl font-bold mb-4">Detailed Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">Bank</th>
                <th className="text-right py-3 px-4 font-semibold">Monthly EMI</th>
                <th className="text-right py-3 px-4 font-semibold">Total Interest</th>
                <th className="text-right py-3 px-4 font-semibold">Total Payable</th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((item, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="py-3 px-4">{item.name}</td>
                  <td className="text-right py-3 px-4 font-semibold">₹{(item.emi / 1000).toFixed(1)}K</td>
                  <td className="text-right py-3 px-4">₹{(item.interest / 100000).toFixed(2)}L</td>
                  <td className="text-right py-3 px-4 font-semibold">₹{(item.total / 100000).toFixed(2)}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
