import { z } from "zod";

export const TransactionSchema = z.object({
  date: z.string().min(1),          // keep as string; normalize separately, formats vary too much to trust LLM date parsing
  description: z.string().min(1),
  refNo: z.string().nullable().default(null),
  debit: z.number().nullable().optional().default(null),
  credit: z.number().nullable().optional().default(null),
  balance: z.number().nullable().optional().default(null),
});

export const TransactionListSchema = z.array(TransactionSchema);

export type Transaction = z.infer<typeof TransactionSchema>;
