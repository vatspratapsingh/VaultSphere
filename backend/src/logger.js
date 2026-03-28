const winston = require('winston');
const WinsltonCloudWatch = require('winston-cloudwatch');

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new WinsltonCloudWatch({
      logGroupName: '/vaultsphere/api',
      logStreamName: `${new Date().toISOString().split('T')[0]}`,
      awsRegion: 'us-east-1',
      jsonMessage: true
    })
  ]
});

module.exports = logger;
