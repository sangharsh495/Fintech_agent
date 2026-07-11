import { Queue } from 'bullmq';
import type { RedisOptions } from 'ioredis';

// Redis connection options
const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,
};

// Job queues
export const transactionQueue = new Queue('transaction-processing', {
  connection: redisOptions,
});

export const emailQueue = new Queue('email-notifications', {
  connection: redisOptions,
});

export const reportQueue = new Queue('report-generation', {
  connection: redisOptions,
});

export const backupQueue = new Queue('data-backup', {
  connection: redisOptions,
});

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
  return await transactionQueue.add('process-transaction', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
};

export const addEmailJob = async (data: EmailJobData) => {
  return await emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });
};

export const addReportJob = async (data: ReportJobData) => {
  return await reportQueue.add('generate-report', data, {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
};

export const addBackupJob = async (data: BackupJobData) => {
  return await backupQueue.add('perform-backup', data, {
    attempts: 1,
    backoff: {
      type: 'fixed',
      delay: 30000,
    },
  });
};
