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
  useToast
} from '@chakra-ui/react';
import { HamburgerIcon, InfoIcon } from '@chakra-ui/icons';

import TechTreeCanvas from './TechTreeCanvas';
import SearchBar from './SearchBar';
import FilterPanel from './FilterPanel';
import TechDetailsPanel from './TechDetailsPanel';
import { mockTechnologies } from './mockTechnologies';

const TechTreeLayout = () => {
  // State for selected technology
  const [selectedTech, setSelectedTech] = useState(null);
  
  // State for filtered technologies
  const [filteredTechnologies, setFilteredTechnologies] = useState(mockTechnologies);
  
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
  
  // Toast for notifications
  const toast = useToast();
  
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
    // Apply filters to technologies
    const filtered = mockTechnologies.filter(tech => {
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
        const prerequisites = mockTechnologies.filter(tech => 
          prerequisiteIds.has(tech.id)
        );
        
        filtered.push(...prerequisites);
      }
    }
    
    setFilteredTechnologies(filtered);
    
    // Show toast with filter results
    toast({
      title: 'Filters Applied',
      description: `Showing ${filtered.length} of ${mockTechnologies.length} technologies`,
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });
  }, [toast]);
  
  // Handle search selection
  const handleSearchSelect = useCallback((tech) => {
    handleSelectTech(tech);
    
    // Emit an event for the TechTreeCanvas to focus on this tech
    const event = new CustomEvent('focusOnTech', { detail: { techId: tech.id } });
    window.dispatchEvent(event);
  }, [handleSelectTech]);
  
  return (
    <Box width="100%" height="100%">
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
            technologies={mockTechnologies} 
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
      
      {/* Main content */}
      <Box width="100%" height="calc(100% - 60px)">
        <TechTreeCanvas 
          technologies={filteredTechnologies}
          onSelectTech={handleSelectTech}
          selectedTech={selectedTech}
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
              technologies={mockTechnologies} 
              onFiltersChange={handleFiltersChange} 
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      
      {/* Details panel */}
      <TechDetailsPanel
        selectedTech={selectedTech}
        technologies={mockTechnologies}
        onSelectTech={handleSelectTech}
        isOpen={isDetailsDrawerOpen}
        onClose={onDetailsDrawerClose}
      />
    </Box>
  );
};

export default TechTreeLayout; 