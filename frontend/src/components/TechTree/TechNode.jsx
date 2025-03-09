import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  Box, 
  Text, 
  Badge, 
  useColorModeValue 
} from '@chakra-ui/react';

// Category colors
const categoryColors = {
  physics: { bg: 'blue.500', text: 'white' },
  society: { bg: 'green.500', text: 'white' },
  engineering: { bg: 'orange.500', text: 'white' }
};

const TechNode = ({ data, isConnectable, selected }) => {
  // Get colors based on category
  const category = data.category || 'physics';
  const { bg: categoryBg, text: categoryText } = categoryColors[category];
  
  // Dynamic styling based on state
  const nodeBg = useColorModeValue('white', 'gray.800');
  const nodeBorder = useColorModeValue('gray.200', 'gray.600');
  const nodeTextColor = useColorModeValue('gray.800', 'gray.100');
  
  // Highlight styling
  const isHighlighted = data.highlighted;
  const highlightBorder = useColorModeValue('blue.400', 'blue.300');
  const selectedBorder = useColorModeValue('purple.500', 'purple.300');
  
  const borderColor = selected 
    ? selectedBorder 
    : isHighlighted 
      ? highlightBorder 
      : nodeBorder;
  
  const borderWidth = selected || isHighlighted ? '2px' : '1px';
  
  return (
    <>
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
      
      {/* Node content */}
      <Box
        p={2}
        borderWidth={borderWidth}
        borderRadius="md"
        borderColor={borderColor}
        bg={nodeBg}
        color={nodeTextColor}
        boxShadow="md"
        width="160px"
        transition="all 0.2s"
        _hover={{ boxShadow: 'lg' }}
      >
        <Badge 
          colorScheme={category} 
          mb={1} 
          borderRadius="full" 
          px={2}
          size="sm"
          bg={categoryBg}
          color={categoryText}
        >
          Tier {data.tier}
        </Badge>
        
        <Text fontWeight="bold" fontSize="sm" mb={1} noOfLines={2}>
          {data.name}
        </Text>
        
        <Text fontSize="xs" color="gray.500" noOfLines={1}>
          Cost: {data.cost}
        </Text>
      </Box>
      
      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ background: '#555', width: '8px', height: '8px' }}
      />
    </>
  );
};

export default memo(TechNode); 