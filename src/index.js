/**
 * Main entry point for the Stellaris Tech Tree Viewer application
 * Orchestrates the data collection and processing phases
 */
const path = require('path');
const fs = require('fs-extra');
const logger = require('./utils/logger');
const fileUtils = require('./utils/file-utils');
const modCollector = require('./modules/data-collection/mod-collector');
const techParser = require('./modules/data-collection/tech-parser');

/**
 * Main function to run the application
 */
async function main() {
  try {
    logger.info('Starting Stellaris Tech Tree Viewer - Phase 1: Data Collection');
    
    // Check if Stellaris user data directory exists
    if (!fileUtils.checkUserDataDirectory()) {
      logger.error('Stellaris user data directory not found. Please make sure Stellaris is installed.');
      process.exit(1);
    }
    
    // Step 1: Collect base game technology files
    logger.info('Step 1: Collecting base game technology files');
    const baseGameTechFiles = await modCollector.findBaseGameTechFiles();
    
    if (baseGameTechFiles.length === 0) {
      logger.error('No base game technology files found. Please check your Stellaris installation.');
      process.exit(1);
    }
    
    logger.info(`Found ${baseGameTechFiles.length} base game technology files`);
    
    // Step 2: Get active mod set
    logger.info('Step 2: Getting active mod set');
    let activeModSet;
    try {
      activeModSet = await modCollector.getActiveModSet();
      logger.info(`Active playset: ${activeModSet.playset.name} with ${activeModSet.mods.length} mods`);
    } catch (error) {
      logger.error(`Error getting active mod set: ${error.message}`);
      logger.info('Continuing with base game only');
      activeModSet = { playset: null, mods: [] };
    }
    
    // Step 3: Collect mod technology files
    logger.info('Step 3: Collecting mod technology files');
    const modTechFiles = await modCollector.findModTechFiles(activeModSet.mods);
    
    // Step 4: Parse base game technology files
    logger.info('Step 4: Parsing base game technology files');
    const baseGameTechnologies = await techParser.parseTechFiles(baseGameTechFiles);
    
    // Step 5: Parse mod technology files
    logger.info('Step 5: Parsing mod technology files');
    const modTechnologies = {};
    
    for (const [modId, files] of Object.entries(modTechFiles)) {
      // Check if modId is a fallback ID (starts with 'mod_')
      const isFallbackId = modId.startsWith('mod_');
      
      // For fallback IDs, we don't need to find the mod in activeModSet
      const mod = isFallbackId ? { id: modId, displayName: modId.replace('mod_', '').replace(/_/g, ' ') } 
                              : activeModSet.mods.find(m => m.id === modId);
                              
      if (!mod && !isFallbackId) {
        logger.warn(`Mod with ID ${modId} not found in active mod set, skipping`);
        continue;
      }
      
      // Add null check for displayName
      const modName = mod.displayName || `Mod ID: ${modId}`;
      logger.info(`Parsing technology files for mod: ${modName}`);
      
      const technologies = await techParser.parseTechFiles(files);
      modTechnologies[modId] = technologies;
    }
    
    // Step 6: Merge technologies, with mod technologies overriding base game
    logger.info('Step 6: Merging technologies');
    const allTechnologies = { ...baseGameTechnologies };
    
    for (const technologies of Object.values(modTechnologies)) {
      for (const [techId, tech] of Object.entries(technologies)) {
        if (allTechnologies[techId]) {
          logger.debug(`Technology ${techId} from mod overrides base game definition`);
        }
        allTechnologies[techId] = tech;
      }
    }
    
    logger.info(`Total unique technologies: ${Object.keys(allTechnologies).length}`);
    
    // Step 7: Save the collected data
    logger.info('Step 7: Saving collected data');
    const outputDir = path.join(process.cwd(), 'data');
    fs.ensureDirSync(outputDir);
    
    // Save base game technologies
    await fs.writeJson(
      path.join(outputDir, 'base_game_technologies.json'),
      baseGameTechnologies,
      { spaces: 2 }
    );
    
    // Save mod technologies
    await fs.writeJson(
      path.join(outputDir, 'mod_technologies.json'),
      modTechnologies,
      { spaces: 2 }
    );
    
    // Save merged technologies
    await fs.writeJson(
      path.join(outputDir, 'all_technologies.json'),
      allTechnologies,
      { spaces: 2 }
    );
    
    // Save active mod set info
    await fs.writeJson(
      path.join(outputDir, 'active_mod_set.json'),
      {
        playset: activeModSet.playset,
        mods: activeModSet.mods.map(mod => ({
          id: mod.id,
          name: mod.displayName || `Mod ID: ${mod.id}`,
          requiredVersion: mod.requiredVersion,
          path: mod.dirPath
        }))
      },
      { spaces: 2 }
    );
    
    logger.info('Data collection completed successfully');
    logger.info(`Output saved to ${outputDir}`);
    
  } catch (error) {
    logger.error(`Error in main process: ${error.message}`, { error });
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error: ${error.message}`, { error });
  process.exit(1);
}); 