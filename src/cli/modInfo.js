/**
 * Command-line utility to display mod information
 */

const modRepository = require('../database/modRepository');
const db = require('../database/connection');
const logger = require('../utils/logger');
const gamePathDetector = require('../utils/gamePathDetector');

/**
 * Display information about the active playset and its mods
 */
async function displayModInfo() {
  try {
    logger.info('=== Stellaris Mod Information ===');
    logger.info('================================');

    // Initialize the game path detector
    await gamePathDetector.initialize();

    // Connect to the database
    const connected = await db.connect();
    if (!connected) {
      logger.error('Failed to connect to the database');
      return;
    }

    // Get the active playset
    const playset = await modRepository.getActivePlayset();
    if (!playset) {
      logger.info('No active playset found');
      return;
    }

    // Display playset information
    logger.info(`Active Playset: ${playset.name}`);
    logger.info(`Total Mods: ${playset.getModCount()}`);
    logger.info(`Enabled Mods: ${playset.getEnabledModCount()}`);
    logger.info('');
    
    // Display enabled mods in load order
    logger.info('Enabled Mods (in load order):');
    logger.info('----------------------------');
    
    const enabledMods = playset.getEnabledModsByLoadOrder();
    if (enabledMods.length === 0) {
      logger.info('No enabled mods');
    } else {
      enabledMods.forEach((mod, index) => {
        logger.info(`${index + 1}. ${mod.displayName || mod.name}`);
        logger.info(`   Path: ${mod.getEffectivePath()}`);
        if (mod.isTotalConversion()) {
          logger.info('   Type: Total Conversion');
        } else if (mod.isGraphicsMod()) {
          logger.info('   Type: Graphics Mod');
        } else if (mod.isGameplayMod()) {
          logger.info('   Type: Gameplay Mod');
        }
        logger.info('');
      });
    }
  } catch (error) {
    logger.error(`Error displaying mod information: ${error.message}`);
  } finally {
    // Disconnect from the database
    await db.disconnect();
  }
}

// If this script is run directly, display mod information
if (require.main === module) {
  displayModInfo().catch(error => {
    logger.error(`Unhandled error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { displayModInfo }; 