const winston = require('winston');
const path = require('path');

// Determine if we're in a test environment
const isTest = process.env.NODE_ENV === 'test';

// Set the default log level based on the environment
const defaultLogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

// Configure transports
const transports = [
  // Console output
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  })
];

// Only add file transports if not in test environment
if (!isTest) {
  const fs = require('fs');
  
  // Ensure logs directory exists
  const logsDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logsDir)) {
    try {
      fs.mkdirSync(logsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create logs directory:', error);
    }
  }
  
  transports.push(
    new winston.transports.File({ 
      filename: path.join(logsDir, 'error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    })
  );
}

/**
 * Logger configuration using Winston
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || defaultLogLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `${timestamp} ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports
});

// Create a stream object for use with Morgan
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger; 