/**
 * Represents a Stellaris technology
 */
class Tech {
  /**
   * Creates a new Tech instance
   * @param {Object} data Technology data
   */
  constructor(data = {}) {
    // Basic identification
    this.id = data.id || '';
    this.name = data.name || '';
    this.displayName = data.display_name || data.name || '';
    this.description = data.description || '';
    
    // Classification
    this.areaId = data.area_id || '';
    this.areaName = data.area_name || '';
    this.categoryId = data.category_id || '';
    this.categoryName = data.category_name || '';
    this.tier = data.tier || 0;
    
    // Research properties
    this.cost = data.cost || 0;
    this.costMultiplier = data.cost_multiplier || 1.0;
    this.weight = data.weight || 0;
    this.isStartingTech = data.is_starting_tech || false;
    this.isRare = data.is_rare || false;
    this.isDangerous = data.is_dangerous || false;
    
    // Source tracking
    this.modId = data.mod_id || '';
    this.sourceFile = data.source_file || '';
    this.sourceModName = data.source_mod_name || '';
    
    // Relationships
    this.prerequisites = data.prerequisites || [];
    this.unlocks = data.unlocks || [];
    
    // Visual properties
    this.icon = data.icon || '';
    
    // Additional properties
    this.potential = data.potential || null;
    this.weightModifiers = data.weight_modifiers || [];
    this.aiWeight = data.ai_weight || null;
    this.startingPotential = data.starting_potential || null;
    this.prereqForDesc = data.prereq_for_desc || null;
    
    // Research status (for integration with save games later)
    this.isResearched = data.is_researched || false;
    this.researchProgress = data.research_progress || 0;
    this.isResearchable = data.is_researchable || false;
    
    // Computed properties (populated after all techs are loaded)
    this._childTechs = []; // Technologies that have this as a prerequisite
  }

  /**
   * Gets the effective cost of the technology
   * @returns {number} The effective cost
   */
  getEffectiveCost() {
    return Math.round(this.cost * this.costMultiplier);
  }

  /**
   * Checks if the technology is in the physics area
   * @returns {boolean} True if the technology is in the physics area
   */
  isPhysics() {
    return this.areaId === 'physics' || this.areaName.toLowerCase() === 'physics';
  }

  /**
   * Checks if the technology is in the society area
   * @returns {boolean} True if the technology is in the society area
   */
  isSociety() {
    return this.areaId === 'society' || this.areaName.toLowerCase() === 'society';
  }

  /**
   * Checks if the technology is in the engineering area
   * @returns {boolean} True if the technology is in the engineering area
   */
  isEngineering() {
    return this.areaId === 'engineering' || this.areaName.toLowerCase() === 'engineering';
  }

  /**
   * Adds a child technology (a tech that has this as a prerequisite)
   * @param {string} techId The ID of the child technology
   */
  addChildTech(techId) {
    if (!this._childTechs.includes(techId)) {
      this._childTechs.push(techId);
    }
  }

  /**
   * Gets all child technologies (techs that have this as a prerequisite)
   * @returns {string[]} Array of child technology IDs
   */
  getChildTechs() {
    return [...this._childTechs];
  }

  /**
   * Checks if all prerequisites are researched
   * @param {Map<string, Tech>} techMap Map of all technologies
   * @returns {boolean} True if all prerequisites are researched or there are no prerequisites
   */
  areAllPrerequisitesResearched(techMap) {
    if (!this.prerequisites || this.prerequisites.length === 0) {
      return true;
    }
    
    return this.prerequisites.every(prereqId => {
      const prereq = techMap.get(prereqId);
      return prereq && prereq.isResearched;
    });
  }

  /**
   * Converts the tech instance to a plain object
   * @returns {Object} Plain object representation of the tech
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      areaId: this.areaId,
      areaName: this.areaName,
      categoryId: this.categoryId,
      categoryName: this.categoryName,
      tier: this.tier,
      cost: this.cost,
      costMultiplier: this.costMultiplier,
      weight: this.weight,
      isStartingTech: this.isStartingTech,
      isRare: this.isRare,
      isDangerous: this.isDangerous,
      modId: this.modId,
      sourceFile: this.sourceFile,
      sourceModName: this.sourceModName,
      prerequisites: this.prerequisites,
      unlocks: this.unlocks,
      icon: this.icon,
      potential: this.potential,
      weightModifiers: this.weightModifiers,
      aiWeight: this.aiWeight,
      startingPotential: this.startingPotential,
      prereqForDesc: this.prereqForDesc,
      isResearched: this.isResearched,
      researchProgress: this.researchProgress,
      isResearchable: this.isResearchable,
      childTechs: this.getChildTechs()
    };
  }
}

module.exports = Tech; 