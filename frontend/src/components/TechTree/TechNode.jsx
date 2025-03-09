import { memo, useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import { 
  Box, 
  Text, 
  Badge, 
  Tooltip,
  useColorModeValue,
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
  const [isHovered, setIsHovered] = useState(false);
  const { getEdges, setEdges } = useReactFlow();
  
  // Use either React Flow's selected state or our custom selected state from data
  const isSelected = reactFlowSelected || data.selected;
  
  // Get colors based on category
  const category = data.category || data.areaId || 'default';
  const { bg: categoryBg, text: categoryText, hoverBg: categoryHoverBg } = 
    categoryColors[category] || categoryColors.default;
  
  // Get area icon
  const area = data.area || data.categoryId || 'default';
  const areaIcon = areaIcons[area] || areaIcons.default;
  
  // Get display name - use displayName if available, otherwise name
  const displayName = data.displayName || data.name || id;
  
  // Get description
  const description = data.description || 'No description available';
  
  // Get tier - default to 0 if not available
  const tier = typeof data.tier === 'number' ? data.tier : 0;
  
  // Get cost - default to 0 if not available
  const cost = data.cost || 0;
  
  // Get prerequisites - ensure it's an array
  const prerequisites = Array.isArray(data.prerequisites) ? data.prerequisites : [];
  
  // Dynamic styling based on state
  const nodeBg = useColorModeValue(
    isHovered ? 'gray.50' : 'white', 
    isHovered ? 'gray.700' : 'gray.800'
  );
  const nodeBorder = useColorModeValue('gray.200', 'gray.600');
  const nodeTextColor = useColorModeValue('gray.800', 'gray.100');
  const descriptionColor = useColorModeValue('gray.600', 'gray.400');
  
  // Highlight styling
  const isHighlighted = data.highlighted;
  const highlightBorder = useColorModeValue('blue.400', 'blue.300');
  const selectedBorder = useColorModeValue('purple.500', 'purple.300');
  
  const borderColor = isSelected 
    ? selectedBorder 
    : isHighlighted 
      ? highlightBorder 
      : isHovered
        ? useColorModeValue('gray.300', 'gray.500')
        : nodeBorder;
  
  const borderWidth = isSelected || isHighlighted ? '2px' : '1px';
  const boxShadow = isHovered 
    ? 'lg' 
    : isSelected || isHighlighted 
      ? 'md' 
      : 'sm';
  
  // Handle mouse events for hover effects
  const handleMouseEnter = () => {
    setIsHovered(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
  };
  
  return (
    <>
      {/* Input handle (top) */}
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ 
          background: isHovered || isSelected ? '#555' : '#777', 
          width: '8px', 
          height: '8px',
          transition: 'all 0.2s'
        }}
      />
      
      {/* Node content */}
      <Tooltip 
        label={description} 
        placement="top" 
        hasArrow 
        openDelay={300}
        bg={useColorModeValue('gray.700', 'gray.200')}
        color={useColorModeValue('white', 'gray.800')}
      >
        <Box
          p={2}
          borderWidth={borderWidth}
          borderRadius="md"
          borderColor={borderColor}
          bg={nodeBg}
          color={nodeTextColor}
          boxShadow={boxShadow}
          width="160px"
          height="80px"
          transition="all 0.2s"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          cursor="pointer"
          _hover={{ 
            boxShadow: 'lg'
          }}
        >
          <Flex justify="space-between" align="center" mb={1}>
            <Badge 
              colorScheme={category} 
              borderRadius="full" 
              px={2}
              size="sm"
              bg={isHovered ? categoryHoverBg : categoryBg}
              color={categoryText}
            >
              Tier {tier}
            </Badge>
            <Text fontSize="lg" lineHeight="1">
              {areaIcon}
            </Text>
          </Flex>
          
          <Text 
            fontWeight="bold" 
            fontSize="sm" 
            mb={1} 
            isTruncated
            title={displayName}
          >
            {displayName}
          </Text>
          
          <Flex justify="space-between" fontSize="xs" color="gray.500">
            <Text>Cost: {cost}</Text>
            {prerequisites.length > 0 && (
              <Text>Prereq: {prerequisites.length}</Text>
            )}
          </Flex>
        </Box>
      </Tooltip>
      
      {/* Output handle (bottom) */}
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
        style={{ 
          background: isHovered || isSelected ? '#555' : '#777', 
          width: '8px', 
          height: '8px',
          transition: 'all 0.2s'
        }}
      />
    </>
  );
};

export default memo(TechNode); 