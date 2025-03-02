/**
 * Mod collector module
 * Collects mod data from the Stellaris launcher database
 */
const path = require('path');
const fs = require('fs-extra');
const logger = require('../../utils/logger');
const dbUtils = require('../../utils/db-utils');
const fileUtils = require('../../utils/file-utils');
const config = require('../../config/config');

/**
 * Get the active mod set from the launcher database
 * @returns {Promise<Object>} Object containing the active playset and its mods
 */
async function getActiveModSet() {
  let db = null;
  
  try {
    logger.info('Getting active mod set from launcher database');
    
    // Check if the launcher database exists
    if (!fileUtils.checkLauncherDatabase()) {
      throw new Error('Launcher database not found');
    }
    
    // Open the database
    db = await dbUtils.openDatabase();
    
    // Get the active playset
    const activePlayset = await dbUtils.getActivePlayset(db);
    if (!activePlayset) {
      throw new Error('No active playset found');
    }
    
    // Get mods for the active playset
    const mods = await dbUtils.getPlaysetMods(db, activePlayset.id);
    
    // Filter out mods with missing paths
    const validMods = mods.filter(mod => {
      // We'll check for valid paths later when resolving mod paths
      return mod.displayName != null;
    });
    
    logger.info(`Found ${validMods.length} mods in the active playset`);
    
    return {
      playset: activePlayset,
      mods: validMods
    };
  } catch (error) {
    logger.error(`Error getting active mod set: ${error.message}`, { error });
    throw error;
  } finally {
    // Close the database connection if it was opened
    if (db) {
      await dbUtils.closeDatabase(db);
    }
  }
}

/**
 * Resolve the actual path for a mod, checking both the dirPath and potential Steam Workshop paths
 * @param {Object} mod - Mod object from the database
 * @returns {Object} Object with resolved paths and validity information
 */
function resolveModPath(mod) {
  try {
    const result = {
      mod,
      paths: [],
      isValid: false
    };
    
    // Check if the mod has a direct path property (from active_mod_set.json)
    if (mod.path && fs.existsSync(mod.path)) {
      result.paths.push(mod.path);
      result.isValid = true;
      return result;
    }
    
    // Check the dirPath from the database
    if (mod.dirPath && fs.existsSync(mod.dirPath)) {
      result.paths.push(mod.dirPath);
      result.isValid = true;
    }
    
    // Check for Steam Workshop path
    // Steam Workshop mods are stored in: steamapps/workshop/content/281990/{mod_id}
    // 281990 is the Steam App ID for Stellaris
    if (mod.gameRegistryId) {
      // Extract potential Steam Workshop ID from gameRegistryId
      // Format is usually "steam:123456789"
      const match = mod.gameRegistryId.match(/steam:(\d+)/);
      if (match && match[1]) {
        const workshopId = match[1];
        
        // Check possible Steam Workshop paths
        const possibleWorkshopPaths = config.possibleStellarisInstallPaths.map(installPath => {
          // Go up from the game install path to the steamapps directory
          const steamappsPath = path.dirname(installPath);
          return path.join(steamappsPath, 'workshop', 'content', '281990', workshopId);
        });
        
        for (const workshopPath of possibleWorkshopPaths) {
          if (fs.existsSync(workshopPath)) {
            result.paths.push(workshopPath);
            result.isValid = true;
            break;
          }
        }
      }
    }
    
    // If we have a Steam Workshop ID directly
    if (mod.id && !isNaN(mod.id)) {
      const workshopId = mod.id;
      
      // Check possible Steam Workshop paths
      const possibleWorkshopPaths = config.possibleStellarisInstallPaths.map(installPath => {
        // Go up from the game install path to the steamapps directory
        const steamappsPath = path.dirname(installPath);
        return path.join(steamappsPath, 'workshop', 'content', '281990', workshopId);
      });
      
      for (const workshopPath of possibleWorkshopPaths) {
        if (fs.existsSync(workshopPath)) {
          // Only add if not already in the paths array
          if (!result.paths.includes(workshopPath)) {
            result.paths.push(workshopPath);
            result.isValid = true;
          }
          break;
        }
      }
    }
    
    // Try a direct path for Steam Workshop mods
    // This is a fallback for the example path provided: C:\Program Files (x86)\Steam\steamapps\workshop\content\281990\683230077
    if (mod.id) {
      const directWorkshopPath = path.join(config.steamWorkshopPath, mod.id.toString());
      if (fs.existsSync(directWorkshopPath)) {
        // Only add if not already in the paths array
        if (!result.paths.includes(directWorkshopPath)) {
          result.paths.push(directWorkshopPath);
          result.isValid = true;
        }
      }
    }
    
    if (!result.isValid) {
      logger.warn(`Could not resolve valid path for mod "${mod.displayName || mod.id}"`);
    } else {
      logger.debug(`Resolved paths for mod "${mod.displayName || mod.id}": ${result.paths.join(', ')}`);
    }
    
    return result;
  } catch (error) {
    logger.error(`Error resolving path for mod "${mod.displayName || mod.id}": ${error.message}`, { error });
    return { mod, paths: [], isValid: false };
  }
}

