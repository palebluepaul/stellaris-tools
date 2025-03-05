const PathResolver = require('../../src/utils/pathResolver');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;

// Mock fs.promises
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readdir: jest.fn(),
    mkdir: jest.fn()
  }
}));

describe('PathResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHomeDir', () => {
    test('should return the user home directory', () => {
      const result = PathResolver.getHomeDir();
      expect(result).toBe(os.homedir());
    });
  });

  describe('getDocumentsDir', () => {
    const originalPlatform = process.platform;
    
    afterEach(() => {
      Object.defineProperty(process, 'platform', {
        value: originalPlatform
      });
    });
    
    test('should return the correct path for Windows', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });
      
      const result = PathResolver.getDocumentsDir();
      expect(result).toBe(path.join(os.homedir(), 'Documents'));
    });
    
    test('should return the correct path for macOS', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      });
      
      const result = PathResolver.getDocumentsDir();
      expect(result).toBe(path.join(os.homedir(), 'Documents'));
    });
    
    test('should return the correct path for Linux', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux'
      });
      
      const result = PathResolver.getDocumentsDir();
      expect(result).toBe(path.join(os.homedir(), '.local', 'share'));
    });
  });

  describe('getStellarisUserDataDir', () => {
    test('should return the correct path', () => {
      const documentsDir = PathResolver.getDocumentsDir();
      const result = PathResolver.getStellarisUserDataDir();
      expect(result).toBe(path.join(documentsDir, 'Paradox Interactive', 'Stellaris'));
    });
  });

  describe('getLauncherDbPath', () => {
    test('should return the correct path', () => {
      const userDataDir = PathResolver.getStellarisUserDataDir();
      const result = PathResolver.getLauncherDbPath();
      expect(result).toBe(path.join(userDataDir, 'launcher-v2.sqlite'));
    });
  });

  describe('getSaveGamesDir', () => {
    test('should return the correct path', () => {
      const userDataDir = PathResolver.getStellarisUserDataDir();
      const result = PathResolver.getSaveGamesDir();
      expect(result).toBe(path.join(userDataDir, 'save games'));
    });
  });

  describe('validatePath', () => {
    test('should return true if path exists', async () => {
      fs.access.mockResolvedValue(undefined);
      
      const result = await PathResolver.validatePath('/valid/path');
      
      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith('/valid/path');
    });
    
    test('should return false if path does not exist', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));
      
      const result = await PathResolver.validatePath('/invalid/path');
      
      expect(result).toBe(false);
      expect(fs.access).toHaveBeenCalledWith('/invalid/path');
    });
  });

  describe('ensureDir', () => {
    test('should return true if directory exists', async () => {
      fs.access.mockResolvedValue(undefined);
      
      const result = await PathResolver.ensureDir('/existing/dir');
      
      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith('/existing/dir');
      expect(fs.mkdir).not.toHaveBeenCalled();
    });
    
    test('should create directory and return true if it does not exist', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));
      fs.mkdir.mockResolvedValue(undefined);
      
      const result = await PathResolver.ensureDir('/new/dir');
      
      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith('/new/dir');
      expect(fs.mkdir).toHaveBeenCalledWith('/new/dir', { recursive: true });
    });
    
    test('should return false if directory creation fails', async () => {
      fs.access.mockRejectedValue(new Error('ENOENT'));
      fs.mkdir.mockRejectedValue(new Error('Permission denied'));
      
      const result = await PathResolver.ensureDir('/protected/dir');
      
      expect(result).toBe(false);
      expect(fs.access).toHaveBeenCalledWith('/protected/dir');
      expect(fs.mkdir).toHaveBeenCalledWith('/protected/dir', { recursive: true });
    });
  });

  describe('findFiles', () => {
    test('should return matching files in a directory', async () => {
      const mockEntries = [
        { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
        { name: 'file2.txt', isDirectory: () => false, isFile: () => true },
        { name: 'file3.jpg', isDirectory: () => false, isFile: () => true }
      ];
      
      fs.readdir.mockResolvedValue(mockEntries);
      
      const result = await PathResolver.findFiles('/test/dir', /\.txt$/);
      
      expect(result).toEqual([
        path.join('/test/dir', 'file1.txt'),
        path.join('/test/dir', 'file2.txt')
      ]);
      expect(fs.readdir).toHaveBeenCalledWith('/test/dir', { withFileTypes: true });
    });
    
    test('should search recursively if specified', async () => {
      const mockEntries = [
        { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
        { name: 'subdir', isDirectory: () => true, isFile: () => false }
      ];
      
      const mockSubEntries = [
        { name: 'file2.txt', isDirectory: () => false, isFile: () => true }
      ];
      
      fs.readdir
        .mockResolvedValueOnce(mockEntries)
        .mockResolvedValueOnce(mockSubEntries);
      
      const result = await PathResolver.findFiles('/test/dir', /\.txt$/, true);
      
      expect(result).toEqual([
        path.join('/test/dir', 'file1.txt'),
        path.join('/test/dir', 'subdir', 'file2.txt')
      ]);
      expect(fs.readdir).toHaveBeenCalledWith('/test/dir', { withFileTypes: true });
      expect(fs.readdir).toHaveBeenCalledWith(path.join('/test/dir', 'subdir'), { withFileTypes: true });
    });
    
    test('should handle errors gracefully', async () => {
      fs.readdir.mockRejectedValue(new Error('Permission denied'));
      
      const result = await PathResolver.findFiles('/protected/dir', /\.txt$/);
      
      expect(result).toEqual([]);
      expect(fs.readdir).toHaveBeenCalledWith('/protected/dir', { withFileTypes: true });
    });
  });
}); 