import { useEffect, useState, useCallback } from "react"
import { View, Text, ScrollView, StyleSheet, RefreshControl, ActivityIndicator, Dimensions } from "react-native"
import { useAuth } from "../_layout"
import { analyticsApi } from "../../lib/api"

export default function AnalyticsScreen() {
  const { token } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchAnalytics = useCallback(async () => {
    if (!token) return
    try {
      const result = await analyticsApi.get(token)
      setData(result)
    } catch (error) {
      console.error("Analytics fetch error:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const onRefresh = () => { setRefreshing(true); fetchAnalytics() }

  const formatCurrency = (amount: number) =>
    `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#6366f1" /></View>
  }

  if (!data?.hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>📊</Text>
        <Text style={styles.emptyTitle}>No Analytics Yet</Text>
        <Text style={styles.emptyText}>Upload a bank statement to see your spending insights</Text>
      </View>
    )
  }

  const maxExpense = Math.max(...(data.categoryBreakdown || []).map((c: any) => c.total), 1)

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      {/* Totals Card */}
      <View style={styles.totalsCard}>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Total Income</Text>
          <Text style={[styles.totalValue, { color: "#22c55e" }]}>{formatCurrency(data.totals.income)}</Text>
        </View>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Total Expenses</Text>
          <Text style={[styles.totalValue, { color: "#ef4444" }]}>{formatCurrency(data.totals.expenses)}</Text>
        </View>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Net Savings</Text>
          <Text style={[styles.totalValue, { color: "#6366f1" }]}>{formatCurrency(data.totals.savings)}</Text>
        </View>
        <View style={styles.totalItem}>
          <Text style={styles.totalLabel}>Savings Rate</Text>
          <Text style={[styles.totalValue, { color: "#6366f1" }]}>{data.totals.savingsRate}%</Text>
        </View>
      </View>

      {/* Monthly Trend */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Trend</Text>
        {data.monthly?.map((m: any, i: number) => (
          <View key={i} style={styles.monthCard}>
            <Text style={styles.monthLabel}>{m.month}</Text>
            <View style={styles.monthBars}>
              <View style={styles.barRow}>
                <Text style={[styles.barLabel, { color: "#22c55e" }]}>+{formatCurrency(m.income)}</Text>
                <View style={[styles.bar, { backgroundColor: "#22c55e", width: `${Math.min((m.income / Math.max(m.income, m.expenses)) * 100, 100)}%` }]} />
              </View>
              <View style={styles.barRow}>
                <Text style={[styles.barLabel, { color: "#ef4444" }]}>-{formatCurrency(m.expenses)}</Text>
                <View style={[styles.bar, { backgroundColor: "#ef4444", width: `${Math.min((m.expenses / Math.max(m.income, m.expenses)) * 100, 100)}%` }]} />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Category Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        {data.categoryBreakdown?.map((cat: any, i: number) => (
          <View key={i} style={styles.catCard}>
            <View style={styles.catHeader}>
              <Text style={styles.catName}>{cat.category?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</Text>
              <Text style={styles.catAmount}>{formatCurrency(cat.total)} ({cat.percentage}%)</Text>
            </View>
            <View style={styles.catBarBg}>
              <View style={[styles.catBar, { width: `${(cat.total / maxExpense) * 100}%` }]} />
            </View>
          </View>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a", padding: 24 },
  emptyTitle: { fontSize: 22, color: "#f8fafc", fontWeight: "700", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#64748b", textAlign: "center" },
  totalsCard: {
    flexDirection: "row", flexWrap: "wrap", margin: 20, padding: 20, borderRadius: 20,
    backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155", gap: 16,
  },
  totalItem: { width: "45%" },
  totalLabel: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  totalValue: { fontSize: 20, fontWeight: "800" },
  section: { paddingHorizontal: 20, marginTop: 8 },
  sectionTitle: { fontSize: 18, color: "#f8fafc", fontWeight: "700", marginBottom: 12 },
  monthCard: { backgroundColor: "#1e293b", borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: "#334155" },
  monthLabel: { fontSize: 14, color: "#94a3b8", fontWeight: "600", marginBottom: 8 },
  monthBars: { gap: 6 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  barLabel: { fontSize: 12, fontWeight: "600", width: 90, textAlign: "right" },
  bar: { height: 8, borderRadius: 4, minWidth: 4 },
  catCard: { backgroundColor: "#1e293b", borderRadius: 14, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: "#334155" },
  catHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  catName: { fontSize: 14, color: "#f8fafc", fontWeight: "500" },
  catAmount: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },
  catBarBg: { height: 6, backgroundColor: "#334155", borderRadius: 3 },
  catBar: { height: 6, backgroundColor: "#6366f1", borderRadius: 3 },
})
