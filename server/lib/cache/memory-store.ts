/**
 * server/lib/cache/memory-store.ts
 *
 * In-memory Redis-compatible fallback store.
 *
 * WHY: Next.js prerendering and local dev without a running Redis server throw
 * `AggregateError: ECONNREFUSED` from server/lib/redis.ts. Rather than letting a
 * missing cache take down a build, we degrade to a process-local Map with TTL
 * semantics. The surface below intentionally mirrors the *subset* of node-redis,
 * ioredis and @upstash/redis commands this codebase actually calls, so callers
 * need no branching.
 *
 * Caveats (deliberate, documented):
 * - Not shared across processes/lambdas. Correct for caching and best-effort rate
 *   limiting; NOT correct for BullMQ (which requires a real Redis server).
 * - Bounded by MAX_KEYS with oldest-expiry-first eviction so a long-lived dev
 *   server cannot leak unbounded memory.
 */

import { safeLogError } from "@/server/lib/safe-log"

interface Entry {
  value: string
  /** epoch ms; undefined = never expires */
  expiresAt?: number
}

const MAX_KEYS = 10_000

export class MemoryStore {
  private store = new Map<string, Entry>()
  private sets = new Map<string, Set<string>>()

  // ─── internals ────────────────────────────────────────────

  private isExpired(entry: Entry): boolean {
    return entry.expiresAt !== undefined && Date.now() > entry.expiresAt
  }

  private read(key: string): string | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (this.isExpired(entry)) {
      this.store.delete(key)
      this.sets.delete(key)
      return null
    }
    return entry.value
  }

  private write(key: string, value: string, ttlSeconds?: number): void {
    if (this.store.size >= MAX_KEYS && !this.store.has(key)) {
      this.evict()
    }
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds !== undefined ? Date.now() + ttlSeconds * 1000 : undefined,
    })
  }

  /** Drop expired keys; if that frees nothing, drop the soonest-to-expire 10%. */
  private evict(): void {
    const now = Date.now()
    let freed = 0
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== undefined && now > entry.expiresAt) {
        this.store.delete(key)
        this.sets.delete(key)
        freed++
      }
    }
    if (freed > 0) return

    const byExpiry = [...this.store.entries()]
      .sort((a, b) => (a[1].expiresAt ?? Infinity) - (b[1].expiresAt ?? Infinity))
      .slice(0, Math.ceil(MAX_KEYS * 0.1))
    for (const [key] of byExpiry) {
      this.store.delete(key)
      this.sets.delete(key)
    }
  }

  /** Redis glob (`*`, `?`) → RegExp. */
  private globToRegExp(pattern: string): RegExp {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&")
    return new RegExp(`^${escaped.replace(/\*/g, ".*").replace(/\?/g, ".")}$`)
  }

  // ─── string commands ──────────────────────────────────────

  async get<T = string>(key: string): Promise<T | null> {
    return this.read(key) as T | null
  }

  /** node-redis / upstash: SET key value */
  async set(key: string, value: unknown, opts?: { ex?: number; EX?: number }): Promise<"OK"> {
    const ttl = opts?.ex ?? opts?.EX
    this.write(key, typeof value === "string" ? value : JSON.stringify(value), ttl)
    return "OK"
  }

  /** node-redis casing */
  async setEx(key: string, ttlSeconds: number, value: string): Promise<"OK"> {
    this.write(key, value, ttlSeconds)
    return "OK"
  }

  /** ioredis / upstash casing */
  async setex(key: string, ttlSeconds: number, value: string): Promise<"OK"> {
    return this.setEx(key, ttlSeconds, value)
  }

  async del(...keys: (string | string[])[]): Promise<number> {
    const flat = keys.flat()
    let deleted = 0
    for (const key of flat) {
      if (this.store.delete(key)) deleted++
      this.sets.delete(key)
    }
    return deleted
  }

  async exists(key: string): Promise<number> {
    return this.read(key) !== null ? 1 : 0
  }

  async keys(pattern: string): Promise<string[]> {
    const re = this.globToRegExp(pattern)
    const matches: string[] = []
    for (const key of [...this.store.keys()]) {
      if (re.test(key) && this.read(key) !== null) matches.push(key)
    }
    return matches
  }

  async incr(key: string): Promise<number> {
    const current = this.read(key)
    const next = (current ? parseInt(current, 10) || 0 : 0) + 1
    // Preserve any existing TTL — INCR must not reset expiry.
    const existing = this.store.get(key)
    this.store.set(key, { value: String(next), expiresAt: existing?.expiresAt })
    return next
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    const entry = this.store.get(key)
    if (!entry || this.isExpired(entry)) return 0
    entry.expiresAt = Date.now() + ttlSeconds * 1000
    return 1
  }

  async pexpire(key: string, ttlMs: number): Promise<number> {
    return this.expire(key, ttlMs / 1000)
  }

  /** Seconds remaining: -2 = no key, -1 = no expiry. */
  async ttl(key: string): Promise<number> {
    const entry = this.store.get(key)
    if (!entry || this.isExpired(entry)) return -2
    if (entry.expiresAt === undefined) return -1
    return Math.ceil((entry.expiresAt - Date.now()) / 1000)
  }

  // ─── set commands (used for tag-based invalidation) ───────

  async sadd(key: string, ...members: string[]): Promise<number> {
    const set = this.sets.get(key) ?? new Set<string>()
    let added = 0
    for (const member of members.flat()) {
      if (!set.has(member)) {
        set.add(member)
        added++
      }
    }
    this.sets.set(key, set)
    // Mirror into the keyspace so TTL/keys() see it.
    if (!this.store.has(key)) this.write(key, "__set__")
    return added
  }

  async smembers(key: string): Promise<string[]> {
    if (this.read(key) === null) return []
    return [...(this.sets.get(key) ?? [])]
  }

  // ─── admin ────────────────────────────────────────────────

  async dbsize(): Promise<number> {
    let count = 0
    for (const key of [...this.store.keys()]) {
      if (this.read(key) !== null) count++
    }
    return count
  }

  async ping(): Promise<"PONG"> {
    return "PONG"
  }

  async quit(): Promise<"OK"> {
    this.store.clear()
    this.sets.clear()
    return "OK"
  }

  async flushall(): Promise<"OK"> {
    return this.quit()
  }
}

// ─── singleton ──────────────────────────────────────────────

let instance: MemoryStore | null = null
let warned = false

export function getMemoryStore(reason?: string): MemoryStore {
  if (!instance) {
    instance = new MemoryStore()
  }
  if (!warned && reason) {
    warned = true
    console.warn(`[Cache] Redis unavailable (${reason}) — using in-memory fallback. Cache is process-local and not shared across instances.`)
  }
  return instance
}

/**
 * True during `next build` prerendering, where opening sockets to Redis is both
 * unnecessary and a common source of build failures.
 */
export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build"
}

/** Best-effort connectivity probe used to decide fallback once per process. */
export async function probe(fn: () => Promise<unknown>, label: string): Promise<boolean> {
  try {
    await fn()
    return true
  } catch (error) {
    safeLogError(`[Cache] ${label} probe failed`, error)
    return false
  }
}
