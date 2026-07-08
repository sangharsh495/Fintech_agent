import { useEffect, useState, useCallback } from "react"
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "../_layout"
import { taxApi } from "../../lib/api"

export default function TaxScreen() {
  const { token } = useAuth()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRegime, setSelectedRegime] = useState<"old" | "new">("new")

  const fetchTax = useCallback(async () => {
    if (!token) return
    try {
      const result = await taxApi.get(token)
      setData(result)
      if (result?.regime) setSelectedRegime(result.regime)
    } catch (error) {
      console.error("Tax fetch error:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => { fetchTax() }, [fetchTax])

  const onRefresh = () => { setRefreshing(true); fetchTax() }

  const handleRegimeSwitch = async (regime: "old" | "new") => {
    if (!token) return
    setSelectedRegime(regime)
    try {
      await taxApi.updateRegime(token, regime)
      fetchTax()
    } catch (error) {
      console.error("Regime update error:", error)
    }
  }

  const formatCurrency = (amount: number) =>
    `₹${(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  if (!data?.hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🧾</Text>
        <Text style={styles.emptyTitle}>Tax Calculator</Text>
        <Text style={styles.emptyText}>
          Upload your bank statements to auto-detect income, deductions, and get tax-saving recommendations.
        </Text>
      </View>
    )
  }

  const oldTax = data.oldRegime || {}
  const newTax = data.newRegime || {}
  const activeTax = selectedRegime === "old" ? oldTax : newTax
  const deductions = data.deductions || []
  const suggestions = data.suggestions || []

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
    >
      {/* Regime Toggle */}
      <View style={styles.regimeToggle}>
        <TouchableOpacity
          style={[styles.regimeButton, selectedRegime === "new" && styles.regimeActive]}
          onPress={() => handleRegimeSwitch("new")}
        >
          <Text style={[styles.regimeText, selectedRegime === "new" && styles.regimeTextActive]}>
            New Regime
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.regimeButton, selectedRegime === "old" && styles.regimeActive]}
          onPress={() => handleRegimeSwitch("old")}
        >
          <Text style={[styles.regimeText, selectedRegime === "old" && styles.regimeTextActive]}>
            Old Regime
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tax Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Gross Income</Text>
            <Text style={[styles.summaryValue, { color: "#22c55e" }]}>
              {formatCurrency(data.grossIncome)}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Deductions</Text>
            <Text style={[styles.summaryValue, { color: "#f59e0b" }]}>
              {formatCurrency(activeTax.totalDeductions)}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Taxable Income</Text>
            <Text style={styles.summaryValue}>{formatCurrency(activeTax.taxableIncome)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Tax Payable</Text>
            <Text style={[styles.summaryValue, { color: "#ef4444" }]}>
              {formatCurrency(activeTax.taxPayable)}
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.effectiveRow}>
          <Text style={styles.effectiveLabel}>Effective Tax Rate</Text>
          <Text style={styles.effectiveValue}>{activeTax.effectiveRate || 0}%</Text>
        </View>
      </View>

      {/* Regime Comparison */}
      {data.savingsComparison && (
        <View style={styles.comparisonCard}>
          <Ionicons name="swap-horizontal" size={20} color="#6366f1" />
          <Text style={styles.comparisonText}>
            {data.savingsComparison > 0
              ? `You save ${formatCurrency(Math.abs(data.savingsComparison))} more with the ${selectedRegime === "old" ? "Old" : "New"} Regime`
              : `Consider switching to ${selectedRegime === "old" ? "New" : "Old"} Regime to save ${formatCurrency(Math.abs(data.savingsComparison))}`}
          </Text>
        </View>
      )}

      {/* Detected Deductions */}
      {deductions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detected Deductions</Text>
          {deductions.map((d: any, i: number) => (
            <View key={i} style={styles.deductionCard}>
              <View style={styles.deductionHeader}>
                <Text style={styles.deductionSection}>{d.section}</Text>
                <Text style={styles.deductionAmount}>{formatCurrency(d.amount)}</Text>
              </View>
              <Text style={styles.deductionDesc}>{d.description}</Text>
              {d.limit && (
                <View style={styles.limitBar}>
                  <View style={[styles.limitFill, { width: `${Math.min((d.amount / d.limit) * 100, 100)}%` }]} />
                </View>
              )}
              {d.limit && (
                <Text style={styles.limitText}>
                  {formatCurrency(d.amount)} of {formatCurrency(d.limit)} limit used
                </Text>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Tax Saving Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💡 Tax Saving Tips</Text>
          {suggestions.map((tip: string, i: number) => (
            <View key={i} style={styles.tipCard}>
              <Ionicons name="bulb-outline" size={18} color="#f59e0b" />
              <Text style={styles.tipText}>{tip}</Text>
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
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a", padding: 24 },
  emptyTitle: { fontSize: 22, color: "#f8fafc", fontWeight: "700", marginBottom: 8 },
  emptyText: { fontSize: 14, color: "#64748b", textAlign: "center", lineHeight: 20 },
  regimeToggle: {
    flexDirection: "row", marginHorizontal: 20, marginTop: 16, marginBottom: 16,
    backgroundColor: "#1e293b", borderRadius: 14, padding: 4,
  },
  regimeButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  regimeActive: { backgroundColor: "#6366f1" },
  regimeText: { fontSize: 14, fontWeight: "700", color: "#94a3b8" },
  regimeTextActive: { color: "#fff" },
  summaryCard: {
    marginHorizontal: 20, padding: 20, borderRadius: 20,
    backgroundColor: "#1e293b", borderWidth: 1, borderColor: "#334155",
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryItem: { flex: 1 },
  summaryLabel: { fontSize: 12, color: "#64748b", marginBottom: 4 },
  summaryValue: { fontSize: 20, color: "#f8fafc", fontWeight: "800" },
  divider: { height: 1, backgroundColor: "#334155", marginVertical: 14 },
  effectiveRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  effectiveLabel: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },
  effectiveValue: { fontSize: 24, color: "#6366f1", fontWeight: "800" },
  comparisonCard: {
    flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, marginTop: 12,
    padding: 14, borderRadius: 12, backgroundColor: "#6366f11a", borderWidth: 1, borderColor: "#6366f133",
  },
  comparisonText: { flex: 1, fontSize: 13, color: "#a5b4fc", lineHeight: 18 },
  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitle: { fontSize: 18, color: "#f8fafc", fontWeight: "700", marginBottom: 12 },
  deductionCard: {
    backgroundColor: "#1e293b", borderRadius: 14, padding: 16, marginBottom: 8,
    borderWidth: 1, borderColor: "#334155",
  },
  deductionHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  deductionSection: { fontSize: 14, color: "#6366f1", fontWeight: "700" },
  deductionAmount: { fontSize: 15, color: "#f8fafc", fontWeight: "700" },
  deductionDesc: { fontSize: 13, color: "#94a3b8", marginBottom: 8 },
  limitBar: { height: 4, backgroundColor: "#334155", borderRadius: 2, marginBottom: 4 },
  limitFill: { height: 4, backgroundColor: "#6366f1", borderRadius: 2 },
  limitText: { fontSize: 11, color: "#64748b" },
  tipCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#1e293b", borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: "#f59e0b22",
  },
  tipText: { flex: 1, fontSize: 13, color: "#fbbf24", lineHeight: 18 },
})
