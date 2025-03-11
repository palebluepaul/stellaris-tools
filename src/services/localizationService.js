const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const PathResolver = require('../utils/pathResolver');

/**
 * Service for loading and applying localization data
 */
class LocalizationService {
  /**
   * Creates a new LocalizationService instance
   */
  constructor() {
    this.localizations = new Map();
    this._initialized = false;
    this.language = 'english'; // Default language
  }

  /**
   * Initializes the localization service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) {
      return;
    }

    logger.info('Initializing localization service...');
    this.localizations.clear();
    this._initialized = true;
    logger.info('Localization service initialized');
  }

  /**
   * Sets the language to use for localization
   * @param {string} language The language to use (e.g., 'english', 'french', etc.)
   */
  setLanguage(language) {
    this.language = language.toLowerCase();
    logger.info(`Localization language set to: ${this.language}`);
  }

  /**
   * Loads localization data from the game and mods
   * @param {string} gamePath Path to the Stellaris installation
   * @returns {Promise<number>} Number of localization entries loaded
   */
  async loadLocalizations(gamePath) {
    if (!this._initialized) {
      await this.initialize();
    }

    logger.info('Loading localizations...');
    
    // Clear existing localizations
    this.localizations.clear();
    
    // Load base game localizations
    const baseGameCount = await this.loadBaseGameLocalizations(gamePath);
    logger.info(`Loaded ${baseGameCount} localization entries from base game`);
    
    // Load mod localizations
    const modCount = await this.loadModLocalizations();
    logger.info(`Loaded ${modCount} localization entries from mods`);
    
    return baseGameCount + modCount;
  }

  /**
   * Loads localization data from the base game
   * @param {string} gamePath Path to the Stellaris installation
   * @returns {Promise<number>} Number of localization entries loaded
   */
  async loadBaseGameLocalizations(gamePath) {
    try {
      logger.info(`Loading base game localizations from: ${gamePath}`);
      
      // Path to localization files
      const localizationPath = path.join(gamePath, 'localisation', this.language);
      
      try {
        await fs.access(localizationPath);
      } catch (error) {
        logger.error(`Localization directory not found: ${localizationPath}`);
        return 0;
      }
      
      // Find all YML files in the localization directory
      const files = await this.findLocalizationFiles(localizationPath);
      
      let totalLoaded = 0;
      
      // Load each file
      for (const file of files) {
        const fileLoaded = await this.loadLocalizationFile(file);
        totalLoaded += fileLoaded;
      }
      
      logger.info(`Loaded ${totalLoaded} localization entries from ${files.length} files`);
      return totalLoaded;
    } catch (error) {
      logger.error(`Error loading base game localizations: ${error.message}`);
      return 0;
    }
  }

