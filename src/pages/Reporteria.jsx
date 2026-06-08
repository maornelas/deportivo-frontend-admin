import { useCallback, useEffect, useMemo, useState } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Tab,
  Tabs,
} from '@mui/material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { SummaryCard } from '../components/DashboardWidgets'
import { getSalesReport, getVentasAsesorNames, getIncomeStatement } from '../api/salesReports'
import { getExpenseGastosReport, downloadExpenseReportCsv } from '../api/expenses'
import { useAuth } from '../contexts/AuthContext'
import { downloadVentasExcel } from '../utils/ventasReportExcel'
import { downloadReporteriaAllExcel } from '../utils/reporteriaAllExcel'
import { buildVentasTotals, enrichVentasLines, resolveLineUtilidad } from '../utils/ventasReportTotals'

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

function gastosReportTitle(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 'GASTOS'
  const y1 = startDateStr.slice(0, 4)
  const m1 = parseInt(startDateStr.slice(5, 7), 10)
  const y2 = endDateStr.slice(0, 4)
  const m2 = parseInt(endDateStr.slice(5, 7), 10)
  if (y1 === y2 && m1 === m2) {
    const d = new Date(parseInt(y1, 10), m1 - 1, 15)
    const mes = d
      .toLocaleDateString('es-MX', { month: 'long' })
      .replace(/^\w/, (c) => c.toUpperCase())
    return `GASTOS ${mes} ${y1}`
  }
  return `GASTOS ${startDateStr} al ${endDateStr}`
}

function ventasReportTitle(startDateStr, endDateStr, scope) {
  if (!startDateStr || !endDateStr) return 'VENTAS'
  const y1 = startDateStr.slice(0, 4)
  const m1 = parseInt(startDateStr.slice(5, 7), 10)
  const y2 = endDateStr.slice(0, 4)
  const m2 = parseInt(endDateStr.slice(5, 7), 10)
  const scopeLabel = scope === 'foraneo' ? 'FORÁNEAS' : 'LOCALES'
  if (y1 === y2 && m1 === m2) {
    const d = new Date(parseInt(y1, 10), m1 - 1, 15)
    const mes = d
      .toLocaleDateString('es-MX', { month: 'long' })
      .replace(/^\w/, (c) => c.toUpperCase())
    return `VENTAS ${scopeLabel} ${mes} del ${y1}`
  }
  return `VENTAS ${scopeLabel} ${startDateStr} al ${endDateStr}`
}

/** Título tipo plantilla: COMISIONES MANY MARZO DEL 2026 */
function comisionesReportTitle(startDateStr, endDateStr, asesorNombre) {
  if (!startDateStr || !endDateStr) return 'COMISIONES'
  const nombre = (asesorNombre || '').trim().toUpperCase() || 'ASESOR'
  const y1 = startDateStr.slice(0, 4)
  const m1 = parseInt(startDateStr.slice(5, 7), 10)
  const y2 = endDateStr.slice(0, 4)
  const m2 = parseInt(endDateStr.slice(5, 7), 10)
  if (y1 === y2 && m1 === m2) {
    const d = new Date(parseInt(y1, 10), m1 - 1, 15)
    const mes = d
      .toLocaleDateString('es-MX', { month: 'long' })
      .replace(/^\w/, (c) => c.toUpperCase())
    return `COMISIONES ${nombre} ${mes} DEL ${y1}`
  }
  return `COMISIONES ${nombre} ${startDateStr} AL ${endDateStr}`
}

const VENTAS_INDICATOR_FIELDS = [
  { key: 'monto', label: 'Compra', color: '#ff9800', gradientStart: '#ffb74d' },
  { key: 'montoNeto', label: 'Compra + IVA', color: '#ef6c00', gradientStart: '#ff9800' },
  { key: 'seguro', label: 'Seguro', color: '#2196f3', gradientStart: '#64b5f6' },
  { key: 'seguroNeto', label: 'Seguro neto', color: '#7b1fa2', gradientStart: '#ab47bc' },
  { key: 'utilidad', label: 'Utilidad', color: '#2e7d32', gradientStart: '#66bb6a' },
  { key: 'comision', label: 'Comisión (2.5%)', color: '#00897b', gradientStart: '#4db6ac' },
]

