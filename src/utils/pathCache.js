const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * Utility for caching path resolution results
 */
class PathCache {
  constructor() {
    this.cache = new Map();
    this.cacheFile = path.join(process.cwd(), '.cache', 'path-cache.json');
  }

  /**
   * Get a cached path
   * @param {string} key - Cache key
   * @returns {string|null} Cached path or null if not found
   */
  get(key) {
    if (!this.cache.has(key)) {
      return null;
    }
    
    const entry = this.cache.get(key);
    
    // Check if the cache entry has expired
    if (entry.expires && entry.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * Set a path in the cache
   * @param {string} key - Cache key
   * @param {string} value - Path to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = null) {
    const entry = {
      value,
      expires: ttl ? Date.now() + ttl : null
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Remove a path from the cache
   * @param {string} key - Cache key
   */
  invalidate(key) {
    this.cache.delete(key);
  }

  /**
   * Clear the entire cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Save the cache to disk
   * @returns {Promise<boolean>} True if the cache was saved successfully
   */
  async save() {
    try {
      // Create the cache directory if it doesn't exist
      await fs.mkdir(path.dirname(this.cacheFile), { recursive: true });
      
      // Convert the cache to a serializable object
      const serialized = {};
      for (const [key, entry] of this.cache.entries()) {
        serialized[key] = entry;
      }
      
      // Write the cache to disk
      await fs.writeFile(this.cacheFile, JSON.stringify(serialized, null, 2));
      logger.debug('Path cache saved to disk');
      return true;
    } catch (error) {
      logger.error('Failed to save path cache', { error: error.message });
      return false;
    }
  }

  /**
   * Load the cache from disk
   * @returns {Promise<boolean>} True if the cache was loaded successfully
   */
  async load() {
    try {
      // Check if the cache file exists
      await fs.access(this.cacheFile);
      
      // Read and parse the cache file
      const data = await fs.readFile(this.cacheFile, 'utf8');
      const serialized = JSON.parse(data);
      
      // Clear the current cache
      this.clear();
      
      // Populate the cache with the loaded data
      for (const [key, entry] of Object.entries(serialized)) {
        this.cache.set(key, entry);
      }
      
      logger.debug('Path cache loaded from disk');
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.debug('No path cache file found');
      } else {
        logger.error('Failed to load path cache', { error: error.message });
      }
      return false;
    }
  }
}

// Export a singleton instance
module.exports = new PathCache(); 