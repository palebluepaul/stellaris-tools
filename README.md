# Stellaris Tech Tree Viewer

An interactive technology tree visualization tool for Stellaris that works with mods and save games.

## Overview

This application creates an interactive tech tree visualization for Stellaris based on the user's mod set and save game data. It:

1. Reads installed Stellaris mods from the user's active mod set (cross-platform)
2. Reads the user's last save game to determine researched technologies (cross-platform)
3. Generates an interactive tech tree visualization
4. Highlights researched technologies and missing prerequisites
5. Displays friendly names for conditions and variables

## Project Structure

The application follows a modular architecture with these primary components:

```
stellaris-tools/
├── src/
│   ├── cli/            # Command-line interface tools
│   ├── config/         # Configuration settings
│   ├── database/       # Database access layer
│   ├── models/         # Data models
│   ├── parsers/        # File parsers
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions
│   └── index.js        # Main application entry point
├── tests/              # Test files
├── .eslintrc.json      # ESLint configuration
├── jest.config.js      # Jest configuration
├── package.json        # Project dependencies
└── README.md           # This file
```

## Architecture

The application is built with a modular architecture:

1. **Data Collection Module**: Responsible for gathering all required data from game files, mods, and save games
2. **Data Processing Module**: Responsible for parsing, merging, and preparing the data for visualization
3. **Visualization Module**: Handles the rendering of the tech tree in the UI
4. **User Interface**: A Node.js front-end application using Tailwind CSS

## JavaScript Standards

The project follows these JavaScript standards:

1. **Module System**: Uses CommonJS module system (`require`/`module.exports`) for backend services
2. **Code Style**: Follows ESLint recommended rules with additional customizations:
   - 2-space indentation
   - Unix line endings
   - Single quotes for strings
   - Semicolons required
3. **Async Patterns**: Uses async/await for asynchronous operations
4. **Error Handling**: Implements comprehensive try/catch blocks with logging
5. **Logging**: Uses Winston for structured logging
6. **Documentation**: Uses JSDoc comments for function and class documentation

When implementing the frontend (Phase 3), we should consider:
- Using ES modules (import/export) for frontend code
- Setting up a bundler like Vite for frontend development
- Ensuring proper module interoperability between backend and frontend

## Key Components

### Game Path Detection

The application automatically detects Stellaris installation paths and user data directories on different platforms:

- Windows: `%USERPROFILE%\Documents\Paradox Interactive\Stellaris\`
- macOS: `~/Documents/Paradox Interactive/Stellaris/`

### Mod Database Access

The application reads the Stellaris launcher database to determine the active mod set:

- Windows: `%USERPROFILE%\Documents\Paradox Interactive\Stellaris\launcher-v2.sqlite`
- macOS: `~/Documents/Paradox Interactive/Stellaris/launcher-v2.sqlite`

### Technology File Parsing

The application uses a custom parser built with Nearley.js to parse Stellaris technology definition files, which have a complex nested structure.

### Technology Database

The application builds a comprehensive technology database that includes:

- Base game technologies
- Mod-added technologies
- Technology relationships (prerequisites and dependents)
- Technology metadata (area, tier, cost, etc.)

### Caching System

The application includes a simple caching system to avoid re-parsing files that haven't changed, which significantly improves performance on subsequent runs.

### Technology Tree

The application builds a comprehensive technology tree that includes:

- Hierarchical structure based on prerequisites
- Support for complex prerequisite relationships
- Path tracing from any technology to its root
- Efficient search functionality
- Support for filtering by area, category, and tier
- Handling of mod-added technologies and conflicts

The technology tree provides insights into:

- Root technologies (those with no prerequisites)
- Maximum depth and width of the tree
- Technologies at each depth level
- Parent-child relationships between technologies
- Complete paths from any technology to its root

## Usage

### Prerequisites

- Node.js 14 or later
- Stellaris game installation
- (Optional) Stellaris mods installed through the launcher

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Running the Backend Services

To start the main application:

```bash
npm start
```

This initializes the core services, detects game paths, connects to the launcher database, and loads technologies from the base game and mods.

### CLI Commands

The application includes several command-line tools for testing and debugging:

- `npm run path-info`: Display detected game paths (installation, user data, mods, etc.)
- `npm run mod-info`: Display information about installed mods and active playset
- `npm run tech-files`: List technology files found in the game and mods
- `npm run parse-test`: Test the technology file parser with sample files
- `npm run test-prerequisites`: Test prerequisite resolution for technologies
- `npm run tech-database`: Test the technology database and display statistics
- `npm run tech-tree`: Test the technology tree functionality and display tree statistics

Example output from `npm run tech-tree`:

```
=== Technology Tree Statistics ===
Total technologies: 2408
Root technologies: 560
Maximum depth: 14
Maximum width: 573

=== Technologies by Area ===
physics: 697 technologies
society: 789 technologies
engineering: 846 technologies

=== Technologies by Tier ===
Tier 0: 120 technologies
Tier 1: 176 technologies
Tier 2: 295 technologies
Tier 3: 280 technologies
Tier 4: 194 technologies
Tier 5: 620 technologies
```

## Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Building

```bash
npm run build
```

## Implementation Status

- ✅ Phase 1: Data Collection and Base Game Parsing
- ✅ Phase 2: Technology Tree Construction
- ⬜ Phase 3: Interactive Visualization
- ⬜ Phase 4: Save Game Parsing
- ⬜ Phase 5: Application Integration and Polish

## License

This project is licensed under the ISC License.

## Acknowledgements

- Paradox Interactive for creating Stellaris
- The Stellaris modding community for their contributions 