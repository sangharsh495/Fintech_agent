// FinFlow Mobile - API Configuration
//
// The base URL comes from EXPO_PUBLIC_API_URL so a build can be pointed at a
// local machine, a preview deployment or production without editing source.
// Expo inlines EXPO_PUBLIC_* variables at build time.
//
// For local development set EXPO_PUBLIC_API_URL to your machine's LAN IP
// (e.g. http://192.168.1.100:3000) - an Android emulator cannot reach
// localhost on the host machine.

const FALLBACK_API_URL = "https://finflow-app-ashen.vercel.app"

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? FALLBACK_API_URL
).replace(/\/+$/, "")

if (!process.env.EXPO_PUBLIC_API_URL && __DEV__) {
  console.warn(
    `[api] EXPO_PUBLIC_API_URL is not set - falling back to ${FALLBACK_API_URL}. ` +
      "Set it in .env to point the app at your local server."
  )
}

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

export interface RegimeSummary {
  regime: "OLD" | "NEW"
  grossTotalIncome: number
  totalDeductions: number
  taxableIncome: number
  taxPayable: number
  effectiveRate: number
  rebate87A: number
  surcharge: number
  cess: number
  workings: string[]
}

export interface TaxOverview {
  fy: string
  financialYear: string
  assessmentYear: string
  hasData: boolean
  regime: "old" | "new"
  oldRegime: RegimeSummary
  newRegime: RegimeSummary
  savingsComparison: number
  deductionList: Array<{
    section: string
    label: string
    description: string
    amount: number
    limit: number | null
    detected: boolean
  }>
  suggestions: string[]
  grossIncome: number
  betterRegime: "old" | "new"
}

export const taxApi = {
  get: (token: string, fy?: string) => {
    const params = fy ? `?fy=${fy}` : ""
    return api<TaxOverview>(`/api/tax${params}`, { token })
  },

  updateRegime: (token: string, regime: "old" | "new") =>
    api<{ success: boolean }>("/api/tax", { method: "POST", body: { regime }, token }),
}

// ─── Filing (Form 16 / AIS / CAS ingestion and ITR generation) ───

export const filingApi = {
  /** The reconciled draft: computation, ITR form selection and findings. */
  draft: (token: string, fy = "2025-2026") =>
    api<any>(`/api/tax/filing?fy=${fy}`, { token }),

  /** Saves wizard declarations and returns the recomputed draft. */
  update: (
    token: string,
    body: {
      fy?: string
      regimeOverride?: "OLD" | "NEW"
      capitalGains?: { stcg111A: number; ltcg112A: number; otherCapitalGains: number }
      declarations?: Record<string, boolean | number>
      userDeductions?: Record<string, number>
    }
  ) => api<any>("/api/tax/filing", { method: "POST", body, token }),

  /** Generates the ITD e-filing JSON. Throws ApiError(422) with issues. */
  generateJson: (token: string, body: Record<string, unknown>) =>
    api<{ form: string; fileName: string; json: unknown; warnings: any[] }>(
      "/api/tax/filing/json",
      { method: "POST", body, token }
    ),
}

export const taxDocumentsApi = {
  list: (token: string, fy = "2025-2026") =>
    api<{ financialYear: string; documents: any[] }>(`/api/tax/documents?fy=${fy}`, { token }),

  /**
   * Uploads a Form 16, AIS/TIS or CAS. On a password-protected PDF the server
   * replies 422 and ApiError carries the prompt to show the user.
   */
  upload: (
    token: string,
    file: { uri: string; name: string; type: string },
    documentType: "form16" | "ais" | "tis" | "cas",
    options: { fy?: string; password?: string } = {}
  ) => {
    const form = new FormData()
    // React Native's FormData takes a {uri,name,type} object, not a Blob.
    form.append("file", file as unknown as Blob)
    form.append("documentType", documentType)
    form.append("fy", options.fy ?? "2025-2026")
    if (options.password) form.append("password", options.password)

    return api<{ document: any; duplicate: boolean }>("/api/tax/documents", {
      method: "POST",
      body: form,
      token,
      isFormData: true,
    })
  },

  remove: (token: string, id: string) =>
    api<{ success: boolean }>(`/api/tax/documents?id=${id}`, { method: "DELETE", token }),
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

export const chatSessionsApi = {
  list: (token: string) =>
    api<{ sessions: Array<{ id: string; title: string | null; updatedAt: string; messageCount: number }> }>(
      "/api/ai/sessions",
      { token }
    ),

  create: (token: string, title = "New Chat") =>
    api<{ session: { id: string; title: string } }>("/api/ai/sessions", {
      method: "POST",
      body: { title, pageContext: "/mobile" },
      token,
    }),

  messages: (token: string, sessionId: string) =>
    api<{ messages: Array<{ id: string; role: string; content: string; createdAt: string }> }>(
      `/api/ai/sessions/${sessionId}/messages`,
      { token }
    ),

  remove: (token: string, sessionId: string) =>
    api<{ success: boolean }>(`/api/ai/sessions/${sessionId}`, { method: "DELETE", token }),
}

export const aiApi = {
  chat: async (
    token: string,
    messages: any[],
    currentPath: string = "/mobile",
    sessionId?: string
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      // sessionId keeps the reply on the same thread the app is showing.
      body: JSON.stringify({ messages, currentPath, sessionId }),
    })

    if (!response.ok) {
      throw new ApiError(response.status, "AI service unavailable")
    }

    return response // Return the raw response for streaming
  },
}
