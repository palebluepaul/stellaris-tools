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
  // Calculate positions based on tier and category
  const calculatePosition = (tech) => {
    // Horizontal position based on category
    const categoryPositions = {
      physics: 0,
      society: 1,
      engineering: 2
    };
    
    // Define node width and height for spacing calculations
    const nodeWidth = 200;
    const nodeHeight = 100;
    
    // Horizontal spacing between categories
    const categorySpacing = 500;
    // Vertical spacing between tiers
    const tierSpacing = 200;
    
    const xBase = categoryPositions[tech.category] * categorySpacing;
    const yBase = tech.tier * tierSpacing;
    
    // Create a more structured layout within each category and tier
    // Map areas to specific positions within their category/tier grid
    const areaPositions = {
      // Physics category
      physics: {
        weapons: { x: 0, y: 0 },
        shields: { x: nodeWidth + 50, y: 0 },
        other: { x: (nodeWidth + 50) * 2, y: 0 }
      },
      // Engineering category
      engineering: {
        power: { x: 0, y: 0 },
        ships: { x: nodeWidth + 50, y: 0 },
        other: { x: (nodeWidth + 50) * 2, y: 0 }
      },
      // Society category (for future use)
      society: {
        research: { x: 0, y: 0 },
        biology: { x: nodeWidth + 50, y: 0 },
        other: { x: (nodeWidth + 50) * 2, y: 0 }
      }
    };
    
    // Get the position for this tech's area, or use 'other' if not defined
    const areaPosition = areaPositions[tech.category]?.[tech.area] || 
                         areaPositions[tech.category]?.other || 
                         { x: 0, y: 0 };
    
    return { 
      x: xBase + areaPosition.x, 
      y: yBase + areaPosition.y 
    };
  };

  // Create nodes
  const nodes = technologies.map(tech => ({
    id: tech.id,
    type: 'techNode', // Custom node type
    position: calculatePosition(tech),
    data: { ...tech, selected: false, highlighted: false }
  }));

  // Create edges from prerequisites
  const edges = [];
  technologies.forEach(tech => {
    tech.prerequisites.forEach(prereqId => {
      edges.push({
        id: `${prereqId}-${tech.id}`,
        source: prereqId,
        target: tech.id,
        type: 'default', // We'll use custom edge type later
        animated: false,
        data: { highlighted: false }
      });
    });
  });

  return { nodes, edges };
}; 