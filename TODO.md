# Stellaris Tech Tree Viewer - Design Specification

## Project Overview

This application will create an interactive tech tree visualization for Stellaris based on the user's mod set and save game data. It will:
1. Read installed Stellaris mods from the user's active mod set (cross-platform)
2. Read the user's last save game to determine researched technologies (cross-platform)
3. Generate an interactive tech tree visualization
4. Highlight researched technologies and missing prerequisites
5. Display friendly names for conditions and variables

## System Architecture

The application will follow a modular architecture with these primary components:

1. **Data Collection Module**: Responsible for gathering all required data from game files, mods, and save games (cross-platform)
2. **Data Processing Module**: Responsible for parsing, merging, and preparing the data for visualization
3. **Visualization Module**: Handles the rendering of the tech tree in the UI
4. **User Interface**: A Node.js front-end application using Tailwind CSS

## Development Phases

### Phase 1: Data Collection and Base Game Parsing (Cross-platform)

**Tasks:**
1. ✅ Create a cross-platform utility to locate and read the SQLite database containing mod information:
   - Windows: `%USERPROFILE%\Documents\Paradox Interactive\Stellaris\launcher-v2.sqlite`
   - macOS: `~/Documents/Paradox Interactive/Stellaris/launcher-v2.sqlite`
2. Implement functions to identify and parse base game technology files (cross-platform paths)
3. Implement functions to identify and parse mod-provided technology files (cross-platform paths)
4. Create a consolidated technology database from base game and mod files
5. ✅ Create a configuration system for file paths and user preferences (cross-platform)

**Completed Steps:**
- **Step 1: Project Setup** - Created Node.js project with directory structure, dependencies, and configuration
- **Step 2: Cross-Platform Path Resolution** - Implemented game path detection and resolution for different platforms
- **Step 3: SQLite Database Access** - Created database connection module, mod repository, and data models for accessing mod information

**Launcher Database Structure:**
- **playsets table**: Contains information about mod collections
  ```
  CREATE TABLE playsets (
    id char(36) not null,
    name varchar(255) not null,
    isActive boolean,
    loadOrder varchar(255),
    pdxId int,
    pdxUserId char(36),
    createdOn datetime not null,
    updatedOn datetime,
    syncedOn datetime,
    lastServerChecksum text,
    isRemoved boolean not null default false,
    hasNotApprovedChanges boolean not null default '0',
    syncState varchar(255),
    primary key (id),
    constraint uq_pdxId unique (pdxId)
  );
  ```
  - Key columns: `id`, `name`, `isActive` (identifies the currently active playset)

- **mods table**: Contains information about all available mods
  ```
  CREATE TABLE mods (
    id char(36) not null,
    pdxId varchar(255),
    steamId varchar(255),
    gameRegistryId text,
    name varchar(255),
    displayName varchar(255),
    thumbnailUrl text,
    thumbnailPath text,
    version varchar(255),
    tags json default '[]',
    requiredVersion varchar(255),
    arch text,
    os text,
    repositoryPath text,
    dirPath text,  /* Path to the mod directory */
    archivePath text,
    status text not null,
    source text not null,
    /* Additional fields omitted for brevity */
    primary key (id)
  );
  ```
  - Key columns: `id`, `name`, `dirPath` (path to mod files)

- **playsets_mods table**: Maps mods to playsets with position and enabled status
  ```
  CREATE TABLE playsets_mods (
    playsetId char(36) not null,
    modId char(36) not null,
    enabled boolean default '1',
    position integer,
    foreign key(playsetId) references playsets(id) on delete CASCADE,
    foreign key(modId) references mods(id) on delete CASCADE
  );
  ```
  - Key columns: `playsetId`, `modId`, `enabled`, `position` (load order)

**Query to get active mods:**
```sql
SELECT m.id, m.name, m.dirPath, pm.enabled, pm.position 
FROM mods m 
JOIN playsets_mods pm ON m.id = pm.modId 
JOIN playsets p ON pm.playsetId = p.id 
WHERE p.isActive = 1 AND pm.enabled = 1 
ORDER BY pm.position;
```

