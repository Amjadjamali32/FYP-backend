import winston from 'winston';

const { combine, timestamp, json, printf } = winston.format;

// Define custom log format for console (more readable)
const consoleFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level}]: ${message}`;
});

const logger = winston.createLogger({
  level: 'info', // Default log level
  format: combine(
    timestamp(), // Add timestamp to logs
    json() // Format logs in JSON format for files
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp(),
        consoleFormat // Simple and colored output for console logs
      ),
    }),

    // File transport for error level logs
    new winston.transports.File({
      filename: 'error.log',
      level: 'error', // Only log error level and above to error.log
    }),

    // File transport for combined logs (all levels)
    new winston.transports.File({
      filename: 'combined.log',
    }),
  ],
});

// Handle unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception thrown: ${error}`);
});

export default logger;
