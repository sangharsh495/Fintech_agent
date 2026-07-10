import { useEffect, useState, useCallback, useRef } from "react"
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, Animated, TouchableOpacity, Easing } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../_layout"
import { dashboardApi } from "../../lib/api"
import { Spacing, Typography, Colors, BorderRadius, Shadows, ComponentSizes, Layout, Animation, Interaction, PremiumEffects, DesignSystem } from "../../lib/design-system"
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
  const [mounted, setMounted] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [sheetHeight, setSheetHeight] = useState(0)

  const sheetAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const heroAnim = useRef(new Animated.Value(0)).current
  const statsAnim = useRef([] as Animated.Value[])

  // Initialize staggered animations
  useEffect(() => {
    statsAnim.current = Array.from({ length: 3 }, () => new Animated.Value(0))
  }, [])

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
    setMounted(true)
  }, [fetchDashboard])

  // Animate on mount
  useEffect(() => {
    if (!mounted) return

    // Hero animation
    Animated.timing(heroAnim, {
      toValue: 1,
      duration: Animation.duration.slower,
      easing: Easing.out(Animation.easing.smooth),
      useNativeDriver: true,
    }).start()

    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: Animation.duration.normal,
      easing: Easing.out(Animation.easing.easeOut),
      useNativeDriver: true,
    }).start()

    // Staggered stats
    statsAnim.current.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: Animation.duration.slow,
        easing: Easing.out(Animation.easing.spring),
        delay: index * 100,
        useNativeDriver: true,
      }).start()
    })
  }, [mounted])

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRefreshing(true)
    fetchDashboard()
  }

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  const heroTranslateY = heroAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0],
  })
  const heroOpacity = heroAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  })

  return (
    <Animated.View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary, Colors.secondary, Colors.accent]}
            progressBackgroundColor={Colors.surface}
          />
        }
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Greeting */}
        <Animated.View
          style={[styles.greeting, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}
        >
          <Text style={styles.greetingText}>
            Welcome back, <Text style={styles.greetingName}>{user?.name || "User"}</Text>{" "}
            <Text style={{ fontSize: Typography.fontSize.bodyLg }}>👋</Text>
          </Text>
        </Animated.View>

        {/* Hero Card */}
        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: heroOpacity,
              transform: [{ translateY: heroTranslateY }],
            },
          ]}
        >
          <View style={styles.heroGradient}>
            <View style={styles.heroDecoration1} />
            <View style={styles.heroDecoration2} />
            <View style={styles.heroContent}>
              <Text style={styles.heroLabel}>Net Worth</Text>
              <Animated.Text
                style={[
                  styles.heroValue,
                  {
                    opacity: heroAnim,
                    transform: [{ scale: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }],
                  },
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
          </View>
        </Animated.View>

        {/* Quick Stats Row */}
        <View style={styles.quickStatsRow}>
          <Animated.View style={[styles.quickStatCard, { opacity: statsAnim.current[0], transform: [{ translateY: statsAnim.current[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <View style={styles.quickStatIcon}>
              <Ionicons name="cash-outline" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickStatLabel}>Total Balance</Text>
            <Text style={styles.quickStatValue}>{formatCurrency(data?.totalBalance || 0)}</Text>
          </Animated.View>
          <Animated.View style={[styles.quickStatCard, { opacity: statsAnim.current[1], transform: [{ translateY: statsAnim.current[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <View style={styles.quickStatIcon}>
              <Ionicons name="trending-up-outline" size={24} color={Colors.success} />
            </View>
            <Text style={styles.quickStatLabel}>This Month</Text>
            <Text style={styles.quickStatValue}>{formatCurrency(data?.monthlyIncome || 0)}</Text>
          </Animated.View>
          <Animated.View style={[styles.quickStatCard, { opacity: statsAnim.current[2], transform: [{ translateY: statsAnim.current[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <View style={styles.quickStatIcon}>
              <Ionicons name="pie-chart-outline" size={24} color={Colors.secondary} />
            </View>
            <Text style={styles.quickStatLabel}>Savings Rate</Text>
            <Text style={styles.quickStatValue}>{data?.savingsRate || 0}%</Text>
          </Animated.View>
        </View>

        {/* Bank Balances */}
        {data?.perBankBalances && data.perBankBalances.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bank Accounts</Text>
            {data.perBankBalances.map((bank: any, i: number) => (
              <View key={i} style={styles.bankCard}>
                <View style={styles.bankInfo}>
                  <View style={[styles.bankIcon, { backgroundColor: Colors.primary + "15" }]}>
                    <Ionicons name="card-outline" size={20} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.bankName}>{bank.bankName}</Text>
                    <Text style={styles.bankNickname}>{bank.accountNickname || `••••${bank.accountLast4 || ""}`}</Text>
                  </View>
                </View>
                <Text style={styles.bankBalance}>{formatCurrency(bank.balance)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity style={styles.viewAllButton} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward-outline" size={16} color={Colors.primary} />
            </TouchableOpacity>
          </View>
          {(!data?.recentTransactions || data.recentTransactions.length === 0) ? (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Upload a bank statement to get started!</Text>
            </View>
          ) : (
            data.recentTransactions.slice(0, 5).map((txn: any, i: number) => {
              const isCredit = txn.type === "credit"
              const iconName = isCredit ? "arrow-down-circle-outline" : "arrow-up-circle-outline"
              const iconBgColor = isCredit ? Colors.success + "15" : Colors.error + "15"
              const iconColor = isCredit ? Colors.success : Colors.error

              return (
                <TouchableOpacity
                  key={i}
                  style={styles.txnCard}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  activeOpacity={0.8}
                >
                  <View style={styles.txnLeft}>
                    <View style={[styles.txnIconWrapper, { backgroundColor: iconBgColor }]}>
                      <Ionicons name={iconName} size={22} color={iconColor} />
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
                  <Text style={[styles.txnAmount, isCredit ? styles.txnCredit : styles.txnDebit]}>
                    {isCredit ? "+" : "-"}{formatCurrency(parseFloat(txn.amount))}
                  </Text>
                </TouchableOpacity>
              )
            })
          )}
        </View>

        {/* Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Alerts</Text>
            {data.alerts.map((alert: any, i: number) => (
              <View key={i} style={styles.alertCard}>
                <Ionicons name="alert-circle-outline" size={20} color={Colors.warning} />
                <Text style={styles.alertText}>{alert.message}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Quick Actions Sheet */}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: showQuickActions ? "rgba(0,0,0,0.4)" : "transparent",
        }}
        pointerEvents={showQuickActions ? "auto" : "none"}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            Animated.timing(sheetAnim, {
              toValue: 0,
              duration: Animation.duration.normal,
              easing: Easing.out(Animation.easing.smooth),
              useNativeDriver: true,
            }).start(() => setShowQuickActions(false))
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: Animation.duration.fast,
              useNativeDriver: true,
            }).start()
          }}
        />
        <Animated.View
          style={[
            styles.quickActionsSheet,
            {
              transform: [{ translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }],
            },
          ]}
        >
          <View style={styles.quickActionsHandle}>
            <View style={styles.handleBar} />
          </View>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                setShowQuickActions(false)
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + "15" }]}>
                <Ionicons name="cloud-upload-outline" size={28} color={Colors.primary} />
              </View>
              <Text style={styles.quickActionLabel}>Upload Statement</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                setShowQuickActions(false)
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary + "15" }]}>
                <Ionicons name="bar-chart-outline" size={28} color={Colors.secondary} />
              </View>
              <Text style={styles.quickActionLabel}>View Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                setShowQuickActions(false)
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.success + "15" }]}>
                <Ionicons name="calculator-outline" size={28} color={Colors.success} />
              </View>
              <Text style={styles.quickActionLabel}>Calculators</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                setShowQuickActions(false)
              }}
              activeOpacity={0.8}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: Colors.warning + "15" }]}>
                <Ionicons name="settings-outline" size={28} color={Colors.warning} />
              </View>
              <Text style={styles.quickActionLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={[
            styles.fab,
            {
              transform: [
                { translateY: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -320] }) },
                { scale: sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.9] }) },
              ],
            },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            setShowQuickActions(true)
            Animated.timing(sheetAnim, {
              toValue: 1,
              duration: Animation.duration.slow,
              easing: Easing.out(Animation.easing.spring),
              useNativeDriver: true,
            }).start()
            Animated.timing(fadeAnim, {
              toValue: 0.4,
              duration: Animation.duration.fast,
              useNativeDriver: true,
            }).start()
          }}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={28} color={Colors.onPrimary} />
        </TouchableOpacity>
      </Animated.View>
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

  // FAB
  fab: {
    position: "absolute",
    bottom: Spacing.xl + 20,
    right: Spacing.screenPaddingHorizontal,
    width: ComponentSizes.touchTarget.generous,
    height: ComponentSizes.touchTarget.generous,
    borderRadius: ComponentSizes.touchTarget.generous / 2,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.lg,
    zIndex: 50,
  },
})