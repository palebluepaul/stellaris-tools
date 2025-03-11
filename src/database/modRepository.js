const db = require('./connection');
const { Mod } = require('../models/mod');
const { Playset } = require('../models/playset');
const logger = require('../utils/logger');

/**
 * Repository for accessing mod data from the database
 */
const modRepository = {
  /**
   * Get all playsets that are not removed
   * @returns {Promise<Playset[]>} Array of playsets
   */
  async getAllPlaysets() {
    try {
      const playsets = await db.query(`
        SELECT * FROM playsets 
        WHERE isRemoved = 0
        ORDER BY name
      `);
      
      // For each playset, get its mods
      const result = [];
      for (const playset of playsets) {
        const mods = await this.getModsForPlayset(playset.id);
        result.push(new Playset({
          ...playset,
          mods
        }));
      }
      
      return result;
    } catch (error) {
      logger.error(`Failed to get all playsets: ${error.message}`);
      return [];
    }
  },

  /**
   * Get the active playset
   * @returns {Promise<Playset|null>} The active playset or null if not found
   */
  async getActivePlayset() {
    try {
      const playset = await db.queryOne(`
        SELECT * FROM playsets 
        WHERE isActive = 1 AND isRemoved = 0
        LIMIT 1
      `);
      
      if (!playset) {
        logger.warn('No active playset found');
        return null;
      }
      
      // Get mods for this playset
      const mods = await this.getModsForPlayset(playset.id);
      
      return new Playset({
        ...playset,
        mods
      });
    } catch (error) {
      logger.error(`Failed to get active playset: ${error.message}`);
      return null;
    }
  },

  /**
   * Get a playset by ID
   * @param {string} id Playset ID
   * @returns {Promise<Playset|null>} The playset or null if not found
   */
  async getPlaysetById(id) {
    try {
      const playset = await db.queryOne(`
        SELECT * FROM playsets 
        WHERE id = ? AND isRemoved = 0
        LIMIT 1
      `, [id]);
      
      if (!playset) {
        logger.warn(`Playset with ID ${id} not found`);
        return null;
      }
      
      // Get mods for this playset
      const mods = await this.getModsForPlayset(id);
      
      return new Playset({
        ...playset,
        mods
      });
    } catch (error) {
      logger.error(`Failed to get playset by ID ${id}: ${error.message}`);
      return null;
    }
  },

  /**
   * Get all mods
   * @returns {Promise<Mod[]>} Array of mods
   */
  async getAllMods() {
    try {
      const mods = await db.query(`
        SELECT * FROM mods
        ORDER BY name
      `);
      
      return mods.map(mod => new Mod(mod));
    } catch (error) {
      logger.error(`Failed to get all mods: ${error.message}`);
      return [];
    }
  },

  /**
   * Get a mod by ID
   * @param {string} id Mod ID
   * @returns {Promise<Mod|null>} The mod or null if not found
   */
  async getModById(id) {
    try {
      const mod = await db.queryOne(`
        SELECT * FROM mods
        WHERE id = ?
        LIMIT 1
      `, [id]);
      
      if (!mod) {
        logger.warn(`Mod with ID ${id} not found`);
        return null;
      }
      
      return new Mod(mod);
    } catch (error) {
      logger.error(`Failed to get mod by ID ${id}: ${error.message}`);
      return null;
    }
  },

  /**
   * Get all mods for a playset
   * @param {string} playsetId Playset ID
   * @returns {Promise<Mod[]>} Array of mods
   */
  async getModsForPlayset(playsetId) {
    try {
      const mods = await db.query(`
        SELECT m.*, pm.enabled, pm.position FROM mods m
        JOIN playsets_mods pm ON m.id = pm.modId
        WHERE pm.playsetId = ?
        ORDER BY pm.position
      `, [playsetId]);
      
      return mods.map(mod => new Mod(mod));
    } catch (error) {
      logger.error(`Failed to get mods for playset ${playsetId}: ${error.message}`);
      return [];
    }
  },

  /**
   * Get all enabled mods for the active playset
   * @returns {Promise<Mod[]>} Array of enabled mods
   */
  async getEnabledModsForActivePlayset() {
    try {
      const playset = await this.getActivePlayset();
      
      if (!playset) {
        logger.warn('No active playset found');
        return [];
      }
      
      return playset.getEnabledMods();
    } catch (error) {
      logger.error(`Failed to get enabled mods for active playset: ${error.message}`);
      return [];
    }
  }
};

module.exports = modRepository; 