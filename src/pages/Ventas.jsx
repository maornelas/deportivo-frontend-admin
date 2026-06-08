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
import { Search as SearchIcon, PictureAsPdf as PdfIcon, Edit as EditIcon } from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ModalHeader from '../components/ModalHeader'
import {
  searchOrders,
  getOrderById,
  updateOrder,
  updateOrderSalesChannel,
  openOrderSaleNotePdfInNewTab,
} from '../api/orders'
import { useAuth } from '../contexts/AuthContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'
import OrderCancellationDialog from '../orders/OrderCancellationDialog'

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped', label: 'En camino' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'refunded', label: 'Reembolsado' },
]

const LIMIT = 15

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

function getDeliveryAddress(order) {
  if (!order) return null
  if (order.shippingAddress?.addressLine1) return order.shippingAddress
  return order.billingAddress || null
}

function isPlaceholderAddressField(value) {
  const s = String(value ?? '').trim()
  return !s || s === '—' || s === '-' || s === '00000'
}

function needsAddressParse(addr) {
  const line1 = String(addr?.addressLine1 ?? '').trim()
  if (!line1.includes(',')) return false
  return isPlaceholderAddressField(addr?.city) && isPlaceholderAddressField(addr?.state)
}

/** Órdenes desde cotización suelen guardar toda la dirección en addressLine1. */
function parseConcatenatedAddress(addr) {
  const raw = String(addr?.addressLine1 ?? '').trim()
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean)

  let country = isPlaceholderAddressField(addr?.country) ? 'México' : String(addr.country).trim()
  if (parts.length && /^(méxico|mexico)$/i.test(parts[parts.length - 1])) {
    country = parts.pop()
  }

  let postalCode = isPlaceholderAddressField(addr?.postalCode) ? '' : String(addr.postalCode).trim()
  if (parts.length && /^\d{5}$/.test(parts[parts.length - 1])) {
    postalCode = parts.pop()
  }

  let state = ''
  if (parts.length) state = parts.pop()

  let city = ''
  if (parts.length) city = parts.pop()

  let streetPart = parts.join(', ')
  let addressLine1 = streetPart
  let addressLine2 = isPlaceholderAddressField(addr?.addressLine2) ? '' : String(addr.addressLine2).trim()

  const coloniaMatch = streetPart.match(/^(.+?)\s+COLONIA:\s*(.+)$/i)
  if (coloniaMatch) {
    addressLine1 = coloniaMatch[1].trim()
    if (!addressLine2) addressLine2 = coloniaMatch[2].trim()
  }

  return { addressLine1, addressLine2, city, state, postalCode, country }
}

function formatDeliveryAddress(addr) {
  if (!addr) return '—'
  const form = addressToForm(addr)
  const line = [form.addressLine1, form.addressLine2, form.city, form.state, form.postalCode, form.country]
    .filter((p) => p && !isPlaceholderAddressField(p))
    .join(', ')
  return line || '—'
}

function addressToForm(addr) {
  if (!addr) {
    return { addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'México' }
  }
  if (needsAddressParse(addr)) {
    return parseConcatenatedAddress(addr)
  }
  return {
    addressLine1: isPlaceholderAddressField(addr.addressLine1) ? '' : String(addr.addressLine1).trim(),
    addressLine2: isPlaceholderAddressField(addr.addressLine2) ? '' : String(addr.addressLine2).trim(),
    city: isPlaceholderAddressField(addr.city) ? '' : String(addr.city).trim(),
    state: isPlaceholderAddressField(addr.state) ? '' : String(addr.state).trim(),
    postalCode: isPlaceholderAddressField(addr.postalCode) ? '' : String(addr.postalCode).trim(),
    country: isPlaceholderAddressField(addr.country) ? 'México' : String(addr.country).trim(),
  }
}

