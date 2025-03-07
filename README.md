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

### Running the Application

To start the application:

```bash
npm start
```

### CLI Commands

The application includes several command-line tools for testing and debugging:

- `npm run path-info`: Display detected game paths
- `npm run mod-info`: Display information about installed mods
- `npm run tech-files`: List technology files found in the game and mods
- `npm run parse-test`: Test the technology file parser
- `npm run test-prerequisites`: Test prerequisite resolution
- `npm run tech-database`: Test the technology database

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
- ⬜ Phase 2: Save Game Parsing
- ⬜ Phase 3: Technology Tree Construction
- ⬜ Phase 4: Interactive Visualization
- ⬜ Phase 5: Application Integration and Polish

## License

This project is licensed under the ISC License.

## Acknowledgements

- Paradox Interactive for creating Stellaris
- The Stellaris modding community for their contributions 