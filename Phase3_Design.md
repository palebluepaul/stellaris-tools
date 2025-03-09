# Phase 3: Interactive Visualization

## Overview
This phase focuses on creating an interactive, performant, and user-friendly visualization of the Stellaris technology tree.

## Requirements
- **Large Tree Support**: Efficiently handle 2,000+ technologies with smooth zooming and panning.
- **Responsive Minimap**: Provide a minimap for easy navigation and orientation within the large tech tree.
- **Interactive Selection**: Selecting a technology highlights its prerequisites and their connections with directional arrows.
- **Search Functionality**: Implement a robust search feature that centers the view on selected search results.
- **Filtering and Redrawing**: Allow filtering of technologies by area, category, and tier, with optional dynamic redrawing to optimize space.
- **UX Best Practices**: Include tooltips, loading indicators, clear error messages, and responsive design.

## Technical Components
- **Visualization Library**: Use React Flow for interactive node-based diagrams with built-in zoom, pan, and selection capabilities.
- **Frontend Framework**: React for component-based UI development.
- **Styling**: Chakra UI for accessible, themeable components and responsive styling.
- **Bundler**: Vite for efficient frontend development and bundling.

## Implementation Details
- **Zoom and Pan**: Leverage React Flow's built-in zoom and pan functionality with customizable controls.
- **Minimap**: Utilize React Flow's MiniMap component with custom styling to match the application theme.
- **Highlighting**: Implement custom node and edge styling to highlight selected technologies and their prerequisites.
- **Search and Filter**: Develop intuitive search and filter components using Chakra UI that dynamically update the visualization.
- **Performance Optimization**: Utilize React Flow's performance optimizations and Chakra UI's efficient rendering.

## Testing
- Unit tests for individual components.
- Integration tests for interactive behaviors.
- Performance tests with large datasets.
- Accessibility and cross-browser compatibility tests.

## UX Considerations
- Ensure intuitive navigation and interaction.
- Provide clear visual feedback for user actions.
- Maintain responsiveness across various devices and screen sizes.
- Implement dark mode support using Chakra UI's theming system.

## Component Architecture

### Core Visualization Components
- **TechTreeCanvas**: Main React Flow container that renders the technology tree.
- **TechNode**: Custom node component for rendering technology nodes with Chakra UI styling.
- **TechEdge**: Custom edge component for connections between technologies.
- **TechMinimap**: Styled React Flow MiniMap component for navigation.
- **TechControls**: Custom zoom and pan controls using Chakra UI components.

### UI Components
- **SearchBar**: Chakra UI input with autocomplete for finding technologies.
- **FilterPanel**: Collapsible panel with filter options using Chakra UI form components.
- **TechDetailsPanel**: Sliding panel showing detailed information about selected technologies.
- **LoadingOverlay**: Chakra UI spinner and overlay for loading states.
- **ErrorDisplay**: Toast notifications for error messages.

## Step-by-Step Implementation Plan

### Stage 1: Basic Setup and React Flow Integration
- Set up React project with Vite and Chakra UI.
- Integrate React Flow and create basic node/edge components.
- Implement basic tech tree layout with mock data.
- **Test**: Verify basic rendering and React Flow integration.

### Stage 2: Custom Node and Edge Components
- Create custom TechNode component with Chakra UI styling.
- Implement custom TechEdge component for connections.
- Add basic interactivity (selection, hover effects).
- **Test**: Ensure components render correctly and respond to interactions.

### Stage 3: Interactive Selection and Highlighting
- Implement node selection logic.
- Create highlighting system for prerequisites and dependencies.
- Add directional indicators to edges.
- **Test**: Validate correct highlighting and interaction responsiveness.

### Stage 4: UI Components and Layout
- Develop search bar and filter panel using Chakra UI.
- Create tech details panel with Chakra UI components.
- Implement responsive layout with hidden trays.
- **Test**: Verify UI components function correctly and layout is responsive.

### Stage 5: Search and Filtering Integration
- Connect search functionality to the visualization.
- Implement filtering logic to show/hide nodes based on criteria.
- Add smooth transitions when focusing on search results.
- **Test**: Verify search accuracy and dynamic filtering effectiveness.

### Stage 6: Performance Optimization
- Implement virtualization for large datasets.
- Optimize React Flow rendering for large numbers of nodes.
- Add lazy loading for tech details and images.
- **Test**: Conduct performance tests with large datasets (2,000+ technologies).

### Stage 7: UX Enhancements
- Add tooltips and loading indicators using Chakra UI.
- Implement dark mode toggle and theming.
- Enhance keyboard navigation and accessibility.
- **Test**: Perform UX and accessibility testing across browsers and devices.

