import { memo } from 'react';
import { 
  BaseEdge, 
  EdgeLabelRenderer, 
  getBezierPath,
  useReactFlow
} from 'reactflow';
import { Box, useColorModeValue } from '@chakra-ui/react';

const TechEdge = ({ 
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const { getNode } = useReactFlow();
  
  // Get source and target nodes
  const sourceNode = getNode(source);
  const targetNode = getNode(target);
  
  // Determine if edge should be highlighted
  const isHighlighted = data?.highlighted || false;
  
  // Edge styling based on state
  const edgeColor = useColorModeValue(
    isHighlighted ? 'blue.400' : 'gray.400',
    isHighlighted ? 'blue.300' : 'gray.500'
  );
  
  const edgeStrokeWidth = isHighlighted ? 2 : 1;
  
  // Get path for the edge
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Custom styling for the edge
  const customStyle = {
    ...style,
    stroke: edgeColor,
    strokeWidth: edgeStrokeWidth,
    transition: 'stroke 0.3s, stroke-width 0.3s',
  };

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={customStyle} 
        id={id}
      />
      
      {/* Optional: Edge label for future use */}
      <EdgeLabelRenderer>
        <Box
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
            fontSize: 10,
            fontWeight: isHighlighted ? 'bold' : 'normal',
            color: edgeColor,
            display: 'none', // Hidden by default, can be enabled later
          }}
        >
          {/* We can add labels here in the future if needed */}
        </Box>
      </EdgeLabelRenderer>
    </>
  );
};

export default memo(TechEdge); 