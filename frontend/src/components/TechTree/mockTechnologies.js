// mockTechnologies.js
export const mockTechnologies = [
  {
    id: "tech_lasers_1",
    name: "Red Lasers",
    tier: 0,
    category: "physics",
    area: "weapons",
    prerequisites: [],
    cost: 100,
    description: "Basic laser technology"
  },
  {
    id: "tech_lasers_2",
    name: "Blue Lasers",
    tier: 1,
    category: "physics",
    area: "weapons",
    prerequisites: ["tech_lasers_1"],
    cost: 250,
    description: "Improved laser technology"
  },
  {
    id: "tech_lasers_3",
    name: "UV Lasers",
    tier: 2,
    category: "physics",
    area: "weapons",
    prerequisites: ["tech_lasers_2"],
    cost: 500,
    description: "Advanced laser technology"
  },
  {
    id: "tech_shields_1",
    name: "Deflectors",
    tier: 0,
    category: "physics",
    area: "shields",
    prerequisites: [],
    cost: 150,
    description: "Basic shield technology"
  },
  {
    id: "tech_shields_2",
    name: "Improved Deflectors",
    tier: 1,
    category: "physics",
    area: "shields",
    prerequisites: ["tech_shields_1"],
    cost: 300,
    description: "Improved shield technology"
  },
  {
    id: "tech_power_plant_1",
    name: "Power Plant I",
    tier: 0,
    category: "engineering",
    area: "power",
    prerequisites: [],
    cost: 100,
    description: "Basic power generation"
  },
  {
    id: "tech_power_plant_2",
    name: "Power Plant II",
    tier: 1,
    category: "engineering",
    area: "power",
    prerequisites: ["tech_power_plant_1"],
    cost: 250,
    description: "Improved power generation"
  },
  {
    id: "tech_battleships",
    name: "Battleships",
    tier: 3,
    category: "engineering",
    area: "ships",
    prerequisites: ["tech_cruisers", "tech_power_plant_2"],
    cost: 1000,
    description: "Massive capital ships"
  },
  {
    id: "tech_cruisers",
    name: "Cruisers",
    tier: 2,
    category: "engineering",
    area: "ships",
    prerequisites: ["tech_destroyers"],
    cost: 500,
    description: "Medium-sized warships"
  },
  {
    id: "tech_destroyers",
    name: "Destroyers",
    tier: 1,
    category: "engineering",
    area: "ships",
    prerequisites: ["tech_corvettes"],
    cost: 250,
    description: "Small warships"
  },
  {
    id: "tech_corvettes",
    name: "Corvettes",
    tier: 0,
    category: "engineering",
    area: "ships",
    prerequisites: [],
    cost: 100,
    description: "Light patrol craft"
  },
  {
    id: "tech_advanced_shields",
    name: "Advanced Shields",
    tier: 3,
    category: "physics",
    area: "shields",
    prerequisites: ["tech_shields_2", "tech_power_plant_2"],
    cost: 800,
    description: "Cutting-edge shield technology with multiple dependencies"
  }
];