/**
 * Find technology files in mods
 * @param {Array} mods - Array of mod objects
 * @returns {Promise<Object>} Object mapping mod IDs to arrays of technology file paths
 */
async function findModTechFiles(mods) {
  try {
    logger.info('Finding technology files in mods');
    
    const modTechFiles = {};
    
    for (const mod of mods) {
      // Resolve the actual mod path(s)
      const resolvedMod = resolveModPath(mod);
      
      if (!resolvedMod.isValid) {
        logger.warn(`Skipping mod "${mod.displayName || mod.id}" due to invalid path`);
        continue;
      }
      
      let modFiles = [];
      
      // Check each resolved path for technology files
      for (const modPath of resolvedMod.paths) {
        const techPath = path.join(modPath, config.baseTechPath);
        
        if (fs.existsSync(techPath)) {
          const files = await fileUtils.listFiles(techPath, '.txt');
          
          if (files.length > 0) {
            logger.info(`Found ${files.length} technology files in mod "${mod.displayName || mod.id}" at ${techPath}`);
            modFiles = [...modFiles, ...files];
          } else {
            logger.debug(`No technology files found in mod "${mod.displayName || mod.id}" at ${techPath}`);
          }
        } else {
          logger.debug(`Technology directory not found in mod "${mod.displayName || mod.id}" at ${techPath}`);
        }
      }
      
      if (modFiles.length > 0) {
        // Use a fallback ID if mod.id is undefined
        const modId = mod.id || `mod_${mod.displayName ? mod.displayName.replace(/\s+/g, '_').toLowerCase() : Date.now()}`;
        modTechFiles[modId] = modFiles;
      }
    }
    
    const totalFiles = Object.values(modTechFiles).reduce((sum, files) => sum + files.length, 0);
    logger.info(`Found a total of ${totalFiles} technology files across ${Object.keys(modTechFiles).length} mods`);
    
    return modTechFiles;
  } catch (error) {
    logger.error(`Error finding mod technology files: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Find technology files in the base game
 * @returns {Promise<Array>} Array of technology file paths
 */
async function findBaseGameTechFiles() {
  try {
    logger.info('Finding technology files in base game');
    
    // Find the Stellaris installation path
    const stellarisPath = fileUtils.findStellarisInstallPath();
    if (!stellarisPath) {
      throw new Error('Stellaris installation not found');
    }
    
    // Find technology files
    const techPath = path.join(stellarisPath, config.baseTechPath);
    if (!fs.existsSync(techPath)) {
      throw new Error(`Base game technology directory not found at ${techPath}`);
    }
    
    const files = await fileUtils.listFiles(techPath, '.txt');
    
    logger.info(`Found ${files.length} technology files in base game`);
    return files;
  } catch (error) {
    logger.error(`Error finding base game technology files: ${error.message}`, { error });
    throw error;
  }
}

module.exports = {
  getActiveModSet,
  findModTechFiles,
  findBaseGameTechFiles,
  resolveModPath // Export for testing
}; 