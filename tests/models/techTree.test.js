const TechTree = require('../../src/models/techTree');
const TechDatabase = require('../../src/models/techDatabase');
const Tech = require('../../src/models/tech');

describe('TechTree', () => {
  let techDatabase;
  let techTree;
  
  // Sample technologies for testing
  const sampleTechs = [
    new Tech({
      id: 'tech_root_1',
      name: 'Root Tech 1',
      display_name: 'Root Technology 1',
      area_id: 'physics',
      area_name: 'Physics',
      tier: 0,
      prerequisites: []
    }),
    new Tech({
      id: 'tech_root_2',
      name: 'Root Tech 2',
      display_name: 'Root Technology 2',
      area_id: 'society',
      area_name: 'Society',
      tier: 0,
      prerequisites: []
    }),
    new Tech({
      id: 'tech_level_1_1',
      name: 'Level 1 Tech 1',
      display_name: 'Level 1 Technology 1',
      area_id: 'physics',
      area_name: 'Physics',
      tier: 1,
      prerequisites: ['tech_root_1']
    }),
    new Tech({
      id: 'tech_level_1_2',
      name: 'Level 1 Tech 2',
      display_name: 'Level 1 Technology 2',
      area_id: 'society',
      area_name: 'Society',
      tier: 1,
      prerequisites: ['tech_root_2']
    }),
    new Tech({
      id: 'tech_level_2_1',
      name: 'Level 2 Tech 1',
      display_name: 'Level 2 Technology 1',
      area_id: 'physics',
      area_name: 'Physics',
      tier: 2,
      prerequisites: ['tech_level_1_1']
    }),
    new Tech({
      id: 'tech_level_2_2',
      name: 'Level 2 Tech 2',
      display_name: 'Level 2 Technology 2',
      area_id: 'society',
      area_name: 'Society',
      tier: 2,
      prerequisites: ['tech_level_1_1', 'tech_level_1_2']
    }),
    new Tech({
      id: 'tech_level_3_1',
      name: 'Level 3 Tech 1',
      display_name: 'Level 3 Technology 1',
      area_id: 'engineering',
      area_name: 'Engineering',
      tier: 3,
      prerequisites: ['tech_level_2_1', 'tech_level_2_2']
    })
  ];
  
  beforeEach(async () => {
    // Create a new tech database
    techDatabase = new TechDatabase();
    await techDatabase.initialize();
    
    // Add sample technologies
    for (const tech of sampleTechs) {
      techDatabase.addTechnology(tech);
    }
    
    // Create a new tech tree
    techTree = new TechTree(techDatabase);
    await techTree.initialize();
  });
  
  test('should initialize correctly', () => {
    expect(techTree).toBeDefined();
  });
  
  test('should identify root nodes correctly', () => {
    const rootNodes = techTree.getRootNodes();
    expect(rootNodes).toHaveLength(2);
    expect(rootNodes).toContain('tech_root_1');
    expect(rootNodes).toContain('tech_root_2');
  });
  
  test('should calculate depth correctly', () => {
    expect(techTree.getDepth('tech_root_1')).toBe(0);
    expect(techTree.getDepth('tech_level_1_1')).toBe(1);
    expect(techTree.getDepth('tech_level_2_1')).toBe(2);
    expect(techTree.getDepth('tech_level_3_1')).toBe(3);
  });
  
  test('should get nodes at specific depth', () => {
    const depthZeroNodes = techTree.getNodesAtDepth(0);
    expect(depthZeroNodes).toHaveLength(2);
    expect(depthZeroNodes).toContain('tech_root_1');
    expect(depthZeroNodes).toContain('tech_root_2');
    
    const depthOneNodes = techTree.getNodesAtDepth(1);
    expect(depthOneNodes).toHaveLength(2);
    expect(depthOneNodes).toContain('tech_level_1_1');
    expect(depthOneNodes).toContain('tech_level_1_2');
    
    const depthTwoNodes = techTree.getNodesAtDepth(2);
    expect(depthTwoNodes).toHaveLength(2);
    expect(depthTwoNodes).toContain('tech_level_2_1');
    expect(depthTwoNodes).toContain('tech_level_2_2');
    
    const depthThreeNodes = techTree.getNodesAtDepth(3);
    expect(depthThreeNodes).toHaveLength(1);
    expect(depthThreeNodes).toContain('tech_level_3_1');
  });
  
  test('should get children correctly', () => {
    const rootChildren = techTree.getChildren('tech_root_1');
    expect(rootChildren).toHaveLength(1);
    expect(rootChildren).toContain('tech_level_1_1');
    
    const level1Children = techTree.getChildren('tech_level_1_1');
    expect(level1Children).toHaveLength(2);
    expect(level1Children).toContain('tech_level_2_1');
    expect(level1Children).toContain('tech_level_2_2');
    
    const level3Children = techTree.getChildren('tech_level_3_1');
    expect(level3Children).toHaveLength(0);
  });
  
  test('should get parents correctly', () => {
    const rootParents = techTree.getParents('tech_root_1');
    expect(rootParents).toHaveLength(0);
    
    const level1Parents = techTree.getParents('tech_level_1_1');
    expect(level1Parents).toHaveLength(1);
    expect(level1Parents).toContain('tech_root_1');
    
    const level2Parents = techTree.getParents('tech_level_2_2');
    expect(level2Parents).toHaveLength(2);
    expect(level2Parents).toContain('tech_level_1_1');
    expect(level2Parents).toContain('tech_level_1_2');
    
    const level3Parents = techTree.getParents('tech_level_3_1');
    expect(level3Parents).toHaveLength(2);
    expect(level3Parents).toContain('tech_level_2_1');
    expect(level3Parents).toContain('tech_level_2_2');
  });
  
  test('should get path to root correctly', () => {
    const rootPath = techTree.getPathToRoot('tech_root_1');
    expect(rootPath).toHaveLength(1);
    expect(rootPath[0]).toBe('tech_root_1');
    
    const level1Path = techTree.getPathToRoot('tech_level_1_1');
    expect(level1Path).toHaveLength(2);
    expect(level1Path[0]).toBe('tech_root_1');
    expect(level1Path[1]).toBe('tech_level_1_1');
    
    const level2Path = techTree.getPathToRoot('tech_level_2_1');
    expect(level2Path).toHaveLength(3);
    expect(level2Path[0]).toBe('tech_root_1');
    expect(level2Path[1]).toBe('tech_level_1_1');
    expect(level2Path[2]).toBe('tech_level_2_1');
    
    const level3Path = techTree.getPathToRoot('tech_level_3_1');
    expect(level3Path).toHaveLength(4);
    expect(level3Path[0]).toBe('tech_root_1');
    expect(level3Path[1]).toBe('tech_level_1_1');
    expect(level3Path[2]).toBe('tech_level_2_1');
    expect(level3Path[3]).toBe('tech_level_3_1');
  });
  
  test('should search technologies correctly', () => {
    const searchResults1 = techTree.search('root');
    expect(searchResults1).toHaveLength(2);
    expect(searchResults1).toContain('tech_root_1');
    expect(searchResults1).toContain('tech_root_2');
    
    const searchResults2 = techTree.search('level 2');
    expect(searchResults2).toHaveLength(2);
    expect(searchResults2).toContain('tech_level_2_1');
    expect(searchResults2).toContain('tech_level_2_2');
    
    const searchResults3 = techTree.search('Engineering');
    expect(searchResults3).toHaveLength(1);
    expect(searchResults3).toContain('tech_level_3_1');
    
    const searchResults4 = techTree.search('nonexistent');
    expect(searchResults4).toHaveLength(0);
  });
  
  test('should calculate max depth and width correctly', () => {
    expect(techTree.getMaxDepth()).toBe(3);
    expect(techTree.getMaxWidth()).toBe(2);
  });
}); 