import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'
import { PurchasesProvider } from './contexts/PurchasesContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { AppThemeWrapper } from './AppThemeWrapper'
import AppUpdatePrompt from './components/AppUpdatePrompt'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AppThemeWrapper>
          <AuthProvider>
            <PurchasesProvider>
              <App />
              <AppUpdatePrompt />
            </PurchasesProvider>
          </AuthProvider>
        </AppThemeWrapper>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
