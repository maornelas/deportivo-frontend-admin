import { useState, useEffect, useCallback } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  CircularProgress,
  Alert,
  Snackbar,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material'
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { listQuotations } from '../api/quotations'
import { useAuth } from '../contexts/AuthContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'

const STATUS = {
  draft: { label: 'Borrador', color: 'default' },
  sent: { label: 'Enviada', color: 'info' },
  approved: { label: 'Aprobada', color: 'success' },
  rejected: { label: 'Rechazada', color: 'error' },
  sold: { label: 'Vendida', color: 'warning' },
}

const LIMIT = 15

function formatDate(v) {
  if (!v) return '-'
  const d = new Date(v)
  return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('es-MX', { dateStyle: 'short' })
}

function formatTime(v) {
  if (!v) return '-'
  const d = new Date(v)
  return isNaN(d.getTime())
    ? '-'
    : d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function formatMoney(n, c = 'MXN') {
  if (n == null) return '-'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: c }).format(Number(n))
}

export default function Cotizaciones() {
  const navigate = useNavigate()
  const location = useLocation()
  const { canDoAction } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [clientApplied, setClientApplied] = useState('')
  const [search, setSearch] = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [deletedToast, setDeletedToast] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = { page: page + 1, limit: LIMIT }
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (status) params.status = status
    if (clientApplied) params.clientSearch = clientApplied
    if (searchApplied) params.search = searchApplied
    const r = await listQuotations(params)
    setLoading(false)
    if (!r.success) {
      setError(r.error || 'Error')
      return
    }
    setRows(r.data.quotations || [])
    setTotal(r.data.total ?? 0)
  }, [page, startDate, endDate, status, clientApplied, searchApplied])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  useEffect(() => {
    if (!location.state?.quotationDeleted) return
    setDeletedToast(true)
    navigate(`${location.pathname}${location.search || ''}`, { replace: true, state: {} })
    void fetchList()
  }, [location.state?.quotationDeleted, location.pathname, location.search, navigate, fetchList])

  const applyFilters = () => {
    setClientApplied(clientSearch)
    setSearchApplied(search)
    setPage(0)
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
          pt: { xs: '16px', sm: '24px', md: '32px' },
          pr: { xs: '16px', sm: '24px', md: '32px' },
          pb: { xs: '16px', sm: '24px', md: '32px' },
          pl: { xs: '16px', sm: '24px', md: `${SIDEBAR_WIDTH + 32}px` },
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold', fontSize: { xs: '24px', md: '32px' } }}>
            Cotizaciones
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              if (!canDoAction(ACTION.COTIZACIONES_CREAR)) {
                showDenied()
                return
              }
              navigate('/cotizaciones/nueva')
            }}
            sx={{ bgcolor: '#7B2CBF', '&:hover': { bgcolor: '#6A26A8' } }}
          >
            Nueva cotización
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField size="small" label="Desde" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            <TextField size="small" label="Hasta" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 150 }} />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Estado</InputLabel>
              <Select label="Estado" value={status} onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="draft">Borrador</MenuItem>
                <MenuItem value="sent">Enviada</MenuItem>
                <MenuItem value="approved">Aprobada</MenuItem>
                <MenuItem value="rejected">Rechazada</MenuItem>
                <MenuItem value="sold">Vendida</MenuItem>
              </Select>
            </FormControl>
            <TextField size="small" label="Cliente" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Nombre" sx={{ width: 180 }} />
            <TextField
              size="small"
              label="Buscar"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Número de cotización"
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: 200 }}
            />
            <Button variant="outlined" onClick={applyFilters}>Aplicar</Button>
          </Box>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nº</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Hora</strong></TableCell>
                    <TableCell align="right"><strong>Total</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Sin cotizaciones</TableCell></TableRow>
                  ) : (
                    rows.map((q) => (
                      <TableRow
                        key={q.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (!canDoAction(ACTION.COTIZACIONES_EDITAR)) {
                            showDenied()
                            return
                          }
                          navigate(`/cotizaciones/${q.id}`)
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2">{q.quotationNumber || '—'}</Typography>
                        </TableCell>
                        <TableCell>{q.clientName || '—'}</TableCell>
                        <TableCell>{formatDate(q.createdAt)}</TableCell>
                        <TableCell>{formatTime(q.createdAt)}</TableCell>
                        <TableCell align="right">{formatMoney(q.total, q.currency)}</TableCell>
                        <TableCell>
                          <Chip size="small" label={STATUS[q.status]?.label || q.status} color={STATUS[q.status]?.color || 'default'} variant="outlined" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)} rowsPerPage={LIMIT} rowsPerPageOptions={[LIMIT]} labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} />
            </>
          )}
        </TableContainer>

        <Snackbar
          open={deletedToast}
          autoHideDuration={5000}
          onClose={(_, reason) => {
            if (reason === 'clickaway') return
            setDeletedToast(false)
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: { xs: 1, md: 9 } }}
        >
          <Alert
            severity="success"
            variant="filled"
            onClose={() => setDeletedToast(false)}
            sx={{ boxShadow: 3 }}
          >
            La cotización se eliminó correctamente.
          </Alert>
        </Snackbar>
        {permissionDeniedSnackbar}
      </Box>
    </Box>
  )
}
