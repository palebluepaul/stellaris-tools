const path = require('path');
const fs = require('fs').promises;
const { TechParser } = require('../../src/parsers');

// Create a test directory and sample files
const TEST_DIR = path.resolve(__dirname, '../fixtures');
const SAMPLE_TECH_FILE = path.resolve(TEST_DIR, 'sample_tech.txt');

describe('TechParser', () => {
  beforeAll(async () => {
    // Create test directory if it doesn't exist
    await fs.mkdir(TEST_DIR, { recursive: true });
    
    // Create a sample technology file
    const sampleContent = `
# Sample technology file for testing
@tier0cost1 = 100
@tier1cost1 = 250
@tier2weight1 = 50

tech_basic_science_lab_1 = {
    cost = @tier0cost1
    area = physics
    tier = 0
    category = { computing }
    start_tech = yes

    # unlock basic science lab lvl 1
    weight_modifier = {
        factor = 1000
    }

    ai_weight = {
        weight = 10000
    }
}

tech_sensors_3 = {
    area = physics
    cost = @tier1cost1
    tier = 3
    category = { computing }
    ai_update_type = all
    prerequisites = { "tech_sensors_2" }
    weight = @tier2weight1

    weight_modifier = {
        modifier = {
            factor = 1.25
            has_tradition = tr_discovery_adopt
        }
    }

    ai_weight = {
    }
}

tech_juggernaut = {
    cost = 5000
    area = engineering
    category = { voidcraft }
    tier = 5
    prerequisites = { "tech_starbase_5" "tech_battleships" }
    weight = 25
    is_rare = yes
}
`;
    await fs.writeFile(SAMPLE_TECH_FILE, sampleContent);
  });

  afterAll(async () => {
    // Clean up test files
    try {
      await fs.unlink(SAMPLE_TECH_FILE);
    } catch (error) {
      console.error(`Error cleaning up test files: ${error.message}`);
    }
  });

  test('should initialize the parser', async () => {
    const parser = new TechParser();
    await parser.initialize();
    expect(parser.grammar).not.toBeNull();
  });

  test('should parse a technology file', async () => {
    const parser = new TechParser();
    const technologies = await parser.parseFile(SAMPLE_TECH_FILE);
    
    // Check if we have the expected number of technologies
    expect(technologies).toHaveLength(3);
    
    // Check the first technology
    const basicScienceLab = technologies.find(tech => tech.id === 'tech_basic_science_lab_1');
    expect(basicScienceLab).toBeDefined();
    expect(basicScienceLab.areaId).toBe('physics');
    expect(basicScienceLab.tier).toBe(0);
    expect(basicScienceLab.cost).toBe(100);
    expect(basicScienceLab.isStartingTech).toBe(true);
    
    // Check the second technology
    const sensors = technologies.find(tech => tech.id === 'tech_sensors_3');
    expect(sensors).toBeDefined();
    expect(sensors.areaId).toBe('physics');
    expect(sensors.tier).toBe(3);
    expect(sensors.cost).toBe(250);
    expect(sensors.prerequisites).toContain('tech_sensors_2');
    
    // Check the third technology
    const juggernaut = technologies.find(tech => tech.id === 'tech_juggernaut');
    expect(juggernaut).toBeDefined();
    expect(juggernaut.areaId).toBe('engineering');
    expect(juggernaut.tier).toBe(5);
    expect(juggernaut.cost).toBe(5000);
    expect(juggernaut.isRare).toBe(true);
    expect(juggernaut.prerequisites).toHaveLength(2);
    expect(juggernaut.prerequisites).toContain('tech_starbase_5');
    expect(juggernaut.prerequisites).toContain('tech_battleships');
  });

  test('should handle variables correctly', async () => {
    const parser = new TechParser();
    const technologies = await parser.parseFile(SAMPLE_TECH_FILE);
    
    // Check if variables are resolved correctly
    const basicScienceLab = technologies.find(tech => tech.id === 'tech_basic_science_lab_1');
    expect(basicScienceLab.cost).toBe(100); // @tier0cost1 = 100
    
    const sensors = technologies.find(tech => tech.id === 'tech_sensors_3');
    expect(sensors.cost).toBe(250); // @tier1cost1 = 250
    expect(sensors.weight).toBe(50); // @tier2weight1 = 50
  });
}); 