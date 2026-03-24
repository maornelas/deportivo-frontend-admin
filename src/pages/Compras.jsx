import { useEffect, useMemo, useState } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import { useLocation, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { usePurchases } from '../contexts/PurchasesContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'
import { usePushNotification } from '../hooks/usePushNotification'
import { STATUS_OPTIONS, formatDateValue, formatMoney, getStatusChip, safeTrim } from '../compras/shared'

const Compras = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { purchases } = usePurchases()
  const { canDoAction } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()
  const { notify, pushNotificationSnackbar } = usePushNotification()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const flash = location.state?.flashSuccess
    if (!flash || typeof flash !== 'string') return
    notify(flash, { skipBrowser: true })
    navigate(`${location.pathname}${location.search || ''}`, { replace: true, state: {} })
  }, [location.state, location.pathname, location.search, navigate, notify])

  const [page, setPage] = useState(0)
  const [limit] = useState(10)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('')
  const [providerSearch, setProviderSearch] = useState('')
  const [searchApplied, setSearchApplied] = useState('')

  const computedPurchases = useMemo(() => {
    const q = safeTrim(searchApplied).toLowerCase()
    const ps = safeTrim(providerSearch).toLowerCase()
    const sDate = startDate ? new Date(startDate + 'T00:00:00.000Z') : null
    const eDate = endDate ? new Date(endDate + 'T23:59:59.999Z') : null

    const filtered = purchases.filter((p) => {
      if (status && p.status !== status) return false
      if (ps && !(p.providerName || '').toLowerCase().includes(ps)) return false
      if (q) {
        const provider = (p.providerName || '').toLowerCase().includes(q)
        const id = String(p.id || '').toLowerCase().includes(q)
        if (!provider && !id) return false
      }
      if (sDate) {
        const pd = new Date(p.purchaseDate)
        if (pd.getTime() < sDate.getTime()) return false
      }
      if (eDate) {
        const pd = new Date(p.purchaseDate)
        if (pd.getTime() > eDate.getTime()) return false
      }
      return true
    })

    filtered.sort((a, b) => new Date(b.createdAt || b.purchaseDate).getTime() - new Date(a.createdAt || a.purchaseDate).getTime())
    return filtered
  }, [purchases, status, providerSearch, searchApplied, startDate, endDate])

  const pagedPurchases = useMemo(() => {
    const start = page * limit
    return computedPurchases.slice(start, start + limit)
  }, [computedPurchases, page, limit])

  const canConsultCompra = () =>
    canDoAction(ACTION.COMPRAS_EDITAR, { requireWrite: false }) ||
    canDoAction(ACTION.COMPRAS_CREAR, { requireWrite: false }) ||
    canDoAction(ACTION.COMPRAS_ELIMINAR, { requireWrite: false })

  const goRegistrar = () => {
    if (!canDoAction(ACTION.COMPRAS_CREAR)) {
      showDenied()
      return
    }
    navigate('/compras/nueva')
  }

  const goDetalle = (p) => {
    if (!canConsultCompra()) {
      showDenied()
      return
    }
    navigate(`/compras/${encodeURIComponent(p.id)}`)
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
          backgroundColor: '#fafafa',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold', marginBottom: 2, fontSize: { xs: '24px', sm: '28px', md: '32px' } }}>
          Compras
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
            <TextField label="Fecha inicio" type="date" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
            <TextField label="Fecha fin" type="date" size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Estado</InputLabel>
              <Select label="Estado" value={status} onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField label="Proveedor" size="small" value={providerSearch} onChange={(e) => setProviderSearch(e.target.value)} sx={{ minWidth: 220, flex: 1 }} />

            <TextField
              label="Búsqueda"
              size="small"
              value={searchApplied}
              onChange={(e) => setSearchApplied(e.target.value)}
              placeholder="ID o proveedor"
              sx={{ minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
                    <SearchIcon fontSize="small" color="action" />
                  </Box>
                ),
              }}
            />

            <Button variant="contained" startIcon={<AddIcon />} onClick={goRegistrar} sx={{ bgcolor: '#7B2CBF', '&:hover': { bgcolor: '#6A26A8' } }}>
              Registrar compra
            </Button>
          </Box>
        </Paper>

        <TableContainer component={Paper}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Proveedor</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell align="right"><strong>Total</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Pago</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedPurchases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Sin resultados con los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : (
                pagedPurchases.map((p) => {
                  const chip = getStatusChip(p.status)
                  return (
                    <TableRow
                      key={p.id}
                      hover
                      onDoubleClick={() => goDetalle(p)}
                      sx={{ cursor: 'pointer' }}
                      title="Doble clic para ver detalles"
                      aria-label={`Ver detalles de compra ${String(p.id).slice(0, 8)}`}
                    >
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontSize={12}>
                          {String(p.id).slice(0, 8)}…
                        </Typography>
                      </TableCell>
                      <TableCell>{p.providerName || '-'}</TableCell>
                      <TableCell>{formatDateValue(p.purchaseDate) || '-'}</TableCell>
                      <TableCell align="right">{formatMoney(p.total, p.currency)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={chip.label} color={chip.color} variant="outlined" />
                      </TableCell>
                      <TableCell>{p.paymentMethod || '-'}</TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={computedPurchases.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={limit}
            rowsPerPageOptions={[limit]}
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </TableContainer>

        {pushNotificationSnackbar}
        {permissionDeniedSnackbar}
      </Box>
    </Box>
  )
}

export default Compras
