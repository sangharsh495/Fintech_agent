"use client"

import React, { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, Bot, Lock, Brain, Eye, Sparkles, Shield, Zap, Info, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const isLoading = status === "streaming" || status === "submitted"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ parts: [{ type: "text", text: input }] })
    setInput("")
  }
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      {/* Hero Header */}
      <div className="relative border-b border-border/40 bg-card overflow-hidden">
        {/* Subtle Ambient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        
        <div className="relative z-10 px-6 py-12 md:py-16 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-6 animate-in slide-in-from-bottom-2">
            <Sparkles className="w-3.5 h-3.5" />
            FinFlow AI
          </div>
          
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground drop-shadow-sm">
            AI Virtual <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Chartered Accountant</span>
          </h1>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl">
            Get expert guidance on Indian tax laws, financial planning, and wealth optimization with our AI-powered assistant trained on current regulations.
          </p>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-8 py-6 md:py-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
          {/* Left Column - Chat Interface */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-[75vh] min-h-[600px]">
            {/* Feature Cards - Inline above chat */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {features.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-card border border-border/40 hover:border-primary/20 hover:bg-secondary/20 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{feature.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Chat Interface */}
            <Card className="flex flex-col flex-1 overflow-hidden border-border/50 shadow-sm bg-card/50 backdrop-blur-xl rounded-2xl">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex w-full animate-in fade-in slide-in-from-bottom-2",
                      (message.role as string) === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {(message.role as string) === "assistant" && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 shrink-0 border border-primary/20">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    
                    <div
                      className={cn(
                        "max-w-[85%] md:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                        (message.role as string) === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none shadow-sm"
                          : "bg-secondary/50 text-foreground rounded-bl-none border border-border/50"
                      )}
                    >
                      <div className="whitespace-pre-wrap break-words">
                        {message.parts?.map((p) => (p.type === "text" ? p.text : "")).join("") ?? ""}
                      </div>
                      <div className={cn("text-[10px] mt-1.5 font-medium", (message.role as string) === "user" ? "text-primary-foreground/70 text-right" : "text-muted-foreground")}>
                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start items-center gap-3 animate-in fade-in">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-secondary/50 px-4 py-3 rounded-2xl rounded-bl-none border border-border/50 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
              </div>

              {/* Input Area */}
              <div className="p-4 md:p-6 bg-card border-t border-border/50">
                {chatMessages.length <= 1 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {suggestedQueries.map((query, i) => (
                        <button
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-colors border border-border/50"
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
                    className="w-full pl-5 pr-14 py-4 rounded-xl border border-border/60 bg-secondary/30 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    size="icon"
                    className="absolute right-2 h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 transition-transform active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>

          {/* Right Column - Security Info */}
          <div className="lg:col-span-4 flex flex-col">
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur-xl rounded-2xl sticky top-24">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground tracking-tight">Security & Privacy</h2>
                  <p className="text-xs text-muted-foreground">Bank-grade data protection</p>
                </div>
              </div>
              
              <div className="space-y-6">
                {securitySteps.map((step, idx) => (
                  <div key={step.num} className="relative pl-6">
                    {/* Timeline line */}
                    {idx !== securitySteps.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-border/60" />
                    )}
                    
                    {/* Number badge */}
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-secondary border border-border/80 flex items-center justify-center text-[10px] font-bold text-foreground">
                      {step.num}
                    </div>
                    
                    <div>
                      <p className="font-semibold text-sm text-foreground mb-1">{step.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/10 flex gap-3">
                <Info className="w-5 h-5 text-primary shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
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