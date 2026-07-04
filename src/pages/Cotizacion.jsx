import { useState } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import { Box, Typography, Paper } from '@mui/material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import PageTitle from '../components/PageTitle'

const Cotizacion = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginTop: { xs: 0, md: '70px' },
          pt: { xs: '16px', sm: '24px', md: '32px' },
          pr: { xs: '16px', sm: '24px', md: '32px' },
          pb: { xs: '16px', sm: '24px', md: '32px' },
          pl: { xs: '16px', sm: '24px', md: `${SIDEBAR_WIDTH + 32}px` },
          backgroundColor: '#fafafa',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <PageTitle>Cotización</PageTitle>
        <Paper elevation={2} sx={{ padding: { xs: '16px', sm: '24px' }, borderRadius: '12px' }}>
          <Typography variant="body1" sx={{ color: '#757575' }}>
            Esta sección estará disponible próximamente.
          </Typography>
        </Paper>
      </Box>
    </Box>
  )
}

export default Cotizacion
