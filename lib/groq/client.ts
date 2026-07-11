import { groqKeyManager } from "./keyManager";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

export async function callGroq(prompt: string, maxAttempts = 6): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const key = await groqKeyManager.getNextAvailable();

    if (!key) {
      // all keys cooling down — wait for the soonest one instead of failing immediately
      const waitMs = await groqKeyManager.nextAvailableInMs();
      if (waitMs > 15000) {
        const statuses = await groqKeyManager.status();
        throw new Error(
          `All Groq keys rate-limited. Next available in ${Math.ceil(waitMs / 1000)}s. ` +
          `Status: ${JSON.stringify(statuses)}`
        );
      }
      console.log(`[GROQ CLIENT] All keys on cooldown. Waiting for ${waitMs + 250}ms...`);
      await sleep(waitMs + 250);
      continue;
    }

    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
          temperature: 0,
        }),
      });

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get("retry-after")) || 60;
        await groqKeyManager.markRateLimited(key, retryAfter);
        lastError = new Error(`429 on key ...${key.slice(-4)}`);
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        await groqKeyManager.markFailed(key);
        lastError = new Error(`Groq error ${res.status}: ${body.slice(0, 300)}`);
        continue;
      }

      const data = await res.json();
      await groqKeyManager.markSuccess(key);
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Groq returned empty content");
      return content;

    } catch (err) {
      await groqKeyManager.markFailed(key);
      lastError = err as Error;
      continue;
    }
  }

  throw new Error(`Groq call failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
