/**
 * Test script for data collection functionality
 * This script tests the individual components of the data collection phase
 */
const path = require('path');
const fs = require('fs-extra');
const logger = require('./utils/logger');
const fileUtils = require('./utils/file-utils');
const dbUtils = require('./utils/db-utils');
const modCollector = require('./modules/data-collection/mod-collector');
const techParser = require('./modules/data-collection/tech-parser');

/**
 * Test the file utilities
 */
async function testFileUtils() {
  logger.info('Testing file utilities');
  
  // Test finding Stellaris installation
  const stellarisPath = fileUtils.findStellarisInstallPath();
  logger.info(`Stellaris installation path: ${stellarisPath || 'Not found'}`);
  
  // Test checking user data directory
  const userDataExists = fileUtils.checkUserDataDirectory();
  logger.info(`User data directory exists: ${userDataExists}`);
  
  // Test checking launcher database
  const launcherDbExists = fileUtils.checkLauncherDatabase();
  logger.info(`Launcher database exists: ${launcherDbExists}`);
  
  // Test listing files
  if (stellarisPath) {
    const techPath = path.join(stellarisPath, 'common', 'technology');
    if (fs.existsSync(techPath)) {
      const files = await fileUtils.listFiles(techPath, '.txt');
      logger.info(`Found ${files.length} technology files in base game`);
      
      if (files.length > 0) {
        logger.info(`Sample file: ${files[0]}`);
      }
    }
  }
}

/**
 * Test the database utilities
 */
async function testDbUtils() {
  logger.info('Testing database utilities');
  
  if (!fileUtils.checkLauncherDatabase()) {
    logger.error('Launcher database not found, skipping database tests');
    return;
  }
  
  let db = null;
  
  try {
    // Test opening database
    db = await dbUtils.openDatabase();
    logger.info('Database opened successfully');
    
    // Test getting active playset
    const activePlayset = await dbUtils.getActivePlayset(db);
    if (activePlayset) {
      logger.info(`Active playset: ${activePlayset.name} (${activePlayset.id})`);
      
      // Test getting playset mods
      const mods = await dbUtils.getPlaysetMods(db, activePlayset.id);
      logger.info(`Found ${mods.length} mods in active playset`);
      
      if (mods.length > 0) {
        logger.info(`Sample mod: ${mods[0].displayName} (${mods[0].id})`);
      }
    } else {
      logger.warn('No active playset found');
    }
  } catch (error) {
    logger.error(`Error in database tests: ${error.message}`, { error });
  } finally {
    // Test closing database
    if (db) {
      await dbUtils.closeDatabase(db);
      logger.info('Database closed successfully');
    }
  }
}

/**
 * Test the mod collector
 */
async function testModCollector() {
  logger.info('Testing mod collector');
  
  // Test finding base game tech files
  try {
    const baseGameTechFiles = await modCollector.findBaseGameTechFiles();
    logger.info(`Found ${baseGameTechFiles.length} base game technology files`);
    
    if (baseGameTechFiles.length > 0) {
      logger.info(`Sample file: ${baseGameTechFiles[0]}`);
    }
  } catch (error) {
    logger.error(`Error finding base game tech files: ${error.message}`, { error });
  }
  
  // Test getting active mod set
  try {
    const activeModSet = await modCollector.getActiveModSet();
    logger.info(`Active playset: ${activeModSet.playset.name} with ${activeModSet.mods.length} mods`);
    
    if (activeModSet.mods.length > 0) {
      // Test finding mod tech files
      const modTechFiles = await modCollector.findModTechFiles(activeModSet.mods);
      const modCount = Object.keys(modTechFiles).length;
      
      logger.info(`Found technology files in ${modCount} mods`);
      
      const totalFiles = Object.values(modTechFiles).reduce((sum, files) => sum + files.length, 0);
      logger.info(`Total mod technology files: ${totalFiles}`);
    }
  } catch (error) {
    logger.error(`Error getting active mod set: ${error.message}`, { error });
  }
}

/**
 * Test the technology parser
 */
async function testTechParser() {
  logger.info('Testing technology parser');
  
  try {
    // Get a sample technology file
    const baseGameTechFiles = await modCollector.findBaseGameTechFiles();
    
    if (baseGameTechFiles.length > 0) {
      const sampleFile = baseGameTechFiles[0];
      logger.info(`Parsing sample file: ${sampleFile}`);
      
      // Test parsing a single file
      const technologies = await techParser.parseTechFile(sampleFile);
      const techCount = Object.keys(technologies).length;
      
      logger.info(`Parsed ${techCount} technologies from sample file`);
      
      if (techCount > 0) {
        const sampleTech = Object.values(technologies)[0];
        logger.info(`Sample technology: ${sampleTech.id}`);
        logger.info(`Properties: ${JSON.stringify(sampleTech.properties, null, 2)}`);
        
        if (sampleTech.prerequisites) {
          logger.info(`Prerequisites: ${sampleTech.prerequisites.join(', ')}`);
        }
      }
    } else {
      logger.warn('No base game technology files found, skipping parser test');
    }
  } catch (error) {
    logger.error(`Error in parser tests: ${error.message}`, { error });
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    logger.info('Starting data collection tests');
    
    await testFileUtils();
    await testDbUtils();
    await testModCollector();
    await testTechParser();
    
    logger.info('All tests completed');
  } catch (error) {
    logger.error(`Error in tests: ${error.message}`, { error });
  }
}

// Run the tests
runTests().catch(error => {
  logger.error(`Unhandled error: ${error.message}`, { error });
}); 