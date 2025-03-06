const { Mod } = require('../../src/models/mod');

describe('Mod Model', () => {
  describe('constructor', () => {
    test('should create a mod with default values', () => {
      const mod = new Mod();
      
      expect(mod.id).toBeNull();
      expect(mod.name).toBe('');
      expect(mod.displayName).toBe('');
      expect(mod.enabled).toBe(false);
      expect(mod.position).toBe(0);
      expect(mod.dirPath).toBeNull();
      expect(mod.steamId).toBeNull();
      expect(mod.version).toBeNull();
      expect(mod.requiredVersion).toBeNull();
      expect(mod.tags).toEqual([]);
      expect(mod.status).toBe('unknown');
      expect(mod.source).toBe('unknown');
      expect(mod.thumbnailPath).toBeNull();
      expect(mod.archivePath).toBeNull();
    });
    
    test('should create a mod with provided values', () => {
      const data = {
        id: 'mod-123',
        name: 'test-mod',
        displayName: 'Test Mod',
        enabled: true,
        position: 1,
        dirPath: '/path/to/mod',
        steamId: '12345',
        version: '1.0.0',
        requiredVersion: '3.4',
        tags: ['gameplay', 'balance'],
        status: 'active',
        source: 'workshop',
        thumbnailPath: '/path/to/thumbnail.png',
        archivePath: '/path/to/archive.zip'
      };
      
      const mod = new Mod(data);
      
      expect(mod.id).toBe('mod-123');
      expect(mod.name).toBe('test-mod');
      expect(mod.displayName).toBe('Test Mod');
      expect(mod.enabled).toBe(true);
      expect(mod.position).toBe(1);
      expect(mod.dirPath).toBe('/path/to/mod');
      expect(mod.steamId).toBe('12345');
      expect(mod.version).toBe('1.0.0');
      expect(mod.requiredVersion).toBe('3.4');
      expect(mod.tags).toEqual(['gameplay', 'balance']);
      expect(mod.status).toBe('active');
      expect(mod.source).toBe('workshop');
      expect(mod.thumbnailPath).toBe('/path/to/thumbnail.png');
      expect(mod.archivePath).toBe('/path/to/archive.zip');
    });
    
    test('should use name as displayName if not provided', () => {
      const mod = new Mod({ name: 'test-mod' });
      
      expect(mod.name).toBe('test-mod');
      expect(mod.displayName).toBe('test-mod');
    });
    
    test('should handle boolean enabled value', () => {
      const mod = new Mod({ enabled: true });
      
      expect(mod.enabled).toBe(true);
    });
  });
  
  describe('_parseTags', () => {
    test('should return empty array for null tags', () => {
      const mod = new Mod();
      
      expect(mod._parseTags(null)).toEqual([]);
    });
    
    test('should return the array if tags is already an array', () => {
      const mod = new Mod();
      const tags = ['gameplay', 'balance'];
      
      expect(mod._parseTags(tags)).toEqual(tags);
    });
    
    test('should parse JSON string tags', () => {
      const mod = new Mod();
      const tags = '["gameplay", "balance"]';
      
      expect(mod._parseTags(tags)).toEqual(['gameplay', 'balance']);
    });
    
    test('should return empty array for invalid JSON', () => {
      const mod = new Mod();
      const tags = 'invalid json';
      
      expect(mod._parseTags(tags)).toEqual([]);
    });
  });
  
  describe('getEffectivePath', () => {
    test('should return dirPath if available', () => {
      const mod = new Mod({
        dirPath: '/path/to/dir',
        archivePath: '/path/to/archive'
      });
      
      expect(mod.getEffectivePath()).toBe('/path/to/dir');
    });
    
    test('should return archivePath if dirPath is not available', () => {
      const mod = new Mod({
        archivePath: '/path/to/archive'
      });
      
      expect(mod.getEffectivePath()).toBe('/path/to/archive');
    });
    
    test('should return null if neither path is available', () => {
      const mod = new Mod();
      
      expect(mod.getEffectivePath()).toBeNull();
    });
  });
  
  describe('tag checks', () => {
    test('should identify total conversion mods', () => {
      const mod = new Mod({ tags: ['total conversion', 'gameplay'] });
      
      expect(mod.isTotalConversion()).toBe(true);
      expect(mod.isGraphicsMod()).toBe(false);
      expect(mod.isGameplayMod()).toBe(true);
    });
    
    test('should identify graphics mods', () => {
      const mod = new Mod({ tags: ['graphics'] });
      
      expect(mod.isTotalConversion()).toBe(false);
      expect(mod.isGraphicsMod()).toBe(true);
      expect(mod.isGameplayMod()).toBe(false);
    });
    
    test('should identify gameplay mods', () => {
      const mod = new Mod({ tags: ['gameplay'] });
      
      expect(mod.isTotalConversion()).toBe(false);
      expect(mod.isGraphicsMod()).toBe(false);
      expect(mod.isGameplayMod()).toBe(true);
    });
  });
  
  describe('toJSON', () => {
    test('should return a plain object representation', () => {
      const data = {
        id: 'mod-123',
        name: 'test-mod',
        displayName: 'Test Mod',
        enabled: true,
        position: 1,
        dirPath: '/path/to/mod',
        steamId: '12345',
        version: '1.0.0',
        requiredVersion: '3.4',
        tags: ['gameplay', 'balance'],
        status: 'active',
        source: 'workshop',
        thumbnailPath: '/path/to/thumbnail.png',
        archivePath: '/path/to/archive.zip'
      };
      
      const mod = new Mod(data);
      const json = mod.toJSON();
      
      expect(json).toEqual(data);
    });
  });
}); 