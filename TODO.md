# Stellaris Tech Tree Viewer - Design Specification

## Project Overview

This application will create an interactive tech tree visualization for Stellaris based on the user's mod set and save game data. It will:
1. Read installed Stellaris mods from the user's active mod set
2. Read the user's last save game to determine researched technologies
3. Generate an interactive tech tree visualization
4. Highlight researched technologies and missing prerequisites
5. Display friendly names for conditions and variables

## System Architecture

The application will follow a modular architecture with these primary components:

1. **Data Collection Module**: Responsible for gathering all required data from game files, mods, and save games
2. **Data Processing Module**: Responsible for parsing, merging, and preparing the data for visualization
3. **Visualization Module**: Handles the rendering of the tech tree in the UI
4. **User Interface**: A Node.js front-end application using Tailwind CSS

## Development Phases

### Phase 1: Data Collection and Base Game Parsing 

**Tasks:**
1. Create a utility to locate and read the SQLite database containing mod information 
2. Implement functions to identify and parse base game technology files 
3. Implement functions to identify and parse mod-provided technology files 
4. Create a consolidated technology database from base game and mod files 
5. Create a configuration system for file paths and user preferences 

**Data Sources:**
- Stellaris launcher SQLite database (`launcher-v2.sqlite`) located in the Stellaris user documents folder
- Stellaris base game technology files (at `C:\Program Files (x86)\Steam\steamapps\common\Stellaris\common\technology\`)
- Mod-provided technology files in respective mod directories
- Localization files for friendly names

**Tests:**
1. Unit tests for database reading functions
2. Unit tests for file path resolution
3. Unit tests for technology file parsers
4. Integration test to verify all technologies are correctly loaded from both base game and mods
5. Validation test to ensure correct identification of the active mod set
6. Error handling tests for missing files or corrupted data

**Implementation Notes:**
1. **Database Access**: Implement SQLite database access with proper error handling.
2. **Mod Path Resolution**: Implement robust path resolution for mods with detailed logging.
3. **Technology File Collection**: Collect base game and mod technology files with filtering and logging.
4. **Technology Parsing**: Enhanced parsing capabilities for technology files, including complex prerequisites and effects.
5. **Data Consolidation**: Merge technologies from base game and mods into a unified collection.
6. **Configuration System**: Implement centralized configuration management with environment-aware settings.
7. **Error Handling**: Implement robust error handling and logging throughout the codebase.
8. **Performance Considerations**: Implement efficient file operations and caching mechanisms.

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

### Phase 5: Application Integration and Polish

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
   - TypeScript for type safety
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
- Use TypeScript for type safety in handling complex data structures
- Verify file formats and structures before implementing parsers
- Consider caching strategies for performance optimization
- Implement a dev mode with mock data for faster UI development
- For save parsing, study the approaches used by existing tools like Stellaris Save API 