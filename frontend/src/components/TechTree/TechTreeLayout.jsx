import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  GridItem,
  useDisclosure,
  useColorModeValue,
  IconButton,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Flex,
  Heading,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
  Spinner,
  Text
} from '@chakra-ui/react';
import { HamburgerIcon, InfoIcon, WarningIcon, RepeatIcon } from '@chakra-ui/icons';

import TechTreeCanvas from './TechTreeCanvas';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import TechDetailsPanel from './TechDetailsPanel';
import { mockTechnologies } from './mockTechnologies';
import { fetchTechnologies, checkBackendAvailability } from '../../services/api';

const TechTreeLayout = () => {
  // State for selected technology
  const [selectedTech, setSelectedTech] = useState(null);
  
  // State for filtered technologies
  const [filteredTechnologies, setFilteredTechnologies] = useState(mockTechnologies);
  
  // State for real technologies from backend
  const [realTechnologies, setRealTechnologies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(false);
  const [usingMockData, setUsingMockData] = useState(true);
  
  // State for filter drawer
  const { 
    isOpen: isFilterDrawerOpen, 
    onOpen: onFilterDrawerOpen, 
    onClose: onFilterDrawerClose 
  } = useDisclosure();
  
  // State for details drawer
  const { 
    isOpen: isDetailsDrawerOpen, 
    onOpen: onDetailsDrawerOpen, 
    onClose: onDetailsDrawerClose 
  } = useDisclosure();
  
  // State for error alert
  const { 
    isOpen: isErrorAlertOpen, 
    onOpen: onErrorAlertOpen, 
    onClose: onErrorAlertClose 
  } = useDisclosure();
  
  // Toast for notifications
  const toast = useToast();
  
  // Check backend availability
  const checkBackend = useCallback(async () => {
    try {
      const isAvailable = await checkBackendAvailability();
      setBackendAvailable(isAvailable);
      return isAvailable;
    } catch (err) {
      setBackendAvailable(false);
      return false;
    }
  }, []);
  
  // Fetch real technologies from backend
  const fetchRealTechnologies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // First check if backend is available
      const isAvailable = await checkBackend();
      if (!isAvailable) {
        throw new Error('Backend service is not available. Using mock data instead.');
      }
      
      const data = await fetchTechnologies();
      setRealTechnologies(data);
      setUsingMockData(false);
      
      // Show success toast
      toast({
        title: 'Technologies Loaded',
        description: `Successfully loaded ${data.length} technologies from backend`,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      
      // Log to console for debugging
      console.log(`Loaded ${data.length} technologies from backend`);
      
      return data;
    } catch (err) {
      setError(err.message);
      setUsingMockData(true);
      
      // Show error toast but only if it's not a connection error
      if (!err.message.includes('Connection error') && !err.message.includes('Backend service is not available')) {
        toast({
          title: 'Error Loading Technologies',
          description: err.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        });
      }
      
      // Open error alert for connection errors
      if (err.message.includes('Connection error') || err.message.includes('Backend service is not available')) {
        onErrorAlertOpen();
      }
      
      console.error('Failed to load technologies:', err);
      
      // Return mock data as fallback
      return mockTechnologies;
    } finally {
      setIsLoading(false);
    }
  }, [toast, checkBackend, onErrorAlertOpen]);
  
  // Initial data fetch
  useEffect(() => {
    fetchRealTechnologies();
    
    // Set up periodic backend availability check
    const intervalId = setInterval(() => {
      checkBackend();
    }, 30000); // Check every 30 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchRealTechnologies, checkBackend]);
  
  // Update filtered technologies when real technologies change
  useEffect(() => {
    if (realTechnologies.length > 0 && !usingMockData) {
      // If we have real data and we're not using mock data, update filtered technologies
      setFilteredTechnologies(realTechnologies);
      
      // Log to console for debugging
      console.log(`Updated filtered technologies with ${realTechnologies.length} real technologies`);
    }
  }, [realTechnologies, usingMockData]);
  
  // Handle technology selection
  const handleSelectTech = useCallback((tech) => {
    setSelectedTech(tech);
    onDetailsDrawerOpen();
    
    // Always focus on the selected tech, regardless of how it was selected
    // This ensures the view centers on the tech even when selected from the details panel
    const event = new CustomEvent('focusOnTech', { 
      detail: { 
        techId: tech.id,
        // Add a flag to indicate this is from the details panel to avoid showing toast
        fromDetailsPanel: true 
      } 
    });
    window.dispatchEvent(event);
  }, [onDetailsDrawerOpen]);
  
  // Handle filter changes
  const handleFiltersChange = useCallback((filters) => {
    // Determine which dataset to filter - prioritize real data when available
    const dataToFilter = (!usingMockData && realTechnologies.length > 0) 
      ? realTechnologies 
      : mockTechnologies;
    
    // Apply filters to technologies
    const filtered = dataToFilter.filter(tech => {
      // Check category filter
      if (!filters.categories[tech.category]) {
        return false;
      }
      
      // Check area filter
      if (!filters.areas[tech.area]) {
        return false;
      }
      
      // Check tier filter
      if (!filters.tiers[tech.tier]) {
        return false;
      }
      
      return true;
    });
    
    // If showPrerequisites is enabled, add prerequisites of visible techs
    if (filters.showPrerequisites) {
      const visibleTechIds = new Set(filtered.map(tech => tech.id));
      const prerequisiteIds = new Set();
      
      // Collect all prerequisite IDs
      filtered.forEach(tech => {
        tech.prerequisites.forEach(prereqId => {
          if (!visibleTechIds.has(prereqId)) {
            prerequisiteIds.add(prereqId);
          }
        });
      });
      
      // Add prerequisites to filtered list
      if (prerequisiteIds.size > 0) {
        const prerequisites = dataToFilter.filter(tech => 
          prerequisiteIds.has(tech.id)
        );
        
        filtered.push(...prerequisites);
      }
    }
    
    setFilteredTechnologies(filtered);
    
    // Show toast with filter results
    toast({
      title: 'Filters Applied',
      description: `Showing ${filtered.length} of ${dataToFilter.length} technologies`,
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
  }, [toast, usingMockData, realTechnologies]);
  
  // Handle search selection
  const handleSearchSelect = useCallback((tech) => {
    handleSelectTech(tech);
    
    // Emit an event for the TechTreeCanvas to focus on this tech
    const event = new CustomEvent('focusOnTech', { detail: { techId: tech.id } });
    window.dispatchEvent(event);
  }, [handleSelectTech]);
  
  // Handle retry connection
  const handleRetryConnection = useCallback(() => {
    onErrorAlertClose();
    fetchRealTechnologies();
  }, [fetchRealTechnologies, onErrorAlertClose]);
  
  // Prepare debug data for the debug panel
  const debugData = {
    mockTechCount: mockTechnologies.length,
    realTechCount: realTechnologies.length,
    isLoading,
    error: error || 'None',
    selectedTech: selectedTech ? selectedTech.id : 'None',
    filteredTechCount: filteredTechnologies.length,
    backendStatus: error ? 'Error' : isLoading ? 'Loading' : backendAvailable ? 'Connected' : 'Disconnected',
    usingMockData
  };
  
  // Add debug data to window for console access
  useEffect(() => {
    window.debugData = debugData;
    window.realTechnologies = realTechnologies;
  }, [debugData, realTechnologies]);
  
  // Determine which technologies to display in search - prioritize real data when available
  const searchTechnologies = (!usingMockData && realTechnologies.length > 0)
    ? realTechnologies
    : mockTechnologies;
  
  return (
    <Box width="100%" height="100%" position="relative">
      {/* Error Alert */}
      {isErrorAlertOpen && (
        <Alert 
          status="warning" 
          variant="solid" 
          borderRadius="md"
          mb={4}
        >
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>Backend Connection Error</AlertTitle>
            <AlertDescription display="block">
              Unable to connect to the backend server. Using mock data instead.
              {error && <Text mt={1} fontSize="sm">{error}</Text>}
            </AlertDescription>
          </Box>
          <Flex direction="column" gap={2}>
            <Button 
              size="sm" 
              leftIcon={<RepeatIcon />} 
              onClick={handleRetryConnection}
              colorScheme="yellow"
              variant="outline"
            >
              Retry
            </Button>
            <Button 
              size="sm" 
              onClick={onErrorAlertClose}
              variant="ghost"
            >
              Dismiss
            </Button>
          </Flex>
        </Alert>
      )}
      
      {/* Loading Indicator */}
      {isLoading && (
        <Flex 
          position="absolute" 
          top="50%" 
          left="50%" 
          transform="translate(-50%, -50%)"
          bg={useColorModeValue('white', 'gray.800')}
          p={4}
          borderRadius="md"
          boxShadow="lg"
          zIndex={10}
          direction="column"
          align="center"
        >
          <Spinner size="xl" mb={4} />
          <Text>Loading technologies...</Text>
        </Flex>
      )}
      
      {/* Top bar with search */}
      <Flex 
        p={2} 
        bg={useColorModeValue('white', 'gray.800')} 
        borderBottomWidth="1px" 
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        align="center"
        gap={2}
        height="60px"
      >
        <IconButton
          icon={<HamburgerIcon />}
          aria-label="Open filters"
          onClick={onFilterDrawerOpen}
          variant="outline"
          height="40px"
        />
        
        <Box flex="1">
          <SearchBar 
            technologies={searchTechnologies} 
            onSelectTech={handleSearchSelect} 
          />
        </Box>
        
        <IconButton
          icon={<InfoIcon />}
          aria-label="Tech details"
          onClick={onDetailsDrawerOpen}
          variant="outline"
          isDisabled={!selectedTech}
          height="40px"
        />
      </Flex>
      
      {/* Data source indicator */}
      {usingMockData && (
        <Flex 
          bg={useColorModeValue('yellow.100', 'yellow.900')} 
          px={2} 
          py={1} 
          alignItems="center"
          justifyContent="center"
          borderBottomWidth="1px"
          borderColor={useColorModeValue('yellow.200', 'yellow.700')}
        >
          <WarningIcon color={useColorModeValue('yellow.500', 'yellow.300')} mr={2} />
          <Text fontSize="sm" fontWeight="medium">
            Using mock data. Backend connection unavailable.
          </Text>
          <Button 
            size="xs" 
            ml={2} 
            leftIcon={<RepeatIcon />} 
            onClick={handleRetryConnection}
            colorScheme="yellow"
            variant="outline"
          >
            Retry Connection
          </Button>
        </Flex>
      )}
      
      {/* Main content */}
      <Box 
        width="100%" 
        height={usingMockData ? "calc(100% - 90px)" : "calc(100% - 60px)"}
      >
        <TechTreeCanvas 
          technologies={filteredTechnologies}
          onSelectTech={handleSelectTech}
          selectedTech={selectedTech}
          debugData={debugData}
        />
      </Box>
      
      {/* Filter drawer */}
      <Drawer
        isOpen={isFilterDrawerOpen}
        placement="left"
        onClose={onFilterDrawerClose}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">
            Filter Technologies
          </DrawerHeader>
          <DrawerBody>
            <FilterPanel 
              technologies={searchTechnologies} 
              onFiltersChange={handleFiltersChange} 
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      
      {/* Details panel */}
      <TechDetailsPanel
        selectedTech={selectedTech}
        technologies={searchTechnologies}
        onSelectTech={handleSelectTech}
        isOpen={isDetailsDrawerOpen}
        onClose={onDetailsDrawerClose}
      />
    </Box>
  );
};

export default TechTreeLayout; 