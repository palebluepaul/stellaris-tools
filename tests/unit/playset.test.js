const { Playset } = require('../../src/models/playset');
const { Mod } = require('../../src/models/mod');

describe('Playset Model', () => {
  describe('constructor', () => {
    test('should create a playset with default values', () => {
      const playset = new Playset();
      
      expect(playset.id).toBeNull();
      expect(playset.name).toBe('');
      expect(playset.isActive).toBe(false);
      expect(playset.createdOn).toBeDefined();
      expect(playset.updatedOn).toBeDefined();
      expect(playset.mods).toEqual([]);
    });
    
    test('should create a playset with provided values', () => {
      const createdDate = '2023-01-01';
      const updatedDate = '2023-02-01';
      
      const data = {
        id: 'playset-123',
        name: 'Test Playset',
        isActive: true,
        createdOn: createdDate,
        updatedOn: updatedDate,
        mods: [
          { id: 'mod-1', name: 'Mod 1', enabled: true },
          { id: 'mod-2', name: 'Mod 2', enabled: false }
        ]
      };
      
      const playset = new Playset(data);
      
      expect(playset.id).toBe('playset-123');
      expect(playset.name).toBe('Test Playset');
      expect(playset.isActive).toBe(true);
      expect(playset.createdOn).toBe(createdDate);
      expect(playset.updatedOn).toBe(updatedDate);
      expect(playset.mods).toHaveLength(2);
    });
    
    test('should handle boolean isActive value', () => {
      const playset = new Playset({ isActive: true });
      
      expect(playset.isActive).toBe(true);
    });
  });
  
  describe('getModCount', () => {
    test('should return the number of mods', () => {
      const playset = new Playset({
        mods: [
          { id: 'mod-1' },
          { id: 'mod-2' },
          { id: 'mod-3' }
        ]
      });
      
      expect(playset.getModCount()).toBe(3);
    });
    
    test('should return 0 for empty mods array', () => {
      const playset = new Playset();
      
      expect(playset.getModCount()).toBe(0);
    });
  });
  
  describe('getEnabledModCount', () => {
    test('should return the number of enabled mods', () => {
      const playset = new Playset({
        mods: [
          { id: 'mod-1', enabled: true },
          { id: 'mod-2', enabled: false },
          { id: 'mod-3', enabled: true }
        ]
      });
      
      expect(playset.getEnabledModCount()).toBe(2);
    });
    
    test('should return 0 for no enabled mods', () => {
      const playset = new Playset({
        mods: [
          { id: 'mod-1', enabled: false },
          { id: 'mod-2', enabled: false }
        ]
      });
      
      expect(playset.getEnabledModCount()).toBe(0);
    });
  });
  
  describe('getEnabledMods', () => {
    test('should return only enabled mods', () => {
      const playset = new Playset({
        mods: [
          { id: 'mod-1', enabled: true },
          { id: 'mod-2', enabled: false },
          { id: 'mod-3', enabled: true }
        ]
      });
      
      const enabledMods = playset.getEnabledMods();
      
      expect(enabledMods).toHaveLength(2);
      expect(enabledMods[0].id).toBe('mod-1');
      expect(enabledMods[1].id).toBe('mod-3');
    });
  });
  
  describe('getModsByLoadOrder', () => {
    test('should return mods sorted by position', () => {
      const playset = new Playset({
        mods: [
          { id: 'mod-3', position: 3 },
          { id: 'mod-1', position: 1 },
          { id: 'mod-2', position: 2 }
        ]
      });
      
      const sortedMods = playset.getModsByLoadOrder();
      
      expect(sortedMods).toHaveLength(3);
      expect(sortedMods[0].id).toBe('mod-1');
      expect(sortedMods[1].id).toBe('mod-2');
      expect(sortedMods[2].id).toBe('mod-3');
    });
  });
  
  describe('getEnabledModsByLoadOrder', () => {
    test('should return enabled mods sorted by position', () => {
      const playset = new Playset({
        mods: [
          { id: 'mod-3', position: 3, enabled: true },
          { id: 'mod-1', position: 1, enabled: true },
          { id: 'mod-2', position: 2, enabled: false },
          { id: 'mod-4', position: 4, enabled: true }
        ]
      });
      
      const sortedEnabledMods = playset.getEnabledModsByLoadOrder();
      
      expect(sortedEnabledMods).toHaveLength(3);
      expect(sortedEnabledMods[0].id).toBe('mod-1');
      expect(sortedEnabledMods[1].id).toBe('mod-3');
      expect(sortedEnabledMods[2].id).toBe('mod-4');
    });
  });
  
  describe('toJSON', () => {
    test('should return a plain object representation', () => {
      const createdDate = '2023-01-01';
      const updatedDate = '2023-02-01';
      
      const mod1 = new Mod({ id: 'mod-1', name: 'Mod 1', enabled: true, position: 1 });
      const mod2 = new Mod({ id: 'mod-2', name: 'Mod 2', enabled: false, position: 2 });
      
      const playset = new Playset({
        id: 'playset-123',
        name: 'Test Playset',
        isActive: true,
        createdOn: createdDate,
        updatedOn: updatedDate,
        mods: [mod1, mod2]
      });
      
      const json = playset.toJSON();
      
      expect(json.id).toBe('playset-123');
      expect(json.name).toBe('Test Playset');
      expect(json.isActive).toBe(true);
      expect(json.createdOn).toBe(createdDate);
      expect(json.updatedOn).toBe(updatedDate);
      expect(json.mods).toHaveLength(2);
      expect(json.mods[0]).toEqual(mod1.toJSON());
      expect(json.mods[1]).toEqual(mod2.toJSON());
    });
    
    test('should handle plain object mods', () => {
      const playset = new Playset({
        id: 'playset-123',
        mods: [
          { id: 'mod-1' },
          { id: 'mod-2' }
        ]
      });
      
      const json = playset.toJSON();
      
      expect(json.mods).toHaveLength(2);
      expect(json.mods[0].id).toBe('mod-1');
      expect(json.mods[1].id).toBe('mod-2');
    });
  });
}); 