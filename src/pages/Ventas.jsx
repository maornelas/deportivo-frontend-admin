import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SIDEBAR_WIDTH } from '../config/layout'

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
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Chip,
} from '@mui/material'
import { Search as SearchIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ModalHeader from '../components/ModalHeader'
import { searchOrders, getOrderById, updateOrder, updateOrderSalesChannel, getOrderSaleNotePdfUrl } from '../api/orders'
import { useAuth } from '../contexts/AuthContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped', label: 'En camino' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'refunded', label: 'Reembolsado' },
]

const LIMIT = 10

function formatDate(value) {
  if (!value) return '-'
  const d = typeof value === 'string' ? new Date(value) : value
  return isNaN(d.getTime()) ? value : d.toLocaleDateString('es-MX', { dateStyle: 'short' })
}

function formatTime(value) {
  if (!value) return '-'
  const d = typeof value === 'string' ? new Date(value) : value
  return isNaN(d.getTime()) ? value : d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatCurrency(value, currency = 'MXN') {
  if (value == null) return '-'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(value))
}

function getClientDisplay(order) {
  const addr = order.billingAddress
  if (addr) {
    const name = [addr.firstName, addr.lastName].filter(Boolean).join(' ')
    return name || addr.email || '-'
  }
  const name = [order.billingFirstName, order.billingLastName].filter(Boolean).join(' ')
  return name || order.billingEmail || '-'
}

function getStatusLabel(status) {
  const opt = ORDER_STATUS_OPTIONS.find((o) => o.value === status)
  return opt ? opt.label : status || '-'
}

function getStatusColor(status) {
  if (status === 'cancelled' || status === 'refunded') return 'error.main'
  return 'primary.main'
}

function getSalesChannelLabel(salesChannel) {
  if (salesChannel === 'advisor') return 'Asesor'
  return 'Online'
}

function getSalesChannelSubtitle(salesChannel) {
  if (salesChannel === 'advisor') return 'Vendedores piezas / aseguradoras'
  return 'Venta directa (landing)'
}

