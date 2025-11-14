import { ReactNode, useState } from 'react'
import { Box } from '@mui/material'
import Sidebar from './Sidebar'
import Header from './Header'
import { useTheme } from '../../contexts/ThemeContext'

interface MainLayoutProps {
  children: ReactNode
  onLogout: () => void
}

function MainLayout({ children, onLogout }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { mode } = useTheme()

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar open={sidebarOpen} />
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: mode === 'light' ? '#ffffff' : '#121212',
          transition: 'margin-left 0.3s ease',
        }}
      >
        <Header onLogout={onLogout} onMenuClick={toggleSidebar} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  )
}

export default MainLayout

