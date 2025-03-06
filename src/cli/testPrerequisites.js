const path = require('path');
const { TechParser } = require('../parsers');
const TechFileLocator = require('../utils/techFileLocator');
const logger = require('../utils/logger');

/**
 * Test the parser with technologies that have prerequisites
 */
async function testPrerequisites() {
  try {
    logger.info('Testing parser with technologies that have prerequisites');
    
    // Initialize the parser
    const parser = new TechParser();
    await parser.initialize();
    
    // Find technology files
    const baseGameFiles = await TechFileLocator.findBaseGameTechFiles();
    
    if (baseGameFiles.length === 0) {
      logger.error('No technology files found in the base game');
      return;
    }
    
    // Try to find physics tech file which should have prerequisites
    const physTechFile = baseGameFiles.find(file => path.basename(file) === '00_phys_tech.txt');
    
    if (!physTechFile) {
      logger.error('Physics tech file not found');
      return;
    }
    
    logger.info(`Parsing physics tech file: ${physTechFile}`);
    
    // Parse the file
    const technologies = await parser.parseFile(physTechFile);
    
    // Filter technologies with prerequisites
    const techsWithPrereqs = technologies.filter(tech => tech.prerequisites && tech.prerequisites.length > 0);
    
    // Filter technologies without prerequisites
    const techsWithoutPrereqs = technologies.filter(tech => !tech.prerequisites || tech.prerequisites.length === 0);
    
    // Display the results
    logger.info(`Found ${techsWithPrereqs.length} technologies with prerequisites out of ${technologies.length} total technologies`);
    logger.info(`Found ${techsWithoutPrereqs.length} technologies without prerequisites`);
    
    if (techsWithPrereqs.length === 0) {
      logger.error('No technologies with prerequisites found!');
      return;
    }
    
    // Display the first 5 technologies with prerequisites
    logger.info('TECHNOLOGIES WITH PREREQUISITES:');
    const sampleTechs = techsWithPrereqs.slice(0, 5);
    for (const tech of sampleTechs) {
      logger.info('-----------------------------------');
      logger.info(`ID: ${tech.id}`);
      logger.info(`Area: ${tech.areaId}`);
      logger.info(`Tier: ${tech.tier}`);
      logger.info(`Cost: ${tech.cost}`);
      logger.info(`Prerequisites: ${tech.prerequisites.join(', ')}`);
      logger.info(`Starting Tech: ${tech.isStartingTech ? 'Yes' : 'No'}`);
      logger.info(`Rare: ${tech.isRare ? 'Yes' : 'No'}`);
    }
    
    // Display the first 5 technologies without prerequisites
    logger.info('TECHNOLOGIES WITHOUT PREREQUISITES:');
    const sampleTechsWithoutPrereqs = techsWithoutPrereqs.slice(0, 5);
    for (const tech of sampleTechsWithoutPrereqs) {
      logger.info('-----------------------------------');
      logger.info(`ID: ${tech.id}`);
      logger.info(`Area: ${tech.areaId}`);
      logger.info(`Tier: ${tech.tier}`);
      logger.info(`Cost: ${tech.cost}`);
      logger.info(`Starting Tech: ${tech.isStartingTech ? 'Yes' : 'No'}`);
      logger.info(`Rare: ${tech.isRare ? 'Yes' : 'No'}`);
    }
    
    logger.info('-----------------------------------');
    
    // Test with our sample file from the tests
    logger.info('Testing with sample file from tests');
    const testDir = path.resolve(__dirname, '../../tests/fixtures');
    const sampleFile = path.resolve(testDir, 'sample_tech.txt');
    
    const testFileTechs = await parser.parseFile(sampleFile);
    
    // Check if the sample techs have prerequisites
    const testTechsWithPrereqs = testFileTechs.filter(tech => tech.prerequisites && tech.prerequisites.length > 0);
    const testTechsWithoutPrereqs = testFileTechs.filter(tech => !tech.prerequisites || tech.prerequisites.length === 0);
    
    logger.info(`Found ${testTechsWithPrereqs.length} technologies with prerequisites out of ${testFileTechs.length} total technologies in sample file`);
    logger.info(`Found ${testTechsWithoutPrereqs.length} technologies without prerequisites in sample file`);
    
    logger.info('SAMPLE FILE TECHNOLOGIES WITH PREREQUISITES:');
    for (const tech of testTechsWithPrereqs) {
      logger.info('-----------------------------------');
      logger.info(`ID: ${tech.id}`);
      logger.info(`Prerequisites: ${tech.prerequisites.join(', ')}`);
    }
    
    logger.info('SAMPLE FILE TECHNOLOGIES WITHOUT PREREQUISITES:');
    for (const tech of testTechsWithoutPrereqs) {
      logger.info('-----------------------------------');
      logger.info(`ID: ${tech.id}`);
      logger.info(`Starting Tech: ${tech.isStartingTech ? 'Yes' : 'No'}`);
    }
    
  } catch (error) {
    logger.error(`Error testing prerequisites: ${error.message}`);
    logger.error(error.stack);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testPrerequisites()
    .then(() => {
      logger.info('Prerequisites test completed');
    })
    .catch((error) => {
      logger.error(`Prerequisites test failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = testPrerequisites; 