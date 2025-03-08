const PathResolver = require('../../src/utils/pathResolver');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;
const { execSync } = require('child_process');

// Mock dependencies
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readdir: jest.fn(),
    mkdir: jest.fn()
  }
}));

jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}));

describe('PathResolver', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isWSL', () => {
    test('should return true when running in WSL', () => {
      execSync.mockReturnValueOnce(Buffer.from('Linux version 4.4.0-19041-Microsoft'));
      expect(PathResolver.isWSL()).toBe(true);
    });

    test('should return false when not running in WSL', () => {
      execSync.mockReturnValueOnce(Buffer.from('Linux version 5.4.0-generic'));
      expect(PathResolver.isWSL()).toBe(false);
    });

    test('should return false when command fails', () => {
      execSync.mockImplementationOnce(() => {
        throw new Error('Command failed');
      });
      expect(PathResolver.isWSL()).toBe(false);
    });
  });

  describe('getWindowsUsername', () => {
    test('should return Windows username when in WSL using directory listing', () => {
      execSync.mockReturnValueOnce(
        'total 0\n' +
        'drwxrwxrwx 1 root root 4096 Mar  8 13:44 .\n' +
        'drwxrwxrwx 1 root root 4096 Mar  8 13:44 ..\n' +
        'drwxrwxrwx 1 root root 4096 Mar  8 13:44 Public\n' +
        'drwxrwxrwx 1 root root 4096 Mar  8 13:44 testuser\n'
      );
      
      expect(PathResolver.getWindowsUsername()).toBe('testuser');
    });

    test('should return Windows username when in WSL using environment variable', () => {
      // First method fails (empty directory listing)
      execSync.mockReturnValueOnce('total 0\ndrwxrwxrwx 1 root root 4096 Mar  8 13:44 .\ndrwxrwxrwx 1 root root 4096 Mar  8 13:44 ..\n');
      // Second method succeeds
      execSync.mockReturnValueOnce(Buffer.from('testuser2\n'));
      
      expect(PathResolver.getWindowsUsername()).toBe('testuser2');
    });

    test('should return null when command fails', () => {
      execSync.mockImplementationOnce(() => {
        throw new Error('Command failed');
      });
      expect(PathResolver.getWindowsUsername()).toBeNull();
    });
  });

  describe('convertToWSLPath', () => {
    test('should convert Windows path to WSL path', () => {
      const result = PathResolver.convertToWSLPath('C:\\Users\\testuser\\Documents');
      expect(result).toBe('/mnt/c/Users/testuser/Documents');
    });

    test('should handle paths with mixed slashes', () => {
      const result = PathResolver.convertToWSLPath('C:/Users\\testuser/Documents');
      expect(result).toBe('/mnt/c/Users/testuser/Documents');
    });

    test('should return null for null input', () => {
      const result = PathResolver.convertToWSLPath(null);
      expect(result).toBeNull();
    });
  });

  describe('getHomeDir', () => {
    test('should return the user home directory when not in WSL', () => {
      jest.spyOn(PathResolver, 'isWSL').mockReturnValueOnce(false);
      const result = PathResolver.getHomeDir();
      expect(result).toBe(os.homedir());
    });

    test('should return Windows user home directory when in WSL', () => {
      jest.spyOn(PathResolver, 'isWSL').mockReturnValueOnce(true);
      jest.spyOn(PathResolver, 'getWindowsUsername').mockReturnValueOnce('testuser');
      const result = PathResolver.getHomeDir();
      expect(result).toBe('/mnt/c/Users/testuser');
    });

    test('should fall back to WSL home directory when Windows username not found', () => {
      jest.spyOn(PathResolver, 'isWSL').mockReturnValueOnce(true);
      jest.spyOn(PathResolver, 'getWindowsUsername').mockReturnValueOnce(null);
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
      jest.spyOn(PathResolver, 'isWSL').mockReturnValueOnce(false);
      Object.defineProperty(process, 'platform', {
        value: 'win32'
      });
      
      const result = PathResolver.getDocumentsDir();
      expect(result).toBe(path.join(os.homedir(), 'Documents'));
    });
    
    test('should return the correct path for macOS', () => {
      jest.spyOn(PathResolver, 'isWSL').mockReturnValueOnce(false);
      Object.defineProperty(process, 'platform', {
        value: 'darwin'
      });
      
      const result = PathResolver.getDocumentsDir();
      expect(result).toBe(path.join(os.homedir(), 'Documents'));
    });
    
    test('should return the correct path for Linux', () => {
      jest.spyOn(PathResolver, 'isWSL').mockReturnValueOnce(false);
      Object.defineProperty(process, 'platform', {
        value: 'linux'
      });
      
      const result = PathResolver.getDocumentsDir();
      expect(result).toBe(path.join(os.homedir(), '.local', 'share'));
    });

    test('should return the correct path for WSL', () => {
      jest.spyOn(PathResolver, 'isWSL').mockReturnValueOnce(true);
      jest.spyOn(PathResolver, 'getHomeDir').mockReturnValueOnce('/mnt/c/Users/testuser');
      
      const result = PathResolver.getDocumentsDir();
      expect(result).toBe('/mnt/c/Users/testuser/Documents');
    });
  });

  describe('getStellarisUserDataDir', () => {
    test('should return the correct path', () => {
      jest.spyOn(PathResolver, 'getDocumentsDir').mockReturnValueOnce('/test/documents');
      const result = PathResolver.getStellarisUserDataDir();
      expect(result).toBe(path.join('/test/documents', 'Paradox Interactive', 'Stellaris'));
    });
  });

  describe('getLauncherDbPath', () => {
    test('should return the correct path', () => {
      jest.spyOn(PathResolver, 'getStellarisUserDataDir').mockReturnValueOnce('/test/stellaris');
      const result = PathResolver.getLauncherDbPath();
      expect(result).toBe(path.join('/test/stellaris', 'launcher-v2.sqlite'));
    });
  });

  describe('getSaveGamesDir', () => {
    test('should return the correct path', () => {
      jest.spyOn(PathResolver, 'getStellarisUserDataDir').mockReturnValueOnce('/test/stellaris');
      const result = PathResolver.getSaveGamesDir();
      expect(result).toBe(path.join('/test/stellaris', 'save games'));
    });
  });

  describe('getWorkshopModsDir', () => {
    test('should return the correct path for WSL when found', async () => {
      jest.spyOn(PathResolver, 'isWSL').mockReturnValueOnce(true);
      jest.spyOn(PathResolver, 'getWindowsUsername').mockReturnValueOnce('testuser');
      fs.access.mockResolvedValueOnce(undefined);
      
      const result = await PathResolver.getWorkshopModsDir();
      expect(result).toBe(path.join('/mnt/c/Program Files (x86)/Steam', 'steamapps/workshop/content/281990'));
    });

    test('should return null when path not found in WSL', async () => {
      jest.spyOn(PathResolver, 'isWSL').mockReturnValueOnce(true);
      jest.spyOn(PathResolver, 'getWindowsUsername').mockReturnValueOnce('testuser');
      fs.access.mockRejectedValue(new Error('ENOENT'));
      
      const result = await PathResolver.getWorkshopModsDir();
      expect(result).toBeNull();
    });
  });

  describe('getGameInstallDir', () => {
    test('should return the correct path for WSL when found', async () => {
      jest.spyOn(PathResolver, 'isWSL').mockReturnValueOnce(true);
      jest.spyOn(PathResolver, 'getWindowsUsername').mockReturnValueOnce('testuser');
      fs.access.mockResolvedValueOnce(undefined);
      
      const result = await PathResolver.getGameInstallDir();
      expect(result).toBe('/mnt/c/Program Files (x86)/Steam/steamapps/common/Stellaris');
    });

    test('should return null when path not found in WSL', async () => {
      jest.spyOn(PathResolver, 'isWSL').mockReturnValueOnce(true);
      jest.spyOn(PathResolver, 'getWindowsUsername').mockReturnValueOnce('testuser');
      fs.access.mockRejectedValue(new Error('ENOENT'));
      
      const result = await PathResolver.getGameInstallDir();
      expect(result).toBeNull();
    });
  });

  describe('validatePath', () => {
    test('should return true when path exists', async () => {
      fs.access.mockResolvedValueOnce(undefined);
      const result = await PathResolver.validatePath('/test/path');
      expect(result).toBe(true);
    });

    test('should return false when path does not exist', async () => {
      fs.access.mockRejectedValueOnce(new Error('ENOENT'));
      const result = await PathResolver.validatePath('/test/path');
      expect(result).toBe(false);
    });
  });

  describe('ensureDir', () => {
    test('should return true when directory exists', async () => {
      fs.access.mockResolvedValueOnce(undefined);
      const result = await PathResolver.ensureDir('/test/dir');
      expect(result).toBe(true);
      expect(fs.mkdir).not.toHaveBeenCalled();
    });

    test('should create directory and return true when directory does not exist', async () => {
      fs.access.mockRejectedValueOnce(new Error('ENOENT'));
      fs.mkdir.mockResolvedValueOnce(undefined);
      const result = await PathResolver.ensureDir('/test/dir');
      expect(result).toBe(true);
      expect(fs.mkdir).toHaveBeenCalledWith('/test/dir', { recursive: true });
    });

    test('should return false when directory creation fails', async () => {
      fs.access.mockRejectedValueOnce(new Error('ENOENT'));
      fs.mkdir.mockRejectedValueOnce(new Error('Permission denied'));
      const result = await PathResolver.ensureDir('/test/dir');
      expect(result).toBe(false);
    });
  });

  describe('findFiles', () => {
    test('should return matching files', async () => {
      const mockEntries = [
        { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
        { name: 'file2.log', isDirectory: () => false, isFile: () => true },
        { name: 'subdir', isDirectory: () => true, isFile: () => false }
      ];
      
      fs.readdir.mockResolvedValueOnce(mockEntries);
      
      const result = await PathResolver.findFiles('/test/dir', /\.txt$/);
      expect(result).toEqual([path.join('/test/dir', 'file1.txt')]);
    });

    test('should search recursively when specified', async () => {
      const mockEntries = [
        { name: 'file1.txt', isDirectory: () => false, isFile: () => true },
        { name: 'subdir', isDirectory: () => true, isFile: () => false }
      ];
      
      const mockSubEntries = [
        { name: 'file2.txt', isDirectory: () => false, isFile: () => true }
      ];
      
      fs.readdir.mockResolvedValueOnce(mockEntries);
      fs.readdir.mockResolvedValueOnce(mockSubEntries);
      
      const result = await PathResolver.findFiles('/test/dir', /\.txt$/, true);
      expect(result).toEqual([
        path.join('/test/dir', 'file1.txt'),
        path.join('/test/dir', 'subdir', 'file2.txt')
      ]);
    });

    test('should handle errors gracefully', async () => {
      fs.readdir.mockRejectedValueOnce(new Error('Permission denied'));
      
      const result = await PathResolver.findFiles('/test/dir', /\.txt$/);
      expect(result).toEqual([]);
    });
  });
}); 