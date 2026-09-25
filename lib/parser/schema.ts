import { z } from "zod";

export const TransactionSchema = z.object({
  date: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  refNo: z.string().max(100).nullable().default(null),
  debit: z.number().finite().nonnegative().nullable().optional().default(null),
  credit: z.number().finite().nonnegative().nullable().optional().default(null),
  balance: z.number().finite().nullable().optional().default(null),
});

export const TransactionListSchema = z.array(TransactionSchema).max(5000);

export type Transaction = z.infer<typeof TransactionSchema>;
