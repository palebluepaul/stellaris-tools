import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  addEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, useColorModeValue, useToast } from '@chakra-ui/react';

// Import custom node types
import TechNode from './TechNode';
import TechEdge from './TechEdge';
import { mockTechnologies, transformTechDataToReactFlow } from './mockTechnologies';

// Define node types and edge types
const nodeTypes = {
  techNode: TechNode,
};

const edgeTypes = {
  techEdge: TechEdge,
};

// Default edge options
const defaultEdgeOptions = {
  type: 'techEdge',
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: '#888',
  },
  animated: false,
};

const TechTreeCanvas = () => {
  // React Flow instance
  const { fitView, getNode, getEdges, setEdges } = useReactFlow();
  const toast = useToast();
  
  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdgesState, onEdgesChange] = useEdgesState([]);
  
  // State for selected node
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  // Debug state for tracking React Flow events
  const [debugInfo, setDebugInfo] = useState({
    nodeCount: 0,
    edgeCount: 0,
    selectedNodes: [],
  });
  
  // Load initial data
  useEffect(() => {
    const { nodes: initialNodes, edges: initialEdges } = transformTechDataToReactFlow(mockTechnologies);
    
    // Convert edges to use our custom edge type
    const customEdges = initialEdges.map(edge => ({
      ...edge,
      type: 'techEdge',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#888',
      },
    }));
    
    setNodes(initialNodes);
    setEdgesState(customEdges);
    
    // Update debug info
    setDebugInfo(prev => ({
      ...prev,
      nodeCount: initialNodes.length,
      edgeCount: customEdges.length,
    }));
    
    // Fit view after data is loaded with a better padding
    setTimeout(() => {
      fitView({ 
        padding: 0.3,
        includeHiddenNodes: true,
        duration: 800
      });
    }, 200);
  }, [setNodes, setEdgesState, fitView]);
  
  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    // Toggle selection
    const isAlreadySelected = selectedNodeId === node.id;
    
    // Clear previous highlighting
    setNodes(nds => 
      nds.map(n => ({
        ...n,
        data: { ...n.data, highlighted: false }
      }))
    );
    
    setEdgesState(eds => 
      eds.map(e => ({
        ...e,
        data: { ...e.data, highlighted: false }
      }))
    );
    
    if (!isAlreadySelected) {
      setSelectedNodeId(node.id);
      
      // Show toast with tech info
      toast({
        title: node.data.name,
        description: node.data.description,
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'top-right',
      });
      
      // Highlight prerequisites
      const highlightedNodeIds = new Set();
      const highlightedEdgeIds = new Set();
      
      // Function to recursively find prerequisites
      const findPrerequisites = (techId) => {
        const tech = getNode(techId);
        if (!tech) return;
        
        // Add this node to highlighted set
        highlightedNodeIds.add(techId);
        
        // Find all prerequisite edges and nodes
        tech.data.prerequisites.forEach(prereqId => {
          // Highlight the edge
          const edgeId = `${prereqId}-${techId}`;
          highlightedEdgeIds.add(edgeId);
          
          // Recursively highlight prerequisites
          findPrerequisites(prereqId);
        });
      };
      
      // Start highlighting from the selected node
      findPrerequisites(node.id);
      
      // Apply highlighting to nodes
      setNodes(nds => 
        nds.map(n => ({
          ...n,
          data: { 
            ...n.data, 
            highlighted: highlightedNodeIds.has(n.id) && n.id !== node.id
          }
        }))
      );
      
      // Apply highlighting to edges
      setEdgesState(eds => 
        eds.map(e => ({
          ...e,
          data: { 
            ...e.data, 
            highlighted: highlightedEdgeIds.has(e.id)
          }
        }))
      );
    } else {
      // Deselect if already selected
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, setNodes, setEdgesState, getNode, toast]);
  
  // Handle selection change
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
        onNodeClick={onNodeClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
        attributionPosition="bottom-right"
        style={{ width: '100%', height: '100%' }}
        selectNodesOnDrag={false}
        nodesDraggable={false}
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