import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.tsx'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { getTheme } from './theme/theme'
import './index.css'

function AppWithTheme() {
  const { mode } = useTheme()
  const theme = getTheme(mode)

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </MuiThemeProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppWithTheme />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)

