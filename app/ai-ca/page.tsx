"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Send,
  Bot,
  Lock,
  Brain,
  Eye,
  Sparkles,
  Shield,
  Zap,
  Info,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

const GREETING = {
  id: "greeting",
  role: "assistant" as const,
  parts: [
    {
      type: "text" as const,
      text: "Namaste! I'm FinFlow AI, your personal financial assistant. I have access to your real financial data and can answer specific questions about your income, expenses, tax optimization, and savings. How can I help you today?",
    },
  ],
}

interface ChatSessionSummary {
  id: string
  title: string | null
  updatedAt: string
  messageCount?: number
}

function relativeDay(iso: string): string {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ""
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000)
  if (days <= 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? "" : "s"} ago`
  return then.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

function formatInlineMarkdown(text: string): React.ReactNode[] {
  // Split on bold, italic, inline code
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
        <strong key={match.index} className="font-semibold text-foreground">
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
    <div className="my-3 overflow-x-auto rounded-xl border border-border/60 bg-card/60 shadow-xs">
      <table className="w-full text-xs text-left border-collapse">
        {headers.length > 0 && (
          <thead className="bg-secondary/60 text-foreground border-b border-border/60">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3.5 py-2.5 font-semibold text-[11px] uppercase tracking-wider">
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
                  <td key={cIdx} className="px-3.5 py-2 text-muted-foreground font-medium">
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

  // Split code blocks first
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
              className="my-3 rounded-xl overflow-hidden border border-border/80 bg-slate-950 text-slate-100 font-mono text-[11px] shadow-md"
            >
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <span>{lang || "code"}</span>
                <button
                  onClick={() => copyCode(code || "", bIdx)}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
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
              <pre className="p-3.5 overflow-x-auto">
                <code>{code}</code>
              </pre>
            </div>
          )
        }

        // Parse regular lines, headers, lists, and markdown tables
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

          // Table line
          if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
            tableBuffer.push(trimmed)
            return
          } else {
            flushTable(`table-${bIdx}-${lIdx}`)
          }

          if (!trimmed) {
            elements.push(<div key={`empty-${bIdx}-${lIdx}`} className="h-1.5" />)
            return
          }

          // Horizontal rule
          if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
            elements.push(<hr key={`hr-${bIdx}-${lIdx}`} className="my-3 border-border/50" />)
            return
          }

          // Headers
          if (trimmed.startsWith("### ")) {
            elements.push(
              <h4 key={`h4-${bIdx}-${lIdx}`} className="text-xs font-bold text-foreground mt-3 mb-1">
                {formatInlineMarkdown(trimmed.slice(4))}
              </h4>
            )
            return
          }
          if (trimmed.startsWith("## ")) {
            elements.push(
              <h3 key={`h3-${bIdx}-${lIdx}`} className="text-sm font-bold text-foreground mt-3.5 mb-1.5">
                {formatInlineMarkdown(trimmed.slice(3))}
              </h3>
            )
            return
          }
          if (trimmed.startsWith("# ")) {
            elements.push(
              <h2 key={`h2-${bIdx}-${lIdx}`} className="text-base font-extrabold text-foreground mt-4 mb-2">
                {formatInlineMarkdown(trimmed.slice(2))}
              </h2>
            )
            return
          }

          // Bullet list
          if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            elements.push(
              <div key={`li-${bIdx}-${lIdx}`} className="flex items-start gap-2 ml-2 my-0.5">
                <span className="text-primary font-bold mt-1 text-[8px]">•</span>
                <div className="flex-1 text-foreground/90">{formatInlineMarkdown(trimmed.slice(2))}</div>
              </div>
            )
            return
          }

          // Numbered list
          const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
          if (numMatch && numMatch[1] && numMatch[2]) {
            elements.push(
              <div key={`num-${bIdx}-${lIdx}`} className="flex items-start gap-2 ml-2 my-0.5">
                <span className="font-bold text-primary text-[10px] min-w-[14px]">{numMatch[1]}.</span>
                <div className="flex-1 text-foreground/90">{formatInlineMarkdown(numMatch[2])}</div>
              </div>
            )
            return
          }

          // Standard paragraph line
          elements.push(
            <p key={`p-${bIdx}-${lIdx}`} className="text-foreground/90 my-0.5">
              {formatInlineMarkdown(trimmed)}
            </p>
          )
        })

        flushTable(`table-end-${bIdx}`)
        return <div key={bIdx}>{elements}</div>
      })}
    </div>
  )
}

export default function AICAsPage() {
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [historyLoading, setHistoryLoading] = useState(false)

  const { messages: chatMessages, sendMessage, setMessages, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: {
        currentPath: typeof window !== "undefined" ? window.location.pathname : "/ai-ca",
      },
    }),
    messages: [GREETING],
  })

  const [input, setInput] = useState("")
  const isLoading = status === "streaming" || status === "submitted"
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const loadSessions = useCallback(async (): Promise<ChatSessionSummary[]> => {
    try {
      const res = await fetch("/api/ai/sessions")
      if (!res.ok) return []
      const data = await res.json()
      const list: ChatSessionSummary[] = data.sessions ?? []
      setSessions(list)
      return list
    } catch {
      return []
    } finally {
      setSessionsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions().then((list) => {
      if (list.length > 0 && list[0]) setCurrentSessionId(list[0].id)
    })
  }, [loadSessions])

  useEffect(() => {
    if (!currentSessionId) return
    let cancelled = false
    setHistoryLoading(true)

    fetch(`/api/ai/sessions/${currentSessionId}/messages`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load failed"))))
      .then((data) => {
        if (cancelled) return
        const history = (data.messages ?? []).map((m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          parts: [{ type: "text" as const, text: m.content }],
        }))
        setMessages(history.length > 0 ? history : [GREETING])
      })
      .catch(() => {
        if (!cancelled) setMessages([GREETING])
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [currentSessionId, setMessages])

  const createNewSession = async () => {
    try {
      const res = await fetch("/api/ai/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Consultation", pageContext: "/ai-ca" }),
      })
      if (!res.ok) return
      const { session } = await res.json()
      setSessions((prev) => [session, ...prev])
      setCurrentSessionId(session.id)
      setMessages([GREETING])
    } catch {
      /* best effort fallback */
    }
  }

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const remaining = sessions.filter((s) => s.id !== id)
    setSessions(remaining)
    if (currentSessionId === id) {
      setCurrentSessionId(remaining[0]?.id ?? null)
      if (!remaining[0]) setMessages([GREETING])
    }
    try {
      await fetch(`/api/ai/sessions/${id}`, { method: "DELETE" })
    } catch {
      loadSessions()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const textToSend = input.trim()
    sendMessage(
      { parts: [{ type: "text", text: textToSend }] },
      { body: { sessionId: currentSessionId } }
    )
    setInput("")
    if (!currentSessionId) setTimeout(() => { loadSessions() }, 1500)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages, isLoading])

  const suggestedQueries = [
    "How can I save tax for FY 2025-26?",
    "Compare Old vs New regime for my income",
    "What deductions can I claim under 80C and 80D?",
    "How are capital gains taxed in India?",
  ]

  const securitySteps = [
    { num: 1, title: "Data Upload", desc: "Statements are parsed in-memory without persistent storage of raw files." },
    { num: 2, title: "Deterministic Core", desc: "Every calculation verified against statutory Income Tax Act rules." },
    { num: 3, title: "Aggregation & Sandbox", desc: "AI consults strictly anonymized summaries, protecting personal identifiers." },
    { num: 4, title: "Actionable Insights", desc: "Get citations, tax computation tables, and regime recommendations." },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-4.5rem)] max-h-[calc(100vh-4.5rem)] overflow-hidden bg-background">
      {/* Top Bar Header */}
      <div className="px-4 md:px-6 py-3 border-b border-border/50 bg-card/60 backdrop-blur-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-foreground">FinFlow Virtual CA</h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Tax Intelligence
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Statutory guidance calibrated for Indian Tax Law & FY 2025–26 rules
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={createNewSession}
            className="flex items-center gap-1.5 h-8 text-xs font-semibold rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Consultation</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 min-h-0 px-3 md:px-6 py-3 grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column - History Sidebar */}
        <div className="hidden lg:flex lg:col-span-3 flex-col h-full min-h-0">
          <Card className="flex flex-col h-full min-h-0 border-border/50 bg-card/40 backdrop-blur-md rounded-2xl p-3.5 overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-1 mb-2.5 pb-2 border-b border-border/40 shrink-0">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Consultations</span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded font-mono">
                {sessions.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
              {sessionsLoading && (
                <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading consultations...
                </div>
              )}

              {!sessionsLoading && sessions.length === 0 && (
                <div className="text-center py-8 px-2">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground font-medium">No past consultations</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Ask a tax or finance question to start.</p>
                </div>
              )}

              {sessions.map((chat) => (
                <div
                  key={chat.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setCurrentSessionId(chat.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setCurrentSessionId(chat.id)
                  }}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all cursor-pointer group select-none",
                    currentSessionId === chat.id
                      ? "bg-primary/10 text-primary border border-primary/20 font-semibold"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground border border-transparent"
                  )}
                >
                  <MessageSquare
                    className={cn(
                      "w-3.5 h-3.5 shrink-0",
                      currentSessionId === chat.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-foreground font-medium text-xs">{chat.title || "New Consultation"}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">{relativeDay(chat.updatedAt)}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete consultation ${chat.title || ""}`}
                    onClick={(e) => deleteSession(chat.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 rounded-md cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Center Column - Active Chat */}
        <div className="lg:col-span-6 flex flex-col h-full min-h-0">
          <Card className="flex flex-col h-full min-h-0 border-border/50 bg-card/45 backdrop-blur-xl rounded-2xl overflow-hidden shadow-xs">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-5 space-y-4 custom-scrollbar">
              {historyLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Loading messages...
                </div>
              )}

              {chatMessages.map((message) => {
                const isUser = (message.role as string) === "user"
                const contentText =
                  Array.isArray(message.parts) && message.parts.length > 0
                    ? message.parts.map((p) => (p.type === "text" ? (p as { text: string }).text : "")).join("")
                    : typeof (message as any)?.content === "string"
                    ? (message as any).content
                    : ""

                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex w-full animate-in fade-in slide-in-from-bottom-1 duration-200",
                      isUser ? "justify-end" : "justify-start"
                    )}
                  >
                    {!isUser && (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mr-2 shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[88%] px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-xs",
                        isUser
                          ? "bg-primary text-primary-foreground rounded-br-xs font-medium"
                          : "bg-secondary/40 text-foreground rounded-bl-xs border border-border/50"
                      )}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap break-words">{contentText}</p>
                      ) : (
                        <FormattedContent text={contentText} />
                      )}
                    </div>
                  </div>
                )
              })}

              {isLoading && (
                <div className="flex justify-start items-center gap-2 animate-in fade-in duration-200">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-secondary/40 px-3.5 py-2.5 rounded-2xl rounded-bl-xs border border-border/50 flex items-center gap-2 text-xs text-muted-foreground shadow-xs">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>Analyzing your tax position & formulating advice...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Bar & Suggested Prompts */}
            <div className="p-3 bg-card border-t border-border/40 shrink-0">
              {chatMessages.length <= 2 && (
                <div className="mb-2.5">
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedQueries.map((query, i) => (
                      <button
                        key={i}
                        type="button"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-all border border-border/50 cursor-pointer"
                        onClick={() => setInput(query)}
                      >
                        <Zap className="w-2.5 h-2.5 text-primary" />
                        {query}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your taxes, salary deductions, 80C/80D, investments..."
                  className="w-full pl-3.5 pr-11 py-2.5 rounded-xl border border-border bg-secondary/30 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="absolute right-1.5 h-7 w-7 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground disabled:opacity-40 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Right Column - Compliance & Protection */}
        <div className="hidden lg:flex lg:col-span-3 flex-col h-full min-h-0">
          <Card className="p-4 border-border/50 bg-card/40 backdrop-blur-md rounded-2xl h-full min-h-0 flex flex-col justify-between overflow-y-auto custom-scrollbar shadow-xs">
            <div>
              <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border/40">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-foreground">Security & Accuracy</h2>
                  <p className="text-[9px] text-muted-foreground">Bank-grade data isolation</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {securitySteps.map((step) => (
                  <div key={step.num} className="flex gap-2.5 items-start">
                    <div className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[9px] font-bold text-primary shrink-0 mt-0.5">
                      {step.num}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-foreground leading-tight">{step.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/15 flex gap-2 shrink-0">
              <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Advisory is computed deterministically using the official Income Tax Act 1961 formulas.
              </p>
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}