const Ventas = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { canDoAction, user } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [limit] = useState(LIMIT)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [detailOrder, setDetailOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [channelFilter, setChannelFilter] = useState('all')
  const [channelSaving, setChannelSaving] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = { page: page + 1, limit, sortBy: 'createdAt', sortOrder: 'DESC' }
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (searchApplied) params.search = searchApplied
    if (channelFilter === 'online' || channelFilter === 'advisor') params.salesChannel = channelFilter
    const result = await searchOrders(params)
    setLoading(false)
    if (!result.success) {
      setError(result.error || 'Error al cargar ventas')
      return
    }
    const data = result.data
    setOrders(data.orders || [])
    setTotal(data.total ?? 0)
  }, [page, limit, startDate, endDate, searchApplied, channelFilter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    const canal = (searchParams.get('canal') || '').toLowerCase()
    if (canal === 'asesor' || canal === 'advisor') {
      setChannelFilter('advisor')
      setPage(0)
      const next = new URLSearchParams(searchParams)
      next.delete('canal')
      setSearchParams(next, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handlePageChange = (_, newPage) => setPage(newPage)
  const handleApplyFilters = () => { setSearchApplied(search); setPage(0) }
  const handleKeyDownSearch = (e) => { if (e.key === 'Enter') handleApplyFilters() }
  const handleMenuClick = () => setSidebarOpen(!sidebarOpen)
  const handleSidebarClose = () => setSidebarOpen(false)

  const handleRowDoubleClick = async (order) => {
    if (!canDoAction(ACTION.VENTAS_DETALLE_ORDEN, { requireWrite: false })) {
      showDenied()
      return
    }
    setDetailOrder(null)
    setDetailError('')
    setDetailLoading(true)
    const result = await getOrderById(order.id)
    setDetailLoading(false)
    if (!result.success) {
      setDetailError(result.error || 'Error al cargar el detalle')
      return
    }
    setDetailOrder(result.data)
  }

  const handleCloseDetail = () => {
    setDetailOrder(null)
    setDetailError('')
    setDetailLoading(false)
    setStatusSaving(false)
    fetchOrders()
  }

  const handleStatusChange = async (newStatus) => {
    if (!canDoAction(ACTION.VENTAS_CAMBIAR_ESTADO_ORDEN)) {
      showDenied()
      return
    }
    if (!detailOrder?.id) return
    setStatusSaving(true)
    setDetailError('')
    const result = await updateOrder(detailOrder.id, { status: newStatus })
    setStatusSaving(false)
    if (!result.success) {
      setDetailError(result.error || 'Error al actualizar estado')
      return
    }
    const refreshed = await getOrderById(detailOrder.id)
    if (refreshed.success && refreshed.data) {
      setDetailOrder(refreshed.data)
    } else {
      setDetailOrder((prev) => (prev ? { ...prev, status: newStatus } : null))
    }
  }

  const handleChannelFilterChange = (_, value) => {
    if (value != null) {
      setChannelFilter(value)
      setPage(0)
    }
  }

  const handleSalesChannelChange = async (newChannel) => {
    if (!canDoAction(ACTION.VENTAS_CAMBIAR_ESTADO_ORDEN)) {
      showDenied()
      return
    }
    if (!detailOrder?.id || !newChannel) return
    setChannelSaving(true)
    setDetailError('')
    const result = await updateOrderSalesChannel(detailOrder.id, newChannel)
    setChannelSaving(false)
    if (!result.success) {
      setDetailError(result.error || 'Error al actualizar canal')
      return
    }
    if (result.data) setDetailOrder(result.data)
    else setDetailOrder((prev) => (prev ? { ...prev, salesChannel: newChannel } : null))
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <Box sx={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', marginTop: { xs: 0, md: '70px' }, pt: { xs: '16px', sm: '24px', md: '32px' }, pr: { xs: '16px', sm: '24px', md: '32px' }, pb: { xs: '16px', sm: '24px', md: '32px' }, pl: { xs: '16px', sm: '24px', md: `${SIDEBAR_WIDTH + 32}px` }, minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' } }}>
        <Header onMenuClick={handleMenuClick} />
        <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold', marginBottom: 2, fontSize: { xs: '24px', sm: '28px', md: '32px' } }}>
          Ventas
        </Typography>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Canal de venta</Typography>
          <ToggleButtonGroup
            value={channelFilter}
            exclusive
            onChange={handleChannelFilterChange}
            size="small"
            sx={{
              mb: 2,
              flexWrap: 'wrap',
              '& .MuiToggleButton-root.Mui-selected': {
                backgroundColor: '#7B2CBF',
                color: '#fff',
                borderColor: '#7B2CBF',
                '&:hover': {
                  backgroundColor: '#6A26A8',
                  color: '#fff',
                },
              },
            }}
          >
            <ToggleButton value="all">Todos</ToggleButton>
            <ToggleButton value="online">Online</ToggleButton>
            <ToggleButton value="advisor">Asesor</ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Online = venta directa (landing). Asesor = vendedores de piezas para aseguradoras.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', mb: 2 }}>
            <TextField label="Fecha inicio" type="date" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
            <TextField label="Fecha fin" type="date" size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
            <TextField placeholder="Nº orden o nombre de usuario" size="small" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleKeyDownSearch} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} sx={{ minWidth: 260, flex: 1 }} />
            <Typography component="button" type="button" onClick={handleApplyFilters} sx={{ px: 2, py: 1, borderRadius: 1, border: '1px solid #424242', backgroundColor: '#424242', color: 'white', cursor: 'pointer', fontSize: 14, '&:hover': { backgroundColor: '#616161' } }}>Buscar</Typography>
          </Box>
        </Paper>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Nº Orden</strong></TableCell>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Hora</strong></TableCell>
                    <TableCell><strong>Cliente</strong></TableCell>
                    <TableCell><strong>Canal</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell align="right"><strong>Total</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>No hay ventas con los filtros seleccionados.</TableCell></TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id} hover onDoubleClick={() => handleRowDoubleClick(order)} sx={{ cursor: 'pointer' }}>
                        <TableCell>{order.orderNumber || '-'}</TableCell>
                        <TableCell>{formatDate(order.createdAt)}</TableCell>
                        <TableCell>{formatTime(order.createdAt)}</TableCell>
                        <TableCell>{getClientDisplay(order)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={getSalesChannelLabel(order.salesChannel)}
                            color={order.salesChannel === 'advisor' ? 'secondary' : 'primary'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ color: getStatusColor(order.status), fontWeight: 500 }}>{getStatusLabel(order.status)}</TableCell>
                        <TableCell align="right">{formatCurrency(order.status === 'cancelled' ? -Number(order.totalAmount) : order.totalAmount, order.currency)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <TablePagination component="div" count={total} page={page} onPageChange={handlePageChange} rowsPerPage={limit} rowsPerPageOptions={[limit]} labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`} labelRowsPerPage="Filas:" />
            </>
          )}
        </TableContainer>
        <Dialog open={!!detailOrder || detailLoading} onClose={handleCloseDetail} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}>
          <ModalHeader title={`Orden ${detailOrder?.orderNumber || '...'}`} onClose={handleCloseDetail} />
          <DialogContent>
            {detailLoading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}
            {detailError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDetailError('')}>{detailError}</Alert>}
            {detailOrder && !detailLoading && (
              <Box sx={{ pt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<PdfIcon />}
                    disabled={!(detailOrder.items && detailOrder.items.length)}
                    onClick={() => {
                      const seller = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
                      window.open(
                        getOrderSaleNotePdfUrl(detailOrder.id, { seller: seller || undefined }),
                        '_blank',
                        'noopener,noreferrer',
                      )
                    }}
                  >
                    Nota de venta (PDF)
                  </Button>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Canal de venta</InputLabel>
                    <Select
                      label="Canal de venta"
                      value={detailOrder.salesChannel === 'advisor' ? 'advisor' : 'online'}
                      onChange={(e) => handleSalesChannelChange(e.target.value)}
                      disabled={channelSaving}
                    >
                      <MenuItem value="online">Online — {getSalesChannelSubtitle('online')}</MenuItem>
                      <MenuItem value="advisor">Asesor — {getSalesChannelSubtitle('advisor')}</MenuItem>
                    </Select>
                  </FormControl>
                  {channelSaving && <CircularProgress size={24} />}
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Estado de la orden</InputLabel>
                    <Select label="Estado de la orden" value={detailOrder.status || 'pending'} onChange={(e) => handleStatusChange(e.target.value)} disabled={statusSaving}>
                      {ORDER_STATUS_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                    </Select>
                  </FormControl>
                  {statusSaving && <CircularProgress size={24} />}
                </Box>
                <Typography variant="body2" color="text.secondary">Fecha: {formatDate(detailOrder.createdAt)}{detailOrder.currency && ` · ${detailOrder.currency}`}{' · '}Pago: {detailOrder.paymentStatus || '-'}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Facturación</Typography>
                {detailOrder.billingAddress ? (
                  <Box sx={{ mb: 2, display: 'grid', gap: 0.5 }}>
                    <Typography variant="body2"><strong>Nombre:</strong> {[detailOrder.billingAddress.firstName, detailOrder.billingAddress.lastName].filter(Boolean).join(' ')} {detailOrder.billingAddress.company ? ` · ${detailOrder.billingAddress.company}` : ''}</Typography>
                    <Typography variant="body2"><strong>Email:</strong> {detailOrder.billingAddress.email || '—'}</Typography>
                    <Typography variant="body2"><strong>Teléfono:</strong> {detailOrder.billingAddress.phone || '—'}</Typography>
                    <Typography variant="body2"><strong>Dirección de entrega:</strong> {detailOrder.shippingAddress ? [detailOrder.shippingAddress.addressLine1, detailOrder.shippingAddress.addressLine2, detailOrder.shippingAddress.city, detailOrder.shippingAddress.state, detailOrder.shippingAddress.postalCode, detailOrder.shippingAddress.country].filter(Boolean).join(', ') : [detailOrder.billingAddress.addressLine1, detailOrder.billingAddress.addressLine2, detailOrder.billingAddress.city, detailOrder.billingAddress.state, detailOrder.billingAddress.postalCode, detailOrder.billingAddress.country].filter(Boolean).join(', ') || '—'}</Typography>
                  </Box>
                ) : <Typography variant="body2">—</Typography>}
                {detailOrder.shippingAddress && (detailOrder.shippingMethod || detailOrder.trackingNumber) && (
                  <Box sx={{ mb: 2 }}>{detailOrder.shippingMethod && <Typography variant="body2">Método de envío: {detailOrder.shippingMethod}</Typography>}{detailOrder.trackingNumber && <Typography variant="body2">Seguimiento: {detailOrder.trackingNumber}</Typography>}</Box>
                )}
                <Typography variant="subtitle2" color="text.secondary">Productos</Typography>
                <Table size="small" sx={{ mb: 2 }}>
                  <TableHead><TableRow><TableCell>Producto / SKU</TableCell><TableCell align="right">Cant.</TableCell><TableCell align="right">P. unit.</TableCell><TableCell align="right">Total</TableCell></TableRow></TableHead>
                  <TableBody>
                    {(detailOrder.items || []).map((item) => (
                      <TableRow key={item.id || item.productId}>
                        <TableCell>{item.productName || '-'} {item.productSku && `(${item.productSku})`}</TableCell>
                        <TableCell align="right">{item.quantity ?? '-'}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice, detailOrder.currency)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.totalPrice, detailOrder.currency)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                  {detailOrder.subtotal != null && <Typography variant="body2">Subtotal: {formatCurrency(detailOrder.subtotal, detailOrder.currency)}</Typography>}
                  {detailOrder.taxAmount != null && Number(detailOrder.taxAmount) !== 0 && <Typography variant="body2">Impuestos: {formatCurrency(detailOrder.taxAmount, detailOrder.currency)}</Typography>}
                  {detailOrder.shippingAmount != null && Number(detailOrder.shippingAmount) !== 0 && <Typography variant="body2">Envío: {formatCurrency(detailOrder.shippingAmount, detailOrder.currency)}</Typography>}
                  {detailOrder.discountAmount != null && Number(detailOrder.discountAmount) !== 0 && <Typography variant="body2">Descuento: {formatCurrency(detailOrder.discountAmount, detailOrder.currency)}</Typography>}
                  <Typography variant="subtitle1" fontWeight="bold">Total: {formatCurrency(detailOrder.totalAmount, detailOrder.currency)}</Typography>
                </Box>
                {detailOrder.notes && <><Divider sx={{ my: 2 }} /><Typography variant="subtitle2" color="text.secondary">Notas</Typography><Typography variant="body2">{detailOrder.notes}</Typography></>}
              </Box>
            )}
          </DialogContent>
          <DialogActions><Button onClick={handleCloseDetail} color="inherit">Cerrar</Button></DialogActions>
        </Dialog>
        {permissionDeniedSnackbar}
      </Box>
    </Box>
  )
}

export default Ventas
