import { extractPdfText } from "../pdf/extractText";
import { buildExtractionPrompt } from "./promptBuilder";
import { callGroq } from "../groq/client";
import { TransactionListSchema, TransactionSchema, type Transaction } from "./schema";
import { findOpeningBalance, validateBalanceContinuity } from "./validateContinuity";

const MAX_CHARS_PER_CHUNK = 6000; // conservative, leaves room for prompt + model context

export type ParseResult = {
  transactions: Transaction[];
  continuity: ReturnType<typeof validateBalanceContinuity>;
  pagesProcessed: number;
  /** Chunks that still failed after a retry. Their rows are missing from `transactions`. */
  failedChunks: number;
};

/**
 * `textOverride` supplies the text directly — for a scanned statement, the OCR
 * text, since the PDF itself has none.
 */
export async function parseStatement(
  buffer: Buffer,
  password?: string,
  textOverride?: { text: string; numPages: number }
): Promise<ParseResult> {
  const { text, numPages } = textOverride ?? (await extractPdfText(buffer, password));

  if (!text || text.trim().length === 0) {
    throw new Error("No readable text could be extracted from this PDF. Please ensure it is an authentic electronic statement and not a scanned image.");
  }

  const chunks = chunkText(text, MAX_CHARS_PER_CHUNK);
  const allTransactions: Transaction[] = [];
  let failedChunks = 0;

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;

    // One retry: a transient rate limit or malformed JSON should not silently
    // drop every row in the chunk.
    let extracted: Transaction[] | null = null;
    for (let attempt = 0; attempt < 2 && extracted === null; attempt++) {
      try {
        extracted = await extractChunk(chunk);
      } catch (chunkErr) {
        console.warn(`[PARSER] Error extracting chunk (attempt ${attempt + 1}):`, chunkErr);
      }
    }

    if (extracted === null) failedChunks++;
    else allTransactions.push(...extracted);
  }

  const continuity = validateBalanceContinuity(allTransactions, findOpeningBalance(text));

  return { transactions: allTransactions, continuity, pagesProcessed: numPages, failedChunks };
}

async function extractChunk(chunk: string): Promise<Transaction[]> {
  const rawResponse = await callGroq(buildExtractionPrompt(chunk));
  const parsedJson = safeJsonParse(rawResponse);
  const list = TransactionListSchema.safeParse(parsedJson?.transactions ?? []);

  if (list.success) return list.data;

  console.warn("[PARSER] Chunk schema parse warning, attempting item-by-item recovery:", list.error.message);
  const rawTxns = Array.isArray(parsedJson?.transactions) ? parsedJson.transactions : [];
  const recovered: Transaction[] = [];
  for (const t of rawTxns) {
    const item = TransactionSchema.safeParse(t);
    if (item.success) recovered.push(item.data);
  }
  return recovered;
}

/** Splits on line boundaries so a transaction row is never cut in half. */
function chunkText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];
  const chunks: string[] = [];
  let current = "";
  for (const line of text.split("\n")) {
    if (current && current.length + line.length + 1 > maxChars) {
      chunks.push(current);
      current = "";
    }
    // A single line longer than the limit is still split, as a last resort.
    for (let i = 0; i < line.length; i += maxChars) {
      const piece = line.slice(i, i + maxChars);
      current = current ? `${current}\n${piece}` : piece;
      if (current.length >= maxChars) {
        chunks.push(current);
        current = "";
      }
    }
  }
  if (current) chunks.push(current);
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
