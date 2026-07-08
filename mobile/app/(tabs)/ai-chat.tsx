import { useState, useRef, useCallback } from "react"
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../_layout"
import { API_BASE_URL, ApiError } from "../../lib/api"

type Message = {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED_QUESTIONS = [
  "How much did I spend last month?",
  "What's my savings rate?",
  "Which category do I spend most on?",
  "How can I reduce my expenses?",
  "Show my income vs expenses trend",
]

export default function AIChatScreen() {
  const { token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input.trim()
    if (!messageText || !token || loading) return

    const userMessage: Message = { role: "user", content: messageText }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!response.ok) {
        throw new ApiError(response.status, "AI service unavailable")
      }

      // Try to read streamed text response
      const responseText = await response.text()

      // Parse streaming response — the AI SDK returns newline-delimited chunks
      // For simplicity, we collect the full response
      let assistantContent = ""
      try {
        // Try parsing as JSON first
        const json = JSON.parse(responseText)
        assistantContent = json.content || json.text || json.message || responseText
      } catch {
        // If not JSON, treat the raw text as the response content
        // Strip any streaming protocol prefixes (0:", etc.)
        assistantContent = responseText
          .split("\n")
          .filter((line: string) => line.trim())
          .map((line: string) => {
            // Handle Vercel AI SDK streaming format: 0:"text"
            const match = line.match(/^\d+:"(.+)"$/)
            if (match) return match[1]
            // Handle data: prefix
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") return ""
              try {
                const parsed = JSON.parse(data)
                return parsed.choices?.[0]?.delta?.content || parsed.content || ""
              } catch {
                return data
              }
            }
            return line
          })
          .join("")
      }

      if (!assistantContent) {
        assistantContent = "I'm sorry, I couldn't generate a response. Please try again."
      }

      const assistantMessage: Message = { role: "assistant", content: assistantContent }
      setMessages([...newMessages, assistantMessage])
    } catch (error: any) {
      const errorMessage: Message = {
        role: "assistant",
        content: `Sorry, I couldn't process your request. ${error.message || "Please try again later."}`,
      }
      setMessages([...newMessages, errorMessage])
    } finally {
      setLoading(false)
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [input, messages, token, loading])

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤖</Text>
            <Text style={styles.emptyTitle}>FinFlow AI Assistant</Text>
            <Text style={styles.emptySubtitle}>
              Ask me anything about your finances — spending habits, savings, tax tips, and more.
            </Text>

            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>Try asking:</Text>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(q)}
                >
                  <Text style={styles.suggestionText}>{q}</Text>
                  <Ionicons name="arrow-forward" size={14} color="#6366f1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          messages.map((msg, i) => (
            <View
              key={i}
              style={[
                styles.messageBubble,
                msg.role === "user" ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              {msg.role === "assistant" && (
                <View style={styles.assistantHeader}>
                  <Text style={styles.assistantIcon}>🤖</Text>
                  <Text style={styles.assistantLabel}>FinFlow AI</Text>
                </View>
              )}
              <Text style={[
                styles.messageText,
                msg.role === "user" ? styles.userText : styles.assistantText,
              ]}>
                {msg.content}
              </Text>
            </View>
          ))
        )}

        {loading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#6366f1" />
              <Text style={styles.typingText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your finances..."
          placeholderTextColor="#64748b"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={1000}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  messageList: { flex: 1 },
  messageListContent: { padding: 16, paddingBottom: 8 },
  emptyState: { flex: 1, alignItems: "center", paddingTop: 60, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 24, color: "#f8fafc", fontWeight: "800", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#94a3b8", textAlign: "center", lineHeight: 20, marginBottom: 32 },
  suggestionsContainer: { width: "100%", gap: 8 },
  suggestionsLabel: { fontSize: 13, color: "#64748b", fontWeight: "600", marginBottom: 4 },
  suggestionChip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#1e293b", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: "#334155",
  },
  suggestionText: { fontSize: 14, color: "#cbd5e1", flex: 1, marginRight: 8 },
  messageBubble: { maxWidth: "85%", borderRadius: 16, padding: 14, marginBottom: 10 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#6366f1" },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155" },
  assistantHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  assistantIcon: { fontSize: 14 },
  assistantLabel: { fontSize: 11, color: "#6366f1", fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#fff" },
  assistantText: { color: "#e2e8f0" },
  typingIndicator: { flexDirection: "row", alignItems: "center", gap: 8 },
  typingText: { color: "#94a3b8", fontSize: 14 },
  inputContainer: {
    flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, borderTopColor: "#1e293b", backgroundColor: "#0f172a", gap: 8,
  },
  input: {
    flex: 1, backgroundColor: "#1e293b", borderRadius: 20, paddingHorizontal: 16,
    paddingVertical: 12, fontSize: 15, color: "#f8fafc", maxHeight: 100,
    borderWidth: 1, borderColor: "#334155",
  },
  sendButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: "#6366f1",
    justifyContent: "center", alignItems: "center",
  },
  sendButtonDisabled: { opacity: 0.4 },
})
