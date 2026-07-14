import { Worker, Job } from "bullmq"
import { statementUploads, transactions, bankAccounts } from "@/server/db/schema"
import { eq, and } from "drizzle-orm"
import { statementProcessingQueue, JobNames, type StatementProcessingJobData } from "@/server/jobs/queues"
import { parseStatementFile } from "@/server/services/parser"
import { categorizeTransaction } from "@/server/services/parser/categorizer"
import { deduplicateTransactions } from "@/server/services/parser/deduplicator"
import { mlClusteringQueue, QueueNames } from "@/server/jobs/queues"
import { addJob } from "@/server/jobs/queues"
import { withUserScopedDb, adminQuery } from "@/server/db/rls-connection"
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3"
import { getS3Client } from "@/server/lib/s3"
import crypto from "crypto"
import { safeLogError } from "@/server/lib/safe-log";

/**
 * Statement Processing Worker
 * Handles async processing of bank statement uploads
 */

// S3 client for downloading statement files
const s3Client = getS3Client()

interface ParsedTransaction {
  date: Date
  description: string
  amount: number
  type: "credit" | "debit"
  balance?: number
  rawDescription: string
  paymentMethod?: string
  merchant?: string
  hash?: string
  tags?: any
}

interface ProcessedTransaction extends ParsedTransaction {
  category: string
  subcategory?: string
  isRecurring: boolean
  hash: string
}

