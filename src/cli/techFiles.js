#!/usr/bin/env node

const modRepository = require('../database/modRepository');
const TechFileLocator = require('../utils/techFileLocator');
const logger = require('../utils/logger');

/**
 * Main function to find and display technology files
 */
async function main() {
  try {
    // Get enabled mods from the active playset
    logger.info('Fetching enabled mods from active playset...');
    const mods = await modRepository.getEnabledModsForActivePlayset();
    
    if (!mods || mods.length === 0) {
      logger.warn('No enabled mods found in the active playset');
    } else {
      logger.info(`Found ${mods.length} enabled mods in the active playset`);
      
      // Log mod names for debugging
      mods.forEach((mod, index) => {
        logger.info(`  ${index + 1}. ${mod.displayName || mod.name} (${mod.id})`);
      });
    }
    
    // Find all technology files
    logger.info('Searching for technology files...');
    const techFiles = await TechFileLocator.findAllTechFiles(mods);
    
    // Display results
    logger.info(`Found ${techFiles.length} technology files in total`);
    
    // Group by source
    const filesBySource = techFiles.reduce((acc, file) => {
      acc[file.sourceName] = acc[file.sourceName] || [];
      acc[file.sourceName].push(file);
      return acc;
    }, {});
    
    // Display summary by source
    console.log('\nTechnology Files Summary:');
    console.log('========================\n');
    
    for (const [source, files] of Object.entries(filesBySource)) {
      console.log(`${source}: ${files.length} files`);
    }
    
    // Display detailed file list
    console.log('\nDetailed File List:');
    console.log('=================\n');
    
    for (const [source, files] of Object.entries(filesBySource)) {
      console.log(`\n${source}:`);
      console.log(''.padEnd(source.length + 1, '-'));
      
      for (const file of files) {
        console.log(`  ${file.relativePath}`);
      }
    }
    
  } catch (error) {
    logger.error('Error finding technology files', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Run the main function
main(); 