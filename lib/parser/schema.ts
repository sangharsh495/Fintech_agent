import { z } from "zod";

export const TransactionSchema = z.object({
  date: z.string().min(1),          // keep as string; normalize separately, formats vary too much to trust LLM date parsing
  description: z.string().min(1),
  refNo: z.string().nullable().default(null),
  debit: z.number().nullable(),
  credit: z.number().nullable(),
  balance: z.number(),
});

export const TransactionListSchema = z.array(TransactionSchema);

export type Transaction = z.infer<typeof TransactionSchema>;
