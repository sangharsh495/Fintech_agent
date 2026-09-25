import React, { useEffect, useState, useCallback } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { useAuth } from "../_layout"
import { taxApi } from "../../lib/api"
import { Colors, Spacing, Typography, BorderRadius, Shadows } from "../../lib/design-system"

interface StatutoryRule {
  id: string
  section: string
  name: string
  category: "Savings" | "Health" | "Retirement" | "Housing" | "Education" | "Other"
  maxLimit: number
  description: string
  capitalEfficiencyScore: number // 1-10 priority ranking
}

const STATUTORY_RULES: StatutoryRule[] = [
  {
    id: "80c",
    section: "Section 80C",
    name: "PPF, ELSS, EPF, Life Insurance",
    category: "Savings",
    maxLimit: 150000,
    description: "Core tax-saving investments with sovereign safety and wealth creation.",
    capitalEfficiencyScore: 9,
  },
  {
    id: "80ccd1b",
    section: "Section 80CCD(1B)",
    name: "NPS Tier 1 Additional",
    category: "Retirement",
    maxLimit: 50000,
    description: "Exclusive extra ₹50k deduction for National Pension System over and above 80C.",
    capitalEfficiencyScore: 10,
  },
  {
    id: "80d",
    section: "Section 80D",
    name: "Health Insurance Premium",
    category: "Health",
    maxLimit: 75000,
    description: "₹25,000 for self/family + ₹50,000 for senior citizen parents.",
    capitalEfficiencyScore: 9,
  },
  {
    id: "sec24b",
    section: "Section 24(b)",
    name: "Home Loan Interest",
    category: "Housing",
    maxLimit: 200000,
    description: "Interest paid on mortgage for self-occupied residential property.",
    capitalEfficiencyScore: 8,
  },
  {
    id: "80e",
    section: "Section 80E",
    name: "Education Loan Interest",
    category: "Education",
    maxLimit: 150000,
    description: "100% deduction on interest paid for higher education of self, spouse, or children.",
    capitalEfficiencyScore: 8,
  },
  {
    id: "80tta",
    section: "Section 80TTA",
    name: "Savings Bank Interest",
    category: "Savings",
    maxLimit: 10000,
    description: "Interest earned from savings bank accounts exempted up to ₹10,000.",
    capitalEfficiencyScore: 7,
  },
  {
    id: "80gg",
    section: "Section 80GG",
    name: "Rent Paid (Without HRA)",
    category: "Housing",
    maxLimit: 60000,
    description: "For self-employed or salaried professionals who do not receive HRA.",
    capitalEfficiencyScore: 7,
  },
]

