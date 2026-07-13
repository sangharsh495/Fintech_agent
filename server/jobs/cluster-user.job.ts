import { Worker, Job } from "bullmq"
import { db } from "@/server/db"
import { transactions, clusterMetadata, clusterRuns } from "@/server/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { mlClusteringQueue, JobNames, type MLClusteringJobData, QueueNames } from "@/server/jobs/queues"
import { runPythonClustering } from "@/server/ml-service/run-clustering"
import { safeLogError } from "@/server/lib/safe-log";

/**
 * ML Clustering Worker
 * Runs per-user transaction clustering using Python ML service
 */

const worker = new Worker<MLClusteringJobData>(
  QueueNames.ML_CLUSTERING,
  async (job: Job<MLClusteringJobData>) => {
    const { userId, trigger, transactionCount } = job.data
    
    console.log(`[ML Worker] Starting clustering for user ${userId} (trigger: ${trigger})`)
    
    try {
      // Step 1: Fetch user transactions
      const userTransactions = await db
        .select({
          id: transactions.id,
          amount: transactions.amount,
          category: transactions.category,
          date: transactions.date,
          type: transactions.type,
          paymentMethod: transactions.paymentMethod,
          merchant: transactions.merchant,
          description: transactions.description,
        })
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(transactions.date)

      if (userTransactions.length < 10) {
        console.log(`[ML Worker] Insufficient transactions (${userTransactions.length}) for user ${userId}, skipping clustering`)
        return { success: true, skipped: true, reason: "Insufficient transactions" }
      }

      // Step 2: Save transactions to temp file for Python script
      const tempFilePath = `/tmp/user_${userId}_transactions_${Date.now()}.json`
      await writeTransactionsToTempFile(userTransactions, tempFilePath)

      // Step 3: Run Python clustering script
      console.log(`[ML Worker] Running clustering for ${userTransactions.length} transactions...`)
      const clusteringResults = await runPythonClustering(userId, tempFilePath, userTransactions.length)

      // Step 4: Update transactions with cluster assignments
      await updateTransactionClusters(userId, clusteringResults)

      // Step 5: Save cluster metadata
      await saveClusterMetadata(userId, clusteringResults, trigger)

      // Step 6: Save cluster run history
      await saveClusterRun(userId, clusteringResults, trigger)

      // Cleanup temp file
      await cleanupTempFile(tempFilePath)

      console.log(`[ML Worker] Clustering completed for user ${userId}`)
      
      return {
        success: true,
        clustersCreated: Object.keys(clusteringResults.clusters).length,
        transactionsClustered: userTransactions.length,
      }
    } catch (error) {
      safeLogError(`[ML Worker] Clustering failed for user ${userId}:`, error)
      throw error
    }
  },
  {
    connection: mlClusteringQueue.opts.connection,
    concurrency: parseInt(process.env.ML_WORKER_CONCURRENCY || "1"),
    limiter: {
      max: parseInt(process.env.ML_WORKER_RATE_LIMIT || "5"),
      duration: 300000, // 5 jobs per 5 minutes (clustering is CPU intensive)
    },
  }
)

// Worker event handlers
worker.on("completed", (job) => {
  console.log(`[ML Worker] Job ${job.id} completed:`, job.returnvalue)
})

worker.on("failed", (job, err) => {
  safeLogError(`[ML Worker] Job ${job?.id} failed:`, err.message)
})

worker.on("error", (err) => {
  safeLogError("[ML Worker] Worker error:", err)
})

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[ML Worker] Shutting down...")
  await worker.close()
  process.exit(0)
})

// Helper functions

async function writeTransactionsToTempFile(transactions: any[], filePath: string): Promise<void> {
  const fs = await import("fs/promises")
  const data = {
    transactions: transactions.map((t) => ({
      id: t.id,
      amount: parseFloat(t.amount),
      category: t.category,
      date: t.date.toISOString(),
      type: t.type,
      payment_method: t.paymentMethod,
      merchant: t.merchant,
      description: t.description,
    })),
  }
  await fs.writeFile(filePath, JSON.stringify(data, null, 2))
}

async function updateTransactionClusters(userId: string, results: any): Promise<void> {
  // Update spending behavior clusters
  if (results.clusters.spending_behavior) {
    for (const [clusterId, transactionIds] of Object.entries(results.clusters.spending_behavior)) {
      const txnIds = transactionIds as string[]
      if (txnIds.length > 0) {
        await db
          .update(transactions)
          .set({ spendingCluster: parseInt(clusterId) })
          .where(and(eq(transactions.userId, userId), sql`${transactions.id} IN (${txnIds.map(() => '?').join(',')})`))
      }
    }
  }

  // Update size clusters
  if (results.clusters.transaction_size) {
    for (const [clusterId, transactionIds] of Object.entries(results.clusters.transaction_size)) {
      const txnIds = transactionIds as string[]
      if (txnIds.length > 0) {
        await db
          .update(transactions)
          .set({ sizeCluster: parseInt(clusterId) })
          .where(and(eq(transactions.userId, userId), sql`${transactions.id} IN (${txnIds.map(() => '?').join(',')})`))
      }
    }
  }

  // Update temporal clusters
  if (results.clusters.temporal) {
    for (const [clusterId, transactionIds] of Object.entries(results.clusters.temporal)) {
      const txnIds = transactionIds as string[]
      if (txnIds.length > 0) {
        await db
          .update(transactions)
          .set({ temporalCluster: parseInt(clusterId) })
          .where(and(eq(transactions.userId, userId), sql`${transactions.id} IN (${txnIds.map(() => '?').join(',')})`))
      }
    }
  }

  // Update category affinity clusters
  if (results.clusters.category_affinity) {
    for (const [clusterId, transactionIds] of Object.entries(results.clusters.category_affinity)) {
      const txnIds = transactionIds as string[]
      if (txnIds.length > 0) {
        await db
          .update(transactions)
          .set({ categoryCluster: parseInt(clusterId) })
          .where(and(eq(transactions.userId, userId), sql`${transactions.id} IN (${txnIds.map(() => '?').join(',')})`))
      }
    }
  }

  // Update anomaly flags
  if (results.anomalies) {
    for (const anomaly of results.anomalies) {
      await db
        .update(transactions)
        .set({ 
          isAnomaly: true,
          anomalyScore: anomaly.score,
        })
        .where(eq(transactions.id, anomaly.transaction_id))
    }
  }
}

