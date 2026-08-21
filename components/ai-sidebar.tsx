"use client"

import React, { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send,
  X,
  Sparkles,
  Loader2,
  AlertCircle,
  RotateCcw,
  Bot,
  User,
  Check,
  Copy,
  ExternalLink,
  TrendingUp,
  Calculator,
  ShieldCheck,
  Zap,
  ArrowRight,
  HelpCircle,
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
          className="px-1.5 py-0.5 rounded bg-primary/10 text-primary dark:text-primary-foreground font-mono text-[11px] border border-primary/20"
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
    <div className="my-3 overflow-x-auto rounded-xl border border-border/80 dark:border-white/10 bg-card/90 shadow-xs">
      <table className="w-full text-[11px] text-left border-collapse">
        {headers.length > 0 && (
          <thead className="bg-secondary/80 dark:bg-slate-900 text-foreground border-b border-border/80">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
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
              <tr key={rIdx} className="hover:bg-secondary/40 transition-colors">
                {cells.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-foreground/90 font-medium whitespace-nowrap">
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
    <div className="space-y-2 leading-relaxed text-xs">
      {blocks.map((block, bIdx) => {
        if (block.startsWith("```")) {
          const match = block.match(/```(\w*)\n([\s\S]*?)```/)
          const lang = match ? match[1] : ""
          const code = match ? match[2] : block.slice(3, -3)
          return (
            <div
              key={bIdx}
              className="my-2.5 rounded-xl overflow-hidden border border-border/80 bg-slate-950 text-slate-100 font-mono text-[11px] shadow-md"
            >
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  {lang || "Calculation"}
                </span>
                <button
                  onClick={() => copyCode(code || "", bIdx)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer text-[10px]"
                >
                  {copiedIndex === bIdx ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3 overflow-x-auto text-[11px] leading-relaxed text-slate-200">
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
            elements.push(<hr key={`hr-${bIdx}-${lIdx}`} className="my-2.5 border-border/60" />)
            return
          }

          if (trimmed.startsWith("### ")) {
            elements.push(
              <h4 key={`h4-${bIdx}-${lIdx}`} className="text-xs font-bold text-foreground mt-2 mb-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                {formatInlineMarkdown(trimmed.slice(4))}
              </h4>
            )
            return
          }
          if (trimmed.startsWith("## ")) {
            elements.push(
              <h3 key={`h3-${bIdx}-${lIdx}`} className="text-xs font-extrabold text-primary mt-3 mb-1 tracking-wide">
                {formatInlineMarkdown(trimmed.slice(3))}
              </h3>
            )
            return
          }
          if (trimmed.startsWith("# ")) {
            elements.push(
              <h2 key={`h2-${bIdx}-${lIdx}`} className="text-sm font-extrabold text-foreground mt-3.5 mb-1.5">
                {formatInlineMarkdown(trimmed.slice(2))}
              </h2>
            )
            return
          }

          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            elements.push(
              <div key={`li-${bIdx}-${lIdx}`} className="flex items-start gap-2 my-1">
                <span className="text-primary font-bold mt-1 text-[8px]">◆</span>
                <span className="flex-1 text-foreground/90">{formatInlineMarkdown(trimmed.slice(2))}</span>
              </div>
            )
            return
          }

          if (/^\d+\.\s/.test(trimmed)) {
            const numMatch = trimmed.match(/^(\d+\.)\s(.*)/)
            if (numMatch) {
              elements.push(
                <div key={`ol-${bIdx}-${lIdx}`} className="flex items-start gap-2 my-1">
                  <span className="text-primary font-bold text-[11px] min-w-[16px]">{numMatch[1]}</span>
                  <span className="flex-1 text-foreground/90">{formatInlineMarkdown(numMatch[2])}</span>
                </div>
              )
              return
            }
          }

          elements.push(
            <p key={`p-${bIdx}-${lIdx}`} className="text-foreground/90 my-1">
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
  const inputRef = useRef<HTMLInputElement>(null)

  const currentPath = pageContext || pathname || "/"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

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
  const pageLabel = currentPath === "/" ? "Dashboard" : currentPath.replace("/", "").replace(/-/g, " ").toUpperCase()

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
        className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 gap-2.5 px-4 py-2.5 rounded-2xl bg-card/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-primary/40 shadow-xl hover:border-primary transition-all duration-300 hover:scale-102 cursor-pointer group"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <Sparkles className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform" />
        <span className="font-bold text-xs text-foreground">Sign in for Virtual CA</span>
      </Button>
    )
  }

  return (
    <>
      {/* ── World-Class Luxury Floating Trigger Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 group flex items-center gap-3 p-1.5 pr-4 rounded-full bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-white border border-indigo-500/40 shadow-[0_10px_35px_rgba(79,70,229,0.35)] hover:shadow-[0_15px_45px_rgba(79,70,229,0.5)] hover:border-indigo-400 hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer backdrop-blur-xl"
          aria-label="Open FinFlow Virtual CA Copilot"
        >
          {/* Animated Glowing Orb Icon */}
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 via-primary to-purple-500 flex items-center justify-center shadow-inner shadow-white/20">
            <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-slate-950" />
            </span>
          </div>

          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wide bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
                Ask Virtual CA
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI
              </span>
            </div>
            <span className="text-[10px] text-indigo-300/80 font-medium">
              Tax & Wealth Advisory
            </span>
          </div>
        </button>
      )}

      {/* ── Top-Tier Glassmorphic Floating Copilot Card ── */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-50 w-[420px] sm:w-[460px] max-w-[calc(100vw-2rem)] h-[620px] max-h-[calc(100vh-8rem)] md:max-h-[calc(100vh-5rem)] rounded-[28px] border border-indigo-500/30 bg-card/95 dark:bg-slate-950/95 backdrop-blur-3xl shadow-[0_24px_80px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-200 ring-1 ring-white/10"
          role="dialog"
          aria-label="FinFlow Virtual CA Copilot"
        >
          {/* ── Header ── */}
          <div className="relative flex items-center justify-between px-4 py-3.5 border-b border-border/80 dark:border-white/10 bg-secondary/40 dark:bg-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
                <Bot className="w-4 h-4" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-card" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-foreground tracking-tight">FinFlow Copilot</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                    {pageLabel}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-medium">Chartered Accountant Engine</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                title="Reset conversation"
                onClick={clearChat}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
              <Link
                href="/ai-ca"
                className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                title="Open Full Virtual CA Room"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Close Copilot"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* ── Messages & Interactive Feed ── */}
          <ScrollArea className="flex-1 p-4">
            {messages.length === 0 ? (
              <div className="space-y-4 py-2">
                {/* Hero Greeting Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 shadow-xs space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      Welcome to Autonomous Advisory
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    I calculate real-time compounding, Indian tax optimization (Budget '25), loan amortizations, and analyze your uploaded ledger.
                  </p>

                  <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calculator className="w-3 h-3 text-indigo-400" />
                      <span>Math & Projections</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Old vs New Regime</span>
                    </div>
                  </div>
                </div>

                {/* Context-Driven Quick Suggestion Cards */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      Suggested for {pageLabel}
                    </p>
                    <span className="text-[10px] text-primary font-medium">1-Click Run</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    {quickActions.map((action, i) => (
                      <button
                        key={i}
                        className="text-left p-3 rounded-xl bg-secondary/40 hover:bg-primary/10 border border-border/70 hover:border-primary/40 text-xs text-foreground/90 hover:text-foreground transition-all duration-200 flex items-center justify-between group cursor-pointer shadow-xs hover:scale-[1.01]"
                        onClick={() => sendMessage(action)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60 group-hover:bg-primary group-hover:scale-125 transition-all shrink-0" />
                          <span className="font-medium truncate">{action}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 py-1">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-2.5",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[86%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm transition-all",
                        msg.role === "user"
                          ? "bg-gradient-to-r from-primary to-indigo-600 text-primary-foreground font-medium rounded-br-xs shadow-primary/20"
                          : "bg-secondary/70 dark:bg-slate-900/80 border border-border/80 dark:border-white/10 text-foreground rounded-bl-xs"
                      )}
                    >
                      {msg.role === "assistant" ? (
                        <FormattedContent text={msg.content} />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                      
                      <div
                        className={cn(
                          "text-[9px] mt-2 flex items-center justify-end gap-1 font-mono",
                          msg.role === "user" ? "text-primary-foreground/75" : "text-muted-foreground/75"
                        )}
                      >
                        {msg.role === "assistant" && <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />}
                        <span>{msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2.5 items-center py-2">
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-secondary/50 border border-border/60 text-xs text-muted-foreground">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span className="animate-pulse">Computing tax & wealth projections...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* ── Error Banner ── */}
          {error && (
            <div className="mx-4 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1 font-medium">{error}</span>
            </div>
          )}

          {/* ── Input Bar & Footer ── */}
          <div className="p-3.5 border-t border-border/80 dark:border-white/10 bg-background/90 dark:bg-slate-950/90 backdrop-blur-xl">
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask financial math, SIP, tax deduction, EMI..."
                disabled={isLoading}
                className="w-full h-11 pl-4 pr-12 text-xs bg-secondary/50 dark:bg-slate-900 border border-border/80 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground placeholder:text-muted-foreground/70 transition-all shadow-inner"
                aria-label="Ask AI assistant"
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="absolute right-1.5 top-1.5 h-8 w-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-md shadow-primary/20 cursor-pointer disabled:cursor-not-allowed"
                aria-label="Send query"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-muted-foreground/75">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Encrypted • In-Memory Audit</span>
              </span>
              <span>Press Enter ↵</span>
            </div>
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