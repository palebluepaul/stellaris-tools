/**
 * Configuration file for the Stellaris Tech Tree Viewer
 * Contains paths, settings, and constants used throughout the application
 */
const path = require('path');
const os = require('os');

// Common paths for Stellaris installation
const possibleStellarisInstallPaths = [
  'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stellaris',
  'D:\\Steam\\steamapps\\common\\Stellaris',
  'E:\\Steam\\steamapps\\common\\Stellaris'
];

// Steam Workshop path for Stellaris mods
const steamWorkshopPath = 'C:\\Program Files (x86)\\Steam\\steamapps\\workshop\\content\\281990';

// User documents folder for Stellaris
const stellarisUserDataPath = path.join(os.homedir(), 'Documents', 'Paradox Interactive', 'Stellaris');

// SQLite database path
const launcherDbPath = path.join(stellarisUserDataPath, 'launcher-v2.sqlite');

// Save games directory
const saveGamesPath = path.join(stellarisUserDataPath, 'save games');

// Technology file paths
const baseTechPath = 'common/technology';

// Logging configuration
const loggingConfig = {
  logDir: path.join(process.cwd(), 'src', 'logs'),
  logLevel: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  maxSize: 5242880, // 5MB
  maxFiles: 5
};

module.exports = {
  possibleStellarisInstallPaths,
  steamWorkshopPath,
  stellarisUserDataPath,
  launcherDbPath,
  saveGamesPath,
  baseTechPath,
  loggingConfig
}; 