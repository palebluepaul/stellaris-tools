/**
 * Represents a technology tree structure
 */
class TechTree {
  /**
   * Creates a new TechTree instance
   * @param {TechDatabase} techDatabase The technology database
   */
  constructor(techDatabase) {
    this._techDatabase = techDatabase;
    this._rootNodes = []; // Technologies with no prerequisites
    this._nodeMap = new Map(); // Map of tech ID to node object
    this._initialized = false;
    this._maxDepth = 0; // Maximum depth of the tree
    this._maxWidth = 0; // Maximum width of the tree at any level
    this._depthMap = new Map(); // Map of depth to array of nodes at that depth
  }

  /**
   * Initializes the technology tree
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this._initialized) {
      return;
    }

    // Build the tree structure
    await this._buildTree();
    
    // Calculate layout metrics
    this._calculateMetrics();
    
    this._initialized = true;
  }

  /**
   * Builds the tree structure from the technology database
   * @private
   */
  async _buildTree() {
    // Get all technologies from the database
    const allTechs = this._techDatabase.getAllTechnologies();
    
    // Create nodes for all technologies
    for (const tech of allTechs) {
      this._nodeMap.set(tech.id, {
        tech,
        children: [], // Technologies that have this as a prerequisite
        parents: [], // Technologies that are prerequisites for this
        depth: 0, // Depth in the tree (0 for root nodes)
        position: { x: 0, y: 0 } // Position for visualization
      });
    }
    
    // Build relationships between nodes
    for (const tech of allTechs) {
      const node = this._nodeMap.get(tech.id);
      
      // Add parent-child relationships
      for (const prereqId of tech.prerequisites) {
        const prereqNode = this._nodeMap.get(prereqId);
        
        if (prereqNode) {
          // Add this tech as a child of its prerequisite
          prereqNode.children.push(tech.id);
          
          // Add the prerequisite as a parent of this tech
          node.parents.push(prereqId);
        }
      }
      
      // If this tech has no prerequisites, it's a root node
      if (tech.prerequisites.length === 0) {
        this._rootNodes.push(tech.id);
      }
    }
    
    // Calculate depth for each node using breadth-first traversal
    this._calculateDepth();
  }

  /**
   * Calculates the depth of each node in the tree
   * @private
   */
  _calculateDepth() {
    // Initialize queue with root nodes
    const queue = [...this._rootNodes.map(id => ({ id, depth: 0 }))];
    const visited = new Set();
    
    // Process queue
    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      
      // Skip if already visited with equal or greater depth
      if (visited.has(id) && this._nodeMap.get(id).depth >= depth) {
        continue;
      }
      
      // Update node depth
      const node = this._nodeMap.get(id);
      node.depth = Math.max(node.depth, depth);
      visited.add(id);
      
      // Add children to queue with incremented depth
      for (const childId of node.children) {
        queue.push({ id: childId, depth: depth + 1 });
      }
    }
    
