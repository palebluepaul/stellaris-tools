const path = require('path');
const logger = require('../utils/logger');
const gamePathDetector = require('../utils/gamePathDetector');
const TechService = require('../services/techService');

/**
 * CLI command to test the technology database
 */
async function main() {
  try {
    logger.info('Testing technology database');
    
    // Initialize the tech service
    const techService = new TechService();
    await techService.initialize();
    
    // Get the game path
    await gamePathDetector.initialize();
    const gamePath = await gamePathDetector.getGameInstallDir();
    
    if (!gamePath) {
      logger.error('Game path not found');
      process.exit(1);
    }
    
    logger.info(`Using game path: ${gamePath}`);
    
    // Load all technologies
    const totalLoaded = await techService.loadAllTechnologies(gamePath);
    
    logger.info(`Loaded ${totalLoaded} technologies in total`);
    
    // Display some statistics
    const allTechs = techService.getAllTechnologies();
    const areas = techService.getAllAreas();
    const categories = techService.getAllCategories();
    
    logger.info('Technology Statistics:');
    logger.info(`- Total technologies: ${allTechs.length}`);
    logger.info(`- Areas: ${areas.length} (${areas.map(a => a.name).join(', ')})`);
    logger.info(`- Categories: ${categories.length}`);
    
    // Display technologies by area
    for (const area of areas) {
      const techsInArea = techService.getTechnologiesByArea(area.id);
      logger.info(`- ${area.name} technologies: ${techsInArea.length}`);
      
      // Display technologies by tier within this area
      for (let tier = 0; tier <= 5; tier++) {
        const techsInTier = techsInArea.filter(tech => tech.tier === tier);
        if (techsInTier.length > 0) {
          logger.info(`  - Tier ${tier}: ${techsInTier.length} technologies`);
        }
      }
    }
    
    // Display some example technologies with their prerequisites and dependents
    const exampleTechs = allTechs.slice(0, 5);
    logger.info('\nExample Technologies:');
    
    for (const tech of exampleTechs) {
      logger.info(`\n${tech.id} (${tech.displayName || tech.name}):`);
      logger.info(`- Area: ${tech.areaName || tech.areaId}`);
      logger.info(`- Tier: ${tech.tier}`);
      logger.info(`- Cost: ${tech.getEffectiveCost()}`);
      
      // Display prerequisites
      const prerequisites = techService.getPrerequisites(tech.id);
      if (prerequisites.length > 0) {
        logger.info('- Prerequisites:');
        for (const prereq of prerequisites) {
          logger.info(`  - ${prereq.id} (${prereq.displayName || prereq.name})`);
        }
      } else {
        logger.info('- Prerequisites: None');
      }
      
      // Display dependent technologies
      const dependents = techService.getDependentTechnologies(tech.id);
      if (dependents.length > 0) {
        logger.info('- Required by:');
        for (const dependent of dependents) {
          logger.info(`  - ${dependent.id} (${dependent.displayName || dependent.name})`);
        }
      } else {
        logger.info('- Required by: None');
      }
      
      // Display source
      logger.info(`- Source: ${tech.sourceModName || 'Base Game'}`);
    }
    
    // Display some statistics about the technology tree
    const startingTechs = allTechs.filter(tech => tech.isStartingTech);
    const rareTechs = allTechs.filter(tech => tech.isRare);
    const dangerousTechs = allTechs.filter(tech => tech.isDangerous);
    
    logger.info('\nTechnology Tree Statistics:');
    logger.info(`- Starting technologies: ${startingTechs.length}`);
    logger.info(`- Rare technologies: ${rareTechs.length}`);
    logger.info(`- Dangerous technologies: ${dangerousTechs.length}`);
    
    // Find technologies with the most prerequisites
    const techsByPrereqCount = [...allTechs].sort((a, b) => 
      (b.prerequisites ? b.prerequisites.length : 0) - 
      (a.prerequisites ? a.prerequisites.length : 0)
    );
    
    const topPrereqTechs = techsByPrereqCount.slice(0, 5);
    logger.info('\nTechnologies with most prerequisites:');
    for (const tech of topPrereqTechs) {
      const prereqCount = tech.prerequisites ? tech.prerequisites.length : 0;
      logger.info(`- ${tech.id} (${tech.displayName || tech.name}): ${prereqCount} prerequisites`);
    }
    
    // Find technologies that are required by the most other technologies
    const techsByDependentCount = [...allTechs].sort((a, b) => 
      b.getChildTechs().length - a.getChildTechs().length
    );
    
    const topDependentTechs = techsByDependentCount.slice(0, 5);
    logger.info('\nMost required technologies:');
    for (const tech of topDependentTechs) {
      const dependentCount = tech.getChildTechs().length;
      logger.info(`- ${tech.id} (${tech.displayName || tech.name}): Required by ${dependentCount} technologies`);
    }
    
    logger.info('\nTechnology database test completed successfully');
  } catch (error) {
    logger.error(`Error testing technology database: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
}); 