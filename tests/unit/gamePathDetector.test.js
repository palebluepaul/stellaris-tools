// Mock dependencies
jest.mock('../../src/utils/pathResolver', () => ({
  getGameInstallDir: jest.fn(),
  getWorkshopModsDir: jest.fn(),
  getStellarisUserDataDir: jest.fn(),
  getLauncherDbPath: jest.fn(),
  getSaveGamesDir: jest.fn(),
  validatePath: jest.fn()
}));

jest.mock('../../src/utils/pathCache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  load: jest.fn(),
  save: jest.fn(),
  clear: jest.fn()
}));

jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Import dependencies after mocking
const PathResolver = require('../../src/utils/pathResolver');
const pathCache = require('../../src/utils/pathCache');

// Import the module under test
const gamePathDetector = require('../../src/utils/gamePathDetector');

describe('GamePathDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    gamePathDetector.initialized = false;
  });

  describe('initialize', () => {
    test('should load the path cache', async () => {
      pathCache.load.mockResolvedValue(true);
      
      const result = await gamePathDetector.initialize();
      
      expect(result).toBe(true);
      expect(pathCache.load).toHaveBeenCalled();
      expect(gamePathDetector.initialized).toBe(true);
    });
    
    test('should handle errors', async () => {
      pathCache.load.mockRejectedValue(new Error('Failed to load cache'));
      
      const result = await gamePathDetector.initialize();
      
      expect(result).toBe(false);
      expect(gamePathDetector.initialized).toBe(false);
    });
    
    test('should not reload if already initialized', async () => {
      gamePathDetector.initialized = true;
      
      const result = await gamePathDetector.initialize();
      
      expect(result).toBe(true);
      expect(pathCache.load).not.toHaveBeenCalled();
    });
  });

  describe('getGameInstallDir', () => {
    test('should return cached path if available', async () => {
      gamePathDetector.initialized = true;
      pathCache.get.mockReturnValue('/cached/game/path');
      
      const result = await gamePathDetector.getGameInstallDir();
      
      expect(result).toBe('/cached/game/path');
      expect(pathCache.get).toHaveBeenCalledWith('gameInstallDir');
      expect(PathResolver.getGameInstallDir).not.toHaveBeenCalled();
    });
    
    test('should resolve path if not cached', async () => {
      gamePathDetector.initialized = true;
      pathCache.get.mockReturnValue(null);
      PathResolver.getGameInstallDir.mockResolvedValue('/resolved/game/path');
      
      const result = await gamePathDetector.getGameInstallDir();
      
      expect(result).toBe('/resolved/game/path');
      expect(pathCache.get).toHaveBeenCalledWith('gameInstallDir');
      expect(PathResolver.getGameInstallDir).toHaveBeenCalled();
      expect(pathCache.set).toHaveBeenCalledWith('gameInstallDir', '/resolved/game/path', expect.any(Number));
      expect(pathCache.save).toHaveBeenCalled();
    });
    
    test('should force refresh if specified', async () => {
      gamePathDetector.initialized = true;
      PathResolver.getGameInstallDir.mockResolvedValue('/refreshed/game/path');
      
      const result = await gamePathDetector.getGameInstallDir(true);
      
      expect(result).toBe('/refreshed/game/path');
      expect(pathCache.get).not.toHaveBeenCalled();
      expect(PathResolver.getGameInstallDir).toHaveBeenCalled();
      expect(pathCache.set).toHaveBeenCalledWith('gameInstallDir', '/refreshed/game/path', expect.any(Number));
      expect(pathCache.save).toHaveBeenCalled();
    });
  });

  describe('getWorkshopModsDir', () => {
    test('should return cached path if available', async () => {
      gamePathDetector.initialized = true;
      pathCache.get.mockReturnValue('/cached/workshop/path');
      
      const result = await gamePathDetector.getWorkshopModsDir();
      
      expect(result).toBe('/cached/workshop/path');
      expect(pathCache.get).toHaveBeenCalledWith('workshopModsDir');
      expect(PathResolver.getWorkshopModsDir).not.toHaveBeenCalled();
    });
    
    test('should resolve path if not cached', async () => {
      gamePathDetector.initialized = true;
      pathCache.get.mockReturnValue(null);
      PathResolver.getWorkshopModsDir.mockResolvedValue('/resolved/workshop/path');
      
      const result = await gamePathDetector.getWorkshopModsDir();
      
      expect(result).toBe('/resolved/workshop/path');
      expect(pathCache.get).toHaveBeenCalledWith('workshopModsDir');
      expect(PathResolver.getWorkshopModsDir).toHaveBeenCalled();
      expect(pathCache.set).toHaveBeenCalledWith('workshopModsDir', '/resolved/workshop/path', expect.any(Number));
      expect(pathCache.save).toHaveBeenCalled();
    });
  });

  describe('getUserDataDir', () => {
    test('should return cached path if available', async () => {
      gamePathDetector.initialized = true;
      pathCache.get.mockReturnValue('/cached/userdata/path');
      
      const result = await gamePathDetector.getUserDataDir();
      
      expect(result).toBe('/cached/userdata/path');
      expect(pathCache.get).toHaveBeenCalledWith('userDataDir');
      expect(PathResolver.getStellarisUserDataDir).not.toHaveBeenCalled();
    });
    
    test('should resolve and validate path if not cached', async () => {
      gamePathDetector.initialized = true;
      pathCache.get.mockReturnValue(null);
      PathResolver.getStellarisUserDataDir.mockReturnValue('/resolved/userdata/path');
      PathResolver.validatePath.mockResolvedValue(true);
      
      const result = await gamePathDetector.getUserDataDir();
      
      expect(result).toBe('/resolved/userdata/path');
      expect(pathCache.get).toHaveBeenCalledWith('userDataDir');
      expect(PathResolver.getStellarisUserDataDir).toHaveBeenCalled();
      expect(PathResolver.validatePath).toHaveBeenCalledWith('/resolved/userdata/path');
      expect(pathCache.set).toHaveBeenCalledWith('userDataDir', '/resolved/userdata/path', expect.any(Number));
      expect(pathCache.save).toHaveBeenCalled();
    });
    
    test('should return null if path validation fails', async () => {
      gamePathDetector.initialized = true;
      pathCache.get.mockReturnValue(null);
      PathResolver.getStellarisUserDataDir.mockReturnValue('/invalid/userdata/path');
      PathResolver.validatePath.mockResolvedValue(false);
      
      const result = await gamePathDetector.getUserDataDir();
      
      expect(result).toBeNull();
      expect(pathCache.set).not.toHaveBeenCalled();
    });
  });

  describe('invalidateCache', () => {
    test('should clear the cache and save', async () => {
      await gamePathDetector.invalidateCache();
      
      expect(pathCache.clear).toHaveBeenCalled();
      expect(pathCache.save).toHaveBeenCalled();
    });
  });
}); 