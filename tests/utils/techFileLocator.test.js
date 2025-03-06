const TechFileLocator = require('../../src/utils/techFileLocator');
const PathResolver = require('../../src/utils/pathResolver');
const pathCache = require('../../src/utils/pathCache');

// Mock dependencies
jest.mock('../../src/utils/pathResolver');
jest.mock('../../src/utils/pathCache');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('TechFileLocator', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock path cache
    pathCache.get.mockReturnValue(null);
    pathCache.set.mockImplementation(() => {});
    pathCache.invalidate.mockImplementation(() => {});
  });

  describe('findBaseGameTechFiles', () => {
    it('should return empty array if game directory not found', async () => {
      // Mock game directory not found
      PathResolver.getGameInstallDir.mockResolvedValue(null);
      
      const result = await TechFileLocator.findBaseGameTechFiles();
      
      expect(result).toEqual([]);
      expect(PathResolver.getGameInstallDir).toHaveBeenCalledTimes(1);
    });
    
    it('should find technology files in base game', async () => {
      // Mock game directory
      PathResolver.getGameInstallDir.mockResolvedValue('/path/to/stellaris');
      
      // Mock file system access
      const fs = require('fs').promises;
      jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      
      // Mock file finding
      PathResolver.findFiles.mockImplementation((dir) => {
        if (dir.includes('technology')) {
          return Promise.resolve([
            '/path/to/stellaris/common/technology/00_physics_tech.txt',
            '/path/to/stellaris/common/technology/00_society_tech.txt'
          ]);
        } else if (dir.includes('scripted_variables')) {
          return Promise.resolve([
            '/path/to/stellaris/common/scripted_variables/00_tech_cost_variables.txt'
          ]);
        }
        return Promise.resolve([]);
      });
      
      const result = await TechFileLocator.findBaseGameTechFiles();
      
      expect(result).toHaveLength(3);
      expect(result).toContain('/path/to/stellaris/common/technology/00_physics_tech.txt');
      expect(result).toContain('/path/to/stellaris/common/technology/00_society_tech.txt');
      expect(result).toContain('/path/to/stellaris/common/scripted_variables/00_tech_cost_variables.txt');
      expect(PathResolver.findFiles).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('findModTechFiles', () => {
    it('should return empty object if no mods provided', async () => {
      const result = await TechFileLocator.findModTechFiles([]);
      
      expect(result).toEqual({});
    });
    
    it('should find technology files in mods', async () => {
      // Mock mods
      const mods = [
        { id: 'mod1', name: 'Mod 1', getEffectivePath: () => '/path/to/mod1' },
        { id: 'mod2', name: 'Mod 2', getEffectivePath: () => '/path/to/mod2' },
        { id: 'mod3', name: 'Mod 3', getEffectivePath: () => null } // Invalid path
      ];
      
      // Mock file system access
      const fs = require('fs').promises;
      jest.spyOn(fs, 'access').mockImplementation((path) => {
        if (path.includes('mod1') || path.includes('mod2/common/technology')) {
          return Promise.resolve();
        }
        return Promise.reject(new Error('ENOENT'));
      });
      
      // Mock file finding
      PathResolver.findFiles.mockImplementation((dir) => {
        if (dir.includes('mod1/common/technology')) {
          return Promise.resolve([
            '/path/to/mod1/common/technology/mod1_tech.txt'
          ]);
        } else if (dir.includes('mod1/common/scripted_variables')) {
          return Promise.resolve([
            '/path/to/mod1/common/scripted_variables/mod1_variables.txt'
          ]);
        } else if (dir.includes('mod2/common/technology')) {
          return Promise.resolve([
            '/path/to/mod2/common/technology/mod2_tech.txt'
          ]);
        }
        return Promise.resolve([]);
      });
      
      const result = await TechFileLocator.findModTechFiles(mods);
      
      expect(Object.keys(result)).toHaveLength(2);
      expect(result.mod1).toHaveLength(2);
      expect(result.mod2).toHaveLength(1);
      expect(result.mod1).toContain('/path/to/mod1/common/technology/mod1_tech.txt');
      expect(result.mod1).toContain('/path/to/mod1/common/scripted_variables/mod1_variables.txt');
      expect(result.mod2).toContain('/path/to/mod2/common/technology/mod2_tech.txt');
    });
  });
  
  describe('createFileRegistry', () => {
    it('should create a registry with base game and mod files', () => {
      // Mock base game files
      const baseGameFiles = [
        '/path/to/stellaris/common/technology/00_physics_tech.txt',
        '/path/to/stellaris/common/scripted_variables/00_tech_cost_variables.txt'
      ];
      
      // Mock mod files
      const modFiles = {
        'mod1': [
          '/path/to/mod1/common/technology/mod1_tech.txt'
        ],
        'mod2': [
          '/path/to/mod2/common/technology/mod2_tech.txt',
          '/path/to/mod2/common/scripted_variables/mod2_variables.txt'
        ]
      };
      
      // Mock mods
      const mods = [
        { id: 'mod1', name: 'Mod 1', displayName: 'Mod One', position: 1 },
        { id: 'mod2', name: 'Mod 2', displayName: 'Mod Two', position: 2 }
      ];
      
      const result = TechFileLocator.createFileRegistry(baseGameFiles, modFiles, mods);
      
      expect(result).toHaveLength(5);
      
      // Check base game entries
      const baseGameEntries = result.filter(entry => entry.source === 'base_game');
      expect(baseGameEntries).toHaveLength(2);
      
      // Check mod entries
      const mod1Entries = result.filter(entry => entry.sourceId === 'mod1');
      expect(mod1Entries).toHaveLength(1);
      expect(mod1Entries[0].sourceName).toBe('Mod One');
      
      const mod2Entries = result.filter(entry => entry.sourceId === 'mod2');
      expect(mod2Entries).toHaveLength(2);
      expect(mod2Entries[0].sourceName).toBe('Mod Two');
      
      // Check sorting - base game should be first, then mods in order of position
      expect(result[0].source).toBe('base_game'); // Base game should be first (load order 0)
      expect(result[1].source).toBe('base_game'); // Base game should be first (load order 0)
      
      // Find the first mod1 and mod2 entries
      const mod1Index = result.findIndex(entry => entry.sourceId === 'mod1');
      const mod2Index = result.findIndex(entry => entry.sourceId === 'mod2');
      
      // Mod1 should come before Mod2 because of position
      expect(mod1Index).toBeLessThan(mod2Index);
    });
  });
  
  describe('findAllTechFiles', () => {
    it('should return cached files if available', async () => {
      // Mock cached files
      const cachedFiles = [{ path: 'cached/file.txt' }];
      pathCache.get.mockReturnValue(cachedFiles);
      
      const result = await TechFileLocator.findAllTechFiles([]);
      
      expect(result).toBe(cachedFiles);
      expect(pathCache.get).toHaveBeenCalledWith(TechFileLocator.TECH_FILES_CACHE_KEY);
      expect(PathResolver.getGameInstallDir).not.toHaveBeenCalled();
    });
    
    it('should find all tech files and cache the result', async () => {
      // Mock dependencies
      PathResolver.getGameInstallDir.mockResolvedValue('/path/to/stellaris');
      
      // Mock file system access
      const fs = require('fs').promises;
      jest.spyOn(fs, 'access').mockResolvedValue(undefined);
      
      // Mock file finding
      PathResolver.findFiles.mockResolvedValue(['/path/to/file.txt']);
      
      // Mock mods
      const mods = [
        { id: 'mod1', name: 'Mod 1', getEffectivePath: () => '/path/to/mod1', position: 1 }
      ];
      
      const result = await TechFileLocator.findAllTechFiles(mods);
      
      expect(result).toBeDefined();
      expect(pathCache.set).toHaveBeenCalledWith(TechFileLocator.TECH_FILES_CACHE_KEY, result);
    });
  });
  
  describe('invalidateCache', () => {
    it('should delete the cache entry', () => {
      TechFileLocator.invalidateCache();
      
      expect(pathCache.invalidate).toHaveBeenCalledWith(TechFileLocator.TECH_FILES_CACHE_KEY);
    });
  });
}); 