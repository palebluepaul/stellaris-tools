/**
 * Database utility functions for the application
 * Handles SQLite database operations for the Stellaris launcher database
 */
const sqlite3 = require('sqlite3').verbose();
const logger = require('./logger');
const config = require('../config/config');

/**
 * Open the Stellaris launcher database
 * @returns {Promise<sqlite3.Database>} A promise that resolves to the database connection
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    logger.debug(`Opening database at: ${config.launcherDbPath}`);
    
    const db = new sqlite3.Database(config.launcherDbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        logger.error(`Error opening database: ${err.message}`, { error: err });
        reject(err);
        return;
      }
      
      logger.info('Successfully connected to the Stellaris launcher database');
      resolve(db);
    });
  });
}

/**
 * Close the database connection
 * @param {sqlite3.Database} db - The database connection to close
 * @returns {Promise<void>} A promise that resolves when the database is closed
 */
function closeDatabase(db) {
  return new Promise((resolve, reject) => {
    logger.debug('Closing database connection');
    
    db.close((err) => {
      if (err) {
        logger.error(`Error closing database: ${err.message}`, { error: err });
        reject(err);
        return;
      }
      
      logger.info('Database connection closed');
      resolve();
    });
  });
}

/**
 * Execute a query on the database
 * @param {sqlite3.Database} db - The database connection
 * @param {string} query - The SQL query to execute
 * @param {Array} params - The parameters for the query
 * @returns {Promise<Array>} A promise that resolves to the query results
 */
function executeQuery(db, query, params = []) {
  return new Promise((resolve, reject) => {
    logger.debug(`Executing query: ${query}`, { params });
    
    db.all(query, params, (err, rows) => {
      if (err) {
        logger.error(`Error executing query: ${err.message}`, { error: err, query, params });
        reject(err);
        return;
      }
      
      logger.debug(`Query returned ${rows.length} rows`);
      resolve(rows);
    });
  });
}

/**
 * Get the active playset from the database
 * @param {sqlite3.Database} db - The database connection
 * @returns {Promise<Object|null>} A promise that resolves to the active playset or null if not found
 */
async function getActivePlayset(db) {
  try {
    logger.debug('Getting active playset');
    
    const playsets = await executeQuery(db, 'SELECT * FROM playsets WHERE isActive = 1');
    
    if (playsets.length === 0) {
      logger.warn('No active playset found, looking for default playset');
      const defaultPlaysets = await executeQuery(db, 'SELECT * FROM playsets WHERE name = ?', ['Default']);
      
      if (defaultPlaysets.length === 0) {
        logger.error('No active or default playset found');
        return null;
      }
      
      logger.info(`Using default playset: ${defaultPlaysets[0].name}`);
      return defaultPlaysets[0];
    }
    
    logger.info(`Found active playset: ${playsets[0].name}`);
    return playsets[0];
  } catch (error) {
    logger.error(`Error getting active playset: ${error.message}`, { error });
    throw error;
  }
}

/**
 * Get mods for a playset
 * @param {sqlite3.Database} db - The database connection
 * @param {string} playsetId - The ID of the playset
 * @returns {Promise<Array>} A promise that resolves to an array of mods
 */
async function getPlaysetMods(db, playsetId) {
  try {
    logger.debug(`Getting mods for playset: ${playsetId}`);
    
    const mods = await executeQuery(
      db,
      `SELECT pm.*, m.displayName, m.requiredVersion, m.dirPath, m.gameRegistryId 
       FROM playsets_mods pm 
       JOIN mods m ON pm.modId = m.id 
       WHERE pm.playsetId = ? 
       ORDER BY pm.position`,
      [playsetId]
    );
    
    logger.info(`Found ${mods.length} mods for playset ${playsetId}`);
    return mods;
  } catch (error) {
    logger.error(`Error getting mods for playset ${playsetId}: ${error.message}`, { error });
    throw error;
  }
}

module.exports = {
  openDatabase,
  closeDatabase,
  executeQuery,
  getActivePlayset,
  getPlaysetMods
}; 