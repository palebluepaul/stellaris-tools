/**
 * Test script for the multiple prerequisites API endpoint
 */
const axios = require('axios');
const logger = require('../src/utils/logger');

// Configuration
const API_URL = 'http://localhost:3000/api';
const TEST_TECH_IDS = [
  'tech_lasers_1',           // Basic lasers - a starting tech
  'tech_battleships',        // Battleships - has prerequisites
  'tech_synthetic_leaders',  // Synthetic Leaders - advanced tech with multiple prerequisites
];

/**
 * Tests the multiple prerequisites API endpoint
 */
async function testMultiplePrerequisitesApi() {
  logger.info('Testing multiple prerequisites API endpoint...');
  
  try {
    // First check if the API is running
    const healthResponse = await axios.get(`${API_URL}/health`);
    logger.info(`API health status: ${healthResponse.data.status}`);
    
    if (healthResponse.data.status !== 'ok') {
      logger.error('API is not healthy, aborting test');
      return;
    }
    
    // Build query params
    const queryParams = new URLSearchParams();
    TEST_TECH_IDS.forEach(id => queryParams.append('ids', id));
    queryParams.append('includeOriginal', 'true');
    
    // Test the endpoint
    logger.info(`Testing prerequisites for technologies: ${TEST_TECH_IDS.join(', ')}`);
    const response = await axios.get(`${API_URL}/technologies/prerequisites/all?${queryParams.toString()}`);
    
    // Log the results
    const { technologies } = response.data;
    logger.info(`Received data for ${Object.keys(technologies).length} technologies`);
    
    // Process each technology
    Object.entries(technologies).forEach(([techId, data]) => {
      const { technology, directPrerequisites, allPrerequisites, tree } = data;
      logger.info(`\nTechnology: ${technology.displayName} (${technology.id})`);
      
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
    });
    
    logger.info('\nMultiple prerequisites API test completed successfully');
  } catch (error) {
    if (error.response) {
      logger.error(`API error: ${error.response.status} - ${error.response.data.error || error.message}`);
    } else {
      logger.error(`Test failed: ${error.message}`);
    }
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testMultiplePrerequisitesApi();
}

module.exports = { testMultiplePrerequisitesApi }; 