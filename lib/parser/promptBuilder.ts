export function buildExtractionPrompt(statementText: string): string {
  return `You are a strict data extraction engine. Extract every transaction row from the bank statement text below.

Return ONLY a JSON object with this exact shape, no markdown fences, no explanation:
{
  "transactions": [
    { "date": string, "description": string, "refNo": string|null, "debit": number|null, "credit": number|null, "balance": number }
  ]
}

Rules:
- One entry per transaction row, in the order they appear.
- "debit" is the amount if money left the account, else null. Same logic for "credit".
- "balance" is the running balance shown for that row (required, always a number).
- Do not invent transactions. Do not skip rows. Do not merge multiple rows into one.
- Keep "date" exactly as written in the source (do not reformat).
- If a value is illegible or missing, use null rather than guessing.

Statement text:
"""
${statementText}
"""`;
}