### Stage 8: Final Integration and Testing
- Integrate all components and functionalities.
- Conduct comprehensive integration tests.
- **Test**: Final validation of all interactive behaviors, performance, and UX considerations.

## Mock Data for Development

During early development phases (Stages 1-4), use the following mock data structure to test visualization components before integrating with the real backend:

```javascript
// mockTechnologies.js
export const mockTechnologies = [
  {
    id: "tech_lasers_1",
    name: "Red Lasers",
    tier: 0,
    category: "physics",
    area: "weapons",
    prerequisites: [],
    cost: 100,
    description: "Basic laser technology"
  },
  {
    id: "tech_lasers_2",
    name: "Blue Lasers",
    tier: 1,
    category: "physics",
    area: "weapons",
    prerequisites: ["tech_lasers_1"],
    cost: 250,
    description: "Improved laser technology"
  },
  {
    id: "tech_lasers_3",
    name: "UV Lasers",
    tier: 2,
    category: "physics",
    area: "weapons",
    prerequisites: ["tech_lasers_2"],
    cost: 500,
    description: "Advanced laser technology"
  },
  {
    id: "tech_shields_1",
    name: "Deflectors",
    tier: 0,
    category: "physics",
    area: "shields",
    prerequisites: [],
    cost: 150,
    description: "Basic shield technology"
  },
  {
    id: "tech_shields_2",
    name: "Improved Deflectors",
    tier: 1,
    category: "physics",
    area: "shields",
    prerequisites: ["tech_shields_1"],
    cost: 300,
    description: "Improved shield technology"
  },
  {
    id: "tech_power_plant_1",
    name: "Power Plant I",
    tier: 0,
    category: "engineering",
    area: "power",
    prerequisites: [],
    cost: 100,
    description: "Basic power generation"
  },
  {
    id: "tech_power_plant_2",
    name: "Power Plant II",
    tier: 1,
    category: "engineering",
    area: "power",
    prerequisites: ["tech_power_plant_1"],
    cost: 250,
    description: "Improved power generation"
  },
  {
    id: "tech_battleships",
    name: "Battleships",
    tier: 3,
    category: "engineering",
    area: "ships",
    prerequisites: ["tech_cruisers", "tech_power_plant_2"],
    cost: 1000,
    description: "Massive capital ships"
  },
  {
    id: "tech_cruisers",
    name: "Cruisers",
    tier: 2,
    category: "engineering",
    area: "ships",
    prerequisites: ["tech_destroyers"],
    cost: 500,
    description: "Medium-sized warships"
  },
  {
    id: "tech_destroyers",
    name: "Destroyers",
    tier: 1,
    category: "engineering",
    area: "ships",
    prerequisites: ["tech_corvettes"],
    cost: 250,
    description: "Small warships"
  },
  {
    id: "tech_corvettes",
    name: "Corvettes",
    tier: 0,
    category: "engineering",
    area: "ships",
    prerequisites: [],
    cost: 100,
    description: "Light patrol craft"
  },
  {
    id: "tech_advanced_shields",
    name: "Advanced Shields",
    tier: 3,
    category: "physics",
    area: "shields",
    prerequisites: ["tech_shields_2", "tech_power_plant_2"],
    cost: 800,
    description: "Cutting-edge shield technology with multiple dependencies"
  }
];
```

## Data Transformation for React Flow

React Flow requires data in a specific format with nodes and edges. Here's how to transform the Stellaris tech data:

```javascript
// Transform tech data to React Flow format
const transformTechDataToReactFlow = (technologies) => {
  const nodes = technologies.map(tech => ({
    id: tech.id,
    type: 'techNode', // Custom node type
    position: calculatePosition(tech), // Function to determine position based on tier/category
    data: { ...tech, selected: false, highlighted: false }
  }));

  // Create edges from prerequisites
  const edges = [];
  technologies.forEach(tech => {
    tech.prerequisites.forEach(prereqId => {
      edges.push({
        id: `${prereqId}-${tech.id}`,
        source: prereqId,
        target: tech.id,
        type: 'techEdge', // Custom edge type
        animated: false,
        data: { highlighted: false }
      });
    });
  });

  return { nodes, edges };
};
```

### Backend Integration Points

- **Stage 5**: Begin integration with the real backend API during the Search and Filtering stage.
- Replace the mock data with actual API calls to fetch technology data.
- Implement proper error handling for API requests.
- Consider implementing a caching layer to optimize repeated data fetching.

### Performance Testing with Real Data

- **Stage 6**: Use the complete dataset from the backend for performance testing.
- Ensure the visualization can handle the full technology tree (2,000+ technologies).
- Optimize rendering and interaction based on real-world data patterns.

