import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  Text,
  Heading,
  Badge,
  Divider,
  List,
  ListItem,
  ListIcon,
  Button,
  Flex,
  HStack,
  useColorModeValue,
  Checkbox,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Tag,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { 
  ChevronRightIcon, 
  DeleteIcon, 
  CheckIcon, 
  InfoIcon,
  StarIcon
} from '@chakra-ui/icons';
import { mockTechnologies } from './mockTechnologies';
import { fetchAllPrerequisitesForMultipleTechnologies } from '../../services/api';

const PlanTab = ({ 
  plannedTechs = [], 
  researchedTechs = [], 
  onTogglePlanTech, 
  onToggleResearchedTech,
  onClearPlan
}) => {
  const [allPrerequisites, setAllPrerequisites] = useState([]);
  const [availableTechs, setAvailableTechs] = useState([]);
  const [allTechs, setAllTechs] = useState(mockTechnologies);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Debug function to manually add a tech to available techs
  const addToAvailable = (tech) => {
    console.log('Manually adding tech to available:', tech);
    setAvailableTechs(prev => {
      if (prev.some(t => t.id === tech.id)) {
        return prev;
      }
      return [...prev, tech];
    });
  };
  
  // Color mode values
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const sectionBgColor = useColorModeValue('gray.50', 'gray.700');
  
  // Category color mapping
  const categoryColors = {
    physics: 'blue',
    society: 'green',
    engineering: 'orange'
  };
  
  // Find all prerequisites for all planned techs using the new API
  useEffect(() => {
    console.log('PlanTab - plannedTechs:', plannedTechs);
    
    if (plannedTechs.length === 0) {
      setAllPrerequisites([]);
      setAvailableTechs([]);
      return;
    }
    
    const fetchPrerequisites = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the IDs of all planned techs
        const plannedTechIds = plannedTechs.map(tech => tech.id);
        console.log('PlanTab - plannedTechIds:', plannedTechIds);
        
        // Fetch all prerequisites for all planned techs
        const result = await fetchAllPrerequisitesForMultipleTechnologies(plannedTechIds, true);
        console.log('PlanTab - API result:', result);
        
        if (!result || !result.technologies) {
          throw new Error('Invalid response from API');
        }
        
        // Extract all unique prerequisites from the result
        const allPrereqsSet = new Set();
        const allPrereqsList = [];
        
        // Track which planned techs each prerequisite gates
        const prereqToPlannedTechMap = new Map();
        
        // Process each technology's prerequisites
        Object.entries(result.technologies).forEach(([techId, techData]) => {
          const plannedTech = plannedTechs.find(t => t.id === techId);
          
          if (techData.allPrerequisites) {
            techData.allPrerequisites.forEach(prereq => {
              // Add to the map of which planned techs this prerequisite gates
              if (!prereqToPlannedTechMap.has(prereq.id)) {
                prereqToPlannedTechMap.set(prereq.id, []);
              }
              prereqToPlannedTechMap.get(prereq.id).push(plannedTech);
              
              // Add to the set of all prerequisites
              if (!allPrereqsSet.has(prereq.id)) {
                allPrereqsSet.add(prereq.id);
                allPrereqsList.push({
                  ...prereq,
                  _isPrerequisite: true,
                  _gatesPlannedTechs: [plannedTech]
                });
              } else {
                // Update the existing prerequisite to add this planned tech
                const existingPrereq = allPrereqsList.find(p => p.id === prereq.id);
                if (existingPrereq && !existingPrereq._gatesPlannedTechs.some(t => t.id === plannedTech.id)) {
                  existingPrereq._gatesPlannedTechs.push(plannedTech);
                }
              }
            });
          }
        });
        
        console.log('Prerequisite technologies:', allPrereqsList);
        
        // Determine available technologies
        const availableTechsList = [];
        const researchedTechIds = new Set(researchedTechs.map(tech => tech.id));
        
        // First, add all tier 0 techs that have no prerequisites
        [...plannedTechs, ...allPrereqsList].forEach(tech => {
          if (tech.tier === 0 && 
              (!tech.prerequisites || tech.prerequisites.length === 0) &&
              !researchedTechIds.has(tech.id)) {
            console.log(`Tech ${tech.name || tech.id} is tier 0 with no prerequisites, marking as available`);
            availableTechsList.push(tech);
          }
        });
        
        // Then, add techs whose prerequisites are all researched
        [...plannedTechs, ...allPrereqsList].forEach(tech => {
          // Skip if already added or researched
          if (availableTechsList.some(t => t.id === tech.id) || 
              researchedTechIds.has(tech.id)) {
            return;
          }
          
          // Skip if no prerequisites (these were handled above)
          if (!tech.prerequisites || tech.prerequisites.length === 0) {
            return;
          }
          
          // Check if all prerequisites are researched
          const allPrereqsResearched = tech.prerequisites.every(prereqId => 
            researchedTechIds.has(prereqId)
          );
          
          if (allPrereqsResearched) {
            console.log(`All prerequisites for ${tech.name || tech.id} are researched, marking as available`);
            availableTechsList.push(tech);
          }
        });
        
        // If no techs are available yet, find the "root" prerequisites that should be researched first
        if (availableTechsList.length === 0) {
          // Find the lowest tier prerequisites that aren't researched yet
          const lowestTierTechs = [...allPrereqsList, ...plannedTechs]
            .filter(tech => !researchedTechIds.has(tech.id))
            .sort((a, b) => a.tier - b.tier);
          
          if (lowestTierTechs.length > 0) {
            const lowestTier = lowestTierTechs[0].tier;
            const lowestTierAvailable = lowestTierTechs.filter(tech => tech.tier === lowestTier);
            
            console.log(`No available techs found. Adding lowest tier (${lowestTier}) techs:`, lowestTierAvailable);
            availableTechsList.push(...lowestTierAvailable);
          }
        }
        
        console.log('PlanTab - availableTechsList:', availableTechsList);
        setAvailableTechs(availableTechsList);
        setAllPrerequisites(allPrereqsList);
      } catch (err) {
        console.error('Error fetching prerequisites:', err);
        setError(err.message);
        
        // Fallback to the old method if API fails
        fallbackCalculatePrerequisites();
      } finally {
        setIsLoading(false);
      }
    };
    
    // Fallback method to calculate prerequisites locally
    const fallbackCalculatePrerequisites = () => {
      console.log('Using fallback method to calculate prerequisites');
      
      // Get all prerequisite IDs from all planned techs
      const allPrereqIds = new Set();
      
      // Add the planned techs themselves
      const plannedTechIds = new Set(plannedTechs.map(tech => tech.id));
      console.log('PlanTab - plannedTechIds:', Array.from(plannedTechIds));
      
      // Track which planned techs each prerequisite gates
      const prereqToPlannedTechMap = new Map();
      
      // Function to recursively find all prerequisites
      const findAllPrereqs = (tech, techsMap, plannedTech) => {
        if (!tech.prerequisites || tech.prerequisites.length === 0) {
          return;
        }
        
        tech.prerequisites.forEach(prereqId => {
          allPrereqIds.add(prereqId);
          
          // Add to the map of which planned techs this prerequisite gates
          if (!prereqToPlannedTechMap.has(prereqId)) {
            prereqToPlannedTechMap.set(prereqId, []);
          }
          if (!prereqToPlannedTechMap.get(prereqId).some(t => t.id === plannedTech.id)) {
            prereqToPlannedTechMap.get(prereqId).push(plannedTech);
          }
          
          // Find the prerequisite tech object
          const prereqTech = techsMap.get(prereqId);
          if (prereqTech) {
            findAllPrereqs(prereqTech, techsMap, plannedTech);
          }
        });
      };
      
      // Create a map of all technologies for quick lookup
      const techsMap = new Map();
      allTechs.forEach(tech => {
        techsMap.set(tech.id, tech);
      });
      
      // Find all prerequisites for each planned tech
      plannedTechs.forEach(plannedTech => {
        findAllPrereqs(plannedTech, techsMap, plannedTech);
      });
      
      console.log('All prerequisite IDs:', Array.from(allPrereqIds));
      
      // Get all prerequisite tech objects
      const prereqTechs = Array.from(allPrereqIds)
        .map(id => {
          const tech = techsMap.get(id);
          if (tech) {
            return {
              ...tech,
              _isPrerequisite: true,
              _gatesPlannedTechs: prereqToPlannedTechMap.get(id) || []
            };
          }
          return null;
        })
        .filter(Boolean);
      
      console.log('Prerequisite technologies:', prereqTechs);
      
      // Create a map of all technologies including planned and prerequisites
      const allTechsMap = new Map();
      [...plannedTechs, ...prereqTechs].forEach(tech => {
        allTechsMap.set(tech.id, tech);
      });
      
      // Determine available technologies (tier 0/1 or all prerequisites are researched)
      const availableTechsList = [];
      
      // First, add all tier 0 techs that have no prerequisites
      [...plannedTechs, ...prereqTechs].forEach(tech => {
        if (tech.tier === 0 && 
            (!tech.prerequisites || tech.prerequisites.length === 0) &&
            !researchedTechs.some(t => t.id === tech.id)) {
          console.log(`Tech ${tech.name || tech.id} is tier 0 with no prerequisites, marking as available`);
          availableTechsList.push(tech);
        }
      });
      
      // Then, add techs whose prerequisites are all researched
      [...plannedTechs, ...prereqTechs].forEach(tech => {
        // Skip if already added or researched
        if (availableTechsList.some(t => t.id === tech.id) || 
            researchedTechs.some(t => t.id === tech.id)) {
          return;
        }
        
        // Skip if no prerequisites (these were handled above)
        if (!tech.prerequisites || tech.prerequisites.length === 0) {
          return;
        }
        
        // Check if all prerequisites are researched
        const allPrereqsResearched = tech.prerequisites.every(prereqId => 
          researchedTechs.some(t => t.id === prereqId)
        );
        
        if (allPrereqsResearched) {
          console.log(`All prerequisites for ${tech.name || tech.id} are researched, marking as available`);
          availableTechsList.push(tech);
        }
      });
      
      // If no techs are available yet, find the "root" prerequisites that should be researched first
      if (availableTechsList.length === 0) {
        // Find the lowest tier prerequisites that aren't researched yet
        const lowestTierTechs = [...prereqTechs, ...plannedTechs]
          .filter(tech => !researchedTechs.some(t => t.id === tech.id))
          .sort((a, b) => a.tier - b.tier);
        
        if (lowestTierTechs.length > 0) {
          const lowestTier = lowestTierTechs[0].tier;
          const lowestTierAvailable = lowestTierTechs.filter(tech => tech.tier === lowestTier);
          
          console.log(`No available techs found. Adding lowest tier (${lowestTier}) techs:`, lowestTierAvailable);
          availableTechsList.push(...lowestTierAvailable);
        }
      }
      
      console.log('PlanTab - availableTechsList:', availableTechsList);
      setAvailableTechs(availableTechsList);
      setAllPrerequisites(prereqTechs);
    };
    
    // Call the fetch function
    fetchPrerequisites();
  }, [plannedTechs, researchedTechs, allTechs]);
  
  // Group technologies by category
  const techsByCategory = useMemo(() => {
    const grouped = {
      physics: [],
      society: [],
      engineering: []
    };
    
    availableTechs.forEach(tech => {
      const category = tech.areaId || 'physics';
      if (grouped[category]) {
        grouped[category].push(tech);
      }
    });
    
    // Sort each category by tier and then by name
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        if (a.tier !== b.tier) {
          return a.tier - b.tier;
        }
        return a.name.localeCompare(b.name);
      });
    });
    
    return grouped;
  }, [availableTechs]);
  
  // Group remaining prerequisites by planned tech
  const remainingPrereqsByPlannedTech = useMemo(() => {
    const grouped = {};
    
    // Filter prerequisites that are not yet researched
    const remainingPrereqs = allPrerequisites.filter(
      tech => !researchedTechs.some(t => t.id === tech.id)
    );
    
    // Group by the planned techs they gate
    remainingPrereqs.forEach(tech => {
      if (tech._gatesPlannedTechs && tech._gatesPlannedTechs.length > 0) {
        tech._gatesPlannedTechs.forEach(plannedTech => {
          const plannedTechId = plannedTech.id;
          if (!grouped[plannedTechId]) {
            grouped[plannedTechId] = {
              plannedTech,
              prerequisites: []
            };
          }
          
          // Only add if not already in the list
          if (!grouped[plannedTechId].prerequisites.some(p => p.id === tech.id)) {
            grouped[plannedTechId].prerequisites.push(tech);
          }
        });
      }
    });
    
    // Sort prerequisites in each group by tier and name
    Object.values(grouped).forEach(group => {
      group.prerequisites.sort((a, b) => {
        if (a.tier !== b.tier) {
          return a.tier - b.tier;
        }
        return (a.displayName || a.name || a.id).localeCompare(b.displayName || b.name || b.id);
      });
    });
    
    return grouped;
  }, [allPrerequisites, researchedTechs]);
  
  // Calculate total counts for each section
  const totalRemainingPrereqs = useMemo(() => 
    Object.values(remainingPrereqsByPlannedTech).reduce(
      (total, group) => total + group.prerequisites.length, 
      0
    ), 
    [remainingPrereqsByPlannedTech]
  );
  
  // Group researched technologies by category
  const researchedTechsByCategory = useMemo(() => {
    const grouped = {
      physics: [],
      society: [],
      engineering: []
    };
    
    researchedTechs.forEach(tech => {
      const category = tech.areaId || 'physics';
      if (grouped[category]) {
        grouped[category].push(tech);
      }
    });
    
    // Sort each category by tier and then by name
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        if (a.tier !== b.tier) {
          return a.tier - b.tier;
        }
        return a.name.localeCompare(b.name);
      });
    });
    
    return grouped;
  }, [researchedTechs]);
  
  // Group planned technologies by category
  const plannedTechsByCategory = useMemo(() => {
    const grouped = {
      physics: [],
      society: [],
      engineering: []
    };
    
    plannedTechs.forEach(tech => {
      const category = tech.areaId || 'physics';
      if (grouped[category]) {
        grouped[category].push(tech);
      }
    });
    
    // Sort each category by tier and then by name
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        if (a.tier !== b.tier) {
          return a.tier - b.tier;
        }
        return (a.displayName || a.name || a.id).localeCompare(b.displayName || b.name || b.id);
      });
    });
    
    return grouped;
  }, [plannedTechs]);
  
  // If no techs are planned, show empty state
  if (plannedTechs.length === 0) {
    return (
      <Box p={4} height="100%">
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="md"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            No Technologies Planned
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            Add technologies to your plan by selecting them in the Tech Tree tab and clicking "Add to Plan".
          </AlertDescription>
        </Alert>
      </Box>
    );
  }
  
  return (
    <Box p={4} height="100%" overflowY="auto">
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Research Plan</Heading>
        
        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Error loading prerequisites</AlertTitle>
              <AlertDescription display="block">
                {error}
              </AlertDescription>
            </Box>
          </Alert>
        )}
        
        {isLoading ? (
          <Box textAlign="center" py={4}>
            <Text>Loading prerequisites...</Text>
          </Box>
        ) : (
          <>
            {/* Available Technologies Section */}
            <Box>
              <Accordion defaultIndex={[0]} allowMultiple>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="bold">
                        Available Technologies
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    {availableTechs.length === 0 ? (
                      <Text color="gray.500" fontStyle="italic">No available technologies found.</Text>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {Object.entries(techsByCategory).map(([category, techs]) => (
                          techs.length > 0 && (
                            <Box key={category}>
                              <Heading size="xs" mb={2} color={`${categoryColors[category]}.500`}>
                                {category.charAt(0).toUpperCase() + category.slice(1)}
                              </Heading>
                              <List spacing={2}>
                                {techs.map(tech => (
                                  <ListItem key={tech.id} display="flex" alignItems="center">
                                    <Checkbox 
                                      isChecked={researchedTechs.some(t => t.id === tech.id)}
                                      onChange={() => onToggleResearchedTech(tech)}
                                      mr={2}
                                    />
                                    <ListIcon 
                                      as={tech._isPrerequisite ? InfoIcon : StarIcon} 
                                      color={tech._isPrerequisite ? "blue.500" : "yellow.500"} 
                                    />
                                    <Box>
                                      <Text>
                                        {tech.displayName || tech.name || tech.id}
                                        <Badge ml={2} colorScheme={categoryColors[category]}>
                                          Tier {tech.tier}
                                        </Badge>
                                        {tech._isPrerequisite && (
                                          <Badge ml={2} colorScheme="blue">
                                            Prerequisite
                                          </Badge>
                                        )}
                                      </Text>
                                      {tech._gatesPlannedTechs && tech._gatesPlannedTechs.length > 0 && (
                                        <Text fontSize="sm" color="gray.500" mt={1}>
                                          Gates: {tech._gatesPlannedTechs.map(pt => 
                                            pt.displayName || pt.name || pt.id
                                          ).join(', ')}
                                        </Text>
                                      )}
                                    </Box>
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )
                        ))}
                      </VStack>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
            
            {/* Planned Technologies Section */}
            <Box mt={4}>
              <Accordion allowMultiple defaultIndex={[0]}>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="bold">
                        Planned Technologies ({plannedTechs.length})
                      </Box>
                      <Button 
                        size="xs" 
                        colorScheme="red" 
                        mr={2}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent accordion from toggling
                          onClearPlan();
                        }}
                        isDisabled={plannedTechs.length === 0}
                      >
                        Clear All
                      </Button>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    {plannedTechs.length === 0 ? (
                      <Text color="gray.500" fontStyle="italic">No technologies are currently planned.</Text>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {Object.entries(plannedTechsByCategory).map(([category, techs]) => (
                          techs.length > 0 && (
                            <Box key={category}>
                              <Heading size="xs" mb={2} color={`${categoryColors[category]}.500`}>
                                {category.charAt(0).toUpperCase() + category.slice(1)} ({techs.length})
                              </Heading>
                              <List spacing={2}>
                                {techs.map(tech => (
                                  <ListItem key={tech.id} display="flex" alignItems="center">
                                    <Button 
                                      size="xs" 
                                      colorScheme="red" 
                                      variant="outline" 
                                      onClick={() => onTogglePlanTech(tech)}
                                      mr={2}
                                    >
                                      Remove
                                    </Button>
                                    <Text>
                                      {tech.displayName || tech.name || tech.id} (Tier {tech.tier})
                                    </Text>
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )
                        ))}
                      </VStack>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
            
            {/* Remaining Prerequisites Section */}
            <Box mt={4}>
              <Accordion allowMultiple>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="bold">
                        Remaining Prerequisites ({totalRemainingPrereqs})
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    {totalRemainingPrereqs === 0 ? (
                      <Text color="gray.500" fontStyle="italic">No remaining prerequisites.</Text>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {Object.entries(remainingPrereqsByPlannedTech).map(([plannedTechId, group]) => (
                          group.prerequisites.length > 0 && (
                            <Box key={plannedTechId}>
                              <Heading size="xs" mb={2} color={`${categoryColors[group.plannedTech.areaId] || 'physics'}.500`}>
                                {group.plannedTech.displayName || group.plannedTech.name || group.plannedTech.id}
                              </Heading>
                              <List spacing={2}>
                                {group.prerequisites.map(tech => (
                                  <ListItem key={tech.id} display="flex" alignItems="center">
                                    <Checkbox 
                                      isChecked={researchedTechs.some(t => t.id === tech.id)}
                                      onChange={() => onToggleResearchedTech(tech)}
                                      mr={2}
                                    />
                                    <ListIcon 
                                      as={InfoIcon} 
                                      color={`${categoryColors[tech.areaId] || 'physics'}.500`} 
                                    />
                                    <Text>
                                      {tech.displayName || tech.name || tech.id}
                                      <Badge ml={2} colorScheme={categoryColors[tech.areaId] || 'physics'}>
                                        Tier {tech.tier}
                                      </Badge>
                                      {availableTechs.some(t => t.id === tech.id) && (
                                        <Badge ml={2} colorScheme="green">
                                          Available
                                        </Badge>
                                      )}
                                    </Text>
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )
                        ))}
                      </VStack>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
            
            {/* Researched Technologies Section */}
            <Box mt={4}>
              <Accordion allowMultiple>
                <AccordionItem>
                  <h2>
                    <AccordionButton>
                      <Box flex="1" textAlign="left" fontWeight="bold">
                        Researched Technologies ({researchedTechs.length})
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>
                    {researchedTechs.length === 0 ? (
                      <Text color="gray.500" fontStyle="italic">No technologies have been researched yet.</Text>
                    ) : (
                      <VStack spacing={3} align="stretch">
                        {Object.entries(researchedTechsByCategory).map(([category, techs]) => (
                          techs.length > 0 && (
                            <Box key={category}>
                              <Heading size="xs" mb={2} color={`${categoryColors[category]}.500`}>
                                {category.charAt(0).toUpperCase() + category.slice(1)} ({techs.length})
                              </Heading>
                              <List spacing={2}>
                                {techs.map(tech => (
                                  <ListItem key={tech.id} display="flex" alignItems="center">
                                    <Checkbox 
                                      isChecked={true}
                                      onChange={() => onToggleResearchedTech(tech)}
                                      mr={2}
                                    />
                                    <ListIcon 
                                      as={CheckIcon} 
                                      color="green.500" 
                                    />
                                    <Text>
                                      {tech.displayName || tech.name || tech.id}
                                      <Badge ml={2} colorScheme={categoryColors[category]}>
                                        Tier {tech.tier}
                                      </Badge>
                                      <Badge ml={2} colorScheme="green">
                                        Researched
                                      </Badge>
                                      {tech._isPrerequisite && (
                                        <Badge ml={2} colorScheme="blue">
                                          Prerequisite
                                        </Badge>
                                      )}
                                    </Text>
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          )
                        ))}
                      </VStack>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default PlanTab; 