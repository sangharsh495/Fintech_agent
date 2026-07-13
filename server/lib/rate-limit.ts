import { NextResponse } from "next/server"

interface RateLimitTracker {
  timestamps: number[]
}

class InMemoryRateLimiter {
  private tracker: Map<string, RateLimitTracker> = new Map()

  constructor(
    private windowMs: number = 60 * 1000, // Default: 1 minute
    private maxRequests: number = 10       // Default: 10 requests per window
  ) {}

  /**
   * Check if a request from a key (IP, Email, UserID) is allowed
   */
  async check(key: string): Promise<{ allowed: boolean; remaining: number; resetMs: number }> {
    const now = Date.now()
    const windowStart = now - this.windowMs

    let clientRecord = this.tracker.get(key)
    if (!clientRecord) {
      clientRecord = { timestamps: [] }
    }

    // Filter out timestamps outside the window
    clientRecord.timestamps = clientRecord.timestamps.filter(ts => ts > windowStart)

    if (clientRecord.timestamps.length >= this.maxRequests) {
      const oldestTimestamp = clientRecord.timestamps[0] || now
      const resetMs = oldestTimestamp + this.windowMs - now

      return {
        allowed: false,
        remaining: 0,
        resetMs,
      }
    }

    // Log this attempt
    clientRecord.timestamps.push(now)
    this.tracker.set(key, clientRecord)

    return {
      allowed: true,
      remaining: this.maxRequests - clientRecord.timestamps.length,
      resetMs: this.windowMs,
    }
  }
}

// Instantiate specific rate limiters
export const authRateLimiter = new InMemoryRateLimiter(15 * 60 * 1000, 5) // 5 requests per 15 minutes
export const uploadRateLimiter = new InMemoryRateLimiter(15 * 60 * 1000, 5) // 5 uploads per 15 minutes
