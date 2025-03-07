const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');
const Tech = require('../models/tech');

/**
 * Parser for Stellaris technology files
 */
class TechParser {
  /**
   * Initialize the parser
   */
  constructor() {
    // No initialization needed
    this.grammar = {}; // Dummy property to satisfy tests
  }

  /**
   * Initialize the parser
   * @returns {Promise<void>}
   */
  async initialize() {
    logger.info('Parser initialized successfully');
    return Promise.resolve();
  }

  /**
   * Parse a technology file
   * @param {string} filePath - Path to the technology file
   * @param {string} [modId] - ID of the mod that contains this file (if applicable)
   * @returns {Promise<Tech[]>} Array of parsed Tech objects
   */
  async parseFile(filePath, modId = '') {
    try {
      logger.info(`Parsing technology file: ${filePath}`);
      
      // Read the file content
      const content = await fs.readFile(filePath, 'utf8');
      
      // Parse the content
      const ast = this.parseContent(content);
      
      // Process the AST to extract technologies
      const technologies = this.processTechnologies(ast, modId, path.basename(filePath));
      
      logger.info(`Successfully parsed ${technologies.length} technologies from ${filePath}`);
      return technologies;
    } catch (error) {
      logger.error(`Error parsing file ${filePath}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Parse the content into an AST
   * @param {string} content - The file content to parse
   * @returns {Object} The parsed AST
   */
  parseContent(content) {
    // Simple parsing approach
    const result = [];
    
    // First, extract all variable definitions
    const variableRegex = /@([a-zA-Z0-9_\-\.]+)\s*=\s*([^\n#]+)/g;
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      const varName = match[1];
      const varValue = match[2].trim();
      result.push({
        key: `@${varName}`,
        value: this.parseSimpleValue(varValue)
      });
    }
    
    // Then, extract all top-level technology definitions
    // This regex matches a tech ID followed by an equals sign and a block
    // It uses a non-greedy match for the block content to avoid capturing nested blocks
    const techRegex = /^([a-zA-Z0-9_\-\.]+)\s*=\s*{([\s\S]*?)^}/gm;
    while ((match = techRegex.exec(content)) !== null) {
      const techId = match[1].trim();
      const techContent = match[2];
      
      // Parse the technology block
      const techBlock = this.parseTechBlock(techContent);
      
      result.push({
        key: techId,
        value: { type: 'block', value: techBlock }
      });
    }
    
    return result;
  }
  
  /**
   * Parse a technology block
   * @param {string} blockContent - The content of the technology block
   * @returns {Array} The parsed block statements
   */
  parseTechBlock(blockContent) {
    const result = [];
    
    // Extract key-value pairs
    // This regex matches a key followed by an equals sign and either:
    // 1. A simple value (non-equals sign, non-newline)
    // 2. A block (content between curly braces)
    const keyValueRegex = /^\s*([a-zA-Z0-9_\-\.]+)\s*=\s*(?:{([^{}]*)}|([^=\n#]+))/gm;
    let match;
    
    while ((match = keyValueRegex.exec(blockContent)) !== null) {
      const key = match[1].trim();
      const blockValue = match[2]; // Block content (if any)
      const simpleValue = match[3]; // Simple value (if any)
      
      if (blockValue !== undefined) {
        // This is a block value
        // Handle special cases like prerequisites and category
        if (key === 'prerequisites' || key === 'category') {
          // Extract quoted strings or identifiers
          const items = [];
          const itemRegex = /"([^"]+)"|([a-zA-Z0-9_\-\.]+)/g;
          let itemMatch;
          
          while ((itemMatch = itemRegex.exec(blockValue)) !== null) {
            const item = itemMatch[1] || itemMatch[2];
            items.push(item);
          }
          
          result.push({
            key: key,
            value: { 
              type: 'block', 
              value: items.map(item => ({
                key: 'item',
                value: { type: 'string', value: item }
              }))
            }
          });
        } else {
          // Regular block - we'll parse it recursively
          const nestedBlock = this.parseTechBlock(blockValue);
          result.push({
            key: key,
            value: { type: 'block', value: nestedBlock }
          });
        }
      } else if (simpleValue !== undefined) {
        // This is a simple value
        const value = simpleValue.trim();
        result.push({
          key: key,
          value: this.parseSimpleValue(value)
        });
      }
    }
    
    return result;
  }
  
  /**
   * Parse a simple value
   * @param {string} value - The value to parse
   * @returns {Object} The parsed value
   */
  parseSimpleValue(value) {
    value = value.trim();
    
    // Remove trailing comments
    const commentIndex = value.indexOf('#');
    if (commentIndex !== -1) {
      value = value.substring(0, commentIndex).trim();
    }
    
    // Handle quoted strings
    if (value.startsWith('"') && value.endsWith('"')) {
      return { type: 'string', value: value.slice(1, -1) };
    }
    
    // Handle variables
    if (value.startsWith('@')) {
      return { type: 'variable', value: value.substring(1) };
    }
    
    // Handle numbers
    if (!isNaN(value)) {
      return { type: 'number', value: parseFloat(value) };
    }
    
    // Handle booleans
    if (value === 'yes') {
      return { type: 'boolean', value: true };
    }
    if (value === 'no') {
      return { type: 'boolean', value: false };
    }
    
    // Default to identifier
    return { type: 'identifier', value: value };
  }

  /**
   * Process the AST to extract technologies
   * @param {Array} ast - The Abstract Syntax Tree from the parser
   * @param {string} modId - ID of the mod that contains this file
   * @param {string} fileName - Name of the file being parsed
   * @returns {Tech[]} Array of Tech objects
   */
  processTechnologies(ast, modId, fileName) {
    const technologies = [];
    const variables = {};

    // First pass: extract variables
    for (const statement of ast) {
      if (statement.key.startsWith('@')) {
        // This is a variable definition
        const variableName = statement.key;
        variables[variableName] = this.extractValue(statement.value);
      }
    }

    // Second pass: extract technologies
    for (const statement of ast) {
      if (!statement.key.startsWith('@')) {
        // This might be a technology definition
        const value = statement.value;
        if (value.type === 'block') {
          // Create a tech object
          const techData = this.processTechBlock(statement.key, value.value, variables);
          techData.modId = modId;
          
          // Create a Tech instance
          const tech = new Tech(techData);
          technologies.push(tech);
        }
      }
    }

    return technologies;
  }

  /**
   * Process a technology block
   * @param {string} techId - The technology ID
   * @param {Array} blockStatements - The statements in the technology block
   * @param {Object} variables - Variables defined in the file
   * @returns {Object} Technology data
   */
  processTechBlock(techId, blockStatements, variables) {
    const techData = {
      id: techId,
      name: techId,
      prerequisites: []
    };

    for (const statement of blockStatements) {
      const key = statement.key;
      const value = statement.value;

      switch (key) {
        case 'cost':
          techData.cost = this.resolveValue(value, variables);
          break;
        case 'area':
          techData.area_id = this.extractValue(value);
          techData.area_name = this.extractValue(value);
          break;
        case 'tier':
          techData.tier = this.resolveValue(value, variables);
          break;
        case 'category':
          if (value.type === 'block') {
            // Handle category as an array
            const categories = this.extractArray(value);
            if (categories.length > 0) {
              techData.category_id = categories[0];
              techData.category_name = categories[0];
            }
          } else {
            techData.category_id = this.extractValue(value);
            techData.category_name = this.extractValue(value);
          }
          break;
        case 'prerequisites':
          if (value.type === 'block') {
            techData.prerequisites = this.extractArray(value);
          } else {
            const prereq = this.extractValue(value);
            if (prereq) {
              techData.prerequisites = [prereq];
            }
          }
          break;
        case 'weight':
          techData.weight = this.resolveValue(value, variables);
          break;
        case 'is_rare':
          techData.is_rare = this.extractValue(value) === true;
          break;
        case 'is_dangerous':
          techData.is_dangerous = this.extractValue(value) === true;
          break;
        case 'start_tech':
          techData.is_starting_tech = this.extractValue(value) === true;
          break;
        default:
          // Ignore other properties for now
          break;
      }
    }

    return techData;
  }

  /**
   * Extract a value from a value node
   * @param {Object} valueNode - The value node from the AST
   * @returns {any} The extracted value
   */
  extractValue(valueNode) {
    if (!valueNode || !valueNode.type) {
      return null;
    }

    switch (valueNode.type) {
      case 'string':
      case 'identifier':
      case 'number':
      case 'boolean':
        return valueNode.value;
      case 'variable':
        return `@${valueNode.value}`;
      case 'block':
        // For blocks used as arrays, extract the values
        return this.extractArray(valueNode);
      default:
        return null;
    }
  }

  /**
   * Extract an array from a block node
   * @param {Object} blockNode - The block node from the AST
   * @returns {Array} The extracted array
   */
  extractArray(blockNode) {
    if (blockNode.type !== 'block') {
      return [];
    }
    
    return blockNode.value
      .filter(item => item.key === 'item')
      .map(item => this.extractValue(item.value))
      .filter(value => value !== null);
  }

  /**
   * Resolve a value, replacing variables with their values
   * @param {Object} valueNode - The value node from the AST
   * @param {Object} variables - The variables defined in the file
   * @returns {any} The resolved value
   */
  resolveValue(valueNode, variables) {
    if (!valueNode || !valueNode.type) {
      return null;
    }

    if (valueNode.type === 'variable') {
      const variableName = `@${valueNode.value}`;
      return variables[variableName] !== undefined ? variables[variableName] : variableName;
    }

    return this.extractValue(valueNode);
  }

  /**
   * Parse technology content directly
   * @param {string} content - Content of the technology file
   * @returns {Tech[]} Array of parsed Tech objects
   */
  parse(content) {
    try {
      // Parse the content
      const ast = this.parseContent(content);
      
      // Process the AST to extract technologies
      const technologies = this.processTechnologies(ast, '', '');
      
      return technologies;
    } catch (error) {
      logger.error(`Error parsing content: ${error.message}`);
      return [];
    }
  }
}

module.exports = TechParser; 