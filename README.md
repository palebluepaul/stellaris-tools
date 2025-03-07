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
- [x] Step 2: Cross-Platform Path Resolution
- [x] Step 3: SQLite Database Access
- [x] Step 4: Technology File Location
- [x] Step 5: Parser Development
- [x] Step 6: Technology Data Model
- [x] Step 7: Consolidated Technology Database
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

## Usage

```bash
# Display Stellaris path information
npm run path-info

# List active mods
npm run mod-info

# List technology files
npm run tech-files

# Test the technology parser
npm run parse-test

# Test technology prerequisites
npm run test-prerequisites

# Load and display technology database
npm run tech-database
```

## Testing Approach

This project uses a comprehensive testing strategy to ensure reliability and maintainability:

### Unit Tests

Unit tests verify individual components in isolation:

- **Model Tests**: Ensure data models correctly handle various input formats and edge cases
- **Utility Tests**: Verify utility functions work correctly across platforms
- **Repository Tests**: Test data access functions with mocked database connections

### Integration Tests

Integration tests verify that components work together correctly:

- **Database Integration**: Test actual database connections and queries against a test database
- **File System Integration**: Verify file system operations work correctly on the host platform

### Test Fixtures

The project uses test fixtures to provide consistent test data:

- **Test Database**: A SQLite database with predefined test data
- **Mock Files**: Sample files that mimic the structure of actual game files

Run the tests with:

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage
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