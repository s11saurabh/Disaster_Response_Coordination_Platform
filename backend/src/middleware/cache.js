const supabase = require('../services/supabase');
const logger = require('../utils/logger');

const CACHE_TTL = process.env.CACHE_TTL || 3600000;

const getCachedData = async (key) => {
  try {
    const { data, error } = await supabase
      .from('cache')
      .select('value, expires_at')
      .eq('key', key)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      logger.error('Error fetching cached data:', error);
      return null;
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    if (now > expiresAt) {
      await deleteCachedData(key);
      return null;
    }

    logger.debug(`Cache hit for key: ${key}`);
    return data.value;
  } catch (error) {
    logger.error('Error in getCachedData:', error);
    return null;
  }
};

const setCachedData = async (key, value, customTTL = null) => {
  try {
    const ttl = customTTL || CACHE_TTL;
    const expiresAt = new Date(Date.now() + ttl);

    const { error } = await supabase
      .from('cache')
      .upsert([{
        key,
        value,
        expires_at: expiresAt.toISOString()
      }], {
        onConflict: 'key'
      });

    if (error) {
      logger.error('Error setting cached data:', error);
      return false;
    }

    logger.debug(`Cache set for key: ${key}, expires: ${expiresAt.toISOString()}`);
    return true;
  } catch (error) {
    logger.error('Error in setCachedData:', error);
    return false;
  }
};

const deleteCachedData = async (key) => {
  try {
    const { error } = await supabase
      .from('cache')
      .delete()
      .eq('key', key);

    if (error) {
      logger.error('Error deleting cached data:', error);
      return false;
    }

    logger.debug(`Cache deleted for key: ${key}`);
    return true;
  } catch (error) {
    logger.error('Error in deleteCachedData:', error);
    return false;
  }
};

const clearExpiredCache = async () => {
  try {
    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('cache')
      .delete()
      .lt('expires_at', now);

    if (error) {
      logger.error('Error clearing expired cache:', error);
      return false;
    }

    logger.info('Expired cache entries cleared');
    return true;
  } catch (error) {
    logger.error('Error in clearExpiredCache:', error);
    return false;
  }
};

const cacheMiddleware = (keyGenerator, ttl = null) => {
  return async (req, res, next) => {
    try {
      const cacheKey = typeof keyGenerator === 'function' ? keyGenerator(req) : keyGenerator;
      
      const cachedData = await getCachedData(cacheKey);
      if (cachedData) {
        return res.json(cachedData);
      }

      req.cacheKey = cacheKey;
      req.cacheTTL = ttl;
      
      next();
    } catch (error) {
      logger.error('Error in cache middleware:', error);
      next();
    }
  };
};

const startCacheCleanup = () => {
  const cleanupInterval = 30 * 60 * 1000;
  
  setInterval(async () => {
    await clearExpiredCache();
  }, cleanupInterval);
  
  logger.info('Cache cleanup scheduled every 30 minutes');
};

module.exports = {
  getCachedData,
  setCachedData,
  deleteCachedData,
  clearExpiredCache,
  cacheMiddleware,
  startCacheCleanup
};