function VentasReportIndicators({ totals }) {
  if (!totals) return null
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: { xs: 'wrap', md: 'nowrap' },
        gap: { xs: 2, sm: 2.5, md: 3.5 },
        mb: 2,
        width: '100%',
        overflowX: { md: 'auto' },
      }}
    >
      {VENTAS_INDICATOR_FIELDS.map(({ key, label, color, gradientStart }) => (
        <Box
          key={key}
          sx={{
            flex: { xs: '1 1 calc(50% - 8px)', sm: '1 1 calc(33.333% - 12px)', md: '1 1 0' },
            minWidth: { xs: 130, md: 110 },
          }}
        >
          <SummaryCard compact title={label} value={money(totals[key])} color={color} gradientStart={gradientStart} />
        </Box>
      ))}
    </Box>
  )
}

function utilidadCellSx(utilidad) {
  if (utilidad == null || utilidad === '') return { color: 'inherit', fontWeight: 400 }
  const u = Number(utilidad)
  if (Number.isNaN(u)) return { color: 'inherit', fontWeight: 400 }
  if (u >= 0) return { color: '#2e7d32', fontWeight: 600 }
  return { color: '#c62828', fontWeight: 600 }
}

function statusCellSx(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'LIBERADO') return { bgcolor: '#C8E6C9', color: '#1b5e20', fontWeight: 700 }
  if (s === 'CANCELADA') return { bgcolor: '#FFCDD2', color: '#b71c1c', fontWeight: 700 }
  return { bgcolor: '#FFCDD2', color: '#b71c1c', fontWeight: 700 }
}

