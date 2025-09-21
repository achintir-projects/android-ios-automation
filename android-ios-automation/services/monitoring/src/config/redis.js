const { createClient } = require('redis');
const logger = require('./logger').setupLogger();

let redisClient = null;

const setupRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          const delay = Math.min(retries * 50, 500);
          logger.warn(`Redis reconnect attempt ${retries}, delay ${delay}ms`);
          return delay;
        }
      }
    });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    
    logger.info('Redis connection established successfully');
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized');
  }
  return redisClient;
};

// Cache operations
const cacheOperations = {
  // Set cache with TTL
  set: async (key, value, ttl = 3600) => {
    try {
      const client = getRedisClient();
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  },

  // Get cache value
  get: async (key) => {
    try {
      const client = getRedisClient();
      const value = await client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  },

  // Delete cache key
  delete: async (key) => {
    try {
      const client = getRedisClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      const client = getRedisClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  },

  // Set key expiration
  expire: async (key, ttl) => {
    try {
      const client = getRedisClient();
      await client.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error('Cache expire error:', error);
      return false;
    }
  },

  // Get key TTL
  ttl: async (key) => {
    try {
      const client = getRedisClient();
      return await client.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error:', error);
      return -1;
    }
  }
};

// Queue operations for background tasks
const queueOperations = {
  // Add job to queue
  addJob: async (queueName, jobData, priority = 0) => {
    try {
      const client = getRedisClient();
      const job = {
        id: Date.now().toString(),
        data: jobData,
        priority,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      await client.lPush(`queue:${queueName}`, JSON.stringify(job));
      return job.id;
    } catch (error) {
      logger.error('Queue add job error:', error);
      return null;
    }
  },

  // Get job from queue
  getJob: async (queueName) => {
    try {
      const client = getRedisClient();
      const result = await client.rPop(`queue:${queueName}`);
      return result ? JSON.parse(result) : null;
    } catch (error) {
      logger.error('Queue get job error:', error);
      return null;
    }
  },

  // Get queue length
  getQueueLength: async (queueName) => {
    try {
      const client = getRedisClient();
      return await client.lLen(`queue:${queueName}`);
    } catch (error) {
      logger.error('Queue length error:', error);
      return 0;
    }
  },

  // Clear queue
  clearQueue: async (queueName) => {
    try {
      const client = getRedisClient();
      await client.del(`queue:${queueName}`);
      return true;
    } catch (error) {
      logger.error('Queue clear error:', error);
      return false;
    }
  }
};

// Pub/Sub operations for real-time updates
const pubSubOperations = {
  // Publish message
  publish: async (channel, message) => {
    try {
      const client = getRedisClient();
      await client.publish(channel, JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error('Pub/Sub publish error:', error);
      return false;
    }
  },

  // Subscribe to channel
  subscribe: async (channel, callback) => {
    try {
      const client = getRedisClient();
      const subscriber = client.duplicate();
      await subscriber.connect();
      await subscriber.subscribe(channel, (message) => {
        try {
          const parsedMessage = JSON.parse(message);
          callback(parsedMessage);
        } catch (error) {
          logger.error('Pub/Sub message parse error:', error);
        }
      });
      return subscriber;
    } catch (error) {
      logger.error('Pub/Sub subscribe error:', error);
      return null;
    }
  },

  // Unsubscribe from channel
  unsubscribe: async (subscriber, channel) => {
    try {
      await subscriber.unsubscribe(channel);
      await subscriber.disconnect();
      return true;
    } catch (error) {
      logger.error('Pub/Sub unsubscribe error:', error);
      return false;
    }
  }
};

// Health check for Redis
const checkRedisHealth = async () => {
  try {
    const client = getRedisClient();
    const start = Date.now();
    await client.ping();
    const latency = Date.now() - start;
    
    return { 
      status: 'healthy', 
      latency,
      connected: true
    };
  } catch (error) {
    logger.error('Redis health check failed:', error);
    return { 
      status: 'unhealthy', 
      error: error.message,
      connected: false
    };
  }
};

// Close Redis connection
const closeRedisConnection = async () => {
  try {
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      logger.info('Redis connection closed');
    }
  } catch (error) {
    logger.error('Failed to close Redis connection:', error);
    throw error;
  }
};

module.exports = {
  setupRedis,
  getRedisClient,
  cacheOperations,
  queueOperations,
  pubSubOperations,
  checkRedisHealth,
  closeRedisConnection
};