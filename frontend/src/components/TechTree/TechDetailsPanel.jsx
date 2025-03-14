import { useEffect, useState, useRef } from 'react';
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
  Collapse,
  useColorModeValue,
  useColorMode,
  Flex,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  useDisclosure,
  HStack,
  Tag,
  Code,
  useClipboard,
  Tooltip,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon
} from '@chakra-ui/react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon, 
  ChevronRightIcon,
  InfoIcon,
  ArrowForwardIcon,
  ArrowBackIcon,
  StarIcon,
  LockIcon,
  UnlockIcon,
  CopyIcon,
  CheckIcon,
  AddIcon,
  MinusIcon
} from '@chakra-ui/icons';

// Component to display debug information with copy button
const DebugInfoContent = ({ tech }) => {
  // Call all hooks at the top level
  const { hasCopied, onCopy } = useClipboard(JSON.stringify({
    id: tech.id,
    name: tech.displayName || tech.name,
    tier: tech.tier,
    category: tech.category || tech.areaId,
    area: tech.area || tech.categoryId,
    prerequisites: tech.prerequisites,
    position: tech._debug?.position || tech._position,
    // Include any other relevant information
  }, null, 2));
  
  return (
    <>
      <IconButton
        icon={hasCopied ? <CheckIcon /> : <CopyIcon />}
        size="sm"
        position="absolute"
        top={2}
        right={2}
        onClick={onCopy}
        aria-label="Copy debug info"
        colorScheme={hasCopied ? "green" : "blue"}
      />
      <VStack align="stretch" spacing={2}>
        <Text whiteSpace="pre-wrap" pr={10}>
          {JSON.stringify({
            id: tech.id,
            name: tech.displayName || tech.name,
            tier: tech.tier,
            category: tech.category || tech.areaId,
            area: tech.area || tech.categoryId,
            prerequisites: tech.prerequisites,
            position: tech._debug?.position || tech._position,
          }, null, 2)}
        </Text>
        <Text fontSize="xs" color="gray.500" mt={2}>
          If you find overlapping techs, please select both and share their debug information.
          The position coordinates (x, y) and globalKey are especially important.
        </Text>
      </VStack>
    </>
  );
};

// Separate component for the debug info container to avoid hooks in JSX
const DebugInfoContainer = ({ children }) => {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  
  return (
    <Box 
      p={3} 
      borderWidth="1px" 
      borderRadius="md" 
      bg={bgColor}
      fontSize="sm"
      fontFamily="monospace"
      position="relative"
    >
      {children}
    </Box>
  );
};

