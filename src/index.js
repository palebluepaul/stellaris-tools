/**
 * Stellaris Tech Tree Viewer
 * Main application entry point
 */

const logger = require('./utils/logger');
const gamePathDetector = require('./utils/gamePathDetector');
const db = require('./database/connection');
const modRepository = require('./database/modRepository');
const TechService = require('./services/techService');
const TechTreeService = require('./services/techTreeService');

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
    const gameDir = await gamePathDetector.getGameInstallDir();
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
      
      // Initialize tech service
      logger.info('Initializing technology service...');
      const techService = new TechService();
      await techService.initialize();
      
      // Load all technologies
      logger.info('Loading technologies from game and mods...');
      const startTime = Date.now();
      const loadResult = await techService.loadAllTechnologies(gameDir);
      const endTime = Date.now();
      
      logger.info(`Loaded ${loadResult.totalCount} technologies in ${(endTime - startTime) / 1000} seconds`);
      logger.info(`- Base game: ${loadResult.baseGameCount} technologies`);
      logger.info(`- Mods: ${loadResult.modCount} technologies`);
      logger.info(`- Cache performance: ${loadResult.cacheStats.hitRate} hit rate`);
      
      // Display some statistics
      const allTechs = techService.getAllTechnologies();
      const areas = techService.getAllAreas();
      const categories = techService.getAllCategories();
      
      logger.info('Technology Statistics:');
      logger.info(`- Total technologies: ${allTechs.length}`);
      logger.info(`- Areas: ${areas.length} (${areas.map(a => a.name).join(', ')})`);
      logger.info(`- Categories: ${categories.length}`);
      
      // Initialize tech tree service
      logger.info('Initializing technology tree service...');
      const techTreeService = new TechTreeService(techService);
      await techTreeService.initialize();
      
      // Display tech tree statistics
      logger.info('Technology Tree Statistics:');
      logger.info(`- Root technologies: ${techTreeService.getRootTechnologies().length}`);
      logger.info(`- Maximum depth: ${techTreeService.getMaxDepth()}`);
      logger.info(`- Maximum width: ${techTreeService.getMaxWidth()}`);
      
      // TODO: In Phase 3, add save game parsing here
      
      // TODO: In Phase 4, add visualization here
      
      logger.info('Application initialized successfully');
      
      // Return the services for use by other components
      return {
        techService,
        techTreeService,
        activePlayset,
        paths: {
          userDataDir,
          launcherDbPath,
          saveGamesDir,
          gameDir,
          workshopModsDir
        }
      };
    } else {
      logger.warn('No active playset found');
    }
    
    logger.info('Initialization complete');
  } catch (error) {
    logger.error(`Initialization failed: ${error.message}`);
    logger.error(error.stack);
  } finally {
    // Don't disconnect from the database here, as we may need it later
    // We'll handle disconnection when the application shuts down
  }
}

/**
 * Shutdown the application
 */
async function shutdown() {
  logger.info('Shutting down application...');
  
  // Disconnect from the database
  await db.disconnect();
  
  logger.info('Application shutdown complete');
}

// If this file is run directly, initialize the application
if (require.main === module) {
  // Set up process event handlers for graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('Received SIGINT signal');
    await shutdown();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    logger.info('Received SIGTERM signal');
    await shutdown();
    process.exit(0);
  });
  
  process.on('uncaughtException', async (error) => {
    logger.error(`Uncaught exception: ${error.message}`);
    logger.error(error.stack);
    await shutdown();
    process.exit(1);
  });
  
  // Run the application
  init().catch(async (error) => {
    logger.error(`Unhandled error: ${error.message}`);
    logger.error(error.stack);
    await shutdown();
    process.exit(1);
  });
}

module.exports = { init, shutdown }; 