import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#E74C3C', // Primary red from frontend
      dark: '#D92323', // Primary red dark
      light: '#EC7063',
    },
    secondary: {
      main: '#FFD700', // Primary yellow
      dark: '#FFA500', // Primary yellow dark
      light: '#FFE44D',
    },
    success: {
      main: '#8BC34A',
      dark: '#689F38',
      light: '#AED581',
    },
    info: {
      main: '#2196F3',
      dark: '#1976D2',
      light: '#64B5F6',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333', // Gray dark
      secondary: '#555555', // Gray light
    },
    grey: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#E0E0E0', // Gray border
      300: '#e0e0e0',
      400: '#AAAAAA', // Gray lighter
      500: '#555555', // Gray light
      600: '#444444', // Gray medium
      700: '#333333', // Gray dark
      800: '#212121',
      900: '#1a1a1a',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
      },
    },
  },
})

