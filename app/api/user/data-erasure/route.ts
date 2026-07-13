/**
 * app/api/user/data-erasure/route.ts
 *
 * PHASE 6: GDPR / Right-to-Erasure Endpoint
 *
 * Cascade deletes ALL user data from the system:
 * 1. chat_messages (via FK cascade from chat_sessions)
 * 2. chat_sessions
 * 3. ai_audit_log
 * 4. ai_chat_logs
 * 5. transactions
 * 6. statement_uploads
 * 7. monthly_summaries
 * 8. tax_summaries
 * 9. net_worth_snapshots
 * 10. goals
 * 11. cluster_metadata
 * 12. cluster_runs
 * 13. bank_accounts
 * 14. user_profiles
 * 15. ai_access_policies
 * 16. user_totp_secrets
 * 17. user_2fa_backup_codes
 * 18. user_subscriptions
 * 19. accounts (NextAuth)
 * 20. sessions (NextAuth)
 * 21. users (final)
 *
 * RLS-scoped: the user can only delete their own data because
 * every delete is filtered by userId = session.user.id.
 * Even without RLS, the explicit WHERE clause ensures isolation.
 *
 * This endpoint requires explicit confirmation to prevent accidental data loss.
 */

import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/server/lib/get-session"
import { db } from "@/server/db"
import {
  users,
  transactions,
  statementUploads,
  bankAccounts,
  userProfiles,
  monthlySummaries,
  taxSummaries,
  netWorthSnapshots,
  goals,
  aiChatLogs,
  aiAccessPolicies,
  aiAuditLog,
  chatSessions,
  chatMessages,
  userSubscriptions,
} from "@/server/db/schema"
import { clusterMetadata, clusterRuns } from "@/server/db/schema/transactions"
import { accounts, sessions as nextAuthSessions, userTotpSecrets, user2faBackupCodes } from "@/server/db/schema/users"
import { eq } from "drizzle-orm"
import { safeLogInfo, safeLogError } from "@/server/lib/safe-log"

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const body = await req.json()

    // ─── Require explicit confirmation ──────────────────────
    if (body.confirm !== "DELETE_ALL_MY_DATA") {
      return NextResponse.json({
        error: "Confirmation required",
        message: "To delete all your data, send { confirm: 'DELETE_ALL_MY_DATA' } in the request body.",
        warning: "This action is IRREVERSIBLE. All your financial data, chat history, and profile will be permanently deleted.",
      }, { status: 400 })
    }

    safeLogInfo("[DATA ERASURE] Starting cascade delete for user", { userId })

    // ─── Cascade delete in dependency order ─────────────────
    // Delete leaf tables first, parent tables last

    // 1. Chat messages (FK → chat_sessions)
    await db.delete(chatMessages).where(eq(chatMessages.userId, userId))

    // 2. Chat sessions
    await db.delete(chatSessions).where(eq(chatSessions.userId, userId))

    // 3. AI audit log
    await db.delete(aiAuditLog).where(eq(aiAuditLog.userId, userId))

    // 4. AI chat logs
    await db.delete(aiChatLogs).where(eq(aiChatLogs.userId, userId))

    // 5. AI access policies
    await db.delete(aiAccessPolicies).where(eq(aiAccessPolicies.userId, userId))

    // 6. Transactions (FK → statement_uploads, bank_accounts)
    await db.delete(transactions).where(eq(transactions.userId, userId))

    // 7. Cluster metadata & runs
    await db.delete(clusterMetadata).where(eq(clusterMetadata.userId, userId))
    await db.delete(clusterRuns).where(eq(clusterRuns.userId, userId))

    // 8. Statement uploads (FK → bank_accounts)
    await db.delete(statementUploads).where(eq(statementUploads.userId, userId))

    // 9. Monthly summaries
    await db.delete(monthlySummaries).where(eq(monthlySummaries.userId, userId))

    // 10. Tax summaries
    await db.delete(taxSummaries).where(eq(taxSummaries.userId, userId))

    // 11. Net worth snapshots
    await db.delete(netWorthSnapshots).where(eq(netWorthSnapshots.userId, userId))

    // 12. Goals
    await db.delete(goals).where(eq(goals.userId, userId))

    // 13. Bank accounts
    await db.delete(bankAccounts).where(eq(bankAccounts.userId, userId))

    // 14. User profile
    await db.delete(userProfiles).where(eq(userProfiles.userId, userId))

    // 15. 2FA secrets and backup codes
    await db.delete(userTotpSecrets).where(eq(userTotpSecrets.userId, userId))
    await db.delete(user2faBackupCodes).where(eq(user2faBackupCodes.userId, userId))

    // 16. User subscriptions
    await db.delete(userSubscriptions).where(eq(userSubscriptions.userId, userId))

    // 17. NextAuth accounts & sessions
    await db.delete(accounts).where(eq(accounts.userId, userId))
    await db.delete(nextAuthSessions).where(eq(nextAuthSessions.userId, userId))

    // 18. Finally, delete the user record
    await db.delete(users).where(eq(users.id, userId))

    safeLogInfo("[DATA ERASURE] Complete cascade delete finished", { userId })

    return NextResponse.json({
      success: true,
      message: "All your data has been permanently deleted. Your session will be invalidated.",
      erasedTables: [
        "chat_messages", "chat_sessions", "ai_audit_log", "ai_chat_logs",
        "ai_access_policies", "transactions", "cluster_metadata", "cluster_runs",
        "statement_uploads", "monthly_summaries", "tax_summaries", "net_worth_snapshots",
        "goals", "bank_accounts", "user_profiles", "user_totp_secrets",
        "user_2fa_backup_codes", "user_subscriptions", "accounts", "sessions", "users",
      ],
    })
  } catch (error) {
    safeLogError("[DATA ERASURE] Failed", error)
    return NextResponse.json({ error: "Data erasure failed. Please contact support." }, { status: 500 })
  }
}

// ─── GET: Check what data exists (for pre-deletion review) ──

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const [txCount] = await db.select({ count: eq(transactions.userId, userId) }).from(transactions).where(eq(transactions.userId, userId))
    const [sessionCount] = await db.select({ count: eq(chatSessions.userId, userId) }).from(chatSessions).where(eq(chatSessions.userId, userId))

    return NextResponse.json({
      userId,
      dataSummary: {
        message: "This is a summary of your data that will be permanently deleted.",
        warning: "This action is IRREVERSIBLE.",
        confirmationRequired: "DELETE_ALL_MY_DATA",
      },
    })
  } catch (error) {
    safeLogError("[DATA ERASURE CHECK]", error)
    return NextResponse.json({ error: "Failed to check data" }, { status: 500 })
  }
}
