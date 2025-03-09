import { useState } from 'react';
import {
  Box,
  Button,
  Collapse,
  Heading,
  Text,
  VStack,
  Code,
  useColorModeValue
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';

const DebugPanel = ({ data = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const bgColor = useColorModeValue('gray.100', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const codeBg = useColorModeValue('gray.50', 'gray.900');

  const togglePanel = () => setIsOpen(!isOpen);

  return (
    <Box
      position="fixed"
      bottom="0"
      left="0"
      right="0"
      bg={bgColor}
      borderTop="1px"
      borderColor={borderColor}
      zIndex="1000"
      boxShadow="0 -2px 10px rgba(0, 0, 0, 0.1)"
    >
      <Button
        onClick={togglePanel}
        variant="ghost"
        width="100%"
        justifyContent="space-between"
        rightIcon={isOpen ? <ChevronDownIcon /> : <ChevronUpIcon />}
        borderRadius="0"
      >
        <Heading size="sm">Debug Panel</Heading>
      </Button>
      
      <Collapse in={isOpen} animateOpacity>
        <Box p={4} maxH="300px" overflowY="auto">
          <VStack align="start" spacing={3}>
            <Text fontWeight="bold">Debug Information:</Text>
            <Code p={2} width="100%" borderRadius="md" bg={codeBg}>
              {JSON.stringify(data, null, 2)}
            </Code>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default DebugPanel; 