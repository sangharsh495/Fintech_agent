import { Queue } from 'bullmq';
import { IORedisOptions } from 'ioredis';

// Redis connection options
const redisOptions: IORedisOptions = {
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

// Processors (these would be implemented in separate worker files)
export const setupJobProcessors = () => {
  // Transaction processing
  transactionQueue.process('process-transaction', async (job) => {
    // Implementation would go here
    console.log(`Processing transaction job: ${job.id}`);
    // Actual implementation would categorize, reconcile, or notify
    return { status: 'completed' };
  });

  // Email notifications
  emailQueue.process('send-email', async (job) => {
    // Implementation would go here
    console.log(`Sending email job: ${job.id}`);
    // Actual implementation would use email service
    return { status: 'sent' };
  });

  // Report generation
  reportQueue.process('generate-report', async (job) => {
    // Implementation would go here
    console.log(`Generating report job: ${job.id}`);
    // Actual implementation would generate reports
    return { status: 'generated' };
  });

  // Data backup
  backupQueue.process('perform-backup', async (job) => {
    // Implementation would go here
    console.log(`Performing backup job: ${job.id}`);
    // Actual implementation would backup data
    return { status: 'completed' };
  });
};