This structured approach ensures each stage is independently testable, facilitating easier debugging and maintenance.

## Detailed UX Specification with Chakra UI

### Visual Design
- **Dark Mode Aesthetic**: Implement using Chakra UI's color mode system with a consistent dark palette (dark grays, subtle blues, and soft whites).
- **Modern Minimalism**: Utilize Chakra UI's built-in components with subtle shadows and rounded corners.
- **Typography**: Leverage Chakra UI's typography system with a clean, sans-serif font ensuring legibility across zoom levels.

### Layout
- **Full-Window Tech Tree**: Use Chakra UI's Box component to create a full-viewport container for React Flow.
- **Hidden UI Trays**: Implement with Chakra UI's Drawer components:
  - **Left Drawer**: Search and Filter options.
  - **Right Drawer**: Technology Details pane.
  - **Bottom Drawer**: Debug and Performance metrics (collapsible).

### Interaction Elements
- **Edge Icons**: Use Chakra UI's IconButton components with appropriate aria-labels for accessibility.
- **Drawer Behavior**:
  - Implement with Chakra UI's useDisclosure hook for smooth open/close transitions.
  - Configure to close when clicking outside or pressing ESC.

### User Feedback
- **Interactive Highlights**:
  - Implement hover and selection states using Chakra UI's style props (_hover, _active).
  - Use React Flow's selection and highlighting capabilities for connections.
- **Tooltips**:
  - Utilize Chakra UI's Tooltip component for instant tech information on hover.
  - Configure with appropriate delay and fade settings.
- **Loading and Errors**:
  - Use Chakra UI's Spinner component for loading states.
  - Implement error handling with Chakra UI's Alert and Toast components.

### Responsive Minimap
- Integrate React Flow's MiniMap component with custom styling.
- Position in the bottom-right corner using Chakra UI's positioning utilities.
- Style to match the application's theme using Chakra UI's theming system.

### Zoom and Pan Controls
- Customize React Flow's built-in controls with Chakra UI styling.
- Add a zoom level indicator using Chakra UI's Badge component.
- Implement keyboard shortcuts for navigation with clear visual feedback.

### Search and Filtering UX
- Create a search component using Chakra UI's Input and InputGroup.
- Implement filtering with Chakra UI's Checkbox, Radio, and Select components.
- Provide immediate visual feedback using Chakra UI's transitions and animations.

### Accessibility
- Leverage Chakra UI's built-in accessibility features.
- Ensure all interactive elements have appropriate ARIA attributes.
- Implement keyboard navigation with clear focus indicators.
- Test with screen readers to ensure compatibility.

### Responsive Design
- Utilize Chakra UI's responsive style props for adaptive layouts.
- Implement different interaction patterns for touch devices.
- Ensure all UI elements remain accessible at various screen sizes.

## State Management

For managing the application state, we'll use a combination of:

1. **React Flow's Built-in State**: For managing the graph's nodes, edges, and viewport.
2. **React Context**: For sharing state between components (selected node, filter criteria).
3. **Chakra UI's Hooks**: For managing UI state (drawer open/closed, color mode).

```javascript
// Example state management structure
const TechTreeContext = createContext();

function TechTreeProvider({ children }) {
  // Selected technology state
  const [selectedTechId, setSelectedTechId] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    categories: { physics: true, society: true, engineering: true },
    tiers: [0, 1, 2, 3, 4],
    areas: {}
  });
  
  // React Flow instance
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  
  // Tech details drawer
  const detailsDrawer = useDisclosure();
  
  // Filter drawer
  const filterDrawer = useDisclosure();
  
  // Functions for interacting with the tech tree
  const centerOnTech = useCallback((techId) => {
    if (reactFlowInstance && techId) {
      // Find the node
      const node = reactFlowInstance.getNodes().find(n => n.id === techId);
      if (node) {
        // Center view on node with animation
        reactFlowInstance.setCenter(node.position.x, node.position.y, { duration: 800 });
        setSelectedTechId(techId);
        detailsDrawer.onOpen();
      }
    }
  }, [reactFlowInstance, detailsDrawer]);
  
  // Value to be provided by context
  const value = {
    selectedTechId,
    setSelectedTechId,
    filters,
    setFilters,
    reactFlowInstance,
    setReactFlowInstance,
    detailsDrawer,
    filterDrawer,
    centerOnTech
  };
  
  return (
    <TechTreeContext.Provider value={value}>
      {children}
    </TechTreeContext.Provider>
  );
}
```

This design ensures a robust, scalable, and user-friendly interactive visualization for the Stellaris Tech Tree Viewer, leveraging React Flow and Chakra UI for efficient development and excellent user experience.

