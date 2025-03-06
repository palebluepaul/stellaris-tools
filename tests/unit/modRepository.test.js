const path = require('path');
const { createTestDatabase } = require('../fixtures/create-test-db');

// Define the test database path
const TEST_DB_PATH = './tests/fixtures/test-launcher.sqlite';

// Mock the database connection module
jest.mock('../../src/database/connection', () => {
  return {
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    query: jest.fn(),
    queryOne: jest.fn(),
    isConnected: jest.fn().mockReturnValue(true)
  };
});

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

// Mock the game path detector
jest.mock('../../src/utils/gamePathDetector', () => ({
  initialize: jest.fn().mockResolvedValue(),
  getLauncherDbPath: jest.fn().mockReturnValue('./tests/fixtures/test-launcher.sqlite')
}));

// Import the module under test after mocking dependencies
const db = require('../../src/database/connection');
const modRepository = require('../../src/database/modRepository');
const { Mod } = require('../../src/models/mod');
const { Playset } = require('../../src/models/playset');

describe('Mod Repository', () => {
  beforeAll(async () => {
    // Create the test database
    await createTestDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should get all playsets', async () => {
    // Mock the database query response
    db.query.mockResolvedValueOnce([
      { id: 'playset-1', name: 'Test Playset 1', isActive: 1, isRemoved: 0 },
      { id: 'playset-2', name: 'Test Playset 2', isActive: 0, isRemoved: 0 }
    ]);

    const playsets = await modRepository.getAllPlaysets();

    expect(db.query).toHaveBeenCalled();
    expect(playsets).toHaveLength(2);
    expect(playsets[0]).toBeInstanceOf(Playset);
    expect(playsets[0].id).toBe('playset-1');
    expect(playsets[1].id).toBe('playset-2');
  });

  test('should handle errors when getting all playsets', async () => {
    // Mock the database query to throw an error
    db.query.mockRejectedValueOnce(new Error('Database error'));

    const playsets = await modRepository.getAllPlaysets();

    expect(playsets).toEqual([]);
  });

  test('should get the active playset', async () => {
    // Mock the database response
    db.queryOne.mockResolvedValueOnce({
      id: 'playset-1',
      name: 'Test Playset 1',
      isActive: 'true', // Use string 'true' instead of 1
      createdOn: '2023-01-01',
      isRemoved: 0
    });
    
    // Mock the mods query
    db.query.mockResolvedValueOnce([
      { id: 'mod-1', name: 'test_mod_1', displayName: 'Test Mod 1', enabled: 'true', position: 0 },
      { id: 'mod-2', name: 'test_mod_2', displayName: 'Test Mod 2', enabled: 'true', position: 1 },
      { id: 'mod-3', name: 'test_mod_3', displayName: 'Test Mod 3', enabled: false, position: 2 }
    ]);
    
    const playset = await modRepository.getActivePlayset();
    
    expect(db.queryOne).toHaveBeenCalled();
    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['playset-1']);
    
    expect(playset).toBeInstanceOf(Playset);
    expect(playset.id).toBe('playset-1');
    expect(playset.name).toBe('Test Playset 1');
    expect(playset.isActive).toBe(true);
    expect(playset.mods).toHaveLength(3);
    expect(playset.mods[0]).toBeInstanceOf(Mod);
    expect(playset.getEnabledModCount()).toBe(2);
  });

  test('should handle no active playset', async () => {
    // Mock the database query to return null
    db.queryOne.mockResolvedValueOnce(null);

    const playset = await modRepository.getActivePlayset();

    expect(playset).toBeNull();
  });

  test('should handle errors when getting active playset', async () => {
    // Mock the database query to throw an error
    db.queryOne.mockRejectedValueOnce(new Error('Database error'));

    const playset = await modRepository.getActivePlayset();

    expect(playset).toBeNull();
  });

  test('should get a playset by ID', async () => {
    // Mock the database query responses
    db.queryOne.mockResolvedValueOnce({
      id: 'playset-2',
      name: 'Test Playset 2',
      isActive: 0,
      isRemoved: 0
    });

    db.query.mockResolvedValueOnce([
      { id: 'mod-1', name: 'test_mod_1', displayName: 'Test Mod 1', enabled: 1, position: 0 },
      { id: 'mod-3', name: 'test_mod_3', displayName: 'Test Mod 3', enabled: 1, position: 1 }
    ]);

    const playset = await modRepository.getPlaysetById('playset-2');

    expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), ['playset-2']);
    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['playset-2']);
    
    expect(playset).toBeInstanceOf(Playset);
    expect(playset.id).toBe('playset-2');
    expect(playset.name).toBe('Test Playset 2');
    expect(playset.mods).toHaveLength(2);
  });

  test('should handle playset not found by ID', async () => {
    // Mock the database query to return null
    db.queryOne.mockResolvedValueOnce(null);

    const playset = await modRepository.getPlaysetById('non-existent-id');

    expect(playset).toBeNull();
  });

  test('should get all mods', async () => {
    // Mock the database query response
    db.query.mockResolvedValueOnce([
      { id: 'mod-1', name: 'test_mod_1', displayName: 'Test Mod 1' },
      { id: 'mod-2', name: 'test_mod_2', displayName: 'Test Mod 2' },
      { id: 'mod-3', name: 'test_mod_3', displayName: 'Test Mod 3' },
      { id: 'mod-4', name: 'test_mod_4', displayName: 'Test Mod 4' }
    ]);

    const mods = await modRepository.getAllMods();

    expect(db.query).toHaveBeenCalled();
    expect(mods).toHaveLength(4);
    expect(mods[0]).toBeInstanceOf(Mod);
    expect(mods[0].id).toBe('mod-1');
    expect(mods[3].id).toBe('mod-4');
  });

  test('should get a mod by ID', async () => {
    // Mock the database query response
    db.queryOne.mockResolvedValueOnce({
      id: 'mod-2',
      name: 'test_mod_2',
      displayName: 'Test Mod 2',
      tags: '["graphics", "visual"]'
    });

    const mod = await modRepository.getModById('mod-2');

    expect(db.queryOne).toHaveBeenCalledWith(expect.any(String), ['mod-2']);
    expect(mod).toBeInstanceOf(Mod);
    expect(mod.id).toBe('mod-2');
    expect(mod.name).toBe('test_mod_2');
    expect(mod.displayName).toBe('Test Mod 2');
    expect(mod.tags).toEqual(['graphics', 'visual']);
  });

  test('should handle mod not found by ID', async () => {
    // Mock the database query to return null
    db.queryOne.mockResolvedValueOnce(null);

    const mod = await modRepository.getModById('non-existent-id');

    expect(mod).toBeNull();
  });

  test('should get mods for a playset', async () => {
    // Mock the database response
    db.query.mockResolvedValueOnce([
      { id: 'mod-1', name: 'test_mod_1', displayName: 'Test Mod 1', enabled: 'true', position: 0 },
      { id: 'mod-2', name: 'test_mod_2', displayName: 'Test Mod 2', enabled: 'true', position: 1 },
      { id: 'mod-3', name: 'test_mod_3', displayName: 'Test Mod 3', enabled: false, position: 2 }
    ]);
    
    const mods = await modRepository.getModsForPlayset('playset-1');
    
    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['playset-1']);
    expect(mods).toHaveLength(3);
    expect(mods[0]).toBeInstanceOf(Mod);
    expect(mods[0].id).toBe('mod-1');
    expect(mods[0].enabled).toBe(true);
    expect(mods[2].enabled).toBe(false);
  });

  test('should get enabled mods for active playset', async () => {
    // Mock the getActivePlayset method
    const mockPlayset = new Playset({
      id: 'playset-1',
      name: 'Test Playset 1',
      isActive: true,
      mods: [
        new Mod({ id: 'mod-1', name: 'test_mod_1', enabled: true }),
        new Mod({ id: 'mod-2', name: 'test_mod_2', enabled: true }),
        new Mod({ id: 'mod-3', name: 'test_mod_3', enabled: false })
      ]
    });

    // Use jest.spyOn to mock the method while preserving the original implementation
    jest.spyOn(modRepository, 'getActivePlayset').mockResolvedValueOnce(mockPlayset);

    const enabledMods = await modRepository.getEnabledModsForActivePlayset();

    expect(modRepository.getActivePlayset).toHaveBeenCalled();
    expect(enabledMods).toHaveLength(2);
    expect(enabledMods[0].id).toBe('mod-1');
    expect(enabledMods[1].id).toBe('mod-2');
  });

  test('should handle no active playset when getting enabled mods', async () => {
    // Mock the getActivePlayset method to return null
    jest.spyOn(modRepository, 'getActivePlayset').mockResolvedValueOnce(null);

    const enabledMods = await modRepository.getEnabledModsForActivePlayset();

    expect(modRepository.getActivePlayset).toHaveBeenCalled();
    expect(enabledMods).toEqual([]);
  });
}); 