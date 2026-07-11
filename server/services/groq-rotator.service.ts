export interface GroqKeyInfo {
  key: string;
  cooldownExpiresAt: number;
}

class GroqRotatorService {
  private keys: GroqKeyInfo[] = [];
  private index = 0;
  private defaultCooldownMs = 60000; // 60 seconds cooldown

  constructor() {
    this.initializeKeys();
  }

  private initializeKeys() {
    // Gather all potential Groq keys from environment variables
    const rawKeys = [
      process.env.GROQ_API_KEY,
      process.env.GROQ_KEY_1,
      process.env.GROQ_KEY_2,
      process.env.GROQ_KEY_3,
      process.env.GROQ_API_KEY_1,
      process.env.GROQ_API_KEY_2,
      process.env.GROQ_API_KEY_3,
    ];

    // Filter unique, non-empty keys
    const uniqueKeys = Array.from(new Set(rawKeys.filter(Boolean))) as string[];

    this.keys = uniqueKeys.map((key) => ({
      key,
      cooldownExpiresAt: 0,
    }));

    console.log(`[GROQ ROTATOR] Initialized with ${this.keys.length} API keys.`);
  }

  /**
   * Gets the next active API key that is not in cooldown.
   * If all keys are in cooldown, it returns the key whose cooldown expires first.
   * If no keys are configured, returns an empty string.
   */
  public getAvailableKey(): string {
    if (this.keys.length === 0) {
      return process.env.GROQ_API_KEY || "";
    }

    const now = Date.now();
    let bestKeyIndex = -1;
    let minCooldownExpiry = Infinity;

    // Check keys in round-robin fashion starting from the current index
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.index + i) % this.keys.length;
      const keyInfo = this.keys[idx];

      if (keyInfo.cooldownExpiresAt <= now) {
        // Found an active key! Update index and return it.
        this.index = (idx + 1) % this.keys.length;
        return keyInfo.key;
      }

      // Track key with the soonest cooldown expiration
      if (keyInfo.cooldownExpiresAt < minCooldownExpiry) {
        minCooldownExpiry = keyInfo.cooldownExpiresAt;
        bestKeyIndex = idx;
      }
    }

    // All keys are in cooldown. Return the one that recovers first.
    if (bestKeyIndex !== -1) {
      console.warn(`[GROQ ROTATOR] All keys in cooldown. Selecting soonest recovering key (expires in ${Math.ceil((minCooldownExpiry - now) / 1000)}s).`);
      this.index = (bestKeyIndex + 1) % this.keys.length;
      return this.keys[bestKeyIndex].key;
    }

    return process.env.GROQ_API_KEY || "";
  }

  /**
   * Marks a specific key as cooling down.
   */
  public markCooldown(key: string, durationMs = this.defaultCooldownMs) {
    const keyInfo = this.keys.find((k) => k.key === key);
    if (keyInfo) {
      keyInfo.cooldownExpiresAt = Date.now() + durationMs;
      console.warn(`[GROQ ROTATOR] Key marked in cooldown for ${durationMs / 1000}s. Key suffix: ...${key.slice(-6)}`);
    }
  }
}

// Global singleton to preserve cooldown state across hot-reloads in development
const globalForRotator = globalThis as unknown as {
  groqRotatorInstance?: GroqRotatorService;
};

export const groqRotator =
  globalForRotator.groqRotatorInstance || new GroqRotatorService();

if (process.env.NODE_ENV !== "production") {
  globalForRotator.groqRotatorInstance = groqRotator;
}
