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
  ChakraProvider
} from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import DebugPanel from './components/DebugPanel'
import TechTree from './components/TechTree/TechTree'
import PlaysetSelector from './components/PlaysetSelector'

function App() {
  // Color mode toggle
  const { colorMode, toggleColorMode } = useColorMode();
  
  // State for tech reload
  const [techReloadTrigger, setTechReloadTrigger] = useState(0);

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

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.800', 'gray.100');

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
          
          {/* Main content - Tech Tree */}
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
            <TechTree key={`tech-tree-${techReloadTrigger}`} />
          </Box>
        </VStack>
      </Container>
      
      {/* Debug Panel */}
      <DebugPanel data={debugData} />
    </Box>
  )
}

export default App
