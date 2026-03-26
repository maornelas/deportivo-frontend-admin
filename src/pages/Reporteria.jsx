import { useEffect, useState } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import {
  Box,
  Paper,
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
import { downloadVentasExcel } from '../utils/ventasReportExcel'

function money(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)
}

function moneyOrDash(n) {
  if (n == null || n === '') return '—'
  const x = Number(n)
  if (Number.isNaN(x)) return '—'
  return money(x)
}

function monthBounds(y, m) {
  const start = `${y}-${String(m).padStart(2, '0')}-01`
  const last = new Date(y, m, 0).getDate()
  const end = `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`
  return { start, end }
}

function ventasReportTitle(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 'VENTAS'
  const y1 = startDateStr.slice(0, 4)
  const m1 = parseInt(startDateStr.slice(5, 7), 10)
  const y2 = endDateStr.slice(0, 4)
  const m2 = parseInt(endDateStr.slice(5, 7), 10)
  if (y1 === y2 && m1 === m2) {
    const d = new Date(parseInt(y1, 10), m1 - 1, 15)
    const mes = d
      .toLocaleDateString('es-MX', { month: 'long' })
      .replace(/^\w/, (c) => c.toUpperCase())
    return `VENTAS ${mes} del ${y1}`
  }
  return `VENTAS ${startDateStr} al ${endDateStr}`
}

function statusCellSx(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'LIBERADO') return { bgcolor: '#C8E6C9', color: '#1b5e20', fontWeight: 700 }
  return { bgcolor: '#FFCDD2', color: '#b71c1c', fontWeight: 700 }
}

export default function Reporteria() {
  const { canViewPath } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  useEffect(() => {
    const now = new Date()
    const { start, end } = monthBounds(now.getFullYear(), now.getMonth() + 1)
    setStartDate(start)
    setEndDate(end)
  }, [])

  const run = async () => {
    if (!startDate || !endDate) {
      setError('Selecciona fecha inicio y fin.')
      return
    }
    setError('')
    setLoading(true)
    setData(null)
    const r = await getSalesReport({ kind: 'ventas_detalle', startDate, endDate })
    setLoading(false)
    if (!r.success) {
      setError(r.error || 'Error')
      return
    }
    setData(r.data)
  }

  const handleDownloadExcel = async () => {
    if (!data) return
    const title = ventasReportTitle(startDate, endDate)
    const filename = `ventas-locales_${startDate}_${endDate}.xlsx`
    await downloadVentasExcel({ title, lines: data.lines || [], filename })
  }

  if (!canViewPath('/reporteria')) {
    return null
  }

  const lines = data?.lines || []

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
          Ventas del canal asesor por línea de pedido (excluye canceladas y reembolsadas). UNIDAD usa primero el vehículo
          por pieza (marca/modelo/años en la línea), luego el del encabezado del pedido y las notas.
        </Typography>

        <Typography variant="h6" sx={{ color: '#424242', fontWeight: 800, mb: 1.5 }}>
          VENTAS
        </Typography>

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
          <Button variant="contained" onClick={run} disabled={loading}>
            {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Consultar'}
          </Button>
          <Button
            variant="outlined"
            onClick={handleDownloadExcel}
            disabled={!data}
            sx={{ ml: 'auto' }}
          >
            Descargar
          </Button>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {data && (
          <TableContainer
            component={Paper}
            sx={{
              overflowX: 'auto',
              border: '1px solid #bdbdbd',
              borderRadius: 0,
            }}
          >
            <Box
              sx={{
                bgcolor: '#f57c00',
                color: '#fff',
                px: 2,
                py: 1,
                fontWeight: 800,
                textAlign: 'center',
              }}
            >
              <Typography variant="body1" sx={{ color: 'inherit', fontWeight: 800, fontSize: '1rem' }}>
                {ventasReportTitle(startDate, endDate)}
              </Typography>
            </Box>
            <Table
              size="small"
              sx={{
                minWidth: 1100,
                borderCollapse: 'collapse',
                '& .MuiTableCell-root': { fontSize: '0.7rem', py: 0.4, px: 0.75, lineHeight: 1.25 },
              }}
            >
              <TableHead>
                <TableRow>
                  {[
                    'SINIESTRO',
                    'UNIDAD',
                    'CONCEPTO',
                    'PROVEEDOR',
                    'MONTO',
                    'MONTO NETO',
                    'SEGURO',
                    'SEGURO NETO',
                    'UTILIDAD',
                    'VENDEDOR',
                    'STATUS',
                  ].map((h) => (
                    <TableCell
                      key={h}
                      sx={{
                        bgcolor: '#ffeb3b',
                        color: '#000',
                        fontWeight: 800,
                        border: '1px solid #9e9e9e',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 3, border: '1px solid #e0e0e0' }}>
                      Sin filas en el rango seleccionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  lines.map((row) => (
                    <TableRow key={`${row.orderId}-${row.lineId}`}>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.siniestro || '—'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.unidad || '—'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', maxWidth: 280 }}>{row.concepto || '—'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.proveedor || '—'}</TableCell>
                      <TableCell align="right" sx={{ border: '1px solid #e0e0e0' }}>
                        {moneyOrDash(row.monto)}
                      </TableCell>
                      <TableCell align="right" sx={{ border: '1px solid #e0e0e0' }}>
                        {moneyOrDash(row.montoNeto)}
                      </TableCell>
                      <TableCell align="right" sx={{ border: '1px solid #e0e0e0' }}>
                        {moneyOrDash(row.seguro)}
                      </TableCell>
                      <TableCell align="right" sx={{ border: '1px solid #e0e0e0' }}>
                        {moneyOrDash(row.seguroNeto)}
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          border: '1px solid #e0e0e0',
                          color: row.utilidad != null && !Number.isNaN(Number(row.utilidad)) ? '#2e7d32' : 'inherit',
                          fontWeight: row.utilidad != null ? 600 : 400,
                        }}
                      >
                        {moneyOrDash(row.utilidad)}
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.vendedor || '—'}</TableCell>
                      <TableCell align="center" sx={{ border: '1px solid #e0e0e0', ...statusCellSx(row.status) }}>
                        {row.status || '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  )
}
