const config = require('./config');
const logger = require('./utils/logger');
const { connectDB, disconnectDB } = require('./config/db');
const app = require('./app');

config.validate();

let server;

connectDB()
  .then(() => {
    server = app.listen(config.port, () => logger.info(`Listening on port ${config.port}`));
  })
  .catch((err) => {
    logger.error(err, 'Failed to connect to MongoDB');
    process.exit(1);
  });

const shutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