// Helper function to transform tech data to React Flow format
export const transformTechDataToReactFlow = (technologies) => {
  // First, create a map of all tech IDs for quick lookup
  const techMap = new Map();
  technologies.forEach(tech => {
    techMap.set(tech.id, tech);
  });

  // Count techs by tier and category for better distribution
  const countsByTierAndCategory = {};
  const countsByTierCategoryArea = {};
  
  // First pass: count technologies by tier, category, and area
  technologies.forEach(tech => {
    const tier = typeof tech.tier === 'number' ? tech.tier : 0;
    const category = tech.category || tech.areaId || 'default';
    const area = tech.area || tech.categoryId || 'default';
    
    // Initialize counters if they don't exist
    if (!countsByTierAndCategory[tier]) {
      countsByTierAndCategory[tier] = {};
    }
    if (!countsByTierAndCategory[tier][category]) {
      countsByTierAndCategory[tier][category] = 0;
    }
    
    // Initialize area counters
    if (!countsByTierCategoryArea[tier]) {
      countsByTierCategoryArea[tier] = {};
    }
    if (!countsByTierCategoryArea[tier][category]) {
      countsByTierCategoryArea[tier][category] = {};
    }
    if (!countsByTierCategoryArea[tier][category][area]) {
      countsByTierCategoryArea[tier][category][area] = 0;
    }
    
    // Increment counters
    countsByTierAndCategory[tier][category]++;
    countsByTierCategoryArea[tier][category][area]++;
  });
  
  // Create a position tracking system to avoid overlaps
  const positionTracker = {};
  
  // Create a global position tracker to ensure no overlaps across different categories/areas
  const globalPositionTracker = new Set();
  
  // Store all assigned positions for distance checking
  const allAssignedPositions = [];
  
  // Function to check if a position is too close to any existing position
  const isTooClose = (x, y, minDistance = 300) => {
    for (const pos of allAssignedPositions) {
      const dx = Math.abs(x - pos.x);
      const dy = Math.abs(y - pos.y);
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        return true;
      }
    }
    return false;
  };
  
  // Calculate positions based on tier, category, and area
  const calculatePosition = (tech) => {
    // Get tier, category, and area with fallbacks
    const tier = typeof tech.tier === 'number' ? tech.tier : 0;
    const category = tech.category || tech.areaId || 'default';
    const area = tech.area || tech.categoryId || 'default';
    
    // Create a unique key for this tier/category/area combination
    const positionKey = `${tier}-${category}-${area}`;
    
    // Initialize position tracker for this key if it doesn't exist
    if (!positionTracker[positionKey]) {
      positionTracker[positionKey] = {
        nextRow: 0,
        nextCol: 0,
        maxColsInCurrentRow: 0,
        positions: new Set() // Track used positions
      };
    }
    
    // Define spacing constants
    const nodeWidth = 180;
    const nodeHeight = 100;
    
    // Adjust spacing based on the number of techs in this area
    const areaCount = countsByTierCategoryArea[tier]?.[category]?.[area] || 1;
    const horizontalSpacing = Math.max(300, nodeWidth * 2); // Increased minimum spacing
    const verticalSpacing = Math.max(200, nodeHeight * 2); // Increased minimum spacing
    
    // Increase category spacing for areas with many techs
    const categorySpacing = 2200; // Increased base spacing between categories
    
    // Define category order (horizontal positioning)
    const categoryOrder = {
      physics: 0,
      society: 1,
      engineering: 2,
      default: 3
    };
    
    // Get category index with fallback
    const categoryIndex = categoryOrder[category] !== undefined ? 
      categoryOrder[category] : categoryOrder.default;
    
    // Base position for category
    const xBaseCategory = categoryIndex * categorySpacing;
    
    // Base position for tier
    const yBaseTier = tier * verticalSpacing * 6; // Increased vertical spacing
    
    // Calculate area index (for positioning within a category)
    // We'll use a consistent order for areas within each category
    const areaOrders = {
      physics: {
        particles: 0,
        field_manipulation: 1,
        computing: 2,
        weapons: 3,
        shields: 4,
        default: 5
      },
      society: {
        biology: 0,
        military_theory: 1,
        new_worlds: 2,
        statecraft: 3,
        psionics: 4,
        archaeostudies: 5,
        default: 6
      },
      engineering: {
        materials: 0,
        propulsion: 1,
        voidcraft: 2,
        industry: 3,
        power: 4,
        default: 5
      },
      default: {
        default: 0
      }
    };
    
    // Get area order with fallbacks
    const areaOrderMap = areaOrders[category] || areaOrders.default;
    const areaIndex = areaOrderMap[area] !== undefined ? 
      areaOrderMap[area] : areaOrderMap.default;
    
    // Calculate grid position
    const gridColumns = Math.ceil(Math.sqrt(areaCount * 2)); // Increased columns for better distribution
    
    // Get the tracker for this position key
    const tracker = positionTracker[positionKey];
    
    // Find a free position in the grid
    let row = tracker.nextRow;
    let col = tracker.nextCol;
    let positionString;
    let globalPositionString;
    let x, y;
    let attempts = 0;
    const maxAttempts = 200; // Increased max attempts
    
    // Keep trying positions until we find a free one
    do {
      positionString = `${row}-${col}`;
      
      // Calculate final position
      x = xBaseCategory + (areaIndex * horizontalSpacing * 4) + (col * horizontalSpacing);
      y = yBaseTier + (row * verticalSpacing);
      
      // Add some jitter to prevent grid-like alignment
      const jitterX = (Math.random() * 50) - 25; // Random value between -25 and 25
      const jitterY = (Math.random() * 50) - 25; // Random value between -25 and 25
      
      x += jitterX;
      y += jitterY;
      
      // Create a global position string that includes the actual x,y coordinates
      // Use smaller buckets (25 pixels) for more precise positioning
      const bucketX = Math.round(x / 25) * 25;
      const bucketY = Math.round(y / 25) * 25;
      globalPositionString = `${bucketX}-${bucketY}`;
      
      // If this position is already taken or too close to another position, try the next one
      if (
        tracker.positions.has(positionString) || 
        globalPositionTracker.has(globalPositionString) ||
        isTooClose(x, y)
      ) {
        col++;
        if (col >= gridColumns) {
          col = 0;
          row++;
        }
      }
      
      attempts++;
      if (attempts > maxAttempts) {
        // If we've tried too many positions, use a position far from others
        let foundPosition = false;
        
        // Try to find a position that's not too close to any existing position
        for (let i = 0; i < 50; i++) {
          const randomX = xBaseCategory + (areaIndex * horizontalSpacing * 4) + (Math.random() * 2000);
          const randomY = yBaseTier + (Math.random() * 2000);
          
          if (!isTooClose(randomX, randomY)) {
            x = randomX;
            y = randomY;
            foundPosition = true;
            break;
          }
        }
        
        // If we still couldn't find a position, just use a random one
        if (!foundPosition) {
          x = xBaseCategory + (areaIndex * horizontalSpacing * 4) + (Math.random() * 3000);
          y = yBaseTier + (Math.random() * 3000);
        }
        
        // Create a new global position string
        const bucketX = Math.round(x / 25) * 25;
        const bucketY = Math.round(y / 25) * 25;
        globalPositionString = `${bucketX}-${bucketY}`;
        break;
      }
    } while (
      tracker.positions.has(positionString) || 
      globalPositionTracker.has(globalPositionString) ||
      isTooClose(x, y)
    );
    
    // Mark this position as used
    tracker.positions.add(positionString);
    globalPositionTracker.add(globalPositionString);
    allAssignedPositions.push({ x, y });
    
    // Update tracker for next tech
    tracker.nextCol = col + 1;
    if (tracker.nextCol >= gridColumns) {
      tracker.nextCol = 0;
      tracker.nextRow = row + 1;
    }
    
    // Update max columns in current row
    tracker.maxColsInCurrentRow = Math.max(tracker.maxColsInCurrentRow, col + 1);
    
    // Add tech ID to position for debugging
    if (!tech._position) {
      tech._position = { 
        x, 
        y, 
        globalKey: globalPositionString,
        tier,
        category,
        area
      };
    }
    
    return { x, y };
  };

  // Create nodes
  const nodes = technologies.map(tech => ({
    id: tech.id,
    type: 'techNode', // Custom node type
    position: calculatePosition(tech),
    data: { 
      ...tech, 
      selected: false, 
      highlighted: false,
      _debug: {
        position: tech._position
      }
    }
  }));

  // Create edges from prerequisites
  const edges = [];
  technologies.forEach(tech => {
    if (Array.isArray(tech.prerequisites)) {
      tech.prerequisites.forEach(prereqId => {
        // Only create edges for prerequisites that exist in our dataset
        if (techMap.has(prereqId)) {
          edges.push({
            id: `${prereqId}-${tech.id}`,
            source: prereqId,
            target: tech.id,
            type: 'default', // We'll use custom edge type later
            animated: false,
            data: { highlighted: false }
          });
        }
      });
    }
  });

  return { nodes, edges };
}; 