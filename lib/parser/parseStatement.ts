import { extractPdfText } from "../pdf/extractText";
import { buildExtractionPrompt } from "./promptBuilder";
import { callGroq } from "../groq/client";
import { TransactionListSchema, type Transaction } from "./schema";
import { validateBalanceContinuity } from "./validateContinuity";

const MAX_CHARS_PER_CHUNK = 6000; // conservative, leaves room for prompt + model context

export type ParseResult = {
  transactions: Transaction[];
  continuity: ReturnType<typeof validateBalanceContinuity>;
  pagesProcessed: number;
};

export async function parseStatement(buffer: Buffer): Promise<ParseResult> {
  const { text, numPages } = await extractPdfText(buffer);

  const chunks = chunkText(text, MAX_CHARS_PER_CHUNK);
  const allTransactions: Transaction[] = [];

  for (const chunk of chunks) {
    const prompt = buildExtractionPrompt(chunk);
    const rawResponse = await callGroq(prompt);

    const parsedJson = safeJsonParse(rawResponse);
    const list = TransactionListSchema.safeParse(parsedJson?.transactions ?? []);

    if (!list.success) {
      throw new Error(`Schema validation failed for a chunk: ${list.error.message}`);
    }
    allTransactions.push(...list.data);
  }

  const continuity = validateBalanceContinuity(allTransactions);

  return { transactions: allTransactions, continuity, pagesProcessed: numPages };
}

function chunkText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  return chunks;
}

function safeJsonParse(raw: string): any {
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Groq did not return valid JSON: ${raw.slice(0, 200)}`);
  }
}
