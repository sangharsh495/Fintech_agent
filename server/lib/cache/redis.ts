import { Redis } from "@upstash/redis"
import { safeLogError } from "@/server/lib/safe-log";
import { getMemoryStore, isBuildPhase } from "@/server/lib/cache/memory-store"

/**
 * Redis caching layer for performance optimization
 * Uses Upstash Redis for serverless-compatible caching, degrading to a
 * process-local in-memory store when Upstash is not configured or when running
 * inside `next build`. Callers therefore always get a working client and never
 * need a null check.
 */

// Redis client singleton
let redisClient: Redis | null = null

/** True only when a real Upstash instance is configured. */
function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN &&
      !isBuildPhase()
  )
}

/**
 * Structural surface shared by @upstash/redis and MemoryStore. Declared
 * explicitly so callers can invoke methods without narrowing a union.
 */
interface CacheBackend {
  get<T = string>(key: string): Promise<T | null>
  setex(key: string, ttlSeconds: number, value: string): Promise<unknown>
  del(...keys: string[]): Promise<number>
  keys(pattern: string): Promise<string[]>
  sadd(key: string, ...members: string[]): Promise<number>
  smembers(key: string): Promise<string[]>
  expire(key: string, ttlSeconds: number): Promise<unknown>
  dbsize(): Promise<number>
}

function getRedisClient(): CacheBackend {
  if (!isUpstashConfigured()) {
    return getMemoryStore(
      isBuildPhase() ? "build phase" : "UPSTASH_REDIS_REST_URL not set"
    ) as unknown as CacheBackend
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }

  return redisClient as unknown as CacheBackend
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl?: number // Time to live in seconds
  tags?: string[] // Cache tags for invalidation
  serialize?: (value: unknown) => string
  deserialize?: (value: string) => unknown
}

const defaultCacheConfig: Required<CacheConfig> = {
  ttl: 300, // 5 minutes default
  tags: [],
  serialize: JSON.stringify,
  deserialize: JSON.parse,
}

/**
 * Generate cache key with namespace
 */
export function generateCacheKey(namespace: string, ...parts: string[]): string {
  return `finflow:${namespace}:${parts.join(":")}`
}

/**
 * Get value from cache
 */
export async function getCache<T>(
  key: string,
  config: CacheConfig = {}
): Promise<T | null> {
  const client = getRedisClient()

  const { deserialize } = { ...defaultCacheConfig, ...config }
  
  try {
    const value = await client.get<string>(key)
    if (value === null) return null
    
    return deserialize(value) as T
  } catch (error) {
    safeLogError(`Cache get error for key ${key}:`, error)
    return null
  }
}

/**
 * Set value in cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  config: CacheConfig = {}
): Promise<boolean> {
  const client = getRedisClient()

  const { ttl, serialize, tags } = { ...defaultCacheConfig, ...config }
  
  try {
    const serialized = serialize(value)
    await client.setex(key, ttl, serialized)
    
    // Tag-based invalidation support
    if (tags.length > 0) {
      for (const tag of tags) {
        const tagKey = `finflow:tags:${tag}`
        await client.sadd(tagKey, key)
        await client.expire(tagKey, ttl + 60) // Tag expires slightly after cache
      }
    }
    
    return true
  } catch (error) {
    safeLogError(`Cache set error for key ${key}:`, error)
    return false
  }
}

/**
 * Delete value from cache
 */
export async function deleteCache(key: string): Promise<boolean> {
  const client = getRedisClient()

  try {
    await client.del(key)
    return true
  } catch (error) {
    safeLogError(`Cache delete error for key ${key}:`, error)
    return false
  }
}

/**
 * Invalidate cache by tags
 */
export async function invalidateByTags(tags: string[]): Promise<number> {
  const client = getRedisClient()

  let totalDeleted = 0
  
  try {
    for (const tag of tags) {
      const tagKey = `finflow:tags:${tag}`
      const keys = await client.smembers(tagKey) as string[]
      
      if (keys.length > 0) {
        await client.del(...keys)
        totalDeleted += keys.length
      }
      
      await client.del(tagKey)
    }
    
    return totalDeleted
  } catch (error) {
    safeLogError(`Cache tag invalidation error:`, error)
    return 0
  }
}

/**
 * Invalidate cache by pattern (use with caution)
 */
export async function invalidateByPattern(pattern: string): Promise<number> {
  const client = getRedisClient()

  try {
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(...keys)
    }
    return keys.length
  } catch (error) {
    safeLogError(`Cache pattern invalidation error:`, error)
    return 0
  }
}

/**
 * Get or set cache with fallback function
 */
export async function getOrSetCache<T>(
  key: string,
  fallback: () => Promise<T>,
  config: CacheConfig = {}
): Promise<T> {
  const cached = await getCache<T>(key, config)
  if (cached !== null) return cached

  const value = await fallback()
  await setCache(key, value, config)
  return value
}

/**
 * Cache wrapper for async functions
 */
export function withCache<TArgs extends unknown[], TReturn>(
  namespace: string,
  keyGenerator: (...args: TArgs) => string,
  fallback: (...args: TArgs) => Promise<TReturn>,
  config: CacheConfig = {}
) {
  return async (...args: TArgs): Promise<TReturn> => {
    const key = generateCacheKey(namespace, keyGenerator(...args))
    return getOrSetCache(key, () => fallback(...args), config)
  }
}

/**
 * Predefined cache namespaces
 */
export const CacheNamespaces = {
  USER: "user",
  TRANSACTIONS: "transactions",
  ANALYTICS: "analytics",
  DASHBOARD: "dashboard",
  BANKS: "banks",
  CLUSTERS: "clusters",
  TAX: "tax",
  AI: "ai",
} as const

/**
 * Predefined cache tags for invalidation
 */
export const CacheTags = {
  USER_PROFILE: "user:profile",
  USER_ACCOUNTS: "user:accounts",
  USER_TRANSACTIONS: "user:transactions",
  ANALYTICS_DATA: "analytics:data",
  CLUSTER_RESULTS: "clusters:results",
} as const

/**
 * Cache TTL presets (in seconds)
 */
export const CacheTTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
  DAILY: 86400, // 24 hours
} as const

/**
 * Check if Redis is available
 */
export function isCacheAvailable(): boolean {
  return isUpstashConfigured()
}

/**
 * Get cache stats
 */
export async function getCacheStats(): Promise<{
  connected: boolean
  memoryUsage?: string
  keyCount?: number
}> {
  const client = getRedisClient()

  try {
    const dbSize = await client.dbsize()

    return {
      connected: isUpstashConfigured(),
      memoryUsage: "N/A", // Not supported by Upstash Redis SDK directly
      keyCount: dbSize,
    }
  } catch (error) {
    return { connected: false }
  }
}