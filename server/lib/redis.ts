/**
 * Redis Connection for FinFlow
 *
 * Uses ioredis for BullMQ and node-redis for caching, with a process-local
 * in-memory fallback (server/lib/cache/memory-store.ts) whenever Redis is
 * unavailable — no REDIS_URL, connection refused, or during `next build`
 * prerendering. This prevents `AggregateError: ECONNREFUSED` from failing a
 * build or a local dev run.
 *
 * BullMQ is the one exception: job queues require a real Redis server. When
 * Redis is absent `isQueueBackendAvailable()` returns false so callers can skip
 * enqueueing instead of hanging on a dead socket.
 */

import { Redis } from "ioredis"
import { createClient } from "redis"
import { safeLogError } from "@/server/lib/safe-log"
import { getMemoryStore, isBuildPhase } from "@/server/lib/cache/memory-store"

// Redis URL from environment
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"

/**
 * Whether we should even attempt a real connection. An explicitly configured
 * REDIS_URL means "try"; its absence means the developer never set one up, so
 * we go straight to memory rather than hammering localhost:6379.
 */
const redisConfigured = Boolean(process.env.REDIS_URL) && !isBuildPhase()

// ─── BullMQ connection (ioredis) ────────────────────────────
// Constructed lazily so importing this module never opens a socket.

let bullMQConnection: Redis | null = null

function createBullMQConnection(): Redis {
  const connection = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required for BullMQ
    retryStrategy: (times) => {
      if (times > 10) {
        safeLogError("[Redis] Max retries reached, giving up")
        return null // Stop retrying
      }
      return Math.min(times * 100, 3000)
    },
    lazyConnect: true,
  })

  connection.on("connect", () => console.log("[Redis] BullMQ connection established"))
  connection.on("error", (err) => safeLogError("[Redis] BullMQ connection error:", err))
  connection.on("close", () => console.warn("[Redis] BullMQ connection closed"))

  return connection
}

/**
 * Lazily-constructed ioredis instance for BullMQ. Exported as a getter-backed
 * proxy so `import { bullMQRedisConnection }` at module scope does not
 * instantiate a client during build.
 */
export const bullMQRedisConnection = new Proxy({} as Redis, {
  get(_target, prop) {
    if (!bullMQConnection) bullMQConnection = createBullMQConnection()
    const value = (bullMQConnection as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(bullMQConnection) : value
  },
  set(_target, prop, value) {
    if (!bullMQConnection) bullMQConnection = createBullMQConnection()
    ;(bullMQConnection as unknown as Record<string | symbol, unknown>)[prop] = value
    return true
  },
})

/** BullMQ needs a real server — the memory fallback cannot back a job queue. */
export function isQueueBackendAvailable(): boolean {
  return redisConfigured
}

// ─── Cache client (node-redis, with memory fallback) ────────

/** The subset of commands this codebase calls, satisfied by both backends. */
export interface CacheClient {
  get(key: string): Promise<string | null>
  setEx(key: string, ttlSeconds: number, value: string): Promise<unknown>
  del(keys: string | string[]): Promise<unknown>
  keys(pattern: string): Promise<string[]>
  ttl(key: string): Promise<number>
  incr(key: string): Promise<number>
  expire(key: string, ttlSeconds: number): Promise<unknown>
  ping(): Promise<unknown>
}

/**
 * Only the two members we actually touch outside connectRedis(). Typing this as
 * `ReturnType<typeof createClient>` does not work: passing an options object
 * makes node-redis infer empty module/function/script maps, which is not
 * assignable to the default `RedisClientType`.
 */
interface NodeRedisHandle {
  isOpen: boolean
  quit(): Promise<unknown>
}

let redisClient: NodeRedisHandle | null = null
let clientPromise: Promise<CacheClient> | null = null
/** Once a real connection fails we stay on memory for the process lifetime. */
let fellBackToMemory = false

async function connectRedis(): Promise<CacheClient> {
  const client = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 3000,
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          safeLogError("[Redis] Max retries reached")
          return false
        }
        return Math.min(retries * 100, 3000)
      },
    },
  })

  client.on("error", (err) => safeLogError("[Redis] Client error:", err))
  client.on("connect", () => console.log("[Redis] Cache client connected"))

  await client.connect()
  redisClient = client
  return client as unknown as CacheClient
}

/**
 * Returns a cache client. Never throws: on any connection failure it resolves
 * to the in-memory store so callers can stay unconditional.
 */
