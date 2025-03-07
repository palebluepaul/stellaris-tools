# Data Models Documentation

This directory contains the data models used in the Stellaris Tech Tree Viewer. These models represent the core data structures of the application.

## Overview

The application uses several key data models:

1. **Tech**: Represents a single technology from the game
2. **TechDatabase**: Manages a collection of technologies and their relationships
3. **Mod**: Represents a Stellaris mod
4. **Playset**: Represents a collection of mods (a "playset" in the Stellaris launcher)

## Tech Model

The `Tech` class represents a single technology from Stellaris.

### Properties

- `id`: Unique identifier for the technology
- `name`: Internal name of the technology
- `displayName`: User-friendly name of the technology
- `area`: Research area (physics, society, engineering)
- `tier`: Technology tier (0-5)
- `cost`: Research cost
- `category`: Array of categories the technology belongs to
- `prerequisites`: Array of prerequisite technology IDs
- `isStartingTech`: Whether this is a starting technology
- `isRare`: Whether this is a rare technology
- `isDangerous`: Whether this is a dangerous technology
- `weight`: Base weight for research options
- `sourceFile`: Path to the file this technology was loaded from
- `sourceModId`: ID of the mod this technology came from (if applicable)
- `sourceModName`: Name of the mod this technology came from (if applicable)

### Methods

- `getEffectiveCost()`: Calculate the effective research cost
- `addChildTech(techId)`: Add a technology that requires this one
- `getChildTechs()`: Get all technologies that require this one
- `isPhysics()`: Check if this is a physics technology
- `isSociety()`: Check if this is a society technology
- `isEngineering()`: Check if this is an engineering technology
- `toJSON()`: Convert to a JSON-serializable object

## TechDatabase Model

The `TechDatabase` class manages a collection of technologies and their relationships.

### Properties

- `technologies`: Map of technology IDs to Tech objects
- `areas`: Map of area IDs to area objects
- `categories`: Map of category IDs to category objects

### Methods

- `initialize()`: Initialize the database
- `clear()`: Clear all technologies from the database
- `addTechnology(tech)`: Add a single technology to the database
- `addTechnologies(techs)`: Add multiple technologies to the database
- `getTechnology(id)`: Get a technology by ID
- `getAllTechnologies()`: Get all technologies
- `getTechnologiesByArea(areaId)`: Get technologies in a specific area
- `getTechnologiesByCategory(categoryId)`: Get technologies in a specific category
- `getTechnologiesByTier(tier)`: Get technologies of a specific tier
- `getAllAreas()`: Get all research areas
- `getAllCategories()`: Get all technology categories
- `buildTechTree()`: Build the technology tree by resolving prerequisites
- `getPrerequisites(techId)`: Get prerequisites for a technology
- `getDependentTechnologies(techId)`: Get technologies that depend on a technology

## Mod Model

The `Mod` class represents a Stellaris mod.

### Properties

- `id`: Unique identifier for the mod
- `name`: Name of the mod
- `displayName`: User-friendly name of the mod
- `enabled`: Whether the mod is enabled
- `position`: Position in the load order
- `dirPath`: Path to the mod directory
- `steamId`: Steam Workshop ID (if applicable)
- `version`: Mod version

### Methods

- `isEnabled()`: Check if the mod is enabled
- `toJSON()`: Convert to a JSON-serializable object

## Playset Model

The `Playset` class represents a collection of mods (a "playset" in the Stellaris launcher).

### Properties

- `id`: Unique identifier for the playset
- `name`: Name of the playset
- `isActive`: Whether this is the active playset
- `mods`: Array of Mod objects

### Methods

- `getModCount()`: Get the total number of mods
- `getEnabledModCount()`: Get the number of enabled mods
- `getEnabledMods()`: Get all enabled mods
- `getModById(id)`: Get a mod by ID
- `toJSON()`: Convert to a JSON-serializable object

## Usage Examples

### Working with Technologies

```javascript
// Create a new technology
const tech = new Tech({
  id: 'tech_lasers_1',
  name: 'Red Lasers',
  area: 'physics',
  tier: 0,
  cost: 100,
  category: ['particles'],
  prerequisites: []
});

// Check if it's a physics technology
if (tech.isPhysics()) {
  console.log('This is a physics technology');
}

// Get the effective cost
const cost = tech.getEffectiveCost();
```

### Working with the Technology Database

```javascript
// Create a new technology database
const techDb = new TechDatabase();
await techDb.initialize();

// Add technologies
techDb.addTechnology(tech1);
techDb.addTechnology(tech2);

// Build the technology tree
techDb.buildTechTree();

// Get technologies by area
const physicsTechs = techDb.getTechnologiesByArea('physics');

// Get prerequisites for a technology
const prerequisites = techDb.getPrerequisites('tech_battleships');
```

### Working with Mods and Playsets

```javascript
// Create a new mod
const mod = new Mod({
  id: 'mod1',
  name: 'My Mod',
  enabled: true,
  position: 1
});

// Create a new playset
const playset = new Playset({
  id: 'playset1',
  name: 'My Playset',
  isActive: true,
  mods: [mod]
});

// Get enabled mods
const enabledMods = playset.getEnabledMods();
```

## Data Flow

1. The application loads mod information from the Stellaris launcher database
2. It identifies the active playset and enabled mods
3. It loads technology definitions from the base game and enabled mods
4. It builds a consolidated technology database
5. It resolves technology relationships to build the technology tree

## Future Enhancements

Planned enhancements for the data models:

1. **Localization Support**: Add support for localized technology names and descriptions
2. **Save Game Integration**: Add support for tracking researched technologies from save games
3. **Technology Weights**: Implement more sophisticated weight calculation for research options
4. **Technology Effects**: Add support for parsing and representing technology effects 