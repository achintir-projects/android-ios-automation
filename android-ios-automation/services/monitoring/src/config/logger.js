const winston = require('winston');
const { combine, timestamp, printf, colorize, errors, json } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, service, ...meta }) => {
  let log = `${timestamp} [${service || 'monitoring'}] ${level}: ${message}`;
  
  if (stack) {
    log += `\n${stack}`;
  }
  
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  
  return log;
});

// Create logger
const setupLogger = () => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      errors({ stack: true }),
      timestamp(),
      json()
    ),
    defaultMeta: { service: 'monitoring' },
    transports: [
      // Error logs
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      
      // Combined logs
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      
      // Console output for development
      new winston.transports.Console({
        format: combine(
          colorize(),
          timestamp(),
          consoleFormat
        ),
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
      })
    ],
    
    // Handle uncaught exceptions
    exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/exceptions.log' })
    ],
    
    // Handle unhandled promise rejections
    rejectionHandlers: [
      new winston.transports.File({ filename: 'logs/rejections.log' })
    ]
  });
};

// Create child logger for specific services
const createChildLogger = (service) => {
  const logger = setupLogger();
  logger.child = () => createChildLogger(service);
  logger.defaultMeta = { service };
  return logger;
};

module.exports = { setupLogger, createChildLogger };