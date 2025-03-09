import { extendTheme } from '@chakra-ui/react'

// Define the config
const config = {
  initialColorMode: 'system',
  useSystemColorMode: true,
}

// Extend the theme
const theme = extendTheme({ 
  config,
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
})

export default theme 