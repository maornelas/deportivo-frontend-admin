import { useEffect, useMemo, useState } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import {
  Box,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
} from '@mui/material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { getSalesReport } from '../api/salesReports'
import { useAuth } from '../contexts/AuthContext'

function money(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)
}

function monthBounds(y, m) {
  const start = `${y}-${String(m).padStart(2, '0')}-01`
  const last = new Date(y, m, 0).getDate()
  const end = `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return { start, end }
}

export default function Reporteria() {
  const { canViewPath } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tab, setTab] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const kinds = useMemo(() => ['monthly', 'by_channel', 'by_advisor'], [])

  useEffect(() => {
    const now = new Date()
    const { start, end } = monthBounds(now.getFullYear(), now.getMonth() + 1)
    setStartDate(start)
    setEndDate(end)
  }, [])

  const applyMonth = () => {
    const now = new Date()
    const { start, end } = monthBounds(now.getFullYear(), now.getMonth() + 1)
    setStartDate(start)
    setEndDate(end)
  }

  const run = async () => {
    if (!startDate || !endDate) {
      setError('Selecciona fecha inicio y fin.')
      return
    }
    setError('')
    setLoading(true)
    setData(null)
    const kind = kinds[tab]
    const r = await getSalesReport({ kind, startDate, endDate })
    setLoading(false)
    if (!r.success) {
      setError(r.error || 'Error')
      return
    }
    setData(r.data)
  }

  if (!canViewPath('/reporteria')) {
    return null
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginTop: { xs: 0, md: '70px' },
          pt: { xs: 2, sm: 3, md: 4 },
          pr: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 2, sm: 3, md: 4 },
          pl: { xs: 2, sm: 3, md: `${SIDEBAR_WIDTH + 32}px` },
          backgroundColor: '#fafafa',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
        <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold', mb: 2 }}>
          Reportería
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 800 }}>
          Ventas efectivas (excluye canceladas y reembolsadas). «Por asesor» agrupa pedidos del canal asesor por nombre de
          facturación.
        </Typography>

        <Paper sx={{ mb: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
            <Tab label="Ventas por mes" />
            <Tab label="Por canal (online / asesor)" />
            <Tab label="Por asesor (canal asesor)" />
          </Tabs>
        </Paper>

        <Paper sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            type="date"
            label="Desde"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <TextField
            size="small"
            type="date"
            label="Hasta"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button variant="outlined" onClick={applyMonth}>
            Este mes
          </Button>
          <Button variant="contained" onClick={run} disabled={loading}>
            {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Generar'}
          </Button>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {data && tab === 0 && (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Mes</TableCell>
                  <TableCell align="right">Órdenes</TableCell>
                  <TableCell align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data.monthly || []).map((row) => (
                  <TableRow key={row.yearMonth}>
                    <TableCell>{row.yearMonth}</TableCell>
                    <TableCell align="right">{row.orderCount}</TableCell>
                    <TableCell align="right">{money(row.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {data && tab === 1 && (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Canal</TableCell>
                  <TableCell align="right">Órdenes</TableCell>
                  <TableCell align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data.byChannel || []).map((row) => (
                  <TableRow key={row.salesChannel}>
                    <TableCell>{row.salesChannel === 'advisor' ? 'Asesor' : 'Online'}</TableCell>
                    <TableCell align="right">{row.orderCount}</TableCell>
                    <TableCell align="right">{money(row.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {data && tab === 2 && (
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Cliente / facturación</TableCell>
                  <TableCell align="right">Órdenes</TableCell>
                  <TableCell align="right">Monto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data.byAdvisor || []).map((row) => (
                  <TableRow key={row.label}>
                    <TableCell>{row.label}</TableCell>
                    <TableCell align="right">{row.orderCount}</TableCell>
                    <TableCell align="right">{money(row.totalAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  )
}
