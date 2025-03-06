const path = require('path');
const { TechParser } = require('../parsers');
const TechFileLocator = require('../utils/techFileLocator');
const logger = require('../utils/logger');

/**
 * Test the parser with a real technology file
 */
async function testParser() {
  try {
    logger.info('Testing technology file parser');
    
    // Initialize the parser
    const parser = new TechParser();
    await parser.initialize();
    
    // Find technology files
    const baseGameFiles = await TechFileLocator.findBaseGameTechFiles();
    
    if (baseGameFiles.length === 0) {
      logger.error('No technology files found in the base game');
      return;
    }
    
    // Try to find a file with actual technologies
    const techFiles = [
      '00_physics_tech.txt',
      '00_engineering_tech.txt',
      '00_society_tech.txt'
    ];
    
    let sampleFile = null;
    for (const techFile of techFiles) {
      const foundFile = baseGameFiles.find(file => path.basename(file) === techFile);
      if (foundFile) {
        sampleFile = foundFile;
        break;
      }
    }
    
    // If no specific file was found, use the first file
    if (!sampleFile) {
      sampleFile = baseGameFiles[0];
    }
    
    logger.info(`Parsing sample file: ${sampleFile}`);
    
    // Parse the file
    const technologies = await parser.parseFile(sampleFile);
    
    // Display the results
    logger.info(`Successfully parsed ${technologies.length} technologies from ${sampleFile}`);
    
    if (technologies.length === 0) {
      logger.info('No technologies found in the file. Trying another file...');
      
      // Try another file
      const anotherFile = baseGameFiles.find(file => file !== sampleFile);
      if (anotherFile) {
        logger.info(`Parsing another file: ${anotherFile}`);
        const moreTechnologies = await parser.parseFile(anotherFile);
        logger.info(`Successfully parsed ${moreTechnologies.length} technologies from ${anotherFile}`);
        
        if (moreTechnologies.length > 0) {
          // Display the first 3 technologies as a sample
          const sampleTechs = moreTechnologies.slice(0, 3);
          for (const tech of sampleTechs) {
            logger.info('-----------------------------------');
            logger.info(`ID: ${tech.id}`);
            logger.info(`Area: ${tech.areaId}`);
            logger.info(`Tier: ${tech.tier}`);
            logger.info(`Cost: ${tech.cost}`);
            logger.info(`Prerequisites: ${tech.prerequisites.join(', ') || 'None'}`);
            logger.info(`Starting Tech: ${tech.isStartingTech ? 'Yes' : 'No'}`);
            logger.info(`Rare: ${tech.isRare ? 'Yes' : 'No'}`);
          }
          
          logger.info('-----------------------------------');
          logger.info(`Total technologies parsed: ${moreTechnologies.length}`);
          return;
        }
      }
    } else {
      // Display the first 3 technologies as a sample
      const sampleTechs = technologies.slice(0, 3);
      for (const tech of sampleTechs) {
        logger.info('-----------------------------------');
        logger.info(`ID: ${tech.id}`);
        logger.info(`Area: ${tech.areaId}`);
        logger.info(`Tier: ${tech.tier}`);
        logger.info(`Cost: ${tech.cost}`);
        logger.info(`Prerequisites: ${tech.prerequisites.join(', ') || 'None'}`);
        logger.info(`Starting Tech: ${tech.isStartingTech ? 'Yes' : 'No'}`);
        logger.info(`Rare: ${tech.isRare ? 'Yes' : 'No'}`);
      }
      
      logger.info('-----------------------------------');
      logger.info(`Total technologies parsed: ${technologies.length}`);
    }
  } catch (error) {
    logger.error(`Error testing parser: ${error.message}`);
    logger.error(error.stack);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testParser()
    .then(() => {
      logger.info('Parser test completed');
    })
    .catch((error) => {
      logger.error(`Parser test failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = testParser; 