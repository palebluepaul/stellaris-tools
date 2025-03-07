const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const TechParser = require('../parsers/techParser');
const TechDatabase = require('../models/techDatabase');
const modRepository = require('../database/modRepository');

/**
 * Service for managing technology data
 */
class TechService {
  /**
   * Creates a new TechService instance
   */
  constructor() {
    this.parser = new TechParser();
    this.database = new TechDatabase();
    this.modRepository = modRepository;
    this._initialized = false;
  }

  /**
   * Initializes the tech service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) {
      return;
    }

    logger.info('Initializing tech service');
    
    await this.parser.initialize();
    await this.database.initialize();
    // modRepository doesn't need initialization
    
    this._initialized = true;
    logger.info('Tech service initialized successfully');
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

      logger.info(`Loading technologies from file: ${filePath}`);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        logger.error(`File not found: ${filePath}`);
        return 0;
      }
      
      // Parse the file
      const technologies = await this.parser.parseFile(filePath, modId);
      
      // Add source information
      for (const tech of technologies) {
        tech.sourceFile = filePath;
        tech.sourceModName = modName;
      }
      
      // Add to database
      const addedCount = this.database.addTechnologies(technologies);
      
      logger.info(`Loaded ${addedCount} technologies from ${filePath}`);
      return addedCount;
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
      
      // Get active mods - use the correct method from modRepository
      const activeMods = await this.modRepository.getEnabledModsForActivePlayset();
      
      let totalLoaded = 0;
      
      // Process each mod
      for (const mod of activeMods) {
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
      
      return totalLoaded;
    } catch (error) {
      logger.error(`Error loading mod technologies: ${error.message}`);
      return 0;
    }
  }

  /**
   * Loads all technologies from the base game and active mods
   * @param {string} gamePath Path to the Stellaris installation
   * @returns {Promise<number>} Total number of technologies loaded
   */
  async loadAllTechnologies(gamePath) {
    try {
      if (!this._initialized) {
        await this.initialize();
      }

      logger.info('Loading all technologies');
      
      // Clear existing technologies
      this.database.clear();
      
      // Load base game technologies
      const baseGameLoaded = await this.loadBaseGameTechnologies(gamePath);
      
      // Load mod technologies
      const modLoaded = await this.loadModTechnologies(gamePath);
      
      const totalLoaded = baseGameLoaded + modLoaded;
      logger.info(`Loaded ${totalLoaded} technologies in total`);
      
      return totalLoaded;
    } catch (error) {
      logger.error(`Error loading all technologies: ${error.message}`);
      return 0;
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
   * Checks if a file is a technology file based on its name
   * @param {string} fileName Name of the file
   * @returns {boolean} True if the file is a technology file
   * @private
   */
  _isTechFile(fileName) {
    // Technology files typically have a .txt extension
    return fileName.endsWith('.txt');
  }
}

module.exports = TechService; 