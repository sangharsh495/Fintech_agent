import { useEffect, useState, useCallback } from "react"
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator } from "react-native"
import { useAuth } from "../_layout"
import { dashboardApi } from "../../lib/api"

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

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const onRefresh = () => { setRefreshing(true); fetchDashboard() }

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          Welcome back, <Text style={styles.greetingName}>{user?.name || "User"}</Text> 👋
        </Text>
      </View>

      {/* Net Worth Card */}
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Net Worth</Text>
        <Text style={styles.heroValue}>{formatCurrency(data?.netWorth || 0)}</Text>
        <View style={styles.heroRow}>
          <View style={styles.heroStat}>
            <Text style={styles.statLabel}>Income</Text>
            <Text style={[styles.statValue, { color: "#22c55e" }]}>{formatCurrency(data?.monthlyIncome || 0)}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.statLabel}>Expenses</Text>
            <Text style={[styles.statValue, { color: "#ef4444" }]}>{formatCurrency(data?.monthlyExpense || 0)}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.statLabel}>Savings</Text>
            <Text style={[styles.statValue, { color: "#6366f1" }]}>{data?.savingsRate || 0}%</Text>
          </View>
        </View>
      </View>

      {/* Bank Balances */}
      {data?.perBankBalances && data.perBankBalances.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bank Accounts</Text>
          {data.perBankBalances.map((bank: any, i: number) => (
            <View key={i} style={styles.bankCard}>
              <View>
                <Text style={styles.bankName}>{bank.bankName}</Text>
                <Text style={styles.bankNickname}>{bank.accountNickname || `••••${bank.accountLast4 || ""}`}</Text>
              </View>
              <Text style={styles.bankBalance}>{formatCurrency(bank.balance)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {(!data?.recentTransactions || data.recentTransactions.length === 0) ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No transactions yet. Upload a bank statement to get started!</Text>
          </View>
        ) : (
          data.recentTransactions.slice(0, 5).map((txn: any, i: number) => (
            <View key={i} style={styles.txnCard}>
              <View style={styles.txnLeft}>
                <Text style={styles.txnDesc} numberOfLines={1}>{txn.description || txn.merchant || "Transaction"}</Text>
                <Text style={styles.txnDate}>{new Date(txn.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</Text>
              </View>
              <Text style={[styles.txnAmount, txn.type === "credit" ? styles.txnCredit : styles.txnDebit]}>
                {txn.type === "credit" ? "+" : "-"}{formatCurrency(parseFloat(txn.amount))}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Alerts</Text>
          {data.alerts.map((alert: any, i: number) => (
            <View key={i} style={styles.alertCard}>
              <Text style={styles.alertText}>{alert.message}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" },
  greeting: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greetingText: { fontSize: 16, color: "#94a3b8" },
  greetingName: { color: "#f8fafc", fontWeight: "700" },
  heroCard: {
    margin: 20, padding: 24, borderRadius: 20, backgroundColor: "#1e293b",
    borderWidth: 1, borderColor: "#334155",
  },
  heroLabel: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
  heroValue: { fontSize: 36, color: "#f8fafc", fontWeight: "800", marginTop: 4, marginBottom: 20 },
  heroRow: { flexDirection: "row", justifyContent: "space-between" },
  heroStat: { flex: 1, alignItems: "center" },
  heroDivider: { width: 1, backgroundColor: "#334155" },
  statLabel: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: "700" },
  section: { paddingHorizontal: 20, marginTop: 8 },
  sectionTitle: { fontSize: 18, color: "#f8fafc", fontWeight: "700", marginBottom: 12 },
  bankCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#1e293b", borderRadius: 14, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: "#334155",
  },
  bankName: { fontSize: 15, color: "#f8fafc", fontWeight: "600" },
  bankNickname: { fontSize: 12, color: "#64748b", marginTop: 2 },
  bankBalance: { fontSize: 17, color: "#f8fafc", fontWeight: "700" },
  txnCard: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#1e293b", borderRadius: 14, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: "#334155",
  },
  txnLeft: { flex: 1, marginRight: 12 },
  txnDesc: { fontSize: 14, color: "#f8fafc", fontWeight: "500" },
  txnDate: { fontSize: 12, color: "#64748b", marginTop: 2 },
  txnAmount: { fontSize: 15, fontWeight: "700" },
  txnCredit: { color: "#22c55e" },
  txnDebit: { color: "#ef4444" },
  emptyCard: { backgroundColor: "#1e293b", borderRadius: 14, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#334155" },
  emptyText: { color: "#64748b", textAlign: "center", lineHeight: 20 },
  alertCard: { backgroundColor: "#1e293b", borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: "#f59e0b33" },
  alertText: { color: "#fbbf24", fontSize: 13, lineHeight: 18 },
})
