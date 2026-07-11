"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, X, ChevronLeft, ChevronRight, Sparkles, Loader2, AlertCircle } from "lucide-react"

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

export function AIWidget({ 
  pageContext = "/", 
  defaultOpen = false,
  contextTypes = ["profile", "transactions", "tax", "analytics", "summary"],
  maxTokens = 2000
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
  const sidebarRef = useRef<HTMLDivElement>(null)

  const currentPath = pageContext || pathname || "/"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !session) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)
    setError(null)

    const newMessages = [
      ...messages,
      { role: "user" as const, content: userMessage, timestamp: new Date() }
    ]
    setMessages(newMessages)

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          currentPath,
          contextTypes,
          maxTokens,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "AI service unavailable")
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          // Parse streaming chunks (AI SDK format)
          const lines = chunk.split("\n")
          for (const line of lines) {
            if (line.startsWith("0:")) {
              // Text content chunk
              const content = line.slice(2)
              assistantContent += content
              setMessages(prev => {
                const last = prev[prev.length - 1]
                if (last && last.role === "assistant") {
                  return [...prev.slice(0, -1), { ...last, content: assistantContent }]
                }
                return [...prev, { role: "assistant" as const, content: assistantContent, timestamp: new Date() }]
              })
            }
          }
        }
      }

      // Log usage (handled by API)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message")
      // Remove the user message on error
      setMessages(messages)
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

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const closeSidebar = () => {
    setIsOpen(false)
  }

  // Quick action prompts based on page context
  const quickActions = getQuickActions(currentPath)

  if (!session) {
    return (
      <Button onClick={() => router.push("/auth/login")} variant="outline" size="sm" className="gap-1">
        <Sparkles className="h-4 w-4" />
        Login for AI Assistant
      </Button>
    )
  }

  return (
    <>
      {/* Floating toggle button */}
      {!isOpen && (
        <Button
          onClick={toggleSidebar}
          className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="h-6 w-6 text-primary" />
        </Button>
      )}

      {/* Sidebar */}
      {isOpen && (
        <div 
          ref={sidebarRef}
          className="fixed right-0 top-0 h-full z-50 w-96 md:w-[400px] bg-background border-l shadow-xl flex flex-col transition-transform duration-300"
          role="dialog"
          aria-label="AI Financial Assistant"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">FinWise AI</span>
              <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                {currentPath.split("/")[1] || "Dashboard"}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={closeSidebar}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 space-y-4" style={{ maxHeight: "calc(100vh - 200px)" }}>
            {messages.length === 0 ? (
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Welcome! I'm your AI financial assistant.</p>
                <p>I have access to your financial data for <strong>{currentPath}</strong>.</p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => {
                        setInput(action)
                        sendMessage()
                      }}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1 ${msg.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Error display */}
          {error && (
            <div className="mx-4 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your finances..."
                disabled={isLoading}
                className="flex-1"
                aria-label="Ask AI assistant"
              />
              <Button
                onClick={sendMessage}
                disabled={isLoading || !input.trim() || !session}
                size="icon"
                className="h-10 w-10"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Data scope: {currentPath} • Powered by Oracle Cloud AI
            </p>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}
    </>
  )
}

function getQuickActions(path: string): string[] {
  const actions: Record<string, string[]> = {
    "/": [
      "What's my financial health score?",
      "Show my tax saving opportunities",
      "Analyze my spending patterns"
    ],
    "/dashboard": [
      "Summarize my dashboard metrics",
      "What should I focus on this month?",
      "Compare my income vs expenses"
    ],
    "/analytics": [
      "Explain my spending clusters",
      "What are my top expense categories?",
      "Show me savings trends"
    ],
    "/tax": [
      "Calculate my tax liability",
      "How can I save more tax?",
      "Explain old vs new tax regime"
    ],
    "/onboarding": [
      "Help me complete my profile",
      "What documents do I need?",
      "Guide me through setup"
    ],
    "/settings": [
      "Review my privacy settings",
      "Manage AI data access",
      "Update notification preferences"
    ],
    "/upload": [
      "What statement formats work?",
      "How to categorize transactions?",
      "Fix upload errors"
    ],
    "/calculators": [
      "Calculate EMI for home loan",
      "SIP returns projection",
      "FD maturity amount"
    ],
    "/ai-ca": [
      "Full financial analysis",
      "Create a financial plan",
      "Optimize my portfolio"
    ],
    "/profile": [
      "Update my KYC details",
      "Change tax regime",
      "Manage linked accounts"
    ],
  }

  const normalizedPath = path.split("/")[1] ? `/${path.split("/")[1]}` : "/"
  return actions[normalizedPath] || actions["/"]
}

// Compact floating button variant
export function AIFloatingButton({ pageContext = "/" }: { pageContext?: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  if (!session) {
    return (
      <Button 
        onClick={() => router.push("/auth/login")} 
        variant="outline" 
        size="sm" 
        className="fixed bottom-6 right-6 z-50 gap-1"
      >
        <Sparkles className="h-4 w-4" />
        AI Assistant
      </Button>
    )
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="h-6 w-6 text-primary" />
      </Button>
      
      {isOpen && (
        <AIWidget 
          pageContext={pageContext} 
          defaultOpen={true}
          contextTypes={["profile", "transactions", "tax", "analytics", "summary"]}
        />
      )}
    </>
  )
}