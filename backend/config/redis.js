const Redis = require('ioredis');
const { logger } = require('./logger');

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
};

const redis = new Redis(redisOptions);

let redisFailures = 0;
let isCircuitOpen = false;

redis.on('error', (err) => {
  if (!isCircuitOpen) {
    logger.error('Redis connection error', { error: err.message });
  }
  redisFailures++;
  if (redisFailures >= 5) {
    openCircuit();
  }
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
  redisFailures = 0;
  isCircuitOpen = false;
});

const openCircuit = () => {
  if (!isCircuitOpen) {
    isCircuitOpen = true;
    logger.warn('Redis circuit breaker opened. Bypassing rate limiting for 1 minute.');
    setTimeout(() => {
      isCircuitOpen = false;
      redisFailures = 0;
      logger.info('Redis circuit breaker closed. Resuming rate limiting.');
    }, 60000);
  }
};

const getRedisStatus = () => ({
  isCircuitOpen,
  isConnected: redis.status === 'ready'
});

module.exports = { redis, getRedisStatus };