  /**
   * Finds all localization files in a directory
   * @param {string} dirPath Path to the directory
   * @returns {Promise<string[]>} Array of file paths
   */
  async findLocalizationFiles(dirPath) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files = [];
      
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          // Recursively search subdirectories
          const subDirFiles = await this.findLocalizationFiles(entryPath);
          files.push(...subDirFiles);
        } else if (entry.isFile() && this.isLocalizationFile(entry.name)) {
          files.push(entryPath);
        }
      }
      
      return files;
    } catch (error) {
      logger.error(`Error finding localization files: ${error.message}`);
      return [];
    }
  }

  /**
   * Checks if a file is a localization file
   * @param {string} fileName Name of the file
   * @returns {boolean} True if the file is a localization file
   */
  isLocalizationFile(fileName) {
    // Check for common localization file extensions
    return fileName.endsWith('.yml') || 
           fileName.endsWith('_l_english.yml') || 
           fileName.endsWith('_l_english.yaml');
  }

  /**
   * Loads localization data from a file
   * @param {string} filePath Path to the localization file
   * @returns {Promise<number>} Number of localization entries loaded
   */
  async loadLocalizationFile(filePath) {
    try {
      logger.debug(`Loading localization file: ${filePath}`);
      
      // Read the file content
      const content = await fs.readFile(filePath, 'utf8');
      
      // Parse the content
      const entries = this.parseLocalizationFile(content);
      
      // Add entries to the map
      for (const [key, value] of Object.entries(entries)) {
        this.localizations.set(key, value);
      }
      
      logger.debug(`Loaded ${Object.keys(entries).length} entries from ${filePath}`);
      return Object.keys(entries).length;
    } catch (error) {
      logger.error(`Error loading localization file ${filePath}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Parses a localization file
   * @param {string} content Content of the localization file
   * @returns {Object} Object with localization keys and values
   */
  parseLocalizationFile(content) {
    const entries = {};
    
    // Remove BOM if present
    let cleanContent = content;
    if (cleanContent.charCodeAt(0) === 0xFEFF) {
      cleanContent = cleanContent.slice(1);
    }
    
    // Split by lines
    const lines = cleanContent.split('\n');
    
    // Skip the first line (language declaration) if it exists
    let startLine = 0;
    if (lines.length > 0 && lines[0].trim().match(/^l_[a-z]+:/)) {
      startLine = 1;
    }
    
    let inComment = false;
    
    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Skip comments
      if (line.startsWith('#')) continue;
      
      // Handle multi-line comments
      if (line.includes('###')) {
        if (inComment) {
          inComment = false;
        } else {
          inComment = true;
        }
        continue;
      }
      
      if (inComment) continue;
      
      // Parse the line - try different formats
      // Standard format: KEY:0 "Value"
      let match = line.match(/^\s*([^:]+):(\d+)\s*"(.*)"\s*$/);
      if (match) {
        const key = match[1].trim();
        const index = parseInt(match[2], 10);
        const value = match[3].trim();
        
        // Store the entry
        entries[key] = value;
        continue;
      }
      
      // Alternative format: KEY: "Value"
      match = line.match(/^\s*([^:]+):\s*"(.*)"\s*$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        
        // Store the entry
        entries[key] = value;
        continue;
      }
    }
    
    return entries;
  }

  /**
   * Gets a localized string
   * @param {string} key The localization key
   * @param {string} defaultValue Default value if the key is not found
   * @returns {string} The localized string
   */
  getLocalization(key, defaultValue = key) {
    return this.localizations.get(key) || defaultValue;
  }

  /**
   * Applies localization to a technology
   * @param {import('../models/tech')} tech The technology to localize
   * @returns {import('../models/tech')} The localized technology
   */
  localizeTechnology(tech) {
    if (!tech) return tech;
    
    // Localize name
    const nameKey = tech.id;
    tech.displayName = this.getLocalization(nameKey, tech.name);
    
    // Localize description
    const descKey = `${tech.id}_desc`;
    tech.description = this.getLocalization(descKey, '');
    
    // Localize area name
    if (tech.areaId) {
      tech.areaName = this.getLocalization(tech.areaId, tech.areaName);
    }
    
    // Localize category name
    if (tech.categoryId) {
      tech.categoryName = this.getLocalization(tech.categoryId, tech.categoryName);
    }
    
    return tech;
  }

  /**
   * Applies localization to all technologies in the database
   * @param {import('../models/techDatabase')} techDatabase The technology database
   * @returns {Promise<number>} Number of technologies localized
   */
  localizeAllTechnologies(techDatabase) {
    if (!this._initialized) {
      logger.warn('Localization service not initialized');
      return 0;
    }
    
    logger.info('Applying localization to all technologies...');
    
    const technologies = techDatabase.getAllTechnologies();
    let count = 0;
    
    for (const tech of technologies) {
      this.localizeTechnology(tech);
      count++;
    }
    
    logger.info(`Applied localization to ${count} technologies`);
    return count;
  }

  /**
   * Loads localization data from mods
   * @returns {Promise<number>} Number of localization entries loaded
   */
  async loadModLocalizations() {
    try {
      const modRepository = require('../database/modRepository');
      logger.info('Loading localizations from active mods');
      
      // Get active mods
      const activeMods = await modRepository.getEnabledModsForActivePlayset();
      logger.debug(`Found ${activeMods.length} active mods for localization`);
      
      let totalLoaded = 0;
      
      // Process each mod
      for (const mod of activeMods) {
        logger.info(`Processing localizations from mod: ${mod.name} (${mod.id})`);
        
        // Skip mods without a directory path
        if (!mod.dirPath) {
          logger.warn(`Mod ${mod.name} has no directory path, skipping`);
          continue;
        }
        
        logger.debug(`Mod directory path: ${mod.dirPath}`);
        
        // Try multiple possible localization paths
        const possiblePaths = [
          // Standard path with language subdirectory
          path.join(mod.dirPath, 'localisation', this.language),
          // Try with capitalized language name
          path.join(mod.dirPath, 'localisation', this.language.charAt(0).toUpperCase() + this.language.slice(1)),
          // Try without language subdirectory
          path.join(mod.dirPath, 'localisation'),
          // Try with 'localization' spelling (American English)
          path.join(mod.dirPath, 'localization', this.language),
          // Try with capitalized language name (American English)
          path.join(mod.dirPath, 'localization', this.language.charAt(0).toUpperCase() + this.language.slice(1)),
          // Try without language subdirectory (American English)
          path.join(mod.dirPath, 'localization')
        ];
        
        logger.debug(`Trying ${possiblePaths.length} possible localization paths for mod ${mod.name}`);
        
        let modLoaded = 0;
        let foundValidPath = false;
        
        // Try each possible path
        for (const locPath of possiblePaths) {
          try {
            // Check if the directory exists
            await fs.access(locPath);
            logger.debug(`Found localization directory: ${locPath}`);
            
            // Find all localization files in the mod
            const files = await this.findLocalizationFiles(locPath);
            
            if (files.length > 0) {
              logger.info(`Found ${files.length} localization files in ${locPath}`);
              
              // Log the files we found
              for (const file of files) {
                logger.debug(`Processing localization file: ${file}`);
                const fileLoaded = await this.loadLocalizationFile(file);
                modLoaded += fileLoaded;
                logger.debug(`Loaded ${fileLoaded} entries from ${file}`);
              }
              
              foundValidPath = true;
              break; // Found and processed files, no need to check other paths
            } else {
              logger.debug(`No localization files found in directory: ${locPath}`);
            }
          } catch (error) {
            // If the directory doesn't exist, just try the next one
            logger.debug(`No localization directory found at ${locPath}: ${error.message}`);
          }
        }
        
        if (foundValidPath) {
          logger.info(`Loaded ${modLoaded} localization entries from mod ${mod.name}`);
        } else {
          logger.warn(`No localization files found for mod ${mod.name}`);
        }
        
        totalLoaded += modLoaded;
      }
      
      logger.info(`Total localization entries loaded from all mods: ${totalLoaded}`);
      return totalLoaded;
    } catch (error) {
      logger.error(`Error loading mod localizations: ${error.message}`);
      return 0;
    }
  }
}

module.exports = new LocalizationService(); 