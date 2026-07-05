export interface CalculatorInput {
    id: string
    label: string
    min: number
    max: number
    step: number
    defaultValue: number
    prefix?: string
    suffix?: string
    transformDisplay?: (val: number) => string
}

export interface CalculatorOutput {
    label: string
    value: string | number
    color: string
}

export interface ChartConfig {
    xAxisKey: string
    areas: Array<{
        dataKey: string
        name: string
        color: string
        stackId?: string
    }>
    tooltipPrefix?: string
    tooltipFormatter?: (val: number) => string
    yAxisFormatter?: (val: number) => string
}

export interface CalculatorConfig {
    id: string
    title: string
    description: string
    inputs: CalculatorInput[]
    calculate: (values: Record<string, number>) => {
        outputs: CalculatorOutput[]
        chartData: any[]
        chartConfig: ChartConfig
    }
}

// ------------------------------------------------------------------
// HELPER FORMATTERS
// ------------------------------------------------------------------
const formatLakhs = (val: number) => `₹${(val / 100000).toFixed(2)}L`
const formatCurrency = (val: number) => `₹${val.toLocaleString()}`
const formatPercent = (val: number) => `${val.toFixed(1)}%`

// ------------------------------------------------------------------
// CONFIGURATIONS
// ------------------------------------------------------------------

export const calculatorConfigs: Record<string, CalculatorConfig> = {
    ppf: {
        id: "ppf",
        title: "PPF Calculator",
        description: "Calculate your Public Provident Fund returns (15-year lock-in)",
        inputs: [
            {
                id: "yearlyInvestment",
                label: "Yearly Investment",
                min: 500,
                max: 150000,
                step: 500,
                defaultValue: 150000,
                prefix: "₹",
                transformDisplay: formatCurrency,
            },
            {
                id: "rate",
                label: "Interest Rate",
                min: 7.1, // Fixed PPF rate approx
                max: 7.1,
                step: 0.1,
                defaultValue: 7.1,
                suffix: "% p.a.",
            },
            {
                id: "tenure",
                label: "Time Period",
                min: 15,
                max: 50,
                step: 5,
                defaultValue: 15,
                suffix: " Yrs (Blocks of 5)",
            },
        ],
        calculate: (v) => {
            const P = v.yearlyInvestment
            const rate = v.rate / 100
            let balance = 0
            const chartData = []

            for (let i = 1; i <= v.tenure; i++) {
                const principal = P * i
                balance = (balance + P) * (1 + rate)
                chartData.push({
                    year: i,
                    invested: principal,
                    totalValue: balance,
                })
            }

            const totalInvested = P * v.tenure
            const totalWealthGained = balance - totalInvested

            return {
                outputs: [
                    { label: "Total Invested", value: formatLakhs(totalInvested), color: "from-blue-500 to-indigo-500" },
                    { label: "Wealth Gained", value: formatLakhs(totalWealthGained), color: "from-emerald-500 to-teal-500" },
                    { label: "Maturity Value", value: formatLakhs(balance), color: "from-fuchsia-500 to-pink-500" },
                ],
                chartData,
                chartConfig: {
                    xAxisKey: "year",
                    areas: [
                        { dataKey: "totalValue", name: "Total Value", color: "#10b981" },
                        { dataKey: "invested", name: "Amount Invested", color: "#3b82f6" },
                    ],
                    tooltipPrefix: "₹",
                    tooltipFormatter: (val) => `${(val / 100000).toFixed(2)}L`,
                    yAxisFormatter: (val) => `${(val / 100000).toFixed(0)}L`,
                },
            }
        },
    },

    inflation: {
        id: "inflation",
        title: "Inflation Calculator",
        description: "Calculate the future value of expenses and purchasing power",
        inputs: [
            {
                id: "currentExpense",
                label: "Current Monthly Expense",
                min: 10000,
                max: 500000,
                step: 5000,
                defaultValue: 50000,
                prefix: "₹",
                transformDisplay: formatCurrency,
            },
            {
                id: "inflationRate",
                label: "Expected Inflation Rate",
                min: 2,
                max: 12,
                step: 0.5,
                defaultValue: 6,
                suffix: "% p.a.",
            },
            {
                id: "years",
                label: "Time Horizon",
                min: 1,
                max: 40,
                step: 1,
                defaultValue: 10,
                suffix: " Yrs",
            },
        ],
        calculate: (v) => {
            const expense = v.currentExpense
            const rate = v.inflationRate / 100
            const chartData = []

            for (let i = 0; i <= v.years; i++) {
                chartData.push({
                    year: i,
                    expense: expense * Math.pow(1 + rate, i),
                    purchasingPower: (100 / Math.pow(1 + rate, i)),
                })
            }

            const futureExpense = expense * Math.pow(1 + rate, v.years)
            const purchasingPowerDrop = chartData[chartData.length - 1].purchasingPower

            return {
                outputs: [
                    { label: "Current Expense", value: formatCurrency(expense), color: "from-blue-500 to-cyan-500" },
                    { label: "Future Expense", value: formatCurrency(Math.round(futureExpense)), color: "from-rose-500 to-red-500" },
                    { label: "Value of ₹100", value: `₹${Math.round(purchasingPowerDrop)}`, color: "from-emerald-500 to-teal-500" },
                ],
                chartData,
                chartConfig: {
                    xAxisKey: "year",
                    areas: [
                        { dataKey: "expense", name: "Monthly Expense Setup", color: "#ef4444" },
                    ],
                    tooltipPrefix: "₹",
                    tooltipFormatter: (val) => `${Math.round(val).toLocaleString()}`,
                    yAxisFormatter: (val) => `${(val / 1000).toFixed(0)}K`,
                },
            }
        },
    },

    mf: {
        id: "mf",
        title: "Mutual Fund Returns",
        description: "Calculate lump sum mutual fund returns over time",
        inputs: [
            {
                id: "investment",
                label: "Total Investment",
                min: 5000,
                max: 10000000,
                step: 5000,
                defaultValue: 100000,
                prefix: "₹",
                transformDisplay: formatCurrency,
            },
            {
                id: "returnRate",
                label: "Expected Return",
                min: 5,
                max: 30,
                step: 0.5,
                defaultValue: 12,
                suffix: "% p.a.",
            },
            {
                id: "tenure",
                label: "Time Period",
                min: 1,
                max: 40,
                step: 1,
                defaultValue: 10,
                suffix: " Yrs",
            },
        ],
        calculate: (v) => {
            const P = v.investment
            const rate = v.returnRate / 100
            const chartData = []

            for (let i = 0; i <= v.tenure; i++) {
                const maturity = P * Math.pow(1 + rate, i)
                chartData.push({
                    year: i,
                    invested: P,
                    totalValue: maturity
                })
            }

            const finalAmount = P * Math.pow(1 + rate, v.tenure)
            const gains = finalAmount - P

            return {
                outputs: [
                    { label: "Total Invested", value: formatLakhs(P), color: "from-blue-500 to-indigo-500" },
                    { label: "Est. Returns", value: formatLakhs(gains), color: "from-emerald-500 to-teal-500" },
                    { label: "Total Value", value: formatLakhs(finalAmount), color: "from-purple-500 to-pink-500" },
                ],
                chartData,
                chartConfig: {
                    xAxisKey: "year",
                    areas: [
                        { dataKey: "totalValue", name: "Total Value", color: "#10b981" },
                        { dataKey: "invested", name: "Invested", color: "#6366f1" },
                    ],
                    tooltipPrefix: "₹",
                    tooltipFormatter: (val) => `${(val / 100000).toFixed(2)}L`,
                    yAxisFormatter: (val) => `${(val / 100000).toFixed(1)}L`,
                },
            }
        },
    },

    // Add a generic fallback structure for the 10+ others initially
    // Real logic can be mapped in the future as needed.
}

