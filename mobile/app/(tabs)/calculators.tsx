import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Colors, Spacing, Typography, BorderRadius, Shadows } from "../../lib/design-system"

const { width } = Dimensions.get("window")

type CalculatorType = "sip" | "emi" | "fd" | "hra" | "nps" | "breakeven"

export default function CalculatorsScreen() {
  const [activeTab, setActiveTab] = useState<CalculatorType>("sip")

  // SIP States
  const [sipMonthly, setSipMonthly] = useState("10000")
  const [sipRate, setSipRate] = useState("12")
  const [sipYears, setSipYears] = useState("10")

  // EMI States
  const [emiPrincipal, setEmiPrincipal] = useState("2500000")
  const [emiRate, setEmiRate] = useState("8.5")
  const [emiTenureYears, setEmiTenureYears] = useState("20")

  // FD States
  const [fdPrincipal, setFdPrincipal] = useState("100000")
  const [fdRate, setFdRate] = useState("7.1")
  const [fdYears, setFdYears] = useState("5")

  // HRA States
  const [basicSalary, setBasicSalary] = useState("600000")
  const [hraReceived, setHraReceived] = useState("240000")
  const [rentPaid, setRentPaid] = useState("300000")
  const [isMetro, setIsMetro] = useState(true)

  // NPS States
  const [npsMonthly, setNpsMonthly] = useState("5000")
  const [npsRate, setNpsRate] = useState("10")
  const [npsYears, setNpsYears] = useState("25")

  // Breakeven States
  const [annualIncome, setAnnualIncome] = useState("1200000")
  const [deductionsTotal, setDeductionsTotal] = useState("250000")

  // Formatting helpers
  const formatINR = (val: number) => {
    if (isNaN(val) || !isFinite(val)) return "₹0"
    return "₹" + Math.round(val).toLocaleString("en-IN")
  }

  // 1. SIP Calculation
  const calculateSIP = () => {
    const P = parseFloat(sipMonthly) || 0
    const i = (parseFloat(sipRate) || 0) / 12 / 100
    const n = (parseFloat(sipYears) || 0) * 12
    if (P <= 0 || n <= 0) return { invested: 0, returns: 0, total: 0 }

    const total = i > 0 ? P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i) : P * n
    const invested = P * n
    const returns = Math.max(0, total - invested)
    return { invested, returns, total }
  }

  // 2. EMI Calculation
  const calculateEMI = () => {
    const P = parseFloat(emiPrincipal) || 0
    const annualR = parseFloat(emiRate) || 0
    const r = annualR / 12 / 100
    const n = (parseFloat(emiTenureYears) || 0) * 12

    if (P <= 0 || n <= 0) return { emi: 0, totalInterest: 0, totalPayable: 0 }
    if (r === 0) {
      return { emi: P / n, totalInterest: 0, totalPayable: P }
    }

    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const totalPayable = emi * n
    const totalInterest = Math.max(0, totalPayable - P)
    return { emi, totalInterest, totalPayable }
  }

  // 3. FD Calculation (Quarterly Compounding)
  const calculateFD = () => {
    const P = parseFloat(fdPrincipal) || 0
    const r = (parseFloat(fdRate) || 0) / 100
    const t = parseFloat(fdYears) || 0
    const n = 4 // quarterly
    if (P <= 0 || t <= 0) return { principal: 0, interest: 0, maturity: 0 }

    const maturity = P * Math.pow(1 + r / n, n * t)
    const interest = Math.max(0, maturity - P)
    return { principal: P, interest, maturity }
  }

  // 4. HRA Exemption Calculation (Rule 2A / Section 10(13A))
  const calculateHRA = () => {
    const basic = parseFloat(basicSalary) || 0
    const hraRec = parseFloat(hraReceived) || 0
    const rent = parseFloat(rentPaid) || 0

    if (basic <= 0 || hraRec <= 0) return { exempt: 0, taxable: 0 }

    const limit1 = hraRec
    const limit2 = Math.max(0, rent - 0.1 * basic)
    const limit3 = (isMetro ? 0.5 : 0.4) * basic

    const exempt = Math.min(limit1, limit2, limit3)
    const taxable = Math.max(0, hraRec - exempt)
    return { exempt, taxable }
  }

  // 5. NPS Calculation & 80CCD(1B) Tax Saving
  const calculateNPS = () => {
    const P = parseFloat(npsMonthly) || 0
    const i = (parseFloat(npsRate) || 0) / 12 / 100
    const n = (parseFloat(npsYears) || 0) * 12
    if (P <= 0 || n <= 0) return { invested: 0, total: 0, taxSavedAnnual: 0 }

    const total = i > 0 ? P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i) : P * n
    const invested = P * n
    // Up to 50,000 under 80CCD(1B) at 30% slab gives 15,600 tax savings
    const annualDeposit = P * 12
    const eligible80CCD1B = Math.min(50000, annualDeposit)
    const taxSavedAnnual = eligible80CCD1B * 0.312 // 30% + 4% cess

    return { invested, total, taxSavedAnnual }
  }

  // 6. Tax Regime Breakeven
  const calculateBreakeven = () => {
    const inc = parseFloat(annualIncome) || 0
    const ded = parseFloat(deductionsTotal) || 0

    // New Regime Tax (FY 2025-26 Budget Slabs, standard deduction 75,000)
    const newTaxable = Math.max(0, inc - 75000)
    let newTax = 0
    if (newTaxable > 1500000) {
      newTax = 140000 + (newTaxable - 1500000) * 0.3
    } else if (newTaxable > 1200000) {
      newTax = 80000 + (newTaxable - 1200000) * 0.2
    } else if (newTaxable > 1000000) {
      newTax = 50000 + (newTaxable - 1000000) * 0.15
    } else if (newTaxable > 700000) {
      newTax = 20000 + (newTaxable - 700000) * 0.1
    } else if (newTaxable > 300000) {
      newTax = (newTaxable - 300000) * 0.05
    }
    if (newTaxable <= 700000) newTax = 0 // 87A rebate
    const newTotal = newTax * 1.04

    // Old Regime Tax (standard deduction 50,000 + user deductions)
    const oldTaxable = Math.max(0, inc - (50000 + ded))
    let oldTax = 0
    if (oldTaxable > 1000000) {
      oldTax = 112500 + (oldTaxable - 1000000) * 0.3
    } else if (oldTaxable > 500000) {
      oldTax = 12500 + (oldTaxable - 500000) * 0.2
    } else if (oldTaxable > 250000) {
      oldTax = (oldTaxable - 250000) * 0.05
    }
    if (oldTaxable <= 500000) oldTax = 0 // 87A rebate
    const oldTotal = oldTax * 1.04

    const diff = Math.abs(oldTotal - newTotal)
    const winner = oldTotal < newTotal ? "Old Regime" : "New Regime"

    return { newTotal, oldTotal, diff, winner }
  }

  const sip = calculateSIP()
  const emi = calculateEMI()
  const fd = calculateFD()
  const hra = calculateHRA()
  const nps = calculateNPS()
  const breakeven = calculateBreakeven()

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badge}>
          <Ionicons name="calculator-outline" size={14} color={Colors.primary} />
          <Text style={styles.badgeText}>FINANCIAL CALCULATORS</Text>
        </View>
        <Text style={styles.title}>Smart Wealth Calculators</Text>
        <Text style={styles.subtitle}>
          Calculate returns, plan loan repayments, optimize HRA exemptions, and find tax breakeven.
        </Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "sip" && styles.tabButtonActive]}
          onPress={() => setActiveTab("sip")}
        >
          <Ionicons
            name="trending-up-outline"
            size={16}
            color={activeTab === "sip" ? "#fff" : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "sip" && styles.tabTextActive]}>
            SIP
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "emi" && styles.tabButtonActive]}
          onPress={() => setActiveTab("emi")}
        >
          <Ionicons
            name="card-outline"
            size={16}
            color={activeTab === "emi" ? "#fff" : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "emi" && styles.tabTextActive]}>
            Loan EMI
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "fd" && styles.tabButtonActive]}
          onPress={() => setActiveTab("fd")}
        >
          <Ionicons
            name="business-outline"
            size={16}
            color={activeTab === "fd" ? "#fff" : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "fd" && styles.tabTextActive]}>
            Fixed Deposit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "hra" && styles.tabButtonActive]}
          onPress={() => setActiveTab("hra")}
        >
          <Ionicons
            name="home-outline"
            size={16}
            color={activeTab === "hra" ? "#fff" : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "hra" && styles.tabTextActive]}>
            HRA Exemption
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "nps" && styles.tabButtonActive]}
          onPress={() => setActiveTab("nps")}
        >
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={activeTab === "nps" ? "#fff" : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "nps" && styles.tabTextActive]}>
            NPS & 80CCD
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === "breakeven" && styles.tabButtonActive]}
          onPress={() => setActiveTab("breakeven")}
        >
          <Ionicons
            name="swap-horizontal-outline"
            size={16}
            color={activeTab === "breakeven" ? "#fff" : Colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === "breakeven" && styles.tabTextActive]}>
            Tax Breakeven
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* SIP Screen */}
      {activeTab === "sip" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Systematic Investment Plan (SIP)</Text>
          <Text style={styles.cardSubtitle}>
            Compound wealth through disciplined monthly mutual fund investments.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Investment (₹)</Text>
            <TextInput
              style={styles.input}
              value={sipMonthly}
              onChangeText={setSipMonthly}
              keyboardType="numeric"
              placeholder="10000"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expected Annual Return Rate (%)</Text>
            <TextInput
              style={styles.input}
              value={sipRate}
              onChangeText={setSipRate}
              keyboardType="numeric"
              placeholder="12"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Investment Period (Years)</Text>
            <TextInput
              style={styles.input}
              value={sipYears}
              onChangeText={setSipYears}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Invested Amount</Text>
              <Text style={styles.resultValue}>{formatINR(sip.invested)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Estimated Wealth Gain</Text>
              <Text style={[styles.resultValue, { color: Colors.success }]}>
                +{formatINR(sip.returns)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.resultRow}>
              <Text style={styles.resultTotalLabel}>Total Maturity Value</Text>
              <Text style={styles.resultTotalValue}>{formatINR(sip.total)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* EMI Screen */}
      {activeTab === "emi" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Home & Personal Loan EMI</Text>
          <Text style={styles.cardSubtitle}>
            Calculate monthly installments and total interest over the loan tenure.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Loan Principal Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={emiPrincipal}
              onChangeText={setEmiPrincipal}
              keyboardType="numeric"
              placeholder="2500000"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Annual Interest Rate (%)</Text>
            <TextInput
              style={styles.input}
              value={emiRate}
              onChangeText={setEmiRate}
              keyboardType="numeric"
              placeholder="8.5"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tenure (Years)</Text>
            <TextInput
              style={styles.input}
              value={emiTenureYears}
              onChangeText={setEmiTenureYears}
              keyboardType="numeric"
              placeholder="20"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultTotalLabel}>Monthly EMI</Text>
              <Text style={[styles.resultTotalValue, { color: Colors.primaryLight }]}>
                {formatINR(emi.emi)}/mo
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Principal Amount</Text>
              <Text style={styles.resultValue}>{formatINR(parseFloat(emiPrincipal) || 0)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total Interest Payable</Text>
              <Text style={[styles.resultValue, { color: Colors.errorLight }]}>
                {formatINR(emi.totalInterest)}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total Payment (P + I)</Text>
              <Text style={styles.resultValue}>{formatINR(emi.totalPayable)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* FD Screen */}
      {activeTab === "fd" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Fixed Deposit (FD)</Text>
          <Text style={styles.cardSubtitle}>
            Compound interest calculated on quarterly rest basis.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Deposit Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={fdPrincipal}
              onChangeText={setFdPrincipal}
              keyboardType="numeric"
              placeholder="100000"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Interest Rate (% p.a.)</Text>
            <TextInput
              style={styles.input}
              value={fdRate}
              onChangeText={setFdRate}
              keyboardType="numeric"
              placeholder="7.1"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tenure (Years)</Text>
            <TextInput
              style={styles.input}
              value={fdYears}
              onChangeText={setFdYears}
              keyboardType="numeric"
              placeholder="5"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Principal Invested</Text>
              <Text style={styles.resultValue}>{formatINR(fd.principal)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total Interest Earned</Text>
              <Text style={[styles.resultValue, { color: Colors.success }]}>
                +{formatINR(fd.interest)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.resultRow}>
              <Text style={styles.resultTotalLabel}>Maturity Amount</Text>
              <Text style={styles.resultTotalValue}>{formatINR(fd.maturity)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* HRA Screen */}
      {activeTab === "hra" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>HRA Exemption (Rule 2A)</Text>
          <Text style={styles.cardSubtitle}>
            Compute statutory tax exemption under Section 10(13A).
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Annual Basic Salary (₹)</Text>
            <TextInput
              style={styles.input}
              value={basicSalary}
              onChangeText={setBasicSalary}
              keyboardType="numeric"
              placeholder="600000"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Annual HRA Received (₹)</Text>
            <TextInput
              style={styles.input}
              value={hraReceived}
              onChangeText={setHraReceived}
              keyboardType="numeric"
              placeholder="240000"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Annual Rent Paid (₹)</Text>
            <TextInput
              style={styles.input}
              value={rentPaid}
              onChangeText={setRentPaid}
              keyboardType="numeric"
              placeholder="300000"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.metroToggleRow}>
            <Text style={styles.inputLabel}>City Type</Text>
            <View style={styles.metroButtons}>
              <TouchableOpacity
                style={[styles.metroButton, isMetro && styles.metroButtonActive]}
                onPress={() => setIsMetro(true)}
              >
                <Text style={[styles.metroText, isMetro && styles.metroTextActive]}>
                  Metro (50%)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.metroButton, !isMetro && styles.metroButtonActive]}
                onPress={() => setIsMetro(false)}
              >
                <Text style={[styles.metroText, !isMetro && styles.metroTextActive]}>
                  Non-Metro (40%)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultTotalLabel}>Exempt HRA</Text>
              <Text style={[styles.resultTotalValue, { color: Colors.success }]}>
                {formatINR(hra.exempt)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Taxable HRA</Text>
              <Text style={[styles.resultValue, { color: Colors.warning }]}>
                {formatINR(hra.taxable)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* NPS Screen */}
      {activeTab === "nps" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>NPS & Section 80CCD(1B)</Text>
          <Text style={styles.cardSubtitle}>
            National Pension System extra ₹50,000 deduction benefit.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Contribution (₹)</Text>
            <TextInput
              style={styles.input}
              value={npsMonthly}
              onChangeText={setNpsMonthly}
              keyboardType="numeric"
              placeholder="5000"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Expected Growth (% p.a.)</Text>
            <TextInput
              style={styles.input}
              value={npsRate}
              onChangeText={setNpsRate}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Years to Retirement</Text>
            <TextInput
              style={styles.input}
              value={npsYears}
              onChangeText={setNpsYears}
              keyboardType="numeric"
              placeholder="25"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Annual 80CCD(1B) Tax Saved</Text>
              <Text style={[styles.resultValue, { color: Colors.success }]}>
                ~{formatINR(nps.taxSavedAnnual)}/yr
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Total Principal Invested</Text>
              <Text style={styles.resultValue}>{formatINR(nps.invested)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.resultRow}>
              <Text style={styles.resultTotalLabel}>Estimated Retirement Corpus</Text>
              <Text style={styles.resultTotalValue}>{formatINR(nps.total)}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tax Breakeven Screen */}
      {activeTab === "breakeven" && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Old vs New Regime Breakeven</Text>
          <Text style={styles.cardSubtitle}>
            Determine which tax regime saves you more money based on your real deductions.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Annual Gross Income (₹)</Text>
            <TextInput
              style={styles.input}
              value={annualIncome}
              onChangeText={setAnnualIncome}
              keyboardType="numeric"
              placeholder="1200000"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Total Deductions (80C, 80D, HRA, 24b) (₹)</Text>
            <TextInput
              style={styles.input}
              value={deductionsTotal}
              onChangeText={setDeductionsTotal}
              keyboardType="numeric"
              placeholder="250000"
              placeholderTextColor={Colors.textTertiary}
            />
          </View>

          <View style={styles.resultBox}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Old Regime Tax + Cess</Text>
              <Text style={styles.resultValue}>{formatINR(breakeven.oldTotal)}</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>New Regime Tax + Cess</Text>
              <Text style={styles.resultValue}>{formatINR(breakeven.newTotal)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.recommendationBanner}>
              <Ionicons name="sparkles" size={18} color={Colors.primaryLight} />
              <View style={{ flex: 1 }}>
                <Text style={styles.recommendationTitle}>
                  {breakeven.winner} is recommended!
                </Text>
                <Text style={styles.recommendationSubtitle}>
                  You save approximately {formatINR(breakeven.diff)} in taxes.
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

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
  tabsContainer: {
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryLight,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
  },
  metroToggleRow: {
    marginBottom: Spacing.md,
  },
  metroButtons: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: 4,
  },
  metroButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  metroButtonActive: {
    backgroundColor: Colors.primaryContainer,
    borderColor: Colors.primary,
  },
  metroText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  metroTextActive: {
    color: Colors.onPrimaryContainer,
    fontWeight: "700",
  },
  resultBox: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  resultLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  resultValue: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  resultTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textPrimary,
  },
  resultTotalValue: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.primaryLight,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  recommendationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(99, 102, 241, 0.25)",
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primaryLight,
  },
  recommendationSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
})
