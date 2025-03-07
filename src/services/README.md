# Technology Service Documentation

The `TechService` class is the central component for managing technology data in the Stellaris Tech Tree Viewer. It handles loading, parsing, and querying technology data from the game and mods.

## Overview

The technology service provides these main functions:

1. Loading technology data from game files and mods
2. Building a consolidated technology database
3. Querying technologies by various criteria
4. Resolving technology relationships (prerequisites and dependents)

## Key Components

### TechFileCache

A simple in-memory cache for parsed technology files. It stores parsed results based on file path and modification time to avoid re-parsing unchanged files.

```javascript
class TechFileCache {
  constructor() { ... }
  get(filePath, stats) { ... }
  set(filePath, stats, data) { ... }
  clear() { ... }
  getStats() { ... }
}
```

### TechService

The main service class that orchestrates technology data management.

```javascript
class TechService {
  constructor() { ... }
  async initialize() { ... }
  async loadTechFile(filePath, modId, modName) { ... }
  async loadTechDirectory(dirPath, modId, modName, recursive) { ... }
  async loadBaseGameTechnologies(gamePath) { ... }
  async loadModTechnologies(gamePath) { ... }
  async loadAllTechnologies(gamePath) { ... }
  getAllTechnologies() { ... }
  getTechnology(id) { ... }
  getTechnologiesByArea(areaId) { ... }
  getTechnologiesByCategory(categoryId) { ... }
  getTechnologiesByTier(tier) { ... }
  getAllAreas() { ... }
  getAllCategories() { ... }
  getPrerequisites(techId) { ... }
  getDependentTechnologies(techId) { ... }
}
```

## Usage Examples

### Loading All Technologies

```javascript
const techService = new TechService();
await techService.initialize();

// Load all technologies from the game and mods
const loadResult = await techService.loadAllTechnologies(gamePath);
console.log(`Loaded ${loadResult.totalCount} technologies`);
```

### Querying Technologies

```javascript
// Get all technologies
const allTechs = techService.getAllTechnologies();

// Get technologies by area
const physicsTechs = techService.getTechnologiesByArea('physics');

// Get technologies by category
const computingTechs = techService.getTechnologiesByCategory('computing');

// Get technologies by tier
const tier3Techs = techService.getTechnologiesByTier(3);
```

### Working with Technology Relationships

```javascript
// Get prerequisites for a technology
const prerequisites = techService.getPrerequisites('tech_battleships');

// Get technologies that depend on a technology
const dependents = techService.getDependentTechnologies('tech_lasers_1');
```

## Performance Considerations

The technology service includes several performance optimizations:

1. **File Caching**: Parsed technology files are cached to avoid re-parsing unchanged files
2. **Lazy Loading**: Technologies are loaded on demand when possible
3. **Efficient Lookups**: The technology database uses maps for efficient lookups by ID

## Future Enhancements

Planned enhancements for the technology service:

1. **Persistent Caching**: Add disk-based caching for parsed technologies
2. **Parallel Loading**: Implement parallel loading of technology files
3. **Incremental Updates**: Support incremental updates when mods change
4. **Memory Optimization**: Optimize memory usage for large mod sets

## Integration with Other Components

The technology service integrates with:

1. **TechParser**: For parsing technology files
2. **TechDatabase**: For storing and querying technology data
3. **ModRepository**: For accessing mod information

## Error Handling

The technology service includes robust error handling:

1. **File Access Errors**: Gracefully handles missing or inaccessible files
2. **Parse Errors**: Reports and continues when individual files fail to parse
3. **Database Errors**: Handles database connection and query errors

## Logging

The technology service uses the application's logging system to provide detailed information about its operations:

1. **Info Level**: General operation information
2. **Debug Level**: Detailed debugging information
3. **Error Level**: Error reports with stack traces 