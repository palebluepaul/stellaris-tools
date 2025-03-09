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

function App() {
  // Color mode toggle
  const { colorMode, toggleColorMode } = useColorMode();

  // Sample debug data
  const [debugData, setDebugData] = useState({
    appState: 'initialized',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    colorMode: colorMode
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
      <Container maxW="container.xl" pt={10}>
        <Flex justifyContent="flex-end" mb={4}>
          <IconButton
            aria-label="Toggle color mode"
            icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            onClick={toggleColorMode}
            size="md"
            variant="ghost"
          />
        </Flex>
        
        <VStack spacing={8} align="stretch">
          <Heading as="h1" size="2xl" textAlign="center">
            Stellaris Tech Tree Viewer
          </Heading>
          
          <Text fontSize="lg" textAlign="center">
            An interactive visualization of the Stellaris technology tree
          </Text>
          
          {/* Main content will go here in future stages */}
          <Box 
            p={8} 
            borderWidth="1px" 
            borderRadius="lg" 
            bg={useColorModeValue('white', 'gray.800')}
          >
            <Text>
              Welcome to Phase 1, Stage 0 of the Stellaris Tech Tree Viewer. 
              This is a basic setup with Chakra UI and a collapsible debug panel.
            </Text>
          </Box>
        </VStack>
      </Container>
      
      {/* Debug Panel */}
      <DebugPanel data={debugData} />
    </Box>
  )
}

export default App
