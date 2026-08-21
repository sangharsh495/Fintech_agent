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
    { num: 1, title: "Data Upload", desc: "You securely upload your financial documents." },
    { num: 2, title: "Encryption & Hashing", desc: "Data is encrypted end-to-end with AES-256." },
    { num: 3, title: "Aggregation", desc: "AI analyzes only aggregated insights, never raw data." },
    { num: 4, title: "Intelligent Advice", desc: "Get personalized recommendations with privacy intact." },
  ]

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      {/* Hero Header */}
      <div className="relative border-b border-border/40 bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="relative z-10 px-6 py-8 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4 animate-in slide-in-from-bottom-2">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            FinFlow AI
          </div>
          
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight mb-2 text-foreground drop-shadow-sm">
            AI Virtual <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Chartered Accountant</span>
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Get expert guidance on Indian tax laws, financial planning, and wealth optimization with our AI-powered assistant trained on current regulations.
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-6 py-6 max-w-[1440px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[72vh] min-h-[600px]">
          
          {/* Column 1 - Past Chats Sidebar */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 h-full">
            <Card className="flex flex-col h-full border-border/50 bg-card/45 backdrop-blur-xl rounded-2xl p-4 overflow-hidden shadow-xs">
              <Button
                onClick={createNewSession}
                className="w-full flex items-center justify-center gap-2 mb-4 bg-secondary text-secondary-foreground border border-border/60 hover:bg-secondary/80 h-10 font-semibold text-sm cursor-pointer rounded-xl"
              >
                <Plus className="w-4 h-4" />
                New Consultation
              </Button>

              <div className="flex-1 overflow-y-auto space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">History</p>

                {sessionsLoading && (
                  <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Loading history...
                  </div>
                )}

                {!sessionsLoading && sessions.length === 0 && (
                  <p className="px-3 py-2.5 text-[11px] text-muted-foreground leading-relaxed">
                    No past consultations yet. Ask your first question to start one.
                  </p>
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
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all cursor-pointer group",
                      currentSessionId === chat.id
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <MessageSquare className={cn("w-4 h-4 shrink-0", currentSessionId === chat.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-foreground font-semibold">{chat.title || "New Consultation"}</p>
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

          {/* Column 2 - Main Chat Interface */}
          <div className="lg:col-span-6 flex flex-col gap-4 h-full">
            <Card className="flex flex-col flex-1 overflow-hidden border-border/50 shadow-xs bg-card/45 backdrop-blur-xl rounded-2xl h-full">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
                {historyLoading && (
                  <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading this consultation...
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
                        "flex w-full animate-in fade-in slide-in-from-bottom-2",
                        isUser ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2.5 shrink-0 border border-primary/20 shadow-xs">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      )}
                      
                      <div
                        className={cn(
                          "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xs",
                          isUser
                            ? "bg-primary text-primary-foreground rounded-br-none font-medium"
                            : "bg-secondary/40 text-foreground rounded-bl-none border border-border/40"
                        )}
                      >
                        <div className="whitespace-pre-wrap break-words">
                          {isUser ? (
                            <p>{contentText}</p>
                          ) : (
                            <FormattedContent text={contentText} />
                          )}
                        </div>
                        <div className={cn("text-[9px] mt-1 font-medium", isUser ? "text-primary-foreground/75 text-right" : "text-muted-foreground")}>
                          {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {isLoading && (
                  <div className="flex justify-start items-center gap-2.5 animate-in fade-in">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-secondary/40 px-4 py-3 rounded-2xl rounded-bl-none border border-border/40 flex items-center gap-2 shadow-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Formulating advice...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-card border-t border-border/40">
                {chatMessages.length <= 2 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedQueries.map((query, i) => (
                        <button
                          key={i}
                          type="button"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-all border border-border/50 cursor-pointer hover:scale-102 active:scale-98"
                          onClick={() => setInput(query)}
                        >
                          <Zap className="w-3 h-3 text-primary" />
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
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-border bg-secondary/30 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="absolute right-1.5 h-9 w-9 rounded-lg bg-primary hover:bg-primary/95 text-primary-foreground disabled:opacity-40 flex items-center justify-center cursor-pointer transition-transform active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Column 3 - Features / Information Panel */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-4 h-full">
            <Card className="p-5 border-border/50 bg-card/45 backdrop-blur-xl rounded-2xl h-full flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 mb-6 pb-3 border-b border-border/40">
                  <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h2 className="text-sm font-bold text-foreground tracking-tight">Security & Privacy</h2>
                    <p className="text-[10px] text-muted-foreground">Consolidated protection</p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {securitySteps.map((step, idx) => (
                    <div key={step.num} className="relative pl-7">
                      {idx !== securitySteps.length - 1 && (
                        <div className="absolute left-[11px] top-6 bottom-[-20px] w-px bg-border/60" />
                      )}
                      
                      <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-bold text-foreground">
                        {step.num}
                      </div>
                      
                      <div>
                        <p className="font-semibold text-xs text-foreground mb-0.5">{step.title}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-2.5">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  FinFlow AI does not store your raw statements. All analyses are performed in an isolated sandbox environment.
                </p>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}