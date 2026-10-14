import { Queue } from 'bullmq';
import type { RedisOptions } from 'ioredis';
import { QueueBackendUnavailableError } from '@/server/jobs/queues';

// Redis connection options
const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,
};

// Job queues
//
// Built on first use, and only when a Redis server is configured. Creating a
// BullMQ Queue opens a connection immediately, and Next preloads every route
// module at startup, so eager queues retried localhost:6379 forever and filled
// the logs with ECONNREFUSED on deployments without Redis.
const queueBackendConfigured = Boolean(process.env.REDIS_URL || process.env.REDIS_HOST)
const queues = new Map<string, Queue>()

function getQueue(name: string): Queue {
  if (!queueBackendConfigured) throw new QueueBackendUnavailableError(name)
  let queue = queues.get(name)
  if (!queue) {
    queue = new Queue(name, { connection: redisOptions })
    queues.set(name, queue)
  }
  return queue
}

// Job types
export interface TransactionJobData {
  userId: string;
  transactionId: string;
  type: 'categorize' | 'reconcile' | 'notify';
}

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data?: Record<string, any>;
}

export interface ReportJobData {
  userId: string;
  reportType: 'spending' | 'tax' | 'investment' | 'net-worth';
  dateRange: {
    start: string;
    end: string;
  };
  format: 'pdf' | 'csv' | 'excel';
}

export interface BackupJobData {
  type: 'full' | 'incremental';
  includeUserData: boolean;
}

// Utility functions to add jobs
export const addTransactionJob = async (data: TransactionJobData) => {
  return await getQueue('transaction-processing').add('process-transaction', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
};

export const addEmailJob = async (data: EmailJobData) => {
  return await getQueue('email-notifications').add('send-email', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
};

export const addReportJob = async (data: ReportJobData) => {
  return await getQueue('report-generation').add('generate-report', data, {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
};

export const addBackupJob = async (data: BackupJobData) => {
  return await getQueue('data-backup').add('perform-backup', data, {
    attempts: 1,
    backoff: {
      type: 'fixed',
      delay: 30000,
    },
  });
};
