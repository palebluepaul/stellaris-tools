const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { execSync } = require('child_process');
const logger = require('./logger');

/**
 * Utility class for cross-platform path resolution
 */
class PathResolver {
  /**
   * Check if running in Windows Subsystem for Linux (WSL)
   * @returns {boolean} True if running in WSL
   */
  static isWSL() {
    try {
      // Check for WSL-specific file
      const output = execSync('cat /proc/version').toString().toLowerCase();
      return output.includes('microsoft') || output.includes('wsl');
    } catch (error) {
      logger.debug('Error checking for WSL environment', { error: error.message });
      return false;
    }
  }

  /**
   * Get the Windows username when running in WSL
   * @returns {string|null} Windows username or null if not found
   */
  static getWindowsUsername() {
    try {
      // Try to find the Windows username by listing the /mnt/c/Users directory
      const output = execSync('ls -la /mnt/c/Users/').toString();
      
      // Parse the output to find directories that aren't . or ..
      const lines = output.split('\n');
      for (const line of lines) {
        // Look for directory entries (starts with 'd')
        if (line.startsWith('d')) {
          const parts = line.split(' ').filter(part => part.length > 0);
          const username = parts[parts.length - 1];
          
          // Skip . and .. directories and Public/Default
          if (username !== '.' && username !== '..' && 
              username !== 'Public' && username !== 'Default' && 
              username !== 'All Users' && username !== 'Default User') {
            logger.debug(`Found Windows username: ${username}`);
            return username;
          }
        }
      }
      
      // Fallback: try to get the username from the environment variable
      logger.debug('Trying to get Windows username from environment variable');
      const envOutput = execSync('cmd.exe /c echo %USERNAME%').toString().trim();
      if (envOutput && envOutput !== '%USERNAME%') {
        logger.debug(`Found Windows username from environment: ${envOutput}`);
        return envOutput;
      }
      
      logger.warn('Could not determine Windows username');
      return null;
    } catch (error) {
      logger.debug('Error getting Windows username', { error: error.message });
      return null;
    }
  }

  /**
   * Convert a Windows path to a WSL path
   * @param {string} windowsPath - Windows path to convert
   * @returns {string} WSL path
   */
  static convertToWSLPath(windowsPath) {
    if (!windowsPath) return null;
    
    // Replace backslashes with forward slashes
    let wslPath = windowsPath.replace(/\\/g, '/');
    
    // Replace drive letter with WSL mount point
    if (/^[a-z]:/i.test(wslPath)) {
      const driveLetter = wslPath.charAt(0).toLowerCase();
      wslPath = `/mnt/${driveLetter}${wslPath.substring(2)}`;
    }
    
    logger.debug(`Converted Windows path "${windowsPath}" to WSL path "${wslPath}"`);
    return wslPath;
  }

  /**
   * Get the user's home directory
   * @returns {string} Path to the user's home directory
   */
  static getHomeDir() {
    if (this.isWSL()) {
      const windowsUsername = this.getWindowsUsername();
      if (windowsUsername) {
        return `/mnt/c/Users/${windowsUsername}`;
      }
      logger.warn('Could not determine Windows username, falling back to WSL home directory');
    }
    return os.homedir();
  }

  /**
   * Get the user's documents directory based on the platform
   * @returns {string} Path to the user's documents directory
   */
  static getDocumentsDir() {
    const homedir = this.getHomeDir();
    
    if (this.isWSL()) {
      return path.join(homedir, 'Documents');
    }
    
    switch (process.platform) {
    case 'win32':
      return path.join(homedir, 'Documents');
    case 'darwin':
      return path.join(homedir, 'Documents');
    default:
      // Linux typically uses ~/.local/share for game data
      return path.join(homedir, '.local', 'share');
    }
  }

  /**
   * Get the Stellaris user data directory
   * @returns {string} Path to the Stellaris user data directory
   */
  static getStellarisUserDataDir() {
    return path.join(this.getDocumentsDir(), 'Paradox Interactive', 'Stellaris');
  }

  /**
   * Get the Stellaris launcher database path
   * @returns {string} Path to the launcher-v2.sqlite file
   */
  static getLauncherDbPath() {
    return path.join(this.getStellarisUserDataDir(), 'launcher-v2.sqlite');
  }

  /**
   * Get the Stellaris save games directory
   * @returns {string} Path to the save games directory
   */
  static getSaveGamesDir() {
    return path.join(this.getStellarisUserDataDir(), 'save games');
  }

