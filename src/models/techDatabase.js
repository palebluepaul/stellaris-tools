const Tech = require('./tech');
const logger = require('../utils/logger');

/**
 * Manages a consolidated database of technologies from all sources
 */
class TechDatabase {
  /**
   * Creates a new TechDatabase instance
   */
  constructor() {
    this._technologies = new Map(); // Map of tech ID to Tech instance
    this._areas = new Map(); // Map of area ID to area name
    this._categories = new Map(); // Map of category ID to category name
    this._sourceFiles = new Map(); // Map of file path to array of tech IDs
    this._modTechs = new Map(); // Map of mod ID to array of tech IDs
    this._initialized = false;
  }

  /**
   * Initializes the technology database
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) {
      return;
    }

    // Add default areas
    this._areas.set('physics', 'Physics');
    this._areas.set('society', 'Society');
    this._areas.set('engineering', 'Engineering');

    this._initialized = true;
    logger.info('Technology database initialized');
  }

  /**
   * Adds a technology to the database
   * @param {Tech} tech Technology to add
   * @param {boolean} [overrideExisting=true] Whether to override existing technology with the same ID
   * @returns {Tech} The added or existing technology
   */
  addTechnology(tech, overrideExisting = true) {
    if (!tech || !tech.id) {
      logger.warn('Attempted to add invalid technology to database');
      return null;
    }

    const existingTech = this._technologies.get(tech.id);
    
    // If the tech already exists and we're not overriding, return the existing one
    if (existingTech && !overrideExisting) {
      return existingTech;
    }

    // Add or update the technology
    this._technologies.set(tech.id, tech);

    // Track the source file
    if (tech.sourceFile) {
      if (!this._sourceFiles.has(tech.sourceFile)) {
        this._sourceFiles.set(tech.sourceFile, []);
      }
      const techsInFile = this._sourceFiles.get(tech.sourceFile);
      if (!techsInFile.includes(tech.id)) {
        techsInFile.push(tech.id);
      }
    }

    // Track the mod
    if (tech.modId) {
      if (!this._modTechs.has(tech.modId)) {
        this._modTechs.set(tech.modId, []);
      }
      const techsInMod = this._modTechs.get(tech.modId);
      if (!techsInMod.includes(tech.id)) {
        techsInMod.push(tech.id);
      }
    }

    // Track the area
    if (tech.areaId && tech.areaName) {
      this._areas.set(tech.areaId, tech.areaName);
    }

    // Track the category
    if (tech.categoryId && tech.categoryName) {
      this._categories.set(tech.categoryId, tech.categoryName);
    }

    return tech;
  }

  /**
   * Adds multiple technologies to the database
   * @param {Tech[]} technologies Array of technologies to add
   * @param {boolean} [overrideExisting=true] Whether to override existing technologies
   * @returns {number} Number of technologies added
   */
  addTechnologies(technologies, overrideExisting = true) {
    if (!Array.isArray(technologies)) {
      logger.warn('Attempted to add non-array of technologies to database');
      return 0;
    }

    let addedCount = 0;
    for (const tech of technologies) {
      if (this.addTechnology(tech, overrideExisting)) {
        addedCount++;
      }
    }

    return addedCount;
  }

  /**
   * Gets a technology by its ID
   * @param {string} id Technology ID
   * @returns {Tech|null} The technology or null if not found
   */
  getTechnology(id) {
    return this._technologies.get(id) || null;
  }

  /**
   * Gets all technologies in the database
   * @returns {Tech[]} Array of all technologies
   */
  getAllTechnologies() {
    return Array.from(this._technologies.values());
  }

  /**
   * Gets technologies by area
   * @param {string} areaId Area ID
   * @returns {Tech[]} Array of technologies in the specified area
   */
  getTechnologiesByArea(areaId) {
    return this.getAllTechnologies().filter(tech => tech.areaId === areaId);
  }

  /**
   * Gets technologies by category
   * @param {string} categoryId Category ID
   * @returns {Tech[]} Array of technologies in the specified category
   */
  getTechnologiesByCategory(categoryId) {
    return this.getAllTechnologies().filter(tech => 
      tech.categoryId === categoryId || 
      (Array.isArray(tech.categoryId) && tech.categoryId.includes(categoryId))
    );
  }

  /**
   * Gets technologies by tier
   * @param {number} tier Tier number
   * @returns {Tech[]} Array of technologies in the specified tier
   */
  getTechnologiesByTier(tier) {
    return this.getAllTechnologies().filter(tech => tech.tier === tier);
  }

  /**
   * Gets technologies by mod
   * @param {string} modId Mod ID
   * @returns {Tech[]} Array of technologies from the specified mod
   */
  getTechnologiesByMod(modId) {
    const techIds = this._modTechs.get(modId) || [];
    return techIds.map(id => this.getTechnology(id)).filter(Boolean);
  }

  /**
   * Gets all areas in the database
   * @returns {Object[]} Array of area objects with id and name properties
   */
  getAllAreas() {
    return Array.from(this._areas.entries()).map(([id, name]) => ({ id, name }));
  }

  /**
   * Gets all categories in the database
   * @returns {Object[]} Array of category objects with id and name properties
   */
  getAllCategories() {
    return Array.from(this._categories.entries()).map(([id, name]) => ({ id, name }));
  }

  /**
   * Gets the prerequisites for a technology
   * @param {string} techId Technology ID
   * @returns {Tech[]} Array of prerequisite technologies
   */
  getPrerequisites(techId) {
    const tech = this.getTechnology(techId);
    if (!tech || !tech.prerequisites || tech.prerequisites.length === 0) {
      return [];
    }

    return tech.prerequisites
      .map(prereqId => this.getTechnology(prereqId))
      .filter(Boolean);
  }

  /**
   * Gets technologies that have the specified technology as a prerequisite
   * @param {string} techId Technology ID
   * @returns {Tech[]} Array of technologies that require the specified technology
   */
  getDependentTechnologies(techId) {
    const tech = this.getTechnology(techId);
    if (!tech) {
      return [];
    }

    return tech.getChildTechs()
      .map(childId => this.getTechnology(childId))
      .filter(Boolean);
  }

  /**
   * Builds the technology tree by establishing parent-child relationships
   */
  buildTechTree() {
    // Reset all child relationships
    for (const tech of this._technologies.values()) {
      tech._childTechs = [];
    }

    // Establish parent-child relationships
    for (const tech of this._technologies.values()) {
      if (tech.prerequisites && tech.prerequisites.length > 0) {
        for (const prereqId of tech.prerequisites) {
          const prereq = this.getTechnology(prereqId);
          if (prereq) {
            prereq.addChildTech(tech.id);
          } else {
            logger.warn(`Technology ${tech.id} has missing prerequisite: ${prereqId}`);
          }
        }
      }
    }

    logger.info('Technology tree relationships built successfully');
  }

  /**
   * Gets the total number of technologies in the database
   * @returns {number} Total number of technologies
   */
  get count() {
    return this._technologies.size;
  }

  /**
   * Clears all technologies from the database
   */
  clear() {
    this._technologies.clear();
    this._sourceFiles.clear();
    this._modTechs.clear();
    // Don't clear areas and categories as they might be reused
    logger.info('Technology database cleared');
  }
}

module.exports = TechDatabase; 