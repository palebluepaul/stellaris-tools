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
- **Visualization Library**: Use D3.js or similar for scalable vector graphics (SVG) rendering.
- **Frontend Framework**: React for component-based UI development.
- **Styling**: Tailwind CSS for responsive and modern styling.
- **Bundler**: Vite for efficient frontend development and bundling.

## Implementation Details
- **Zoom and Pan**: Implement smooth zooming and panning using D3.js zoom behavior.
- **Minimap**: Create a responsive minimap that updates in real-time as the user navigates.
- **Highlighting**: Use SVG paths with directional arrows to clearly indicate technology relationships.
- **Search and Filter**: Develop intuitive search and filter components that dynamically update the visualization.
- **Performance Optimization**: Employ lazy loading, caching, and efficient data structures to maintain performance.

## Testing
- Unit tests for individual components.
- Integration tests for interactive behaviors.
- Performance tests with large datasets.
- Accessibility and cross-browser compatibility tests.

## UX Considerations
- Ensure intuitive navigation and interaction.
- Provide clear visual feedback for user actions.
- Maintain responsiveness across various devices and screen sizes.

## Viewport vs SVG Implementation Guidance

To avoid common pitfalls in viewport and SVG implementation, follow these specific guidelines:

- **Viewport Management**:
  - Clearly separate viewport logic (zooming, panning) from SVG rendering logic.
  - Use D3.js zoom behavior to manage viewport transformations efficiently.
  - Maintain a clear distinction between viewport coordinates and SVG coordinates.

- **SVG Structure**:
  - Structure SVG elements hierarchically, grouping related elements logically.
  - Apply transformations at the group (`<g>`) level rather than individual elements to optimize performance.
  - Ensure SVG elements are responsive and scale appropriately with viewport transformations.

- **Performance Considerations**:
  - Minimize DOM manipulations by batching updates and using virtual DOM techniques where possible.
  - Implement lazy rendering and culling techniques to render only visible elements within the viewport.
  - Use efficient data binding and update patterns provided by D3.js.

- **Debugging and Maintenance**:
  - Clearly document the viewport and SVG coordinate systems and transformations.
  - Provide debugging tools or overlays to visualize viewport boundaries and transformations during development.

Following these guidelines will help maintain a clean, performant, and maintainable implementation of viewport and SVG interactions.

## Step-by-Step Implementation Plan

### Stage 1: Basic SVG Setup and Rendering
- Set up React project with Vite and Tailwind CSS.
- Integrate D3.js for SVG rendering.
- Render basic SVG elements representing technologies.
- **Test**: Verify basic SVG rendering and React-D3 integration.

### Stage 2: Zoom and Pan Functionality
- Implement zoom and pan using D3.js zoom behavior.
- Clearly separate viewport logic from SVG rendering logic.
- **Test**: Ensure smooth zooming and panning interactions.

### Stage 3: Interactive Selection and Highlighting
- Add interactive selection of technologies.
- Highlight selected technology and its prerequisites with directional arrows.
- **Test**: Validate correct highlighting and interaction responsiveness.

### Stage 4: Responsive Minimap
- Develop a responsive minimap component.
- Ensure real-time updates reflecting viewport changes.
- **Test**: Confirm minimap accuracy and responsiveness.

### Stage 5: Search and Filtering
- Implement robust search functionality to center view on selected results.
- Add filtering by area, category, and tier.
- **Test**: Verify search accuracy and dynamic filtering effectiveness.

### Stage 6: Performance Optimization
- Apply lazy loading and culling techniques.
- Optimize DOM manipulations and data binding.
- **Test**: Conduct performance tests with large datasets (2,000+ technologies).

### Stage 7: UX Enhancements
- Add tooltips, loading indicators, and clear error messages.
- Ensure responsive design across devices.
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

This design ensures a robust, scalable, and user-friendly interactive visualization for the Stellaris Tech Tree Viewer. 

## Detailed UX Specification

### Visual Design
- **Dark Mode Aesthetic**: Employ a consistent dark mode palette (dark grays, subtle blues, and soft whites) for enhanced readability and reduced eye strain.
- **Modern Minimalism**: Use subtle gradients, soft shadows, and rounded corners to achieve a sleek, contemporary feel.
- **Typography**: Choose a clean, sans-serif font (e.g., Inter or Roboto) ensuring legibility across various zoom levels.

### Layout
- **Full-Window Tech Tree**: Maximize screen real estate by dedicating the entire viewport to the interactive SVG-based technology tree visualization.
- **Hidden UI Trays**: Keep auxiliary UI elements (search, filters, details pane, debug info) in sliding trays that remain hidden until explicitly accessed by the user via unobtrusive icons at the screen edges.
  - **Left Tray**: Search and Filter options.
  - **Right Tray**: Technology Details pane.
  - **Bottom Tray**: Debug and Performance metrics.

### Interaction Elements
- **Edge Icons**: Discrete, minimalist icons (magnifying glass for search, sliders for filters, information icon for details, bug icon for debug info) placed at the screen edges to toggle respective trays.
- **Tray Behavior**:
  - Smooth sliding animations (ease-in-out, ~200ms) upon opening and closing.
  - Automatic tray collapse when clicking outside or pressing ESC.

### User Feedback
- **Interactive Highlights**:
  - Technology nodes subtly glow or expand slightly on hover to indicate interactivity.
  - Clear directional arrows animate smoothly to show technology prerequisites upon selection.
- **Tooltips**:
  - Appear instantly upon node hover, presenting concise technology details (name, tier, prerequisites).
  - Fade gently after mouse leaves.
- **Loading and Errors**:
  - Small, unobtrusive loading spinners appear near the cursor or in the bottom tray for background operations.
  - Error messages appear briefly in a minimalist overlay at the top-center with actionable recovery suggestions.

### Responsive Minimap
- A compact, draggable minimap sits discreetly in the bottom-right corner.
- The minimap border highlights the currently viewed area, smoothly updating during zooming and panning.
- Clicking or dragging within the minimap rapidly repositions the viewport.

### Zoom and Pan
- Smooth, inertia-driven zooming and panning interactions, ensuring natural and responsive navigation.
- Clear zoom-level indicator subtly presented in the bottom-left corner.

### Search and Filtering UX
- Instant search results displayed dynamically within the left tray, highlighting matched terms clearly.
- Clicking a result immediately pans and zooms the viewport smoothly to the selected technology.
- Filtering options provide immediate visual feedback by fading or temporarily hiding non-relevant nodes.

### Accessibility
- Ensure contrast ratios meet WCAG AA standards.
- Keyboard navigation support:
  - Arrow keys and WASD for pan.
  - Plus/minus or scroll wheel for zoom.
  - Tab navigation through search/filter inputs and interactive elements.

### Responsive Design
- UX gracefully adapts to different resolutions, maintaining usability on tablets and desktop screens.
- Edge icons and trays adjust positioning responsively, maintaining easy access and interaction.

This UX approach prioritizes clarity, responsiveness, and intuitive interaction, creating an engaging and efficient user experience for exploring the technology tree.

