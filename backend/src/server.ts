import app from './app';
import { config } from './config';
import prisma from './config/database';
import logger from './config/logger';

async function main() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    app.listen(config.port, () => {
      logger.info(`🚀 Braseiro API running on port ${config.port}`);
      logger.info(`📍 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
