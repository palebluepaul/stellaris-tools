/**
 * File utility functions for the application
 * Handles file system operations, path resolution, and file discovery
 */
const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');
const logger = require('./logger');
const config = require('../config/config');

/**
 * Find the Stellaris installation path from the list of possible paths
 * @returns {string|null} The path to the Stellaris installation or null if not found
 */
function findStellarisInstallPath() {
  logger.debug('Searching for Stellaris installation path');
  
  for (const testPath of config.possibleStellarisInstallPaths) {
    logger.debug(`Checking path: ${testPath}`);
    if (fs.existsSync(testPath)) {
      logger.info(`Found Stellaris installation at: ${testPath}`);
      return testPath;
    }
  }
  
  logger.error('Could not find Stellaris installation path');
  return null;
}

/**
 * List files in a directory recursively, optionally filtering by extension
 * @param {string} directory - The directory to search
 * @param {string|RegExp} [filter=null] - Optional filter (extension or regex)
 * @returns {Promise<string[]>} Array of file paths
 */
async function listFiles(directory, filter = null) {
  try {
    logger.debug(`Listing files in directory: ${directory}`);
    
    if (!fs.existsSync(directory)) {
      logger.warn(`Directory does not exist: ${directory}`);
      return [];
    }
    
    // Use a different approach for Windows paths
    const normDirectory = directory.replace(/\\/g, '/');
    let pattern = `${normDirectory}/**`;
    
    // Apply filter if provided
    if (filter) {
      if (typeof filter === 'string') {
        // If filter is a string, treat it as a file extension
        pattern = `${normDirectory}/**/*${filter}`;
      }
    }
    
    logger.debug(`Using glob pattern: ${pattern}`);
    const files = await glob(pattern, { nodir: true, windowsPathsNoEscape: true });
    
    // Apply RegExp filter if needed
    const filteredFiles = filter instanceof RegExp
      ? files.filter(file => filter.test(file))
      : files;
    
    logger.debug(`Found ${filteredFiles.length} files in ${directory}`);
    
    // Convert back to Windows paths if needed
    const resultFiles = filteredFiles.map(file => file.replace(/\//g, path.sep));
    
    return resultFiles;
  } catch (error) {
    logger.error(`Error listing files in ${directory}: ${error.message}`, { error });
    
    // Fallback to a simpler approach if glob fails
    try {
      logger.debug(`Falling back to recursive file listing for ${directory}`);
      return listFilesRecursive(directory, filter);
    } catch (fallbackError) {
      logger.error(`Fallback file listing also failed: ${fallbackError.message}`, { error: fallbackError });
      return [];
    }
  }
}

/**
 * Recursively list files in a directory (fallback method)
 * @param {string} directory - The directory to search
 * @param {string|RegExp} [filter=null] - Optional filter (extension or regex)
 * @returns {string[]} Array of file paths
 */
function listFilesRecursive(directory, filter = null) {
  const files = [];
  
  function traverse(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile()) {
        let include = true;
        
        if (filter) {
          if (typeof filter === 'string') {
            include = entry.name.endsWith(filter);
          } else if (filter instanceof RegExp) {
            include = filter.test(entry.name);
          }
        }
        
        if (include) {
          files.push(fullPath);
        }
      }
    }
  }
  
  traverse(directory);
  logger.debug(`Found ${files.length} files in ${directory} using recursive method`);
  return files;
}

/**
 * Check if the Stellaris user data directory exists
 * @returns {boolean} True if the directory exists
 */
function checkUserDataDirectory() {
  const exists = fs.existsSync(config.stellarisUserDataPath);
  if (exists) {
    logger.info(`Found Stellaris user data directory at: ${config.stellarisUserDataPath}`);
  } else {
    logger.error(`Stellaris user data directory not found at: ${config.stellarisUserDataPath}`);
  }
  return exists;
}

/**
 * Check if the launcher database exists
 * @returns {boolean} True if the database exists
 */
function checkLauncherDatabase() {
  const exists = fs.existsSync(config.launcherDbPath);
  if (exists) {
    logger.info(`Found launcher database at: ${config.launcherDbPath}`);
  } else {
    logger.error(`Launcher database not found at: ${config.launcherDbPath}`);
  }
  return exists;
}

module.exports = {
  findStellarisInstallPath,
  listFiles,
  checkUserDataDirectory,
  checkLauncherDatabase
}; 