const worker = new Worker<StatementProcessingJobData>(
  QueueNames.STATEMENT_PROCESSING,
  async (job: Job<StatementProcessingJobData>) => {
    const { uploadId, userId, bankAccountId, fileType, s3Key, fileName, statementMonth, statementYear } = job.data
    
    console.log(`[Worker] Processing statement upload ${uploadId} for user ${userId}`)
    
    // Update status to processing (admin-level: must work regardless of RLS scope)
    await adminQuery(
      `UPDATE statement_uploads SET processing_status = 'processing' WHERE id = $1`,
      [uploadId]
    )

    try {
      // Step 1: Download file from S3
      console.log(`[Worker] Downloading file from S3: ${s3Key}`)
      const fileBuffer = await downloadFromS3(s3Key)
      
      // Step 2: Parse file based on type
      console.log(`[Worker] Parsing ${fileType} file...`)
      const parsedTransactions = await parseStatementFile(fileBuffer, fileType, fileName)
      console.log(`[Worker] Parsed ${parsedTransactions.length} transactions`)

      if (parsedTransactions.length === 0) {
        throw new Error("No transactions found in statement")
      }

      // Step 3: Categorize transactions
      console.log(`[Worker] Categorizing transactions...`)
      const categorizedTransactions = await Promise.all(
        parsedTransactions.map(async (t: ParsedTransaction) => {
          const category = categorizeTransaction(t.description, t.amount, t.type)
          return {
            ...t,
            category: category.category || "Uncategorized",
            subcategory: category.subcategory,
            tags: (category as any).tags ? (Array.isArray((category as any).tags) ? (category as any).tags.join(",") : (category as any).tags) : undefined,
            isRecurring: category.isRecurring || false,
            hash: t.hash || crypto.createHash("sha256").update(`${t.date}-${t.amount}-${t.description}`).digest("hex")
          }
        })
      )

      // Step 4: Deduplicate transactions
      console.log(`[Worker] Checking for duplicates...`)
      
      const { newTransactions, duplicates } = await withUserScopedDb(userId, async (scopedDb) => {
        const result = await deduplicateTransactions(
          scopedDb,
          userId,
          bankAccountId,
          categorizedTransactions
        )
        
        console.log(`[Worker] New: ${result.newTransactions.length}, Duplicates: ${result.duplicates.length}`)

        // Step 5: Insert new transactions
        if (result.newTransactions.length > 0) {
          console.log(`[Worker] Inserting ${result.newTransactions.length} transactions...`)
          await insertTransactionsScoped(scopedDb, userId, bankAccountId, uploadId, result.newTransactions)
        }

        // Step 6: Update statement upload record
        await scopedDb
          .update(statementUploads)
          .set({
            processingStatus: "completed",
            transactionsExtracted: result.newTransactions.length,
            transactionsDuplicate: result.duplicates.length,
            processedAt: new Date(),
          })
          .where(eq(statementUploads.id, uploadId))
          
        // Step 8: Update bank account last sync
        await scopedDb
          .update(bankAccounts)
          .set({ updatedAt: new Date() })
          .where(eq(bankAccounts.id, bankAccountId))
          
        return result;
      });

      // Step 7: Trigger ML clustering for this user
      console.log(`[Worker] Triggering ML clustering for user ${userId}`)
      await addJob(
        QueueNames.ML_CLUSTERING,
        JobNames.CLUSTER_USER_TRANSACTIONS,
        {
          userId,
          trigger: "statement_upload",
          transactionCount: newTransactions.length,
        },
        { jobId: `cluster-${userId}-${Date.now()}` }
      )

      console.log(`[Worker] Successfully processed upload ${uploadId}`)
      
      return {
        success: true,
        transactionsExtracted: newTransactions.length,
        transactionsDuplicate: duplicates.length,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      safeLogError(`[Worker] Failed to process upload ${uploadId}:`, error)
      
      // Update status to failed (admin-level: must work regardless of RLS scope)
      await adminQuery(
        `UPDATE statement_uploads SET processing_status = 'failed', error_message = $1, processed_at = NOW() WHERE id = $2`,
        [errorMessage, uploadId]
      )

      // Re-throw to trigger retry logic
      throw error
    }
  },
  {
    connection: statementProcessingQueue.opts.connection,
    concurrency: parseInt(process.env.STATEMENT_WORKER_CONCURRENCY || "2"),
    limiter: {
      max: parseInt(process.env.STATEMENT_WORKER_RATE_LIMIT || "10"),
      duration: 60000, // 10 jobs per minute
    },
  }
)

// Worker event handlers
worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed:`, job.returnvalue)
})

worker.on("failed", (job, err) => {
  safeLogError(`[Worker] Job ${job?.id} failed:`, err.message)
})

worker.on("error", (err) => {
  safeLogError("[Worker] Worker error:", err)
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[Worker] Shutting down...")
  await worker.close()
  process.exit(0)
})

// Helper functions

async function downloadFromS3(s3Key: string): Promise<Buffer> {
  const bucket = process.env.S3_BUCKET || "finflow-statements"
  
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key,
  })
  
  const response = await s3Client.send(command)
  
  if (!response.Body) {
    throw new Error("Empty file from S3")
  }
  
  // Convert stream to buffer
  const chunks: Uint8Array[] = []
  for await (const chunk of response.Body as any) {
    chunks.push(chunk)
  }
  
  return Buffer.concat(chunks)
}

async function insertTransactionsScoped(
  scopedDb: any,
  userId: string,
  bankAccountId: string,
  uploadId: string,
  transactionsData: ProcessedTransaction[]
) {
  const transactionRecords = transactionsData.map((txn) => ({
    userId,
    bankAccountId,
    statementUploadId: uploadId,
    type: txn.type,
    amount: txn.amount.toFixed(2),
    category: txn.category,
    subcategory: txn.subcategory,
    description: txn.description,
    merchant: txn.merchant,
    paymentMethod: txn.paymentMethod || "unknown",
    status: "completed" as const,
    date: txn.date,
    dayOfWeek: txn.date.getDay(),
    hourOfDay: txn.date.getHours(),
    isRecurring: txn.isRecurring,
    tags: txn.tags?.join(","),
    balanceAfter: txn.balance?.toFixed(2),
    rawDescription: txn.rawDescription,
    hash: txn.hash,
  }))

  // Batch insert in chunks of 100
  const chunkSize = 100
  for (let i = 0; i < transactionRecords.length; i += chunkSize) {
    const chunk = transactionRecords.slice(i, i + chunkSize)
    await scopedDb.insert(transactions).values(chunk)
  }
}

console.log("[Worker] Statement processing worker started")
export { worker }