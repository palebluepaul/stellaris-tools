const fs = require('fs').promises;
const path = require('path');

// Mock the fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    readFile: jest.fn(),
    access: jest.fn()
  }
}));

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn()
}));

// Import the module after mocking dependencies
const pathCache = require('../../src/utils/pathCache');

describe('PathCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pathCache.clear();
  });

  describe('get and set', () => {
    test('should store and retrieve values', () => {
      pathCache.set('testKey', '/test/path');
      expect(pathCache.get('testKey')).toBe('/test/path');
    });

    test('should return null for non-existent keys', () => {
      expect(pathCache.get('nonExistentKey')).toBeNull();
    });

    test('should handle TTL expiration', () => {
      jest.useFakeTimers();
      
      // Set a value with a 1000ms TTL
      pathCache.set('expiringKey', '/expiring/path', 1000);
      
      // Value should be available immediately
      expect(pathCache.get('expiringKey')).toBe('/expiring/path');
      
      // Advance time by 1001ms
      jest.advanceTimersByTime(1001);
      
      // Value should now be expired
      expect(pathCache.get('expiringKey')).toBeNull();
      
      jest.useRealTimers();
    });
  });

  describe('invalidate', () => {
    test('should remove a specific key', () => {
      pathCache.set('key1', '/path1');
      pathCache.set('key2', '/path2');
      
      pathCache.invalidate('key1');
      
      expect(pathCache.get('key1')).toBeNull();
      expect(pathCache.get('key2')).toBe('/path2');
    });
  });

  describe('clear', () => {
    test('should remove all keys', () => {
      pathCache.set('key1', '/path1');
      pathCache.set('key2', '/path2');
      
      pathCache.clear();
      
      expect(pathCache.get('key1')).toBeNull();
      expect(pathCache.get('key2')).toBeNull();
    });
  });

  describe('save', () => {
    test('should create directory and save cache to disk', async () => {
      fs.mkdir.mockResolvedValue(undefined);
      fs.writeFile.mockResolvedValue(undefined);
      
      pathCache.set('key1', '/path1');
      pathCache.set('key2', '/path2');
      
      const result = await pathCache.save();
      
      expect(result).toBe(true);
      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(pathCache.cacheFile), { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledWith(
        pathCache.cacheFile,
        expect.any(String)
      );
      
      // Verify the serialized content
      const serializedContent = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(serializedContent).toHaveProperty('key1');
      expect(serializedContent).toHaveProperty('key2');
      expect(serializedContent.key1.value).toBe('/path1');
      expect(serializedContent.key2.value).toBe('/path2');
    });
    
    test('should handle errors', async () => {
      fs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      const result = await pathCache.save();
      
      expect(result).toBe(false);
    });
  });

  describe('load', () => {
    test('should load cache from disk', async () => {
      const mockData = JSON.stringify({
        key1: { value: '/path1', expires: null },
        key2: { value: '/path2', expires: null }
      });
      
      fs.access.mockResolvedValue(undefined);
      fs.readFile.mockResolvedValue(mockData);
      
      const result = await pathCache.load();
      
      expect(result).toBe(true);
      expect(pathCache.get('key1')).toBe('/path1');
      expect(pathCache.get('key2')).toBe('/path2');
    });
    
    test('should handle missing cache file', async () => {
      fs.access.mockRejectedValue({ code: 'ENOENT' });
      
      const result = await pathCache.load();
      
      expect(result).toBe(false);
    });
    
    test('should handle invalid JSON', async () => {
      fs.access.mockResolvedValue(undefined);
      fs.readFile.mockResolvedValue('invalid json');
      
      const result = await pathCache.load();
      
      expect(result).toBe(false);
    });
  });
}); 