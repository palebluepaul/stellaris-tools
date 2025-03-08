const path = require('path');
const os = require('os');
const PathResolver = require('../utils/pathResolver');

/**
 * Cross-platform path resolution for Stellaris game files
 */
const config = {
  // Base paths
  get homedir() {
    return PathResolver.getHomeDir();
  },
  
  // Platform-specific paths
  get documentsPath() {
    return PathResolver.getDocumentsDir();
  },
  
  // Stellaris paths
  get stellarisUserDataPath() {
    return PathResolver.getStellarisUserDataDir();
  },
  
  get launcherDbPath() {
    return PathResolver.getLauncherDbPath();
  },
  
  get saveGamesPath() {
    return PathResolver.getSaveGamesDir();
  },
  
  // Application paths
  get cachePath() {
    return path.join(process.cwd(), '.cache');
  }
};

module.exports = config; 