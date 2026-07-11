import { Queue, QueueEvents, Job } from "bullmq"
import { bullMQRedisConnection } from "@/server/lib/redis"

/**
 * BullMQ Queue Definitions for FinFlow
 * Centralized queue and job management
 */

// Queue names
export const QueueNames = {
  STATEMENT_PROCESSING: "statement-processing",
  ML_CLUSTERING: "ml-clustering",
  NOTIFICATIONS: "notifications",
  WEBHOOKS: "webhooks",
} as const

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames]

// Job names within queues
export const JobNames = {
  // Statement processing jobs
  PROCESS_STATEMENT: "process-statement",
  RETRY_FAILED_STATEMENT: "retry-failed-statement",
  
  // ML clustering jobs
  CLUSTER_USER_TRANSACTIONS: "cluster-user-transactions",
  RECLUSTER_ALL_USERS: "recluster-all-users",
  
  // Notification jobs
  SEND_PUSH_NOTIFICATION: "send-push-notification",
  SEND_EMAIL_NOTIFICATION: "send-email-notification",
  
  // Webhook jobs
  DELIVER_WEBHOOK: "deliver-webhook",
  RETRY_WEBHOOK: "retry-webhook",
} as const

export type JobName = (typeof JobNames)[keyof typeof JobNames]

// Job data types
export interface StatementProcessingJobData {
  uploadId: string
  userId: string
  bankAccountId: string
  fileType: "pdf" | "xlsx" | "csv"
  s3Key: string
  fileName: string
  statementMonth: string // "2025-03"
  statementYear: number
}

export interface MLClusteringJobData {
  userId: string
  trigger: "statement_upload" | "manual" | "scheduled"
  transactionCount?: number
}

export interface NotificationJobData {
  userId: string
  type: "statement_processed" | "clustering_complete" | "upload_failed" | "anomaly_detected"
  title: string
  message: string
  metadata?: Record<string, unknown>
}

export interface WebhookJobData {
  webhookId: string
  url: string
  event: string
  payload: Record<string, unknown>
  attempt: number
  maxAttempts: number
}

// Union type for all job data
export type JobData = 
  | StatementProcessingJobData 
  | MLClusteringJobData 
  | NotificationJobData 
  | WebhookJobData

// Queue options
const defaultQueueOptions = {
  connection: bullMQRedisConnection as any,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: "exponential" as const,
      delay: 2000,
    },
  },
}

// Create queue instances
export const statementProcessingQueue = new Queue<StatementProcessingJobData>(
  QueueNames.STATEMENT_PROCESSING,
  defaultQueueOptions
)

export const mlClusteringQueue = new Queue<MLClusteringJobData>(
  QueueNames.ML_CLUSTERING,
  defaultQueueOptions
)

export const notificationsQueue = new Queue<NotificationJobData>(
  QueueNames.NOTIFICATIONS,
  defaultQueueOptions
)

export const webhooksQueue = new Queue<WebhookJobData>(
  QueueNames.WEBHOOKS,
  defaultQueueOptions
)

// Queue events for monitoring
export const statementProcessingEvents = new QueueEvents(QueueNames.STATEMENT_PROCESSING, {
  connection: bullMQRedisConnection as any,
})

export const mlClusteringEvents = new QueueEvents(QueueNames.ML_CLUSTERING, {
  connection: bullMQRedisConnection as any,
})

export const notificationEvents = new QueueEvents(QueueNames.NOTIFICATIONS, {
  connection: bullMQRedisConnection as any,
})

export const webhookEvents = new QueueEvents(QueueNames.WEBHOOKS, {
  connection: bullMQRedisConnection as any,
})

// Helper functions for adding jobs
export async function addJob<T extends JobData>(
  queueName: QueueName,
  jobName: JobName,
  data: T,
  options?: Parameters<Queue["add"]>[2]
) {
  const queue = getQueue(queueName)
  return queue.add(jobName as any, data as any, options as any) as any
}

export function getQueue(queueName: QueueName) {
  switch (queueName) {
    case QueueNames.STATEMENT_PROCESSING:
      return statementProcessingQueue
    case QueueNames.ML_CLUSTERING:
      return mlClusteringQueue
    case QueueNames.NOTIFICATIONS:
      return notificationsQueue
    case QueueNames.WEBHOOKS:
      return webhooksQueue
    default:
      throw new Error(`Unknown queue: ${queueName}`)
  }
}

// Queue metrics helpers
export async function getQueueMetrics(queueName: QueueName) {
  const queue = getQueue(queueName)
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    queue.getWaiting(),
    queue.getActive(),
    queue.getCompleted(),
    queue.getFailed(),
    queue.getDelayed(),
  ])
  
  return {
    queueName,
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
  }
}

export async function getAllQueueMetrics() {
  const results = await Promise.all(
    Object.values(QueueNames).map(getQueueMetrics)
  )
  return results
}

// Job management helpers
export async function retryFailedJobs(queueName: QueueName) {
  const queue = getQueue(queueName)
  const failedJobs = await queue.getFailed()
  
  for (const job of failedJobs) {
    await job.retry()
  }
  
  return failedJobs.length
}

export async function pauseQueue(queueName: QueueName) {
  const queue = getQueue(queueName)
  await queue.pause()
}

export async function resumeQueue(queueName: QueueName) {
  const queue = getQueue(queueName)
  await queue.resume()
}

// Cleanup
export async function closeAllQueues() {
  await Promise.all([
    statementProcessingQueue.close(),
    mlClusteringQueue.close(),
    notificationsQueue.close(),
    webhooksQueue.close(),
  ])
}

console.log("[Queues] BullMQ queues initialized")