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
  Flex
} from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import DebugPanel from './components/DebugPanel'
import TechTree from './components/TechTree/TechTree'

function App() {
  // Color mode toggle
  const { colorMode, toggleColorMode } = useColorMode();

  // Sample debug data
  const [debugData, setDebugData] = useState({
    appState: 'initialized',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    colorMode: colorMode,
    phase: 'Phase 1',
    stage: 'Stage 1 - React Flow Integration',
    features: {
      minimap: {
        enabled: true,
        pannable: true,
        zoomable: true
      },
      layout: 'auto-positioned by category and tier'
    }
  });

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
            <TechTree />
          </Box>
        </VStack>
      </Container>
      
      {/* Debug Panel */}
      <DebugPanel data={debugData} />
    </Box>
  )
}

export default App
