import { createTheme } from '@mui/material/styles'

export function getAppTheme(mode) {
  const isDark = mode === 'dark'
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? '#90caf9' : '#1a237e',
        light: isDark ? '#e3f2fd' : '#534bae',
        dark: isDark ? '#42a5f5' : '#000051',
      },
      secondary: {
        main: isDark ? '#ce93d8' : '#7b1fa2',
      },
      background: {
        default: isDark ? '#0d1117' : '#fafafa',
        paper: isDark ? '#161b22' : '#ffffff',
      },
    },
    shape: { borderRadius: 8 },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
  })
}
