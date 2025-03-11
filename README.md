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
├── src/                # Backend code
│   ├── api/            # API server for frontend integration
│   ├── cli/            # Command-line interface tools
│   ├── config/         # Configuration settings
│   ├── database/       # Database access layer
│   ├── models/         # Data models
│   ├── parsers/        # File parsers
│   ├── services/       # Business logic services
│   ├── utils/          # Utility functions
│   └── index.js        # Main application entry point
├── frontend/           # Frontend React application
│   ├── src/            # Frontend source code
│   │   ├── components/ # React components
│   │   ├── services/   # Frontend services (API client)
│   │   ├── assets/     # Static assets
│   │   ├── App.jsx     # Main application component
│   │   └── main.jsx    # Entry point
│   ├── public/         # Static files
│   └── index.html      # HTML template
├── tests/              # Test files
├── dist/               # Build output
├── .eslintrc.json      # ESLint configuration
├── jest.config.js      # Jest configuration
├── package.json        # Backend dependencies
└── README.md           # This file
```

## Architecture

The application is built with a modular architecture:

1. **Backend**:
   - **Data Collection Module**: Responsible for gathering all required data from game files, mods, and save games
   - **Data Processing Module**: Responsible for parsing, merging, and preparing the data for visualization
   - **API Server**: Express.js server that provides RESTful endpoints for the frontend

2. **Frontend**:
   - **React Application**: Built with React and Vite
   - **Visualization Module**: Uses ReactFlow for interactive tech tree visualization
   - **UI Components**: Built with Chakra UI for a responsive and accessible interface

## Technology Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web server framework for API endpoints
- **SQLite**: Database for mod information
- **Nearley.js**: Parser for Stellaris technology definition files
- **Winston**: Logging library

### Frontend
- **React**: UI library
- **Vite**: Build tool and development server
- **ReactFlow**: Interactive node-based diagrams
- **Chakra UI**: Component library for accessible UI
- **Framer Motion**: Animation library

## Installation and Setup

### Prerequisites

- Node.js 14 or later
- Stellaris game installation
- (Optional) Stellaris mods installed through the launcher

### Backend Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install frontend dependencies:

```bash
npm install
```

## Running the Application

### Start the Backend API Server

```bash
npm run api
```

This starts the Express server on port 3000, which provides the API endpoints for the frontend.

### Start the Frontend Development Server

In a separate terminal:

```bash
cd frontend
npm run dev
```

This starts the Vite development server, typically on port 5173. Open your browser to the URL shown in the terminal (usually http://localhost:5173).

### Production Build

To create a production build of the frontend:

```bash
cd frontend
npm run build
```

This creates optimized files in the `frontend/dist` directory, which can be served by the backend in production mode.

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/health`: Health check endpoint
- `GET /api/technologies`: Get all technologies (with optional filtering)
- `GET /api/technologies/:id`: Get a specific technology by ID
- `GET /api/categories`: Get all technology categories
- `GET /api/areas`: Get all technology areas
- `GET /api/tech-tree`: Get the root technologies of the tech tree

## Development Tools

### Backend CLI Commands

The application includes several command-line tools for testing and debugging:

- `npm run path-info`: Display detected game paths (installation, user data, mods, etc.)
- `npm run mod-info`: Display information about installed mods and active playset
- `npm run tech-files`: List technology files found in the game and mods
- `npm run parse-test`: Test the technology file parser with sample files
- `npm run test-prerequisites`: Test prerequisite resolution for technologies
- `npm run tech-database`: Test the technology database and display statistics
- `npm run tech-tree`: Test the technology tree functionality and display tree statistics

### Frontend Development Commands

- `npm run dev`: Start the development server
- `npm run build`: Build for production
- `npm run preview`: Preview the production build locally
- `npm run lint`: Run ESLint to check for code issues

## Features

### Interactive Tech Tree Visualization

- **Zoom and Pan**: Navigate the tech tree with intuitive zoom and pan controls
- **Node Selection**: Click on technologies to see details and highlight prerequisites
- **Search**: Find technologies by name or description
- **Filtering**: Filter technologies by category, area, and tier
- **Dark Mode**: Toggle between light and dark themes

### Technology Data

- **Base Game Technologies**: All technologies from the base game
- **Mod Support**: Technologies from installed mods
- **Save Game Integration**: Highlight researched technologies from save games
- **Detailed Information**: View cost, prerequisites, and effects for each technology

## Implementation Status

- ✅ Phase 1: Data Collection and Base Game Parsing
- ✅ Phase 2: Technology Tree Construction
- ✅ Phase 3: Interactive Visualization
- ⬜ Phase 4: Save Game Parsing
- ⬜ Phase 5: Application Integration and Polish

## Troubleshooting

### Backend Connection Issues

If the frontend cannot connect to the backend:

1. Ensure the backend server is running (`npm run api`)
2. Check that the API_BASE_URL in `frontend/src/services/api.js` matches your backend URL
3. Look for CORS errors in the browser console

### Missing Technologies

If technologies are not displaying:

1. Verify Stellaris installation path is correctly detected
2. Check that mods are properly installed through the Stellaris launcher
3. Run `npm run tech-database` to verify technology parsing

## License

This project is licensed under the ISC License.

## Acknowledgements

- Paradox Interactive for creating Stellaris
- The Stellaris modding community for their contributions 