#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const gamePathDetector = require('../utils/gamePathDetector');
const pathCache = require('../utils/pathCache');
const PathResolver = require('../utils/pathResolver');
const logger = require('../utils/logger');

/**
 * Test platform-aware cache behavior
 */
async function testCacheBehavior() {
  logger.info('Platform-Aware Cache Test');
  logger.info('========================');
  
  // Display current platform info
  const isWSL = PathResolver.isWSL();
  logger.info(`Current Platform: ${process.platform}`);
  logger.info(`Running in WSL: ${isWSL}`);
  
  // Initialize the path detector
  logger.info('\nInitializing path detector...');
  await gamePathDetector.initialize();
  
  // Get paths
  logger.info('\nResolving paths (first run)...');
  const userDataDir = await gamePathDetector.getUserDataDir();
  const launcherDbPath = await gamePathDetector.getLauncherDbPath();
  const saveGamesDir = await gamePathDetector.getSaveGamesDir();
  const gameInstallDir = await gamePathDetector.getGameInstallDir();
  const workshopModsDir = await gamePathDetector.getWorkshopModsDir();
  
  logger.info(`User Data Directory: ${userDataDir || 'Not found'}`);
  logger.info(`Launcher Database: ${launcherDbPath || 'Not found'}`);
  logger.info(`Save Games Directory: ${saveGamesDir || 'Not found'}`);
  logger.info(`Game Installation Directory: ${gameInstallDir || 'Not found'}`);
  logger.info(`Workshop Mods Directory: ${workshopModsDir || 'Not found'}`);
  
  // Get paths again (should use cache)
  logger.info('\nResolving paths (second run, should use cache)...');
  await gamePathDetector.getUserDataDir();
  await gamePathDetector.getLauncherDbPath();
  await gamePathDetector.getSaveGamesDir();
  await gamePathDetector.getGameInstallDir();
  await gamePathDetector.getWorkshopModsDir();
  
  // Simulate platform change by directly modifying the cache file
  logger.info('\nSimulating platform change...');
  
  // Create a mock platform info that's different from the current one
  const fakePlatformInfo = {
    platform: process.platform === 'win32' ? 'darwin' : 'win32',
    isWSL: !isWSL
  };
  
  // Read the cache file
  const cacheFilePath = path.join(process.cwd(), '.cache', 'path-cache.json');
  try {
    const cacheData = await fs.readFile(cacheFilePath, 'utf8');
    const cacheObj = JSON.parse(cacheData);
    
    // Modify the platform info
    cacheObj.platformInfo = fakePlatformInfo;
    
    // Write the modified cache back to disk
    await fs.writeFile(cacheFilePath, JSON.stringify(cacheObj, null, 2));
    logger.info(`Modified cache file with fake platform: ${fakePlatformInfo.platform}, WSL: ${fakePlatformInfo.isWSL}`);
  } catch (error) {
    logger.error(`Failed to modify cache file: ${error.message}`);
  }
  
  // Re-initialize (should detect platform change and invalidate cache)
  logger.info('\nRe-initializing path detector...');
  
  // Force re-initialization
  gamePathDetector.initialized = false;
  await gamePathDetector.initialize();
  
  // Get paths again (should NOT use cache)
  logger.info('\nResolving paths (third run, should NOT use cache)...');
  await gamePathDetector.getUserDataDir();
  await gamePathDetector.getLauncherDbPath();
  await gamePathDetector.getSaveGamesDir();
  await gamePathDetector.getGameInstallDir();
  await gamePathDetector.getWorkshopModsDir();
  
  logger.info('\n========================');
}

// Run the function if this file is executed directly
if (require.main === module) {
  testCacheBehavior().catch(error => {
    logger.error('Unhandled error', { error: error.message });
    process.exit(1);
  });
}

module.exports = { testCacheBehavior }; 