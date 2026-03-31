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
  FinanceSummary,
  CategoryBarChart,
} from '../components/DashboardWidgets'
import {
  getOrderDailySales,
  getOrderStatsByStatus,
  getOrderStatsAmountByStatus,
} from '../api/orders'
import { getSalesReport } from '../api/salesReports'
import { getExpenseReportSummary, listExpenses } from '../api/expenses'
import { usePurchases } from '../contexts/PurchasesContext'
import { computePurchaseTotal } from '../compras/shared'

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
  const { purchases } = usePurchases()
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
  const [expenseGrandTotal, setExpenseGrandTotal] = useState(null)
  const [expenseSummaryLoading, setExpenseSummaryLoading] = useState(true)
  const [orderStatsByStatus, setOrderStatsByStatus] = useState(null)
  const [orderStatsByStatusLoading, setOrderStatsByStatusLoading] = useState(true)
  const [amountByStatus, setAmountByStatus] = useState(null)
  const [amountByStatusLoading, setAmountByStatusLoading] = useState(true)
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

  const fetchExpenseSummary = useCallback(async () => {
    if (!startDate || !endDate) return
    setExpenseSummaryLoading(true)
    const result = await getExpenseReportSummary({ startDate, endDate })
    setExpenseSummaryLoading(false)
    if (result.success && result.data) {
      setExpenseGrandTotal(Number(result.data.grandTotal ?? 0))
    } else {
      setExpenseGrandTotal(0)
    }
  }, [startDate, endDate])

  const fetchDailyExpenses = useCallback(async () => {
    if (!startDate || !endDate) return
    setDailyExpensesLoading(true)
    const limit = 500
    let page = 1
    const byDate = new Map()
    let totalPages = 1
    try {
      for (;;) {
        const r = await listExpenses({
          startDate,
          endDate,
          page,
          limit,
          sortBy: 'date',
          sortOrder: 'ASC',
        })
        if (!r.success || !r.data?.expenses?.length) break
        totalPages = r.data.totalPages ?? 1
        for (const e of r.data.expenses) {
          const d = (e.expenseDate || '').slice(0, 10)
          if (!d) continue
          byDate.set(d, (byDate.get(d) || 0) + Number(e.totalAmount ?? 0))
        }
        if (page >= totalPages) break
        page += 1
        if (page > 200) break
      }
    } finally {
      setDailyExpensesLoading(false)
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
    fetchExpenseSummary()
  }, [fetchExpenseSummary])

  useEffect(() => {
    fetchDailyExpenses()
  }, [fetchDailyExpenses])

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

  const [layout, setLayout] = useState([
    { i: 'sales', x: 0, y: 0, w: 6, h: 4 },
    { i: 'expenses', x: 6, y: 0, w: 6, h: 4 },
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

  const totalGastosFormatted =
    expenseSummaryLoading || expenseGrandTotal === null
      ? '...'
      : `$${Number(expenseGrandTotal).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const totalComprasAmount = useMemo(() => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T23:59:59.999')
    return purchases.reduce((sum, p) => {
      const pd = new Date(p.purchaseDate)
      if (Number.isNaN(pd.getTime()) || pd < start || pd > end) return sum
      const t = p.total != null ? Number(p.total) : computePurchaseTotal(p.items)
      return sum + t
    }, 0)
  }, [purchases, startDate, endDate])

  /** Compras agregadas por día (misma forma que ventas/gastos: { date, totalAmount }) */
  const dailyPurchasesByDate = useMemo(() => {
    if (!startDate || !endDate) return []
    const start = new Date(startDate + 'T00:00:00')
    const end = new Date(endDate + 'T23:59:59.999')
    const byDate = new Map()
    for (const p of purchases) {
      const pd = new Date(p.purchaseDate)
      if (Number.isNaN(pd.getTime()) || pd < start || pd > end) continue
      const d = (p.purchaseDate || '').slice(0, 10)
      const t = p.total != null ? Number(p.total) : computePurchaseTotal(p.items)
      byDate.set(d, (byDate.get(d) || 0) + t)
    }
    return Array.from(byDate.entries())
      .map(([date, totalAmount]) => ({ date, totalAmount }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [purchases, startDate, endDate])

  const totalComprasFormatted = `$${Number(totalComprasAmount).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
                <Box sx={{ width: '100%', height: '100%', minHeight: 320 }}>
                  <SalesChart
                    dailySales={dailySales}
                    dailyExpenses={dailyExpenses}
                    dailyPurchases={dailyPurchasesByDate}
                    loading={dailySalesLoading || dailyExpensesLoading}
                    startDate={startDate}
                    endDate={endDate}
                  />
                </Box>
              </div>
              <div key="expenses">
                <Box sx={{ width: '100%', height: '100%', minHeight: 320 }}>
                  <ExpensesChart
                    onlineData={dailyChannelOnline}
                    advisorData={dailyChannelAdvisor}
                    loading={channelDailyLoading}
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
