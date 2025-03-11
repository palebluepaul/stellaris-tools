import { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { 
  Box, 
  Text, 
  Badge, 
  Tooltip,
  useColorModeValue,
  useColorMode,
  Flex
} from '@chakra-ui/react';

// Category colors
const categoryColors = {
  physics: { bg: 'blue.500', text: 'white', hoverBg: 'blue.600' },
  society: { bg: 'green.500', text: 'white', hoverBg: 'green.600' },
  engineering: { bg: 'orange.500', text: 'white', hoverBg: 'orange.600' },
  // Add fallback for unknown categories
  default: { bg: 'gray.500', text: 'white', hoverBg: 'gray.600' }
};

// Area icons (can be expanded later)
const areaIcons = {
  // Physics
  weapons: '🔫',
  shields: '🛡️',
  particles: '⚛️',
  field_manipulation: '🔄',
  computing: '💻',
  // Society
  biology: '🧬',
  military_theory: '🎖️',
  new_worlds: '🌍',
  statecraft: '👑',
  psionics: '🔮',
  // Engineering
  materials: '🧱',
  propulsion: '🚀',
  voidcraft: '🛸',
  industry: '🏭',
  power: '⚡',
  // Default
  default: '🔬'
};

const TechNode = ({ id, data, isConnectable, selected: reactFlowSelected }) => {
  // Always call all hooks at the top level, in the same order
  const [isHovered, setIsHovered] = useState(false);
  const { getEdges, setEdges } = useReactFlow();
  const { colorMode } = useColorMode();
  
  // Pre-compute all color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const shadowColor = useColorModeValue('rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.4)');
  const textColor = useColorModeValue('gray.800', 'gray.100');
  const mutedTextColor = useColorModeValue('gray.600', 'gray.400');
  const selectedBorderColor = useColorModeValue('blue.500', 'blue.300');
  const selectedBgColor = useColorModeValue('blue.50', 'blue.900');
  const highlightedBorderColor = useColorModeValue('purple.500', 'purple.300');
  const highlightedBgColor = useColorModeValue('purple.50', 'purple.900');
  
  // Get category colors
  const category = data.category || 'default';
  const categoryColor = categoryColors[category] || categoryColors.default;
  
  // Get area icon
  const area = data.area || 'default';
  const areaIcon = areaIcons[area] || areaIcons.default;
  
  // Determine if this node is selected or highlighted
  const isSelected = data.selected || reactFlowSelected;
  const isHighlighted = data.highlighted;
  
  // Determine node styling based on selection/highlight state
  let nodeBgColor = bgColor;
  let nodeBorderColor = borderColor;
  
  if (isSelected) {
    nodeBgColor = selectedBgColor;
    nodeBorderColor = selectedBorderColor;
  } else if (isHighlighted) {
    nodeBgColor = highlightedBgColor;
    nodeBorderColor = highlightedBorderColor;
  }
  
  // Handle mouse events
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        style={{ 
          background: '#555',
          visibility: isConnectable ? 'visible' : 'hidden',
          opacity: isHovered ? 1 : 0.5
        }}
        isConnectable={isConnectable}
      />
      
      <Tooltip 
        label={`${data.displayName || data.name} (${data.tier}) - ${data.category} / ${data.area}`}
        placement="top"
        hasArrow
        openDelay={300}
      >
        <Box
          borderWidth="1px"
          borderRadius="md"
          borderColor={nodeBorderColor}
          bg={nodeBgColor}
          p={2}
          minWidth="120px"
          maxWidth="180px"
          boxShadow={`0 2px 4px ${shadowColor}`}
          transition="all 0.2s"
          transform={isHovered ? 'translateY(-2px)' : 'none'}
          _hover={{
            boxShadow: `0 4px 8px ${shadowColor}`,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          position="relative"
          overflow="hidden"
        >
          {/* Category indicator */}
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            height="4px"
            bg={categoryColor.bg}
          />
          
          <Flex direction="column" gap={1} mt={1}>
            {/* Tech name */}
            <Text 
              fontWeight="medium" 
              fontSize="sm"
              color={textColor}
              noOfLines={2}
            >
              {data.displayName || data.name}
            </Text>
            
            {/* Tech details */}
            <Flex justify="space-between" align="center">
              <Badge 
                colorScheme={
                  category === 'physics' ? 'blue' : 
                  category === 'society' ? 'green' : 
                  category === 'engineering' ? 'orange' : 
                  'gray'
                }
                fontSize="xs"
              >
                {data.tier}
              </Badge>
              
              <Text fontSize="xs" color={mutedTextColor}>
                {areaIcon} {data.area}
              </Text>
            </Flex>
          </Flex>
        </Box>
      </Tooltip>
      
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ 
          background: '#555',
          visibility: isConnectable ? 'visible' : 'hidden',
          opacity: isHovered ? 1 : 0.5
        }}
        isConnectable={isConnectable}
      />
    </>
  );
};

export default memo(TechNode); 