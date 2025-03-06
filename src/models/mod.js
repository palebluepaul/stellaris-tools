/**
 * Model representing a Stellaris mod
 */
class Mod {
  /**
   * Create a new Mod instance
   * @param {Object} data - Mod data
   * @param {string} [data.id] - Unique identifier
   * @param {string} [data.name] - Internal name
   * @param {string} [data.displayName] - Display name
   * @param {boolean|number|string} [data.enabled] - Whether the mod is enabled
   * @param {number} [data.position] - Load order position
   * @param {string} [data.dirPath] - Directory path
   * @param {string} [data.steamId] - Steam Workshop ID
   * @param {string} [data.version] - Mod version
   * @param {string} [data.requiredVersion] - Required game version
   * @param {string|string[]} [data.tags] - Mod tags
   * @param {string} [data.status] - Mod status
   * @param {string} [data.source] - Mod source (local, workshop, etc.)
   * @param {string} [data.thumbnailPath] - Path to thumbnail image
   * @param {string} [data.archivePath] - Path to archive file
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.displayName = data.displayName || data.name || '';
    // Handle SQLite's 0/1 values for boolean fields
    this.enabled = data.enabled === true || 
                   data.enabled === 'true' || 
                   data.enabled === 1;
    this.position = data.position || 0;
    this.dirPath = data.dirPath || null;
    this.steamId = data.steamId || null;
    this.version = data.version || null;
    this.requiredVersion = data.requiredVersion || null;
    this.tags = this._parseTags(data.tags);
    this.status = data.status || 'unknown';
    this.source = data.source || 'unknown';
    this.thumbnailPath = data.thumbnailPath || null;
    this.archivePath = data.archivePath || null;
  }

  /**
   * Parse tags from various formats
   * @param {string|Array} tags - Tags in string or array format
   * @returns {Array} Array of tag strings
   * @private
   */
  _parseTags(tags) {
    if (!tags) {
      return [];
    }
    
    if (Array.isArray(tags)) {
      return tags;
    }
    
    try {
      return JSON.parse(tags);
    } catch (e) {
      return [];
    }
  }

  /**
   * Get the effective path to the mod (directory or archive)
   * @returns {string|null} Path to the mod
   */
  getEffectivePath() {
    return this.dirPath || this.archivePath || null;
  }

  /**
   * Check if this is a total conversion mod
   * @returns {boolean} True if this is a total conversion mod
   */
  isTotalConversion() {
    return this.tags.some(tag => 
      tag.toLowerCase().includes('total conversion') || 
      tag.toLowerCase().includes('overhaul')
    );
  }

  /**
   * Check if this is a graphics mod
   * @returns {boolean} True if this is a graphics mod
   */
  isGraphicsMod() {
    return this.tags.some(tag => 
      tag.toLowerCase().includes('graphic') || 
      tag.toLowerCase().includes('visual') ||
      tag.toLowerCase().includes('portrait') ||
      tag.toLowerCase().includes('appearance')
    );
  }

  /**
   * Check if this is a gameplay mod
   * @returns {boolean} True if this is a gameplay mod
   */
  isGameplayMod() {
    return this.tags.some(tag => 
      tag.toLowerCase().includes('gameplay') || 
      tag.toLowerCase().includes('balance') ||
      tag.toLowerCase().includes('events') ||
      tag.toLowerCase().includes('mechanics')
    );
  }

  /**
   * Convert to a plain object for serialization
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      enabled: this.enabled,
      position: this.position,
      dirPath: this.dirPath,
      steamId: this.steamId,
      version: this.version,
      requiredVersion: this.requiredVersion,
      tags: this.tags,
      status: this.status,
      source: this.source,
      thumbnailPath: this.thumbnailPath,
      archivePath: this.archivePath
    };
  }
}

module.exports = { Mod }; 