async function saveClusterMetadata(userId: string, results: any, trigger: string): Promise<void> {
  const metadataRecords = []

  // Spending behavior clusters
  if (results.clusters.spending_behavior && results.metadata.spending_behavior) {
    for (const [clusterId, meta] of Object.entries(results.metadata.spending_behavior)) {
      metadataRecords.push({
        userId,
        clusterType: "spending_behavior",
        clusterId: parseInt(clusterId),
        label: (meta as any).label || `Spending Cluster ${clusterId}`,
        description: (meta as any).description,
        color: (meta as any).color,
        centroid: JSON.stringify((meta as any).centroid),
        transactionCount: (meta as any).transaction_count || 0,
        totalAmount: (meta as any).total_amount || 0,
        avgAmount: (meta as any).avg_amount || 0,
        minAmount: (meta as any).min_amount,
        maxAmount: (meta as any).max_amount,
        dominantCategory: (meta as any).dominant_category,
        dominantPaymentMethod: (meta as any).dominant_payment_method,
        percentageOfTotal: (meta as any).percentage_of_total,
      })
    }
  }

  // Transaction size clusters
  if (results.clusters.transaction_size && results.metadata.transaction_size) {
    for (const [clusterId, meta] of Object.entries(results.metadata.transaction_size)) {
      metadataRecords.push({
        userId,
        clusterType: "transaction_size",
        clusterId: parseInt(clusterId),
        label: (meta as any).label || `Size Cluster ${clusterId}`,
        description: (meta as any).description,
        color: (meta as any).color,
        centroid: JSON.stringify((meta as any).centroid),
        transactionCount: (meta as any).transaction_count || 0,
        totalAmount: (meta as any).total_amount || 0,
        avgAmount: (meta as any).avg_amount || 0,
        minAmount: (meta as any).min_amount,
        maxAmount: (meta as any).max_amount,
        dominantCategory: (meta as any).dominant_category,
        dominantPaymentMethod: (meta as any).dominant_payment_method,
        percentageOfTotal: (meta as any).percentage_of_total,
      })
    }
  }

  // Temporal clusters
  if (results.clusters.temporal && results.metadata.temporal) {
    for (const [clusterId, meta] of Object.entries(results.metadata.temporal)) {
      metadataRecords.push({
        userId,
        clusterType: "temporal",
        clusterId: parseInt(clusterId),
        label: (meta as any).label || `Temporal Cluster ${clusterId}`,
        description: (meta as any).description,
        color: (meta as any).color,
        centroid: JSON.stringify((meta as any).centroid),
        transactionCount: (meta as any).transaction_count || 0,
        totalAmount: (meta as any).total_amount || 0,
        avgAmount: (meta as any).avg_amount || 0,
        minAmount: (meta as any).min_amount,
        maxAmount: (meta as any).max_amount,
        dominantCategory: (meta as any).dominant_category,
        dominantPaymentMethod: (meta as any).dominant_payment_method,
        percentageOfTotal: (meta as any).percentage_of_total,
      })
    }
  }

  // Category affinity clusters
  if (results.clusters.category_affinity && results.metadata.category_affinity) {
    for (const [clusterId, meta] of Object.entries(results.metadata.category_affinity)) {
      metadataRecords.push({
        userId,
        clusterType: "category_affinity",
        clusterId: parseInt(clusterId),
        label: (meta as any).label || `Category Cluster ${clusterId}`,
        description: (meta as any).description,
        color: (meta as any).color,
        centroid: JSON.stringify((meta as any).centroid),
        transactionCount: (meta as any).transaction_count || 0,
        totalAmount: (meta as any).total_amount || 0,
        avgAmount: (meta as any).avg_amount || 0,
        minAmount: (meta as any).min_amount,
        maxAmount: (meta as any).max_amount,
        dominantCategory: (meta as any).dominant_category,
        dominantPaymentMethod: (meta as any).dominant_payment_method,
        percentageOfTotal: (meta as any).percentage_of_total,
      })
    }
  }

  if (metadataRecords.length > 0) {
    // Delete old metadata for this user
    await db.delete(clusterMetadata).where(eq(clusterMetadata.userId, userId))
    
    // Insert new metadata
    await db.insert(clusterMetadata).values(metadataRecords)
  }
}

async function saveClusterRun(userId: string, results: any, trigger: string): Promise<void> {
  await db.insert(clusterRuns).values({
    userId,
    clusterType: "all",
    algorithm: results.algorithm || "kmeans",
    nClusters: results.n_clusters || 0,
    silhouetteScore: results.silhouette_score,
    inertia: results.inertia,
    totalTransactions: results.total_transactions,
    parameters: JSON.stringify(results.parameters || {}),
    status: "completed",
  })
}

async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    const fs = await import("fs/promises")
    await fs.unlink(filePath)
  } catch (error) {
    console.warn(`[ML Worker] Failed to cleanup temp file ${filePath}:`, error)
  }
}

console.log("[ML Worker] ML clustering worker started")
export { worker }