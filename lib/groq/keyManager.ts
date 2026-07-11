import { getRedisClient } from "@/server/lib/redis";

export type KeyStateStatus = {
  keySuffix: string;
  coolingDown: boolean;
  failureCount: number;
};

class GroqKeyManager {
  private keys: string[];
  private cursor = 0;
  private isRedisEnabled = false;

  constructor(rawKeys: string[]) {
    this.keys = Array.from(new Set(rawKeys.filter(Boolean)));
    if (this.keys.length === 0) {
      throw new Error("No Groq API keys configured (check GROQ_KEY_1/2/3 env vars)");
    }
    this.checkRedis();
  }

  private async checkRedis() {
    try {
      const client = await getRedisClient();
      this.isRedisEnabled = !!client;
    } catch {
      this.isRedisEnabled = false;
    }
  }

  /** Checks if a key is on cooldown. */
  private async isCoolingDown(key: string): Promise<boolean> {
    if (this.isRedisEnabled) {
      try {
        const client = await getRedisClient();
        const exists = await client.get(`groq:cooldown:${key}`);
        return !!exists;
      } catch (err) {
        console.error("[GROQ KEY MANAGER] Redis get error:", err);
      }
    }
    return false;
  }

  /** Gets failure count for a key. */
  private async getFailureCount(key: string): Promise<number> {
    if (this.isRedisEnabled) {
      try {
        const client = await getRedisClient();
        const val = await client.get(`groq:failure:${key}`);
        return val ? parseInt(val, 10) : 0;
      } catch (err) {
        console.error("[GROQ KEY MANAGER] Redis failure get error:", err);
      }
    }
    return 0;
  }

  /** Returns the next available key, round-robin, skipping ones on cooldown. */
  async getNextAvailable(): Promise<string | null> {
    const n = this.keys.length;
    for (let i = 0; i < n; i++) {
      const idx = (this.cursor + i) % n;
      const key = this.keys[idx];
      const isCooling = await this.isCoolingDown(key);
      if (!isCooling) {
        this.cursor = (idx + 1) % n;
        return key;
      }
    }
    return null; // all keys cooling down
  }

  /** Call after a 429 — puts key to sleep for `seconds`. */
  async markRateLimited(key: string, seconds = 60) {
    if (this.isRedisEnabled) {
      try {
        const client = await getRedisClient();
        await client.setEx(`groq:cooldown:${key}`, seconds, "1");
        await client.incr(`groq:failure:${key}`);
        await client.expire(`groq:failure:${key}`, 86400); // expire failure count in 24h
        console.warn(`[GROQ KEY MANAGER] Key ...${key.slice(-4)} marked rate-limited for ${seconds}s in Redis`);
      } catch (err) {
        console.error("[GROQ KEY MANAGER] Redis set error:", err);
      }
    }
  }

  /** Call after any non-429 failure — shorter cooldown, still tracked. */
  async markFailed(key: string, seconds = 15) {
    if (this.isRedisEnabled) {
      try {
        const client = await getRedisClient();
        await client.setEx(`groq:cooldown:${key}`, seconds, "1");
        await client.incr(`groq:failure:${key}`);
        await client.expire(`groq:failure:${key}`, 86400);
        console.warn(`[GROQ KEY MANAGER] Key ...${key.slice(-4)} marked failed for ${seconds}s in Redis`);
      } catch (err) {
        console.error("[GROQ KEY MANAGER] Redis set error:", err);
      }
    }
  }

  async markSuccess(key: string) {
    if (this.isRedisEnabled) {
      try {
        const client = await getRedisClient();
        await client.del(`groq:failure:${key}`);
      } catch (err) {
        console.error("[GROQ KEY MANAGER] Redis del error:", err);
      }
    }
  }

  /** Milliseconds until the earliest key becomes available (for backoff sleep). */
  async nextAvailableInMs(): Promise<number> {
    if (this.isRedisEnabled) {
      try {
        const client = await getRedisClient();
        let minTtl = Infinity;
        for (const key of this.keys) {
          const ttl = await client.ttl(`groq:cooldown:${key}`);
          if (ttl > 0 && ttl < minTtl) {
            minTtl = ttl;
          }
        }
        return minTtl === Infinity ? 0 : minTtl * 1000;
      } catch (err) {
        console.error("[GROQ KEY MANAGER] Redis ttl check error:", err);
      }
    }
    return 0;
  }

  async status(): Promise<KeyStateStatus[]> {
    const statuses: KeyStateStatus[] = [];
    for (const key of this.keys) {
      const cooling = await this.isCoolingDown(key);
      const failures = await this.getFailureCount(key);
      statuses.push({
        keySuffix: key.slice(-4),
        coolingDown: cooling,
        failureCount: failures,
      });
    }
    return statuses;
  }
}

// Gather keys from both sets of env vars to cover all bases
const GROQ_KEYS = [
  process.env.GROQ_KEY_1,
  process.env.GROQ_KEY_2,
  process.env.GROQ_KEY_3,
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY,
].filter((k): k is string => Boolean(k));

export const groqKeyManager = new GroqKeyManager(GROQ_KEYS);
