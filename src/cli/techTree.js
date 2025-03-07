/**
 * CLI tool for testing the technology tree
 */
const { init, shutdown } = require('../index');
const logger = require('../utils/logger');

/**
 * Main function
 */
async function main() {
  try {
    // Initialize the application
    const app = await init();
    
    if (!app) {
      logger.error('Failed to initialize application');
      return;
    }
    
    const { techService, techTreeService } = app;
    
    // Display tech tree statistics
    console.log('\n=== Technology Tree Statistics ===');
    console.log(`Total technologies: ${techService.getAllTechnologies().length}`);
    console.log(`Root technologies: ${techTreeService.getRootTechnologies().length}`);
    console.log(`Maximum depth: ${techTreeService.getMaxDepth()}`);
    console.log(`Maximum width: ${techTreeService.getMaxWidth()}`);
    
    // Display technologies by area
    const areas = techService.getAllAreas();
    console.log('\n=== Technologies by Area ===');
    for (const area of areas) {
      const techs = techService.getTechnologiesByArea(area.id);
      console.log(`${area.name}: ${techs.length} technologies`);
    }
    
    // Display technologies by tier
    console.log('\n=== Technologies by Tier ===');
    for (let tier = 0; tier <= 5; tier++) {
      const techs = techService.getTechnologiesByTier(tier);
      console.log(`Tier ${tier}: ${techs.length} technologies`);
    }
    
    // Display some root technologies
    const rootTechs = techTreeService.getRootTechnologies();
    console.log('\n=== Sample Root Technologies ===');
    for (let i = 0; i < Math.min(10, rootTechs.length); i++) {
      const tech = rootTechs[i];
      console.log(`${tech.id} (${tech.displayName}) - ${tech.areaName}, Tier ${tech.tier}`);
    }
    
    // Test search functionality
    const searchQuery = process.argv[2] || 'laser';
    const searchResults = techTreeService.searchTechnologies(searchQuery);
    console.log(`\n=== Search Results for "${searchQuery}" ===`);
    console.log(`Found ${searchResults.length} technologies`);
    
    for (let i = 0; i < Math.min(10, searchResults.length); i++) {
      const tech = searchResults[i];
      console.log(`${tech.id} (${tech.displayName}) - ${tech.areaName}, Tier ${tech.tier}`);
      
      // Display prerequisites
      const prereqs = techTreeService.getParentTechnologies(tech.id);
      if (prereqs.length > 0) {
        console.log(`  Prerequisites: ${prereqs.map(t => t.displayName).join(', ')}`);
      } else {
        console.log('  No prerequisites');
      }
      
      // Display path to root
      const pathToRoot = techTreeService.getPathToRoot(tech.id);
      if (pathToRoot.length > 1) {
        console.log(`  Path to root: ${pathToRoot.map(t => t.displayName).join(' -> ')}`);
      }
      
      console.log('');
    }
    
    // If a specific technology was searched for and found, display more details
    if (searchResults.length === 1) {
      const tech = searchResults[0];
      console.log('\n=== Detailed Technology Information ===');
      console.log(`ID: ${tech.id}`);
      console.log(`Name: ${tech.displayName}`);
      console.log(`Description: ${tech.description}`);
      console.log(`Area: ${tech.areaName}`);
      console.log(`Category: ${tech.categoryName}`);
      console.log(`Tier: ${tech.tier}`);
      console.log(`Cost: ${tech.getEffectiveCost()}`);
      console.log(`Source: ${tech.sourceModName || 'Base Game'}`);
      
      // Display prerequisites
      const prereqs = techTreeService.getParentTechnologies(tech.id);
      console.log('\nPrerequisites:');
      if (prereqs.length > 0) {
        for (const prereq of prereqs) {
          console.log(`- ${prereq.displayName} (${prereq.id})`);
        }
      } else {
        console.log('- None');
      }
      
      // Display technologies that require this one
      const children = techTreeService.getChildTechnologies(tech.id);
      console.log('\nRequired for:');
      if (children.length > 0) {
        for (const child of children) {
          console.log(`- ${child.displayName} (${child.id})`);
        }
      } else {
        console.log('- None');
      }
      
      // Display depth in the tree
      const depth = techTreeService.getTechnologyDepth(tech.id);
      console.log(`\nDepth in tree: ${depth}`);
      
      // Display path to root
      const pathToRoot = techTreeService.getPathToRoot(tech.id);
      console.log('\nPath to root:');
      if (pathToRoot.length > 1) {
        for (let i = 0; i < pathToRoot.length; i++) {
          const pathTech = pathToRoot[i];
          console.log(`${i}. ${pathTech.displayName} (${pathTech.id})`);
        }
      } else {
        console.log('- This is a root technology');
      }
    }
  } catch (error) {
    logger.error(`Error: ${error.message}`);
    logger.error(error.stack);
  } finally {
    // Shutdown the application
    await shutdown();
  }
}

// Run the main function
main().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
}); 