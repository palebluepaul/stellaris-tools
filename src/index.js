/**
 * Stellaris Tech Tree Viewer
 * Main application entry point
 */

const logger = require('./utils/logger');
const gamePathDetector = require('./utils/gamePathDetector');
const db = require('./database/connection');
const modRepository = require('./database/modRepository');

/**
 * Initialize the application
 */
async function init() {
  try {
    logger.info('Initializing Stellaris Tech Tree Viewer');
    
    // Initialize the game path detector
    await gamePathDetector.initialize();
    
    // Detect game paths
    logger.info('Detecting game paths...');
    const userDataDir = await gamePathDetector.getUserDataDir();
    const launcherDbPath = await gamePathDetector.getLauncherDbPath();
    const saveGamesDir = await gamePathDetector.getSaveGamesDir();
    const gameDir = await gamePathDetector.getGameDir();
    const workshopModsDir = await gamePathDetector.getWorkshopModsDir();
    
    // Log detected paths
    logger.info('Path detection results:');
    logger.info(`- User Data Directory: ${userDataDir || 'Not found'}`);
    logger.info(`- Launcher Database: ${launcherDbPath || 'Not found'}`);
    logger.info(`- Save Games Directory: ${saveGamesDir || 'Not found'}`);
    logger.info(`- Game Installation: ${gameDir || 'Not found'}`);
    logger.info(`- Workshop Mods: ${workshopModsDir || 'Not found'}`);
    
    // Check if required paths were found
    if (!userDataDir || !launcherDbPath || !gameDir) {
      logger.warn('Some required paths were not found. The application may not function correctly.');
    }
    
    // Connect to the database
    logger.info('Connecting to launcher database...');
    const connected = await db.connect();
    if (!connected) {
      logger.error('Failed to connect to the launcher database');
      return;
    }
    
    // Get active playset information
    logger.info('Retrieving mod information...');
    const activePlayset = await modRepository.getActivePlayset();
    
    if (activePlayset) {
      logger.info(`Active playset: ${activePlayset.name}`);
      logger.info(`Total mods: ${activePlayset.getModCount()}`);
      logger.info(`Enabled mods: ${activePlayset.getEnabledModCount()}`);
      
      // Get enabled mods
      const enabledMods = activePlayset.getEnabledMods();
      logger.debug(`Found ${enabledMods.length} enabled mods`);
      
      // TODO: Process enabled mods to build tech tree
    } else {
      logger.warn('No active playset found');
    }
    
    logger.info('Initialization complete');
  } catch (error) {
    logger.error(`Initialization failed: ${error.message}`);
  } finally {
    // Disconnect from the database
    await db.disconnect();
  }
}

// Run the application
init().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});

module.exports = { init }; 