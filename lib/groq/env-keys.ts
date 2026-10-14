/**
 * Every Groq API key configured in the environment, de-duplicated.
 *
 * Keys can be set one per variable (GROQ_API_KEY_1, GROQ_API_KEY_2, ...) or
 * several in one variable separated by commas or whitespace. A pasted
 * "gsk_a, gsk_b" used to be sent to Groq as a single key and rejected.
 */
export function groqKeysFromEnv(): string[] {
  const raw = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_KEY_1,
    process.env.GROQ_KEY_2,
    process.env.GROQ_KEY_3,
    process.env.GROQ_API_KEY,
  ]
  const keys = raw
    .flatMap((value) => (value ?? "").split(/[\s,]+/))
    .map((key) => key.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean)
  return Array.from(new Set(keys))
}
