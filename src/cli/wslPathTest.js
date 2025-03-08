#!/usr/bin/env node

const PathResolver = require('../utils/pathResolver');
const logger = require('../utils/logger');

/**
 * Test WSL path detection and conversion
 */
async function testWSLPaths() {
  logger.info('WSL Path Detection Test');
  logger.info('======================');
  
  // Check if running in WSL
  const isWSL = PathResolver.isWSL();
  logger.info(`Running in WSL: ${isWSL}`);
  
  if (isWSL) {
    // Get Windows username
    const windowsUsername = PathResolver.getWindowsUsername();
    logger.info(`Windows Username: ${windowsUsername || 'Not found'}`);
    
    // Test path conversion
    const windowsPath = 'C:\\Users\\' + windowsUsername + '\\Documents';
    const wslPath = PathResolver.convertToWSLPath(windowsPath);
    logger.info(`Windows Path: ${windowsPath}`);
    logger.info(`WSL Path: ${wslPath}`);
  }
  
  // Display path information
  logger.info('\nPath Information:');
  logger.info(`Home Directory: ${PathResolver.getHomeDir()}`);
  logger.info(`Documents Directory: ${PathResolver.getDocumentsDir()}`);
  logger.info(`Stellaris User Data: ${PathResolver.getStellarisUserDataDir()}`);
  logger.info(`Launcher Database: ${PathResolver.getLauncherDbPath()}`);
  logger.info(`Save Games Directory: ${PathResolver.getSaveGamesDir()}`);
  
  // Test game installation directory detection
  const gameDir = await PathResolver.getGameInstallDir();
  logger.info(`Game Installation: ${gameDir || 'Not found'}`);
  
  // Test workshop mods directory detection
  const workshopDir = await PathResolver.getWorkshopModsDir();
  logger.info(`Workshop Mods: ${workshopDir || 'Not found'}`);
  
  logger.info('======================');
}

// Run the test
testWSLPaths().catch(error => {
  logger.error('Error running WSL path test', { error: error.message });
}); 