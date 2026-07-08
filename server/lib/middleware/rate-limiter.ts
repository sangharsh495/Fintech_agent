import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"
import type { NextRequest } from "next/server"

// Initialize Upstash Redis for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://your-app.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "your-token",
})

/**
 * Industry-standard