**Robust Technology File Parsing Solution:**
- Implement a custom parser using a parsing library like PEG.js or Nearley to handle nested structures and complex syntax reliably. Do not use a regex based approach due to nested structure and inconsistent whitespace. 
- Lexer: Tokenize input files into meaningful tokens.
- Parser: Construct an Abstract Syntax Tree (AST) from tokens.
- AST Traversal: Extract technology definitions, properties, and nested conditions.
- Error Handling: Detailed error reporting with line numbers and context.

**Technology File Structure Examples:**

1. **Basic Technology Definition:**
```
tech_basic_science_lab_1 = {
    cost = @tier0cost1
    area = physics
    tier = 0
    category = { computing }
    start_tech = yes

    # unlock basic science lab lvl 1
    weight_modifier = {
        factor = 1000
    }

    ai_weight = {
        weight = 10000
    }

    starting_potential = {
        is_low_tech_start = no # So Broken Shackles origin players don't start with it
    }
}
```

2. **Technology with Prerequisites:**
```
tech_sensors_3 = {
    area = physics
    cost = @tier3cost1
    tier = 3
    category = { computing }
    ai_update_type = all
    prerequisites = { "tech_sensors_2" }
    weight = @tier3weight1

    weight_modifier = {
        modifier = {
            factor = 1.25
            has_tradition = tr_discovery_adopt
        }
    }

    ai_weight = {
    }

    prereqfor_desc = {
        component = {
            title = "TECH_UNLOCK_SENSOR_3_TITLE"
            desc = "TECH_UNLOCK_SENSOR_3_DESC"
        }
    }
}
```

3. **Technology with Multiple Prerequisites:**
```
tech_juggernaut = {
    cost = @tier5cost3
    area = engineering
    category = { voidcraft }
    tier = 5
    prerequisites = { "tech_starbase_5" "tech_battleships" }
    weight = @tier5weight3
    is_rare = yes

    potential = {
        host_has_dlc = "Federations"
    }

    # unlocks Juggernaut
    weight_modifier = {
        factor = 0.25
        modifier = {
            factor = 1.5
            OR = {
                has_trait_in_council = { TRAIT = leader_trait_curator }
                has_trait_in_council = { TRAIT = leader_trait_maniacal }
                has_trait_in_council = { TRAIT = leader_trait_maniacal_2 }
                has_trait_in_council = { TRAIT = leader_trait_maniacal_3 }
            }
        }
        inline_script = {
            script = technologies/rare_technologies_weight_modifiers
            TECHNOLOGY = tech_juggernaut
        }
        modifier = {
            factor = 1.25
            has_technology = "tech_titans"
        }
    }
}
```

4. **Technology with Complex Conditions:**
```
tech_archaeostudies = {
    cost = @tier2cost1
    area = society
    category = { archaeostudies }
    tier = 2
    is_rare = yes
    weight = @tier2weight3

    potential = {
        has_ancrel = yes
    }

    weight_modifier = {
        inline_script = {
            script = technologies/rare_technologies_weight_modifiers
            TECHNOLOGY = tech_archaeostudies
        }
        modifier = {
            factor = 0
            has_ancrel = no
        }
        modifier = {
            factor = 0.3
            count_archaeological_site = {
                count < 3
                limit = {
                    is_site_completed = yes
                }
            }
        }
        modifier = {
            factor = 3
            OR = {
                has_country_flag = origin_shoulders_closure
                has_completed_precursor_research = yes
            }
        }
    }
}
```

**Tests:**
- Unit tests for database reading functions (cross-platform)
- Unit tests for file path resolution (cross-platform)
- Unit tests for robust technology file parser (lexer, parser, AST generation)
- Integration test to verify all technologies are correctly loaded from both base game and mods
- Validation test to ensure correct identification of the active mod set
- Error handling tests for missing files or corrupted data

## Phase 1 Implementation Plan - Data Collection and Base Game Parsing

