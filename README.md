# Stellaris Tech Tree Viewer

An interactive tech tree visualization tool for Stellaris that shows technologies from the base game and active mods.

## Features

- Reads installed Stellaris mods from the user's active mod set
- Parses technology files from the base game and mods
- Merges technology data with mod overrides
- Generates a consolidated technology database
- Provides detailed logging for debugging

## Requirements

- Node.js 14.x or higher
- Stellaris game installation
- Windows operating system (currently only supports Windows paths)

## Installation

1. Clone this repository
2. Install dependencies:

```bash
npm install
```

## Usage

### Data Collection

To collect technology data from the base game and mods:

```bash
npm start
```

This will:
1. Find your Stellaris installation
2. Read your active mod set from the launcher database
3. Parse technology files from the base game and mods
4. Generate JSON files with the collected data in the `data` directory

### Testing Individual Components

To test individual components of the data collection phase:

```bash
node src/test-data-collection.js
```

## Project Structure

```
stellaris_tech_tree/
├── data/                  # Output directory for collected data
├── src/                   # Source code
│   ├── config/            # Configuration files
│   ├── logs/              # Log files
│   ├── modules/           # Application modules
│   │   ├── data-collection/  # Data collection modules
│   │   ├── data-processing/  # Data processing modules
│   │   └── visualization/    # Visualization modules
│   └── utils/             # Utility functions
├── package.json           # Project metadata and dependencies
└── README.md              # Project documentation
```

## Development

This project is structured in phases:

1. **Phase 1: Data Collection** - Collecting and parsing technology data from the game and mods
2. **Phase 2: Save Game Parsing** - Reading save games to determine researched technologies
3. **Phase 3: Technology Tree Construction** - Building the technology tree structure
4. **Phase 4: Interactive Visualization** - Creating the visual representation of the tech tree
5. **Phase 5: Application Integration** - Integrating all components into a cohesive application

## Logging

Detailed logs are written to the `src/logs` directory:
- `combined.log` - All logs
- `error.log` - Error logs only
- `debug.log` - Detailed debug logs

## License

ISC 