import { extractPdfText } from "../pdf/extractText";
import { buildExtractionPrompt } from "./promptBuilder";
import { callGroq } from "../groq/client";
import { TransactionListSchema, TransactionSchema, type Transaction } from "./schema";
import { validateBalanceContinuity } from "./validateContinuity";

const MAX_CHARS_PER_CHUNK = 6000; // conservative, leaves room for prompt + model context

export type ParseResult = {
  transactions: Transaction[];
  continuity: ReturnType<typeof validateBalanceContinuity>;
  pagesProcessed: number;
};

export async function parseStatement(buffer: Buffer): Promise<ParseResult> {
  const { text, numPages } = await extractPdfText(buffer);

  if (!text || text.trim().length === 0) {
    throw new Error("No readable text could be extracted from this PDF. Please ensure it is an authentic electronic statement and not a scanned image.");
  }

  const chunks = chunkText(text, MAX_CHARS_PER_CHUNK);
  const allTransactions: Transaction[] = [];

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    
    try {
      const prompt = buildExtractionPrompt(chunk);
      const rawResponse = await callGroq(prompt);

      const parsedJson = safeJsonParse(rawResponse);
      const list = TransactionListSchema.safeParse(parsedJson?.transactions ?? []);

      if (list.success) {
        allTransactions.push(...list.data);
      } else {
        console.warn("[PARSER] Chunk schema parse warning, attempting item-by-item recovery:", list.error.message);
        const rawTxns = Array.isArray(parsedJson?.transactions) ? parsedJson.transactions : [];
        for (const t of rawTxns) {
          const item = TransactionSchema.safeParse(t);
          if (item.success) allTransactions.push(item.data);
        }
      }
    } catch (chunkErr) {
      console.warn("[PARSER] Error extracting chunk, skipping chunk:", chunkErr);
    }
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
    // Try regex extraction of JSON object if surrounded by preamble
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error(`Groq did not return valid JSON: ${raw.slice(0, 200)}`);
  }
}
