import { useState, useCallback, useEffect, useRef } from 'react';
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
import { transformTechDataToReactFlow } from './mockTechnologies';

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

const TechTreeCanvas = ({ 
  technologies = [], 
  onSelectTech,
  selectedTech
}) => {
  // React Flow instance
  const { fitView, getNode, getEdges, setEdges, setCenter, getNodes } = useReactFlow();
  const toast = useToast();
  
  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdgesState, onEdgesChange] = useEdgesState([]);
  
  // Ref to track if initial fit view has been done
  const initialFitDoneRef = useRef(false);
  
  // Debug state for tracking React Flow events
  const [debugInfo, setDebugInfo] = useState({
    nodeCount: 0,
    edgeCount: 0,
    selectedNodes: [],
  });
  
  // Load data when technologies change
  useEffect(() => {
    if (technologies.length === 0) return;
    
    const { nodes: initialNodes, edges: initialEdges } = transformTechDataToReactFlow(technologies);
    
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
      initialFitDoneRef.current = true;
    }, 200);
  }, [technologies, setNodes, setEdgesState, fitView]);
  
  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    // Find the tech object from the node data
    const tech = technologies.find(t => t.id === node.id);
    if (tech) {
      onSelectTech(tech);
    }
    
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
          highlighted: highlightedNodeIds.has(n.id) && n.id !== node.id,
          selected: n.id === node.id
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
  }, [technologies, onSelectTech, getNode, setNodes, setEdgesState]);
  
  // Listen for focusOnTech events
  useEffect(() => {
    const handleFocusOnTech = (event) => {
      const { techId, fromDetailsPanel } = event.detail;
      const node = getNode(techId);
      
      if (node) {
        // Center view on the node with a slightly higher zoom level for better visibility
        setCenter(node.position.x, node.position.y, { duration: 800, zoom: 1.5 });
        
        // Find the tech object from the node data
        const tech = technologies.find(t => t.id === techId);
        if (tech && !fromDetailsPanel) {
          // Call onSelectTech to update the selected tech in the parent component
          // Only if not already coming from the details panel
          onSelectTech(tech);
        }
        
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
        findPrerequisites(techId);
        
        // Apply highlighting to nodes
        setNodes(nds => 
          nds.map(n => ({
            ...n,
            data: { 
              ...n.data, 
              highlighted: highlightedNodeIds.has(n.id) && n.id !== techId,
              selected: n.id === techId
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
        
        // Show toast only if not from details panel
        if (!fromDetailsPanel) {
          toast({
            title: 'Focused on Technology',
            description: `Centered view on ${node.data.name}`,
            status: 'info',
            duration: 2000,
            isClosable: true,
            position: 'top-right',
          });
        }
      }
    };
    
    window.addEventListener('focusOnTech', handleFocusOnTech);
    
    return () => {
      window.removeEventListener('focusOnTech', handleFocusOnTech);
    };
  }, [getNode, setCenter, setNodes, setEdgesState, toast, technologies, onSelectTech]);
  
  // Update highlighting when selectedTech changes
  useEffect(() => {
    if (!selectedTech || !initialFitDoneRef.current) return;
    
    const node = getNode(selectedTech.id);
    if (!node) return;
    
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
    findPrerequisites(selectedTech.id);
    
    // Apply highlighting to nodes
    setNodes(nds => 
      nds.map(n => ({
        ...n,
        data: { 
          ...n.data, 
          highlighted: highlightedNodeIds.has(n.id) && n.id !== selectedTech.id,
          selected: n.id === selectedTech.id
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
    
  }, [selectedTech, getNode, setNodes, setEdgesState]);
  
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