### Step 1: Project Setup ✅
1. **Initialize Project Structure**
   - Create a Node.js project
   - Set up directory structure (src, tests, config)
   - Configure ESLint and Jest
   - Create initial package.json with dependencies
   - Set up Git repository with appropriate .gitignore

2. **Install Core Dependencies**
   - Node.js libraries for file system operations
   - SQLite3 for database access
   - PEG.js or Nearley.js for parser generation
   - Testing libraries (Jest, supertest)
   - Logging library (winston or similar)

3. **Create Configuration System**
   - Implement cross-platform path resolution
   - Create configuration file structure
   - Implement user preferences storage
   - Add environment-specific configuration options
   
**Testable Increment:** Project structure with working configuration system that can be tested with simple commands.

### Step 2: Cross-Platform Path Resolution ✅
1. **Implement Game Path Detection**
   - Create utility to detect Stellaris installation path on Windows and macOS
   - Implement functions to locate user documents folder on different platforms
   - Add validation to ensure paths exist and are accessible

2. **Create Path Resolution Module**
   - Implement functions to resolve paths for game files, mods, and save games
   - Add platform-specific path handling
   - Create fallback mechanisms for missing paths

3. **Add Path Caching**
   - Implement caching for frequently accessed paths
   - Add invalidation mechanism for cache

**Testable Increment:** Command-line utility that can detect and display Stellaris installation paths and key directories on the current platform.

### Step 3: SQLite Database Access ✅
1. **Create Database Connection Module**
   - Implement connection handling for SQLite database
   - Add error handling for missing or corrupt database
   - Create connection pooling if needed

2. **Implement Mod Database Queries**
   - Create function to query active playset
   - Implement query to get all mods in active playset
   - Add function to get mod details by ID

3. **Create Mod Information Model**
   - Define data models for mod data with JSDoc comments for clarity
   - Implement data transformation from raw database results
   - Add validation for mod data integrity

**Testable Increment:** Command-line utility that can connect to the launcher database and list all active mods with their load order.

### Step 4: Technology File Location ✅
1. **Implement Base Game Tech File Discovery**
   - Create utility to scan base game directories for technology files
   - Add recursive directory traversal with filtering
   - Implement file type detection and validation

2. **Add Mod Tech File Discovery**
   - Extend file discovery to mod directories
   - Handle different mod directory structures
   - Implement load order resolution for conflicting files

3. **Create File Registry**
   - Implement registry of all discovered technology files
   - Add metadata about file sources (base game vs mod)
   - Create lookup functions for efficient access

**Testable Increment:** Utility that can scan the game and mod directories and output a list of all technology files found, with their sources and paths.

### Step 5: Parser Development ✅
1. **Create Grammar Definition**
   - Define formal grammar for Stellaris technology files using PEG.js or Nearley.js
   - Handle nested structures and special syntax
   - Add support for comments and whitespace variations

2. **Generate Parser**
   - Use grammar to generate parser code
   - Integrate parser into the application
   - Add performance optimizations if needed

3. **Implement AST Processing**
   - Create functions to traverse and process the Abstract Syntax Tree
   - Implement extraction of technology definitions
   - Add validation for required fields and data types

**Testable Increment:** Parser that can read a single technology file and output its structured representation as JSON.

### Step 6: Technology Data Model ✅
1. **Define Technology Model**
   - Create JavaScript data models with JSDoc comments for technology data
   - Define relationships between technologies
   - Add validation for required fields

2. **Implement Data Transformation**
   - Create functions to transform parsed data into model objects
   - Add normalization for consistent data format
   - Implement reference resolution for prerequisites

3. **Add Serialization/Deserialization**
   - Implement functions to serialize technology data for storage
   - Add deserialization for loading saved data
   - Create data migration strategy for format changes

**Completed:**
- Created a comprehensive Tech model with all necessary properties
- Added methods for checking technology relationships and status
- Implemented serialization/deserialization via toJSON method
- Added support for tracking child technologies and prerequisites
- Implemented area-specific helper methods (isPhysics, isSociety, isEngineering)
- Added research status tracking for future save game integration

**Testable Increment:** Library that can parse a technology file and convert it into a structured technology object with all properties correctly typed.