    // Group nodes by depth
    this._depthMap.clear();
    for (const [id, node] of this._nodeMap.entries()) {
      if (!this._depthMap.has(node.depth)) {
        this._depthMap.set(node.depth, []);
      }
      this._depthMap.get(node.depth).push(id);
    }
  }

  /**
   * Calculates metrics for the tree
   * @private
   */
  _calculateMetrics() {
    // Calculate maximum depth
    this._maxDepth = 0;
    for (const [depth] of this._depthMap.entries()) {
      this._maxDepth = Math.max(this._maxDepth, depth);
    }
    
    // Calculate maximum width
    this._maxWidth = 0;
    for (const [, nodes] of this._depthMap.entries()) {
      this._maxWidth = Math.max(this._maxWidth, nodes.length);
    }
  }

  /**
   * Gets all root nodes (technologies with no prerequisites)
   * @returns {string[]} Array of root node technology IDs
   */
  getRootNodes() {
    return [...this._rootNodes];
  }

  /**
   * Gets all nodes at a specific depth
   * @param {number} depth The depth to get nodes for
   * @returns {string[]} Array of technology IDs at the specified depth
   */
  getNodesAtDepth(depth) {
    return this._depthMap.has(depth) ? [...this._depthMap.get(depth)] : [];
  }

  /**
   * Gets the children of a node
   * @param {string} techId The technology ID
   * @returns {string[]} Array of child technology IDs
   */
  getChildren(techId) {
    const node = this._nodeMap.get(techId);
    return node ? [...node.children] : [];
  }

  /**
   * Gets the parents of a node
   * @param {string} techId The technology ID
   * @returns {string[]} Array of parent technology IDs
   */
  getParents(techId) {
    const node = this._nodeMap.get(techId);
    return node ? [...node.parents] : [];
  }

  /**
   * Gets the depth of a node
   * @param {string} techId The technology ID
   * @returns {number} The depth of the node
   */
  getDepth(techId) {
    const node = this._nodeMap.get(techId);
    return node ? node.depth : -1;
  }

  /**
   * Gets the maximum depth of the tree
   * @returns {number} The maximum depth
   */
  getMaxDepth() {
    return this._maxDepth;
  }

  /**
   * Gets the maximum width of the tree
   * @returns {number} The maximum width
   */
  getMaxWidth() {
    return this._maxWidth;
  }

  /**
   * Gets all technologies in a specific area
   * @param {string} areaId The area ID
   * @returns {string[]} Array of technology IDs in the specified area
   */
  getTechnologiesByArea(areaId) {
    const techs = this._techDatabase.getTechnologiesByArea(areaId);
    return techs.map(tech => tech.id);
  }

  /**
   * Gets all technologies in a specific category
   * @param {string} categoryId The category ID
   * @returns {string[]} Array of technology IDs in the specified category
   */
  getTechnologiesByCategory(categoryId) {
    const techs = this._techDatabase.getTechnologiesByCategory(categoryId);
    return techs.map(tech => tech.id);
  }

  /**
   * Gets all technologies at a specific tier
   * @param {number} tier The tier
   * @returns {string[]} Array of technology IDs at the specified tier
   */
  getTechnologiesByTier(tier) {
    const techs = this._techDatabase.getTechnologiesByTier(tier);
    return techs.map(tech => tech.id);
  }

  /**
   * Gets a node by its technology ID
   * @param {string} techId The technology ID
   * @returns {Object|null} The node or null if not found
   */
  getNode(techId) {
    return this._nodeMap.get(techId) || null;
  }

  /**
   * Gets all nodes in the tree
   * @returns {Map<string, Object>} Map of technology ID to node
   */
  getAllNodes() {
    return new Map(this._nodeMap);
  }

  /**
   * Gets the path from a technology to its furthest root
   * @param {string} techId The technology ID
   * @returns {string[]} Array of technology IDs in the path
   */
  getPathToRoot(techId) {
    const path = [];
    let currentId = techId;
    
    while (currentId) {
      path.push(currentId);
      
      // Get parents of current node
      const node = this._nodeMap.get(currentId);
      if (!node || node.parents.length === 0) {
        break;
      }
      
      // Find the parent with the highest depth (furthest from root)
      let highestParent = null;
      let highestDepth = -1;
      
      for (const parentId of node.parents) {
        const parentNode = this._nodeMap.get(parentId);
        if (parentNode && parentNode.depth < node.depth && parentNode.depth > highestDepth) {
          highestParent = parentId;
          highestDepth = parentNode.depth;
        }
      }
      
      currentId = highestParent;
    }
    
    return path.reverse();
  }

  /**
   * Searches for technologies by name or ID
   * @param {string} query The search query
   * @returns {string[]} Array of matching technology IDs
   */
  search(query) {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const results = [];
    
    for (const [id, node] of this._nodeMap.entries()) {
      const tech = node.tech;
      
      // Check if the query matches the ID, name, display name, or area name
      if (tech.id.toLowerCase().includes(normalizedQuery) || 
          tech.name.toLowerCase().includes(normalizedQuery) ||
          tech.displayName.toLowerCase().includes(normalizedQuery) ||
          tech.areaName.toLowerCase().includes(normalizedQuery)) {
        results.push(id);
      }
    }
    
    return results;
  }
}

module.exports = TechTree; 