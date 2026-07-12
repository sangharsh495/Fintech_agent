"use client"

import React, { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, Bot, Lock, Brain, Eye, Sparkles, Shield, Zap, Info, Loader2, MessageSquare, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const mockChatHistory = [
  { id: "c1", title: "Tax regime comparison", date: "Today" },
  { id: "c2", title: "June expense analysis", date: "Yesterday" },
  { id: "c3", title: "Rent deduction under 80GG", date: "4 days ago" },
  { id: "c4", title: "FD vs RD mutual fund return", date: "1 week ago" },
]

export default function AICAsPage() {
  const { messages: chatMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ 
      api: "/api/ai/chat",
      body: {
        currentPath: typeof window !== "undefined" ? window.location.pathname : "/ai-ca"
      }
    }),
    messages: [
      {
        id: "1",
        role: "assistant",
        parts: [{ type: "text", text: "Namaste! I'm FinFlow AI, your personal financial assistant. I have access to your real financial data and can answer specific questions about your income, expenses, tax optimization, and savings. How can I help you today?" }],
      },
    ],
  })

  const [input, setInput] = useState("")
  const [selectedChatId, setSelectedChatId] = useState("c1")
  const isLoading = status === "streaming" || status === "submitted"
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ parts: [{ type: "text", text: input }] })
    setInput("")
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatMessages])

  const suggestedQueries = [
    "How much did I spend last month?",
    "What's my optimal tax regime this year?",
    "Which category am I overspending on?",
    "How can I improve my savings rate?",
  ]

  const features = [
    {
      icon: Lock,
      title: "Data Privacy",
      desc: "Your data is encrypted & isolated",
    },
    {
      icon: Brain,
      title: "Expert Insights",
      desc: "Based on Indian tax & finance laws",
    },
    {
      icon: Eye,
      title: "Context Aware",
      desc: "Understands your financial profile",
    },
  ]

  const securitySteps = [
    { num: 1, title: "Data Upload", desc: "You securely upload your financial documents." },
    { num: 2, title: "Encryption & Hashing", desc: "Data is encrypted end-to-end with AES-256." },
    { num: 3, title: "Aggregation", desc: "AI analyzes only aggregated insights, never raw data." },
    { num: 4, title: "Intelligent Advice", desc: "Get personalized recommendations with privacy intact." },
  ]

  const renderMessageContent = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g)
    return parts.map((part, index) => {
      if (part.startsWith("```")) {
        const match = part.match(/```(\w*)\n([\s\S]*?)```/)
        const language = match ? match[1] : ""
        const code = match ? match[2] : part.slice(3, -3)
        return (
          <div key={index} className="my-3 rounded-xl overflow-hidden border border-border bg-slate-950 font-mono text-xs text-slate-200 shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-border/40 text-[10px] text-muted-foreground uppercase font-semibold">
              <span>{language || "code"}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(code)}
                className="hover:text-foreground transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>
            <pre className="p-4 overflow-x-auto"><code>{code}</code></pre>
          </div>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      {/* Hero Header */}
      <div className="relative border-b border-border/40 bg-card overflow-hidden">
        {/* Subtle Ambient Background */}
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
              <Button className="w-full flex items-center justify-center gap-2 mb-4 bg-secondary text-secondary-foreground border border-border/60 hover:bg-secondary/80 h-10 font-semibold text-sm cursor-pointer rounded-xl">
                <Plus className="w-4 h-4" />
                New Consultation
              </Button>
              
              <div className="flex-1 overflow-y-auto space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-2 mb-2">History</p>
                {mockChatHistory.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all cursor-pointer group",
                      selectedChatId === chat.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                    )}
                  >
                    <MessageSquare className={cn("w-4 h-4 shrink-0", selectedChatId === chat.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-foreground font-semibold">{chat.title}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">{chat.date}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Column 2 - Main Chat Interface */}
          <div className="lg:col-span-6 flex flex-col gap-4 h-full">
            <Card className="flex flex-col flex-1 overflow-hidden border-border/50 shadow-xs bg-card/45 backdrop-blur-xl rounded-2xl h-full">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 no-scrollbar">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex w-full animate-in fade-in slide-in-from-bottom-2",
                      (message.role as string) === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {(message.role as string) === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2.5 shrink-0 border border-primary/20 shadow-xs">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-xs",
                        (message.role as string) === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-secondary/40 text-foreground rounded-bl-none border border-border/40"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {message.parts
                          ? renderMessageContent(message.parts.map((p) => (p.type === "text" ? p.text : "")).join(""))
                          : renderMessageContent("")}
                      </div>
                      <div className={cn("text-[9px] mt-1 font-medium", (message.role as string) === "user" ? "text-primary-foreground/75 text-right" : "text-muted-foreground")}>
                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
                
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
                {chatMessages.length <= 1 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedQueries.map((query, i) => (
                        <button
                          key={i}
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
                    placeholder="Ask about your finances, taxes, or investments..."
                    className="w-full pl-4 pr-12 py-3.5 rounded-xl border border-border bg-secondary/20 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="absolute right-2 h-9 w-9 rounded-lg bg-primary hover:bg-primary/95 transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Column 3 - Security & Privacy panel */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <Card className="p-5 border-border/50 bg-card/45 backdrop-blur-xl rounded-2xl h-full flex flex-col justify-between overflow-y-auto no-scrollbar shadow-xs">
              <div>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                    <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
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