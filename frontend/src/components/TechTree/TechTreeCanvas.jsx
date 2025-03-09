import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, useColorModeValue } from '@chakra-ui/react';

// Import custom node types
import TechNode from './TechNode';
import { mockTechnologies, transformTechDataToReactFlow } from './mockTechnologies';

// Define node types
const nodeTypes = {
  techNode: TechNode,
};

const TechTreeCanvas = () => {
  // React Flow instance
  const { fitView } = useReactFlow();
  
  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  // Debug state for tracking React Flow events
  const [debugInfo, setDebugInfo] = useState({
    nodeCount: 0,
    edgeCount: 0,
    selectedNodes: [],
  });
  
  // Load initial data
  useEffect(() => {
    const { nodes: initialNodes, edges: initialEdges } = transformTechDataToReactFlow(mockTechnologies);
    setNodes(initialNodes);
    setEdges(initialEdges);
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      nodeCount: initialNodes.length,
      edgeCount: initialEdges.length,
    }));
    
    // Fit view after data is loaded with a better padding
    setTimeout(() => {
      fitView({ 
        padding: 0.3,
        includeHiddenNodes: true,
        duration: 800
      });
    }, 200);
  }, [setNodes, setEdges, fitView]);
  
  // Handle node selection
  const onSelectionChange = useCallback(({ nodes: selectedNodes }) => {
    // Update debug info with selected nodes
    setDebugInfo(prev => ({
      ...prev,
      selectedNodes: selectedNodes.map(node => node.id),
    }));
  }, []);
  
  // Colors for the React Flow components
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const minimapMaskColor = useColorModeValue('rgb(240, 240, 240, 0.6)', 'rgb(30, 30, 30, 0.6)');
  const minimapBgColor = useColorModeValue('rgb(255, 255, 255, 0.8)', 'rgb(20, 20, 20, 0.8)');
  
  return (
    <Box 
      height="100%" 
      width="100%" 
      bg={bgColor} 
      borderRadius="md" 
      overflow="hidden"
      borderWidth="1px"
      borderColor={useColorModeValue('gray.200', 'gray.700')}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        attributionPosition="bottom-right"
        style={{ width: '100%', height: '100%' }}
      >
        <Background color={useColorModeValue('#aaa', '#555')} gap={16} />
        <Controls />
        <MiniMap 
          nodeStrokeColor={useColorModeValue('#555', '#ddd')}
          nodeColor={useColorModeValue('#fff', '#333')}
          nodeBorderRadius={2}
          maskColor={minimapMaskColor}
          style={{ background: minimapBgColor }}
          zoomable
          pannable
          position="bottom-right"
          width={200}
          height={150}
        />
      </ReactFlow>
    </Box>
  );
};

export default TechTreeCanvas; 