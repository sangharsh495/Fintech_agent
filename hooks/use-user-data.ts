"use client"

import { useState, useEffect } from "react"

export interface UserDataState {
  hasData: boolean
  hasBanks: boolean
  transactionCount: number
  isLoading: boolean
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  savingsRate: number
  perBankBalances: Array<{
    bankId: string
    bankName: string
    accountNickname?: string | null
    accountLast4?: string | null
    accountType: string
    balance: number
  }>
  recentTransactions: unknown[]
  alerts: Array<{ type: string; message: string; date: string }>
}

export function useUserData(): UserDataState {
  const [state, setState] = useState<UserDataState>({
    hasData: false,
    hasBanks: false,
    transactionCount: 0,
    isLoading: true,
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpense: 0,
    savingsRate: 0,
    perBankBalances: [],
    recentTransactions: [],
    alerts: [],
  })

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, banksRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/banks"),
        ])

        if (!dashboardRes.ok || !banksRes.ok) {
          setState((s) => ({ ...s, isLoading: false }))
          return
        }

        const [dashboard, banks] = await Promise.all([
          dashboardRes.json(),
          banksRes.json(),
        ])

        setState({
          hasData: dashboard.hasData ?? false,
          hasBanks: (banks.banks?.length ?? 0) > 0,
          transactionCount: dashboard.recentTransactions?.length ?? 0,
          isLoading: false,
          totalBalance: dashboard.totalBalance ?? 0,
          monthlyIncome: dashboard.monthlyIncome ?? 0,
          monthlyExpense: dashboard.monthlyExpense ?? 0,
          savingsRate: dashboard.savingsRate ?? 0,
          perBankBalances: dashboard.perBankBalances ?? [],
          recentTransactions: dashboard.recentTransactions ?? [],
          alerts: dashboard.alerts ?? [],
        })
      } catch {
        setState((s) => ({ ...s, isLoading: false }))
      }
    }

    fetchData()
  }, [])

  return state
}