export async function getRedisClient(): Promise<CacheClient> {
  if (fellBackToMemory) return getMemoryStore() as unknown as CacheClient
  if (redisClient?.isOpen) return redisClient as unknown as CacheClient

  if (!redisConfigured) {
    fellBackToMemory = true
    return getMemoryStore(isBuildPhase() ? "build phase" : "REDIS_URL not set") as unknown as CacheClient
  }

  if (!clientPromise) {
    clientPromise = connectRedis().catch((error) => {
      safeLogError("[Redis] Connection failed, falling back to memory:", error)
      fellBackToMemory = true
      clientPromise = null
      redisClient = null
      return getMemoryStore("connection refused") as unknown as CacheClient
    })
  }

  return clientPromise
}

/** True when the active backend is the in-memory fallback, not a Redis server. */
export function isUsingMemoryFallback(): boolean {
  return fellBackToMemory || !redisConfigured
}

// ─── Cache helper functions ─────────────────────────────────

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient()
    const value = await client.get(key)
    return value ? (JSON.parse(value) as T) : null
  } catch (error) {
    safeLogError("[Redis] Cache get error:", error)
    return null
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
  try {
    const client = await getRedisClient()
    await client.setEx(key, ttlSeconds, JSON.stringify(value))
  } catch (error) {
    safeLogError("[Redis] Cache set error:", error)
  }
}

export async function deleteCache(key: string): Promise<void> {
  try {
    const client = await getRedisClient()
    await client.del(key)
  } catch (error) {
    safeLogError("[Redis] Cache delete error:", error)
  }
}

export async function deleteCachePattern(pattern: string): Promise<void> {
  try {
    const client = await getRedisClient()
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(keys)
    }
  } catch (error) {
    safeLogError("[Redis] Cache pattern delete error:", error)
  }
}

// Session cache helpers
export const SessionCache = {
  async get(userId: string) {
    return getCache(`session:${userId}`)
  },

  async set(userId: string, data: any, ttlSeconds = 86400) {
    return setCache(`session:${userId}`, data, ttlSeconds)
  },

  async delete(userId: string) {
    return deleteCache(`session:${userId}`)
  },
}

// User cache helpers
export const UserCache = {
  async getDashboardData(userId: string) {
    return getCache(`dashboard:${userId}`)
  },

  async setDashboardData(userId: string, data: any, ttlSeconds = 300) {
    return setCache(`dashboard:${userId}`, data, ttlSeconds)
  },

  async invalidateDashboard(userId: string) {
    return deleteCache(`dashboard:${userId}`)
  },

  async getTransactions(userId: string, key: string) {
    return getCache(`transactions:${userId}:${key}`)
  },

  async setTransactions(userId: string, key: string, data: any, ttlSeconds = 600) {
    return setCache(`transactions:${userId}:${key}`, data, ttlSeconds)
  },

  async invalidateTransactions(userId: string) {
    return deleteCachePattern(`transactions:${userId}:*`)
  },
}

// Rate limit cache — routed through getRedisClient() so it degrades to memory
// alongside everything else instead of throwing on a dead ioredis socket.
export const RateLimitCache = {
  async increment(key: string, windowMs: number): Promise<number> {
    try {
      const client = await getRedisClient()
      const count = await client.incr(key)
      if (count === 1) {
        await client.expire(key, Math.ceil(windowMs / 1000))
      }
      return count
    } catch (error) {
      safeLogError("[Redis] Rate limit increment error:", error)
      // Fail open on infrastructure errors rather than locking every user out.
      return 0
    }
  },

  async get(key: string): Promise<number> {
    try {
      const client = await getRedisClient()
      const value = await client.get(key)
      return value ? parseInt(value, 10) : 0
    } catch (error) {
      safeLogError("[Redis] Rate limit get error:", error)
      return 0
    }
  },

  async reset(key: string): Promise<void> {
    try {
      const client = await getRedisClient()
      await client.del(key)
    } catch (error) {
      safeLogError("[Redis] Rate limit reset error:", error)
    }
  },
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  if (isUsingMemoryFallback()) return false
  try {
    const client = await getRedisClient()
    await client.ping()
    return !isUsingMemoryFallback()
  } catch (error) {
    safeLogError("[Redis] Health check failed:", error)
    return false
  }
}

// Graceful shutdown
export async function closeRedisConnections(): Promise<void> {
  if (bullMQConnection) {
    await bullMQConnection.quit().catch(() => undefined)
    bullMQConnection = null
  }
  if (redisClient?.isOpen) {
    await redisClient.quit().catch(() => undefined)
  }
  redisClient = null
  clientPromise = null
  console.log("[Redis] Connections closed")
}
