import { useState, useEffect, useRef } from 'react';
import {
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Box,
  List,
  ListItem,
  Text,
  Flex,
  IconButton,
  useColorModeValue,
  Kbd,
  Spinner
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';

const SearchBar = ({ 
  technologies = [], 
  onSelectTech, 
  placeholder = "Search technologies..." 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const resultsRef = useRef(null);
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const hoverBgColor = useColorModeValue('gray.100', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const selectedBgColor = useColorModeValue('blue.50', 'blue.900');
  
  // Search function
  const performSearch = (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    // Simulate search delay for better UX
    setTimeout(() => {
      const results = technologies.filter(tech => 
        tech.name.toLowerCase().includes(term.toLowerCase()) ||
        tech.description.toLowerCase().includes(term.toLowerCase()) ||
        tech.id.toLowerCase().includes(term.toLowerCase())
      );
      
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  };
  
  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      performSearch(value);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };
  
  // Handle clear button
  const handleClear = () => {
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };
  
  // Handle result selection
  const handleSelectResult = (tech) => {
    setSearchTerm(tech.name);
    setShowResults(false);
    onSelectTech(tech);
  };
  
  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showResults || searchResults.length === 0) return;
    
    // Arrow down
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    }
    
    // Arrow up
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
    }
    
    // Enter
    if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelectResult(searchResults[selectedIndex]);
    }
    
    // Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      setShowResults(false);
    }
  };
  
  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);
  
  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        resultsRef.current && 
        !resultsRef.current.contains(e.target) && 
        inputRef.current && 
        !inputRef.current.contains(e.target)
      ) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <Box position="relative" width="100%">
      <InputGroup size="md">
        <InputLeftElement pointerEvents="none" height="100%">
          {isSearching ? (
            <Spinner size="sm" color="gray.400" />
          ) : (
            <SearchIcon color="gray.400" />
          )}
        </InputLeftElement>
        
        <Input
          ref={inputRef}
          placeholder={placeholder}
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm && setShowResults(true)}
          borderRadius="md"
          bg={bgColor}
          _focus={{ borderColor: 'blue.400' }}
          height="40px"
        />
        
        {searchTerm && (
          <InputRightElement height="100%">
            <IconButton
              aria-label="Clear search"
              icon={<CloseIcon />}
              size="sm"
              variant="ghost"
              onClick={handleClear}
            />
          </InputRightElement>
        )}
      </InputGroup>
      
      {/* Search results dropdown */}
      {showResults && searchResults.length > 0 && (
        <List
          ref={resultsRef}
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          maxH="300px"
          overflowY="auto"
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="md"
          zIndex={10}
        >
          {searchResults.map((tech, index) => (
            <ListItem
              key={tech.id}
              data-index={index}
              px={4}
              py={2}
              cursor="pointer"
              bg={index === selectedIndex ? selectedBgColor : 'transparent'}
              _hover={{ bg: hoverBgColor }}
              onClick={() => handleSelectResult(tech)}
            >
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="bold">{tech.name}</Text>
                  <Text fontSize="sm" noOfLines={1}>{tech.description}</Text>
                </Box>
                <Box>
                  <Text fontSize="xs" color="gray.500">
                    {tech.category} / Tier {tech.tier}
                  </Text>
                </Box>
              </Flex>
            </ListItem>
          ))}
        </List>
      )}
      
      {/* No results message */}
      {showResults && searchTerm && searchResults.length === 0 && !isSearching && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          p={4}
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="md"
          boxShadow="md"
          zIndex={10}
        >
          <Text>No technologies found matching "{searchTerm}"</Text>
        </Box>
      )}
    </Box>
  );
};

export default SearchBar; 