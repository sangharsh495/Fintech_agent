"use client"

import React, { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  Maximize2,
  RotateCcw,
  Bot,
  User,
  Check,
  Copy,
  ChevronDown,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIWidgetProps {
  pageContext?: string
  defaultOpen?: boolean
  contextTypes?: string[]
  maxTokens?: number
}

// ─── Inline Markdown & Table Formatting ───────────────────────────
function formatInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = []
  let cursor = 0
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > cursor) {
      parts.push(text.slice(cursor, match.index))
    }
    const token = match[0]
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-bold text-foreground">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={match.index} className="italic text-foreground/90">
          {token.slice(1, -1)}
        </em>
      )
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-secondary/80 text-foreground font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      )
    }
    cursor = regex.lastIndex
  }

  if (cursor < text.length) {
    parts.push(text.slice(cursor))
  }

  return parts.length > 0 ? parts : [text]
}

function MarkdownTable({ lines }: { lines: string[] }) {
  if (lines.length < 2) return null
  const headerLine = lines[0] || ""
  const dataLines = lines.slice(1).filter((l) => !l.match(/^\|?\s*[-:]+[-| :]*$/))

  const parseCells = (row: string) =>
    row
      .split("|")
      .map((c) => c.trim())
      .filter((_, i, arr) => i > 0 && i < arr.length - 1)

  const headers = parseCells(headerLine)

  return (
    <div className="my-2 overflow-x-auto rounded-lg border border-border/70 bg-card/70 shadow-xs">
      <table className="w-full text-[11px] text-left border-collapse">
        {headers.length > 0 && (
          <thead className="bg-secondary/70 text-foreground border-b border-border/70">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-2.5 py-1.5 font-bold uppercase tracking-wider text-[10px]">
                  {formatInlineMarkdown(h)}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-border/40">
          {dataLines.map((row, rIdx) => {
            const cells = parseCells(row)
            return (
              <tr key={rIdx} className="hover:bg-secondary/30 transition-colors">
                {cells.map((cell, cIdx) => (
                  <td key={cIdx} className="px-2.5 py-1.5 text-muted-foreground font-medium whitespace-nowrap">
                    {formatInlineMarkdown(cell)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function FormattedContent({ text }: { text: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const blocks = text.split(/(```[\s\S]*?```)/g)

  return (
    <div className="space-y-1.5 leading-relaxed text-xs">
      {blocks.map((block, bIdx) => {
        if (block.startsWith("```")) {
          const match = block.match(/```(\w*)\n([\s\S]*?)```/)
          const lang = match ? match[1] : ""
          const code = match ? match[2] : block.slice(3, -3)
          return (
            <div
              key={bIdx}
              className="my-2 rounded-lg overflow-hidden border border-border/80 bg-slate-950 text-slate-100 font-mono text-[10px] shadow-sm"
            >
              <div className="flex items-center justify-between px-3 py-1 bg-slate-900 border-b border-slate-800 text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                <span>{lang || "code"}</span>
                <button
                  onClick={() => copyCode(code || "", bIdx)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedIndex === bIdx ? (
                    <>
                      <Check className="w-2.5 h-2.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-2.5 h-2.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-2.5 overflow-x-auto">
                <code>{code}</code>
              </pre>
            </div>
          )
        }

        const rawLines = block.split("\n")
        const elements: React.ReactNode[] = []
        let tableBuffer: string[] = []

        const flushTable = (key: string) => {
          if (tableBuffer.length > 0) {
            elements.push(<MarkdownTable key={key} lines={[...tableBuffer]} />)
            tableBuffer = []
          }
        }

        rawLines.forEach((line, lIdx) => {
          const trimmed = line.trim()

          if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            tableBuffer.push(trimmed)
            return
          } else {
            flushTable(`table-${bIdx}-${lIdx}`)
          }

          if (!trimmed) {
            elements.push(<div key={`empty-${bIdx}-${lIdx}`} className="h-1" />)
            return
          }

          if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
            elements.push(<hr key={`hr-${bIdx}-${lIdx}`} className="my-2 border-border/50" />)
            return
          }

          if (trimmed.startsWith("### ")) {
            elements.push(
              <h4 key={`h4-${bIdx}-${lIdx}`} className="text-xs font-bold text-foreground mt-2 mb-0.5">
                {formatInlineMarkdown(trimmed.slice(4))}
              </h4>
            )
            return
          }
          if (trimmed.startsWith("## ")) {
            elements.push(
              <h3 key={`h3-${bIdx}-${lIdx}`} className="text-xs font-extrabold text-foreground mt-2.5 mb-1 text-primary">
                {formatInlineMarkdown(trimmed.slice(3))}
              </h3>
            )
            return
          }
          if (trimmed.startsWith("# ")) {
            elements.push(
              <h2 key={`h2-${bIdx}-${lIdx}`} className="text-sm font-extrabold text-foreground mt-3 mb-1">
                {formatInlineMarkdown(trimmed.slice(2))}
              </h2>
            )
            return
          }

          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            elements.push(
              <div key={`li-${bIdx}-${lIdx}`} className="flex items-start gap-1.5 my-0.5">
                <span className="text-primary mt-1 text-[8px]">●</span>
                <span className="flex-1 text-foreground/90">{formatInlineMarkdown(trimmed.slice(2))}</span>
              </div>
            )
            return
          }

          if (/^\d+\.\s/.test(trimmed)) {
            const numMatch = trimmed.match(/^(\d+\.)\s(.*)/)
            if (numMatch) {
              elements.push(
                <div key={`ol-${bIdx}-${lIdx}`} className="flex items-start gap-1.5 my-0.5">
                  <span className="text-primary font-bold text-[10px] min-w-[14px]">{numMatch[1]}</span>
                  <span className="flex-1 text-foreground/90">{formatInlineMarkdown(numMatch[2])}</span>
                </div>
              )
              return
            }
          }

          elements.push(
            <p key={`p-${bIdx}-${lIdx}`} className="text-foreground/90 my-0.5">
              {formatInlineMarkdown(line)}
            </p>
          )
        })

        flushTable(`table-end-${bIdx}`)
        return <div key={bIdx}>{elements}</div>
      })}
    </div>
  )
}

// ─── Main Floating AI Copilot Widget ─────────────────────────────
export function AIWidget({
  pageContext = "/",
  defaultOpen = false,
  contextTypes = ["profile", "transactions", "tax", "analytics", "summary"],
  maxTokens = 2000,
}: AIWidgetProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const currentPath = pageContext || pathname || "/"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const sendMessage = async (presetText?: string) => {
    const textToSend = (presetText || input).trim()
    if (!textToSend || isLoading || !session) return

    setInput("")
    setIsLoading(true)
    setError(null)

    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: textToSend, timestamp: new Date() },
    ]
    setMessages(updatedMessages)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          currentPath,
          contextTypes,
          maxTokens,
        }),
      })

      if (!response.ok) {
        let errMessage = "Virtual CA is currently unavailable"
        try {
          const errData = await response.json()
          errMessage = errData.error || errData.message || errMessage
        } catch {
          errMessage = `Server error (${response.status})`
        }
        throw new Error(errMessage)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          if (chunk.includes("0:")) {
            const lines = chunk.split("\n")
            for (const line of lines) {
              if (line.startsWith("0:")) {
                try {
                  assistantContent += JSON.parse(line.slice(2))
                } catch {
                  assistantContent += line.slice(2).replace(/^"/, "").replace(/"$/, "")
                }
              }
            }
          } else {
            assistantContent += chunk
          }

          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last && last.role === "assistant") {
              return [...prev.slice(0, -1), { ...last, content: assistantContent }]
            }
            return [...prev, { role: "assistant", content: assistantContent, timestamp: new Date() }]
          })
        }
      }
    } catch (err: any) {
      setError(err?.message || "Failed to reach AI Virtual CA")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError(null)
  }

  const quickActions = getQuickActions(currentPath)
  const pageLabel = currentPath === "/" ? "Dashboard" : currentPath.replace("/", "").toUpperCase()

  // Suppress floating widget if user is already on the dedicated /ai-ca page
  if (currentPath === "/ai-ca") {
    return null
  }

  if (!session) {
    return (
      <Button
        onClick={() => router.push("/auth/login")}
        variant="outline"
        size="sm"
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 gap-2 bg-card/90 backdrop-blur-xl border-primary/30 shadow-lg hover:border-primary"
      >
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-semibold text-xs">Sign in for Virtual CA</span>
      </Button>
    )
  }

  return (
    <>
      {/* Sleek Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300 group border border-primary/40 cursor-pointer"
          aria-label="Open FinFlow Copilot"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 transition-transform group-hover:rotate-12 duration-300" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse ring-2 ring-primary" />
          </div>
          <span className="text-xs tracking-wide">Ask Virtual CA</span>
        </button>
      )}

      {/* Floating Copilot Card */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-[400px] sm:w-[440px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-8rem)] md:max-h-[calc(100vh-5rem)] rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-2xl shadow-[0_12px_48px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-label="FinFlow Copilot"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-secondary/30">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-foreground">FinFlow Copilot</span>
                  <span className="text-[10px] font-semibold text-primary px-1.5 py-0.2 rounded bg-primary/10 border border-primary/20">
                    {pageLabel}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">AI Tax & Financial Advisory</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Clear conversation"
                onClick={clearChat}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
              <Link
                href="/ai-ca"
                className="inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                title="Expand to Full Virtual CA Page"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                title="Close"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <ScrollArea className="flex-1 p-3.5">
            {messages.length === 0 ? (
              <div className="space-y-4 py-2">
                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
                    <Bot className="w-4 h-4" />
                    <span>FinFlow Virtual CA Ready</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Ask any financial math, tax deduction calculation, SIP compounding, or transaction analysis for your account.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-muted-foreground px-1 uppercase tracking-wider">
                    Quick Suggestions
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {quickActions.map((action, i) => (
                      <button
                        key={i}
                        className="text-left px-3 py-2 rounded-lg bg-secondary/50 hover:bg-primary/10 hover:border-primary/30 border border-border/60 text-xs text-foreground/90 hover:text-foreground transition-all duration-200 flex items-center justify-between group cursor-pointer"
                        onClick={() => sendMessage(action)}
                      >
                        <span>{action}</span>
                        <Send className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs shadow-xs",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-xs"
                          : "bg-secondary/80 border border-border/60 rounded-bl-xs"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <FormattedContent text={msg.content} />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                      <p
                        className={cn(
                          "text-[9px] mt-1.5 text-right font-mono",
                          msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground/70"
                        )}
                      >
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2 items-center text-xs text-muted-foreground py-1">
                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    </div>
                    <span className="animate-pulse">Computing financial breakdown...</span>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Error Alert */}
          {error && (
            <div className="mx-3 mb-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-lg text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Input Footer */}
          <div className="p-3 border-t border-border/80 bg-background/80 backdrop-blur-md">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about SIP, loan EMI, tax, compounding..."
                disabled={isLoading}
                className="flex-1 h-9 text-xs bg-secondary/50 border-border/70 focus-visible:ring-primary"
                aria-label="Ask AI assistant"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-9 w-9 rounded-lg bg-primary text-primary-foreground shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Real-time Indian tax & wealth calculation engine
            </p>
          </div>
        </div>
      )}
    </>
  )
}

function getQuickActions(path: string): string[] {
  const actions: Record<string, string[]> = {
    "/": [
      "How to grow ₹5,000 over 3 years?",
      "Show my top tax deductions for FY25",
      "Analyze my recent monthly spending",
    ],
    "/dashboard": [
      "Summarize my net worth and cash flow",
      "What are my highest expense categories?",
      "How can I optimize this month's budget?",
    ],
    "/analytics": [
      "Explain my spending patterns and trends",
      "Where am I overspending compared to peers?",
      "Forecast my savings for next quarter",
    ],
    "/tax": [
      "Which tax regime is better for me?",
      "How much tax do I save under Section 87A?",
      "How to claim full 80C & 80D deductions?",
    ],
    "/tax/filing": [
      "Which ITR form (ITR-1 vs ITR-2) applies to me?",
      "Check 3-way reconciliation discrepancies",
      "What deductions do I need documentation for?",
    ],
    "/calculators": [
      "How does ₹5k compound over 3 years?",
      "Calculate EMI for ₹50L home loan at 8.5%",
      "Compare SIP ₹10k vs FD for 5 years",
    ],
    "/upload": [
      "What bank statement formats are supported?",
      "How are duplicate transactions detected?",
      "How to unlock password-protected PDFs?",
    ],
    "/ai-ca": [
      "Run a comprehensive wealth audit",
      "Show all tax optimization opportunities",
      "Calculate early retirement corpus (FIRE)",
    ],
  }

  const normalizedPath = path.split("/")[1] ? `/${path.split("/")[1]}` : "/"
  return actions[normalizedPath] || actions["/"]
}

// Compact floating button export
export function AIFloatingButton({ pageContext = "/" }: { pageContext?: string }) {
  return <AIWidget pageContext={pageContext} defaultOpen={false} />
}