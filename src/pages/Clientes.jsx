import { useState } from 'react'
import { Box, Typography, Paper } from '@mui/material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

const Clientes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <Box
        sx={{
          marginLeft: { xs: 0, md: '260px' },
          marginTop: { xs: 0, md: '70px' },
          width: { xs: '100%', md: 'calc(100% - 260px)' },
          padding: { xs: '16px', sm: '24px', md: '32px' },
          backgroundColor: '#fafafa',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={handleMenuClick} />
        <Typography
          variant="h4"
          sx={{
            color: '#424242',
            fontWeight: 'bold',
            marginBottom: { xs: '24px', sm: '28px', md: '32px' },
            fontSize: { xs: '24px', sm: '28px', md: '32px' },
          }}
        >
          Clientes
        </Typography>
        <Paper
          elevation={2}
          sx={{ padding: { xs: '16px', sm: '24px' }, borderRadius: '12px' }}
        >
          <Typography variant="body1" sx={{ color: '#757575' }}>
            Esta sección estará disponible próximamente.
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

export default Clientes


