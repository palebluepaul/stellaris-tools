const logger = require('./utils/logger');
const gamePathDetector = require('./utils/gamePathDetector');

/**
 * Main entry point for the Stellaris Tech Tree Viewer application
 */
async function main() {
  logger.info('Starting Stellaris Tech Tree Viewer');
  
  try {
    // Initialize the game path detector
    await gamePathDetector.initialize();
    
    // Get and log path information
    const userDataDir = await gamePathDetector.getUserDataDir();
    const launcherDbPath = await gamePathDetector.getLauncherDbPath();
    const saveGamesDir = await gamePathDetector.getSaveGamesDir();
    const gameInstallDir = await gamePathDetector.getGameInstallDir();
    const workshopModsDir = await gamePathDetector.getWorkshopModsDir();
    
    logger.info('Stellaris paths detected:');
    logger.info(`- User Data Directory: ${userDataDir || 'Not found'}`);
    logger.info(`- Launcher Database: ${launcherDbPath || 'Not found'}`);
    logger.info(`- Save Games Directory: ${saveGamesDir || 'Not found'}`);
    logger.info(`- Game Installation Directory: ${gameInstallDir || 'Not found'}`);
    logger.info(`- Workshop Mods Directory: ${workshopModsDir || 'Not found'}`);
    
    // Check if all required paths were found
    if (!userDataDir || !launcherDbPath) {
      logger.warn('Some required paths were not found. Please ensure Stellaris is installed correctly.');
    } else {
      logger.info('All required paths were found successfully.');
    }
    
    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize application', { error: error.message });
  }
}

// Run the application if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Unhandled error', { error: error.message });
    process.exit(1);
  });
}

module.exports = { main }; 