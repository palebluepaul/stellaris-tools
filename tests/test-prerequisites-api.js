/**
 * Test script for the prerequisites API endpoint
 */
const axios = require('axios');
const logger = require('../src/utils/logger');

// Configuration
const API_URL = 'http://localhost:3000';
const TEST_TECH_IDS = [
  'tech_lasers_1',           // Basic lasers - a starting tech
  'tech_battleships',        // Battleships - has prerequisites
  'tech_synthetic_leaders',  // Synthetic Leaders - advanced tech with multiple prerequisites
];

/**
 * Tests the prerequisites API endpoint
 */
async function testPrerequisitesApi() {
  logger.info('Testing prerequisites API endpoint...');
  
  try {
    // First check if the API is running
    const healthResponse = await axios.get(`${API_URL}/api/health`);
    logger.info(`API health status: ${healthResponse.data.status}`);
    
    if (healthResponse.data.status !== 'ok') {
      logger.error('API is not healthy, aborting test');
      return;
    }
    
    // Test each technology
    for (const techId of TEST_TECH_IDS) {
      try {
        logger.info(`Testing prerequisites for technology: ${techId}`);
        const response = await axios.get(`${API_URL}/api/technologies/${techId}/prerequisites`);
        
        // Log the technology and its prerequisites
        const { technology, prerequisites } = response.data;
        logger.info(`Technology: ${technology.displayName} (${technology.id})`);
        
        if (prerequisites.length === 0) {
          logger.info('No prerequisites found (this may be a starting technology)');
        } else {
          logger.info(`Found ${prerequisites.length} prerequisites:`);
          prerequisites.forEach(prereq => {
            logger.info(`- ${prereq.displayName} (${prereq.id})`);
          });
        }
        
        logger.info('---');
      } catch (error) {
        if (error.response) {
          logger.error(`Error testing ${techId}: ${error.response.data.error}`);
        } else {
          logger.error(`Error testing ${techId}: ${error.message}`);
        }
      }
    }
    
    logger.info('Prerequisites API test completed');
  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
  }
}

/**
 * Tests the recursive prerequisites API endpoint
 */
async function testRecursivePrerequisitesApi() {
  logger.info('Testing recursive prerequisites API endpoint...');
  
  try {
    // First check if the API is running
    const healthResponse = await axios.get(`${API_URL}/api/health`);
    logger.info(`API health status: ${healthResponse.data.status}`);
    
    if (healthResponse.data.status !== 'ok') {
      logger.error('API is not healthy, aborting test');
      return;
    }
    
    // Test each technology
    for (const techId of TEST_TECH_IDS) {
      try {
        logger.info(`Testing recursive prerequisites for technology: ${techId}`);
        const response = await axios.get(`${API_URL}/api/technologies/${techId}/prerequisites/all`);
        
        // Log the technology and its prerequisites
        const { technology, directPrerequisites, allPrerequisites, tree } = response.data;
        logger.info(`Technology: ${technology.displayName} (${technology.id})`);
        
        if (directPrerequisites.length === 0) {
          logger.info('No direct prerequisites found (this may be a starting technology)');
        } else {
          logger.info(`Found ${directPrerequisites.length} direct prerequisites:`);
          directPrerequisites.forEach(prereq => {
            logger.info(`- ${prereq.displayName} (${prereq.id})`);
          });
        }
        
        if (allPrerequisites.length === 0) {
          logger.info('No recursive prerequisites found (this may be a starting technology)');
        } else {
          logger.info(`Found ${allPrerequisites.length} total prerequisites (including indirect):`);
          allPrerequisites.forEach(prereq => {
            logger.info(`- ${prereq.displayName} (${prereq.id}) [Tier ${prereq.tier}]`);
          });
        }
        
        logger.info('Dependency tree structure:');
        logger.info(JSON.stringify(tree, null, 2));
        
        logger.info('---');
      } catch (error) {
        if (error.response) {
          logger.error(`Error testing ${techId}: ${error.response.data.error}`);
        } else {
          logger.error(`Error testing ${techId}: ${error.message}`);
        }
      }
    }
    
    logger.info('Recursive prerequisites API test completed');
  } catch (error) {
    logger.error(`Test failed: ${error.message}`);
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  (async () => {
    await testPrerequisitesApi();
    logger.info('\n');
    await testRecursivePrerequisitesApi();
  })();
}

module.exports = { testPrerequisitesApi, testRecursivePrerequisitesApi }; 