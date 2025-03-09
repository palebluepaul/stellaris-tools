import { ReactFlowProvider } from 'reactflow';
import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react';
import TechTreeCanvas from './TechTreeCanvas';

const TechTree = () => {
  return (
    <Box width="100%" height="100%" display="flex" flexDirection="column">
      <Heading as="h2" size="md" mb={1}>
        Stellaris Technology Tree
      </Heading>
      
      <Text mb={1} fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')}>
        Interactive visualization of technologies. Select a node to see its details.
      </Text>
      
      {/* ReactFlowProvider is required to use the useReactFlow hook */}
      <ReactFlowProvider>
        <Box flex="1" width="100%">
          <TechTreeCanvas />
        </Box>
      </ReactFlowProvider>
      
      <Text mt={1} fontSize="xs" color={useColorModeValue('gray.500', 'gray.500')}>
        Tip: Use mouse wheel to zoom, drag to pan, and click to select technologies. You can also drag the viewport in the minimap.
      </Text>
    </Box>
  );
};

export default TechTree; 