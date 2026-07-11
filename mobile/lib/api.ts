// FinFlow Mobile — API Configuration
// Change this to your deployed Vercel URL after deployment

// For development: use your local machine's IP (not localhost — Android emulator can't access localhost)
// For production: use your Vercel URL
const DEV_API_URL = "http://192.168.1.100:3000" // Replace with your machine's local IP
const PROD_API_URL = "https://finflow-app-ashen.vercel.app" // Your deployed Vercel URL

// Toggle this to switch between dev and prod
const IS_PRODUCTION = true

export const API_BASE_URL = IS_PRODUCTION ? PROD_API_URL : DEV_API_URL

/**
 * Type-safe API client for FinFlow backend
 */
export async function api<T = any>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE"
    body?: any
    token?: string | null
    headers?: Record<string, string>
    isFormData?: boolean
  } = {}
): Promise<T> {
  const { method = "GET", body, token, headers = {}, isFormData = false } = options

  const config: RequestInit = {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
  }

  if (body) {
    config.body = isFormData ? body : JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: "Network error" }))
    throw new ApiError(response.status, errorData.error || "Something went wrong")
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) return {} as T

  return response.json()
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

// ─── Typed API functions ───────────────────────────────────

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api<{ success: boolean; message: string; userId: string }>("/api/auth/register", { method: "POST", body: data }),

  verifyOtp: (data: { email: string; otp: string }) =>
    api<{ success: boolean; message: string }>("/api/auth/verify-otp", { method: "POST", body: data }),

  sendOtp: (data: { email: string }) =>
    api<{ success: boolean }>("/api/auth/send-otp", { method: "POST", body: data }),

  login: (data: { email: string; password: string }) =>
    api<{ success: boolean; token: string; user: { id: string; email: string; name: string; image: string | null } }>("/api/auth/mobile-login", { method: "POST", body: data }),
}

export const dashboardApi = {
  get: (token: string) =>
    api<{
      hasData: boolean
      totalBalance: number
      monthlyIncome: number
      monthlyExpense: number
      savingsRate: number
      netWorth: number
      recentTransactions: any[]
      perBankBalances: any[]
      alerts: any[]
    }>("/api/dashboard", { token }),
}

export const transactionsApi = {
  list: (token: string, params?: { page?: number; limit?: number; bankId?: string; type?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set("page", params.page.toString())
    if (params?.limit) searchParams.set("limit", params.limit.toString())
    if (params?.bankId) searchParams.set("bankId", params.bankId)
    if (params?.type) searchParams.set("type", params.type)
    return api<{ transactions: any[]; pagination: any }>(`/api/transactions?${searchParams}`, { token })
  },
}

export const analyticsApi = {
  get: (token: string, bankId?: string) => {
    const params = bankId ? `?bankId=${bankId}` : ""
    return api<{ hasData: boolean; monthly: any[]; categoryBreakdown: any[]; totals: any }>(`/api/analytics${params}`, { token })
  },
}

export const banksApi = {
  list: (token: string) =>
    api<{ banks: any[] }>("/api/banks", { token }),

  add: (token: string, data: { bankName: string; accountNickname?: string; accountLast4?: string; accountType?: string }) =>
    api<{ bank: any }>("/api/banks", { method: "POST", body: data, token }),

  supported: () =>
    api<{ banks: any[] }>("/api/banks/supported"),
}

export const profileApi = {
  get: (token: string) =>
    api<any>("/api/profile", { token }),

  update: (token: string, data: any) =>
    api<{ success: boolean }>("/api/profile", { method: "PATCH", body: data, token }),
}

export const taxApi = {
  get: (token: string, fy?: string) => {
    const params = fy ? `?fy=${fy}` : ""
    return api<any>(`/api/tax${params}`, { token })
  },

  updateRegime: (token: string, regime: "old" | "new") =>
    api<{ success: boolean }>("/api/tax", { method: "POST", body: { regime }, token }),
}

export const uploadApi = {
  statement: (token: string, formData: FormData) =>
    api<{
      success: boolean
      transactionsAdded: number
      transactionsSkipped: number
      message: string
    }>("/api/upload/statement", { method: "POST", body: formData, token, isFormData: true }),
}

export const aiApi = {
  chat: async (token: string, messages: any[], currentPath: string = "/mobile") => {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messages, currentPath }),
    })

    if (!response.ok) {
      throw new ApiError(response.status, "AI service unavailable")
    }

    return response // Return the raw response for streaming
  },
}
