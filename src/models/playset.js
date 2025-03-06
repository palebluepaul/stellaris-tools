/**
 * Model representing a Stellaris mod playset
 */
class Playset {
  /**
   * Create a new Playset instance
   * @param {Object} data - Playset data
   * @param {string} [data.id] - Unique identifier
   * @param {string} [data.name] - Playset name
   * @param {boolean|number|string} [data.isActive] - Whether this is the active playset
   * @param {string} [data.createdOn] - Creation date
   * @param {string} [data.updatedOn] - Last update date
   * @param {Array} [data.mods] - Array of mods in this playset
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    // Handle SQLite's 0/1 values for boolean fields
    this.isActive = data.isActive === true || 
                    data.isActive === 'true' || 
                    data.isActive === 1;
    this.createdOn = data.createdOn || new Date().toISOString();
    this.updatedOn = data.updatedOn || new Date().toISOString();
    this.mods = data.mods || [];
  }

  /**
   * Get the total number of mods in the playset
   * @returns {number} Total mod count
   */
  getModCount() {
    return this.mods.length;
  }

  /**
   * Get the number of enabled mods in the playset
   * @returns {number} Enabled mod count
   */
  getEnabledModCount() {
    return this.getEnabledMods().length;
  }

  /**
   * Get only the enabled mods in the playset
   * @returns {Array} Array of enabled mods
   */
  getEnabledMods() {
    return this.mods.filter(mod => mod.enabled);
  }

  /**
   * Get mods sorted by load order position
   * @returns {Array} Sorted array of mods
   */
  getModsByLoadOrder() {
    return [...this.mods].sort((a, b) => a.position - b.position);
  }

  /**
   * Get enabled mods sorted by load order position
   * @returns {Array} Sorted array of enabled mods
   */
  getEnabledModsByLoadOrder() {
    return this.getEnabledMods().sort((a, b) => a.position - b.position);
  }

  /**
   * Convert to a plain object for serialization
   * @returns {Object} Plain object representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      isActive: this.isActive,
      createdOn: this.createdOn,
      updatedOn: this.updatedOn,
      mods: this.mods.map(mod => {
        if (typeof mod.toJSON === 'function') {
          return mod.toJSON();
        }
        return mod;
      })
    };
  }
}

module.exports = { Playset }; 