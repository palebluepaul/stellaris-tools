const TechService = require('../../src/services/techService');
const TechParser = require('../../src/parsers/techParser');
const TechDatabase = require('../../src/models/techDatabase');
const ModRepository = require('../../src/database/modRepository');
const Tech = require('../../src/models/tech');
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('../../src/parsers/techParser');
jest.mock('../../src/models/techDatabase');
jest.mock('../../src/database/modRepository');
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readdir: jest.fn()
  }
}));

describe('TechService', () => {
  let techService;
  let mockParser;
  let mockDatabase;
  let mockModRepository;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockParser = new TechParser();
    mockDatabase = new TechDatabase();
    mockModRepository = new ModRepository();
    
    // Setup mock implementations
    mockParser.initialize.mockResolvedValue();
    mockParser.parseFile.mockResolvedValue([]);
    
    mockDatabase.initialize.mockResolvedValue();
    mockDatabase.addTechnologies.mockReturnValue(0);
    mockDatabase.buildTechTree.mockReturnValue();
    
    mockModRepository.initialize.mockResolvedValue();
    mockModRepository.getActiveMods.mockResolvedValue([]);
    
    fs.access.mockResolvedValue();
    fs.readdir.mockResolvedValue([]);
    
    // Create service with mocked dependencies
    techService = new TechService();
    techService.parser = mockParser;
    techService.database = mockDatabase;
    techService.modRepository = mockModRepository;
  });

  describe('initialization', () => {
    it('should initialize all dependencies', async () => {
      await techService.initialize();
      
      expect(mockParser.initialize).toHaveBeenCalled();
      expect(mockDatabase.initialize).toHaveBeenCalled();
      expect(mockModRepository.initialize).toHaveBeenCalled();
      expect(techService._initialized).toBe(true);
    });

    it('should not initialize twice', async () => {
      await techService.initialize();
      await techService.initialize();
      
      expect(mockParser.initialize).toHaveBeenCalledTimes(1);
      expect(mockDatabase.initialize).toHaveBeenCalledTimes(1);
      expect(mockModRepository.initialize).toHaveBeenCalledTimes(1);
    });
  });

  describe('loadTechFile', () => {
    it('should parse the file and add technologies to the database', async () => {
      const mockTechs = [
        new Tech({ id: 'tech_1', name: 'Tech 1' }),
        new Tech({ id: 'tech_2', name: 'Tech 2' })
      ];
      
      mockParser.parseFile.mockResolvedValue(mockTechs);
      mockDatabase.addTechnologies.mockReturnValue(2);
      
      const result = await techService.loadTechFile('test/path.txt', 'mod1', 'Test Mod');
      
      expect(result).toBe(2);
      expect(mockParser.parseFile).toHaveBeenCalledWith('test/path.txt', 'mod1');
      expect(mockDatabase.addTechnologies).toHaveBeenCalled();
      
      // Check that source information was added
      const techsAddedToDatabase = mockDatabase.addTechnologies.mock.calls[0][0];
      expect(techsAddedToDatabase[0].sourceFile).toBe('test/path.txt');
      expect(techsAddedToDatabase[0].sourceModName).toBe('Test Mod');
      expect(techsAddedToDatabase[1].sourceFile).toBe('test/path.txt');
      expect(techsAddedToDatabase[1].sourceModName).toBe('Test Mod');
    });

    it('should handle file not found', async () => {
      fs.access.mockRejectedValue(new Error('File not found'));
      
      const result = await techService.loadTechFile('nonexistent/path.txt');
      
      expect(result).toBe(0);
      expect(mockParser.parseFile).not.toHaveBeenCalled();
      expect(mockDatabase.addTechnologies).not.toHaveBeenCalled();
    });

    it('should handle parser errors', async () => {
      mockParser.parseFile.mockRejectedValue(new Error('Parser error'));
      
      const result = await techService.loadTechFile('test/path.txt');
      
      expect(result).toBe(0);
      expect(mockParser.parseFile).toHaveBeenCalled();
      expect(mockDatabase.addTechnologies).not.toHaveBeenCalled();
    });
  });

  describe('loadTechDirectory', () => {
    it('should process all technology files in a directory', async () => {
      // Mock directory contents
      fs.readdir.mockResolvedValue([
        { name: 'tech1.txt', isDirectory: () => false, isFile: () => true },
        { name: 'tech2.txt', isDirectory: () => false, isFile: () => true },
        { name: 'subdir', isDirectory: () => true, isFile: () => false },
        { name: 'not_a_tech.png', isDirectory: () => false, isFile: () => true }
      ]);
      
      // Mock loadTechFile to return success for each file
      techService.loadTechFile = jest.fn()
        .mockResolvedValueOnce(2) // tech1.txt
        .mockResolvedValueOnce(3); // tech2.txt
      
      // Mock recursive call to loadTechDirectory
      techService.loadTechDirectory = jest.fn()
        .mockImplementationOnce(techService.loadTechDirectory.bind(techService)) // Original call
        .mockResolvedValueOnce(4); // subdir
      
      const result = await techService.loadTechDirectory('test/dir', 'mod1', 'Test Mod');
      
      expect(result).toBe(9); // 2 + 3 + 4
      expect(techService.loadTechFile).toHaveBeenCalledWith(
        path.join('test/dir', 'tech1.txt'), 'mod1', 'Test Mod'
      );
      expect(techService.loadTechFile).toHaveBeenCalledWith(
        path.join('test/dir', 'tech2.txt'), 'mod1', 'Test Mod'
      );
      expect(techService.loadTechDirectory).toHaveBeenCalledWith(
        path.join('test/dir', 'subdir'), 'mod1', 'Test Mod', true
      );
      
      // Should not try to load non-tech files
      expect(techService.loadTechFile).not.toHaveBeenCalledWith(
        path.join('test/dir', 'not_a_tech.png'), 'mod1', 'Test Mod'
      );
    });

    it('should handle directory not found', async () => {
      fs.access.mockRejectedValue(new Error('Directory not found'));
      
      const result = await techService.loadTechDirectory('nonexistent/dir');
      
      expect(result).toBe(0);
      expect(fs.readdir).not.toHaveBeenCalled();
    });
  });

  describe('loadBaseGameTechnologies', () => {
    it('should load technologies from the base game directory', async () => {
      // Mock loadTechDirectory to return success
      techService.loadTechDirectory = jest.fn().mockResolvedValue(42);
      
      const result = await techService.loadBaseGameTechnologies('/game/path');
      
      expect(result).toBe(42);
      expect(techService.loadTechDirectory).toHaveBeenCalledWith(
        path.join('/game/path', 'common', 'technology'), '', 'Base Game'
      );
      expect(mockDatabase.buildTechTree).toHaveBeenCalled();
    });
  });

  describe('loadModTechnologies', () => {
    it('should load technologies from all active mods', async () => {
      // Mock active mods
      const activeMods = [
        { id: 'mod1', name: 'Mod 1', dirPath: '/mods/mod1' },
        { id: 'mod2', name: 'Mod 2', dirPath: '/mods/mod2' },
        { id: 'mod3', name: 'Mod 3', dirPath: null } // Invalid mod
      ];
      
      mockModRepository.getActiveMods.mockResolvedValue(activeMods);
      
      // Mock loadTechDirectory to return success for each mod
      techService.loadTechDirectory = jest.fn()
        .mockResolvedValueOnce(10) // mod1
        .mockResolvedValueOnce(15); // mod2
      
      const result = await techService.loadModTechnologies('/game/path');
      
      expect(result).toBe(25); // 10 + 15
      expect(techService.loadTechDirectory).toHaveBeenCalledWith(
        path.join('/mods/mod1', 'common', 'technology'), 'mod1', 'Mod 1'
      );
      expect(techService.loadTechDirectory).toHaveBeenCalledWith(
        path.join('/mods/mod2', 'common', 'technology'), 'mod2', 'Mod 2'
      );
      
      // Should not try to load from invalid mod
      expect(techService.loadTechDirectory).not.toHaveBeenCalledWith(
        expect.stringContaining('mod3'), 'mod3', 'Mod 3'
      );
      
      expect(mockDatabase.buildTechTree).toHaveBeenCalled();
    });

    it('should handle mods without technology directories', async () => {
      // Mock active mods
      const activeMods = [
        { id: 'mod1', name: 'Mod 1', dirPath: '/mods/mod1' }
      ];
      
      mockModRepository.getActiveMods.mockResolvedValue(activeMods);
      
      // Mock fs.access to fail for the technology directory
      fs.access.mockRejectedValue(new Error('Directory not found'));
      
      const result = await techService.loadModTechnologies('/game/path');
      
      expect(result).toBe(0);
      expect(techService.loadTechDirectory).not.toHaveBeenCalled();
      expect(mockDatabase.buildTechTree).toHaveBeenCalled();
    });
  });

  describe('loadAllTechnologies', () => {
    it('should load technologies from base game and mods', async () => {
      // Mock loadBaseGameTechnologies and loadModTechnologies
      techService.loadBaseGameTechnologies = jest.fn().mockResolvedValue(50);
      techService.loadModTechnologies = jest.fn().mockResolvedValue(75);
      
      const result = await techService.loadAllTechnologies('/game/path');
      
      expect(result).toBe(125); // 50 + 75
      expect(mockDatabase.clear).toHaveBeenCalled();
      expect(techService.loadBaseGameTechnologies).toHaveBeenCalledWith('/game/path');
      expect(techService.loadModTechnologies).toHaveBeenCalledWith('/game/path');
    });
  });

  describe('data access methods', () => {
    it('should delegate to the database', () => {
      // Mock database methods
      mockDatabase.getAllTechnologies.mockReturnValue([]);
      mockDatabase.getTechnology.mockReturnValue(null);
      mockDatabase.getTechnologiesByArea.mockReturnValue([]);
      mockDatabase.getTechnologiesByCategory.mockReturnValue([]);
      mockDatabase.getTechnologiesByTier.mockReturnValue([]);
      mockDatabase.getAllAreas.mockReturnValue([]);
      mockDatabase.getAllCategories.mockReturnValue([]);
      mockDatabase.getPrerequisites.mockReturnValue([]);
      mockDatabase.getDependentTechnologies.mockReturnValue([]);
      
      // Call service methods
      techService.getAllTechnologies();
      techService.getTechnology('tech_1');
      techService.getTechnologiesByArea('physics');
      techService.getTechnologiesByCategory('materials');
      techService.getTechnologiesByTier(1);
      techService.getAllAreas();
      techService.getAllCategories();
      techService.getPrerequisites('tech_1');
      techService.getDependentTechnologies('tech_1');
      
      // Verify database methods were called
      expect(mockDatabase.getAllTechnologies).toHaveBeenCalled();
      expect(mockDatabase.getTechnology).toHaveBeenCalledWith('tech_1');
      expect(mockDatabase.getTechnologiesByArea).toHaveBeenCalledWith('physics');
      expect(mockDatabase.getTechnologiesByCategory).toHaveBeenCalledWith('materials');
      expect(mockDatabase.getTechnologiesByTier).toHaveBeenCalledWith(1);
      expect(mockDatabase.getAllAreas).toHaveBeenCalled();
      expect(mockDatabase.getAllCategories).toHaveBeenCalled();
      expect(mockDatabase.getPrerequisites).toHaveBeenCalledWith('tech_1');
      expect(mockDatabase.getDependentTechnologies).toHaveBeenCalledWith('tech_1');
    });
  });

  describe('utility methods', () => {
    it('should identify technology files correctly', () => {
      expect(techService._isTechFile('tech.txt')).toBe(true);
      expect(techService._isTechFile('tech.TXT')).toBe(true);
      expect(techService._isTechFile('tech.png')).toBe(false);
      expect(techService._isTechFile('tech')).toBe(false);
    });
  });
}); 