### Step 7: Consolidated Technology Database ✅
1. **Create In-Memory Database**
   - Implement data structure for storing all technologies
   - Add indexing for efficient lookups
   - Create query functions for filtering and searching

2. **Implement Mod Override Resolution**
   - Add logic to handle conflicting technology definitions
   - Implement load order-based resolution
   - Create conflict detection and reporting

3. **Add Relationship Resolution**
   - Implement prerequisite relationship resolution
   - Create technology tree structure
   - Add validation for circular dependencies

**Completed:**
- Created a TechDatabase class to store and manage technologies
- Implemented methods for adding, querying, and retrieving technologies
- Added support for building the technology tree with parent-child relationships
- Implemented conflict resolution for mod overrides
- Created a TechService to orchestrate loading technologies from files and mods
- Added comprehensive filtering capabilities (by area, category, tier, etc.)
- Implemented CLI command to test with real game data
- Successfully loaded and processed 3000+ technologies from base game and mods

**Testable Increment:** System that can load multiple technology files, resolve conflicts, and provide a consolidated view of all technologies with their relationships.

### Step 8: Integration and Testing
1. **Create Main Module**
   - Implement main application flow
   - Add orchestration of all components
   - Create command-line interface for testing

2. **Add Comprehensive Error Handling**
   - Implement robust error handling throughout the application
   - Add detailed error messages and logging
   - Create recovery mechanisms for non-critical errors

3. **Write Integration Tests**
   - Create tests for end-to-end functionality
   - Add tests for edge cases and error conditions
   - Implement performance tests for large datasets

**Testable Increment:** Complete Phase 1 implementation that can be run from the command line, loading all technology data from the base game and active mods.

### Step 9: Performance Optimization and Caching (1-2 days)
1. **Implement Caching System**
   - Add caching for parsed technology files
   - Implement cache invalidation based on file changes
   - Create configurable cache settings

2. **Optimize Performance**
   - Profile application performance
   - Implement optimizations for bottlenecks
   - Add lazy loading for large datasets

3. **Add Progress Reporting**
   - Implement progress tracking for long operations
   - Add user feedback mechanisms
   - Create cancellation support for operations

**Testable Increment:** Optimized system with caching that shows measurable performance improvements over the initial implementation.

### Step 10: Documentation and Cleanup (1-2 days)
1. **Create Technical Documentation**
   - Document architecture and components
   - Add API documentation for all modules
   - Create developer guide for future extensions

2. **Write User Documentation**
   - Create user guide for command-line interface
   - Add troubleshooting section
   - Document configuration options

3. **Code Cleanup and Refactoring**
   - Review and refactor code for clarity and maintainability
   - Ensure consistent coding style
   - Address technical debt

**Testable Increment:** Well-documented, clean codebase with comprehensive documentation for both users and developers.

### Total Estimated Time: 16-24 days

This implementation plan breaks down Phase 1 into manageable steps, each with a testable increment that can be verified before moving to the next step. The plan follows a logical progression from basic setup to a complete implementation, with each step building on the previous ones.

### Phase 2: Save Game Parsing

**Tasks:**
1. Develop a save game parsing module with compression detection and decompression capabilities
2. Implement a navigation system to locate player empire data within the save structure
3. Extract researched technologies, in-progress research, and available research options
4. Create a mapping system to link save game technology IDs to our technology database
5. Implement version detection to handle changes in save format between game versions
6. Add progress tracking for partially researched technologies

