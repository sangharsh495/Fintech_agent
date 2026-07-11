import { db } from "@/server/db"
import { aiAccessPolicies, aiChatLogs } from "@/server/db/schema"
import { eq, and, gte, count, sum } from "drizzle-orm"

// Oracle Cloud Infrastructure (OCI) configuration
const OCI_CONFIG = {
  tenancyId: process.env.OCI_TENANCY_ID || "",
  userId: process.env.OCI_USER_ID || "",
  fingerprint: process.env.OCI_FINGERPRINT || "",
  privateKey: process.env.OCI_PRIVATE_KEY || "",
  region: process.env.OCI_REGION || "ap-mumbai-1",
  compartmentId: process.env.OCI_COMPARTMENT_ID || "",
}

interface OracleAccessPolicy {
  userId: string
  pageAccess: Record<string, PageAccessPolicy>
  aiModelAccess: AIModelAccessPolicy
  dataAccessLevel: "full" | "summary" | "restricted"
  customPolicies?: Record<string, unknown>
}

interface PageAccessPolicy {
  allowed: boolean
  dataScope: "full" | "summary" | "restricted"
  allowedOperations: string[]
  restrictions?: string[]
}

interface AIModelAccessPolicy {
  allowed: boolean
  model: string
  maxTokens: number
  allowedContextTypes: string[]
  rateLimit: {
    requestsPerMinute: number
    tokensPerMinute: number
  }
}

interface UserAccessContext {
  userId: string
  email: string
  pageAccess: Record<string, PageAccessPolicy>
  aiModelConfig: AIModelAccessPolicy
  dataAccessLevel: "full" | "summary" | "restricted"
  oracleUserId?: string
  compartmentId?: string
}

class OracleAccessControlService {
  private cache: Map<string, { data: UserAccessContext; expires: number }> = new Map()
  private cacheTTL = 5 * 60 * 1000 // 5 minutes

  /**
   * Initialize Oracle Cloud IAM client (placeholder for OCI SDK integration)
   */
  private async initializeOCIClient() {
    // In production, use @oracle/oci-sdk
    // const { IdentityClient, AuthDetails } = require("@oracle/oci-sdk")
    // This is a placeholder for OCI SDK integration
    return null
  }

