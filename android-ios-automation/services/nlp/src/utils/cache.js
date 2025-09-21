const { getClient } = require('../config/redis');
const logger = require('../index').logger;

/**
 * Cache response in Redis
 */
const cacheResponse = async (key, data, ttl = 3600) => {
  try {
    const client = getClient();
    if (!client) {
      logger.warn('Redis client not available, skipping cache');
      return false;
    }

    const serializedData = JSON.stringify(data);
    await client.setEx(key, ttl, serializedData);
    
    logger.debug('Data cached successfully', { key, ttl });
    return true;
  } catch (error) {
    logger.warn('Failed to cache response:', error);
    return false;
  }
};

/**
 * Get cached response from Redis
 */
const getCachedResponse = async (key) => {
  try {
    const client = getClient();
    if (!client) {
      logger.warn('Redis client not available, skipping cache retrieval');
      return null;
    }

    const cachedData = await client.get(key);
    if (cachedData) {
      logger.debug('Cache hit', { key });
      return JSON.parse(cachedData);
    }
    
    logger.debug('Cache miss', { key });
    return null;
  } catch (error) {
    logger.warn('Failed to get cached response:', error);
    return null;
  }
};

/**
 * Delete cached response
 */
const deleteCachedResponse = async (key) => {
  try {
    const client = getClient();
    if (!client) {
      logger.warn('Redis client not available, skipping cache deletion');
      return false;
    }

    await client.del(key);
    logger.debug('Cache deleted', { key });
    return true;
  } catch (error) {
    logger.warn('Failed to delete cached response:', error);
    return false;
  }
};

/**
 * Clear cache by pattern
 */
const clearCacheByPattern = async (pattern) => {
  try {
    const client = getClient();
    if (!client) {
      logger.warn('Redis client not available, skipping cache clearing');
      return false;
    }

    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      logger.debug('Cache cleared by pattern', { pattern, count: keys.length });
    }
    
    return true;
  } catch (error) {
    logger.warn('Failed to clear cache by pattern:', error);
    return false;
  }
};

/**
 * Generate cache key
 */
const generateCacheKey = (prefix, ...params) => {
  const normalizedParams = params.map(param => {
    if (typeof param === 'object') {
      return JSON.stringify(param);
    }
    return String(param);
  });
  
  return `${prefix}:${normalizedParams.join(':')}`;
};

/**
 * Cache middleware for Express
 */
const cacheMiddleware = (ttl = 3600) => {
  return async (req, res, next) => {
    try {
      // Don't cache non-GET requests
      if (req.method !== 'GET') {
        return next();
      }

      const key = generateCacheKey('api', req.originalUrl, req.query);
      const cached = await getCachedResponse(key);
      
      if (cached) {
        logger.info('Serving cached response', { url: req.originalUrl });
        return res.json(cached);
      }

      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(data) {
        cacheResponse(key, data, ttl);
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      logger.warn('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Invalidate cache middleware
 */
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    try {
      // Invalidate cache after successful POST/PUT/DELETE
      if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        await Promise.all(
          patterns.map(pattern => clearCacheByPattern(pattern))
        );
      }
      next();
    } catch (error) {
      logger.warn('Cache invalidation error:', error);
      next();
    }
  };
};

/**
 * Cache statistics
 */
const getCacheStats = async () => {
  try {
    const client = getClient();
    if (!client) {
      return { error: 'Redis client not available' };
    }

    const info = await client.info('memory');
    const keyCount = await client.dbsize();
    
    return {
      totalKeys: keyCount,
      memoryUsage: parseRedisMemoryInfo(info),
      connected: true
    };
  } catch (error) {
    logger.warn('Failed to get cache stats:', error);
    return { error: error.message };
  }
};

/**
 * Parse Redis memory info
 */
const parseRedisMemoryInfo = (info) => {
  const lines = info.split('\n');
  const memoryInfo = {};
  
  lines.forEach(line => {
    if (line.startsWith('used_memory:')) {
      memoryInfo.used = line.split(':')[1].trim();
    } else if (line.startsWith('used_memory_peak:')) {
      memoryInfo.peak = line.split(':')[1].trim();
    } else if (line.startsWith('used_memory_lua:')) {
      memoryInfo.lua = line.split(':')[1].trim();
    }
  });
  
  return memoryInfo;
};

module.exports = {
  cacheResponse,
  getCachedResponse,
  deleteCachedResponse,
  clearCacheByPattern,
  generateCacheKey,
  cacheMiddleware,
  invalidateCache,
  getCacheStats
};