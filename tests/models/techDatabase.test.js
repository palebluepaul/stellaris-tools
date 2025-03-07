const TechDatabase = require('../../src/models/techDatabase');
const Tech = require('../../src/models/tech');

describe('TechDatabase', () => {
  let database;

  beforeEach(() => {
    database = new TechDatabase();
  });

  describe('initialization', () => {
    it('should initialize with default areas', async () => {
      await database.initialize();
      
      const areas = database.getAllAreas();
      expect(areas).toHaveLength(3);
      expect(areas.map(a => a.id)).toContain('physics');
      expect(areas.map(a => a.id)).toContain('society');
      expect(areas.map(a => a.id)).toContain('engineering');
    });
  });

  describe('adding technologies', () => {
    beforeEach(async () => {
      await database.initialize();
    });

    it('should add a technology', () => {
      const tech = new Tech({
        id: 'tech_test',
        name: 'Test Technology',
        area_id: 'physics',
        area_name: 'Physics',
        tier: 1
      });

      database.addTechnology(tech);
      
      expect(database.count).toBe(1);
      expect(database.getTechnology('tech_test')).toBe(tech);
    });

    it('should override existing technology by default', () => {
      const tech1 = new Tech({
        id: 'tech_test',
        name: 'Test Technology 1',
        area_id: 'physics'
      });

      const tech2 = new Tech({
        id: 'tech_test',
        name: 'Test Technology 2',
        area_id: 'society'
      });

      database.addTechnology(tech1);
      database.addTechnology(tech2);
      
      expect(database.count).toBe(1);
      expect(database.getTechnology('tech_test')).toBe(tech2);
    });

    it('should not override existing technology when overrideExisting is false', () => {
      const tech1 = new Tech({
        id: 'tech_test',
        name: 'Test Technology 1',
        area_id: 'physics'
      });

      const tech2 = new Tech({
        id: 'tech_test',
        name: 'Test Technology 2',
        area_id: 'society'
      });

      database.addTechnology(tech1);
      database.addTechnology(tech2, false);
      
      expect(database.count).toBe(1);
      expect(database.getTechnology('tech_test')).toBe(tech1);
    });

    it('should add multiple technologies', () => {
      const techs = [
        new Tech({ id: 'tech_1', name: 'Tech 1', area_id: 'physics' }),
        new Tech({ id: 'tech_2', name: 'Tech 2', area_id: 'society' }),
        new Tech({ id: 'tech_3', name: 'Tech 3', area_id: 'engineering' })
      ];

      const addedCount = database.addTechnologies(techs);
      
      expect(addedCount).toBe(3);
      expect(database.count).toBe(3);
      expect(database.getTechnology('tech_1')).toBeTruthy();
      expect(database.getTechnology('tech_2')).toBeTruthy();
      expect(database.getTechnology('tech_3')).toBeTruthy();
    });
  });

  describe('querying technologies', () => {
    beforeEach(async () => {
      await database.initialize();
      
      const techs = [
        new Tech({ 
          id: 'tech_physics_1', 
          name: 'Physics Tech 1', 
          area_id: 'physics',
          area_name: 'Physics',
          category_id: 'field_manipulation',
          category_name: 'Field Manipulation',
          tier: 1
        }),
        new Tech({ 
          id: 'tech_physics_2', 
          name: 'Physics Tech 2', 
          area_id: 'physics',
          area_name: 'Physics',
          category_id: 'particles',
          category_name: 'Particles',
          tier: 2,
          prerequisites: ['tech_physics_1']
        }),
        new Tech({ 
          id: 'tech_society_1', 
          name: 'Society Tech 1', 
          area_id: 'society',
          area_name: 'Society',
          category_id: 'biology',
          category_name: 'Biology',
          tier: 1
        }),
        new Tech({ 
          id: 'tech_engineering_1', 
          name: 'Engineering Tech 1', 
          area_id: 'engineering',
          area_name: 'Engineering',
          category_id: 'materials',
          category_name: 'Materials',
          tier: 1
        }),
        new Tech({ 
          id: 'tech_engineering_2', 
          name: 'Engineering Tech 2', 
          area_id: 'engineering',
          area_name: 'Engineering',
          category_id: 'materials',
          category_name: 'Materials',
          tier: 2,
          prerequisites: ['tech_engineering_1', 'tech_physics_1']
        })
      ];
      
      database.addTechnologies(techs);
      database.buildTechTree();
    });

    it('should get all technologies', () => {
      const techs = database.getAllTechnologies();
      expect(techs).toHaveLength(5);
    });

    it('should get technologies by area', () => {
      const physicsTechs = database.getTechnologiesByArea('physics');
      expect(physicsTechs).toHaveLength(2);
      expect(physicsTechs.map(t => t.id)).toContain('tech_physics_1');
      expect(physicsTechs.map(t => t.id)).toContain('tech_physics_2');
      
      const societyTechs = database.getTechnologiesByArea('society');
      expect(societyTechs).toHaveLength(1);
      expect(societyTechs[0].id).toBe('tech_society_1');
      
      const engineeringTechs = database.getTechnologiesByArea('engineering');
      expect(engineeringTechs).toHaveLength(2);
    });

    it('should get technologies by category', () => {
      const materialsTechs = database.getTechnologiesByCategory('materials');
      expect(materialsTechs).toHaveLength(2);
      expect(materialsTechs.map(t => t.id)).toContain('tech_engineering_1');
      expect(materialsTechs.map(t => t.id)).toContain('tech_engineering_2');
    });

    it('should get technologies by tier', () => {
      const tier1Techs = database.getTechnologiesByTier(1);
      expect(tier1Techs).toHaveLength(3);
      
      const tier2Techs = database.getTechnologiesByTier(2);
      expect(tier2Techs).toHaveLength(2);
    });

    it('should get prerequisites for a technology', () => {
      const prerequisites = database.getPrerequisites('tech_physics_2');
      expect(prerequisites).toHaveLength(1);
      expect(prerequisites[0].id).toBe('tech_physics_1');
      
      const multiplePrerequisites = database.getPrerequisites('tech_engineering_2');
      expect(multiplePrerequisites).toHaveLength(2);
      expect(multiplePrerequisites.map(t => t.id)).toContain('tech_engineering_1');
      expect(multiplePrerequisites.map(t => t.id)).toContain('tech_physics_1');
    });

    it('should get dependent technologies', () => {
      const dependents = database.getDependentTechnologies('tech_physics_1');
      expect(dependents).toHaveLength(2);
      expect(dependents.map(t => t.id)).toContain('tech_physics_2');
      expect(dependents.map(t => t.id)).toContain('tech_engineering_2');
    });

    it('should get all areas', () => {
      const areas = database.getAllAreas();
      expect(areas).toHaveLength(3);
    });

    it('should get all categories', () => {
      const categories = database.getAllCategories();
      expect(categories).toHaveLength(4);
      expect(categories.map(c => c.id)).toContain('field_manipulation');
      expect(categories.map(c => c.id)).toContain('particles');
      expect(categories.map(c => c.id)).toContain('biology');
      expect(categories.map(c => c.id)).toContain('materials');
    });
  });

  describe('tech tree building', () => {
    beforeEach(async () => {
      await database.initialize();
      
      const techs = [
        new Tech({ id: 'tech_1', name: 'Tech 1' }),
        new Tech({ id: 'tech_2', name: 'Tech 2', prerequisites: ['tech_1'] }),
        new Tech({ id: 'tech_3', name: 'Tech 3', prerequisites: ['tech_1'] }),
        new Tech({ id: 'tech_4', name: 'Tech 4', prerequisites: ['tech_2', 'tech_3'] })
      ];
      
      database.addTechnologies(techs);
    });

    it('should build the tech tree correctly', () => {
      database.buildTechTree();
      
      const tech1 = database.getTechnology('tech_1');
      const tech2 = database.getTechnology('tech_2');
      const tech3 = database.getTechnology('tech_3');
      const tech4 = database.getTechnology('tech_4');
      
      expect(tech1.getChildTechs()).toHaveLength(2);
      expect(tech1.getChildTechs()).toContain('tech_2');
      expect(tech1.getChildTechs()).toContain('tech_3');
      
      expect(tech2.getChildTechs()).toHaveLength(1);
      expect(tech2.getChildTechs()).toContain('tech_4');
      
      expect(tech3.getChildTechs()).toHaveLength(1);
      expect(tech3.getChildTechs()).toContain('tech_4');
      
      expect(tech4.getChildTechs()).toHaveLength(0);
    });

    it('should handle missing prerequisites gracefully', () => {
      // Add a tech with a non-existent prerequisite
      const techWithMissingPrereq = new Tech({
        id: 'tech_5',
        name: 'Tech 5',
        prerequisites: ['tech_nonexistent']
      });
      
      database.addTechnology(techWithMissingPrereq);
      
      // This should not throw an error
      database.buildTechTree();
      
      const tech5 = database.getTechnology('tech_5');
      expect(tech5.getChildTechs()).toHaveLength(0);
    });
  });

  describe('clearing the database', () => {
    beforeEach(async () => {
      await database.initialize();
      
      const techs = [
        new Tech({ id: 'tech_1', name: 'Tech 1' }),
        new Tech({ id: 'tech_2', name: 'Tech 2' })
      ];
      
      database.addTechnologies(techs);
    });

    it('should clear all technologies', () => {
      expect(database.count).toBe(2);
      
      database.clear();
      
      expect(database.count).toBe(0);
      expect(database.getTechnology('tech_1')).toBeNull();
      expect(database.getTechnology('tech_2')).toBeNull();
    });
  });
}); 