const TechDetailsPanel = ({ 
  selectedTech, 
  technologies = [], 
  onSelectTech,
  isOpen,
  onClose,
  plannedTechs = [],
  onTogglePlanTech
}) => {
  // State hooks
  const [prerequisites, setPrerequisites] = useState([]);
  const [unlocks, setUnlocks] = useState([]);
  const [showPrereqs, setShowPrereqs] = useState(true);
  const [showUnlocks, setShowUnlocks] = useState(true);
  
  // Call all context hooks unconditionally at the top level
  // This ensures consistent hook order across renders
  const { colorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.700', 'gray.200');
  const sectionBgColor = useColorModeValue('gray.50', 'gray.700');
  
  // Find prerequisites and unlocks when selected tech changes
  useEffect(() => {
    if (!selectedTech) {
      setPrerequisites([]);
      setUnlocks([]);
      return;
    }
    
    // Find prerequisites
    const prereqs = technologies.filter(tech => 
      selectedTech.prerequisites && selectedTech.prerequisites.includes(tech.id)
    );
    setPrerequisites(prereqs);
    
    // Find unlocks (techs that have this tech as a prerequisite)
    const unlockedTechs = technologies.filter(tech => 
      tech.prerequisites && tech.prerequisites.includes(selectedTech.id)
    );
    setUnlocks(unlockedTechs);
  }, [selectedTech, technologies]);
  
  // Check if the selected tech is in the plan
  const isInPlan = selectedTech && plannedTechs.some(tech => tech.id === selectedTech.id);
  
  // Handle toggle plan
  const handleTogglePlan = () => {
    if (selectedTech && onTogglePlanTech) {
      onTogglePlanTech(selectedTech);
    }
  };
  
  // Category color mapping
  const categoryColors = {
    physics: 'blue',
    society: 'green',
    engineering: 'orange'
  };
  
  // Area icons (can be expanded later)
  const areaIcons = {
    weapons: '🔫',
    shields: '🛡️',
    power: '⚡',
    ships: '🚀',
    default: '🔬'
  };
  
  // If no tech is selected, show empty state
  if (!selectedTech) {
    return (
      <Drawer
        isOpen={isOpen}
        placement="right"
        onClose={onClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Technology Details
          </DrawerHeader>
          <DrawerBody>
            <Flex 
              height="100%" 
              alignItems="center" 
              justifyContent="center" 
              flexDirection="column"
              color="gray.500"
            >
              <InfoIcon boxSize={10} mb={4} />
              <Text>Select a technology to view details</Text>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }
  
  // Get area icon
  const areaIcon = areaIcons[selectedTech.area] || areaIcons.default;
  
  return (
    <Drawer
      isOpen={isOpen}
      placement="right"
      onClose={onClose}
      size="md"
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">
          Technology Details
        </DrawerHeader>
        <DrawerBody>
          <VStack align="stretch" spacing={4}>
            {/* Tech header */}
            <Box>
              <Flex align="center" mb={2}>
                <Text fontSize="2xl" mr={2}>{areaIcon}</Text>
                <Heading size="lg">{selectedTech.displayName || selectedTech.name}</Heading>
              </Flex>
              
              <HStack spacing={2} mb={3} wrap="wrap">
                <Badge 
                  colorScheme={categoryColors[selectedTech.category]} 
                  fontSize="sm"
                  px={2}
                  py={1}
                  borderRadius="full"
                >
                  {selectedTech.category}
                </Badge>
                <Badge 
                  colorScheme="purple" 
                  fontSize="sm"
                  px={2}
                  py={1}
                  borderRadius="full"
                >
                  Tier {selectedTech.tier}
                </Badge>
                <Badge 
                  colorScheme="gray" 
                  fontSize="sm"
                  px={2}
                  py={1}
                  borderRadius="full"
                >
                  {selectedTech.area}
                </Badge>
              </HStack>
              
              <Text fontSize="md" mb={3}>
                {selectedTech.description}
              </Text>
              
              <HStack spacing={4} mb={3}>
                <Tag size="md" variant="outline" colorScheme="blue">
                  Cost: {selectedTech.cost}
                </Tag>
                <Tag size="md" variant="outline" colorScheme="green">
                  Prerequisites: {selectedTech.prerequisites.length}
                </Tag>
                <Tag size="md" variant="outline" colorScheme="orange">
                  Unlocks: {unlocks.length}
                </Tag>
              </HStack>
              
              {/* Add to Plan Button */}
              <Button
                leftIcon={isInPlan ? <MinusIcon /> : <AddIcon />}
                colorScheme={isInPlan ? "red" : "teal"}
                variant="solid"
                size="md"
                onClick={handleTogglePlan}
                mb={3}
                width="100%"
              >
                {isInPlan ? "Remove from Plan" : "Add to Plan"}
              </Button>
            </Box>
            
            <Divider />
            
            {/* Prerequisites section */}
            <Box>
              <Flex 
                p={2} 
                bg={sectionBgColor} 
                borderRadius="md" 
                justify="space-between" 
                align="center"
                onClick={() => setShowPrereqs(!showPrereqs)}
                cursor="pointer"
                mb={showPrereqs ? 2 : 0}
              >
                <HStack>
                  <LockIcon />
                  <Text fontWeight="bold">Prerequisites ({prerequisites.length})</Text>
                </HStack>
                <IconButton
                  icon={showPrereqs ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  variant="ghost"
                  size="sm"
                  aria-label={showPrereqs ? "Hide prerequisites" : "Show prerequisites"}
                />
              </Flex>
              
              <Collapse in={showPrereqs} animateOpacity>
                {prerequisites.length > 0 ? (
                  <List spacing={2}>
                    {prerequisites.map(tech => (
                      <ListItem 
                        key={tech.id}
                        p={2}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        _hover={{ bg: sectionBgColor }}
                        cursor="pointer"
                        onClick={() => onSelectTech(tech)}
                      >
                        <Flex justify="space-between" align="center">
                          <HStack>
                            <ListIcon as={ChevronRightIcon} color="green.500" />
                            <Text fontWeight="medium">{tech.displayName || tech.name}</Text>
                          </HStack>
                          <HStack>
                            <Badge colorScheme={categoryColors[tech.category]}>
                              {tech.category}
                            </Badge>
                            <Badge>Tier {tech.tier}</Badge>
                          </HStack>
                        </Flex>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Text color="gray.500" p={2}>
                    This technology has no prerequisites.
                  </Text>
                )}
              </Collapse>
            </Box>
            
            {/* Unlocks section */}
            <Box>
              <Flex 
                p={2} 
                bg={sectionBgColor} 
                borderRadius="md" 
                justify="space-between" 
                align="center"
                onClick={() => setShowUnlocks(!showUnlocks)}
                cursor="pointer"
                mb={showUnlocks ? 2 : 0}
              >
                <HStack>
                  <UnlockIcon />
                  <Text fontWeight="bold">Unlocks ({unlocks.length})</Text>
                </HStack>
                <IconButton
                  icon={showUnlocks ? <ChevronUpIcon /> : <ChevronDownIcon />}
                  variant="ghost"
                  size="sm"
                  aria-label={showUnlocks ? "Hide unlocks" : "Show unlocks"}
                />
              </Flex>
              
              <Collapse in={showUnlocks} animateOpacity>
                {unlocks.length > 0 ? (
                  <List spacing={2}>
                    {unlocks.map(tech => (
                      <ListItem 
                        key={tech.id}
                        p={2}
                        borderWidth="1px"
                        borderColor={borderColor}
                        borderRadius="md"
                        _hover={{ bg: sectionBgColor }}
                        cursor="pointer"
                        onClick={() => onSelectTech(tech)}
                      >
                        <Flex justify="space-between" align="center">
                          <HStack>
                            <ListIcon as={ChevronRightIcon} color="blue.500" />
                            <Text fontWeight="medium">{tech.displayName || tech.name}</Text>
                          </HStack>
                          <HStack>
                            <Badge colorScheme={categoryColors[tech.category]}>
                              {tech.category}
                            </Badge>
                            <Badge>Tier {tech.tier}</Badge>
                          </HStack>
                        </Flex>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Text color="gray.500" p={2}>
                    This technology doesn't unlock any other technologies.
                  </Text>
                )}
              </Collapse>
            </Box>
            
            {/* Navigation buttons */}
            <Flex justify="space-between" mt={4}>
              <Button 
                leftIcon={<ArrowBackIcon />} 
                variant="outline"
                isDisabled={prerequisites.length === 0}
                onClick={() => prerequisites.length > 0 && onSelectTech(prerequisites[0])}
              >
                Previous
              </Button>
              <Button 
                rightIcon={<ArrowForwardIcon />} 
                variant="outline"
                isDisabled={unlocks.length === 0}
                onClick={() => unlocks.length > 0 && onSelectTech(unlocks[0])}
              >
                Next
              </Button>
            </Flex>
            
            {/* Debug section */}
            <Divider mt={4} mb={2} />
            
            <Accordion allowToggle>
              <AccordionItem border="none">
                <h2>
                  <AccordionButton 
                    _expanded={{ bg: sectionBgColor, color: 'blue.500' }}
                    borderRadius="md"
                  >
                    <Box as="span" flex='1' textAlign='left'>
                      <Text fontWeight="bold">Debug Information</Text>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                </h2>
                <AccordionPanel pb={4}>
                  <VStack align="stretch" spacing={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      If you found overlapping techs, please copy this information:
                    </Text>
                    
                    <DebugInfoContainer>
                      <DebugInfoContent tech={selectedTech} />
                    </DebugInfoContainer>
                  </VStack>
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export default TechDetailsPanel; 