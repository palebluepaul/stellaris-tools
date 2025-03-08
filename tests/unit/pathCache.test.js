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

// Mock child_process for platform detection
jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Import the module after mocking dependencies
const pathCache = require('../../src/utils/pathCache');

describe('PathCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    pathCache.clear();
  });

  describe('_getPlatformInfo', () => {
    test('should detect WSL environment', () => {
      const { execSync } = require('child_process');
      execSync.mockReturnValueOnce(Buffer.from('Linux version 4.4.0-19041-Microsoft'));
      
      const platformInfo = pathCache._getPlatformInfo();
      expect(platformInfo.platform).toBe(process.platform);
      expect(platformInfo.isWSL).toBe(true);
    });

    test('should detect non-WSL environment', () => {
      const { execSync } = require('child_process');
      execSync.mockReturnValueOnce(Buffer.from('Linux version 5.4.0-generic'));
      
      const platformInfo = pathCache._getPlatformInfo();
      expect(platformInfo.platform).toBe(process.platform);
      expect(platformInfo.isWSL).toBe(false);
    });

    test('should handle errors gracefully', () => {
      const { execSync } = require('child_process');
      execSync.mockImplementationOnce(() => {
        throw new Error('Command failed');
      });
      
      const platformInfo = pathCache._getPlatformInfo();
      expect(platformInfo.platform).toBe(process.platform);
      expect(platformInfo.isWSL).toBe(false);
    });
  });

  describe('_isPlatformMatch', () => {
    test('should return true when platforms match', () => {
      const currentInfo = { platform: 'linux', isWSL: true };
      const cachedInfo = { platform: 'linux', isWSL: true };
      
      // Mock _getPlatformInfo to return the current info
      jest.spyOn(pathCache, '_getPlatformInfo').mockReturnValueOnce(currentInfo);
      
      expect(pathCache._isPlatformMatch(cachedInfo)).toBe(true);
    });

    test('should return false when platforms differ', () => {
      const currentInfo = { platform: 'linux', isWSL: true };
      const cachedInfo = { platform: 'win32', isWSL: false };
      
      // Mock _getPlatformInfo to return the current info
      jest.spyOn(pathCache, '_getPlatformInfo').mockReturnValueOnce(currentInfo);
      
      expect(pathCache._isPlatformMatch(cachedInfo)).toBe(false);
    });

    test('should return false when WSL status differs', () => {
      const currentInfo = { platform: 'linux', isWSL: true };
      const cachedInfo = { platform: 'linux', isWSL: false };
      
      // Mock _getPlatformInfo to return the current info
      jest.spyOn(pathCache, '_getPlatformInfo').mockReturnValueOnce(currentInfo);
      
      expect(pathCache._isPlatformMatch(cachedInfo)).toBe(false);
    });

    test('should return false when cached info is null', () => {
      expect(pathCache._isPlatformMatch(null)).toBe(false);
    });
  });

  describe('get and set', () => {
    test('should store and retrieve values', () => {
      pathCache.set('test_key', 'test_value');
      expect(pathCache.get('test_key')).toBe('test_value');
    });

    test('should return null for non-existent keys', () => {
      expect(pathCache.get('non_existent_key')).toBeNull();
    });

    test('should handle TTL expiration', () => {
      // Mock Date.now to control time
      const originalNow = Date.now;
      const mockNow = jest.fn();
      
      // Set initial time
      mockNow.mockReturnValueOnce(1000);
      global.Date.now = mockNow;
      
      // Set a value with TTL of 1000ms
      pathCache.set('expiring_key', 'expiring_value', 1000);
      
      // Check value before expiration
      expect(pathCache.get('expiring_key')).toBe('expiring_value');
      
      // Advance time past expiration
      mockNow.mockReturnValueOnce(2001);
      global.Date.now = mockNow;
      
      // Value should be expired
      expect(pathCache.get('expiring_key')).toBeNull();
      
      // Restore original Date.now
      global.Date.now = originalNow;
    });
  });

  describe('invalidate', () => {
    test('should remove a specific key', () => {
      pathCache.set('key1', 'value1');
      pathCache.set('key2', 'value2');
      
      pathCache.invalidate('key1');
      
      expect(pathCache.get('key1')).toBeNull();
      expect(pathCache.get('key2')).toBe('value2');
    });
  });

  describe('clear', () => {
    test('should remove all keys', () => {
      pathCache.set('key1', 'value1');
      pathCache.set('key2', 'value2');
      
      pathCache.clear();
      
      expect(pathCache.get('key1')).toBeNull();
      expect(pathCache.get('key2')).toBeNull();
    });
  });

  describe('save', () => {
    test('should create directory and save cache to disk', async () => {
      fs.mkdir.mockResolvedValueOnce(undefined);
      fs.writeFile.mockResolvedValueOnce(undefined);
      
      pathCache.set('key1', 'value1');
      
      const result = await pathCache.save();
      
      expect(result).toBe(true);
      expect(fs.mkdir).toHaveBeenCalledWith(path.dirname(pathCache.cacheFile), { recursive: true });
      expect(fs.writeFile).toHaveBeenCalled();
      
      // Check that the serialized data includes platformInfo
      const serializedData = JSON.parse(fs.writeFile.mock.calls[0][1]);
      expect(serializedData).toHaveProperty('platformInfo');
      expect(serializedData).toHaveProperty('entries');
      expect(serializedData.entries).toHaveProperty('key1');
    });

    test('should handle errors', async () => {
      fs.mkdir.mockRejectedValueOnce(new Error('Failed to create directory'));
      
      const result = await pathCache.save();
      
      expect(result).toBe(false);
    });
  });

  describe('load', () => {
    test('should load cache from disk', async () => {
      // Mock cache file content
      const mockCache = {
        platformInfo: {
          platform: process.platform,
          isWSL: false
        },
        entries: {
          key1: { value: 'value1', expires: null }
        }
      };
      
      fs.access.mockResolvedValueOnce(undefined);
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockCache));
      
      // Mock platform match
      jest.spyOn(pathCache, '_isPlatformMatch').mockReturnValueOnce(true);
      
      const result = await pathCache.load();
      
      expect(result).toBe(true);
      expect(pathCache.get('key1')).toBe('value1');
    });

    test('should handle missing cache file', async () => {
      fs.access.mockRejectedValueOnce({ code: 'ENOENT' });
      
      const result = await pathCache.load();
      
      expect(result).toBe(false);
    });

    test('should handle invalid JSON', async () => {
      fs.access.mockResolvedValueOnce(undefined);
      fs.readFile.mockResolvedValueOnce('invalid json');
      
      const result = await pathCache.load();
      
      expect(result).toBe(false);
    });

    test('should handle platform change', async () => {
      // Mock cache file content
      const mockCache = {
        platformInfo: {
          platform: 'different-platform',
          isWSL: !pathCache._getPlatformInfo().isWSL
        },
        entries: {
          key1: { value: 'value1', expires: null }
        }
      };
      
      fs.access.mockResolvedValueOnce(undefined);
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockCache));
      
      // Mock platform mismatch
      jest.spyOn(pathCache, '_isPlatformMatch').mockReturnValueOnce(false);
      
      const result = await pathCache.load();
      
      expect(result).toBe(false);
      expect(pathCache.get('key1')).toBeNull(); // Cache should not be loaded
    });

    test('should handle legacy cache format', async () => {
      // Mock legacy cache file content (no platformInfo)
      const mockLegacyCache = {
        key1: { value: 'value1', expires: null }
      };
      
      fs.access.mockResolvedValueOnce(undefined);
      fs.readFile.mockResolvedValueOnce(JSON.stringify(mockLegacyCache));
      
      // Mock platform match to return true for legacy format
      jest.spyOn(pathCache, '_isPlatformMatch').mockReturnValueOnce(true);
      
      const result = await pathCache.load();
      
      expect(result).toBe(true);
      expect(pathCache.get('key1')).toBe('value1');
    });
  });
}); 