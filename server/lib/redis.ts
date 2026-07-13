import { Redis } from "ioredis"
import { createClient } from "redis"
import { safeLogError } from "@/server/lib/safe-log";

/**
 * Redis Connection for FinFlow
 * Uses ioredis for BullMQ and node-redis for caching
 */

// Redis URL from environment
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379"

// ioredis connection for BullMQ (required by BullMQ)
export const bullMQRedisConnection = new Redis(redisUrl, {
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

bullMQRedisConnection.on("connect", () => {
  console.log("[Redis] BullMQ connection established")
})

bullMQRedisConnection.on("error", (err) => {
  safeLogError("[Redis] BullMQ connection error:", err)
})

bullMQRedisConnection.on("close", () => {
  console.warn("[Redis] BullMQ connection closed")
})

// node-redis client for caching
let redisClient: ReturnType<typeof createClient> | null = null

export async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            safeLogError("[Redis] Max retries reached")
            return false
          }
          return Math.min(retries * 100, 3000)
        },
      },
    })
    
    redisClient.on("error", (err) => {
      safeLogError("[Redis] Client error:", err)
    })
    
    redisClient.on("connect", () => {
      console.log("[Redis] Cache client connected")
    })
    
    await redisClient.connect()
  }
  
  return redisClient
}

// Cache helper functions
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const client = await getRedisClient()
    const value = await client.get(key)
    return value ? JSON.parse(value) : null
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

// Rate limit cache (using ioredis directly for BullMQ compatibility)
export const RateLimitCache = {
  async increment(key: string, windowMs: number): Promise<number> {
    const client = bullMQRedisConnection
    const count = await client.incr(key)
    if (count === 1) {
      await client.pexpire(key, windowMs)
    }
    return count
  },
  
  async get(key: string): Promise<number> {
    const value = await bullMQRedisConnection.get(key)
    return value ? parseInt(value, 10) : 0
  },
  
  async reset(key: string): Promise<void> {
    await bullMQRedisConnection.del(key)
  },
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
  try {
    await bullMQRedisConnection.ping()
    const client = await getRedisClient()
    await client.ping()
    return true
  } catch (error) {
    safeLogError("[Redis] Health check failed:", error)
    return false
  }
}

// Graceful shutdown
export async function closeRedisConnections(): Promise<void> {
  await bullMQRedisConnection.quit()
  if (redisClient) {
    await redisClient.quit()
  }
  console.log("[Redis] Connections closed")
}

console.log("[Redis] Redis connections initialized")