/**
 * Stellaris Tech Tree Viewer API Server
 * 
 * This server provides an API for accessing Stellaris technology data
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { init, shutdown } = require('../index');
const logger = require('../utils/logger');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Services
let techService = null;
let techTreeService = null;
let modRepository = null;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    services: {
      techService: techService ? 'initialized' : 'not initialized',
      techTreeService: techTreeService ? 'initialized' : 'not initialized',
      modRepository: modRepository ? 'initialized' : 'not initialized'
    }
  });
});

// Get all technologies
app.get('/api/technologies', (req, res) => {
  try {
    if (!techService) {
      return res.status(503).json({ error: 'Tech service not initialized' });
    }
    
    // Get query parameters for filtering
    const { category, area, tier } = req.query;
    
    // Get all technologies
    let technologies = techService.getAllTechnologies();
    
    // Apply filters if provided
    if (category) {
      const categories = Array.isArray(category) ? category : [category];
      technologies = technologies.filter(tech => categories.includes(tech.category));
    }
    
    if (area) {
      const areas = Array.isArray(area) ? area : [area];
      technologies = technologies.filter(tech => areas.includes(tech.area));
    }
    
    if (tier) {
      const tiers = Array.isArray(tier) ? tier.map(Number) : [Number(tier)];
      technologies = technologies.filter(tech => tiers.includes(tech.tier));
    }
    
    res.json(technologies);
  } catch (error) {
    logger.error(`Error getting technologies: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific technology by ID
app.get('/api/technologies/:id', (req, res) => {
  try {
    if (!techService) {
      return res.status(503).json({ error: 'Tech service not initialized' });
    }
    
    const { id } = req.params;
    const technology = techService.getTechnology(id);
    
    if (!technology) {
      return res.status(404).json({ error: `Technology with ID ${id} not found` });
    }
    
    res.json(technology);
  } catch (error) {
    logger.error(`Error getting technology: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get all categories
app.get('/api/categories', (req, res) => {
  try {
    if (!techService) {
      return res.status(503).json({ error: 'Tech service not initialized' });
    }
    
    const categories = techService.getAllCategories();
    res.json(categories);
  } catch (error) {
    logger.error(`Error getting categories: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get all areas
app.get('/api/areas', (req, res) => {
  try {
    if (!techService) {
      return res.status(503).json({ error: 'Tech service not initialized' });
    }
    
    const areas = techService.getAllAreas();
    res.json(areas);
  } catch (error) {
    logger.error(`Error getting areas: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get tech tree
app.get('/api/tech-tree', (req, res) => {
  try {
    if (!techTreeService) {
      return res.status(503).json({ error: 'Tech tree service not initialized' });
    }
    
    const rootTechs = techTreeService.getRootTechnologies();
    res.json(rootTechs);
  } catch (error) {
    logger.error(`Error getting tech tree: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get all playsets
app.get('/api/playsets', async (req, res) => {
  try {
    if (!modRepository) {
      return res.status(503).json({ error: 'Mod repository not initialized' });
    }
    
    const playsets = await modRepository.getAllPlaysets();
    
    // Get the active playset to mark it
    const activePlayset = await modRepository.getActivePlayset();
    const activePlaysetId = activePlayset ? activePlayset.id : null;
    
    // Format the response to include only necessary data
    const formattedPlaysets = playsets.map(playset => ({
      id: playset.id,
      name: playset.name,
      isActive: playset.id === activePlaysetId,
      modCount: playset.getModCount(),
      enabledModCount: playset.getEnabledModCount()
    }));
    
    res.json(formattedPlaysets);
  } catch (error) {
    logger.error(`Error getting playsets: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Get active playset
app.get('/api/playsets/active', async (req, res) => {
  try {
    if (!modRepository) {
      return res.status(503).json({ error: 'Mod repository not initialized' });
    }
    
    const activePlayset = await modRepository.getActivePlayset();
    
    if (!activePlayset) {
      return res.status(404).json({ error: 'No active playset found' });
    }
    
    // Get enabled mods for the active playset
    const enabledMods = activePlayset.getEnabledMods().map(mod => ({
      id: mod.id,
      name: mod.name,
      displayName: mod.displayName || mod.name,
      enabled: mod.enabled
    }));
    
    // Format the response
    const formattedPlayset = {
      id: activePlayset.id,
      name: activePlayset.name,
      modCount: activePlayset.getModCount(),
      enabledModCount: activePlayset.getEnabledModCount(),
      enabledMods
    };
    
    res.json(formattedPlayset);
  } catch (error) {
    logger.error(`Error getting active playset: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Set active playset and reload technologies
app.post('/api/playsets/:id/activate', async (req, res) => {
  try {
    if (!modRepository || !techService || !techTreeService) {
      return res.status(503).json({ error: 'Required services not initialized' });
    }
    
    const { id } = req.params;
    
    // Get the playset by ID
    const playset = await modRepository.getPlaysetById(id);
    
    if (!playset) {
      return res.status(404).json({ error: `Playset with ID ${id} not found` });
    }
    
    // Since the database is read-only, we can't actually change the active playset
    // Instead, we'll load the technologies based on the selected playset's mods
    logger.info(`Loading technologies for playset: ${playset.name}`);
    
    // Get the enabled mods for this playset
    const enabledMods = playset.getEnabledMods();
    
    // Reload technologies
    const gameDir = await require('../utils/gamePathDetector').getGameInstallDir();
    const startTime = Date.now();
    
    // We should update the techService to use the mods from the selected playset
    // This is a simplified version - in a real implementation with a writable DB,
    // you would update the active playset in the database first
    techService.setActiveMods(enabledMods);
    
    const loadResult = await techService.loadAllTechnologies(gameDir);
    const endTime = Date.now();
    
    // Reinitialize the tech tree service
    await techTreeService.initialize();
    
    // Format the response with detailed playset information
    const formattedPlayset = {
      id: playset.id,
      name: playset.name,
      modCount: playset.getModCount(),
      enabledModCount: playset.getEnabledModCount(),
      enabledMods: enabledMods.map(mod => ({
        id: mod.id,
        name: mod.name,
        displayName: mod.displayName || mod.name,
        enabled: mod.enabled
      }))
    };
    
    res.json({
      success: true,
      message: `Technologies loaded for playset: ${playset.name}`,
      playset: formattedPlayset,
      stats: {
        totalCount: loadResult.totalCount,
        baseGameCount: loadResult.baseGameCount,
        modCount: loadResult.modCount,
        duration: (endTime - startTime) / 1000,
        rootTechnologies: techTreeService.getRootTechnologies().length
      }
    });
  } catch (error) {
    logger.error(`Error activating playset: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from the frontend build directory in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  // Handle SPA routing - send all requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Start the server
async function startServer() {
  try {
    // Initialize the application
    logger.info('Initializing application services...');
    const services = await init();
    
    if (!services) {
      logger.error('Failed to initialize services');
      process.exit(1);
    }
    
    // Store services for API endpoints
    techService = services.techService;
    techTreeService = services.techTreeService;
    modRepository = services.modRepository;
    
    // Start the server
    app.listen(PORT, () => {
      logger.info(`API server listening on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
      logger.info(`Technologies: http://localhost:${PORT}/api/technologies`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal');
  await shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal');
  await shutdown();
  process.exit(0);
});

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer }; 