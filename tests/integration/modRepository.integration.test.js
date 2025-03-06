/**
 * Integration tests for the mod repository
 * These tests use the actual database connection with a test database
 */

const path = require('path');
const { createTestDatabase } = require('../fixtures/create-test-db');
const db = require('../../src/database/connection');
const modRepository = require('../../src/database/modRepository');
const { Mod } = require('../../src/models/mod');
const { Playset } = require('../../src/models/playset');

// Define the test database path
const TEST_DB_PATH = './tests/fixtures/test-launcher.sqlite';

// Mock the game path detector to return our test database path
jest.mock('../../src/utils/gamePathDetector', () => ({
  initialize: jest.fn().mockResolvedValue(),
  getLauncherDbPath: jest.fn().mockReturnValue('./tests/fixtures/test-launcher.sqlite')
}));

describe('Mod Repository Integration', () => {
  beforeAll(async () => {
    // Create the test database
    await createTestDatabase();
    
    // Connect to the test database
    await db.connect(TEST_DB_PATH);
  });

  afterAll(async () => {
    // Disconnect from the database
    await db.disconnect();
  });

  test('should get all playsets', async () => {
    const playsets = await modRepository.getAllPlaysets();
    
    // Should return 2 playsets (excluding the removed one)
    expect(playsets).toHaveLength(2);
    expect(playsets[0]).toBeInstanceOf(Playset);
    
    // Find the active playset
    const activePlayset = playsets.find(p => p.isActive === true);
    expect(activePlayset).toBeDefined();
    expect(activePlayset.name).toBe('Test Playset 1');
  });

  test('should get the active playset with mods', async () => {
    const playset = await modRepository.getActivePlayset();
    
    expect(playset).toBeInstanceOf(Playset);
    expect(playset.id).toBe('playset-1');
    expect(playset.name).toBe('Test Playset 1');
    expect(playset.isActive).toBe(true);
    
    // Check mods
    expect(playset.mods).toBeDefined();
    expect(playset.mods.length).toBeGreaterThan(0);
    expect(playset.mods[0]).toBeInstanceOf(Mod);
    
    // Check enabled mods
    const enabledMods = playset.mods.filter(m => m.enabled === true);
    expect(enabledMods.length).toBeGreaterThan(0);
    
    // Check mod properties
    const firstMod = playset.mods[0];
    expect(firstMod.id).toBeDefined();
    expect(firstMod.name).toBeDefined();
    expect(firstMod.displayName).toBeDefined();
  });

  test('should get a playset by ID', async () => {
    const playset = await modRepository.getPlaysetById('playset-2');
    
    expect(playset).toBeInstanceOf(Playset);
    expect(playset.id).toBe('playset-2');
    expect(playset.name).toBe('Test Playset 2');
    expect(playset.isActive).toBe(false);
    
    // Check mods
    expect(playset.mods).toBeDefined();
    expect(playset.mods.length).toBeGreaterThan(0);
  });

  test('should return null for non-existent playset ID', async () => {
    const playset = await modRepository.getPlaysetById('non-existent-id');
    
    expect(playset).toBeNull();
  });

  test('should get all mods', async () => {
    const mods = await modRepository.getAllMods();
    
    expect(mods.length).toBeGreaterThan(0);
    expect(mods[0]).toBeInstanceOf(Mod);
    
    // Check mod properties
    const firstMod = mods[0];
    expect(firstMod.id).toBeDefined();
    expect(firstMod.name).toBeDefined();
    expect(firstMod.displayName).toBeDefined();
  });

  test('should get a mod by ID', async () => {
    const mod = await modRepository.getModById('mod-2');
    
    expect(mod).toBeInstanceOf(Mod);
    expect(mod.id).toBe('mod-2');
    expect(mod.name).toBe('test_mod_2');
    expect(mod.displayName).toBe('Test Mod 2');
    
    // Check if it's a graphics mod based on tags
    expect(mod.isGraphicsMod()).toBe(true);
  });

  test('should return null for non-existent mod ID', async () => {
    const mod = await modRepository.getModById('non-existent-id');
    
    expect(mod).toBeNull();
  });

  test('should get mods for a playset', async () => {
    const mods = await modRepository.getModsForPlayset('playset-1');
    
    expect(mods.length).toBeGreaterThan(0);
    expect(mods[0]).toBeInstanceOf(Mod);
    
    // Check if we have enabled mods
    const enabledMods = mods.filter(m => m.enabled === true);
    expect(enabledMods.length).toBeGreaterThan(0);
  });

  test('should get enabled mods for active playset', async () => {
    const mods = await modRepository.getEnabledModsForActivePlayset();
    
    expect(mods.length).toBeGreaterThan(0);
    expect(mods[0]).toBeInstanceOf(Mod);
    
    // All mods should be enabled
    expect(mods.every(m => m.enabled === true)).toBe(true);
  });
}); 