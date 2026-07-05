"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

interface BudgetItem {
  id: string
  category: string
  budgeted: number
  spent: number
}

export default function BudgetPlanner() {
  const [items, setItems] = useState<BudgetItem[]>([
    { id: "1", category: "Food", budgeted: 15000, spent: 12500 },
    { id: "2", category: "Transport", budgeted: 8000, spent: 6800 },
    { id: "3", category: "Entertainment", budgeted: 5000, spent: 4200 },
    { id: "4", category: "Utilities", budgeted: 6000, spent: 5800 },
  ])

  const totalBudgeted = items.reduce((sum, item) => sum + item.budgeted, 0)
  const totalSpent = items.reduce((sum, item) => sum + item.spent, 0)
  const remaining = totalBudgeted - totalSpent

  const handleAddCategory = () => {
    setItems([...items, { id: Date.now().toString(), category: "New Category", budgeted: 0, spent: 0 }])
  }

  const handleDelete = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleUpdate = (id: string, field: string, value: number | string) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Budget", value: `₹${(totalBudgeted / 1000).toFixed(1)}K` },
          { label: "Total Spent", value: `₹${(totalSpent / 1000).toFixed(1)}K` },
          {
            label: "Remaining",
            value: `₹${(remaining / 1000).toFixed(1)}K`,
            color: "text-green-600 dark:text-green-400",
          },
        ].map((item, i) => (
          <Card key={i} className="p-4 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-2xl font-bold gradient-text ${item.color || ""}`}>{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Budget Items */}
      <Card className="p-6 card-hover">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Budget Breakdown</h2>
          <Button onClick={handleAddCategory} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item) => {
            const percentage = (item.spent / item.budgeted) * 100
            return (
              <div key={item.id} className="p-4 rounded-lg bg-secondary/50 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.category}
                      onChange={(e) => handleUpdate(item.id, "category", e.target.value)}
                      className="text-sm font-semibold bg-transparent border-b border-border pb-1 w-full mb-2 focus:outline-none focus:border-primary"
                    />
                    <div className="flex gap-4 text-sm">
                      <label>
                        Budgeted:
                        <input
                          type="number"
                          value={item.budgeted}
                          onChange={(e) => handleUpdate(item.id, "budgeted", Number(e.target.value))}
                          className="ml-2 w-20 px-2 py-1 rounded border border-border bg-card text-foreground"
                        />
                      </label>
                      <label>
                        Spent:
                        <input
                          type="number"
                          value={item.spent}
                          onChange={(e) => handleUpdate(item.id, "spent", Number(e.target.value))}
                          className="ml-2 w-20 px-2 py-1 rounded border border-border bg-card text-foreground"
                        />
                      </label>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-border rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${percentage > 100 ? "bg-destructive" : "bg-primary"}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {percentage > 100
                      ? `₹${(item.spent - item.budgeted).toLocaleString()} over budget`
                      : `₹${(item.budgeted - item.spent).toLocaleString()} remaining`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
