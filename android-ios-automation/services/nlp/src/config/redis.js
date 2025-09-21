const redis = require('redis');
const { logger } = require('../index');

let client;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    client = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
      }
    });

    client.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    client.on('connect', () => {
      logger.info('Connected to Redis');
    });

    client.on('ready', () => {
      logger.info('Redis client is ready');
    });

    client.on('end', () => {
      logger.info('Redis client disconnected');
    });

    await client.connect();
    
    // Test connection
    await client.ping();
    logger.info('Redis connection test successful');
    
    return client;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Don't throw error - allow service to run without Redis
    logger.warn('Continuing without Redis cache');
    return null;
  }
};

const getClient = () => {
  if (!client) {
    throw new Error('Redis client not initialized. Call connectRedis first.');
  }
  return client;
};

const disconnectRedis = async () => {
  if (client) {
    await client.quit();
    logger.info('Redis client disconnected');
  }
};

module.exports = {
  connectRedis,
  getClient,
  disconnectRedis
};