**Components:**
- Save file location and validation utility
- Compression detection and decompression module
- Streamed data parser to efficiently handle large save files
- Navigation module to find relevant sections in the save structure
- Technology extraction module
- Version detection and format adaptation system
- Stellaris save game files in `%USERPROFILE%\Documents\Paradox Interactive\Stellaris\save games\`

**Technical Approach:**
- Use a streaming approach for parsing to handle large save files efficiently
- Implement targeted extraction that only reads necessary portions of the save file
- Support multiple save formats through version detection
- Create a flexible structure for mapping save data to our technology database

**Challenges and Solutions:**
- **Binary/Compressed Format**: Implement compression detection and appropriate decompression
- **Large File Size**: Use streaming parsers rather than loading entire files into memory
- **Format Variations**: Implement format version detection and appropriate adapters
- **Mod-Added Technologies**: Create a reconciliation system between save data and technology database

**Tests:**
1. Unit tests for compression detection and decompression
2. Unit tests for save file navigation and structure parsing
3. Unit tests for technology extraction
4. Integration tests with different save file versions
5. Performance tests with large save files
6. Tests with different research states (no research, partial research, complete research)
7. Error handling tests for corrupted save files
- Adjust save game paths for cross-platform compatibility:
  - Windows: `%USERPROFILE%\Documents\Paradox Interactive\Stellaris\save games\`
  - macOS: `~/Documents/Paradox Interactive/Stellaris/save games/`

### Phase 3: Technology Tree Construction

**Tasks:**
1. Develop data structures to represent technologies and their relationships
2. Implement logic to handle mod overrides and conflicts
3. Create tech tree hierarchy based on prerequisites
4. Implement friendly name resolution for conditions and requirements
5. Develop state tracking for researched technologies
6. Design and implement technology categorization based on fields and areas

**Key Components:**
- Technology data model (id, name, area, tier, prerequisites, category, etc.)
- Tree construction algorithm to handle complex prerequisite relationships
- Name resolution system using localization files
- State manager for tracking researched technologies

**Tests:**
1. Unit tests for technology data model
2. Tests for technology tree construction with various prerequisite patterns
3. Tests for handling mod conflicts and overrides
4. Tests for localization and name resolution
5. Tests for correctly identifying researched technologies
6. Boundary tests for technologies with multiple or complex prerequisites

### Phase 4: Interactive Visualization

**Tasks:**
1. Design the visual representation of the tech tree
2. Implement interactive elements (zooming, panning, selecting)
3. Create visual distinction between researched, available, and locked technologies
4. Implement hover/click behaviors to display detailed information
5. Design and implement search and filtering functionality
6. Add progress indicators for partially researched technologies

**Components:**
- SVG-based tech tree visualization
- Zoom and pan controls
- Technology card components
- Detail panel for selected technologies
- Search and filter components
- Visual styling based on technology states

**Tests:**
1. Unit tests for rendering components
2. Tests for interactive behaviors
3. Performance tests with large tech trees
4. Accessibility tests
5. Cross-browser compatibility tests
6. Tests for correct visual state representation

### Phase 5: Application Integration and Polish (Cross-platform)

**Tasks:**
1. Integrate all components into a cohesive application
2. Implement data refresh/reload functionality
3. Add export and sharing capabilities
4. Optimize performance for large tech trees
5. Add configuration options for display preferences
6. Implement error handling and user feedback
7. Add help documentation and tooltips

**Components:**
- Main application container
- Navigation and control panel
- Configuration panel
- Export/import functionality
- Help system
- Error handling and logging system

**Tests:**
1. End-to-end tests for complete application flow
2. Performance tests with various data sizes
3. User flow tests
4. Usability tests
5. Tests for configuration persistence
6. Error recovery tests

## Technical Specifications

### Data Formats

1. **Technology Data Format**
   - Based on the exploration, Stellaris technology files are structured as key-value pairs within named blocks.
   - Each technology has properties like cost, area, tier, prerequisites, category, and weight.
   - Technologies can have conditions (potential) and modifiers.

2. **Mod Database Structure**
   - The `launcher-v2.sqlite` database contains tables for mods, playsets, and their relationships.
   - The `playsets` table tracks available mod collections
   - The `playsets_mods` table maps mods to playsets with position information
   - The `mods` table contains information about each mod including paths and metadata

3. **Save Game Format**
   - Save games are located in `%USERPROFILE%\Documents\Paradox Interactive\Stellaris\save games\`
   - Files use the `.sav` extension and appear to be binary/compressed files
   - Based on examination and similar projects like Stellaris Save API, the save format is likely:
     - Compressed using ZIP or GZIP compression
     - Contains a structured data format after decompression
     - Stores technology information under the player's country/empire data
     - May vary in structure between game versions

### Save Game Parsing Implementation

1. **Compression Handling**
   ```javascript
   // Pseudocode for compression detection and handling
   async function handleSaveCompression(savePath) {
     // Check file signature to determine compression type
     const fileSignature = await readFileSignature(savePath);
     
     if (isZipFormat(fileSignature)) {
       return await decompressZip(savePath);
     } else if (isGzipFormat(fileSignature)) {
       return await decompressGzip(savePath);
     } else {
       // Uncompressed or unknown format
       return createReadStream(savePath);
     }
   }
   ```

2. **Save Structure Navigation**
   ```javascript
   // Pseudocode for navigating save structure
   function findPlayerEmpire(saveData) {
     // Find player controlled country/empire
     const countries = saveData.gamestate.country;
     
     // Look for the player flag or other identifiers
     for (const [id, country] of Object.entries(countries)) {
       if (country.player_controlled === 'yes') {
         return { id, country };
       }
     }
     
     return null;
   }
   ```

3. **Technology Extraction**
   ```javascript
   // Pseudocode for extracting technology information
   function extractTechnologies(playerEmpire) {
     return {
       // Extract researched technologies
       researched: playerEmpire.country.tech_status.technology,
       
       // Extract current research projects
       inProgress: {
         physics: playerEmpire.country.physics_queue,
         society: playerEmpire.country.society_queue,
         engineering: playerEmpire.country.engineering_queue
       },
       
       // Extract available research options
       available: {
         physics: playerEmpire.country.physics_alternatives,
         society: playerEmpire.country.society_alternatives,
         engineering: playerEmpire.country.engineering_alternatives
       }
     };
   }
   ```

### Frontend Technology Stack

1. **Core Technologies**
   - Node.js for the backend operations
   - React for the UI components
   - Tailwind CSS for styling
   - D3.js or similar for the tech tree visualization

2. **Build and Development Tools**
   - Vite for fast development and building
   - ESLint for code quality
   - Jest for testing
   - SQLite3 for database access

3. **Deployment**
   - Packaged as a desktop application for local use
   - All data processing occurs locally

## Implementation Considerations

1. **Performance**
   - Technology files and trees can be large (we found many technology files across mods)
   - Save files can be quite large (hundreds of MB)
   - Efficient data structures and lazy loading will be necessary
   - Caching parsed data between sessions

2. **Error Handling**
   - Robust error handling for missing files, corrupt data, or incompatible mods
   - Graceful degradation when optional data is unavailable
   - Clear error messages for troubleshooting

3. **Extensibility**
   - Design for future expansion to support new game versions or features
   - Modular architecture to allow new visualization options
   - Configurable parsing to handle mod variations

4. **Security**
   - All operations are local, no external data transmission
   - File access limited to specific game directories
   - Input validation for all user-provided paths

## Dependencies and Requirements

1. **Runtime Dependencies**
   - Node.js runtime
   - SQLite3 for database access
   - React for UI
   - Tailwind CSS for styling
   - D3.js for visualization
   - Compression libraries for save file parsing

2. **Development Dependencies**
   - Jest for testing
   - ESLint for code quality
   - Vite for building

3. **System Requirements**
   - Windows 10 or later
   - Local Stellaris installation
   - Sufficient memory to handle large tech trees and save files

## Development Notes

- Focus on modularity to allow independent development and testing of components
- Implement robust logging to aid in debugging
- Use JSDoc comments to document code structure and types
- Verify file formats and structures before implementing parsers
- Consider caching strategies for performance optimization
- Implement a dev mode with mock data for faster UI development
- For save parsing, study the approaches used by existing tools like Stellaris Save API

- Add parser generator library (`nearley.js` or `peg.js`) for robust technology file parsing

## Implementation Considerations

- Ensure all file paths use Node.js `path` module for cross-platform compatibility.
- Verify file existence and permissions using Node.js APIs (`fs.existsSync`, `fs.promises`).

- Ensure export/import functionality uses cross-platform file dialogs.
- Implement cross-platform error handling and logging. 