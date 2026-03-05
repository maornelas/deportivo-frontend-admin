import { useState, useEffect, useRef } from 'react'
import { Box, Typography, Grid } from '@mui/material'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import {
  SummaryCard,
  SalesChart,
  ProductsTable,
  FinanceSummary,
  CategoryBarChart,
  SalesDistributionChart,
  MonthlyTrendChart,
} from '../components/DashboardWidgets'

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [layoutWidth, setLayoutWidth] = useState(1200)
  const containerRef = useRef(null)
  
  // Layout inicial para las gráficas
  const [layout, setLayout] = useState([
    { i: 'sales', x: 0, y: 0, w: 12, h: 4 },
    { i: 'finance', x: 0, y: 5, w: 6, h: 4 },
    { i: 'category', x: 6, y: 5, w: 6, h: 4 },
    { i: 'distribution', x: 0, y: 10, w: 6, h: 4 },
    { i: 'trend', x: 6, y: 10, w: 6, h: 4 },
    { i: 'products', x: 0, y: 15, w: 12, h: 4 },
  ])

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        setLayoutWidth(width)
      }
    }

    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

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
          backgroundColor: 'transparent',
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
          Dashboard
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ marginBottom: { xs: '24px', sm: '28px', md: '32px' } }}>
          <Grid item xs={12} sm={6} md={4}>
            <SummaryCard
              title="Autoparte vendidas"
              value="1.1K"
              change="↓ 13.8%"
              trend="down"
              color="#2196f3"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <SummaryCard
              title="Ventas por internet"
              value="2453"
              change="↑ 13.8%"
              trend="up"
              color="#7b1fa2"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <SummaryCard
              title="Ventas por promotores"
              value="$39K"
              change="↓ 13.8%"
              trend="down"
              color="#4caf50"
            />
          </Grid>
        </Grid>

        {/* Charts and Tables - Draggable */}
        <Box
          ref={containerRef}
          sx={{
            position: 'relative',
            width: '100%',
            padding: '16px 0',
            '& .react-grid-layout': {
              position: 'relative',
            },
            '& .react-grid-item': {
              transition: 'all 200ms ease',
              padding: '8px',
            },
            '& .react-grid-item.cssTransforms': {
              transition: 'all 200ms ease',
            },
            '& .react-grid-item.react-draggable-dragging': {
              transition: 'none',
              zIndex: 3,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            },
            '& .react-grid-item > .react-resizable-handle': {
              position: 'absolute',
              width: '20px',
              height: '20px',
              bottom: 0,
              right: 0,
            },
            '& .react-grid-item > .react-resizable-handle::after': {
              content: '""',
              position: 'absolute',
              right: '3px',
              bottom: '3px',
              width: '5px',
              height: '5px',
              borderRight: '2px solid rgba(0, 0, 0, 0.2)',
              borderBottom: '2px solid rgba(0, 0, 0, 0.2)',
            },
            '& .drag-handle': {
              cursor: 'grab',
              '&:active': {
                cursor: 'grabbing',
              },
            },
          }}
        >
          {layoutWidth > 0 && (
            <GridLayout
              className="layout"
              layout={layout}
              onLayoutChange={(newLayout) => setLayout(newLayout)}
              cols={12}
              rowHeight={100}
              width={layoutWidth}
              isDraggable={true}
              isResizable={true}
              draggableHandle=".drag-handle"
              compactType="vertical"
              preventCollision={false}
              margin={[16, 16]}
            >
            <div key="sales">
              <Box className="drag-handle" sx={{ height: '100%' }}>
                <SalesChart />
              </Box>
            </div>
            <div key="finance">
              <Box className="drag-handle" sx={{ height: '100%' }}>
                <FinanceSummary />
              </Box>
            </div>
            <div key="category">
              <Box className="drag-handle" sx={{ height: '100%' }}>
                <CategoryBarChart />
              </Box>
            </div>
            <div key="distribution">
              <Box className="drag-handle" sx={{ height: '100%' }}>
                <SalesDistributionChart />
              </Box>
            </div>
            <div key="trend">
              <Box className="drag-handle" sx={{ height: '100%' }}>
                <MonthlyTrendChart />
              </Box>
            </div>
            <div key="products">
              <Box className="drag-handle" sx={{ height: '100%' }}>
                <ProductsTable />
              </Box>
            </div>
          </GridLayout>
          )}
        </Box>
      </Box>
    </Box>
  )
}

export default Dashboard

