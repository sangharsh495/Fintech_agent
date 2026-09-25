import { decryptPDF } from "@/server/services/parser/pdf.decrypt";
import { extractPdfText } from "../pdf/extractText";
import { buildExtractionPrompt } from "./promptBuilder";
import { callGroq } from "../groq/client";
import { TransactionListSchema, TransactionSchema, type Transaction } from "./schema";
import { validateBalanceContinuity } from "./validateContinuity";
import { detectBank, getBankProfile, GENERIC_PROFILE } from "@/server/services/parser/bank-profiles";
import { parseLinesAsTransactions } from "@/server/services/parser/pdf.table";
import { safeLogError, safeLogInfo } from "@/server/lib/safe-log";

const MAX_CHARS_PER_CHUNK = 6000; // conservative, leaves room for prompt + model context

export type ParseResult = {
  transactions: Transaction[];
  continuity: ReturnType<typeof validateBalanceContinuity>;
  pagesProcessed: number;
};

export async function parseStatement(
  buffer: Buffer,
  password?: string,
  options?: { fileName?: string; bankId?: string }
): Promise<ParseResult> {
  // 1. Decrypt PDF first if encrypted (with bank hint resolution)
  const { buffer: cleanBuffer } = await decryptPDF(buffer, password, options);

  // 2. Extract plain text and page count
  const { text, numPages } = await extractPdfText(cleanBuffer, password);

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
        safeLogInfo("[PARSER] Chunk schema parse warning, attempting item-by-item recovery:", list.error.message);
        const rawTxns = Array.isArray(parsedJson?.transactions) ? parsedJson.transactions : [];
        for (const t of rawTxns) {
          const item = TransactionSchema.safeParse(t);
          if (item.success) allTransactions.push(item.data);
        }
      }
    } catch (chunkErr) {
      safeLogError("[PARSER] Error extracting chunk with LLM, skipping chunk:", chunkErr);
    }
  }

  // 3. Fallback to deterministic bank-profile regex parser if LLM produced 0 transactions
  if (allTransactions.length === 0 && text.trim().length > 0) {
    safeLogInfo("[PARSER] LLM produced 0 transactions, engaging deterministic bank profile parser");
    const detected = (options?.bankId ? getBankProfile(options.bankId) : null) || detectBank(text) || (options?.fileName ? detectBank(options.fileName) : null) || GENERIC_PROFILE;
    const lines = text.split(/\r?\n/);
    const fallbackTxns = parseLinesAsTransactions(lines, detected);
    for (const t of fallbackTxns) {
      allTransactions.push({
        date: t.date instanceof Date ? t.date.toISOString().split("T")[0] : String(t.date),
        description: t.description,
        debit: t.type === "debit" ? t.amount : null,
        credit: t.type === "credit" ? t.amount : null,
        balance: t.balance ?? null,
      });
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
