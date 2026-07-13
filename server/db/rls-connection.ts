/**
 * server/db/rls-connection.ts
 *
 * RLS-scoped database connection pool for user-data isolation.
 *
 * Architecture:
 * - Uses the `pg` Pool driver (session-based, NOT the stateless Neon HTTP driver)
 * - Every user-facing query runs through `withUserScope(userId, fn)`
 * - This function acquires a connection, runs SET LOCAL app.current_user_id = $userId
 *   inside a transaction, executes the callback, and releases the connection
 * - The userId is ONLY sourced from verified JWT (server-side), never from request body/params
 * - The connection uses the finflow_app role which has NO BYPASSRLS privilege
 *
 * This ensures that even if application code has a bug, RLS enforces data isolation.
 */

import pg from "pg"

const { Pool } = pg

// ─── Connection Pool Configuration ──────────────────────────
// Strip channel_binding param (pg driver handles SSL natively)
const rawUrl = process.env.DATABASE_URL || "postgres://localhost:5432/mock"
const connectionUrl = rawUrl.replace(/[&?]channel_binding=[^&]*/g, "")

const pool = new Pool({
  connectionString: connectionUrl,
  max: 20,            // Max connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Enforce TLS for Neon connections
  ssl: connectionUrl.includes("neon.tech") ? { rejectUnauthorized: true } : undefined,
})

// Log pool errors (but never log connection strings or user data)
pool.on("error", (err) => {
  console.error("[RLS Pool] Unexpected error on idle client:", err.message)
})

// ─── Type Definitions ───────────────────────────────────────

export type RLSClient = pg.PoolClient

export interface RLSQueryResult<T = Record<string, unknown>> {
  rows: T[]
  rowCount: number | null
}

// ─── Core: withUserScope ────────────────────────────────────

/**
 * Executes a callback within a database transaction scoped to a specific user.
 *
 * Guarantees:
 * 1. Acquires a dedicated connection from the pool
 * 2. Begins a transaction
 * 3. Sets `app.current_user_id` to the verified userId (SET LOCAL = transaction-scoped)
 * 4. Executes the user's callback with the scoped client
 * 5. Commits on success, rolls back on error
 * 6. Always releases the connection back to the pool
 *
 * The userId parameter must come from a verified JWT, never from client input.
 *
 * @param userId - The verified user ID from JWT session (server-side only)
 * @param fn - Async callback receiving the scoped database client
 * @returns The return value of the callback
 * @throws If userId is missing/invalid, or if the callback throws
 */
export async function withUserScope<T>(
  userId: string,
  fn: (client: RLSClient) => Promise<T>
): Promise<T> {
  // ─── Validate userId ──────────────────────────────────────
  if (!userId || typeof userId !== "string") {
    throw new Error("[RLS] withUserScope called without a valid userId. This is a security violation.")
  }

  // Basic UUID format validation to prevent injection
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(userId)) {
    throw new Error("[RLS] userId is not a valid UUID format. Refusing to set session variable.")
  }

  const client = await pool.connect()

  try {
    await client.query("BEGIN")

    // SET LOCAL is transaction-scoped — automatically reverts when the transaction ends.
    // This prevents userId leakage between requests sharing the same pooled connection.
    // We use parameterized setting to prevent SQL injection.
    await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId])

    const result = await fn(client)

    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
  }
}

// ─── Helper: Direct SQL query within user scope ─────────────

/**
 * Execute a parameterized SQL query within a user-scoped transaction.
 * Convenience wrapper around withUserScope for simple single-query operations.
 */
export async function userScopedQuery<T = Record<string, unknown>>(
  userId: string,
  text: string,
  params?: unknown[]
): Promise<RLSQueryResult<T>> {
  return withUserScope(userId, async (client) => {
    const result = await client.query(text, params)
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount,
    }
  })
}

// ─── Helper: Read-only user scope (for dashboards/analytics) ─

/**
 * Execute a read-only query within user scope.
 * Sets the transaction to READ ONLY for additional safety.
 */
export async function userScopedReadOnly<T = Record<string, unknown>>(
  userId: string,
  text: string,
  params?: unknown[]
): Promise<RLSQueryResult<T>> {
  return withUserScope(userId, async (client) => {
    await client.query("SET TRANSACTION READ ONLY")
    const result = await client.query(text, params)
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount,
    }
  })
}

// ─── Admin connection (for migrations, cron jobs) ───────────

/**
 * Execute a query WITHOUT RLS scoping.
 * ONLY for:
 * - Database migrations
 * - Cron jobs that aggregate across all users (e.g., monthly_summaries refresh)
 * - System-level operations
 *
 * NEVER use for user-facing requests.
 */
export async function adminQuery<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<RLSQueryResult<T>> {
  const client = await pool.connect()
  try {
    const result = await client.query(text, params)
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount,
    }
  } finally {
    client.release()
  }
}

// ─── Pool lifecycle ─────────────────────────────────────────

/**
 * Gracefully shut down the connection pool.
 * Call this on process exit / server shutdown.
 */
export async function closePool(): Promise<void> {
  await pool.end()
}

// ─── Connection health check ────────────────────────────────

/**
 * Verify the RLS connection pool is healthy and TLS is active.
 */
export async function healthCheck(): Promise<{
  healthy: boolean
  ssl: boolean
  poolSize: number
  idleCount: number
}> {
  const client = await pool.connect()
  try {
    const sslResult = await client.query("SHOW ssl")
    const ssl = sslResult.rows[0]?.ssl === "on"
    return {
      healthy: true,
      ssl,
      poolSize: pool.totalCount,
      idleCount: pool.idleCount,
    }
  } catch {
    return { healthy: false, ssl: false, poolSize: 0, idleCount: 0 }
  } finally {
    client.release()
  }
}
