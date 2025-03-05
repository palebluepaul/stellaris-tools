const PathResolver = require('./pathResolver');
const pathCache = require('./pathCache');
const logger = require('./logger');

// Cache TTL values (in milliseconds)
const CACHE_TTL = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 60, // 1 hour
  LONG: 1000 * 60 * 60 * 24, // 1 day
};

// Cache keys
const CACHE_KEYS = {
  GAME_INSTALL_DIR: 'gameInstallDir',
  WORKSHOP_MODS_DIR: 'workshopModsDir',
  USER_DATA_DIR: 'userDataDir',
  LAUNCHER_DB: 'launcherDb',
  SAVE_GAMES_DIR: 'saveGamesDir',
};

/**
 * Utility for detecting and caching game paths
 */
class GamePathDetector {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize the path detector
   * @returns {Promise<boolean>} True if initialization was successful
   */
  async initialize() {
    if (this.initialized) {
      return true;
    }

    try {
      // Load the path cache
      await pathCache.load();
      this.initialized = true;
      return true;
    } catch (error) {
      logger.error('Failed to initialize game path detector', { error: error.message });
      return false;
    }
  }

  /**
   * Get the Stellaris game installation directory
   * @param {boolean} forceRefresh - Whether to force a refresh of the cached path
   * @returns {Promise<string|null>} Path to the Stellaris installation directory or null if not found
   */
  async getGameInstallDir(forceRefresh = false) {
    await this.initialize();

    // Check the cache first
    if (!forceRefresh) {
      const cachedPath = pathCache.get(CACHE_KEYS.GAME_INSTALL_DIR);
      if (cachedPath) {
        logger.debug(`Using cached game installation directory: ${cachedPath}`);
        return cachedPath;
      }
    }

    // Resolve the path
    const installDir = await PathResolver.getGameInstallDir();
    
    if (installDir) {
      // Cache the result
      pathCache.set(CACHE_KEYS.GAME_INSTALL_DIR, installDir, CACHE_TTL.LONG);
      await pathCache.save();
    }
    
    return installDir;
  }

  /**
   * Get the Stellaris workshop mods directory
   * @param {boolean} forceRefresh - Whether to force a refresh of the cached path
   * @returns {Promise<string|null>} Path to the workshop mods directory or null if not found
   */
  async getWorkshopModsDir(forceRefresh = false) {
    await this.initialize();

    // Check the cache first
    if (!forceRefresh) {
      const cachedPath = pathCache.get(CACHE_KEYS.WORKSHOP_MODS_DIR);
      if (cachedPath) {
        logger.debug(`Using cached workshop mods directory: ${cachedPath}`);
        return cachedPath;
      }
    }

    // Resolve the path
    const workshopDir = await PathResolver.getWorkshopModsDir();
    
    if (workshopDir) {
      // Cache the result
      pathCache.set(CACHE_KEYS.WORKSHOP_MODS_DIR, workshopDir, CACHE_TTL.LONG);
      await pathCache.save();
    }
    
    return workshopDir;
  }

  /**
   * Get the Stellaris user data directory
   * @param {boolean} forceRefresh - Whether to force a refresh of the cached path
   * @returns {Promise<string|null>} Path to the user data directory or null if not found
   */
  async getUserDataDir(forceRefresh = false) {
    await this.initialize();

    // Check the cache first
    if (!forceRefresh) {
      const cachedPath = pathCache.get(CACHE_KEYS.USER_DATA_DIR);
      if (cachedPath) {
        logger.debug(`Using cached user data directory: ${cachedPath}`);
        return cachedPath;
      }
    }

    // Resolve the path
    const userDataDir = PathResolver.getStellarisUserDataDir();
    
    // Validate the path
    const isValid = await PathResolver.validatePath(userDataDir);
    
    if (isValid) {
      // Cache the result
      pathCache.set(CACHE_KEYS.USER_DATA_DIR, userDataDir, CACHE_TTL.LONG);
      await pathCache.save();
      return userDataDir;
    }
    
    logger.warn(`User data directory not found: ${userDataDir}`);
    return null;
  }

  /**
   * Get the Stellaris launcher database path
   * @param {boolean} forceRefresh - Whether to force a refresh of the cached path
   * @returns {Promise<string|null>} Path to the launcher database or null if not found
   */
  async getLauncherDbPath(forceRefresh = false) {
    await this.initialize();

    // Check the cache first
    if (!forceRefresh) {
      const cachedPath = pathCache.get(CACHE_KEYS.LAUNCHER_DB);
      if (cachedPath) {
        logger.debug(`Using cached launcher database path: ${cachedPath}`);
        return cachedPath;
      }
    }

    // Resolve the path
    const launcherDbPath = PathResolver.getLauncherDbPath();
    
    // Validate the path
    const isValid = await PathResolver.validatePath(launcherDbPath);
    
    if (isValid) {
      // Cache the result
      pathCache.set(CACHE_KEYS.LAUNCHER_DB, launcherDbPath, CACHE_TTL.MEDIUM);
      await pathCache.save();
      return launcherDbPath;
    }
    
    logger.warn(`Launcher database not found: ${launcherDbPath}`);
    return null;
  }

  /**
   * Get the Stellaris save games directory
   * @param {boolean} forceRefresh - Whether to force a refresh of the cached path
   * @returns {Promise<string|null>} Path to the save games directory or null if not found
   */
  async getSaveGamesDir(forceRefresh = false) {
    await this.initialize();

    // Check the cache first
    if (!forceRefresh) {
      const cachedPath = pathCache.get(CACHE_KEYS.SAVE_GAMES_DIR);
      if (cachedPath) {
        logger.debug(`Using cached save games directory: ${cachedPath}`);
        return cachedPath;
      }
    }

    // Resolve the path
    const saveGamesDir = PathResolver.getSaveGamesDir();
    
    // Validate the path
    const isValid = await PathResolver.validatePath(saveGamesDir);
    
    if (isValid) {
      // Cache the result
      pathCache.set(CACHE_KEYS.SAVE_GAMES_DIR, saveGamesDir, CACHE_TTL.MEDIUM);
      await pathCache.save();
      return saveGamesDir;
    }
    
    logger.warn(`Save games directory not found: ${saveGamesDir}`);
    return null;
  }

  /**
   * Invalidate all cached paths
   * @returns {Promise<void>}
   */
  async invalidateCache() {
    pathCache.clear();
    await pathCache.save();
    logger.debug('Path cache invalidated');
  }
}

// Export a singleton instance
module.exports = new GamePathDetector(); 