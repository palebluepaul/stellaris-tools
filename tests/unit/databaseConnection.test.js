const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

// Define the test database path
const TEST_DB_PATH = './tests/fixtures/test-launcher.sqlite';

// Mock the sqlite3 and sqlite modules
jest.mock('sqlite3', () => {
  return {
    verbose: jest.fn().mockReturnValue({
      Database: jest.fn(),
      OPEN_READONLY: 1
    })
  };
});

jest.mock('sqlite', () => ({
  open: jest.fn()
}));

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

describe('Database Connection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock the database connection
    const mockDb = {
      all: jest.fn(),
      get: jest.fn(),
      close: jest.fn()
    };
    
    // Setup the mock implementation
    open.mockResolvedValue(mockDb);
    
    // Reset the connection state
    db.isConnected = false;
    db.db = null;
  });

  test('should connect to a database', async () => {
    // Setup mock implementation
    const mockDb = {
      all: jest.fn(),
      get: jest.fn(),
      close: jest.fn()
    };
    open.mockResolvedValueOnce(mockDb);
    
    const result = await db.connect(TEST_DB_PATH);
    
    expect(result).toBe(true);
    expect(open).toHaveBeenCalled();
    expect(db.isConnected).toBe(true);
    expect(db.db).toBe(mockDb);
  });

  test('should handle connection errors', async () => {
    // Setup mock implementation to throw an error
    open.mockRejectedValueOnce(new Error('Connection error'));
    
    const result = await db.connect(TEST_DB_PATH);
    
    expect(result).toBe(false);
    expect(db.isConnected).toBe(false);
    expect(db.db).toBeNull();
  });

  test('should disconnect from the database', async () => {
    // Setup a connected database
    const mockDb = {
      all: jest.fn(),
      get: jest.fn(),
      close: jest.fn().mockResolvedValue()
    };
    
    db.db = mockDb;
    db.isConnected = true;
    
    const result = await db.disconnect();
    
    expect(result).toBe(true);
    expect(mockDb.close).toHaveBeenCalled();
    expect(db.isConnected).toBe(false);
    expect(db.db).toBeNull();
  });

  test('should handle disconnect errors', async () => {
    // Setup a connected database with error on close
    const mockDb = {
      all: jest.fn(),
      get: jest.fn(),
      close: jest.fn().mockRejectedValue(new Error('Close error'))
    };
    
    db.db = mockDb;
    db.isConnected = true;
    
    const result = await db.disconnect();
    
    expect(result).toBe(false);
    expect(mockDb.close).toHaveBeenCalled();
  });

  test('should execute a query', async () => {
    // Setup a connected database
    const mockDb = {
      all: jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]),
      get: jest.fn(),
      close: jest.fn()
    };
    
    db.db = mockDb;
    db.isConnected = true;
    
    const results = await db.query('SELECT * FROM test');
    
    expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM test', {});
    expect(results).toEqual([{ id: 1 }, { id: 2 }]);
  });

  test('should connect before executing a query if not connected', async () => {
    // Create a mock database
    const mockDb = {
      all: jest.fn().mockResolvedValue([{ id: 1 }]),
      get: jest.fn(),
      close: jest.fn()
    };
    
    // Mock the connect method to return true
    jest.spyOn(db, 'connect').mockImplementation(async () => {
      db.isConnected = true;
      db.db = mockDb;
      return true;
    });
    
    // Ensure not connected
    db.db = null;
    db.isConnected = false;
    
    const results = await db.query('SELECT * FROM test');
    
    expect(db.connect).toHaveBeenCalled();
    expect(mockDb.all).toHaveBeenCalledWith('SELECT * FROM test', {});
    expect(results).toEqual([{ id: 1 }]);
  });

  test('should handle query errors', async () => {
    // Setup a connected database with error on query
    const mockDb = {
      all: jest.fn().mockRejectedValue(new Error('Query error')),
      get: jest.fn(),
      close: jest.fn()
    };
    
    db.db = mockDb;
    db.isConnected = true;
    
    await expect(db.query('SELECT * FROM test')).rejects.toThrow('Query error');
  });

  test('should execute a queryOne', async () => {
    // Setup a connected database
    const mockDb = {
      all: jest.fn(),
      get: jest.fn().mockResolvedValue({ id: 1 }),
      close: jest.fn()
    };
    
    db.db = mockDb;
    db.isConnected = true;
    
    const result = await db.queryOne('SELECT * FROM test WHERE id = ?', [1]);
    
    expect(mockDb.get).toHaveBeenCalledWith('SELECT * FROM test WHERE id = ?', [1]);
    expect(result).toEqual({ id: 1 });
  });

  test('should handle queryOne errors', async () => {
    // Setup a connected database with error on queryOne
    const mockDb = {
      all: jest.fn(),
      get: jest.fn().mockRejectedValue(new Error('Query error')),
      close: jest.fn()
    };
    
    db.db = mockDb;
    db.isConnected = true;
    
    await expect(db.queryOne('SELECT * FROM test WHERE id = ?', [1])).rejects.toThrow('Query error');
  });
}); 