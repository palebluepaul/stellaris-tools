/**
 * Logger utility for the application
 * Uses Winston for structured logging with different levels and formats
 */
const winston = require('winston');
const fs = require('fs-extra');
const path = require('path');
const { loggingConfig } = require('../config/config');

// Ensure log directory exists
fs.ensureDirSync(loggingConfig.logDir);

// Create a custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Create a custom format for file output (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: loggingConfig.logLevel,
  format: winston.format.json(),
  defaultMeta: { service: 'stellaris-tech-tree' },
  transports: [
    // Write to all logs with level 'info' and below to combined.log
    new winston.transports.File({
      filename: path.join(loggingConfig.logDir, 'combined.log'),
      format: fileFormat,
      maxsize: loggingConfig.maxSize,
      maxFiles: loggingConfig.maxFiles
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(loggingConfig.logDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: loggingConfig.maxSize,
      maxFiles: loggingConfig.maxFiles
    }),
    // Write detailed debug logs
    new winston.transports.File({
      filename: path.join(loggingConfig.logDir, 'debug.log'),
      level: 'debug',
      format: fileFormat,
      maxsize: loggingConfig.maxSize,
      maxFiles: loggingConfig.maxFiles
    })
  ]
});

// If we're not in production, also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

module.exports = logger; 