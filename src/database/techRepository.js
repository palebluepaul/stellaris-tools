const { db } = require('./connection');
const logger = require('../utils/logger');
const Tech = require('../models/tech');

/**
 * Repository for accessing technology data from the database
 */
class TechRepository {
  /**
   * Retrieves all technologies from the database
   * @param {string} [modId] Optional mod ID to filter technologies by mod
   * @returns {Promise<Tech[]>} Array of Tech objects
   */
  async getAllTechnologies(modId = null) {
    try {
      let query = `
        SELECT t.*, a.name as area_name, c.name as category_name
        FROM technologies t
        LEFT JOIN tech_areas a ON t.area_id = a.id
        LEFT JOIN tech_categories c ON t.category_id = c.id
      `;
      
      const params = [];
      
      if (modId) {
        query += ' WHERE t.mod_id = ?';
        params.push(modId);
      }
      
      const rows = await db.all(query, params);
      return rows.map(row => new Tech(row));
    } catch (error) {
      logger.error(`Failed to retrieve technologies: ${error.message}`);
      return [];
    }
  }

  /**
   * Retrieves a technology by its ID
   * @param {string} id Technology ID
   * @returns {Promise<Tech|null>} Tech object or null if not found
   */
  async getTechById(id) {
    try {
      const query = `
        SELECT t.*, a.name as area_name, c.name as category_name
        FROM technologies t
        LEFT JOIN tech_areas a ON t.area_id = a.id
        LEFT JOIN tech_categories c ON t.category_id = c.id
        WHERE t.id = ?
      `;
      
      const row = await db.get(query, [id]);
      return row ? new Tech(row) : null;
    } catch (error) {
      logger.error(`Failed to retrieve technology with ID ${id}: ${error.message}`);
      return null;
    }
  }

  /**
   * Retrieves all technologies for a specific area
   * @param {string} areaId Area ID
   * @returns {Promise<Tech[]>} Array of Tech objects
   */
  async getTechnologiesByArea(areaId) {
    try {
      const query = `
        SELECT t.*, a.name as area_name, c.name as category_name
        FROM technologies t
        LEFT JOIN tech_areas a ON t.area_id = a.id
        LEFT JOIN tech_categories c ON t.category_id = c.id
        WHERE t.area_id = ?
      `;
      
      const rows = await db.all(query, [areaId]);
      return rows.map(row => new Tech(row));
    } catch (error) {
      logger.error(`Failed to retrieve technologies for area ${areaId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Retrieves all technologies for a specific category
   * @param {string} categoryId Category ID
   * @returns {Promise<Tech[]>} Array of Tech objects
   */
  async getTechnologiesByCategory(categoryId) {
    try {
      const query = `
        SELECT t.*, a.name as area_name, c.name as category_name
        FROM technologies t
        LEFT JOIN tech_areas a ON t.area_id = a.id
        LEFT JOIN tech_categories c ON t.category_id = c.id
        WHERE t.category_id = ?
      `;
      
      const rows = await db.all(query, [categoryId]);
      return rows.map(row => new Tech(row));
    } catch (error) {
      logger.error(`Failed to retrieve technologies for category ${categoryId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Retrieves all technology areas
   * @returns {Promise<Array>} Array of area objects
   */
  async getAllAreas() {
    try {
      const query = 'SELECT * FROM tech_areas';
      return await db.all(query);
    } catch (error) {
      logger.error(`Failed to retrieve technology areas: ${error.message}`);
      return [];
    }
  }

  /**
   * Retrieves all technology categories
   * @returns {Promise<Array>} Array of category objects
   */
  async getAllCategories() {
    try {
      const query = 'SELECT * FROM tech_categories';
      return await db.all(query);
    } catch (error) {
      logger.error(`Failed to retrieve technology categories: ${error.message}`);
      return [];
    }
  }

  /**
   * Retrieves all prerequisites for a technology
   * @param {string} techId Technology ID
   * @returns {Promise<Tech[]>} Array of Tech objects that are prerequisites
   */
  async getPrerequisitesForTech(techId) {
    try {
      const query = `
        SELECT t.*, a.name as area_name, c.name as category_name
        FROM tech_prerequisites p
        JOIN technologies t ON p.prerequisite_id = t.id
        LEFT JOIN tech_areas a ON t.area_id = a.id
        LEFT JOIN tech_categories c ON t.category_id = c.id
        WHERE p.tech_id = ?
      `;
      
      const rows = await db.all(query, [techId]);
      return rows.map(row => new Tech(row));
    } catch (error) {
      logger.error(`Failed to retrieve prerequisites for technology ${techId}: ${error.message}`);
      return [];
    }
  }

  /**
   * Retrieves all technologies that have the specified technology as a prerequisite
   * @param {string} techId Technology ID
   * @returns {Promise<Tech[]>} Array of Tech objects that require this tech
   */
  async getTechnologiesRequiringTech(techId) {
    try {
      const query = `
        SELECT t.*, a.name as area_name, c.name as category_name
        FROM tech_prerequisites p
        JOIN technologies t ON p.tech_id = t.id
        LEFT JOIN tech_areas a ON t.area_id = a.id
        LEFT JOIN tech_categories c ON t.category_id = c.id
        WHERE p.prerequisite_id = ?
      `;
      
      const rows = await db.all(query, [techId]);
      return rows.map(row => new Tech(row));
    } catch (error) {
      logger.error(`Failed to retrieve technologies requiring ${techId}: ${error.message}`);
      return [];
    }
  }
}

module.exports = new TechRepository(); 