export const generateGenericConfig = (title: string, id: string): CalculatorConfig => ({
    id,
    title: `${title} Calculator`,
    description: "Interactive data model for complex financial projection.",
    inputs: [
        {
            id: "input1",
            label: "Primary Input Amount",
            min: 10000,
            max: 1000000,
            step: 10000,
            defaultValue: 100000,
            prefix: "₹",
            transformDisplay: formatCurrency,
        },
        {
            id: "input2",
            label: "Growth Rate",
            min: 5,
            max: 20,
            step: 0.5,
            defaultValue: 10,
            suffix: "%",
        },
        {
            id: "input3",
            label: "Horizon",
            min: 1,
            max: 30,
            step: 1,
            defaultValue: 10,
            suffix: " Yrs",
        },
    ],
    calculate: (v) => {
        const P = v.input1
        const rate = v.input2 / 100
        const chartData = []

        for (let i = 0; i <= v.input3; i++) {
            const value = P * Math.pow(1 + rate, i)
            chartData.push({
                year: i,
                principal: P,
                totalValue: value
            })
        }

        const finalAmount = P * Math.pow(1 + rate, v.input3)

        return {
            outputs: [
                { label: "Base Value", value: formatLakhs(P), color: "from-slate-500 to-slate-400" },
                { label: "Growth", value: formatLakhs(finalAmount - P), color: "from-emerald-500 to-teal-500" },
                { label: "Outcome", value: formatLakhs(finalAmount), color: "from-primary to-accent" },
            ],
            chartData,
            chartConfig: {
                xAxisKey: "year",
                areas: [
                    { dataKey: "totalValue", name: "Projection", color: "#10b981" },
                    { dataKey: "principal", name: "Base", color: "#64748b" },
                ],
                tooltipPrefix: "₹",
                tooltipFormatter: (val) => `${(val / 100000).toFixed(2)}L`,
                yAxisFormatter: (val) => `${(val / 100000).toFixed(1)}L`,
            },
        }
    },
})
