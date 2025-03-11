const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const TechParser = require('../parsers/techParser');
const TechDatabase = require('../models/techDatabase');
const modRepository = require('../database/modRepository');
const localizationService = require('./localizationService');

/**
 * Simple in-memory cache for parsed technology files
 */
class TechFileCache {
  constructor() {
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Gets a cached file content if available and still valid
   * @param {string} filePath Path to the file
   * @param {object} stats File stats from fs.stat
   * @returns {object|null} Cached content or null if not cached or invalid
   */
  get(filePath, stats) {
    const cacheKey = filePath;
    const cached = this.cache.get(cacheKey);
    
    if (!cached) {
      this.misses++;
      return null;
    }
    
    // Check if file has been modified since it was cached
    if (cached.mtime.getTime() !== stats.mtime.getTime() || 
        cached.size !== stats.size) {
      this.misses++;
      return null;
    }
    
    this.hits++;
    return cached.data;
  }

  /**
   * Stores file content in the cache
   * @param {string} filePath Path to the file
   * @param {object} stats File stats from fs.stat
   * @param {object} data Data to cache
   */
  set(filePath, stats, data) {
    const cacheKey = filePath;
    this.cache.set(cacheKey, {
      mtime: stats.mtime,
      size: stats.size,
      data
    });
  }

  /**
   * Clears the cache
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Gets cache statistics
   * @returns {object} Cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0 
        ? (this.hits / (this.hits + this.misses) * 100).toFixed(2) + '%' 
        : '0%'
    };
  }
}

/**
 * Service for managing technology data
 */
class TechService {
  /**
   * Create a new TechService instance
   */
  constructor() {
    this.database = new TechDatabase();
    this.parser = new TechParser();
    this.fileCache = new TechFileCache();
    this.modRepository = modRepository;
    this._initialized = false;
    this.activeMods = null; // Store active mods for manual override
    this.lastLoadResult = null; // Store the last load result
  }

  /**
   * Initialize the service
   */
  async initialize() {
    if (this._initialized) {
      return;
    }
    
    logger.info('Initializing TechService');
    
    // Initialize localization service
    await localizationService.initialize();
    
    this._initialized = true;
    logger.info('TechService initialized');
  }

  /**
   * Loads technologies from a file
   * @param {string} filePath Path to the technology file
   * @param {string} [modId=''] ID of the mod that contains this file (if applicable)
   * @param {string} [modName=''] Name of the mod that contains this file (if applicable)
   * @returns {Promise<number>} Number of technologies loaded
   */
  async loadTechFile(filePath, modId = '', modName = '') {
    try {
      if (!this._initialized) {
        await this.initialize();
      }

      // Get file stats for caching
      const stats = await fs.stat(filePath);
      
      // Check if we have a valid cached version
      let technologies = this.fileCache.get(filePath, stats);
      
      if (!technologies) {
        // Not in cache, need to parse the file
        const content = await fs.readFile(filePath, 'utf8');
        technologies = await this.parser.parse(content);
        
        // Cache the parsed result
        this.fileCache.set(filePath, stats, technologies);
      }
      
      if (!technologies || technologies.length === 0) {
        return 0;
      }

      // Add source information to each technology
      technologies.forEach(tech => {
        tech.sourceFile = filePath;
        tech.sourceModId = modId;
        tech.sourceModName = modName;
      });

      // Add technologies to the database
      this.database.addTechnologies(technologies);

      return technologies.length;
    } catch (error) {
      logger.error(`Error loading tech file ${filePath}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Loads technologies from a directory
   * @param {string} dirPath Path to the directory containing technology files
   * @param {string} [modId=''] ID of the mod that contains this directory (if applicable)
   * @param {string} [modName=''] Name of the mod that contains this directory (if applicable)
   * @param {boolean} [recursive=true] Whether to search subdirectories recursively
   * @returns {Promise<number>} Number of technologies loaded
   */
  async loadTechDirectory(dirPath, modId = '', modName = '', recursive = true) {
    try {
      if (!this._initialized) {
        await this.initialize();
      }

      logger.info(`Loading technologies from directory: ${dirPath}`);
      
      // Check if directory exists
      try {
        await fs.access(dirPath);
      } catch (error) {
        logger.error(`Directory not found: ${dirPath}`);
        return 0;
      }
      
      // Get all files in the directory
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      let totalLoaded = 0;
      
      // Process each entry
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && recursive) {
          // Recursively process subdirectory
          const subDirLoaded = await this.loadTechDirectory(entryPath, modId, modName, recursive);
          totalLoaded += subDirLoaded;
        } else if (entry.isFile() && this._isTechFile(entry.name)) {
          // Process technology file
          const fileLoaded = await this.loadTechFile(entryPath, modId, modName);
          totalLoaded += fileLoaded;
        }
      }
      
      logger.info(`Loaded ${totalLoaded} technologies from directory ${dirPath}`);
      return totalLoaded;
    } catch (error) {
      logger.error(`Error loading tech directory ${dirPath}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Loads technologies from the base game
   * @param {string} gamePath Path to the Stellaris installation
   * @returns {Promise<number>} Number of technologies loaded
   */
  async loadBaseGameTechnologies(gamePath) {
    try {
      if (!this._initialized) {
        await this.initialize();
      }

      logger.info(`Loading base game technologies from: ${gamePath}`);
      
      // Common technology directory
      const commonTechPath = path.join(gamePath, 'common', 'technology');
      
      // Load technologies from the common technology directory
      const loadedCount = await this.loadTechDirectory(commonTechPath, '', 'Base Game');
      
      logger.info(`Loaded ${loadedCount} base game technologies`);
      
      // Build the technology tree
      this.database.buildTechTree();
      
      return loadedCount;
    } catch (error) {
      logger.error(`Error loading base game technologies: ${error.message}`);
      return 0;
    }
  }

  /**
   * Loads technologies from active mods
   * @param {string} gamePath Path to the Stellaris installation
   * @returns {Promise<number>} Number of technologies loaded
   */
  async loadModTechnologies(gamePath) {
    try {
      if (!this._initialized) {
        await this.initialize();
      }

      logger.info('Loading technologies from active mods');
      
      // Get enabled mods from the active playset
      let mods;
      
      // If activeMods is set, use it instead of querying the database
      if (this.activeMods) {
        logger.info(`Using ${this.activeMods.length} manually set active mods`);
        mods = this.activeMods;
      } else {
        logger.info('Fetching enabled mods from active playset...');
        mods = await this.modRepository.getEnabledModsForActivePlayset();
      }
      
      if (!mods || mods.length === 0) {
        logger.warn('No enabled mods found');
        return { count: 0, mods: [] };
      }
      
      logger.info(`Found ${mods.length} enabled mods`);
      
      let totalLoaded = 0;
      
      // Process each mod
      for (const mod of mods) {
        logger.info(`Processing mod: ${mod.name}`);
        
        // Skip mods without a directory path
        if (!mod.dirPath) {
          logger.warn(`Mod ${mod.name} has no directory path, skipping`);
          continue;
        }
        
        // Common technology directory in the mod
        const modTechPath = path.join(mod.dirPath, 'common', 'technology');
        
        try {
          // Check if the directory exists
          await fs.access(modTechPath);
          
          // Load technologies from the mod
          const modLoaded = await this.loadTechDirectory(modTechPath, mod.id, mod.name);
          totalLoaded += modLoaded;
          
          logger.info(`Loaded ${modLoaded} technologies from mod ${mod.name}`);
        } catch (error) {
          // Directory doesn't exist or can't be accessed, which is fine - not all mods have technologies
          logger.debug(`No technology directory found for mod ${mod.name}`);
        }
      }
      
      logger.info(`Loaded ${totalLoaded} technologies from all mods`);
      
      // Rebuild the technology tree
      this.database.buildTechTree();
      
      return { count: totalLoaded, mods };
    } catch (error) {
      logger.error(`Error loading mod technologies: ${error.message}`);
      return { count: 0, mods: [] };
    }
  }

  /**
   * Get the last load result
   * @returns {Object|null} The last load result or null if not available
   */
  getLastLoadResult() {
    return this.lastLoadResult;
  }

  /**
   * Load all technologies from the base game and mods
   * @param {string} gamePath Path to the game installation
   * @returns {Promise<Object>} Result of the loading operation
   */
  async loadAllTechnologies(gamePath) {
    try {
      // Make sure we're initialized
      if (!this._initialized) {
        await this.initialize();
      }
      
      logger.info('Loading all technologies...');
      
      // Clear the database
      this.database.clear();
      
      // Load base game technologies
      logger.info('Loading base game technologies...');
      const baseGameCount = await this.loadBaseGameTechnologies(gamePath);
      logger.info(`Loaded ${baseGameCount} technologies from base game`);
      
      // Get the count before adding mod technologies
      const beforeModCount = this.database.getAllTechnologies().length;
      
      // Load mod technologies
      logger.info('Loading mod technologies...');
      const { count: modLoadedCount, mods } = await this.loadModTechnologies(gamePath);
      logger.info(`Loaded ${modLoadedCount} technologies from mods`);
      
      // Get the count after adding mod technologies
      const afterModCount = this.database.getAllTechnologies().length;
      
      // Calculate the actual number of new technologies added by mods
      // This accounts for mods overriding base game technologies
      const modCount = afterModCount - beforeModCount;
      
      // Load localizations
      logger.info('Loading localizations...');
      // First load all localizations from game and mods
      await localizationService.loadLocalizations(gamePath);
      // Then apply them to technologies
      const localizedCount = await localizationService.localizeAllTechnologies(this.database);
      logger.info(`Localized ${localizedCount} technologies`);
      
      // Get cache statistics
      const cacheStats = this.fileCache.getStats();
      logger.info(`Cache performance: ${cacheStats.hitRate} hit rate (${cacheStats.hits} hits, ${cacheStats.misses} misses)`);
      
      // Build the tech tree
      logger.info('Building technology tree...');
      this.database.buildTechTree();
      logger.info('Technology tree built successfully');
      
      // Get the final count of technologies
      const totalCount = this.database.getAllTechnologies().length;
      
      // Log detailed counts
      logger.info('Technology count details:');
      logger.info(`- Base game technologies: ${baseGameCount}`);
      logger.info(`- Mod technologies loaded: ${modLoadedCount}`);
      logger.info(`- New technologies from mods: ${modCount}`);
      logger.info(`- Total unique technologies: ${totalCount}`);
      
      // Store the load result
      this.lastLoadResult = {
        totalCount,
        baseGameCount,
        modCount: modLoadedCount,
        newModCount: modCount,
        localizedCount,
        cacheStats,
        mods
      };
      
      // Return statistics
      return this.lastLoadResult;
    } catch (error) {
      logger.error(`Error loading all technologies: ${error.message}`);
      throw error;
    }
  }

  /**
   * Gets all technologies
   * @returns {Tech[]} Array of all technologies
   */
  getAllTechnologies() {
    return this.database.getAllTechnologies();
  }

  /**
   * Gets a technology by its ID
   * @param {string} id Technology ID
   * @returns {Tech|null} The technology or null if not found
   */
  getTechnology(id) {
    return this.database.getTechnology(id);
  }

  /**
   * Gets technologies by area
   * @param {string} areaId Area ID
   * @returns {Tech[]} Array of technologies in the specified area
   */
  getTechnologiesByArea(areaId) {
    return this.database.getTechnologiesByArea(areaId);
  }

  /**
   * Gets technologies by category
   * @param {string} categoryId Category ID
   * @returns {Tech[]} Array of technologies in the specified category
   */
  getTechnologiesByCategory(categoryId) {
    return this.database.getTechnologiesByCategory(categoryId);
  }

  /**
   * Gets technologies by tier
   * @param {number} tier Tier number
   * @returns {Tech[]} Array of technologies in the specified tier
   */
  getTechnologiesByTier(tier) {
    return this.database.getTechnologiesByTier(tier);
  }

  /**
   * Gets all areas
   * @returns {Object[]} Array of area objects with id and name properties
   */
  getAllAreas() {
    return this.database.getAllAreas();
  }

  /**
   * Gets all categories
   * @returns {Object[]} Array of category objects with id and name properties
   */
  getAllCategories() {
    return this.database.getAllCategories();
  }

  /**
   * Gets the prerequisites for a technology
   * @param {string} techId Technology ID
   * @returns {Tech[]} Array of prerequisite technologies
   */
  getPrerequisites(techId) {
    return this.database.getPrerequisites(techId);
  }

  /**
   * Gets technologies that have the specified technology as a prerequisite
   * @param {string} techId Technology ID
   * @returns {Tech[]} Array of technologies that require the specified technology
   */
  getDependentTechnologies(techId) {
    return this.database.getDependentTechnologies(techId);
  }

  /**
   * Gets all recursive prerequisites for a technology (prerequisites of prerequisites)
   * @param {string} techId Technology ID
   * @param {boolean} [includeOriginal=false] Whether to include the original technology in the result
   * @returns {Object} Object containing direct prerequisites, all prerequisites, and a dependency tree
   */
  getAllPrerequisites(techId, includeOriginal = false) {
    const tech = this.getTechnology(techId);
    if (!tech) {
      return {
        directPrerequisites: [],
        allPrerequisites: [],
        tree: {}
      };
    }

    // Get direct prerequisites
    const directPrerequisites = this.getPrerequisites(techId);
    
    // Build a set of all prerequisites (to avoid duplicates)
    const allPrerequisitesSet = new Set();
    
    // Build a dependency tree
    const tree = {};
    
    // Helper function to recursively get prerequisites
    const getPrereqsRecursive = (currentTechId, currentTree) => {
      const currentTech = this.getTechnology(currentTechId);
      if (!currentTech) return;
      
      // Add this tech to the tree
      currentTree[currentTechId] = {};
      
      // Get prerequisites for this tech
      const prereqs = this.getPrerequisites(currentTechId);
      
      // Process each prerequisite
      for (const prereq of prereqs) {
        // Add to the set of all prerequisites
        allPrerequisitesSet.add(prereq.id);
        
        // Recursively process this prerequisite
        getPrereqsRecursive(prereq.id, currentTree[currentTechId]);
      }
    };
    
    // Start the recursive process
    getPrereqsRecursive(techId, tree);
    
    // Convert the set to an array of Tech objects
    const allPrerequisites = Array.from(allPrerequisitesSet)
      .map(id => this.getTechnology(id))
      .filter(Boolean);
    
    // Sort prerequisites by tier and then by name
    const sortedPrerequisites = allPrerequisites.sort((a, b) => {
      if (a.tier !== b.tier) {
        return a.tier - b.tier;
      }
      return a.name.localeCompare(b.name);
    });
    
    // Include the original technology if requested
    if (includeOriginal) {
      return {
        technology: tech,
        directPrerequisites,
        allPrerequisites: sortedPrerequisites,
        tree
      };
    }
    
    return {
      directPrerequisites,
      allPrerequisites: sortedPrerequisites,
      tree
    };
  }

  /**
   * Checks if a file is a technology file based on its name
   * @param {string} fileName File name
   * @returns {boolean} True if the file is a technology file
   * @private
   */
  _isTechFile(fileName) {
    // Technology files typically have a .txt extension
    return fileName.endsWith('.txt');
  }

  /**
   * Gets the technology database
   * @returns {TechDatabase} The technology database
   */
  getTechDatabase() {
    return this.database;
  }

  /**
   * Set active mods manually (for read-only database scenarios)
   * @param {Array} mods Array of Mod objects to use as active mods
   */
  setActiveMods(mods) {
    if (!mods || !Array.isArray(mods)) {
      logger.warn('Invalid mods array provided to setActiveMods');
      return;
    }
    
    logger.info(`Manually setting ${mods.length} active mods`);
    this.activeMods = mods;
  }
}

module.exports = TechService; 