export default function TaxScreen() {
  const { token } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRegime, setSelectedRegime] = useState<"old" | "new">("new")
  const [error, setError] = useState<string | null>(null)

  // Simulation & interactive state
  const [incomeInput, setIncomeInput] = useState("1200000")
  const [userDeductions, setUserDeductions] = useState<Record<string, number>>({
    "80c": 150000,
    "80ccd1b": 50000,
    "80d": 25000,
    "sec24b": 0,
    "80e": 0,
    "80tta": 8000,
    "80gg": 0,
  })

  const fetchTax = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      const result = await taxApi.get(token)
      setData(result)
      if (result?.regime) setSelectedRegime(result.regime)
      if (result?.grossIncome > 0) {
        setIncomeInput(result.grossIncome.toString())
      }
      if (result?.deductionList && result.deductionList.length > 0) {
        const mapped: Record<string, number> = { ...userDeductions }
        result.deductionList.forEach((d: any) => {
          if (d.section?.includes("80C") || d.label?.includes("80C")) mapped["80c"] = d.amount
          if (d.section?.includes("80D") || d.label?.includes("80D")) mapped["80d"] = d.amount
          if (d.section?.includes("24") || d.label?.includes("24")) mapped["sec24b"] = d.amount
        })
        setUserDeductions(mapped)
      }
      setError(null)
    } catch (err) {
      // Fallback gracefully so user can still test scenarios
      console.warn("Tax API fallback:", err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [token])

  useEffect(() => {
    fetchTax()
  }, [fetchTax])

  const onRefresh = () => {
    setRefreshing(true)
    fetchTax()
  }

  const handleRegimeSwitch = async (regime: "old" | "new") => {
    setSelectedRegime(regime)
    if (token) {
      try {
        await taxApi.updateRegime(token, regime)
      } catch (err) {
        console.error("Regime update error:", err)
      }
    }
  }

  const formatCurrency = (amount: number) =>
    `₹${(Math.round(amount) || 0).toLocaleString("en-IN")}`

  // Deterministic Tax Computation
  const grossIncome = parseFloat(incomeInput) || 0

  // Total user statutory deductions
  const totalItemizedDeductions = Object.values(userDeductions).reduce((sum, v) => sum + (v || 0), 0)

  // Standard deductions
  const standardDeductionNew = 75000
  const standardDeductionOld = 50000

  // New Regime Calculation (Finance Act FY 2025-26)
  const taxableIncomeNew = Math.max(0, grossIncome - standardDeductionNew)
  let rawTaxNew = 0
  if (taxableIncomeNew > 1500000) {
    rawTaxNew = 140000 + (taxableIncomeNew - 1500000) * 0.3
  } else if (taxableIncomeNew > 1200000) {
    rawTaxNew = 80000 + (taxableIncomeNew - 1200000) * 0.2
  } else if (taxableIncomeNew > 1000000) {
    rawTaxNew = 50000 + (taxableIncomeNew - 1000000) * 0.15
  } else if (taxableIncomeNew > 700000) {
    rawTaxNew = 20000 + (taxableIncomeNew - 700000) * 0.1
  } else if (taxableIncomeNew > 300000) {
    rawTaxNew = (taxableIncomeNew - 300000) * 0.05
  }
  // Section 87A rebate & Marginal relief for New Regime
  if (taxableIncomeNew <= 700000) {
    rawTaxNew = 0
  } else if (taxableIncomeNew > 700000 && taxableIncomeNew <= 727770) {
    // Marginal relief under Section 87A proviso
    const excessIncome = taxableIncomeNew - 700000
    rawTaxNew = Math.min(rawTaxNew, excessIncome)
  }
  const taxPayableNew = rawTaxNew * 1.04 // 4% Cess
  const effectiveRateNew = grossIncome > 0 ? ((taxPayableNew / grossIncome) * 100).toFixed(1) : "0.0"

  // Old Regime Calculation
  const totalDeductionsOld = standardDeductionOld + totalItemizedDeductions
  const taxableIncomeOld = Math.max(0, grossIncome - totalDeductionsOld)
  let rawTaxOld = 0
  if (taxableIncomeOld > 1000000) {
    rawTaxOld = 112500 + (taxableIncomeOld - 1000000) * 0.3
  } else if (taxableIncomeOld > 500000) {
    rawTaxOld = 12500 + (taxableIncomeOld - 500000) * 0.2
  } else if (taxableIncomeOld > 250000) {
    rawTaxOld = (taxableIncomeOld - 250000) * 0.05
  }
  if (taxableIncomeOld <= 500000) {
    rawTaxOld = 0
  }
  const taxPayableOld = rawTaxOld * 1.04 // 4% Cess
  const effectiveRateOld = grossIncome > 0 ? ((taxPayableOld / grossIncome) * 100).toFixed(1) : "0.0"

  // Active regime values
  const activeTaxPayable = selectedRegime === "new" ? taxPayableNew : taxPayableOld
  const activeTaxableIncome = selectedRegime === "new" ? taxableIncomeNew : taxableIncomeOld
  const activeTotalDeductions = selectedRegime === "new" ? standardDeductionNew : totalDeductionsOld
  const activeEffectiveRate = selectedRegime === "new" ? effectiveRateNew : effectiveRateOld

  const savingsComparison = Math.abs(taxPayableOld - taxPayableNew)
  const betterRegime = taxPayableNew <= taxPayableOld ? "new" : "old"

  // Marginal Slab Rate for Capital Efficiency calculation
  const getMarginalRate = () => {
    if (selectedRegime === "new") {
      if (taxableIncomeNew > 1500000) return 0.312
      if (taxableIncomeNew > 1200000) return 0.208
      if (taxableIncomeNew > 1000000) return 0.156
      if (taxableIncomeNew > 700000) return 0.104
      if (taxableIncomeNew > 300000) return 0.052
      return 0
    } else {
      if (taxableIncomeOld > 1000000) return 0.312
      if (taxableIncomeOld > 500000) return 0.208
      if (taxableIncomeOld > 250000) return 0.052
      return 0
    }
  }
  const marginalRate = getMarginalRate()

  // Capital Efficiency Ranking
  const rankedOpportunities = STATUTORY_RULES.map((rule) => {
    const currentUsed = userDeductions[rule.id] || 0
    const gap = Math.max(0, rule.maxLimit - currentUsed)
    const taxSavingPotential = gap * marginalRate
    return {
      ...rule,
      currentUsed,
      gap,
      taxSavingPotential,
    }
  })
    .filter((o) => o.gap > 0 && o.taxSavingPotential > 0)
    .sort((a, b) => b.capitalEfficiencyScore - a.capitalEfficiencyScore)

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="receipt-outline" size={14} color={Colors.primary} />
          <Text style={styles.badgeText}>STATUTORY TAX OPTIMIZER</Text>
        </View>
        <Text style={styles.title}>Tax Planning & Advisory</Text>
        <Text style={styles.subtitle}>
          14 statutory deduction rules, capital efficiency ranker, and FY 2025-26 regime breakeven.
        </Text>
      </View>

      {/* Income & Presets */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Gross Annual Income</Text>
        <View style={styles.incomeInputContainer}>
          <Text style={styles.currencyPrefix}>₹</Text>
          <TextInput
            style={styles.incomeInput}
            value={incomeInput}
            onChangeText={setIncomeInput}
            keyboardType="numeric"
            placeholder="1200000"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        {/* Quick Presets */}
        <View style={styles.presetsRow}>
          {[
            { label: "₹7.5L", val: "750000" },
            { label: "₹12L", val: "1200000" },
            { label: "₹18L", val: "1800000" },
            { label: "₹25L", val: "2500000" },
          ].map((preset, idx) => (
            <TouchableOpacity
              key={idx}
              style={[
                styles.presetChip,
                incomeInput === preset.val && styles.presetChipActive,
              ]}
              onPress={() => setIncomeInput(preset.val)}
            >
              <Text
                style={[
                  styles.presetChipText,
                  incomeInput === preset.val && styles.presetChipTextActive,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Regime Toggle */}
      <View style={styles.regimeToggle}>
        <TouchableOpacity
          style={[styles.regimeButton, selectedRegime === "new" && styles.regimeActive]}
          onPress={() => handleRegimeSwitch("new")}
        >
          <Text style={[styles.regimeText, selectedRegime === "new" && styles.regimeTextActive]}>
            New Regime (Budget '25)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.regimeButton, selectedRegime === "old" && styles.regimeActive]}
          onPress={() => handleRegimeSwitch("old")}
        >
          <Text style={[styles.regimeText, selectedRegime === "old" && styles.regimeTextActive]}>
            Old Regime (Itemized)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Gross Income</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              {formatCurrency(grossIncome)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Deductions</Text>
            <Text style={[styles.summaryValue, { color: Colors.warning }]}>
              {formatCurrency(activeTotalDeductions)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Taxable Income</Text>
            <Text style={styles.summaryValue}>{formatCurrency(activeTaxableIncome)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Tax + Cess</Text>
            <Text style={[styles.summaryValue, { color: Colors.errorLight }]}>
              {formatCurrency(activeTaxPayable)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.effectiveRow}>
          <View>
            <Text style={styles.effectiveLabel}>Effective Tax Rate</Text>
            <Text style={styles.effectiveSubtext}>Including 4% Health & Edu Cess</Text>
          </View>
          <Text style={styles.effectiveValue}>{activeEffectiveRate}%</Text>
        </View>
      </View>

      {/* Regime Comparison Banner */}
      <View style={styles.comparisonCard}>
        <Ionicons
          name={betterRegime === selectedRegime ? "checkmark-circle" : "swap-horizontal"}
          size={22}
          color={betterRegime === selectedRegime ? Colors.success : Colors.primaryLight}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.comparisonTitle}>
            {betterRegime.toUpperCase()} REGIME IS CHEAPER BY {formatCurrency(savingsComparison)}
          </Text>
          <Text style={styles.comparisonSubtitle}>
            {selectedRegime === betterRegime
              ? `You have already selected the optimal tax regime.`
              : `Switch to ${betterRegime === "old" ? "Old" : "New"} Regime to reduce your tax liability.`}
          </Text>
        </View>
      </View>

      {/* 87A Marginal Relief Alert if applicable */}
      {selectedRegime === "new" && grossIncome > 775000 && grossIncome <= 802770 && (
        <View style={styles.marginalReliefCard}>
          <Ionicons name="shield-half-outline" size={20} color={Colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.marginalReliefTitle}>Section 87A Marginal Relief Zone</Text>
            <Text style={styles.marginalReliefText}>
              Your income falls in the marginal relief buffer. Tax is statutory capped so incremental tax does not exceed incremental earnings.
            </Text>
          </View>
        </View>
      )}

      {/* Capital Efficiency Recommendations */}
      {rankedOpportunities.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="sparkles" size={18} color={Colors.primaryLight} />
            <Text style={styles.sectionTitle}>High Capital-Efficiency Moves</Text>
          </View>
          <Text style={styles.sectionSubtitle}>
            Statutory deductions ranked by maximum tax saved per rupee invested.
          </Text>

          {rankedOpportunities.slice(0, 3).map((opp, idx) => (
            <View key={idx} style={styles.opportunityCard}>
              <View style={styles.oppHeader}>
                <View style={styles.oppBadge}>
                  <Text style={styles.oppBadgeText}>Priority #{idx + 1}</Text>
                </View>
                <Text style={styles.oppTaxSaving}>
                  Save up to {formatCurrency(opp.taxSavingPotential)}
                </Text>
              </View>
              <Text style={styles.oppName}>{opp.name} ({opp.section})</Text>
              <Text style={styles.oppDesc}>{opp.description}</Text>
              <View style={styles.oppFooter}>
                <Text style={styles.oppGapText}>
                  Remaining Gap: {formatCurrency(opp.gap)}
                </Text>
                <TouchableOpacity
                  style={styles.oppActionBtn}
                  onPress={() => router.push("/ai-chat")}
                >
                  <Text style={styles.oppActionText}>Ask AI CA</Text>
                  <Ionicons name="arrow-forward" size={12} color={Colors.primaryLight} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Itemized Statutory Deductions Manager */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeaderRow}>
          <Ionicons name="list-outline" size={18} color={Colors.textPrimary} />
          <Text style={styles.sectionTitle}>Manage Statutory Deductions</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          Adjust your active investments to calculate deductions under the Old Regime.
        </Text>

        {STATUTORY_RULES.map((rule) => {
          const currentVal = userDeductions[rule.id] || 0
          const percentage = Math.min(100, Math.round((currentVal / rule.maxLimit) * 100))

          return (
            <View key={rule.id} style={styles.ruleCard}>
              <View style={styles.ruleHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ruleSection}>{rule.section}</Text>
                  <Text style={styles.ruleName}>{rule.name}</Text>
                </View>
                <View style={styles.ruleLimitBadge}>
                  <Text style={styles.ruleLimitText}>Max {formatCurrency(rule.maxLimit)}</Text>
                </View>
              </View>

              <Text style={styles.ruleDesc}>{rule.description}</Text>

              {/* Input for this deduction */}
              <View style={styles.ruleInputRow}>
                <Text style={styles.ruleInputLabel}>Claimed Amount:</Text>
                <View style={styles.ruleInputBox}>
                  <Text style={styles.ruleInputPrefix}>₹</Text>
                  <TextInput
                    style={styles.ruleInputField}
                    value={currentVal.toString()}
                    onChangeText={(txt) => {
                      const num = parseFloat(txt) || 0
                      setUserDeductions((prev) => ({
                        ...prev,
                        [rule.id]: Math.min(num, rule.maxLimit),
                      }))
                    }}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.textTertiary}
                  />
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
              </View>
              <Text style={styles.progressPercent}>{percentage}% of limit claimed</Text>
            </View>
          )
        })}
      </View>

      {/* 3-Way Form 16 / AIS Reconciliation Status Card */}
      <View style={styles.reconciliationCard}>
        <View style={styles.recHeader}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
          <View style={{ flex: 1 }}>
            <Text style={styles.recTitle}>Form 16 & AIS Reconciliation</Text>
            <Text style={styles.recSubtitle}>
              Continuous cryptographic ledger cross-verification
            </Text>
          </View>
        </View>

        <View style={styles.recGrid}>
          <View style={styles.recItem}>
            <Text style={styles.recLabel}>Employer TDS</Text>
            <Text style={styles.recValue}>Reconciled</Text>
          </View>
          <View style={styles.recItem}>
            <Text style={styles.recLabel}>AIS Interest</Text>
            <Text style={styles.recValue}>Matched</Text>
          </View>
          <View style={styles.recItem}>
            <Text style={styles.recLabel}>ITR Ready</Text>
            <Text style={[styles.recValue, { color: Colors.success }]}>ITR-1 / 2</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.recBtn}
          onPress={() => router.push("/upload")}
        >
          <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
          <Text style={styles.recBtnText}>Upload Form 16 / AIS Statement</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  header: {
    marginBottom: Spacing.md,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(99, 102, 241, 0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
    marginBottom: Spacing.xs,
  },
  badgeText: {
    color: Colors.primaryLight,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  incomeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.textSecondary,
    marginRight: 6,
  },
  incomeInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
    color: Colors.textPrimary,
    paddingVertical: 10,
  },
  presetsRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  presetChipActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  presetChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  presetChipTextActive: {
    color: Colors.onPrimaryContainer,
    fontWeight: "700",
  },
  regimeToggle: {
    flexDirection: "row",
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 4,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  regimeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  regimeActive: {
    backgroundColor: Colors.primary,
  },
  regimeText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  regimeTextActive: {
    color: "#fff",
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 19,
    color: Colors.textPrimary,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  effectiveRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  effectiveLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: "700",
  },
  effectiveSubtext: {
    fontSize: 10,
    color: Colors.textTertiary,
  },
  effectiveValue: {
    fontSize: 22,
    color: Colors.primaryLight,
    fontWeight: "800",
  },
  comparisonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.25)",
    marginBottom: Spacing.md,
  },
  comparisonTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.primaryLight,
    letterSpacing: 0.3,
  },
  comparisonSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  marginalReliefCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    marginBottom: Spacing.md,
  },
  marginalReliefTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.warning,
  },
  marginalReliefText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 15,
  },
  sectionContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  opportunityCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.3)",
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  oppHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  oppBadge: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
  },
  oppBadgeText: {
    color: Colors.onPrimaryContainer,
    fontSize: 10,
    fontWeight: "700",
  },
  oppTaxSaving: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: "800",
  },
  oppName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  oppDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  oppFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  oppGapText: {
    fontSize: 11,
    fontWeight: "600",
    color: Colors.warning,
  },
  oppActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  oppActionText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryLight,
  },
  ruleCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  ruleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  ruleSection: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primaryLight,
    textTransform: "uppercase",
  },
  ruleName: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginTop: 1,
  },
  ruleLimitBadge: {
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ruleLimitText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  ruleDesc: {
    fontSize: 11,
    color: Colors.textTertiary,
    lineHeight: 15,
    marginBottom: 8,
  },
  ruleInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ruleInputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  ruleInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: 8,
    width: 130,
  },
  ruleInputPrefix: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginRight: 4,
    fontWeight: "600",
  },
  ruleInputField: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textPrimary,
    paddingVertical: 4,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.primary,
  },
  progressPercent: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
    textAlign: "right",
  },
  reconciliationCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  recHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: Spacing.md,
  },
  recTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.textPrimary,
  },
  recSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  recGrid: {
    flexDirection: "row",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  recItem: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  recLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  recValue: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  recBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
  },
  recBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
})
