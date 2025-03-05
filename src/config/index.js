const path = require('path');
const os = require('os');

/**
 * Cross-platform path resolution for Stellaris game files
 */
const config = {
  // Base paths
  homedir: os.homedir(),
  
  // Platform-specific paths
  get documentsPath() {
    switch (process.platform) {
    case 'win32':
      return path.join(this.homedir, 'Documents');
    case 'darwin':
      return path.join(this.homedir, 'Documents');
    default:
      return path.join(this.homedir, '.local', 'share');
    }
  },
  
  // Stellaris paths
  get stellarisUserDataPath() {
    return path.join(this.documentsPath, 'Paradox Interactive', 'Stellaris');
  },
  
  get launcherDbPath() {
    return path.join(this.stellarisUserDataPath, 'launcher-v2.sqlite');
  },
  
  get saveGamesPath() {
    return path.join(this.stellarisUserDataPath, 'save games');
  },
  
  // Application paths
  get cachePath() {
    return path.join(process.cwd(), '.cache');
  }
};

module.exports = config; 