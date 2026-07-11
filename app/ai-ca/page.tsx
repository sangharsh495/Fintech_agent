"use client"

import React, { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, Bot, Lock, Brain, Eye, Sparkles, Shield, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export default function AICAsPage() {
  // ai SDK v6: useChat returns sendMessage + status; input is managed locally
  const { messages: chatMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/ai/chat" }),
    body: {
      currentPath: typeof window !== "undefined" ? window.location.pathname : "/ai-ca"
    },
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
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: Brain,
      title: "Expert Insights",
      desc: "Based on Indian tax & finance laws",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Eye,
      title: "Context Aware",
      desc: "Understands your financial profile",
      color: "from-purple-500 to-pink-500",
    },
  ]

  const securitySteps = [
    { num: 1, title: "Data Upload", desc: "You securely upload your financial documents" },
    { num: 2, title: "Encryption & Hashing", desc: "Data is encrypted end-to-end with military-grade protocols" },
    { num: 3, title: "Aggregation", desc: "AI analyzes only aggregated insights, never raw data" },
    { num: 4, title: "Intelligent Advice", desc: "Get personalized recommendations while maintaining privacy" },
  ]

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col pt-16">
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-background to-accent/5">

        {/* Decorative Blurs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] pointer-events-none opacity-50 mix-blend-screen animate-in fade-in duration-1000 delay-300"></div>

        <div className="relative z-10 px-4 md:px-6 lg:px-8 py-12 md:py-16 flex flex-col items-center justify-center text-center">
          <div className="section-header slide-up max-w-3xl float">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(var(--primary),0.3)] backdrop-blur-md">
              <Sparkles className="w-4 h-4" />
              AI-Powered
            </div>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20 float">
                <Brain className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground drop-shadow-sm">
              AI Virtual <span className="gradient-text">Chartered Accountant</span>
            </h1>
            <p className="text-lg text-muted-foreground w-full">
              Get expert guidance on Indian tax laws, financial planning, and wealth optimization with our AI-powered
              assistant trained on current regulations.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 md:px-6 lg:px-8 py-4 md:py-6">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-full">
          {/* Left Column - Chat Interface */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Feature Cards - Inline above chat */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
              {features.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <Card key={i} className="p-4 md:p-5 text-center card-hover group border border-border">
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-gradient-to-br shadow-lg transition-transform duration-300 group-hover:scale-110",
                        feature.color,
                      )}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <p className="font-bold text-sm mb-1">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </Card>
                )
              })}
            </div>

            {/* Chat Interface - Fills remaining height */}
            <Card className="p-4 md:p-6 card-hover flex flex-col flex-1 min-h-[500px] slide-up border border-border">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto mb-6 space-y-4 pr-2">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn("flex chat-message", (message.role as string) === "user" ? "justify-end" : "justify-start")}
                  >
                    {(message.role as string) === "assistant" && (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mr-3 flex-shrink-0 shadow-lg">
                        <Bot className="w-5 h-5 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-5 py-4 rounded-2xl",
                        (message.role as string) === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm shadow-lg shadow-primary/20"
                          : "bg-secondary text-foreground rounded-bl-sm",
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.parts?.map((p) => (p.type === "text" ? p.text : "")).join("") ?? ""}
                      </p>
                      <p className={cn("text-xs mt-2 opacity-70", (message.role as string) === "user" ? "text-primary-foreground" : "text-muted-foreground")}>
                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start chat-message">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mr-3 flex-shrink-0 shadow-lg">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div className="bg-secondary px-5 py-4 rounded-2xl rounded-bl-sm">
                      <div className="flex gap-2">
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                        <div className="typing-dot" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Queries */}
              {chatMessages.length === 1 && (
                <div className="mb-4 space-y-3">
                  <p className="text-xs text-muted-foreground font-medium">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQueries.map((query, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs bg-transparent hover:bg-primary/5 hover:border-primary/50 transition-all duration-200 rounded-full"
                        onClick={() => setInput(query)}
                      >
                        <Zap className="w-3 h-3 mr-1" />
                        {query}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your finances, taxes, investments..."
                  className="flex-1 px-5 py-3 rounded-xl border border-border bg-secondary/50 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="rounded-xl px-5 btn-interactive"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </Card>
          </div>

          {/* Right Column - Security Info */}
          <div className="flex flex-col">
            <Card className="p-6 card-hover slide-up border border-border flex-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">How Your Data is Secured</h2>
                  <p className="text-xs text-muted-foreground">End-to-end protection</p>
                </div>
              </div>
              <div className="space-y-4 stagger-children">
                {securitySteps.map((step) => (
                  <div
                    key={step.num}
                    className="flex gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-all duration-300 group"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold shadow-lg group-hover:scale-110 transition-transform">
                      {step.num}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
#nice