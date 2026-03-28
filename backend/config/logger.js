const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
];

// Add CloudWatch transport in production
if (process.env.NODE_ENV === 'production' && process.env.AWS_REGION) {
  transports.push(
    new WinstonCloudWatch({
      logGroupName: 'vaultsphere-backend',
      logStreamName: `${process.env.NODE_ENV}-${new Date().toISOString().split('T')[0]}`,
      awsRegion: process.env.AWS_REGION,
      jsonMessage: true,
      retentionInDays: 30
    })
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Security event logging
const logSecurityEvent = (event, details = {}) => {
  logger.warn('SECURITY_EVENT', {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Authentication event logging
const logAuthEvent = (event, userId, details = {}) => {
  logger.info('AUTH_EVENT', {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Database event logging
const logDatabaseEvent = (event, details = {}) => {
  logger.info('DATABASE_EVENT', {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

module.exports = {
  logger,
  logSecurityEvent,
  logAuthEvent,
  logDatabaseEvent
};