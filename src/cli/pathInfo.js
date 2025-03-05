#!/usr/bin/env node

const gamePathDetector = require('../utils/gamePathDetector');
const logger = require('../utils/logger');

/**
 * Display path information for Stellaris
 */
async function displayPathInfo() {
  logger.info('Stellaris Path Information');
  logger.info('=========================');
  
  try {
    // Get user data directory
    const userDataDir = await gamePathDetector.getUserDataDir();
    logger.info(`User Data Directory: ${userDataDir || 'Not found'}`);
    
    // Get launcher database path
    const launcherDbPath = await gamePathDetector.getLauncherDbPath();
    logger.info(`Launcher Database: ${launcherDbPath || 'Not found'}`);
    
    // Get save games directory
    const saveGamesDir = await gamePathDetector.getSaveGamesDir();
    logger.info(`Save Games Directory: ${saveGamesDir || 'Not found'}`);
    
    // Get game installation directory
    const gameInstallDir = await gamePathDetector.getGameInstallDir();
    logger.info(`Game Installation Directory: ${gameInstallDir || 'Not found'}`);
    
    // Get workshop mods directory
    const workshopModsDir = await gamePathDetector.getWorkshopModsDir();
    logger.info(`Workshop Mods Directory: ${workshopModsDir || 'Not found'}`);
    
    logger.info('=========================');
  } catch (error) {
    logger.error('Error displaying path information', { error: error.message });
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  displayPathInfo().catch(error => {
    logger.error('Unhandled error', { error: error.message });
    process.exit(1);
  });
}

module.exports = { displayPathInfo }; 