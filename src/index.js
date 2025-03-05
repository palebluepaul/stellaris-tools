const logger = require('./utils/logger');
const config = require('./config');

/**
 * Main entry point for the Stellaris Tech Tree Viewer application
 */
function main() {
  logger.info('Starting Stellaris Tech Tree Viewer');
  
  // Log configuration for debugging
  logger.debug('Configuration loaded:', {
    platform: process.platform,
    documentsPath: config.documentsPath,
    stellarisUserDataPath: config.stellarisUserDataPath,
    launcherDbPath: config.launcherDbPath,
    saveGamesPath: config.saveGamesPath
  });
  
  logger.info('Application initialized successfully');
}

// Run the application if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { main }; 