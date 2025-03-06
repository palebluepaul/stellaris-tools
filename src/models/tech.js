/**
 * Represents a Stellaris technology
 */
class Tech {
  /**
   * Creates a new Tech instance
   * @param {Object} data Technology data
   */
  constructor(data = {}) {
    this.id = data.id || '';
    this.name = data.name || '';
    this.displayName = data.display_name || data.name || '';
    this.description = data.description || '';
    this.areaId = data.area_id || '';
    this.areaName = data.area_name || '';
    this.categoryId = data.category_id || '';
    this.categoryName = data.category_name || '';
    this.tier = data.tier || 0;
    this.cost = data.cost || 0;
    this.costMultiplier = data.cost_multiplier || 1.0;
    this.weight = data.weight || 0;
    this.isStartingTech = data.is_starting_tech || false;
    this.isRare = data.is_rare || false;
    this.isDangerous = data.is_dangerous || false;
    this.modId = data.mod_id || '';
    this.prerequisites = data.prerequisites || [];
    this.unlocks = data.unlocks || [];
    this.icon = data.icon || '';
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
      prerequisites: this.prerequisites,
      unlocks: this.unlocks,
      icon: this.icon
    };
  }
}

module.exports = Tech; 