import { useState, useEffect } from 'react'
import { 
  Box, 
  Container, 
  Heading, 
  Text, 
  VStack, 
  useColorModeValue,
  IconButton,
  useColorMode,
  Flex,
  ChakraProvider,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel
} from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import DebugPanel from './components/DebugPanel'
import TechTree from './components/TechTree/TechTree'
import PlaysetSelector from './components/PlaysetSelector'
import PlanTab from './components/TechTree/PlanTab'

// Constants for localStorage keys
const STORAGE_KEYS = {
  PLANNED_TECHS: 'stellaris-tools-planned-techs',
  RESEARCHED_TECHS: 'stellaris-tools-researched-techs'
};

function App() {
  // Color mode toggle
  const { colorMode, toggleColorMode } = useColorMode();
  
  // State for tech reload
  const [techReloadTrigger, setTechReloadTrigger] = useState(0);
  
  // State for planned technologies
  const [plannedTechs, setPlannedTechs] = useState(() => {
    // Initialize from localStorage if available
    try {
      const storedPlannedTechs = localStorage.getItem(STORAGE_KEYS.PLANNED_TECHS);
      return storedPlannedTechs ? JSON.parse(storedPlannedTechs) : [];
    } catch (error) {
      console.error('Error loading planned techs from localStorage:', error);
      return [];
    }
  });
  
  const [researchedTechs, setResearchedTechs] = useState(() => {
    // Initialize from localStorage if available
    try {
      const storedResearchedTechs = localStorage.getItem(STORAGE_KEYS.RESEARCHED_TECHS);
      return storedResearchedTechs ? JSON.parse(storedResearchedTechs) : [];
    } catch (error) {
      console.error('Error loading researched techs from localStorage:', error);
      return [];
    }
  });

  // Sample debug data
  const [debugData, setDebugData] = useState({
    appState: 'initialized',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    colorMode: colorMode,
    phase: 'Phase 1',
    stage: 'Backend Integration - Fetching Real Data',
    features: {
      minimap: {
        enabled: true,
        pannable: true,
        zoomable: true
      },
      nodes: {
        customStyling: true,
        tooltips: true,
        hoverEffects: true,
        categoryColors: true,
        areaIcons: true
      },
      edges: {
        customStyling: true,
        directionalArrows: true,
        highlighting: true
      },
      interactivity: {
        nodeSelection: true,
        prerequisiteHighlighting: true,
        tooltips: true,
        search: true,
        filtering: true,
        detailsPanel: true
      },
      layout: {
        autoPositioned: true,
        responsive: true,
        drawerPanels: true
      },
      backend: {
        connected: false,
        techCount: 0,
        loading: false,
        error: null
      }
    }
  });

  // Listen for debug data updates from components
  useEffect(() => {
    const handleDebugDataUpdate = (event) => {
      const newData = event.detail;
      
      setDebugData(prev => ({
        ...prev,
        timestamp: new Date().toISOString(),
        colorMode: colorMode,
        backend: {
          connected: newData.backendStatus === 'Connected',
          techCount: newData.realTechCount || 0,
          loading: newData.isLoading || false,
          error: newData.error !== 'None' ? newData.error : null
        },
        reactFlow: newData.reactFlow || {},
        techCounts: {
          mock: newData.mockTechCount || 0,
          real: newData.realTechCount || 0,
          filtered: newData.filteredTechCount || 0
        }
      }));
    };
    
    window.addEventListener('updateDebugData', handleDebugDataUpdate);
    
    return () => {
      window.removeEventListener('updateDebugData', handleDebugDataUpdate);
    };
  }, [colorMode]);

  // Update debug data every 5 seconds to demonstrate reactivity
  useEffect(() => {
    const interval = setInterval(() => {
      setDebugData(prev => ({
        ...prev,
        timestamp: new Date().toISOString(),
        colorMode: colorMode
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, [colorMode]);
  
  // Handle tech reload
  const handleTechReload = () => {
    // Increment the trigger to force TechTree to reload
    setTechReloadTrigger(prev => prev + 1);
    
    // Dispatch a custom event to notify TechTreeLayout
    window.dispatchEvent(new CustomEvent('reloadTechnologies'));
    
    // Update debug data
    setDebugData(prev => ({
      ...prev,
      timestamp: new Date().toISOString(),
      appState: 'reloading',
      stage: 'Reloading Technologies'
    }));
  };

  // Handle adding/removing tech to/from plan
  const handleTogglePlanTech = (tech) => {
    setPlannedTechs(prev => {
      const exists = prev.some(t => t.id === tech.id);
      if (exists) {
        return prev.filter(t => t.id !== tech.id);
      } else {
        return [...prev, tech];
      }
    });
  };

  // Handle marking a tech as researched/unresearched
  const handleToggleResearchedTech = (tech) => {
    setResearchedTechs(prev => {
      const exists = prev.some(t => t.id === tech.id);
      if (exists) {
        return prev.filter(t => t.id !== tech.id);
      } else {
        return [...prev, tech];
      }
    });
  };

  // Handle clearing all planned and researched technologies
  const handleClearPlan = () => {
    setPlannedTechs([]);
    setResearchedTechs([]);
  };

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'gray.100');

  // Save planned techs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PLANNED_TECHS, JSON.stringify(plannedTechs));
    } catch (error) {
      console.error('Error saving planned techs to localStorage:', error);
    }
  }, [plannedTechs]);

  // Save researched techs to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESEARCHED_TECHS, JSON.stringify(researchedTechs));
    } catch (error) {
      console.error('Error saving researched techs to localStorage:', error);
    }
  }, [researchedTechs]);

  return (
    <Box bg={bgColor} color={textColor} minH="100vh" pb="100px">
      <Container maxW="100%" px={2} pt={2} h="calc(100vh - 100px)">
        <Flex justifyContent="flex-end" mb={1}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            size="md"
            variant="ghost"
          />
        </Flex>
        
        <VStack spacing={2} align="stretch" h="calc(100% - 80px)">
          <Heading as="h1" size="lg" textAlign="center">
            Stellaris Tech Tree Viewer
          </Heading>
          
          <Text fontSize="sm" textAlign="center" mb={0}>
            An interactive visualization of the Stellaris technology tree
          </Text>
          
          {/* Playset Selector */}
          <PlaysetSelector onTechReload={handleTechReload} />
          
          {/* Main content - Tech Tree and Plan Tabs */}
          <Box 
            p={2} 
            borderWidth="1px" 
            borderRadius="lg" 
            bg={useColorModeValue('white', 'gray.800')}
            width="100%"
            flex="1"
            display="flex"
            flexDirection="column"
          >
            <Tabs isFitted variant="enclosed" flex="1" display="flex" flexDirection="column">
              <TabList>
                <Tab>Tech Tree</Tab>
                <Tab>Plan</Tab>
              </TabList>
              
              <TabPanels flex="1" display="flex" flexDirection="column">
                <TabPanel p={0} flex="1" display="flex" flexDirection="column">
                  <TechTree 
                    key={`tech-tree-${techReloadTrigger}`} 
                    plannedTechs={plannedTechs}
                    onTogglePlanTech={handleTogglePlanTech}
                  />
                </TabPanel>
                <TabPanel p={0} flex="1" display="flex" flexDirection="column">
                  <PlanTab 
                    plannedTechs={plannedTechs}
                    researchedTechs={researchedTechs}
                    onTogglePlanTech={handleTogglePlanTech}
                    onToggleResearchedTech={handleToggleResearchedTech}
                    onClearPlan={handleClearPlan}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </VStack>
      </Container>
      
      {/* Debug Panel */}
      <DebugPanel data={debugData} />
    </Box>
  )
}

export default App
