import { Redis } from "@upstash/redis"
import { safeLogError } from "@/server/lib/safe-log";

/**
 * Redis caching layer for performance optimization
 * Uses Upstash Redis for serverless-compatible caching
 */

// Redis client singleton
let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }

  return redisClient
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
  if (!client) return null

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
  if (!client) return false

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
  if (!client) return false

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
  if (!client) return 0

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
  if (!client) return 0

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
  return !!getRedisClient()
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
  if (!client) return { connected: false }

  try {
    const dbSize = await client.dbsize()
    
    return {
      connected: true,
      memoryUsage: "N/A", // Not supported by Upstash Redis SDK directly
      keyCount: dbSize,
    }
  } catch (error) {
    return { connected: false }
  }
}