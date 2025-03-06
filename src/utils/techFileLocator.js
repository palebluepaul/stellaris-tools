const path = require('path');
const fs = require('fs').promises;
const logger = require('./logger');
const PathResolver = require('./pathResolver');
const pathCache = require('./pathCache');

/**
 * Class for locating technology files in the base game and mods
 */
class TechFileLocator {
  /**
   * Cache key for technology files
   * @type {string}
   */
  static TECH_FILES_CACHE_KEY = 'tech_files';

  /**
   * Common paths where technology files might be located
   * @type {string[]}
   */
  static COMMON_TECH_PATHS = [
    'common/technology',
    'common/scripted_variables', // For tech cost variables
  ];

  /**
   * File patterns for technology files
   * @type {RegExp}
   */
  static TECH_FILE_PATTERN = /\.(txt)$/i;

  /**
   * Find all technology files in the base game
   * @returns {Promise<string[]>} Array of file paths
   */
  static async findBaseGameTechFiles() {
    const gameDir = await PathResolver.getGameInstallDir();
    if (!gameDir) {
      logger.error('Could not locate Stellaris installation directory');
      return [];
    }

    logger.info(`Searching for technology files in base game at: ${gameDir}`);
    const techFiles = [];

    for (const techPath of this.COMMON_TECH_PATHS) {
      const fullPath = path.join(gameDir, techPath);
      
      try {
        // Check if the directory exists
        await fs.access(fullPath);
        
        // Find all matching files recursively
        const files = await PathResolver.findFiles(
          fullPath, 
          this.TECH_FILE_PATTERN, 
          true
        );
        
        techFiles.push(...files);
        logger.debug(`Found ${files.length} technology files in ${fullPath}`);
      } catch (error) {
        logger.debug(`Directory not found or not accessible: ${fullPath}`);
      }
    }

    logger.info(`Found ${techFiles.length} technology files in base game`);
    return techFiles;
  }

  /**
   * Find all technology files in enabled mods
   * @param {import('../models/mod').Mod[]} mods - Array of enabled mods
   * @returns {Promise<Object<string, string[]>>} Object mapping mod IDs to arrays of file paths
   */
  static async findModTechFiles(mods) {
    if (!mods || !Array.isArray(mods) || mods.length === 0) {
      logger.warn('No mods provided to search for technology files');
      return {};
    }

    logger.info(`Searching for technology files in ${mods.length} mods`);
    const modTechFiles = {};

    for (const mod of mods) {
      const modPath = mod.getEffectivePath();
      if (!modPath) {
        logger.warn(`Mod ${mod.name} (${mod.id}) has no valid path`);
        continue;
      }

      const techFiles = [];
      for (const techPath of this.COMMON_TECH_PATHS) {
        const fullPath = path.join(modPath, techPath);
        
        try {
          // Check if the directory exists
          await fs.access(fullPath);
          
          // Find all matching files recursively
          const files = await PathResolver.findFiles(
            fullPath, 
            this.TECH_FILE_PATTERN, 
            true
          );
          
          techFiles.push(...files);
          logger.debug(`Found ${files.length} technology files in mod ${mod.name} at ${fullPath}`);
        } catch (error) {
          logger.debug(`Directory not found or not accessible in mod ${mod.name}: ${fullPath}`);
        }
      }

      if (techFiles.length > 0) {
        modTechFiles[mod.id] = techFiles;
        logger.debug(`Found ${techFiles.length} technology files in mod ${mod.name}`);
      }
    }

    const totalFiles = Object.values(modTechFiles).reduce(
      (sum, files) => sum + files.length, 
      0
    );
    logger.info(`Found ${totalFiles} technology files across ${Object.keys(modTechFiles).length} mods`);
    
    return modTechFiles;
  }

  /**
   * Create a registry of all technology files with metadata
   * @param {string[]} baseGameFiles - Array of base game file paths
   * @param {Object<string, string[]>} modFiles - Object mapping mod IDs to arrays of file paths
   * @param {import('../models/mod').Mod[]} mods - Array of all mods
   * @returns {Object[]} Array of file registry entries
   */
  static createFileRegistry(baseGameFiles, modFiles, mods) {
    const registry = [];
    
    // Add base game files
    for (const filePath of baseGameFiles) {
      registry.push({
        path: filePath,
        source: 'base_game',
        sourceId: 'base_game',
        sourceName: 'Stellaris Base Game',
        relativePath: this._getRelativePath(filePath),
        loadOrder: 0
      });
    }
    
    // Add mod files
    const modMap = new Map(mods.map(mod => [mod.id, mod]));
    
    for (const [modId, filePaths] of Object.entries(modFiles)) {
      const mod = modMap.get(modId);
      if (!mod) continue;
      
      for (const filePath of filePaths) {
        registry.push({
          path: filePath,
          source: 'mod',
          sourceId: modId,
          sourceName: mod.displayName || mod.name,
          relativePath: this._getRelativePath(filePath),
          loadOrder: mod.position
        });
      }
    }
    
    // Sort by load order and relative path
    registry.sort((a, b) => {
      if (a.loadOrder !== b.loadOrder) {
        return a.loadOrder - b.loadOrder;
      }
      return a.relativePath.localeCompare(b.relativePath);
    });
    
    return registry;
  }

  /**
   * Get the relative path from a full path
   * @param {string} fullPath - Full file path
   * @returns {string} Relative path
   * @private
   */
  static _getRelativePath(fullPath) {
    // Extract the path after common/technology or common/scripted_variables
    for (const techPath of this.COMMON_TECH_PATHS) {
      const index = fullPath.indexOf(techPath);
      if (index !== -1) {
        return fullPath.substring(index);
      }
    }
    return fullPath;
  }

  /**
   * Find all technology files and create a registry
   * @param {import('../models/mod').Mod[]} mods - Array of enabled mods
   * @returns {Promise<Object[]>} Array of file registry entries
   */
  static async findAllTechFiles(mods) {
    // Check cache first
    const cachedFiles = pathCache.get(this.TECH_FILES_CACHE_KEY);
    if (cachedFiles) {
      logger.debug('Using cached technology files');
      return cachedFiles;
    }

    // Find all technology files
    const baseGameFiles = await this.findBaseGameTechFiles();
    const modFiles = await this.findModTechFiles(mods);
    
    // Create registry
    const registry = this.createFileRegistry(baseGameFiles, modFiles, mods);
    
    // Cache the results
    pathCache.set(this.TECH_FILES_CACHE_KEY, registry);
    
    return registry;
  }

  /**
   * Invalidate the technology files cache
   */
  static invalidateCache() {
    pathCache.invalidate(this.TECH_FILES_CACHE_KEY);
    logger.debug('Technology files cache invalidated');
  }
}

module.exports = TechFileLocator; 