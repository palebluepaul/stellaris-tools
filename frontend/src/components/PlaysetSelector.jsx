import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Flex,
  Heading,
  Text,
  Select,
  useToast,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
  Tooltip,
  IconButton,
  Divider
} from '@chakra-ui/react';
import { RepeatIcon, InfoIcon } from '@chakra-ui/icons';
import { fetchPlaysets, fetchActivePlayset, activatePlayset } from '../services/api';

const PlaysetSelector = ({ onTechReload }) => {
  const [playsets, setPlaysets] = useState([]);
  const [activePlayset, setActivePlayset] = useState(null);
  const [selectedPlaysetId, setSelectedPlaysetId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [error, setError] = useState(null);
  
  const toast = useToast();
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const badgeBgColor = useColorModeValue('green.100', 'green.800');
  const badgeTextColor = useColorModeValue('green.800', 'green.100');
  
  // Load playsets on component mount
  useEffect(() => {
    loadPlaysets();
  }, []);
  
  // Load playsets from the backend
  const loadPlaysets = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch playsets
      const playsetsData = await fetchPlaysets();
      console.log('Loaded playsets:', playsetsData);
      setPlaysets(playsetsData);
      
      // Fetch active playset
      const activePlaysetData = await fetchActivePlayset();
      console.log('Active playset:', activePlaysetData);
      setActivePlayset(activePlaysetData);
      
      // Set the selected playset to the active one
      if (activePlaysetData) {
        setSelectedPlaysetId(activePlaysetData.id);
      } else if (playsetsData.length > 0) {
        setSelectedPlaysetId(playsetsData[0].id);
      }
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error loading playsets',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle playset selection change
  const handlePlaysetChange = (e) => {
    setSelectedPlaysetId(e.target.value);
  };
  
  // Handle playset activation
  const handleActivatePlayset = async () => {
    if (!selectedPlaysetId) {
      toast({
        title: 'No playset selected',
        description: 'Please select a playset to activate',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsReloading(true);
    
    try {
      // Activate the selected playset
      const result = await activatePlayset(selectedPlaysetId);
      
      // Update the active playset with the data returned from the API
      if (result.playset) {
        setActivePlayset(result.playset);
      } else {
        // Fallback to fetching the active playset if not returned
        const updatedActivePlayset = await fetchActivePlayset();
        setActivePlayset(updatedActivePlayset);
      }
      
      // Show success toast
      toast({
        title: 'Playset activated',
        description: `Successfully loaded ${result.stats.totalCount} technologies (${result.stats.baseGameCount} base game, ${result.stats.modCount} from mods)`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Notify parent component to reload technologies
      if (onTechReload) {
        onTechReload();
      }
    } catch (err) {
      setError(err.message);
      toast({
        title: 'Error activating playset',
        description: err.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsReloading(false);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    loadPlaysets();
  };
  
  return (
    <Box 
      p={4} 
      borderWidth="1px" 
      borderRadius="lg" 
      bg={bgColor}
      borderColor={borderColor}
      width="100%"
      mb={4}
    >
      <Flex justifyContent="space-between" alignItems="center" mb={2}>
        <Heading size="md">Mod Playset</Heading>
        <Tooltip label="Refresh playsets">
          <IconButton
            icon={<RepeatIcon />}
            size="sm"
            aria-label="Refresh playsets"
            onClick={handleRefresh}
            isLoading={isLoading}
          />
        </Tooltip>
      </Flex>
      
      {error && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <AlertTitle mr={2}>Error:</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <Flex justifyContent="center" alignItems="center" py={4}>
          <Spinner size="md" mr={3} />
          <Text>Loading playsets...</Text>
        </Flex>
      ) : (
        <>
          {activePlayset && (
            <Box mb={4}>
              <Flex alignItems="center" mb={1}>
                <Text fontWeight="bold" mr={2}>Active Playset:</Text>
                <Badge colorScheme="green" px={2} py={1} borderRadius="md">
                  {activePlayset.name}
                </Badge>
              </Flex>
              <Text fontSize="sm">
                {activePlayset.enabledModCount} enabled mods (of {activePlayset.modCount} total)
              </Text>
            </Box>
          )}
          
          <Divider my={3} />
          
          <Box>
            <Text mb={2} fontWeight="medium">Select a playset to load:</Text>
            <Flex>
              <Select 
                value={selectedPlaysetId} 
                onChange={handlePlaysetChange}
                mr={2}
                isDisabled={isReloading || playsets.length === 0}
              >
                {playsets.length === 0 ? (
                  <option value="">No playsets available</option>
                ) : (
                  playsets.map(playset => (
                    <option key={playset.id} value={playset.id}>
                      {playset.name} ({playset.enabledModCount} enabled mods)
                    </option>
                  ))
                )}
              </Select>
              
              <Button
                colorScheme="blue"
                onClick={handleActivatePlayset}
                isLoading={isReloading}
                loadingText="Loading"
                isDisabled={isLoading || playsets.length === 0 || (activePlayset && selectedPlaysetId === activePlayset.id)}
              >
                Load
              </Button>
            </Flex>
            
            {isReloading && (
              <Text fontSize="sm" mt={2} color="blue.500">
                Loading technologies... This may take a moment.
              </Text>
            )}
          </Box>
          
          {playsets.length === 0 && !isLoading && !error && (
            <Alert status="info" mt={4} borderRadius="md">
              <AlertIcon />
              <AlertDescription>No playsets found. Please create a playset in the Stellaris launcher.</AlertDescription>
            </Alert>
          )}
        </>
      )}
    </Box>
  );
};

export default PlaysetSelector; 