import { Worker } from 'bullmq';
import { safeLogError } from "@/server/lib/safe-log";


// Redis connection options
const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: Number(process.env.REDIS_DB) || 0,
};

// Create workers for each queue
export const transactionWorker = new Worker(
  'transaction-processing',
  async (job) => {
    console.log(`Processing transaction job ${job.id} of type ${job.name}`);
    // Actual implementation would process the transaction
    // For now, simulate work
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { status: 'completed', processedAt: new Date().toISOString() };
  },
  { connection: redisOptions }
);

export const emailWorker = new Worker(
  'email-notifications',
  async (job) => {
    console.log(`Processing email job ${job.id} of type ${job.name}`);
    // Actual implementation would send email
    // For now, simulate work
    await new Promise(resolve => setTimeout(resolve, 2000));
    return { status: 'sent', sentAt: new Date().toISOString() };
  },
  { connection: redisOptions }
);

export const reportWorker = new Worker(
  'report-generation',
  async (job) => {
    console.log(`Processing report job ${job.id} of type ${job.name}`);
    // Actual implementation would generate report
    // For now, simulate work
    await new Promise(resolve => setTimeout(resolve, 3000));
    return { status: 'generated', generatedAt: new Date().toISOString() };
  },
  { connection: redisOptions }
);

export const backupWorker = new Worker(
  'data-backup',
  async (job) => {
    console.log(`Processing backup job ${job.id} of type ${job.name}`);
    // Actual implementation would perform backup
    // For now, simulate work
    await new Promise(resolve => setTimeout(resolve, 5000));
    return { status: 'completed', backedUpCompleted: true, completedAt: new Date().toISOString() };
  },
  { connection: redisOptions }
);

// Handle worker events
const setupWorkerEvents = (worker: Worker, name: string) => {
  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed successfully in ${name} worker`);
  });

  worker.on('failed', (job, err) => {
    safeLogError(`Job ${job?.id} failed in ${name} worker:`, err);
  });

  worker.on('error', (err) => {
    safeLogError(`${name} worker error:`, err);
  });
};

// Setup event listeners
setupWorkerEvents(transactionWorker, 'transaction');
setupWorkerEvents(emailWorker, 'email');
setupWorkerEvents(reportWorker, 'report');
setupWorkerEvents(backupWorker, 'backup');

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, closing workers...');
  await transactionWorker.close();
  await emailWorker.close();
  await reportWorker.close();
  await backupWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, closing workers...');
  await transactionWorker.close();
  await emailWorker.close();
  await reportWorker.close();
  await backupWorker.close();
  process.exit(0);
});

export default {
  transactionWorker,
  emailWorker,
  reportWorker,
  backupWorker
};