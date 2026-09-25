import React, { useState, useRef, useCallback } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../_layout"
import { API_BASE_URL, ApiError } from "../../lib/api"
import { Colors, Spacing, Typography, BorderRadius } from "../../lib/design-system"

type Message = {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED_QUESTIONS = [
  "How can I maximize my 80C and 80CCD(1B) NPS deductions?",
  "Should I choose Old or New Regime for ₹15L annual income?",
  "How is HRA tax exemption calculated under Rule 2A?",
  "What are the capital gains tax rates on equity mutual funds?",
  "How can I reduce monthly expenses and boost my savings rate?",
]

/**
 * Deterministic Chartered Accountant Fallback Engine
 * Provides instant statutory tax guidance even when server or network is offline
 */
function getDeterministicCAReply(query: string): string {
  const q = query.toLowerCase()

  if (q.includes("80c") || q.includes("ppf") || q.includes("elss")) {
    return (
      "📋 **Section 80C Statutory Advisory (Old Regime)**\n\n" +
      "• **Maximum Deductible Limit:** ₹1,50,000 per financial year.\n" +
      "• **Eligible Instruments:** PPF (15-yr lock-in, sovereign guarantee), ELSS Mutual Funds (shortest 3-yr lock-in, equity compounding), EPF employee contribution, Life Insurance premiums, 5-yr Tax-Saving Bank FDs, and Children's School Tuition Fees.\n" +
      "• **Capital Efficiency:** For individuals in the 30% tax bracket, claiming the full ₹1.5L saves ₹46,800 annually (inclusive of 4% health & education cess).\n" +
      "• **Note:** Section 80C is unavailable under the default New Tax Regime."
    )
  }

  if (q.includes("nps") || q.includes("80ccd")) {
    return (
      "🛡️ **National Pension System (NPS) & Section 80CCD(1B)**\n\n" +
      "• **Exclusive Deduction:** Section 80CCD(1B) grants an exclusive deduction of up to ₹50,000 for voluntary contributions to NPS Tier-1 accounts.\n" +
      "• **Over & Above 80C:** This is in addition to the ₹1,50,000 limit of Section 80C, giving you a combined deduction ceiling of ₹2,00,000.\n" +
      "• **Direct Tax Savings:** If you are in the 30% slab, investing ₹50,000 saves an immediate ₹15,600 in tax.\n" +
      "• **Corporate NPS (80CCD(2)):** Employer contributions up to 14% of Basic+DA (for central govt) or 10% (for private sector) are deductible in both Old AND New Regimes!"
    )
  }

  if (q.includes("hra") || q.includes("rent")) {
    return (
      "🏠 **HRA Exemption Formula (Section 10(13A) & Rule 2A)**\n\n" +
      "The exempt HRA amount is the **minimum of the following three statutory values**:\n" +
      "1. Actual House Rent Allowance (HRA) received from employer.\n" +
      "2. Total rent paid minus 10% of (Basic Salary + DA).\n" +
      "3. 50% of (Basic Salary + DA) for Metro cities (Mumbai, Delhi, Kolkata, Chennai) or 40% for Non-Metro cities.\n\n" +
      "• The remaining portion of HRA is added to taxable salary.\n" +
      "• *Pro-tip:* If your annual rent paid exceeds ₹1,00,000, your landlord's PAN is mandatory."
    )
  }

  if (q.includes("regime") || q.includes("old") || q.includes("new") || q.includes("15l")) {
    return (
      "⚖️ **Old vs New Regime Breakeven Analysis (FY 2025-26)**\n\n" +
      "• **New Regime Highlights:** Standard deduction increased to ₹75,000. Full tax rebate under Section 87A up to ₹7,00,000 taxable income (effective zero tax up to ₹7.75L gross salary).\n" +
      "• **New Slabs:** 0-3L: Nil | 3-7L: 5% | 7-10L: 10% | 10-12L: 15% | 12-15L: 20% | Above 15L: 30%.\n" +
      "• **Breakeven Rule for ₹15L Income:** At ₹15L gross salary, New Regime tax is ₹1,40,000 + cess. To beat New Regime, you need itemized deductions exceeding ₹3,75,000 (e.g. 80C ₹1.5L + 80CCD(1B) ₹50k + 80D ₹25k + Home Loan 24(b) ₹1.5L)."
    )
  }

  if (q.includes("capital gain") || q.includes("equity") || q.includes("stcg") || q.includes("ltcg")) {
    return (
      "📈 **Capital Gains Statutory Tax Rates (Finance Act 2024-25 Update)**\n\n" +
      "• **Short-Term Capital Gains (STCG - Section 111A):** Equity shares & equity mutual funds held for <= 12 months are taxed at a flat **20%** (plus cess).\n" +
      "• **Long-Term Capital Gains (LTCG - Section 112A):** Equity held for > 12 months is taxed at **12.5%** for gains exceeding the annual statutory exemption limit of **₹1,25,000**.\n" +
      "• **Debt Mutual Funds:** Taxed at your individual slab rate if purchased after April 1, 2023."
    )
  }

  return (
    "💼 **FinFlow Virtual CA Advisory**\n\n" +
    "I analyze your financial transactions, statutory deduction limits, and income tax provisions to keep you profitable and audit-compliant.\n\n" +
    "You can ask me about:\n" +
    "• Section 80C, 80CCD(1B) NPS, and 80D Health Insurance optimization\n" +
    "• HRA Exemption calculation under Rule 2A\n" +
    "• Section 24(b) Home Loan interest deductions\n" +
    "• Section 44ADA Presumptive Taxation for consultants & professionals\n" +
    "• Old vs New Tax Regime comparative breakeven"
  )
}

export default function AIChatScreen() {
  const { token } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<ScrollView>(null)

  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = text || input.trim()
      if (!messageText || loading) return

      const userMessage: Message = { role: "user", content: messageText }
      const newMessages = [...messages, userMessage]
      setMessages(newMessages)
      setInput("")
      setLoading(true)

      try {
        let assistantContent = ""

        if (token) {
          const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              messages: newMessages,
              currentPath: "/mobile-app",
            }),
          })

          if (response.ok) {
            const responseText = await response.text()
            try {
              const json = JSON.parse(responseText)
              assistantContent = json.content || json.text || json.message || responseText
            } catch {
              assistantContent = responseText
                .split("\n")
                .filter((line: string) => line.trim())
                .map((line: string) => {
                  const match = line.match(/^\d+:"(.+)"$/)
                  if (match) return match[1]
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
          }
        }

        // If backend returned empty or was unreachable, invoke deterministic CA engine
        if (!assistantContent) {
          assistantContent = getDeterministicCAReply(messageText)
        }

        const assistantMessage: Message = { role: "assistant", content: assistantContent }
        setMessages([...newMessages, assistantMessage])
      } catch (error: any) {
        // Fallback to deterministic CA knowledge on any network or parsing failure
        const fallback = getDeterministicCAReply(messageText)
        setMessages([...newMessages, { role: "assistant", content: fallback }])
      } finally {
        setLoading(false)
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100)
      }
    },
    [input, messages, token, loading]
  )

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
            <View style={styles.iconCircle}>
              <Ionicons name="chatbubble-ellipses" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>Virtual Chartered Accountant</Text>
            <Text style={styles.emptySubtitle}>
              Ask real-time statutory tax questions, compare old vs new regime, and optimize capital efficiency.
            </Text>

            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsLabel}>Featured CA Consultations:</Text>
              {SUGGESTED_QUESTIONS.map((q, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestionChip}
                  onPress={() => sendMessage(q)}
                >
                  <Text style={styles.suggestionText}>{q}</Text>
                  <Ionicons name="arrow-forward" size={14} color={Colors.primaryLight} />
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
                  <Ionicons name="shield-checkmark" size={14} color={Colors.primaryLight} />
                  <Text style={styles.assistantLabel}>Virtual CA Advisor</Text>
                </View>
              )}
              <Text
                style={[
                  styles.messageText,
                  msg.role === "user" ? styles.userText : styles.assistantText,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          ))
        )}

        {loading && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.typingText}>Analyzing statutory tax rules...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask Virtual CA (e.g. 80C, 80CCD, HRA, Regime)..."
          placeholderTextColor={Colors.textTertiary}
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
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
  },
  emptyTitle: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  suggestionsContainer: {
    width: "100%",
    gap: Spacing.xs,
  },
  suggestionsLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: "700",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "88%",
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.primary,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  assistantHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  assistantLabel: {
    fontSize: 10,
    color: Colors.primaryLight,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: "#fff",
  },
  assistantText: {
    color: Colors.textPrimary,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
    gap: Spacing.xs,
    marginBottom: 70, // Keep above floating tab bar
  },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    maxHeight: 90,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
})