  /**
   * Get the Stellaris workshop mods directory
   * @returns {Promise<string|null>} Path to the workshop mods directory or null if not found
   */
  static async getWorkshopModsDir() {
    // Common Steam installation paths
    const steamPaths = [];
    
    if (this.isWSL()) {
      const windowsUsername = this.getWindowsUsername();
      if (windowsUsername) {
        steamPaths.push(
          `/mnt/c/Program Files (x86)/Steam`,
          `/mnt/c/Program Files/Steam`,
          path.join(`/mnt/c/Users/${windowsUsername}`, 'Steam')
        );
      }
    } else {
      switch (process.platform) {
      case 'win32':
        steamPaths.push(
          'C:\\Program Files (x86)\\Steam',
          'C:\\Program Files\\Steam',
          path.join(this.getHomeDir(), 'Steam')
        );
        break;
      case 'darwin':
        steamPaths.push(
          path.join(this.getHomeDir(), 'Library', 'Application Support', 'Steam')
        );
        break;
      default:
        // Linux
        steamPaths.push(
          path.join(this.getHomeDir(), '.steam', 'steam'),
          path.join(this.getHomeDir(), '.local', 'share', 'Steam')
        );
      }
    }

    // Stellaris Workshop ID is 281990
    const workshopPath = 'steamapps/workshop/content/281990';
    
    // Try to find the workshop directory
    for (const steamPath of steamPaths) {
      const fullPath = path.join(steamPath, workshopPath);
      try {
        await fs.access(fullPath);
        logger.debug(`Found Steam Workshop mods at: ${fullPath}`);
        return fullPath;
      } catch (error) {
        logger.debug(`Steam Workshop mods not found at: ${fullPath}`);
      }
    }
    
    logger.warn('Could not locate Steam Workshop mods directory');
    return null;
  }

  /**
   * Get the Stellaris game installation directory
   * @returns {Promise<string|null>} Path to the Stellaris installation directory or null if not found
   */
  static async getGameInstallDir() {
    // Common Stellaris installation paths
    const installPaths = [];
    
    if (this.isWSL()) {
      const windowsUsername = this.getWindowsUsername();
      if (windowsUsername) {
        installPaths.push(
          `/mnt/c/Program Files (x86)/Steam/steamapps/common/Stellaris`,
          `/mnt/c/Program Files/Steam/steamapps/common/Stellaris`,
          path.join(`/mnt/c/Users/${windowsUsername}`, 'Steam', 'steamapps', 'common', 'Stellaris')
        );
      }
    } else {
      switch (process.platform) {
      case 'win32':
        installPaths.push(
          'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stellaris',
          'C:\\Program Files\\Steam\\steamapps\\common\\Stellaris',
          path.join(this.getHomeDir(), 'Steam', 'steamapps', 'common', 'Stellaris')
        );
        break;
      case 'darwin':
        installPaths.push(
          path.join(this.getHomeDir(), 'Library', 'Application Support', 'Steam', 'steamapps', 'common', 'Stellaris'),
          '/Applications/Stellaris.app/Contents/Resources'
        );
        break;
      default:
        // Linux
        installPaths.push(
          path.join(this.getHomeDir(), '.steam', 'steam', 'steamapps', 'common', 'Stellaris'),
          path.join(this.getHomeDir(), '.local', 'share', 'Steam', 'steamapps', 'common', 'Stellaris')
        );
      }
    }
    
    // Try to find the game directory
    for (const installPath of installPaths) {
      try {
        await fs.access(installPath);
        logger.debug(`Found Stellaris installation at: ${installPath}`);
        return installPath;
      } catch (error) {
        logger.debug(`Stellaris installation not found at: ${installPath}`);
      }
    }
    
    logger.warn('Could not locate Stellaris installation directory');
    return null;
  }

  /**
   * Validate that a path exists and is accessible
   * @param {string} pathToCheck - Path to validate
   * @returns {Promise<boolean>} True if the path exists and is accessible
   */
  static async validatePath(pathToCheck) {
    try {
      await fs.access(pathToCheck);
      return true;
    } catch (error) {
      logger.debug(`Path validation failed for: ${pathToCheck}`, { error: error.message });
      return false;
    }
  }

  /**
   * Create a directory if it doesn't exist
   * @param {string} dirPath - Path to create
   * @returns {Promise<boolean>} True if the directory exists or was created successfully
   */
  static async ensureDir(dirPath) {
    try {
      await fs.access(dirPath);
      return true;
    } catch (error) {
      try {
        await fs.mkdir(dirPath, { recursive: true });
        logger.debug(`Created directory: ${dirPath}`);
        return true;
      } catch (mkdirError) {
        logger.error(`Failed to create directory: ${dirPath}`, { error: mkdirError.message });
        return false;
      }
    }
  }

  /**
   * Get all files in a directory that match a pattern
   * @param {string} dirPath - Directory to search
   * @param {RegExp} pattern - Pattern to match filenames against
   * @param {boolean} recursive - Whether to search recursively
   * @returns {Promise<string[]>} Array of matching file paths
   */
  static async findFiles(dirPath, pattern, recursive = false) {
    const results = [];
    
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && recursive) {
          const subResults = await this.findFiles(fullPath, pattern, recursive);
          results.push(...subResults);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      logger.error(`Error searching directory: ${dirPath}`, { error: error.message });
    }
    
    return results;
  }
}

module.exports = PathResolver; 