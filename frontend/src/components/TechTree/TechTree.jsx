import { ReactFlowProvider } from 'reactflow';
import { Box, useColorModeValue } from '@chakra-ui/react';
import TechTreeLayout from './TechTreeLayout';

const TechTree = ({ plannedTechs = [], onTogglePlanTech }) => {
  return (
    <Box width="100%" height="100%" display="flex" flexDirection="column">
      <ReactFlowProvider>
        <TechTreeLayout 
          plannedTechs={plannedTechs}
          onTogglePlanTech={onTogglePlanTech}
        />
      </ReactFlowProvider>
    </Box>
  );
};

export default TechTree; 