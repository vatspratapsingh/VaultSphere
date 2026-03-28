const winston = require('winston');
const WinstonCloudWatch = require('winston-cloudwatch');
const path = require('path');

const createCloudWatchLogger = (logGroupName, streamName) => {
  const logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ]
  });

  // Only enable CloudWatch in non-development environments
  if (process.env.CLOUDWATCH_ENABLED === 'true') {
    logger.add(new WinstonCloudWatch({
      logGroupName: `/vaultsphere/${logGroupName}`,
      logStreamName: `${streamName}-${new Date().toISOString().split('T')[0]}`,
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      jsonMessage: true,
      retentionInDays: 30
    }));
  }

  return logger;
};

const apiLogger = createCloudWatchLogger('api', 'request-stream');
const authLogger = createCloudWatchLogger('auth', 'auth-stream');
const mlLogger = createCloudWatchLogger('ml', 'ml-stream');

module.exports = { apiLogger, authLogger, mlLogger };
