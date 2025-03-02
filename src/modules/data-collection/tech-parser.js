/**
 * Technology parser module
 * Parses Stellaris technology files and extracts technology data
 */
const fs = require('fs-extra');
const path = require('path');
const logger = require('../../utils/logger');

/**
 * Parse a nested block of content
 * @param {string} content - The content to parse
 * @returns {Object} Parsed content as an object
 */
function parseNestedBlock(content) {
  const result = {};
  let currentKey = null;
  let currentValue = '';
  let nestedLevel = 0;
  let inQuotes = false;
  
  // Split content into lines and process each line
  const lines = content.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments
    if (!line || line.startsWith('#')) {
      continue;
    }
    
    // Process the line character by character
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      // Handle quotes
      if (char === '"' && (j === 0 || line[j-1] !== '\\')) {
        inQuotes = !inQuotes;
        currentValue += char;
        continue;
      }
      
      // If in quotes, just add the character
      if (inQuotes) {
        currentValue += char;
        continue;
      }
      
      // Handle opening braces
      if (char === '{') {
        nestedLevel++;
        currentValue += char;
        continue;
      }
      
      // Handle closing braces
      if (char === '}') {
        nestedLevel--;
        currentValue += char;
        
        // If we're back to the top level, store the current key-value pair
        if (nestedLevel === 0 && currentKey) {
          result[currentKey] = currentValue.trim();
          currentKey = null;
          currentValue = '';
        }
        continue;
      }
      
      // Handle equals sign at the top level
      if (char === '=' && nestedLevel === 0) {
        currentKey = currentValue.trim();
        currentValue = '';
        continue;
      }
      
      // Add the character to the current value
      currentValue += char;
    }
  }
  
  // Handle any remaining key-value pair
  if (currentKey && currentValue) {
    result[currentKey] = currentValue.trim();
  }
  
  return result;
}

/**
 * Parse prerequisites from a prerequisites block
 * @param {string} content - The prerequisites block content
 * @returns {Array} Array of prerequisite technology IDs
 */
