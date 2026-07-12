"use client"

import React, { useState } from "react"
import { Bot, Brain, Info, Lock, MessageSquare, Plus, Send, Shield, Sparkles, Zap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const mockChatHistory = [
  { id: "c1", title: "Tax regime comparison", date: "Today" },
  { id: "c2", title: "June expense analysis", date: "Yesterday" },
  { id: "c3", title: "Rent deduction under 80GG", date: "4 days ago" },
  { id: "c4", title: "FD vs RD return", date: "1 week ago" },
]

const mockMessages = [
  {
    id: "m1",
    role: "assistant",
    text: "Namaste. I am your FinFlow AI shell. This static preview shows how financial guidance, tax notes, and code-style explanations will render.",
  },
  {
    id: "m2",
    role: "user",
    text: "Show me how a tax-saving recommendation might look.",
  },
  {
    id: "m3",
    role: "assistant",
    text: "A recommendation can combine regime comparison, deductions, and risk notes.\n\n```text\nOld regime: review 80C and 80D limits\nNew regime: compare after standard deduction\nAction: verify rent, insurance, and investment proofs\n```",
  },
]

const securitySteps = [
  { num: 1, title: "Data Upload", desc: "Statements are uploaded through the dedicated upload workflow." },
  { num: 2, title: "Protection", desc: "Sensitive data is handled outside this visual shell." },
  { num: 3, title: "Aggregation", desc: "The assistant UI presents summarized financial context." },
  { num: 4, title: "Advice", desc: "Recommendations are displayed with clear supporting details." },
]

const suggestions = [
  "How much did I spend last month?",
  "Which tax regime looks better?",
  "Where can I improve savings?",
  "Explain my largest categories.",
]

function MessageContent({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g)
  return (
    <>
      {parts.map((part, index) => {
        if (!part.startsWith("```")) return <span key={index}>{part}</span>
        const code = part.replace(/```[a-zA-Z]*\n?/, "").replace(/```$/, "")
        return (
          <div key={index} className="my-3 overflow-hidden rounded-[var(--radius-md)] border border-border bg-background font-mono text-xs">
            <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-2">
              <span className="text-muted-foreground">code</span>
              <button className="min-h-[var(--touch-target-min)] text-primary">Copy</button>
            </div>
            <pre className="overflow-x-auto p-4"><code>{code}</code></pre>
          </div>
        )
      })}
    </>
  )
}

export default function AICAsPage() {
  const [selectedChatId, setSelectedChatId] = useState("c1")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState(mockMessages)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!input.trim()) return
    setMessages((current) => [...current, { id: `local-${Date.now()}`, role: "user", text: input }])
    setInput("")
  }

  return (
    <div className="min-h-[calc(100vh-var(--header-height-desktop))] bg-background">
      <header className="mb-[var(--card-padding-xl)] text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-2 app-body-sm font-medium text-primary">
          <Sparkles className="size-[var(--icon-sm)]" />
          Static shell preview
        </div>
        <h1 className="app-heading-1">AI Virtual Chartered Accountant</h1>
        <p className="app-body-lg app-muted mx-auto mt-2 max-w-[var(--content-max-md)]">
          A token-backed chat interface for financial guidance. This page uses mock data only.
        </p>
      </header>

      <main className="mx-auto grid h-[calc(100vh-13rem)] min-h-[38rem] w-full max-w-[var(--content-max-xl)] grid-cols-1 gap-6 lg:grid-cols-[var(--sidebar-width-default)_minmax(0,1fr)_20rem]">
        <Card className="hidden overflow-hidden lg:flex lg:flex-col">
          <div className="border-b border-border p-[var(--card-padding-lg)]">
            <Button className="w-full">
              <Plus className="size-[var(--icon-sm)]" />
              New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-[var(--card-padding-md)]">
            <p className="app-body-sm app-muted mb-3 font-medium uppercase">History</p>
            <div className="space-y-2">
              {mockChatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={cn(
                    "flex min-h-[var(--touch-target-min)] w-full items-center gap-3 rounded-[var(--radius-md)] p-3 text-left transition-colors hover:bg-muted",
                    selectedChatId === chat.id && "bg-primary text-primary-foreground hover:bg-primary",
                  )}
                >
                  <MessageSquare className="size-[var(--icon-sm)] shrink-0" />
                  <span className="min-w-0">
                    <span className="app-body-md block truncate font-medium">{chat.title}</span>
                    <span className={cn("app-body-sm block truncate", selectedChatId === chat.id ? "opacity-80" : "text-muted-foreground")}>{chat.date}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="flex min-h-0 flex-col overflow-hidden">
          <div className="border-b border-border bg-background p-[var(--card-padding-lg)]">
            <h2 className="app-heading-3 flex items-center gap-2">
              <Brain className="size-[var(--icon-md)] text-primary" />
              Financial guidance session
            </h2>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-[var(--card-padding-xl)]">
            {messages.map((message) => {
              const isUser = message.role === "user"
              return (
                <div key={message.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                  {!isUser && (
                    <div className="mr-3 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Bot className="size-[var(--icon-sm)]" />
                    </div>
                  )}
                  <div className={cn("max-w-[var(--content-max-md)] rounded-[var(--radius-lg)] p-[var(--card-padding-md)] app-body-md", isUser ? "rounded-tr-[var(--radius-xs)] bg-primary text-primary-foreground" : "rounded-tl-[var(--radius-xs)] bg-muted text-foreground")}>
                    <div className="whitespace-pre-wrap break-words"><MessageContent text={message.text} /></div>
                    <div className={cn("mt-2 app-body-sm", isUser ? "text-primary-foreground/80" : "text-muted-foreground")}>Preview</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="border-t border-border bg-background p-[var(--card-padding-xl)]">
            <div className="mb-3 flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button key={suggestion} onClick={() => setInput(suggestion)} className="inline-flex min-h-[var(--touch-target-min)] items-center gap-2 rounded-full border border-border bg-card px-3 app-body-sm hover:bg-muted">
                  <Zap className="size-[var(--icon-xs)] text-primary" />
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a mock financial question..."
                className="min-h-[var(--input-height-md)] flex-1 rounded-[var(--radius-md)] border border-input bg-card px-4 outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <Button type="submit" size="icon" aria-label="Send message">
                <Send className="size-[var(--icon-sm)]" />
              </Button>
            </form>
          </div>
        </Card>

        <Card className="hidden overflow-y-auto p-[var(--card-padding-lg)] lg:block">
          <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
            <div className="flex size-10 items-center justify-center rounded-[var(--radius-md)] bg-primary/10 text-primary">
              <Shield className="size-[var(--icon-md)]" />
            </div>
            <div>
              <h2 className="app-heading-3">Security</h2>
              <p className="app-body-sm app-muted">Static display only</p>
            </div>
          </div>
          <div className="space-y-5">
            {securitySteps.map((step, index) => (
              <div key={step.num} className="relative pl-8">
                {index !== securitySteps.length - 1 && <div className="absolute bottom-[-1.25rem] left-3 top-7 w-px bg-border" />}
                <div className="absolute left-0 top-0 flex size-6 items-center justify-center rounded-full border border-border bg-card app-body-sm font-bold">{step.num}</div>
                <p className="app-body-md font-semibold">{step.title}</p>
                <p className="app-body-sm app-muted">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-3 rounded-[var(--radius-md)] border border-primary/20 bg-primary/10 p-4">
            <Info className="size-[var(--icon-sm)] shrink-0 text-primary" />
            <p className="app-body-sm app-muted">No API calls are made from this shell. It is intentionally disconnected from chat services.</p>
          </div>
          <div className="mt-4 flex gap-3 rounded-[var(--radius-md)] border border-border p-4">
            <Lock className="size-[var(--icon-sm)] shrink-0 text-primary" />
            <p className="app-body-sm app-muted">Use backend chat integration only outside this guarded implementation pass.</p>
          </div>
        </Card>
      </main>
    </div>
  )
}
