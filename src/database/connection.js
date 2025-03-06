/**
 * Database connection module for SQLite
 * Manages database connections and provides methods for executing queries
 */

const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');
const gamePathDetector = require('../utils/gamePathDetector');
const logger = require('../utils/logger');

/**
 * Database connection module
 */
const db = {
  /**
   * The database connection
   * @type {sqlite.Database}
   */
  db: null,

  /**
   * Whether the database is connected
   * @type {boolean}
   */
  isConnected: false,

  /**
   * Connect to the database
   * @param {string} [dbPath] - Path to the database file. If not provided, will use the launcher database path
   * @returns {Promise<boolean>} - Whether the connection was successful
   */
  async connect(dbPath) {
    // If already connected, return true
    if (this.isConnected && this.db) {
      return true;
    }

    try {
      // If no path provided, get the launcher database path
      if (!dbPath) {
        // Initialize the game path detector
        await gamePathDetector.initialize();
        
        dbPath = await gamePathDetector.getLauncherDbPath();
        if (!dbPath) {
          logger.error('Failed to get launcher database path');
          return false;
        }
      }

      logger.debug(`Connecting to database at ${dbPath}`);
      
      // Open the database connection
      this.db = await sqlite.open({
        filename: dbPath,
        driver: sqlite3.verbose().Database,
        mode: sqlite3.OPEN_READONLY // Open in read-only mode
      });
      
      this.isConnected = true;
      logger.debug('Connected to database');
      return true;
    } catch (error) {
      logger.error(`Failed to connect to database: ${error.message}`);
      this.isConnected = false;
      this.db = null;
      return false;
    }
  },

  /**
   * Disconnect from the database
   * @returns {Promise<boolean>} - Whether the disconnection was successful
   */
  async disconnect() {
    if (!this.isConnected || !this.db) {
      return true;
    }

    try {
      await this.db.close();
      this.isConnected = false;
      this.db = null;
      logger.debug('Disconnected from database');
      return true;
    } catch (error) {
      logger.error(`Failed to disconnect from database: ${error.message}`);
      return false;
    }
  },

  /**
   * Execute a query and return all results
   * @param {string} sql - The SQL query to execute
   * @param {Object|Array} [params={}] - The parameters for the query
   * @returns {Promise<Array>} - The query results
   * @throws {Error} - If the query fails
   */
  async query(sql, params = {}) {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Not connected to database');
      }
    }

    try {
      logger.debug(`Executing query: ${sql}`);
      return await this.db.all(sql, params);
    } catch (error) {
      logger.error(`Query failed: ${error.message}`);
      throw error;
    }
  },

  /**
   * Execute a query and return the first result
   * @param {string} sql - The SQL query to execute
   * @param {Object|Array} [params={}] - The parameters for the query
   * @returns {Promise<Object>} - The first query result
   * @throws {Error} - If the query fails
   */
  async queryOne(sql, params = {}) {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        throw new Error('Not connected to database');
      }
    }

    try {
      logger.debug(`Executing query: ${sql}`);
      return await this.db.get(sql, params);
    } catch (error) {
      logger.error(`Query failed: ${error.message}`);
      throw error;
    }
  }
};

module.exports = db; 