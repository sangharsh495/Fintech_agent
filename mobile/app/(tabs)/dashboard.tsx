import { useEffect, useState, useCallback, useRef } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Animated,
  PanResponder,
  Easing,
  TouchableOpacity,
} from "react-native"
import { useAuth } from "../_layout"
import { dashboardApi } from "../../lib/api"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"

type DashboardData = {
  hasData: boolean
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  savingsRate: number
  netWorth: number
  recentTransactions: any[]
  perBankBalances: any[]
  alerts: any[]
}

export default function DashboardScreen() {
  const { token, user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [animation, setAnimation] = useState(new Animated.Value(0))
  const [swipeAnim] = useState(new Animated.Value(0))
  const [showQuickActions, setShowQuickActions] = useState(false)

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy < -20 && !showQuickActions) {
          setShowQuickActions(true)
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        }
      },
      onPanResponderRelease: () => {},
    })
  ).current

  const fetchDashboard = useCallback(async () => {
    if (!token) return
    try {
      const result = await dashboardApi.get(token)
      setData(result)
    } catch (error) {
      console.error("Dashboard fetch error:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    fetchDashboard()
    // Entrance animation
    Animated.timing(animation, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start()
  }, [fetchDashboard])

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setRefreshing(true)
    fetchDashboard()
  }

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  if (loading) {
    return (
      <View style={styles.loadingContainer} {...panResponder.panHandlers}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const heroAnim = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  })
  const heroOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  const statsAnim = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  })
  const statsOpacity = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  })

  return (
    <Animated.View style={[styles.container, { opacity: animation }]} {...panResponder.panHandlers}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            progressBackgroundColor={Colors.surface}
            progressViewOffset={60}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Greeting */}
        <Animated.View
          style={[styles.greeting, { opacity: heroOpacity, transform: [{ translateY: heroAnim }] }]}
        >
          <Text style={styles.greetingText}>
            Welcome back, <Text style={styles.greetingName}>{user?.name || "User"}</Text>{" "}
            <Text style={styles.greetingEmoji}>👋</Text>
          </Text>
        </Animated.View>

        {/* Net Worth Hero Card */}
        <Animated.View
          style={[styles.heroCard, { opacity: heroOpacity, transform: [{ translateY: heroAnim }] }]}
        >
          <LinearGradient colors={[Colors.surface, Colors.surfaceElevated]} style={styles.heroGradient}>
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>Net Worth</Text>
              <Animated.Text
                style={[
                  styles.heroValue,
                  { opacity: animation, transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] },
                ]}
              >
                {formatCurrency(data?.netWorth || 0)}
              </Animated.Text>
              <View style={styles.heroRow}>
                <View style={styles.heroStat}>
                  <Text style={styles.statLabel}>Income</Text>
                  <Text style={[styles.statValue, { color: Colors.success }]}>{formatCurrency(data?.monthlyIncome || 0)}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.statLabel}>Expenses</Text>
                  <Text style={[styles.statValue, { color: Colors.error }]}>{formatCurrency(data?.monthlyExpense || 0)}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Text style={styles.statLabel}>Savings</Text>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>{data?.savingsRate || 0}%</Text>
                </View>
              </View>
            </View>
            {/* Decorative elements */}
            <View style={styles.heroDecoration1} />
            <View style={styles.heroDecoration2} />
          </LinearGradient>
        </Animated.View>

        {/* Quick Stats Row */}
        <Animated.View
          style={[styles.quickStatsRow, { opacity: statsOpacity, transform: [{ translateY: statsAnim }] }]}
        >
          <TouchableOpacity
            style={styles.quickStatCard}
            activeOpacity={0.8}
            onPress={() => Haptics.selectionAsync()}
          >
            <View style={styles.quickStatIcon}>
              <Ionicons name="wallet-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickStatLabel}>Balance</Text>
            <Text style={styles.quickStatValue}>{formatCurrency(data?.totalBalance || 0)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickStatCard}
            activeOpacity={0.8}
            onPress={() => Haptics.selectionAsync()}
          >
            <View style={styles.quickStatIcon}>
              <Ionicons name="trending-up-outline" size={24} color={Colors.success} />
            </View>
            <Text style={styles.quickStatLabel}>Income</Text>
            <Text style={[styles.quickStatValue, { color: Colors.success }]}>{formatCurrency(data?.monthlyIncome || 0)}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickStatCard}
            activeOpacity={0.8}
            onPress={() => Haptics.selectionAsync()}
          >
            <View style={styles.quickStatIcon}>
              <Ionicons name="trending-down-outline" size={24} color={Colors.error} />
            </View>
            <Text style={styles.quickStatLabel}>Expenses</Text>
            <Text style={[styles.quickStatValue, { color: Colors.error }]}>{formatCurrency(data?.monthlyExpense || 0)}</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Bank Balances */}
        {data?.perBankBalances && data.perBankBalances.length > 0 && (
          <Animated.View style={[styles.section, { opacity: statsOpacity, transform: [{ translateY: statsAnim }] }]}>
            <Text style={styles.sectionTitle}>Bank Accounts</Text>
            {data.perBankBalances.map((bank: any, i: number) => (
              <TouchableOpacity
                key={i}
                style={styles.bankCard}
                activeOpacity={0.8}
                onPress={() => Haptics.selectionAsync()}
              >
                <View style={styles.bankInfo}>
                  <View style={styles.bankIcon}>
                    <Ionicons name="card-outline" size={20} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.bankName}>{bank.bankName}</Text>
                    <Text style={styles.bankNickname}>
                      {bank.accountNickname || `••••${bank.accountLast4 || ""}`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bankBalance}>{formatCurrency(bank.balance)}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Recent Transactions */}
        <Animated.View style={[styles.section, { opacity: statsOpacity, transform: [{ translateY: statsAnim }] }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => Haptics.selectionAsync()}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {(!data?.recentTransactions || data.recentTransactions.length === 0) ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Upload a bank statement to get started</Text>
            </View>
          ) : (
            data.recentTransactions.slice(0, 5).map((txn: any, i: number) => (
              <TouchableOpacity
                key={i}
                style={styles.txnCard}
                activeOpacity={0.7}
                onPress={() => Haptics.selectionAsync()}
              >
                <View style={styles.txnLeft}>
                  <View style={styles.txnIconWrapper}>
                    <Ionicons
                      name={txn.type === "credit" ? "arrow-down-circle-outline" : "arrow-up-circle-outline"}
                      size={22}
                      color={txn.type === "credit" ? Colors.success : Colors.error}
                    />
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnDesc} numberOfLines={1}>
                      {txn.description || txn.merchant || "Transaction"}
                    </Text>
                    <Text style={styles.txnDate}>
                      {new Date(txn.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.txnAmount, txn.type === "credit" ? styles.txnCredit : styles.txnDebit]}>
                  {txn.type === "credit" ? "+" : "-"}{formatCurrency(parseFloat(txn.amount))}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </Animated.View>

        {/* Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <Animated.View style={[styles.section, { opacity: statsOpacity, transform: [{ translateY: statsAnim }] }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color={Colors.warning} />
                {" Alerts"}
              </Text>
            </View>
            {data.alerts.map((alert: any, i: number) => (
              <View key={i} style={styles.alertCard}>
                <MaterialCommunityIcons
                  name={alert.type === "warning" ? "alert-outline" : alert.type === "success" ? "check-circle-outline" : "information-outline"}
                  size={18}
                  color={
                    alert.type === "warning" ? Colors.warning : alert.type === "success" ? Colors.success : Colors.secondary
                  }
                />
                <Text style={styles.alertText}>{alert.message}</Text>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Quick Actions (Swipe up from bottom) */}
        <Animated.View
          style={[
            styles.quickActionsSheet,
            {
              opacity: showQuickActions ? 1 : 0,
              transform: [{ translateY: showQuickActions ? 0 : 100 }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.quickActionsHandle}
            onPress={() => {
              setShowQuickActions(false)
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }}
          >
            <View style={styles.handleBar} />
          </TouchableOpacity>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowQuickActions(false) }}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="cloud-upload-outline" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Upload Statement</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowQuickActions(false) }}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="analytics-outline" size={28} color={Colors.secondary} />
              </View>
              <Text style={styles.quickActionLabel}>View Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowQuickActions(false) }}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="calculator-outline" size={28} color={Colors.success} />
              </View>
              <Text style={styles.quickActionLabel}>Calculators</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionBtn} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowQuickActions(false) }}>
              <View style={styles.quickActionIcon}>
                <Ionicons name="settings-outline" size={28} color={Colors.warning} />
              </View>
              <Text style={styles.quickActionLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },

  // Greeting
  greeting: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greetingText: {
    fontSize: Typography.fontSize.bodyLg,
    color: Colors.textSecondary,
    fontWeight: "400",
    fontFamily: Typography.fontFamilies.regular,
  },
  greetingName: {
    color: Colors.textPrimary,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
  },
  greetingEmoji: {
    fontSize: Typography.fontSize.bodyLg,
  },

  // Hero Card
  heroCard: {
    margin: Spacing.screenPaddingHorizontal,
    borderRadius: BorderRadius.card,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  heroGradient: {
    padding: Spacing.xl,
    minHeight: 180,
  },
  heroContent: {
    zIndex: 2,
  },
  heroLabel: {
    fontSize: Typography.fontSize.bodySm,
    color: Colors.textSecondary,
    fontWeight: "600",
    fontFamily: Typography.fontFamilies.medium,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  heroValue: {
    fontSize: Typography.fontSize.numericXl,
    color: Colors.textPrimary,
    fontWeight: "800",
    fontFamily: Typography.fontFamilies.extrabold,
    marginBottom: Spacing.lg,
    fontVariant: ["tabular-nums"],
  },
  heroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroStat: {
    flex: 1,
    alignItems: "center",
  },
  heroDivider: {
    width: 1,
    backgroundColor: Colors.border,
    height: 40,
  },
  statLabel: {
    fontSize: Typography.fontSize.bodyXs,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
    fontFamily: Typography.fontFamilies.regular,
  },
  statValue: {
    fontSize: Typography.fontSize.numericSm,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
    fontVariant: ["tabular-nums"],
  },
  heroDecoration1: {
    position: "absolute",
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: Colors.primary + "20",
  },
  heroDecoration2: {
    position: "absolute",
    bottom: -80,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.secondary + "15",
  },

  // Quick Stats Row
  quickStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 100,
    justifyContent: "center",
    ...Shadows.sm,
  },
  quickStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  quickStatLabel: {
    fontSize: Typography.fontSize.bodyXs,
    color: Colors.textTertiary,
    fontFamily: Typography.fontFamilies.medium,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  quickStatValue: {
    fontSize: Typography.fontSize.bodyMd,
    color: Colors.textPrimary,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
  },

  // Sections
  section: {
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.h4,
    color: Colors.textPrimary,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.chip,
  },
  viewAllText: {
    fontSize: Typography.fontSize.bodySm,
    color: Colors.primary,
    fontWeight: "600",
    fontFamily: Typography.fontFamilies.semibold,
  },

  // Bank Cards
  bankCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  bankIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  bankName: {
    fontSize: Typography.fontSize.bodyMd,
    color: Colors.textPrimary,
    fontWeight: "600",
    fontFamily: Typography.fontFamilies.semibold,
  },
  bankNickname: {
    fontSize: Typography.fontSize.bodyXs,
    color: Colors.textTertiary,
    marginTop: 2,
    fontFamily: Typography.fontFamilies.regular,
  },
  bankBalance: {
    fontSize: Typography.fontSize.numericSm,
    color: Colors.textPrimary,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
    fontVariant: ["tabular-nums"],
  },

  // Transaction Cards
  txnCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  txnLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: Spacing.md,
  },
  txnIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  txnInfo: {
    flex: 1,
  },
  txnDesc: {
    fontSize: Typography.fontSize.bodyMd,
    color: Colors.textPrimary,
    fontWeight: "500",
    fontFamily: Typography.fontFamilies.medium,
  },
  txnDate: {
    fontSize: Typography.fontSize.bodyXs,
    color: Colors.textTertiary,
    marginTop: 2,
    fontFamily: Typography.fontFamilies.regular,
  },
  txnAmount: {
    fontSize: Typography.fontSize.bodyMd,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
    fontVariant: ["tabular-nums"],
  },
  txnCredit: {
    color: Colors.success,
  },
  txnDebit: {
    color: Colors.error,
  },

  // Empty State
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.bodyMd,
    fontWeight: "600",
    fontFamily: Typography.fontFamilies.semibold,
  },
  emptySubtext: {
    color: Colors.textTertiary,
    textAlign: "center",
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.bodySm,
    fontFamily: Typography.fontFamilies.regular,
  },

  // Alerts
  alertCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.warning + "33",
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    ...Shadows.sm,
  },
  alertText: {
    color: Colors.warning,
    fontSize: Typography.fontSize.bodySm,
    lineHeight: 20,
    flex: 1,
    fontFamily: Typography.fontFamilies.regular,
  },

  // Quick Actions Sheet
  quickActionsSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.sheet,
    borderTopRightRadius: BorderRadius.sheet,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl + 20,
    paddingHorizontal: Spacing.screenPaddingHorizontal,
    ...Shadows.xl,
    zIndex: 100,
  },
  quickActionsHandle: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  handleBar: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.borderLight,
  },
  quickActionsTitle: {
    fontSize: Typography.fontSize.h5,
    color: Colors.textPrimary,
    fontWeight: "700",
    fontFamily: Typography.fontFamilies.bold,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  quickActionBtn: {
    width: "48%",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  quickActionLabel: {
    fontSize: Typography.fontSize.bodySm,
    color: Colors.textPrimary,
    fontWeight: "600",
    fontFamily: Typography.fontFamilies.semibold,
    textAlign: "center",
  },
})

// Re-export design tokens for this file
import { Spacing, Typography, Colors, BorderRadius, Shadows } from "../../lib/design-system"