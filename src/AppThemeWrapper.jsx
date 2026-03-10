import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useTheme } from './contexts/ThemeContext'
import { getAppTheme } from './theme'

export function AppThemeWrapper({ children }) {
  const { mode } = useTheme()
  const theme = getAppTheme(mode)
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}
