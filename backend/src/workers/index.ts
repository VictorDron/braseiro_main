import { Worker, Queue } from 'bullmq';
import { getRedis } from '../config/redis';
import { sendEmail } from '../config/email';
import logger from '../config/logger';

const connection = {
  connection: {
    host: process.env.REDIS_URL ? undefined : 'localhost',
    port: process.env.REDIS_URL ? undefined : 6379,
    url: process.env.REDIS_URL,
  },
};

// Email Queue
export const emailQueue = new Queue('email', {
  connection: getRedis(),
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// PDF Processing Queue
export const pdfQueue = new Queue('pdf-processing', {
  connection: getRedis(),
  defaultJobOptions: {
    removeOnComplete: 50,
    removeOnFail: 20,
    attempts: 2,
  },
});

// Email Worker
const emailWorker = new Worker(
  'email',
  async (job) => {
    const { to, subject, html } = job.data;
    await sendEmail(to, subject, html);
    logger.info(`Email sent to ${to}: ${subject}`);
  },
  { connection: getRedis() }
);

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job ${job?.id} failed:`, err);
});

// PDF Worker
const pdfWorker = new Worker(
  'pdf-processing',
  async (job) => {
    const { type, data } = job.data;
    logger.info(`Processing PDF job: ${type}`);
    // PDF processing logic will be added here
  },
  { connection: getRedis() }
);

pdfWorker.on('failed', (job, err) => {
  logger.error(`PDF job ${job?.id} failed:`, err);
});

logger.info('🔄 Workers started');

export { emailWorker, pdfWorker };
