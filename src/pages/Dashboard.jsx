import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import { Box, Typography, Grid, TextField } from '@mui/material'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import {
  SummaryCard,
  SalesChart,
  ExpensesChart,
  ChannelSalesSummary,
} from '../components/DashboardWidgets'
import { getOrderDailySales } from '../api/orders'
import { getSalesReport } from '../api/salesReports'
import { getExpenseGastosReport } from '../api/expenses'
import { getPurchasesDaily } from '../api/purchases'

/** YYYY-MM-DD en calendario local (misma semántica que <input type="date">). */
function formatYMDLocal(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getDefaultDateRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    startDate: formatYMDLocal(start),
    endDate: formatYMDLocal(now),
  }
}

const Dashboard = () => {
  const defaultRange = getDefaultDateRange()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [layoutWidth, setLayoutWidth] = useState(1200)
  const [startDate, setStartDate] = useState(defaultRange.startDate)
  const [endDate, setEndDate] = useState(defaultRange.endDate)
  const [channelSalesLoading, setChannelSalesLoading] = useState(true)
  const [onlineSalesTotal, setOnlineSalesTotal] = useState(0)
  const [advisorSalesTotal, setAdvisorSalesTotal] = useState(0)
  const [dailySales, setDailySales] = useState([])
  const [dailySalesLoading, setDailySalesLoading] = useState(true)
  const [dailyChannelOnline, setDailyChannelOnline] = useState([])
  const [dailyChannelAdvisor, setDailyChannelAdvisor] = useState([])
  const [channelDailyLoading, setChannelDailyLoading] = useState(true)
  const [dailyExpenses, setDailyExpenses] = useState([])
  const [dailyExpensesLoading, setDailyExpensesLoading] = useState(true)
  const [dailyPurchases, setDailyPurchases] = useState([])
  const [dailyPurchasesLoading, setDailyPurchasesLoading] = useState(true)
  const [expenseGrandTotal, setExpenseGrandTotal] = useState(null)
  const [expenseSummaryLoading, setExpenseSummaryLoading] = useState(true)
  const containerRef = useRef(null)

  const fetchChannelSales = useCallback(async () => {
    if (!startDate || !endDate) return
    setChannelSalesLoading(true)
    const result = await getSalesReport({ kind: 'by_channel', startDate, endDate })
    setChannelSalesLoading(false)
    if (!result.success || !result.data?.byChannel) {
      setOnlineSalesTotal(0)
      setAdvisorSalesTotal(0)
      return
    }
    const rows = result.data.byChannel
    const online = rows.find((r) => r.salesChannel === 'online')
    const advisor = rows.find((r) => r.salesChannel === 'advisor')
    setOnlineSalesTotal(Number(online?.totalAmount ?? 0))
    setAdvisorSalesTotal(Number(advisor?.totalAmount ?? 0))
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

  const fetchChannelDailySales = useCallback(async () => {
    if (!startDate || !endDate) return
    setChannelDailyLoading(true)
    const [rOnline, rAdvisor] = await Promise.all([
      getOrderDailySales({ startDate, endDate, salesChannel: 'online' }),
      getOrderDailySales({ startDate, endDate, salesChannel: 'advisor' }),
    ])
    setChannelDailyLoading(false)
    setDailyChannelOnline(rOnline.success && Array.isArray(rOnline.data) ? rOnline.data : [])
    setDailyChannelAdvisor(rAdvisor.success && Array.isArray(rAdvisor.data) ? rAdvisor.data : [])
  }, [startDate, endDate])

  const fetchDailyPurchases = useCallback(async () => {
    if (!startDate || !endDate) return
    setDailyPurchasesLoading(true)
    const result = await getPurchasesDaily({ startDate, endDate })
    setDailyPurchasesLoading(false)
    if (result.success && Array.isArray(result.data)) {
      setDailyPurchases(result.data)
    } else {
      setDailyPurchases([])
    }
  }, [startDate, endDate])

  /** Mismo criterio que Reportería → GASTOS (totalMontoNeto y netLineSubtotal por línea). */
  const fetchGastosForDashboard = useCallback(async () => {
    if (!startDate || !endDate) return
    setExpenseSummaryLoading(true)
    setDailyExpensesLoading(true)
    const result = await getExpenseGastosReport({ startDate, endDate })
    setExpenseSummaryLoading(false)
    setDailyExpensesLoading(false)
    if (!result.success || !result.data) {
      setExpenseGrandTotal(0)
      setDailyExpenses([])
      return
    }
    setExpenseGrandTotal(Number(result.data.totalMontoNeto ?? 0))
    const byDate = new Map()
    for (const g of result.data.groups || []) {
      for (const line of g.lines || []) {
        const d = (line.expenseDate || '').slice(0, 10)
        if (!d) continue
        const net = Number(line.netLineSubtotal ?? line.lineSubtotal ?? 0)
        byDate.set(d, (byDate.get(d) || 0) + net)
      }
    }
    const series = Array.from(byDate.entries())
      .map(([date, totalAmount]) => ({ date, totalAmount }))
      .sort((a, b) => a.date.localeCompare(b.date))
    setDailyExpenses(series)
  }, [startDate, endDate])

  useEffect(() => {
    fetchChannelSales()
  }, [fetchChannelSales])

  useEffect(() => {
    fetchDailySales()
  }, [fetchDailySales])

  useEffect(() => {
    fetchChannelDailySales()
  }, [fetchChannelDailySales])

  useEffect(() => {
    fetchGastosForDashboard()
  }, [fetchGastosForDashboard])

  useEffect(() => {
    fetchDailyPurchases()
  }, [fetchDailyPurchases])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== 'visible') return
      fetchGastosForDashboard()
      fetchDailyPurchases()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [fetchGastosForDashboard, fetchDailyPurchases])

  const [layout, setLayout] = useState([
    { i: 'sales', x: 0, y: 0, w: 6, h: 5 },
    { i: 'expenses', x: 6, y: 0, w: 6, h: 5 },
    { i: 'finance', x: 0, y: 5, w: 12, h: 5 },
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

  const totalGastosFormatted =
    expenseSummaryLoading || expenseGrandTotal === null
      ? '...'
      : `$${Number(expenseGrandTotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const totalComprasAmount = useMemo(() => {
    if (!Array.isArray(dailyPurchases)) return 0
    return dailyPurchases.reduce((sum, d) => sum + Number(d.totalAmount ?? 0), 0)
  }, [dailyPurchases])

  const totalComprasFormatted =
    dailyPurchasesLoading && dailyPurchases.length === 0
      ? '...'
      : `$${Number(totalComprasAmount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const fmtMoney = (n) =>
    `$${Number(n ?? 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  const onlineSalesFormatted = channelSalesLoading ? '...' : fmtMoney(onlineSalesTotal)
  const advisorSalesFormatted = channelSalesLoading ? '...' : fmtMoney(advisorSalesTotal)

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

        <Grid container spacing={{ xs: 2, sm: 2, md: 2.5 }} sx={{ marginBottom: { xs: '22px', sm: '26px', md: '30px' } }}>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
            <SummaryCard
              title="Total de ventas"
              value={totalSoldFormatted}
              color="#ff9800"
              gradientStart="#ffb74d"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
            <SummaryCard
              title="Total de gastos"
              value={totalGastosFormatted}
              color="#ef6c00"
              gradientStart="#ff9800"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
            <SummaryCard
              title="Total de compras"
              value={totalComprasFormatted}
              color="#2196f3"
              gradientStart="#64b5f6"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
            <SummaryCard
              title="Ventas Online"
              value={onlineSalesFormatted}
              color="#7b1fa2"
              gradientStart="#ab47bc"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex' }}>
            <SummaryCard
              title="Ventas por Asesor"
              value={advisorSalesFormatted}
              color="#4caf50"
              gradientStart="#66bb6a"
            />
          </Grid>
        </Grid>

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
              overflow: 'hidden',
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
              <div key="sales" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Box sx={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
                  <ExpensesChart
                    onlineData={dailyChannelOnline}
                    advisorData={dailyChannelAdvisor}
                    loading={channelDailyLoading}
                    startDate={startDate}
                    endDate={endDate}
                  />
                </Box>
              </div>
              <div key="expenses" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Box sx={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}>
                  <SalesChart
                    dailySales={dailySales}
                    dailyExpenses={dailyExpenses}
                    dailyPurchases={dailyPurchases}
                    loading={dailySalesLoading || dailyExpensesLoading || dailyPurchasesLoading}
                    startDate={startDate}
                    endDate={endDate}
                  />
                </Box>
              </div>
              <div key="finance" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Box
                  className="drag-handle"
                  sx={{ flex: 1, minHeight: 0, width: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <ChannelSalesSummary
                    onlineTotal={onlineSalesTotal}
                    advisorTotal={advisorSalesTotal}
                    loading={channelSalesLoading}
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
