import { useState, useEffect, useRef, useCallback } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import { Box, Typography, Grid, Paper, TextField, CircularProgress } from '@mui/material'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import {
  SummaryCard,
  SalesChart,
  CancelledChart,
  FinanceSummary,
  CategoryBarChart,
} from '../components/DashboardWidgets'
import { getOrderStats, getOrderDailySales, getOrderDailyCancelled, getOrderStatsByStatus, getOrderStatsAmountByStatus } from '../api/orders'

function getDefaultDateRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  }
}

const Dashboard = () => {
  const defaultRange = getDefaultDateRange()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [layoutWidth, setLayoutWidth] = useState(1200)
  const [startDate, setStartDate] = useState(defaultRange.startDate)
  const [endDate, setEndDate] = useState(defaultRange.endDate)
  const [metrics, setMetrics] = useState({
    soldOrders: null,
    totalOrders: null,
    cancelledOrders: null,
    refundedOrders: null,
    cancelledAmount: null,
  })
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [dailySales, setDailySales] = useState([])
  const [dailySalesLoading, setDailySalesLoading] = useState(true)
  const [dailyCancelled, setDailyCancelled] = useState([])
  const [dailyCancelledLoading, setDailyCancelledLoading] = useState(true)
  const [orderStatsByStatus, setOrderStatsByStatus] = useState(null)
  const [orderStatsByStatusLoading, setOrderStatsByStatusLoading] = useState(true)
  const [amountByStatus, setAmountByStatus] = useState(null)
  const [amountByStatusLoading, setAmountByStatusLoading] = useState(true)
  const containerRef = useRef(null)

  const fetchMetrics = useCallback(async () => {
    if (!startDate || !endDate) return
    setMetricsLoading(true)
    const result = await getOrderStats({ startDate, endDate })
    setMetricsLoading(false)
    if (result.success && result.data) {
      setMetrics({
        soldOrders: result.data.soldOrders ?? 0,
        totalOrders: result.data.totalOrders ?? 0,
        cancelledOrders: result.data.cancelledOrders ?? 0,
        refundedOrders: result.data.refundedOrders ?? 0,
        cancelledAmount: result.data.cancelledAmount ?? 0,
      })
    } else {
      setMetrics({ soldOrders: 0, totalOrders: 0, cancelledOrders: 0, refundedOrders: 0, cancelledAmount: 0 })
    }
  }, [startDate, endDate])

  const fetchDailySales = useCallback(async () => {
    if (!startDate || !endDate) return
    setDailySalesLoading(true)
    const result = await getOrderDailySales({ startDate, endDate })
    setDailySalesLoading(false)
    if (result.success && Array.isArray(result.data)) {
      setDailySales(result.data)
    } else {
      setDailySales([])
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  useEffect(() => {
    fetchDailySales()
  }, [fetchDailySales])

  const fetchDailyCancelled = useCallback(async () => {
    if (!startDate || !endDate) return
    setDailyCancelledLoading(true)
    const result = await getOrderDailyCancelled({ startDate, endDate })
    setDailyCancelledLoading(false)
    if (result.success && Array.isArray(result.data)) {
      setDailyCancelled(result.data)
    } else {
      setDailyCancelled([])
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchDailyCancelled()
  }, [fetchDailyCancelled])

  const fetchOrderStatsByStatus = useCallback(async () => {
    if (!startDate || !endDate) return
    setOrderStatsByStatusLoading(true)
    const result = await getOrderStatsByStatus({ startDate, endDate })
    setOrderStatsByStatusLoading(false)
    if (result.success && result.data) {
      setOrderStatsByStatus(result.data)
    } else {
      setOrderStatsByStatus(null)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchOrderStatsByStatus()
  }, [fetchOrderStatsByStatus])

  const fetchAmountByStatus = useCallback(async () => {
    if (!startDate || !endDate) return
    setAmountByStatusLoading(true)
    const result = await getOrderStatsAmountByStatus({ startDate, endDate })
    setAmountByStatusLoading(false)
    if (result.success && result.data) {
      setAmountByStatus(result.data)
    } else {
      setAmountByStatus(null)
    }
  }, [startDate, endDate])

  useEffect(() => {
    fetchAmountByStatus()
  }, [fetchAmountByStatus])

  // Layout: Total ventas (izq) y Total $ pedidos cancelados (der), luego Estatus pedidos, Ventas por estatus
  const [layout, setLayout] = useState([
    { i: 'sales', x: 0, y: 0, w: 6, h: 4 },
    { i: 'cancelled', x: 6, y: 0, w: 6, h: 4 },
    { i: 'finance', x: 0, y: 5, w: 6, h: 4 },
    { i: 'category', x: 6, y: 5, w: 6, h: 4 },
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

  const totalSoldAmount =
    dailySalesLoading || !Array.isArray(dailySales)
      ? null
      : dailySales.reduce((sum, d) => sum + Number(d.totalAmount ?? d.totalamount ?? 0), 0)
  const totalSoldFormatted =
    totalSoldAmount === null ? '...' : `$${Number(totalSoldAmount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const cancelledAmountFormatted =
    metricsLoading
      ? '...'
      : `-$${Math.abs(Number(metrics.cancelledAmount ?? 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
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
          backgroundColor: 'transparent',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={handleMenuClick} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: 'space-between',
            gap: 2,
            marginBottom: { xs: '24px', sm: '28px', md: '32px' },
          }}
        >
          <Typography
            variant="h5"
            sx={{
              color: 'text.primary',
              fontWeight: 'bold',
              fontSize: { xs: '24px', sm: '28px', md: '32px' },
            }}
          >
            Dashboard
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Fecha inicio"
              type="date"
              size="small"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <TextField
              label="Fecha fin"
              type="date"
              size="small"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
          </Box>
        </Box>

        {/* Summary Cards - filtradas por el rango de fechas */}
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ marginBottom: { xs: '24px', sm: '28px', md: '32px' } }}>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
            <SummaryCard
              title="Total vendido"
              value={totalSoldFormatted}
              color="#ff9800"
              gradientStart="#ffb74d"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
            <SummaryCard
              title="Total $ pedidos cancelados"
              value={cancelledAmountFormatted}
              color="#f44336"
              gradientStart="#ef5350"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
            <SummaryCard
              title="Autopartes vendidas"
              value={metricsLoading ? '...' : String(metrics.soldOrders ?? 0)}
              color="#2196f3"
              gradientStart="#64b5f6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
            <SummaryCard
              title="Pedidos cancelados"
              value={metricsLoading ? '...' : String(metrics.cancelledOrders ?? 0)}
              color="#7b1fa2"
              gradientStart="#ab47bc"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
            <SummaryCard
              title="Pedidos devueltos"
              value={metricsLoading ? '...' : String(metrics.refundedOrders ?? 0)}
              color="#4caf50"
              gradientStart="#66bb6a"
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
              <Box className="drag-handle" sx={{ width: '100%', height: '100%', minHeight: 320 }}>
                <SalesChart
                  data={dailySales}
                  loading={dailySalesLoading}
                  startDate={startDate}
                  endDate={endDate}
                />
              </Box>
            </div>
            <div key="cancelled">
              <Box className="drag-handle" sx={{ width: '100%', height: '100%', minHeight: 320 }}>
                <CancelledChart
                  data={dailyCancelled}
                  loading={dailyCancelledLoading}
                  startDate={startDate}
                  endDate={endDate}
                />
              </Box>
            </div>
            <div key="finance">
              <Box className="drag-handle" sx={{ width: '100%', height: '100%' }}>
                <FinanceSummary
                  data={orderStatsByStatus}
                  loading={orderStatsByStatusLoading}
                />
              </Box>
            </div>
            <div key="category">
              <Box className="drag-handle" sx={{ width: '100%', height: '100%' }}>
                <CategoryBarChart
                  data={amountByStatus}
                  loading={amountByStatusLoading}
                />
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

