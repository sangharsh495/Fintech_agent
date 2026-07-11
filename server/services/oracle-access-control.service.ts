import { createClient } from "@supabase/supabase-js"

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
  dataAccessLevel: "full" | "limited" | "restricted"
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
  dataAccessLevel: string
  oracleUserId?: string
  compartmentId?: string
}

class OracleAccessControlService {
  private supabase: ReturnType<typeof createClient> | null = null
  private cache: Map<string, { data: UserAccessContext; expires: number }> = new Map()
  private cacheTTL = 5 * 60 * 1000 // 5 minutes

  private getSupabase() {
    if (!this.supabase) {
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
      if (url && key) {
        this.supabase = createClient(url, key)
      }
    }
    return this.supabase
  }

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
   * Fetch user access policies from Oracle Cloud IAM/Database
   */
  async getUserAccessPolicies(userId: string, email: string): Promise<OracleAccessPolicy | null> {
    const cacheKey = `user_access_${userId}`
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      return cached.data as unknown as OracleAccessPolicy
    }

    try {
      // Option 1: Fetch from Supabase/PostgreSQL (user access policies table)
      const supabase = this.getSupabase()
      if (supabase) {
        const { data, error } = await supabase
          .from("user_access_policies")
          .select("*")
          .eq("user_id", userId)
          .single()

        if (!error && data) {
          const policy = data as OracleAccessPolicy
          this.cache.set(cacheKey, { data: policy as unknown as UserAccessContext, expires: Date.now() + this.cacheTTL })
          return policy
        }
      }

      // Option 2: Fetch from Oracle Cloud IAM (OCI Identity)
      // In production, use OCI SDK to fetch user policies
      // const identityClient = await this.initializeOCIClient()
      // const policy = await identityClient.getUserPolicies({ userId: oracleUserId })

      // Fallback: Default policies based on user profile
      return this.getDefaultAccessPolicy(userId, email)
    } catch (error) {
      console.error("[Oracle Access Control] Error fetching policies:", error)
      return this.getDefaultAccessPolicy(userId, email)
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
        "/dashboard": { allowed: true, dataScope: "full", allowedOperations: ["read", "chat", "analyze", "export"] },
        "/analytics": { allowed: true, dataScope: "full", allowedOperations: ["read", "chat", "analyze", "export", "ml-insights"] },
        "/tax": { allowed: true, dataScope: "full", allowedOperations: ["read", "chat", "calculate", "optimize", "export"] },
        "/onboarding": { allowed: true, dataScope: "summary", allowedOperations: ["read", "guide", "assist"] },
        "/settings": { allowed: true, dataScope: "summary", allowedOperations: ["read", "update-preferences", "manage-consent"] },
        "/upload": { allowed: true, dataScope: "restricted", allowedOperations: ["read", "upload", "validate"] },
        "/calculators": { allowed: true, dataScope: "full", allowedOperations: ["read", "calculate", "compare", "export"] },
        "/ai-ca": { allowed: true, dataScope: "full", allowedOperations: ["read", "chat", "analyze", "full-context"] },
        "/profile": { allowed: true, dataScope: "summary", allowedOperations: ["read", "update", "manage-consent"] },
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
      dataAccessLevel: isPremium ? "full" : "limited",
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
      dataAccessLevel: policy?.dataAccessLevel || "limited",
      oracleUserId: policy?.customPolicies?.oracleUserId as string,
      compartmentId: policy?.customPolicies?.compartmentId as string,
    }
  }

  /**
   * Log access attempt for audit (Oracle Cloud Audit service)
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
      // Log to audit table
      const supabase = this.getSupabase()
      if (supabase) {
        await supabase.from("access_audit_logs").insert({
          user_id: userId,
          email,
          action,
          resource,
          allowed,
          details: details || {},
          timestamp: new Date().toISOString(),
        })
      }

      // In production, also log to Oracle Cloud Audit service
      // await ociAuditClient.logEvent({ ... })
    } catch (error) {
      console.error("[Oracle Access Control] Audit log failed:", error)
    }
  }

  /**
   * Check rate limits for AI model usage
   */
  async checkRateLimit(userId: string, tokensRequested: number): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
    const supabase = this.getSupabase()
    if (!supabase) {
      return { allowed: true, remaining: 999, resetAt: Date.now() + 60000 }
    }

    const windowStart = new Date(Date.now() - 60000).toISOString()
    
    // Check requests in last minute
    const { data: requests } = await supabase
      .from("ai_usage_logs")
      .select("tokens_used")
      .eq("user_id", userId)
      .gte("created_at", windowStart)

    const tokensUsed = requests?.reduce((sum: number, r: any) => sum + (r.tokens_used || 0), 0) || 0
    const requestCount = requests?.length || 0

    const policy = await this.getUserAccessPolicies(userId, "")
    const limits = policy?.aiModelAccess.rateLimit || { requestsPerMinute: 20, tokensPerMinute: 20000 }

    const allowed = requestCount < limits.requestsPerMinute && (tokensUsed + tokensRequested) <= limits.tokensPerMinute
    
    return {
      allowed,
      remaining: Math.max(0, limits.tokensPerMinute - tokensUsed - tokensRequested),
      resetAt: Date.now() + 60000,
    }
  }

  /**
   * Log AI usage for rate limiting and billing
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
      const supabase = this.getSupabase()
      if (supabase) {
        await supabase.from("ai_usage_logs").insert({
          user_id: userId,
          email,
          model,
          tokens_used: tokensUsed,
          context_types: contextTypes,
          page_path: pagePath,
          success,
          created_at: new Date().toISOString(),
        })
      }
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