function buildShippingAddressUpdatePayload(order, shippingForm) {
  const billing = order.billingAddress || {}
  const existingShipping = order.shippingAddress?.addressLine1 ? order.shippingAddress : null
  const nameSource = existingShipping?.firstName ? existingShipping : billing

  return {
    billingFirstName: billing.firstName,
    billingLastName: billing.lastName,
    billingCompany: billing.company,
    billingRfc: billing.rfc,
    billingEmail: billing.email,
    billingPhone: billing.phone,
    billingAddressLine1: billing.addressLine1,
    billingAddressLine2: billing.addressLine2,
    billingCity: billing.city,
    billingState: billing.state,
    billingPostalCode: billing.postalCode,
    billingCountry: billing.country,
    shippingFirstName: nameSource.firstName || billing.firstName || 'Cliente',
    shippingLastName: nameSource.lastName || billing.lastName || '',
    shippingCompany: existingShipping?.company || billing.company,
    shippingAddressLine1: shippingForm.addressLine1.trim(),
    shippingAddressLine2: shippingForm.addressLine2?.trim() || '',
    shippingCity: shippingForm.city.trim(),
    shippingState: shippingForm.state.trim(),
    shippingPostalCode: shippingForm.postalCode.trim(),
    shippingCountry: shippingForm.country.trim() || 'México',
  }
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
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [pendingCancelStatus, setPendingCancelStatus] = useState(null)
  const [channelFilter, setChannelFilter] = useState('all')
  const [channelSaving, setChannelSaving] = useState(false)
  const [addressEditing, setAddressEditing] = useState(false)
  const [addressForm, setAddressForm] = useState(addressToForm(null))
  const [addressSaving, setAddressSaving] = useState(false)
  const [addressFormError, setAddressFormError] = useState('')
  const [pdfChoiceOpen, setPdfChoiceOpen] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [pdfError, setPdfError] = useState('')

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
    setAddressEditing(false)
    setAddressFormError('')
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
    setAddressEditing(false)
    setAddressFormError('')
    fetchOrders()
  }

  const handleStartAddressEdit = () => {
    if (!canDoAction(ACTION.VENTAS_CAMBIAR_ESTADO_ORDEN)) {
      showDenied()
      return
    }
    setAddressForm(addressToForm(getDeliveryAddress(detailOrder)))
    setAddressFormError('')
    setAddressEditing(true)
  }

  const handleCancelAddressEdit = () => {
    setAddressEditing(false)
    setAddressFormError('')
  }

  const handleAddressFieldChange = (field) => (e) => {
    setAddressForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleOpenSaleNotePdfChoice = () => {
    if (!(detailOrder?.items && detailOrder.items.length)) return
    setPdfError('')
    setPdfChoiceOpen(true)
  }

  const handleClosePdfChoice = () => {
    if (pdfGenerating) return
    setPdfChoiceOpen(false)
    setPdfError('')
  }

  const handleDownloadSaleNotePdf = async (hidePrices) => {
    if (!detailOrder?.id || pdfGenerating) return

    setPdfGenerating(true)
    setPdfError('')
    const result = await openOrderSaleNotePdfInNewTab(detailOrder.id, { hidePrices })
    setPdfGenerating(false)
    if (!result.success) {
      setPdfError(
        result.error || (hidePrices ? 'No se pudo generar el PDF sin precios' : 'No se pudo generar la nota de venta'),
      )
      return
    }
    setPdfChoiceOpen(false)
  }

  const handleSaveAddress = async () => {
    if (!canDoAction(ACTION.VENTAS_CAMBIAR_ESTADO_ORDEN)) {
      showDenied()
      return
    }
    if (!detailOrder?.id) return

    const trimmed = {
      addressLine1: addressForm.addressLine1.trim(),
      addressLine2: addressForm.addressLine2.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      postalCode: addressForm.postalCode.trim(),
      country: addressForm.country.trim() || 'México',
    }

    if (!trimmed.addressLine1 || !trimmed.city || !trimmed.state) {
      setAddressFormError('Calle, ciudad y estado son obligatorios.')
      return
    }

    setAddressSaving(true)
    setDetailError('')
    setAddressFormError('')
    const payload = buildShippingAddressUpdatePayload(detailOrder, trimmed)
    const result = await updateOrder(detailOrder.id, payload)
    setAddressSaving(false)
    if (!result.success) {
      setDetailError(result.error || 'Error al actualizar la dirección')
      return
    }

    const refreshed = await getOrderById(detailOrder.id)
    if (refreshed.success && refreshed.data) {
      setDetailOrder(refreshed.data)
    } else if (result.data) {
      setDetailOrder(result.data)
    }
    setAddressEditing(false)
  }

  const handleStatusChange = async (newStatus, cancellationReason) => {
    if (!canDoAction(ACTION.VENTAS_CAMBIAR_ESTADO_ORDEN)) {
      showDenied()
      return
    }
    if (!detailOrder?.id) return
    setStatusSaving(true)
    setDetailError('')
    const payload = { status: newStatus }
    if (newStatus === 'delivered' && user?.id) {
      payload.deliveredByUserId = user.id
    }
    if (cancellationReason) {
      payload.cancellationReason = cancellationReason
    }
    const result = await updateOrder(detailOrder.id, payload)
    setStatusSaving(false)
    if (!result.success) {
      setDetailError(result.error || 'Error al actualizar estado')
      return
    }
    setCancelDialogOpen(false)
    setPendingCancelStatus(null)
    const refreshed = await getOrderById(detailOrder.id)
    if (refreshed.success && refreshed.data) {
      setDetailOrder(refreshed.data)
    } else {
      setDetailOrder((prev) =>
        prev
          ? {
              ...prev,
              status: newStatus,
              cancellationReason: cancellationReason || prev.cancellationReason,
            }
          : null,
      )
    }
  }

  const handleStatusSelect = (newStatus) => {
    if (!detailOrder?.id || newStatus === detailOrder.status) return
    if (newStatus === 'cancelled' || newStatus === 'refunded') {
      setPendingCancelStatus(newStatus)
      setCancelDialogOpen(true)
      return
    }
    void handleStatusChange(newStatus)
  }

  const handleConfirmCancellation = (cancellationReason) => {
    if (!pendingCancelStatus) return
    void handleStatusChange(pendingCancelStatus, cancellationReason)
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
            <TextField placeholder="Nº orden, cliente o nº de siniestro" size="small" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleKeyDownSearch} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }} sx={{ minWidth: 260, flex: 1 }} />
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
                    onClick={handleOpenSaleNotePdfChoice}
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
                    <Select label="Estado de la orden" value={detailOrder.status || 'pending'} onChange={(e) => handleStatusSelect(e.target.value)} disabled={statusSaving}>
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
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          <strong>Dirección de entrega:</strong>{' '}
                          {!addressEditing && formatDeliveryAddress(getDeliveryAddress(detailOrder))}
                        </Typography>
                        {!addressEditing && (
                          <Button
                            size="small"
                            variant="text"
                            startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                            onClick={handleStartAddressEdit}
                            sx={{ minWidth: 0, flexShrink: 0, py: 0 }}
                          >
                            Editar
                          </Button>
                        )}
                      </Box>
                      {addressEditing && (
                        <Box sx={{ mt: 1.5, display: 'grid', gap: 1.5 }}>
                          <TextField
                            label="Calle y número"
                            size="small"
                            fullWidth
                            required
                            value={addressForm.addressLine1}
                            onChange={handleAddressFieldChange('addressLine1')}
                            disabled={addressSaving}
                          />
                          <TextField
                            label="Colonia / referencia"
                            size="small"
                            fullWidth
                            value={addressForm.addressLine2}
                            onChange={handleAddressFieldChange('addressLine2')}
                            disabled={addressSaving}
                          />
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                            <TextField
                              label="Ciudad"
                              size="small"
                              required
                              value={addressForm.city}
                              onChange={handleAddressFieldChange('city')}
                              disabled={addressSaving}
                            />
                            <TextField
                              label="Estado"
                              size="small"
                              required
                              value={addressForm.state}
                              onChange={handleAddressFieldChange('state')}
                              disabled={addressSaving}
                            />
                          </Box>
                          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                            <TextField
                              label="Código postal"
                              size="small"
                              value={addressForm.postalCode}
                              onChange={handleAddressFieldChange('postalCode')}
                              disabled={addressSaving}
                            />
                            <TextField
                              label="País"
                              size="small"
                              value={addressForm.country}
                              onChange={handleAddressFieldChange('country')}
                              disabled={addressSaving}
                            />
                          </Box>
                          {addressFormError && (
                            <Alert severity="warning" sx={{ py: 0.5 }}>
                              {addressFormError}
                            </Alert>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button size="small" onClick={handleCancelAddressEdit} disabled={addressSaving}>
                              Cancelar
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => void handleSaveAddress()}
                              disabled={addressSaving}
                            >
                              {addressSaving ? 'Guardando…' : 'Guardar dirección'}
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </Box>
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
                {detailOrder.cancellationReason ? (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" color="error">
                      Causa de cancelación
                    </Typography>
                    <Typography variant="body2">{detailOrder.cancellationReason}</Typography>
                  </>
                ) : null}
              </Box>
            )}
          </DialogContent>
          <DialogActions><Button onClick={handleCloseDetail} color="inherit">Cerrar</Button></DialogActions>
        </Dialog>

        <Dialog
          open={pdfChoiceOpen}
          onClose={handleClosePdfChoice}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}
        >
          <ModalHeader title="Descargar nota de venta" onClose={handleClosePdfChoice} />
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              Elige si el PDF incluye los precios o los oculta con guiones (—) para compartir con talleres.
            </Typography>
            {pdfGenerating && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2 }}>
                <CircularProgress size={22} />
                <Typography variant="body2">Generando nota de venta…</Typography>
              </Box>
            )}
            {pdfError && (
              <Alert severity="error" sx={{ mt: 2 }} onClose={() => setPdfError('')}>
                {pdfError}
              </Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1, px: 3, pb: 2.5, pt: 0 }}>
            <Button variant="contained" disabled={pdfGenerating} onClick={() => void handleDownloadSaleNotePdf(false)}>
              Con precios
            </Button>
            <Button variant="outlined" disabled={pdfGenerating} onClick={() => void handleDownloadSaleNotePdf(true)}>
              Sin precios (—)
            </Button>
          </DialogActions>
        </Dialog>

        <OrderCancellationDialog
          open={cancelDialogOpen}
          onClose={() => {
            if (statusSaving) return
            setCancelDialogOpen(false)
            setPendingCancelStatus(null)
          }}
          onConfirm={handleConfirmCancellation}
          statusLabel={ORDER_STATUS_OPTIONS.find((o) => o.value === pendingCancelStatus)?.label || 'Cancelado'}
          saving={statusSaving}
        />

        {permissionDeniedSnackbar}
      </Box>
    </Box>
  )
}

export default Ventas
