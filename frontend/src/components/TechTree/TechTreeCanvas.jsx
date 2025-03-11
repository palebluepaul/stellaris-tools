import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  addEdge,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Box, useColorModeValue, useToast, Button, Tooltip, Switch, FormControl, FormLabel, HStack, Text, VStack, Divider } from '@chakra-ui/react';
import { RepeatIcon, ViewIcon, SettingsIcon } from '@chakra-ui/icons';

// Import custom node types
import TechNode from './TechNode';
import TechEdge from './TechEdge';
import { transformTechDataToReactFlow } from './mockTechnologies';

// Define node types and edge types outside the component to prevent recreation on each render
const NODE_TYPES = { techNode: TechNode };
const EDGE_TYPES = { techEdge: TechEdge };

// Default edge options
const DEFAULT_EDGE_OPTIONS = {
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
  selectedTech,
  debugData = {}
}) => {
  // React Flow instance
  const { fitView, getNode, getEdges, setEdges, setCenter, getNodes } = useReactFlow();
  const toast = useToast();
  
  // State for nodes and edges
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdgesState, onEdgesChange] = useEdgesState([]);
  
  // State for filtered view
  const [enableFilteredView, setEnableFilteredView] = useState(false);
  const [filteredNodes, setFilteredNodes] = useState([]);
  const [filteredEdges, setFilteredEdges] = useState([]);
  const [isFiltered, setIsFiltered] = useState(false);
  const [useRelayout, setUseRelayout] = useState(true);
  
  // Ref to track if initial fit view has been done
  const initialFitDoneRef = useRef(false);
  
  // Debug state for tracking React Flow events
  const [localDebugInfo, setLocalDebugInfo] = useState({
    nodeCount: 0,
    edgeCount: 0,
    selectedNodes: [],
  });
  
  // Update App's debug panel with our debug data - use a ref to prevent infinite updates
  const debugDataRef = useRef(debugData);
  useEffect(() => {
    debugDataRef.current = debugData;
  }, [debugData]);
  
  // Find all prerequisites recursively
  const findAllPrerequisites = useCallback((techId, allPrereqs = new Set()) => {
    // Get the tech node
    const tech = technologies.find(t => t.id === techId);
    if (!tech) return allPrereqs;
    
    // Add prerequisites
    if (Array.isArray(tech.prerequisites)) {
      tech.prerequisites.forEach(prereqId => {
        if (!allPrereqs.has(prereqId)) {
          allPrereqs.add(prereqId);
          // Recursively find prerequisites of this prerequisite
          findAllPrerequisites(prereqId, allPrereqs);
        }
      });
    }
    
    return allPrereqs;
  }, [technologies]);
  
  // Find all techs that are unlocked by this tech (recursively)
  const findAllUnlocks = useCallback((techId, allUnlocks = new Set()) => {
    // Find all techs that have this tech as a prerequisite
    technologies.forEach(tech => {
      if (Array.isArray(tech.prerequisites) && tech.prerequisites.includes(techId)) {
        if (!allUnlocks.has(tech.id)) {
          allUnlocks.add(tech.id);
          // Recursively find techs unlocked by this tech
          findAllUnlocks(tech.id, allUnlocks);
        }
      }
    });
    
    return allUnlocks;
  }, [technologies]);
  
  // Re-layout nodes for focus mode
  const relayoutNodesForFocusMode = useCallback((nodes, edges, selectedTechId, prereqIds, unlockIds) => {
    // Create a map of nodes by ID for quick lookup
    const nodeMap = new Map(nodes.map(node => [node.id, { ...node }]));
    
    // Find the selected node
    const selectedNode = nodeMap.get(selectedTechId);
    if (!selectedNode) return nodes;
    
    // Create a map to track the level of each node (distance from selected node)
    const nodeLevels = new Map();
    
    // Set the selected node at level 0
    nodeLevels.set(selectedTechId, 0);
    
    // Assign levels to prerequisite nodes (negative levels - above the selected node)
    const assignPrereqLevels = (techId, level) => {
      // Get direct prerequisites
      const tech = technologies.find(t => t.id === techId);
      if (!tech || !Array.isArray(tech.prerequisites)) return;
      
      tech.prerequisites.forEach(prereqId => {
        if (nodeMap.has(prereqId)) {
          // If this prerequisite doesn't have a level yet, or its current level is lower (further from selected)
          // than the new level, update it
          if (!nodeLevels.has(prereqId) || nodeLevels.get(prereqId) < level) {
            nodeLevels.set(prereqId, level);
            // Recursively assign levels to this prerequisite's prerequisites
            assignPrereqLevels(prereqId, level - 1);
          }
        }
      });
    };
    
    // Start assigning levels to prerequisites
    assignPrereqLevels(selectedTechId, -1);
    
    // Assign levels to unlocked nodes (positive levels - below the selected node)
    const assignUnlockLevels = (techId, level) => {
      // Find techs that have this tech as a prerequisite
      technologies.forEach(tech => {
        if (Array.isArray(tech.prerequisites) && tech.prerequisites.includes(techId)) {
          if (nodeMap.has(tech.id)) {
            // If this unlock doesn't have a level yet, or its current level is lower (further from selected)
            // than the new level, update it
            if (!nodeLevels.has(tech.id) || nodeLevels.get(tech.id) < level) {
              nodeLevels.set(tech.id, level);
              // Recursively assign levels to techs unlocked by this tech
              assignUnlockLevels(tech.id, level + 1);
            }
          }
        }
      });
    };
    
    // Start assigning levels to unlocks
    assignUnlockLevels(selectedTechId, 1);
    
    // Count nodes at each level
    const nodesPerLevel = new Map();
    nodeLevels.forEach((level, techId) => {
      if (!nodesPerLevel.has(level)) {
        nodesPerLevel.set(level, []);
      }
      nodesPerLevel.get(level).push(techId);
    });
    
    // Sort levels
    const sortedLevels = Array.from(nodesPerLevel.keys()).sort((a, b) => a - b);
    
    // Calculate the maximum number of nodes at any level
    const maxNodesInLevel = Math.max(...Array.from(nodesPerLevel.values()).map(nodes => nodes.length));
    
    // Define spacing constants
    const nodeWidth = 180;
    const nodeHeight = 100;
    const horizontalSpacing = 250;
    const verticalSpacing = 200;
    
    // Calculate the total width needed
    const totalWidth = maxNodesInLevel * horizontalSpacing;
    
    // Position nodes based on their level
    sortedLevels.forEach(level => {
      const nodesInThisLevel = nodesPerLevel.get(level);
      const levelWidth = nodesInThisLevel.length * horizontalSpacing;
      const startX = (totalWidth - levelWidth) / 2;
      
      nodesInThisLevel.forEach((techId, index) => {
        const node = nodeMap.get(techId);
        if (node) {
          // Position the node
          node.position = {
            x: startX + (index * horizontalSpacing),
            y: level * verticalSpacing
          };
        }
      });
    });
    
    // Return the re-layouted nodes
    return Array.from(nodeMap.values());
  }, [technologies]);
  
  // Filter the tech tree based on the selected tech
  const filterTechTree = useCallback((selectedTechId) => {
    if (!selectedTechId || !enableFilteredView) {
      // If no tech is selected or filtering is disabled, show all nodes
      setFilteredNodes(nodes);
      setFilteredEdges(edges);
      setIsFiltered(false);
      return;
    }
    
    // Find all prerequisites and unlocks
    const prereqIds = findAllPrerequisites(selectedTechId);
    const unlockIds = findAllUnlocks(selectedTechId);
    
    // Add the selected tech itself
    const relevantTechIds = new Set([selectedTechId, ...prereqIds, ...unlockIds]);
    
    // Filter nodes
    const relevantNodes = nodes.filter(node => relevantTechIds.has(node.id));
    
    // Filter edges - only keep edges where both source and target are in the relevant techs
    const relevantEdges = edges.filter(edge => 
      relevantTechIds.has(edge.source) && relevantTechIds.has(edge.target)
    );
    
    // Determine which nodes to use based on the relayout setting
    let nodesToUse;
    if (useRelayout) {
      // Re-layout the nodes for better visualization in focus mode
      nodesToUse = relayoutNodesForFocusMode(
        relevantNodes, 
        relevantEdges, 
        selectedTechId, 
        prereqIds, 
        unlockIds
      );
    } else {
      // Use the original positions
      nodesToUse = relevantNodes;
    }
    
    // Update filtered nodes and edges
    setFilteredNodes(nodesToUse);
    setFilteredEdges(relevantEdges);
    setIsFiltered(true);
    
    // Log for debugging
    console.log(`Filtered tech tree to show ${nodesToUse.length} nodes and ${relevantEdges.length} edges related to ${selectedTechId}`);
    console.log(`Using ${useRelayout ? 'hierarchical' : 'original'} layout`);
    
    // Fit view to the filtered nodes
    setTimeout(() => {
      fitView({ 
        padding: 0.3,
        includeHiddenNodes: false,
        duration: 800
      });
    }, 100);
  }, [nodes, edges, findAllPrerequisites, findAllUnlocks, enableFilteredView, useRelayout, fitView, relayoutNodesForFocusMode]);
  
  // Separate effect for updating global debug data to avoid infinite loops
  useEffect(() => {
    const updateGlobalDebugData = () => {
      // Only update if we have nodes loaded
      if (!getNodes) return;
      
      // Combine local debug info with the debug data from props
      const combinedDebugData = {
        ...debugDataRef.current,
        reactFlow: {
          ...localDebugInfo,
          viewport: {
            zoom: getNodes()?.length ? 'Loaded' : 'Not Loaded',
          }
        },
        techCounts: {
          ...debugDataRef.current.techCounts,
          // Add more detailed counts if available
          baseGame: debugData.baseGameCount || 0,
          mods: debugData.modCount || 0,
          newFromMods: debugData.newModCount || 0,
          localized: debugData.localizedCount || 0,
          total: technologies.length
        }
      };
      
      // Update the global debug data
      if (window.updateDebugData) {
        window.updateDebugData(combinedDebugData);
      } else {
        // Create the function if it doesn't exist
        window.updateDebugData = (data) => {
          const event = new CustomEvent('updateDebugData', { detail: data });
          window.dispatchEvent(event);
        };
        window.updateDebugData(combinedDebugData);
      }
    };
    
    // Set up an interval to update debug data periodically instead of on every change
    const intervalId = setInterval(updateGlobalDebugData, 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [localDebugInfo, getNodes]);
  
  // Load data when technologies change
  useEffect(() => {
    if (technologies.length === 0) return;
    
    console.log(`Loading ${technologies.length} technologies into React Flow`);
    
    const { nodes: initialNodes, edges: initialEdges } = transformTechDataToReactFlow(technologies);
    
    console.log(`Created ${initialNodes.length} nodes and ${initialEdges.length} edges`);
    
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
    
    // Initialize filtered nodes and edges with all nodes and edges
    setFilteredNodes(initialNodes);
    setFilteredEdges(customEdges);
    
    // Update debug info
    setLocalDebugInfo(prev => ({
      ...prev,
      nodeCount: initialNodes.length,
      edgeCount: customEdges.length,
    }));
    
    // For large datasets, use a longer timeout to ensure all nodes are rendered
    const timeoutDuration = technologies.length > 100 ? 3000 : 1000;
    
    // Fit view after data is loaded with a better padding
    setTimeout(() => {
      console.log('Fitting view to nodes');
      
      // For very large datasets, use a more zoomed-out view
      const padding = technologies.length > 300 ? 1.0 : 0.8;
      const maxZoom = technologies.length > 300 ? 0.3 : 0.5;
      
      fitView({ 
        padding,
        includeHiddenNodes: true,
        duration: 1500,
        maxZoom
      });
      
      initialFitDoneRef.current = true;
      
      console.log('View fitted');
      
      // Add a second fit view with a longer delay to ensure all nodes are properly positioned
      setTimeout(() => {
        console.log('Refitting view to ensure all nodes are visible');
        fitView({ 
          padding,
          includeHiddenNodes: true,
          duration: 1000,
          maxZoom
        });
      }, 2000);
    }, timeoutDuration);
  }, [technologies, setNodes, setEdgesState, fitView]);
  
  // Filter tech tree when selected tech changes
  useEffect(() => {
    if (selectedTech) {
      filterTechTree(selectedTech.id);
    } else {
      // If no tech is selected, show all nodes
      setFilteredNodes(nodes);
      setFilteredEdges(edges);
      setIsFiltered(false);
    }
  }, [selectedTech, nodes, edges, filterTechTree]);
  
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
    setLocalDebugInfo(prev => ({
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
        nodes={isFiltered ? filteredNodes : nodes}
        edges={isFiltered ? filteredEdges : edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onSelectionChange={onSelectionChange}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        fitView
        fitViewOptions={{ 
          padding: 0.8,
          maxZoom: 0.5
        }}
        minZoom={0.05}
        maxZoom={2.0}
        defaultViewport={{ x: 0, y: 0, zoom: 0.2 }}
        attributionPosition="bottom-right"
        style={{ width: '100%', height: '100%' }}
        selectNodesOnDrag={false}
        nodesDraggable={false}
        elementsSelectable={true}
        zoomOnScroll={true}
        panOnScroll={true}
        panOnDrag={true}
        zoomOnDoubleClick={true}
        nodeExtent={[
          [-20000, -20000],
          [20000, 20000]
        ]}
      >
        <Background color={useColorModeValue('#aaa', '#555')} gap={16} />
        <Controls>
          <Tooltip label="Reset View">
            <Button
              size="sm"
              variant="ghost"
              colorScheme="blue"
              leftIcon={<RepeatIcon />}
              onClick={() => {
                fitView({ 
                  padding: 0.8,
                  includeHiddenNodes: true,
                  duration: 1500,
                  maxZoom: 0.5
                });
              }}
            >
              Reset View
            </Button>
          </Tooltip>
        </Controls>
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
        
        {/* Filter toggle panel */}
        <Panel position="top-right" style={{ background: 'transparent', border: 'none' }}>
          <Box 
            bg={useColorModeValue('white', 'gray.800')} 
            p={3} 
            borderRadius="md" 
            boxShadow="md"
            borderWidth="1px"
            borderColor={useColorModeValue('gray.200', 'gray.700')}
          >
            <VStack spacing={3} align="stretch">
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="filter-toggle" mb="0" fontSize="sm">
                  <HStack spacing={2}>
                    <ViewIcon />
                    <Text>Focus View</Text>
                  </HStack>
                </FormLabel>
                <Switch 
                  id="filter-toggle" 
                  isChecked={enableFilteredView}
                  onChange={(e) => {
                    setEnableFilteredView(e.target.checked);
                    if (!e.target.checked) {
                      // If disabling, show all nodes
                      setFilteredNodes(nodes);
                      setFilteredEdges(edges);
                      setIsFiltered(false);
                      
                      // Fit view to all nodes
                      setTimeout(() => {
                        fitView({ 
                          padding: 0.8,
                          includeHiddenNodes: true,
                          duration: 800,
                          maxZoom: 0.5
                        });
                      }, 100);
                    } else if (selectedTech) {
                      // If enabling and a tech is selected, filter the tree
                      filterTechTree(selectedTech.id);
                    }
                  }}
                  colorScheme="blue"
                  size="md"
                />
              </FormControl>
              
              {enableFilteredView && (
                <>
                  <Divider />
                  <FormControl display="flex" alignItems="center">
                    <FormLabel htmlFor="layout-toggle" mb="0" fontSize="sm">
                      <HStack spacing={2}>
                        <SettingsIcon />
                        <Text>Hierarchical Layout</Text>
                      </HStack>
                    </FormLabel>
                    <Switch 
                      id="layout-toggle" 
                      isChecked={useRelayout}
                      onChange={(e) => {
                        setUseRelayout(e.target.checked);
                        if (selectedTech) {
                          // Re-filter with the new layout setting
                          filterTechTree(selectedTech.id);
                        }
                      }}
                      colorScheme="green"
                      size="md"
                    />
                  </FormControl>
                </>
              )}
              
              {selectedTech && enableFilteredView && isFiltered && (
                <Text fontSize="xs" color="gray.500">
                  Showing {filteredNodes.length} related technologies
                </Text>
              )}
            </VStack>
          </Box>
        </Panel>
      </ReactFlow>
    </Box>
  );
};

export default TechTreeCanvas; 