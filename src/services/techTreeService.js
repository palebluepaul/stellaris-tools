/**
 * Service for managing the technology tree
 */
const TechTree = require('../models/techTree');
const logger = require('../utils/logger');

class TechTreeService {
  /**
   * Creates a new TechTreeService instance
   * @param {TechService} techService The technology service
   */
  constructor(techService) {
    this._techService = techService;
    this._techTree = null;
    this._initialized = false;
  }

  /**
   * Initializes the technology tree service
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) {
      return;
    }

    logger.info('Initializing technology tree service...');
    
    // Create a new tech tree using the database from the tech service
    this._techTree = new TechTree(this._techService.getTechDatabase());
    
    // Initialize the tech tree
    await this._techTree.initialize();
    
    // Log some statistics
    logger.info(`Technology tree initialized with ${this._techTree.getRootNodes().length} root nodes`);
    logger.info(`Maximum tree depth: ${this._techTree.getMaxDepth()}`);
    logger.info(`Maximum tree width: ${this._techTree.getMaxWidth()}`);
    
    this._initialized = true;
  }

  /**
   * Gets the technology tree
   * @returns {TechTree} The technology tree
   */
  getTechTree() {
    return this._techTree;
  }

  /**
   * Gets all root nodes (technologies with no prerequisites)
   * @returns {Tech[]} Array of root node technologies
   */
  getRootTechnologies() {
    if (!this._initialized || !this._techTree) {
      return [];
    }
    
    const rootIds = this._techTree.getRootNodes();
    return rootIds.map(id => this._techService.getTechnology(id)).filter(Boolean);
  }

  /**
   * Gets all technologies at a specific depth in the tree
   * @param {number} depth The depth
   * @returns {Tech[]} Array of technologies at the specified depth
   */
  getTechnologiesAtDepth(depth) {
    if (!this._initialized || !this._techTree) {
      return [];
    }
    
    const techIds = this._techTree.getNodesAtDepth(depth);
    return techIds.map(id => this._techService.getTechnology(id)).filter(Boolean);
  }

  /**
   * Gets the children of a technology
   * @param {string} techId The technology ID
   * @returns {Tech[]} Array of child technologies
   */
  getChildTechnologies(techId) {
    if (!this._initialized || !this._techTree) {
      return [];
    }
    
    const childIds = this._techTree.getChildren(techId);
    return childIds.map(id => this._techService.getTechnology(id)).filter(Boolean);
  }

  /**
   * Gets the parents of a technology
   * @param {string} techId The technology ID
   * @returns {Tech[]} Array of parent technologies
   */
  getParentTechnologies(techId) {
    if (!this._initialized || !this._techTree) {
      return [];
    }
    
    const parentIds = this._techTree.getParents(techId);
    return parentIds.map(id => this._techService.getTechnology(id)).filter(Boolean);
  }

  /**
   * Gets the path from a technology to its furthest root
   * @param {string} techId The technology ID
   * @returns {Tech[]} Array of technologies in the path
   */
  getPathToRoot(techId) {
    if (!this._initialized || !this._techTree) {
      return [];
    }
    
    const pathIds = this._techTree.getPathToRoot(techId);
    return pathIds.map(id => this._techService.getTechnology(id)).filter(Boolean);
  }

  /**
   * Searches for technologies by name or ID
   * @param {string} query The search query
   * @returns {Tech[]} Array of matching technologies
   */
  searchTechnologies(query) {
    if (!this._initialized || !this._techTree || !query) {
      return [];
    }
    
    const resultIds = this._techTree.search(query);
    return resultIds.map(id => this._techService.getTechnology(id)).filter(Boolean);
  }

  /**
   * Gets technologies by area
   * @param {string} areaId The area ID
   * @returns {Tech[]} Array of technologies in the specified area
   */
  getTechnologiesByArea(areaId) {
    if (!this._initialized || !this._techTree) {
      return [];
    }
    
    return this._techService.getTechnologiesByArea(areaId);
  }

  /**
   * Gets technologies by category
   * @param {string} categoryId The category ID
   * @returns {Tech[]} Array of technologies in the specified category
   */
  getTechnologiesByCategory(categoryId) {
    if (!this._initialized || !this._techTree) {
      return [];
    }
    
    return this._techService.getTechnologiesByCategory(categoryId);
  }

  /**
   * Gets technologies by tier
   * @param {number} tier The tier
   * @returns {Tech[]} Array of technologies at the specified tier
   */
  getTechnologiesByTier(tier) {
    if (!this._initialized || !this._techTree) {
      return [];
    }
    
    return this._techService.getTechnologiesByTier(tier);
  }

  /**
   * Gets a technology by ID
   * @param {string} techId The technology ID
   * @returns {Tech|null} The technology or null if not found
   */
  getTechnology(techId) {
    return this._techService.getTechnology(techId);
  }

  /**
   * Gets the depth of a technology in the tree
   * @param {string} techId The technology ID
   * @returns {number} The depth of the technology
   */
  getTechnologyDepth(techId) {
    if (!this._initialized || !this._techTree) {
      return -1;
    }
    
    return this._techTree.getDepth(techId);
  }

  /**
   * Gets the maximum depth of the tree
   * @returns {number} The maximum depth
   */
  getMaxDepth() {
    if (!this._initialized || !this._techTree) {
      return 0;
    }
    
    return this._techTree.getMaxDepth();
  }

  /**
   * Gets the maximum width of the tree
   * @returns {number} The maximum width
   */
  getMaxWidth() {
    if (!this._initialized || !this._techTree) {
      return 0;
    }
    
    return this._techTree.getMaxWidth();
  }
}

module.exports = TechTreeService; 