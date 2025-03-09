import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Checkbox,
  CheckboxGroup,
  Radio,
  RadioGroup,
  Divider,
  Button,
  Heading,
  Collapse,
  useColorModeValue,
  Flex,
  Badge,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronUpIcon, RepeatIcon } from '@chakra-ui/icons';

const FilterPanel = ({ 
  technologies = [], 
  onFiltersChange,
  initialFilters = null
}) => {
  // Extract unique categories, areas, and tiers from technologies
  const categories = [...new Set(technologies.map(tech => tech.category))];
  const areas = [...new Set(technologies.map(tech => tech.area))];
  const tiers = [...new Set(technologies.map(tech => tech.tier))].sort((a, b) => a - b);
  
  // Default filters
  const defaultFilters = {
    categories: categories.reduce((acc, cat) => ({ ...acc, [cat]: true }), {}),
    areas: areas.reduce((acc, area) => ({ ...acc, [area]: true }), {}),
    tiers: tiers.reduce((acc, tier) => ({ ...acc, [tier]: true }), {}),
    showPrerequisites: true
  };
  
  // State for filters
  const [filters, setFilters] = useState(initialFilters || defaultFilters);
  const [isOpen, setIsOpen] = useState(true);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  
  // Colors
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const headingColor = useColorModeValue('gray.700', 'gray.200');
  
  // Calculate active filters count
  useEffect(() => {
    let count = 0;
    
    // Count unchecked categories
    const totalCategories = categories.length;
    const selectedCategories = Object.values(filters.categories).filter(Boolean).length;
    if (selectedCategories < totalCategories) {
      count += totalCategories - selectedCategories;
    }
    
    // Count unchecked areas
    const totalAreas = areas.length;
    const selectedAreas = Object.values(filters.areas).filter(Boolean).length;
    if (selectedAreas < totalAreas) {
      count += totalAreas - selectedAreas;
    }
    
    // Count unchecked tiers
    const totalTiers = tiers.length;
    const selectedTiers = Object.values(filters.tiers).filter(Boolean).length;
    if (selectedTiers < totalTiers) {
      count += totalTiers - selectedTiers;
    }
    
    // Count prerequisites filter if disabled
    if (!filters.showPrerequisites) {
      count += 1;
    }
    
    setActiveFiltersCount(count);
  }, [filters, categories, areas, tiers]);
  
  // Handle filter changes
  const handleCategoryChange = (category, isChecked) => {
    const newFilters = {
      ...filters,
      categories: {
        ...filters.categories,
        [category]: isChecked
      }
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };
  
  const handleAreaChange = (area, isChecked) => {
    const newFilters = {
      ...filters,
      areas: {
        ...filters.areas,
        [area]: isChecked
      }
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };
  
  const handleTierChange = (tier, isChecked) => {
    const newFilters = {
      ...filters,
      tiers: {
        ...filters.tiers,
        [tier]: isChecked
      }
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };
  
  const handlePrerequisitesChange = (isChecked) => {
    const newFilters = {
      ...filters,
      showPrerequisites: isChecked
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };
  
  // Reset filters to default
  const resetFilters = () => {
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };
  
  // Toggle all filters of a type
  const toggleAllCategories = (value) => {
    const newCategories = {};
    categories.forEach(cat => {
      newCategories[cat] = value;
    });
    
    const newFilters = {
      ...filters,
      categories: newCategories
    };
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };
  
  const toggleAllAreas = (value) => {
    const newAreas = {};
    areas.forEach(area => {
      newAreas[area] = value;
    });
    
    const newFilters = {
      ...filters,
      areas: newAreas
    };
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };
  
  const toggleAllTiers = (value) => {
    const newTiers = {};
    tiers.forEach(tier => {
      newTiers[tier] = value;
    });
    
    const newFilters = {
      ...filters,
      tiers: newTiers
    };
    
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };
  
  // Category color mapping
  const categoryColors = {
    physics: 'blue',
    society: 'green',
    engineering: 'orange'
  };
  
  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      bg={bgColor}
      overflow="hidden"
    >
      {/* Header */}
      <Flex 
        p={3} 
        justify="space-between" 
        align="center" 
        onClick={() => setIsOpen(!isOpen)}
        cursor="pointer"
        bg={useColorModeValue('gray.50', 'gray.700')}
        _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
      >
        <HStack>
          <Heading size="sm" color={headingColor}>
            Filters
          </Heading>
          {activeFiltersCount > 0 && (
            <Badge colorScheme="blue" borderRadius="full">
              {activeFiltersCount}
            </Badge>
          )}
        </HStack>
        <IconButton
          icon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
          variant="ghost"
          size="sm"
          aria-label={isOpen ? "Collapse filters" : "Expand filters"}
        />
      </Flex>
      
      {/* Filter content */}
      <Collapse in={isOpen} animateOpacity>
        <Box p={4}>
          <VStack align="stretch" spacing={4}>
            {/* Categories */}
            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="bold">Categories</Text>
                <HStack spacing={1}>
                  <Button size="xs" onClick={() => toggleAllCategories(true)}>All</Button>
                  <Button size="xs" onClick={() => toggleAllCategories(false)}>None</Button>
                </HStack>
              </Flex>
              <HStack spacing={4} wrap="wrap">
                {categories.map(category => (
                  <Checkbox
                    key={category}
                    isChecked={filters.categories[category]}
                    onChange={(e) => handleCategoryChange(category, e.target.checked)}
                    colorScheme={categoryColors[category] || 'gray'}
                  >
                    <Text textTransform="capitalize">{category}</Text>
                  </Checkbox>
                ))}
              </HStack>
            </Box>
            
            <Divider />
            
            {/* Areas */}
            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="bold">Areas</Text>
                <HStack spacing={1}>
                  <Button size="xs" onClick={() => toggleAllAreas(true)}>All</Button>
                  <Button size="xs" onClick={() => toggleAllAreas(false)}>None</Button>
                </HStack>
              </Flex>
              <Flex wrap="wrap" gap={2}>
                {areas.map(area => (
                  <Checkbox
                    key={area}
                    isChecked={filters.areas[area]}
                    onChange={(e) => handleAreaChange(area, e.target.checked)}
                  >
                    <Text textTransform="capitalize">{area}</Text>
                  </Checkbox>
                ))}
              </Flex>
            </Box>
            
            <Divider />
            
            {/* Tiers */}
            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontWeight="bold">Tiers</Text>
                <HStack spacing={1}>
                  <Button size="xs" onClick={() => toggleAllTiers(true)}>All</Button>
                  <Button size="xs" onClick={() => toggleAllTiers(false)}>None</Button>
                </HStack>
              </Flex>
              <Flex wrap="wrap" gap={2}>
                {tiers.map(tier => (
                  <Checkbox
                    key={tier}
                    isChecked={filters.tiers[tier]}
                    onChange={(e) => handleTierChange(tier, e.target.checked)}
                  >
                    Tier {tier}
                  </Checkbox>
                ))}
              </Flex>
            </Box>
            
            <Divider />
            
            {/* Additional options */}
            <Box>
              <Text fontWeight="bold" mb={2}>Options</Text>
              <Checkbox
                isChecked={filters.showPrerequisites}
                onChange={(e) => handlePrerequisitesChange(e.target.checked)}
              >
                Show prerequisites when filtering
              </Checkbox>
            </Box>
            
            {/* Reset button */}
            <Flex justify="flex-end">
              <Tooltip label="Reset all filters to default">
                <Button
                  leftIcon={<RepeatIcon />}
                  onClick={resetFilters}
                  size="sm"
                  variant="outline"
                  colorScheme="blue"
                >
                  Reset Filters
                </Button>
              </Tooltip>
            </Flex>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default FilterPanel; 