const config = require('../../src/config');
const path = require('path');
const os = require('os');
const PathResolver = require('../../src/utils/pathResolver');

// Mock PathResolver
jest.mock('../../src/utils/pathResolver', () => ({
  getHomeDir: jest.fn(),
  getDocumentsDir: jest.fn(),
  getStellarisUserDataDir: jest.fn(),
  getLauncherDbPath: jest.fn(),
  getSaveGamesDir: jest.fn(),
  isWSL: jest.fn()
}));

describe('Configuration Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock implementations
    PathResolver.getHomeDir.mockReturnValue(os.homedir());
    PathResolver.getDocumentsDir.mockReturnValue(path.join(os.homedir(), 'Documents'));
    PathResolver.getStellarisUserDataDir.mockReturnValue(path.join(os.homedir(), 'Documents', 'Paradox Interactive', 'Stellaris'));
    PathResolver.getLauncherDbPath.mockReturnValue(path.join(os.homedir(), 'Documents', 'Paradox Interactive', 'Stellaris', 'launcher-v2.sqlite'));
    PathResolver.getSaveGamesDir.mockReturnValue(path.join(os.homedir(), 'Documents', 'Paradox Interactive', 'Stellaris', 'save games'));
    PathResolver.isWSL.mockReturnValue(false);
  });

  test('should have homedir property', () => {
    expect(config.homedir).toBe(PathResolver.getHomeDir());
    expect(PathResolver.getHomeDir).toHaveBeenCalled();
  });

  test('should have documentsPath property', () => {
    expect(config.documentsPath).toBe(PathResolver.getDocumentsDir());
    expect(PathResolver.getDocumentsDir).toHaveBeenCalled();
  });

  test('should have stellarisUserDataPath property', () => {
    expect(config.stellarisUserDataPath).toBe(PathResolver.getStellarisUserDataDir());
    expect(PathResolver.getStellarisUserDataDir).toHaveBeenCalled();
  });

  test('should have launcherDbPath property', () => {
    expect(config.launcherDbPath).toBe(PathResolver.getLauncherDbPath());
    expect(PathResolver.getLauncherDbPath).toHaveBeenCalled();
  });

  test('should have saveGamesPath property', () => {
    expect(config.saveGamesPath).toBe(PathResolver.getSaveGamesDir());
    expect(PathResolver.getSaveGamesDir).toHaveBeenCalled();
  });

  test('should handle WSL paths correctly', () => {
    // Mock WSL environment
    PathResolver.isWSL.mockReturnValue(true);
    PathResolver.getHomeDir.mockReturnValue('/mnt/c/Users/testuser');
    PathResolver.getDocumentsDir.mockReturnValue('/mnt/c/Users/testuser/Documents');
    PathResolver.getStellarisUserDataDir.mockReturnValue('/mnt/c/Users/testuser/Documents/Paradox Interactive/Stellaris');
    
    expect(config.homedir).toBe('/mnt/c/Users/testuser');
    expect(config.documentsPath).toBe('/mnt/c/Users/testuser/Documents');
    expect(config.stellarisUserDataPath).toBe('/mnt/c/Users/testuser/Documents/Paradox Interactive/Stellaris');
  });
}); 