export default function Reporteria() {
  const { canViewPath } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reportTab, setReportTab] = useState('ventas_locales')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [ventasLoading, setVentasLoading] = useState(false)
  const [error, setError] = useState('')
  const [ventasLocalesData, setVentasLocalesData] = useState(null)
  const [ventasForaneasData, setVentasForaneasData] = useState(null)
  const [comisionesData, setComisionesData] = useState(null)
  const [incomeLoading, setIncomeLoading] = useState(false)
  const [incomeError, setIncomeError] = useState('')
  const [incomeData, setIncomeData] = useState(null)
  const [advisorNames, setAdvisorNames] = useState([])
  const [loadingAdvisors, setLoadingAdvisors] = useState(false)
  const [selectedAdvisor, setSelectedAdvisor] = useState('')
  const [gastosLoading, setGastosLoading] = useState(false)
  const [gastosError, setGastosError] = useState('')
  const [gastosData, setGastosData] = useState(null)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadAllError, setDownloadAllError] = useState('')

  useEffect(() => {
    const now = new Date()
    const { start, end } = monthBounds(now.getFullYear(), now.getMonth() + 1)
    setStartDate(start)
    setEndDate(end)
  }, [])

  const loadAdvisorNames = useCallback(async () => {
    if (!startDate || !endDate) {
      setAdvisorNames([])
      return
    }
    setLoadingAdvisors(true)
    const r = await getVentasAsesorNames({ startDate, endDate })
    setLoadingAdvisors(false)
    if (!r.success || !r.data?.advisorNames) {
      setAdvisorNames([])
      return
    }
    setAdvisorNames(Array.isArray(r.data.advisorNames) ? r.data.advisorNames : [])
  }, [startDate, endDate])

  useEffect(() => {
    loadAdvisorNames()
  }, [loadAdvisorNames])

  useEffect(() => {
    if (!selectedAdvisor) return
    if (!advisorNames.includes(selectedAdvisor)) setSelectedAdvisor('')
  }, [advisorNames, selectedAdvisor])

  const isVentasLocales = reportTab === 'ventas_locales'
  const isVentasForaneas = reportTab === 'ventas_foraneas'
  const isComisiones = reportTab === 'comisiones'
  const isVentasTab = isVentasLocales || isVentasForaneas
  const showsVentasTable = isVentasTab || isComisiones
  const ventasScope = isVentasForaneas ? 'foraneo' : 'local'
  const currentVentasData = isComisiones
    ? comisionesData
    : isVentasForaneas
      ? ventasForaneasData
      : ventasLocalesData

  const runVentas = async () => {
    if (!startDate || !endDate) {
      setError('Selecciona fecha inicio y fin.')
      return
    }
    setError('')
    setVentasLoading(true)
    if (isVentasLocales) setVentasLocalesData(null)
    else setVentasForaneasData(null)
    const r = await getSalesReport({
      kind: 'ventas_detalle',
      startDate,
      endDate,
      salesChannel: ventasScope === 'foraneo' ? 'foraneo' : 'local',
    })
    setVentasLoading(false)
    if (!r.success) {
      setError(r.error || 'Error')
      return
    }
    if (isVentasLocales) setVentasLocalesData(r.data)
    else setVentasForaneasData(r.data)
  }

  const runComisiones = async () => {
    if (!startDate || !endDate) {
      setError('Selecciona fecha inicio y fin.')
      return
    }
    if (!selectedAdvisor.trim()) {
      setError('Selecciona un asesor para generar el reporte de comisiones.')
      return
    }
    setError('')
    setVentasLoading(true)
    setComisionesData(null)
    const r = await getSalesReport({
      kind: 'ventas_detalle',
      startDate,
      endDate,
      advisorName: selectedAdvisor.trim(),
    })
    setVentasLoading(false)
    if (!r.success) {
      setError(r.error || 'Error')
      return
    }
    setComisionesData(r.data)
  }

  const runIncome = async () => {
    if (!startDate || !endDate) {
      setIncomeError('Selecciona fecha inicio y fin.')
      return
    }
    setIncomeError('')
    setIncomeLoading(true)
    setIncomeData(null)
    const r = await getIncomeStatement({ startDate, endDate })
    setIncomeLoading(false)
    if (!r.success) {
      setIncomeError(r.error || 'Error')
      return
    }
    setIncomeData(r.data)
  }

  const runGastos = async () => {
    if (!startDate || !endDate) {
      setGastosError('Selecciona fecha inicio y fin.')
      return
    }
    setGastosError('')
    setGastosLoading(true)
    setGastosData(null)
    const r = await getExpenseGastosReport({ startDate, endDate })
    setGastosLoading(false)
    if (!r.success) {
      setGastosError(r.error || 'Error')
      return
    }
    setGastosData(r.data)
  }

  const handleDownloadGastosCsv = async () => {
    if (!startDate || !endDate) return
    const r = await downloadExpenseReportCsv({ startDate, endDate }, 'csv')
    if (!r.success) setGastosError(r.error || 'Error al descargar CSV')
  }

  const ventasTabTotals = useMemo(() => {
    if (!isVentasTab) return null
    const rows =
      reportTab === 'ventas_locales'
        ? ventasLocalesData?.lines || []
        : ventasForaneasData?.lines || []
    return buildVentasTotals(rows)
  }, [isVentasTab, reportTab, ventasLocalesData, ventasForaneasData])

  const comisionesTotals = useMemo(() => {
    if (!isComisiones) return null
    return buildVentasTotals(comisionesData?.lines || [])
  }, [isComisiones, comisionesData])

  const reportTotals = isComisiones ? comisionesTotals : ventasTabTotals

  const lines = enrichVentasLines(currentVentasData?.lines || [])

  const handleDownloadExcel = async () => {
    if (!currentVentasData) return
    if (isComisiones) {
      const advSlug = `_${selectedAdvisor.trim().replace(/\s+/g, '_')}`
      const title = comisionesReportTitle(startDate, endDate, selectedAdvisor)
      const filename = `comisiones${advSlug}_${startDate}_${endDate}.xlsx`
      await downloadVentasExcel({
        title,
        lines,
        filename,
        totals: comisionesTotals,
      })
      return
    }
    const title = ventasReportTitle(startDate, endDate, ventasScope)
    const slug = ventasScope === 'foraneo' ? 'ventas-foraneas' : 'ventas-locales'
    const filename = `${slug}_${startDate}_${endDate}.xlsx`
    await downloadVentasExcel({
      title,
      lines,
      filename,
      totals: isVentasTab ? ventasTabTotals : null,
    })
  }

  const handleDownloadAll = async () => {
    if (!startDate || !endDate) {
      setDownloadAllError('Selecciona fecha inicio y fin.')
      return
    }
    setDownloadAllError('')
    setDownloadingAll(true)
    const result = await downloadReporteriaAllExcel({ startDate, endDate })
    setDownloadingAll(false)
    if (!result.success) {
      setDownloadAllError(result.error || 'Error al descargar el concentrado')
    }
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

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
            mb: 2,
          }}
        >
          <Tabs
            value={reportTab}
            onChange={(_, v) => setReportTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', flex: 1, minWidth: 0, '& .MuiTab-root': { minHeight: 44 } }}
          >
            <Tab label="Ventas locales" value="ventas_locales" />
            <Tab label="Ventas foráneas" value="ventas_foraneas" />
            <Tab label="Comisiones" value="comisiones" />
            <Tab label="Gastos" value="gastos" />
            <Tab label="Estado de resultados" value="income" />
          </Tabs>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => void handleDownloadAll()}
            disabled={downloadingAll || !startDate || !endDate}
            sx={{ flexShrink: 0, whiteSpace: 'nowrap' }}
          >
            {downloadingAll ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Descargar todo'}
          </Button>
        </Box>

        {downloadAllError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDownloadAllError('')}>
            {downloadAllError}
          </Alert>
        )}

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
          {isComisiones && (
            <FormControl size="small" sx={{ minWidth: 280 }}>
              <InputLabel id="reporteria-comisiones-asesor">Asesor</InputLabel>
              <Select
                labelId="reporteria-comisiones-asesor"
                label="Asesor"
                value={selectedAdvisor}
                onChange={(e) => setSelectedAdvisor(e.target.value)}
                disabled={loadingAdvisors}
              >
                <MenuItem value="">
                  <em>Seleccionar asesor…</em>
                </MenuItem>
                {advisorNames.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {(isVentasTab || isComisiones) && (
            <Button
              variant="contained"
              onClick={isComisiones ? runComisiones : runVentas}
              disabled={ventasLoading}
            >
              {ventasLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Consultar'}
            </Button>
          )}
          {(isVentasTab || isComisiones) && (
            <Button
              variant="outlined"
              onClick={handleDownloadExcel}
              disabled={!currentVentasData}
              sx={{ ml: 'auto' }}
            >
              Descargar
            </Button>
          )}
          {reportTab === 'income' && (
            <Button variant="contained" onClick={runIncome} disabled={incomeLoading}>
              {incomeLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Consultar'}
            </Button>
          )}
          {reportTab === 'gastos' && (
            <Button variant="contained" onClick={runGastos} disabled={gastosLoading}>
              {gastosLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Consultar'}
            </Button>
          )}
          {reportTab === 'gastos' && (
            <Button variant="outlined" onClick={handleDownloadGastosCsv} sx={{ ml: 'auto' }}>
              Descargar CSV
            </Button>
          )}
        </Paper>

        {(isVentasTab || isComisiones) && <VentasReportIndicators totals={reportTotals} />}

        {(isVentasTab || isComisiones) && error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {reportTab === 'income' && incomeError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setIncomeError('')}>
            {incomeError}
          </Alert>
        )}
        {reportTab === 'gastos' && gastosError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setGastosError('')}>
            {gastosError}
          </Alert>
        )}

        {showsVentasTable && currentVentasData && (
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
                {isComisiones
                  ? comisionesReportTitle(startDate, endDate, selectedAdvisor)
                  : ventasReportTitle(startDate, endDate, ventasScope)}
              </Typography>
            </Box>
            <Table
              size="small"
              sx={{
                minWidth: 1200,
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
                    'CANAL DE VENTA',
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
                    <TableCell colSpan={12} align="center" sx={{ py: 3, border: '1px solid #e0e0e0' }}>
                      Sin filas en el rango seleccionado.
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {lines.map((row) => {
                      const lineUtilidad = resolveLineUtilidad(row.monto, row.seguro)
                      return (
                      <TableRow key={`${row.orderId}-${row.lineId}`}>
                        <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.siniestro || '—'}</TableCell>
                        <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.unidad || '—'}</TableCell>
                        <TableCell sx={{ border: '1px solid #e0e0e0', maxWidth: 280 }}>{row.concepto || '—'}</TableCell>
                        <TableCell sx={{ border: '1px solid #e0e0e0', whiteSpace: 'nowrap' }}>
                          {row.canalVenta || '—'}
                        </TableCell>
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
                            ...utilidadCellSx(lineUtilidad),
                          }}
                        >
                          {moneyOrDash(lineUtilidad)}
                        </TableCell>
                        <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.vendedor || '—'}</TableCell>
                        <TableCell align="center" sx={{ border: '1px solid #e0e0e0', ...statusCellSx(row.status) }}>
                          {row.status || '—'}
                        </TableCell>
                      </TableRow>
                    )})}
                    {(isVentasTab || isComisiones) && reportTotals && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          align="right"
                          sx={{ border: '1px solid #9e9e9e', fontWeight: 800, bgcolor: '#ce93d8' }}
                        >
                          TOTAL
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ border: '1px solid #9e9e9e', fontWeight: 800, bgcolor: '#ce93d8' }}
                        >
                          {money(reportTotals.monto)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ border: '1px solid #9e9e9e', fontWeight: 800, bgcolor: '#ce93d8' }}
                        >
                          {money(reportTotals.montoNeto)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ border: '1px solid #9e9e9e', fontWeight: 800, bgcolor: '#ce93d8' }}
                        >
                          {money(reportTotals.seguro)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{ border: '1px solid #9e9e9e', fontWeight: 800, bgcolor: '#ce93d8' }}
                        >
                          {money(reportTotals.seguroNeto)}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            border: '1px solid #9e9e9e',
                            fontWeight: 800,
                            bgcolor: '#ce93d8',
                            ...utilidadCellSx(reportTotals.utilidad),
                          }}
                        >
                          {money(reportTotals.utilidad)}
                        </TableCell>
                        <TableCell colSpan={2} sx={{ border: '1px solid #9e9e9e', bgcolor: '#ce93d8' }} />
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {reportTab === 'income' && (
          <TableContainer
            component={Paper}
            sx={{
              maxWidth: 640,
              border: '2px solid #000',
              borderRadius: 0,
              mb: 3,
              boxShadow: 1,
            }}
          >
            <Box sx={{ px: 2, pt: 2, pb: 1 }}>
              <Typography sx={{ color: '#6a1b9a', fontWeight: 800, fontSize: '1.1rem' }}>
                Estado de resultados
              </Typography>
              {incomeLoading && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Calculando…
                </Typography>
              )}
            </Box>
            <Table
              size="small"
              sx={{
                borderCollapse: 'collapse',
                '& .MuiTableCell-root': { py: 0.75, px: 1.25 },
              }}
            >
              <TableBody>
                {[
                  ['GASTOS DIVERSOS', incomeData?.gastosDiversos],
                  ['SUELDOS', incomeData?.sueldos],
                  ['TOTAL DE COMPRA', incomeData?.totalCompra],
                  ['TOTAL DE BONOS', incomeData?.totalBonos],
                  ['TOTAL DE COMISIONES', incomeData?.totalComisiones],
                  ['TOTAL DE VENTA', incomeData?.totalVenta],
                ].map(([label, val]) => (
                  <TableRow key={label}>
                    <TableCell
                      sx={{
                        border: '1px solid #000',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        fontSize: '0.8rem',
                      }}
                    >
                      {label}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        border: '1px solid #000',
                        fontSize: '0.85rem',
                        color: incomeData != null && !incomeLoading ? 'text.primary' : 'text.secondary',
                      }}
                    >
                      {incomeData != null && !incomeLoading ? money(val) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell
                    sx={{
                      border: '1px solid #000',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      fontSize: '0.8rem',
                    }}
                  >
                    UTILIDAD BRUTA
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      border: '1px solid #000',
                      fontWeight: 700,
                      color:
                        incomeData != null && !incomeLoading ? '#2e7d32' : 'text.secondary',
                    }}
                  >
                    {incomeData != null && !incomeLoading ? money(incomeData.utilidadBruta) : '—'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    sx={{
                      border: '1px solid #000',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      fontSize: '0.8rem',
                    }}
                  >
                    UTILIDAD NETA
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      border: '1px solid #000',
                      fontWeight: 700,
                      color:
                        incomeData != null && !incomeLoading ? '#2e7d32' : 'text.secondary',
                    }}
                  >
                    {incomeData != null && !incomeLoading ? money(incomeData.utilidadNeta) : '—'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {reportTab === 'gastos' && gastosData && (
          <TableContainer
            component={Paper}
            sx={{
              overflowX: 'auto',
              border: '1px solid #bdbdbd',
              borderRadius: 0,
              mb: 3,
            }}
          >
            <Box
              sx={{
                bgcolor: '#6a1b9a',
                color: '#fff',
                px: 2,
                py: 1,
                fontWeight: 800,
                textAlign: 'center',
              }}
            >
              <Typography variant="body1" sx={{ color: 'inherit', fontWeight: 800, fontSize: '1rem' }}>
                {gastosReportTitle(startDate, endDate)}
              </Typography>
            </Box>
            <Table
              size="small"
              sx={{
                minWidth: 900,
                borderCollapse: 'collapse',
                '& .MuiTableCell-root': { fontSize: '0.75rem', py: 0.5, px: 0.75, lineHeight: 1.25 },
              }}
            >
              <TableHead>
                <TableRow>
                  {['Fecha', 'Folio', 'Empleado', 'Concepto', 'Proveedor', 'Monto', 'Monto neto'].map((h) => (
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
                {(gastosData.groups || []).flatMap((g) => {
                  const headerRow = (
                    <TableRow key={`h-${g.category}`}>
                      <TableCell
                        colSpan={7}
                        sx={{
                          bgcolor: '#e1bee7',
                          fontWeight: 800,
                          border: '1px solid #9e9e9e',
                          py: 0.75,
                        }}
                      >
                        {g.category}
                      </TableCell>
                    </TableRow>
                  )
                  const lineRows = (g.lines || []).map((row, li) => (
                    <TableRow
                      key={`${row.expenseId}-${row.expenseDate}-${row.concept}-${row.unitAmount}-${li}`}
                    >
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.expenseDate}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0', fontFamily: 'monospace' }}>
                        {row.expenseNumber || '—'}
                      </TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.employeeOrUnit || '—'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.concept || '—'}</TableCell>
                      <TableCell sx={{ border: '1px solid #e0e0e0' }}>{row.supplier || '—'}</TableCell>
                      <TableCell align="right" sx={{ border: '1px solid #e0e0e0' }}>
                        {money(row.lineSubtotal)}
                      </TableCell>
                      <TableCell align="right" sx={{ border: '1px solid #e0e0e0' }}>
                        {money(row.netLineSubtotal)}
                      </TableCell>
                    </TableRow>
                  ))
                  const subRow = (
                    <TableRow key={`s-${g.category}`}>
                      <TableCell
                        colSpan={5}
                        align="right"
                        sx={{ border: '1px solid #9e9e9e', fontWeight: 700, bgcolor: '#f5f5f5' }}
                      >
                        Subtotal {g.category}
                      </TableCell>
                      <TableCell align="right" sx={{ border: '1px solid #9e9e9e', fontWeight: 700, bgcolor: '#f5f5f5' }}>
                        {money(g.subtotalMonto)}
                      </TableCell>
                      <TableCell align="right" sx={{ border: '1px solid #9e9e9e', fontWeight: 700, bgcolor: '#f5f5f5' }}>
                        {money(g.subtotalMontoNeto)}
                      </TableCell>
                    </TableRow>
                  )
                  return [headerRow, ...lineRows, subRow]
                })}
                <TableRow>
                  <TableCell
                    colSpan={5}
                    align="right"
                    sx={{ border: '1px solid #9e9e9e', fontWeight: 800, bgcolor: '#ce93d8' }}
                  >
                    TOTAL
                  </TableCell>
                  <TableCell align="right" sx={{ border: '1px solid #9e9e9e', fontWeight: 800, bgcolor: '#ce93d8' }}>
                    {money(gastosData.totalMonto)}
                  </TableCell>
                  <TableCell align="right" sx={{ border: '1px solid #9e9e9e', fontWeight: 800, bgcolor: '#ce93d8' }}>
                    {money(gastosData.totalMontoNeto)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  )
}