  /**
   * Fetch user access policies from ai_access_policies table in PostgreSQL
   */
  async getUserAccessPolicies(userId: string, email: string): Promise<OracleAccessPolicy | null> {
    const cacheKey = `user_access_${userId}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      return this.buildPolicyFromContext(cached.data)
    }

    try {
      // Fetch from PostgreSQL via Drizzle
      const [record] = await db
        .select()
        .from(aiAccessPolicies)
        .where(eq(aiAccessPolicies.userId, userId))
        .limit(1)

      if (record) {
        const context: UserAccessContext = {
          userId,
          email,
          pageAccess: this.buildPageAccessFromAllowedPages(record.allowedPages as string[]),
          aiModelConfig: this.buildAIModelConfig(record),
          dataAccessLevel: email?.includes("premium") || email?.includes("pro") ? "full" : "summary",
        }
        this.cache.set(cacheKey, { data: context, expires: Date.now() + this.cacheTTL })
        return this.buildPolicyFromContext(context)
      }

      // Fallback: Default policies based on user profile
      return this.getDefaultAccessPolicy(userId, email)
    } catch (error) {
      console.error("[Oracle Access Control] Error fetching policies:", error)
      return this.getDefaultAccessPolicy(userId, email)
    }
  }

  /**
   * Build page access map from list of allowed pages
   */
  private buildPageAccessFromAllowedPages(allowedPages: string[]): Record<string, PageAccessPolicy> {
    const access: Record<string, PageAccessPolicy> = {}
    for (const page of allowedPages) {
      access[page] = {
        allowed: true,
        dataScope: "full" as const,
        allowedOperations: ["read", "chat", "analyze"],
      }
    }
    return access
  }

  /**
   * Build AI model config from database record
   */
  private buildAIModelConfig(record: typeof aiAccessPolicies.$inferSelect): AIModelAccessPolicy {
    return {
      allowed: record.isEnabled,
      model: process.env.ORACLE_AI_MODEL || "oracle-llama-3-8b",
      maxTokens: record.maxTokensPerRequest ?? 2000,
      allowedContextTypes: record.allowedContextTypes as string[],
      rateLimit: {
        requestsPerMinute: (record.maxDailyRequests ?? 50) / 24 / 60, // Approximate per-minute from daily
        tokensPerMinute: (record.maxDailyTokens ?? 50000) / 24 / 60,
      },
    }
  }

  /**
   * Build OracleAccessPolicy from UserAccessContext
   */
  private buildPolicyFromContext(context: UserAccessContext): OracleAccessPolicy {
    return {
      userId: context.userId,
      pageAccess: context.pageAccess,
      aiModelAccess: context.aiModelConfig,
      dataAccessLevel: context.dataAccessLevel,
      customPolicies: {},
    }
  }

  /**
   * Get default access policy for a user
   */
  private getDefaultAccessPolicy(userId: string, email: string): OracleAccessPolicy {
    const isPremium = email?.includes("premium") || email?.includes("pro") // Example logic

    return {
      userId,
      pageAccess: {
        "/": { allowed: true, dataScope: "full", allowedOperations: ["read", "chat", "analyze"] },
        "/analytics": { allowed: true, dataScope: "full", allowedOperations: ["read", "chat", "analyze", "export", "ml-insights"] },
        "/tax": { allowed: true, dataScope: "full", allowedOperations: ["read", "chat", "calculate", "optimize", "export"] },
        "/onboarding": { allowed: true, dataScope: "summary", allowedOperations: ["read", "guide", "assist"] },
        "/settings": { allowed: true, dataScope: "summary", allowedOperations: ["read", "update-preferences", "manage-consent"] },
        "/upload": { allowed: true, dataScope: "restricted", allowedOperations: ["read", "upload", "validate"] },
        "/calculators": { allowed: true, dataScope: "full", allowedOperations: ["read", "calculate", "compare", "export"] },
        "/ai-ca": { allowed: true, dataScope: "full", allowedOperations: ["read", "chat", "analyze", "full-context"] },
      },
      aiModelAccess: {
        allowed: true,
        model: process.env.ORACLE_AI_MODEL || "oracle-llama-3-8b",
        maxTokens: isPremium ? 4000 : 2000,
        allowedContextTypes: isPremium
          ? ["profile", "transactions", "tax", "analytics", "ml-clusters", "documents", "full-context"]
          : ["profile", "transactions", "tax", "analytics", "summary"],
        rateLimit: isPremium
          ? { requestsPerMinute: 60, tokensPerMinute: 100000 }
          : { requestsPerMinute: 20, tokensPerMinute: 20000 },
      },
      dataAccessLevel: isPremium ? "full" : "summary",
      customPolicies: {},
    }
  }

  /**
   * Verify user has access to a specific page
   */
  async verifyPageAccess(userId: string, email: string, pagePath: string): Promise<PageAccessPolicy> {
    const policy = await this.getUserAccessPolicies(userId, email)
    if (!policy) {
      return { allowed: false, dataScope: "restricted", allowedOperations: [], restrictions: ["No access policy found"] }
    }

    // Normalize path
    const normalizedPath = this.normalizePath(pagePath)
    const pagePolicy = policy.pageAccess[normalizedPath] || policy.pageAccess["/"]

    if (!pagePolicy?.allowed) {
      return { allowed: false, dataScope: "restricted", allowedOperations: [], restrictions: ["Page access denied by policy"] }
    }

    return pagePolicy
  }

  /**
   * Verify user has access to AI model with specific context
   */
  async verifyAIModelAccess(
    userId: string,
    email: string,
    requestedContextTypes: string[],
    requestedTokens: number
  ): Promise<{ allowed: boolean; policy: AIModelAccessPolicy; reason?: string }> {
    const policy = await this.getUserAccessPolicies(userId, email)
    if (!policy) {
      return { allowed: false, policy: this.getDefaultAIModelPolicy(), reason: "No access policy found" }
    }

    const aiPolicy = policy.aiModelAccess

    if (!aiPolicy.allowed) {
      return { allowed: false, policy: aiPolicy, reason: "AI model access disabled for user" }
    }

    // Check context type permissions
    const unauthorizedContexts = requestedContextTypes.filter(
      (ctx) => !aiPolicy.allowedContextTypes.includes(ctx)
    )
    if (unauthorizedContexts.length > 0) {
      return {
        allowed: false,
        policy: aiPolicy,
        reason: `Unauthorized context types: ${unauthorizedContexts.join(", ")}`,
      }
    }

    // Check token limit
    if (requestedTokens > aiPolicy.maxTokens) {
      return {
        allowed: false,
        policy: aiPolicy,
        reason: `Requested tokens (${requestedTokens}) exceeds limit (${aiPolicy.maxTokens})`,
      }
    }

    return { allowed: true, policy: aiPolicy }
  }

  /**
   * Get default AI model policy
   */
  private getDefaultAIModelPolicy(): AIModelAccessPolicy {
    return {
      allowed: true,
      model: process.env.ORACLE_AI_MODEL || "oracle-llama-3-8b",
      maxTokens: 2000,
      allowedContextTypes: ["profile", "transactions", "tax", "analytics", "summary"],
      rateLimit: { requestsPerMinute: 20, tokensPerMinute: 20000 },
    }
  }

  /**
   * Normalize page path for policy lookup
   */
  private normalizePath(path: string): string {
    // Normalize paths like /analytics/clusters -> /analytics
    const segments = path.split("/").filter(Boolean)
    if (segments.length === 0) return "/"
    return `/${segments[0]}`
  }

  /**
   * Get user access context for AI model
   */
  async getUserAccessContext(userId: string, email: string, currentPath: string): Promise<UserAccessContext> {
    const policy = await this.getUserAccessPolicies(userId, email)
    const pagePolicy = await this.verifyPageAccess(userId, email, currentPath)
    const aiPolicy = policy?.aiModelAccess || this.getDefaultAIModelPolicy()

    return {
      userId,
      email,
      pageAccess: policy?.pageAccess || {},
      aiModelConfig: aiPolicy,
      dataAccessLevel: policy?.dataAccessLevel || "summary",
      oracleUserId: policy?.customPolicies?.oracleUserId as string,
      compartmentId: policy?.customPolicies?.compartmentId as string,
    }
  }

  /**
   * Log access attempt for audit
   */
  async logAccessAttempt(
    userId: string,
    email: string,
    action: string,
    resource: string,
    allowed: boolean,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      // Log access check as an AI chat log entry with isError when denied
      if (!allowed) {
        await db.insert(aiChatLogs).values({
          userId,
          page: "/" as const,
          contextTypes: [],
          modelProvider: "oracle_cloud" as const,
          modelName: "access-control",
          messagesCount: 0,
          isError: true,
          errorMessage: `Access denied: ${action} on ${resource}${details ? ` - ${JSON.stringify(details)}` : ""}`,
        })
      }
    } catch (error) {
      console.error("[Oracle Access Control] Audit log failed:", error)
    }
  }

  /**
   * Check rate limits for AI model usage based on stored chat logs
   */
  async checkRateLimit(userId: string, tokensRequested: number): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    try {
      const windowStart = new Date(Date.now() - 60000) // Last 60 seconds
      const now = new Date()

      // Get usage in the last minute from ai_chat_logs
      const logs = await db
        .select()
        .from(aiChatLogs)
        .where(
          and(
            eq(aiChatLogs.userId, userId),
            gte(aiChatLogs.createdAt, windowStart)
          )
        )

      const tokensUsed = logs.reduce((sum: number, log: typeof aiChatLogs.$inferSelect) => sum + (log.tokensUsed || 0), 0)
      const requestCount = logs.length

      // Check daily limits from access policies table
      const [policy] = await db
        .select()
        .from(aiAccessPolicies)
        .where(eq(aiAccessPolicies.userId, userId))
        .limit(1)

      // Default limits if no policy exists
      const rpmLimit = policy?.maxDailyRequests ? Math.max(1, policy.maxDailyRequests / 24 / 60) : 20
      const tpmLimit = policy?.maxDailyTokens ? Math.max(1000, policy.maxDailyTokens / 24 / 60) : 20000

      const allowed = requestCount < rpmLimit && (tokensUsed + tokensRequested) <= tpmLimit

      return {
        allowed,
        remaining: Math.max(0, tpmLimit - tokensUsed - tokensRequested),
        resetAt: Date.now() + 60000,
      }
    } catch (error) {
      console.error("[Oracle Access Control] Rate limit check failed:", error)
      return { allowed: true, remaining: 999, resetAt: Date.now() + 60000 }
    }
  }

  /**
   * Log AI usage to ai_chat_logs table
   */
  async logAIUsage(
    userId: string,
    email: string,
    model: string,
    tokensUsed: number,
    contextTypes: string[],
    pagePath: string,
    success: boolean
  ): Promise<void> {
    try {
      await db.insert(aiChatLogs).values({
        userId,
        page: this.normalizePath(pagePath) as typeof aiChatLogs.$inferInsert["page"],
        contextTypes: contextTypes as string[],
        modelProvider: "oracle_cloud" as const,
        modelName: model,
        messagesCount: 1,
        tokensUsed,
        promptTokens: Math.floor(tokensUsed * 0.7),
        completionTokens: Math.floor(tokensUsed * 0.3),
        isError: !success,
        errorMessage: success ? null : "AI response failed",
      })
    } catch (error) {
      console.error("[Oracle Access Control] Usage log failed:", error)
    }
  }

  /**
   * Invalidate user cache (call when policies updated)
   */
  invalidateUserCache(userId: string): void {
    this.cache.delete(`user_access_${userId}`)
  }
}

// Singleton instance
export const oracleAccessControl = new OracleAccessControlService()

// Types export
export type {
  OracleAccessPolicy,
  PageAccessPolicy,
  AIModelAccessPolicy,
  UserAccessContext,
}