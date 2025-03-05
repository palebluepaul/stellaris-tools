# Stellaris Tech Tree Viewer

An interactive tech tree visualization tool for Stellaris based on the user's mod set and save game data.

## Features

- Read installed Stellaris mods from the user's active mod set (cross-platform)
- Read the user's last save game to determine researched technologies (cross-platform)
- Generate an interactive tech tree visualization
- Highlight researched technologies and missing prerequisites
- Display friendly names for conditions and variables

## Development Status

This project is currently in early development. See the [TODO.md](TODO.md) file for the detailed development plan.

### Current Phase: Phase 1 - Data Collection and Base Game Parsing

- [x] Step 1: Project Setup
- [ ] Step 2: Cross-Platform Path Resolution
- [ ] Step 3: SQLite Database Access
- [ ] Step 4: Technology File Location
- [ ] Step 5: Parser Development
- [ ] Step 6: Technology Data Model
- [ ] Step 7: Consolidated Technology Database
- [ ] Step 8: Integration and Testing
- [ ] Step 9: Performance Optimization and Caching
- [ ] Step 10: Documentation and Cleanup

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/stellaris-tech-tree-viewer.git
cd stellaris-tech-tree-viewer

# Install dependencies
npm install

# Run the application
npm start
```

## Development

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## License

ISC 