function parsePrerequisites(content) {
  // Handle simple space-separated list
  if (!content.includes('{')) {
    // Handle quoted prerequisites like "tech_corvettes"
    const quotedPrereqs = content.match(/"([^"]+)"/g);
    if (quotedPrereqs) {
      return quotedPrereqs.map(p => p.replace(/"/g, ''));
    }
    return content.split(/\s+/).filter(Boolean);
  }
  
  // Handle complex prerequisites with AND/OR/NOT conditions
  const prerequisites = [];
  
  // Extract OR conditions
  const orMatch = content.match(/OR\s*=\s*{([^}]*)}/);
  if (orMatch) {
    const orContent = orMatch[1];
    // Extract individual techs from OR block - handle quoted and unquoted
    const orTechs = orContent.match(/["']?(\w+)["']?/g);
    if (orTechs) {
      prerequisites.push({
        type: 'OR',
        techs: orTechs.map(t => t.replace(/["']/g, ''))
      });
    }
  }
  
  // Extract AND conditions
  const andMatch = content.match(/AND\s*=\s*{([^}]*)}/);
  if (andMatch) {
    const andContent = andMatch[1];
    // Extract individual techs from AND block - handle quoted and unquoted
    const andTechs = andContent.match(/["']?(\w+)["']?/g);
    if (andTechs) {
      prerequisites.push({
        type: 'AND',
        techs: andTechs.map(t => t.replace(/["']/g, ''))
      });
    }
  }
  
  // Extract NOT conditions
  const notMatch = content.match(/NOT\s*=\s*{([^}]*)}/);
  if (notMatch) {
    const notContent = notMatch[1];
    // Extract individual techs from NOT block - handle quoted and unquoted
    const notTechs = notContent.match(/["']?(\w+)["']?/g);
    if (notTechs) {
      prerequisites.push({
        type: 'NOT',
        techs: notTechs.map(t => t.replace(/["']/g, ''))
      });
    }
  }
  
  // Extract direct prerequisites (not in a condition block)
  // First try to match quoted prerequisites
  const quotedDirectTechs = content.match(/["'](\w+)["']/g);
  if (quotedDirectTechs) {
    prerequisites.push(...quotedDirectTechs.map(tech => tech.replace(/["']/g, '')));
  }
  
  // Then try to match unquoted prerequisites
  const directTechs = content.match(/(?<!OR|AND|NOT|=)\s+(\w+)(?!\s*=)/g);
  if (directTechs) {
    prerequisites.push(...directTechs.map(tech => tech.trim()).filter(Boolean));
  }
  
  return prerequisites;
}

/**
 * Parse weight modifiers from a weight_modifier block
 * @param {string} content - The weight_modifier block content
 * @returns {Object} Parsed weight modifiers
 */
function parseWeightModifiers(content) {
  const modifiers = [];
  
  // Extract factor modifiers
  const factorMatches = content.match(/factor\s*=\s*(\d+(\.\d+)?)/g);
  if (factorMatches) {
    for (const match of factorMatches) {
      const factor = parseFloat(match.split('=')[1].trim());
      modifiers.push({ type: 'factor', value: factor });
    }
  }
  
  // Extract conditional modifiers
  const conditionBlocks = content.match(/(\w+)\s*=\s*{([^}]*)}/g);
  if (conditionBlocks) {
    for (const block of conditionBlocks) {
      // Skip factor blocks as they're already processed
      if (block.trim().startsWith('factor')) {
        continue;
      }
      
      const conditionMatch = block.match(/(\w+)\s*=\s*{([^}]*)}/);
      if (conditionMatch) {
        const condition = conditionMatch[1];
        const conditionContent = conditionMatch[2];
        
        // Extract the factor for this condition
        const factorMatch = conditionContent.match(/factor\s*=\s*(\d+(\.\d+)?)/);
        const factor = factorMatch ? parseFloat(factorMatch[1]) : 1;
        
        modifiers.push({
          type: 'condition',
          condition,
          content: conditionContent,
          factor
        });
      }
    }
  }
  
  return modifiers;
}

/**
 * Parse effects from a technology block
 * @param {string} content - The technology block content
 * @returns {Object} Parsed effects
 */
function parseEffects(content) {
  const effects = {
    modifiers: [],
    unlocks: [],
    other: []
  };
  
  // Extract gateway information
  const gatewayMatch = content.match(/gateway\s*=\s*(\w+)/);
  if (gatewayMatch) {
    effects.other.push({
      type: 'gateway',
      id: gatewayMatch[1]
    });
  }
  
  // Extract modifier block
  const modifierMatch = content.match(/modifier\s*=\s*{([^}]*)}/);
  if (modifierMatch) {
    const modifierContent = modifierMatch[1];
    
    // Extract individual modifiers
    const modifierEntries = modifierContent.match(/(\w+)\s*=\s*([^{\n]+)/g);
    if (modifierEntries) {
      for (const entry of modifierEntries) {
        const [key, value] = entry.split('=').map(part => part.trim());
        effects.modifiers.push({ key, value });
      }
    }
  }
  
  // Extract command_limit_add
  const commandLimitMatch = content.match(/command_limit_add\s*=\s*(\d+)/);
  if (commandLimitMatch) {
    effects.modifiers.push({
      key: 'command_limit_add',
      value: commandLimitMatch[1]
    });
  }
  
  // Extract unlocks (buildings, components, etc.)
  const unlockPatterns = [
    { pattern: /unlock_building\s*=\s*(\w+)/g, type: 'building' },
    { pattern: /unlock_component\s*=\s*(\w+)/g, type: 'component' },
    { pattern: /unlock_feature\s*=\s*(\w+)/g, type: 'feature' },
    { pattern: /unlock_spaceport_module\s*=\s*(\w+)/g, type: 'spaceport_module' },
    { pattern: /gateway\s*=\s*(\w+)/g, type: 'gateway' },
    { pattern: /unlock_ship_size\s*=\s*(\w+)/g, type: 'ship_size' },
    { pattern: /ship_size\s*=\s*(\w+)/g, type: 'ship_size' },
    { pattern: /unlock\s+(\w+)/g, type: 'generic' }
  ];
  
  for (const { pattern, type } of unlockPatterns) {
    const matches = [...content.matchAll(pattern)];
    for (const match of matches) {
      effects.unlocks.push({ type, id: match[1] });
    }
  }
  
  // Extract add_modifier directives
  const addModifierPattern = /add_modifier\s*=\s*{\s*modifier\s*=\s*"?(\w+)"?\s*}/g;
  const addModifierMatches = [...content.matchAll(addModifierPattern)];
  for (const match of addModifierMatches) {
    effects.modifiers.push({ key: 'add_modifier', value: match[1] });
  }
  
  // Extract prereqfor_desc block which indicates what this tech unlocks
  const prereqforDescMatch = content.match(/prereqfor_desc\s*=\s*{([^}]*(?:\{[^}]*\}[^}]*)*)\}/);
  if (prereqforDescMatch) {
    const prereqContent = prereqforDescMatch[1];
    
    // Extract ship unlocks
    const shipMatch = prereqContent.match(/ship\s*=\s*{([^}]*)}/);
    if (shipMatch) {
      const shipContent = shipMatch[1];
      const titleMatch = shipContent.match(/title\s*=\s*"([^"]+)"/);
      const descMatch = shipContent.match(/desc\s*=\s*"([^"]+)"/);
      
      if (titleMatch && descMatch) {
        effects.unlocks.push({
          type: 'ship_construction',
          title: titleMatch[1],
          description: descMatch[1]
        });
      }
    }
    
    // Extract custom unlocks
    const customMatch = prereqContent.match(/custom\s*=\s*{([^}]*)}/);
    if (customMatch) {
      const customContent = customMatch[1];
      const titleMatch = customContent.match(/title\s*=\s*"([^"]+)"/);
      const descMatch = customContent.match(/desc\s*=\s*"([^"]+)"/);
      
      if (titleMatch && descMatch) {
        effects.unlocks.push({
          type: 'custom',
          title: titleMatch[1],
          description: descMatch[1]
        });
      }
    }
  }
  
  // Extract other common effects
  const otherEffectPatterns = [
    { pattern: /\bunlock_terraforming\b/g, type: 'terraforming' },
    { pattern: /\bunlock_megastructure\s*=\s*(\w+)/g, type: 'megastructure' },
    { pattern: /\bunlock_ascension_perk\s*=\s*(\w+)/g, type: 'ascension_perk' },
    { pattern: /\bunlock_tradition_category\s*=\s*(\w+)/g, type: 'tradition_category' },
    { pattern: /\bunlock_tradition\s*=\s*(\w+)/g, type: 'tradition' }
  ];
  
  for (const { pattern, type } of otherEffectPatterns) {
    const matches = [...content.matchAll(pattern)];
    for (const match of matches) {
      effects.other.push({ 
        type, 
        id: match.length > 1 ? match[1] : type,
        content: match.length > 1 && match[2] ? match[2] : null
      });
    }
  }
  
  return effects;
}

/**
 * Parse a technology file and extract technology data
 * @param {string} filePath - Path to the technology file
 * @returns {Promise<Object>} Object containing parsed technologies
 */
async function parseTechFile(filePath) {
  try {
    logger.debug(`Parsing technology file: ${filePath}`);
    
    const content = await fs.readFile(filePath, 'utf8');
    const technologies = {};
    
    // Extract technology blocks using regex
    // This is a simplified parser and may not handle all edge cases
    const techRegex = /^(\w+)\s*=\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/gm;
    const matches = [...content.matchAll(techRegex)];
    
    for (const match of matches) {
      const techId = match[1];
      const techContent = match[2];
      
      // Skip non-technology entries (comments, etc.)
      if (!techId || techId.startsWith('#')) {
        continue;
      }
      
      logger.debug(`Found technology: ${techId}`);
      
      // Extract properties
      const tech = {
        id: techId,
        source_file: filePath,
        properties: {}
      };
      
      // Extract simple key-value properties
      const propertyRegex = /(\w+)\s*=\s*([^{\n]+)/g;
      const properties = [...techContent.matchAll(propertyRegex)];
      
      for (const prop of properties) {
        const key = prop[1].trim();
        const value = prop[2].trim();
        
        // Skip comments
        if (key.startsWith('#')) {
          continue;
        }
        
        tech.properties[key] = value;
      }
      
      // Extract prerequisites directly
      const prerequisitesMatch = techContent.match(/prerequisites\s*=\s*{\s*([^}]+)\s*}/);
      if (prerequisitesMatch) {
        const prerequisitesContent = prerequisitesMatch[1];
        const prerequisites = prerequisitesContent.match(/"([^"]+)"/g);
        if (prerequisites) {
          tech.prerequisites = prerequisites.map(p => p.replace(/"/g, ''));
        }
      }
      
      // Extract nested blocks (like potential, prerequisites, etc.)
      const blockRegex = /(\w+)\s*=\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g;
      const blocks = [...techContent.matchAll(blockRegex)];
      
      for (const block of blocks) {
        const blockName = block[1].trim();
        const blockContent = block[2].trim();
        
        // Skip comments
        if (blockName.startsWith('#')) {
          continue;
        }
        
        // Handle special blocks
        switch (blockName) {
          case 'prerequisites':
            // Only process if not already extracted
            if (!tech.prerequisites) {
              tech.prerequisites = parsePrerequisites(blockContent);
            }
            break;
          case 'weight_modifier':
            tech.weight_modifiers = parseWeightModifiers(blockContent);
            break;
          case 'potential':
            tech.potential = parseNestedBlock(blockContent);
            break;
          case 'allow':
            tech.allow = parseNestedBlock(blockContent);
            break;
          case 'ai_weight':
            // Extract AI weight
            const aiWeightMatch = blockContent.match(/weight\s*=\s*(\d+(\.\d+)?)/);
            if (aiWeightMatch) {
              tech.ai_weight = parseFloat(aiWeightMatch[1]);
            }
            break;
          case 'category':
            // Extract category as an array
            const categoryItems = blockContent.match(/\w+/g);
            if (categoryItems && categoryItems.length > 0) {
              tech.category_array = categoryItems;
            }
            break;
          case 'modifier':
            // Extract modifier block
            const modifiers = [];
            const modifierEntries = blockContent.match(/(\w+)\s*=\s*([^{\n]+)/g);
            if (modifierEntries) {
              for (const entry of modifierEntries) {
                const [key, value] = entry.split('=').map(part => part.trim());
                modifiers.push({ key, value });
              }
            }
            if (!tech.effects) {
              tech.effects = { modifiers: [], unlocks: [], other: [] };
            }
            tech.effects.modifiers = modifiers;
            break;
          case 'prereqfor_desc':
            // Extract prereqfor_desc block
            const unlocks = [];
            const shipMatch = blockContent.match(/ship\s*=\s*{([^}]*)}/);
            if (shipMatch) {
              const shipContent = shipMatch[1];
              const titleMatch = shipContent.match(/title\s*=\s*"([^"]+)"/);
              const descMatch = shipContent.match(/desc\s*=\s*"([^"]+)"/);
              
              if (titleMatch && descMatch) {
                unlocks.push({
                  type: 'ship_construction',
                  title: titleMatch[1],
                  description: descMatch[1]
                });
              }
            }
            
            const customMatch = blockContent.match(/custom\s*=\s*{([^}]*)}/);
            if (customMatch) {
              const customContent = customMatch[1];
              const titleMatch = customContent.match(/title\s*=\s*"([^"]+)"/);
              const descMatch = customContent.match(/desc\s*=\s*"([^"]+)"/);
              
              if (titleMatch && descMatch) {
                unlocks.push({
                  type: 'custom',
                  title: titleMatch[1],
                  description: descMatch[1]
                });
              }
            }
            
            if (!tech.effects) {
              tech.effects = { modifiers: [], unlocks: [], other: [] };
            }
            tech.effects.unlocks = unlocks;
            break;
          default:
            // Store other blocks in properties
            tech.properties[blockName] = blockContent;
        }
      }
      
      // Extract effects if not already done
      if (!tech.effects) {
        tech.effects = parseEffects(techContent);
      }
      
      // Extract and normalize important properties
      tech.area = tech.properties.area ? tech.properties.area.replace(/"/g, '') : null;
      
      // Handle tier - could be a number or a variable like @tier2
      if (tech.properties.tier) {
        const tierValue = tech.properties.tier.trim();
        if (/^\d+$/.test(tierValue)) {
          // Direct number
          tech.tier = parseInt(tierValue, 10);
        } else if (tierValue.includes('tier')) {
          // Extract number from variable like @tier2
          const tierMatch = tierValue.match(/tier(\d+)/);
          if (tierMatch) {
            tech.tier = parseInt(tierMatch[1], 10);
          }
        }
      }
      
      // Handle category - could be a string or a block
      if (tech.category_array) {
        tech.category = tech.category_array.join(', ');
      } else if (tech.properties.category) {
        tech.category = tech.properties.category.replace(/[{}"\s]/g, '').trim();
      } else {
        tech.category = null;
      }
      
      tech.is_rare = tech.properties.is_rare === 'yes';
      tech.is_dangerous = tech.properties.is_dangerous === 'yes';
      tech.is_start_tech = tech.properties.start_tech === 'yes';
      
      // Extract base weight
      if (tech.properties.weight) {
        const weightValue = tech.properties.weight.trim();
        if (/^\d+(\.\d+)?$/.test(weightValue)) {
          // Direct number
          tech.base_weight = parseFloat(weightValue);
        } else if (weightValue.includes('weight')) {
          // Try to extract from variable like @tier2weight1
          const weightMatch = weightValue.match(/weight(\d+)/);
          if (weightMatch) {
            tech.base_weight = parseInt(weightMatch[1], 10);
          }
        }
      }
      
      technologies[techId] = tech;
    }
    
    logger.info(`Parsed ${Object.keys(technologies).length} technologies from ${filePath}`);
    return technologies;
  } catch (error) {
    logger.error(`Error parsing technology file ${filePath}: ${error.message}`, { error });
    return {};
  }
}

/**
 * Parse multiple technology files and merge the results
 * @param {string[]} filePaths - Array of file paths to parse
 * @returns {Promise<Object>} Object containing all parsed technologies
 */
async function parseTechFiles(filePaths) {
  try {
    logger.info(`Parsing ${filePaths.length} technology files`);
    
    const allTechnologies = {};
    
    for (const filePath of filePaths) {
      const technologies = await parseTechFile(filePath);
      
      // Merge technologies, handling overrides
      for (const [techId, tech] of Object.entries(technologies)) {
        if (allTechnologies[techId]) {
          logger.warn(`Technology ${techId} is defined multiple times. Overriding with definition from ${tech.source_file}`);
        }
        
        allTechnologies[techId] = tech;
      }
    }
    
    // Build reverse dependencies (which techs depend on this one)
    for (const tech of Object.values(allTechnologies)) {
      if (!tech.prerequisites) {
        continue;
      }
      
      // Process prerequisites
      const prereqs = Array.isArray(tech.prerequisites) ? tech.prerequisites : [tech.prerequisites];
      
      for (const prereq of prereqs) {
        // Handle complex prerequisites
        if (typeof prereq === 'object') {
          const techs = prereq.techs || [];
          for (const prereqId of techs) {
            if (allTechnologies[prereqId]) {
              if (!allTechnologies[prereqId].required_by) {
                allTechnologies[prereqId].required_by = [];
              }
              allTechnologies[prereqId].required_by.push({
                id: tech.id,
                type: prereq.type // AND, OR, NOT
              });
            }
          }
        } else if (typeof prereq === 'string') {
          // Handle simple prerequisites
          if (allTechnologies[prereq]) {
            if (!allTechnologies[prereq].required_by) {
              allTechnologies[prereq].required_by = [];
            }
            allTechnologies[prereq].required_by.push({
              id: tech.id,
              type: 'direct'
            });
          }
        }
      }
    }
    
    logger.info(`Parsed a total of ${Object.keys(allTechnologies).length} unique technologies`);
    return allTechnologies;
  } catch (error) {
    logger.error(`Error parsing technology files: ${error.message}`, { error });
    return {};
  }
}

module.exports = {
  parseTechFile,
  parseTechFiles
}; 