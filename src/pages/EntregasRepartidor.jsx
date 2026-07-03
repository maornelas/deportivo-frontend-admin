import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Link,
  Dialog,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material'
import { LocalShipping, ViewList, ViewModule, ExpandMore, FilterList } from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ModalHeader from '../components/ModalHeader'
import { SIDEBAR_WIDTH } from '../config/layout'
import { useAuth } from '../contexts/AuthContext'
import { listDeliveries, createDelivery } from '../api/deliveries'
import { getUsers } from '../api/user'
import { searchOrders, getOrderById } from '../api/orders'

/** Tabla de entregas: celdas compactas y tipografía menor en móvil. */
const deliveriesTableSx = {
  tableLayout: 'fixed',
  width: '100%',
  /** En xs no se muestra Folio: menos ancho mínimo útil para scroll horizontal. */
  minWidth: { xs: 400, sm: 560 },
  '& .MuiTableCell-root': {
    fontSize: { xs: '0.62rem', sm: '0.75rem', md: '0.8125rem' },
    lineHeight: { xs: 1.25, sm: 1.43 },
    py: { xs: 0.35, sm: 0.65 },
    px: { xs: 0.45, sm: 1 },
    verticalAlign: 'middle',
  },
  '& .MuiTableCell-head': {
    fontSize: { xs: '0.58rem', sm: '0.7rem', md: '0.75rem' },
    fontWeight: 700,
    py: { xs: 0.45, sm: 0.65 },
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'PENDIENTE' },
  { value: 'in_transit', label: 'EN CAMINO' },
  { value: 'delivered', label: 'ENTREGADA' },
]

const DATE_FIELD_OPTIONS = [
  { value: 'created', label: 'Fecha de registro' },
  { value: 'delivered', label: 'Fecha de entrega' },
]

const ORDER_STATUS_FOR_MODAL = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped', label: 'En camino' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'refunded', label: 'Reembolsado' },
]

function formatOrderDateShort(value) {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-MX', { dateStyle: 'short' })
}

function formatCurrencyOrder(value, currency = 'MXN') {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(value))
}

function getClientDisplayOrder(order) {
  const addr = order.billingAddress
  if (addr) {
    const name = [addr.firstName, addr.lastName].filter(Boolean).join(' ')
    return name || addr.email || '—'
  }
  const name = [order.billingFirstName, order.billingLastName].filter(Boolean).join(' ')
  return name || order.billingEmail || '—'
}

function getOrderStatusLabel(status) {
  return ORDER_STATUS_FOR_MODAL.find((o) => o.value === status)?.label || status || '—'
}

function getOrderStatusColor(status) {
  if (status === 'cancelled' || status === 'refunded') return 'error.main'
  return 'primary.main'
}

function getSalesChannelLabelOrder(salesChannel) {
  return salesChannel === 'advisor' ? 'Asesor' : 'Online'
}

function repartidorLabel(row) {
  const r = row.repartidor || {}
  if (!row.deliveredByUserId) return 'Sin repartidor'
  const name = [r.firstName, r.lastName].filter(Boolean).join(' ').trim()
  if (name) return name
  return r.email || 'Repartidor'
}

/** Variante visual de la card según estatus de entrega (lista repartidor). */
function getDeliveryCardStatusVariant(row) {
  const status = String(row?.status || '').toLowerCase()
  const label = String(row?.statusLabel || '').toUpperCase()
  if (status === 'delivered' || label.includes('ENTREGAD')) return 'delivered'
  if (status === 'pending' || label.includes('PENDIENT')) return 'pending'
  return 'default'
}

function deliveryStatusChipStyle(variant) {
  if (variant === 'delivered') {
    return {
      color: 'success',
      variant: 'filled',
      sx: {
        bgcolor: 'success.main',
        color: 'success.contrastText',
        fontWeight: 700,
        '& .MuiChip-label': { color: 'inherit' },
      },
    }
  }
  if (variant === 'pending') {
    return {
      color: 'warning',
      variant: 'outlined',
      sx: {
        borderColor: 'warning.main',
        color: 'warning.dark',
        bgcolor: 'rgba(237, 108, 2, 0.08)',
        fontWeight: 600,
      },
    }
  }
  return {
    color: 'primary',
    variant: 'outlined',
    sx: {},
  }
}

function DeliveryStatusChip({ row, sx = {} }) {
  const statusVariant = getDeliveryCardStatusVariant(row)
  const chipStyle = deliveryStatusChipStyle(statusVariant)
  return (
    <Chip
      size="small"
      label={row.statusLabel || row.status}
      color={chipStyle.color}
      variant={chipStyle.variant}
      sx={{ ...chipStyle.sx, ...sx }}
    />
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100]

/** Vista inicial: cards en pantallas estrechas (repartidor en celular). */
function getInitialListViewMode() {
  if (typeof window === 'undefined') return 'table'
  return window.matchMedia('(max-width:899px)').matches ? 'cards' : 'table'
}

const DELIVERIES_TABLE_COL_COUNT = 5

function deliveriesTableColCount(showRepartidorColumn) {
  return showRepartidorColumn ? DELIVERIES_TABLE_COL_COUNT : DELIVERIES_TABLE_COL_COUNT - 1
}

const paginationToolbarSx = {
  borderTop: 1,
  borderColor: 'divider',
  '& .MuiTablePagination-toolbar': {
    flexWrap: 'wrap',
    gap: 1,
    minHeight: { xs: 52, sm: 48 },
    px: { xs: 0.75, sm: 1 },
    py: { xs: 0.75, sm: 1 },
  },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
    fontSize: { xs: '0.7rem', sm: '0.875rem' },
    m: 0,
  },
  '& .MuiIconButton-root': {
    padding: { xs: 1, sm: 0.75 },
  },
}

function DeliveriesTableHeadRow({ showRepartidorColumn = true }) {
  return (
    <TableRow>
      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Folio</TableCell>
      <TableCell
        sx={{
          minWidth: { xs: 176, sm: 'auto' },
          width: { xs: '46%', sm: 'auto' },
          maxWidth: { xs: 'none', sm: 'none' },
        }}
      >
        Nota / pedido
      </TableCell>
      {showRepartidorColumn ? (
        <TableCell sx={{ maxWidth: { xs: 72, sm: 'none' } }}>Repartidor</TableCell>
      ) : null}
      <TableCell sx={{ width: { xs: '24%', sm: 'auto' }, whiteSpace: 'nowrap' }}>F. entrega</TableCell>
      <TableCell sx={{ width: { xs: '18%', sm: 'auto' } }}>Estatus</TableCell>
    </TableRow>
  )
}

function DeliveryCompactCard({ row, showRepartidorColumn = true }) {
  const orderNo = row.orderNumber || '—'
  const detailTo = row.orderNumber
    ? `/repartidor?folio=${encodeURIComponent(row.orderNumber)}`
    : null
  const statusVariant = getDeliveryCardStatusVariant(row)
  const headerPalette =
    statusVariant === 'delivered'
      ? { bg: '#15803d', color: '#ecfdf5' }
      : statusVariant === 'pending'
        ? { bg: '#7c2d12', color: '#fff7ed' }
        : { bg: 'primary.main', color: 'primary.contrastText' }
  const borderAccent =
    statusVariant === 'delivered'
      ? '#22c55e'
      : statusVariant === 'pending'
        ? '#c2410c'
        : undefined
  const chipSx = {
    height: { xs: 16, sm: 17, md: 19, lg: 16 },
    maxWidth: '100%',
    alignSelf: 'flex-start',
    '& .MuiChip-label': {
      px: { xs: 0.35, sm: 0.4, md: 0.5, lg: 0.35 },
      fontSize: { xs: '0.55rem', sm: '0.58rem', md: '0.62rem', lg: '0.52rem' },
      lineHeight: 1.1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  }
  const labelSx = {
    fontSize: { xs: '0.58rem', sm: '0.62rem', md: '0.68rem', lg: '0.52rem' },
    lineHeight: 1.15,
    color: 'text.secondary',
    display: 'block',
  }
  const valueSx = {
    fontSize: { xs: '0.65rem', sm: '0.68rem', md: '0.76rem', lg: '0.58rem' },
    lineHeight: 1.2,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    wordBreak: 'break-word',
  }
  return (
    <Paper
      component={detailTo ? RouterLink : 'div'}
      {...(detailTo ? { to: detailTo } : {})}
      variant="outlined"
      title={detailTo ? 'Ver detalle de entrega' : undefined}
      sx={{
        width: '100%',
        /** En móvil: altura según contenido. En md+: cuadrado compacto (6 col en lg). */
        aspectRatio: { xs: 'unset', md: '1 / 1' },
        minWidth: 0,
        borderRadius: { xs: 1, sm: 1.25, md: 1.35, lg: 1 },
        p: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
        textDecoration: 'none',
        color: 'inherit',
        ...(borderAccent ? { borderColor: borderAccent, borderWidth: 2 } : {}),
        ...(detailTo
          ? {
              cursor: 'pointer',
              transition: 'box-shadow 0.2s, border-color 0.2s',
              '&:hover': {
                boxShadow: 2,
                borderColor: borderAccent || 'primary.main',
              },
            }
          : {}),
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          px: { xs: 0.5, sm: 0.65, md: 0.75, lg: 0.45 },
          py: { xs: 0.35, sm: 0.45, md: 0.5, lg: 0.35 },
          bgcolor: headerPalette.bg,
          color: headerPalette.color,
        }}
      >
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontSize: { xs: '0.55rem', sm: '0.58rem', md: '0.6rem', lg: '0.5rem' },
            lineHeight: 1.15,
            opacity: 0.9,
            mb: 0.1,
          }}
        >
          Nota de venta
        </Typography>
        <Typography
          component="span"
          title={orderNo}
          sx={{
            color: 'inherit',
            fontWeight: 700,
            fontFamily: 'monospace',
            fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.72rem', lg: '0.58rem' },
            lineHeight: 1.15,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            wordBreak: 'break-word',
            overflow: 'hidden',
          }}
        >
          {orderNo}
        </Typography>
      </Box>
      <Box
        sx={{
          flex: { xs: 'none', md: 1 },
          minHeight: { md: 0 },
          p: { xs: 0.45, sm: 0.55, md: 0.65, lg: 0.4 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: { xs: 'flex-start', md: 'space-between' },
          gap: { xs: 0.2, sm: 0.28, md: 0.3, lg: 0.2 },
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={labelSx}>
            Entrega
          </Typography>
          <Typography
            component="div"
            fontFamily="monospace"
            fontWeight={700}
            title={row.deliveryNumber || ''}
            sx={{
              fontSize: { xs: '0.62rem', sm: '0.65rem', md: '0.68rem', lg: '0.56rem' },
              lineHeight: 1.15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.deliveryNumber || '—'}
          </Typography>
          <DeliveryStatusChip row={row} sx={chipSx} />
        </Box>
        <Box sx={{ minWidth: 0, mt: { xs: 0.35, md: 'auto' } }}>
          {showRepartidorColumn ? (
            <>
              <Typography variant="caption" sx={labelSx}>
                Repartidor
              </Typography>
              <Typography
                variant="caption"
                title={repartidorLabel(row)}
                sx={{ ...valueSx, WebkitLineClamp: { xs: 2, lg: 1 } }}
              >
                {repartidorLabel(row)}
              </Typography>
            </>
          ) : null}
        </Box>
      </Box>
    </Paper>
  )
}

export function RepartidorDeliveriesList({ embedded = false }) {
  const theme = useTheme()
  const isCompact = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))
  const { canViewPath, user } = useAuth()
  const canViewAllDeliveries = Boolean(user?.rbac?.fullAccess)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dateField, setDateField] = useState('created')
  const [repartidorId, setRepartidorId] = useState('')
  const [repartidores, setRepartidores] = useState([])

  const [repartirOpen, setRepartirOpen] = useState(false)
  const [repartirNota, setRepartirNota] = useState('')
  const [repartirOrder, setRepartirOrder] = useState(null)
  const [repartirError, setRepartirError] = useState('')
  const [repartirSearchLoading, setRepartirSearchLoading] = useState(false)
  const [repartirAddLoading, setRepartirAddLoading] = useState(false)
  const [repartirSuccess, setRepartirSuccess] = useState('')
  const [listViewMode, setListViewMode] = useState(getInitialListViewMode)
  const [filtersOpen, setFiltersOpen] = useState(false)

  /** En móvil solo hay vista cards; al entrar en compacto se fuerza y se oculta el toggle. */
  useEffect(() => {
    if (isCompact) setListViewMode('cards')
  }, [isCompact])

  useEffect(() => {
    if (!canViewAllDeliveries) return
    let cancelled = false
    ;(async () => {
      const res = await getUsers({ role: 'repartidor', activeOnly: true })
      if (!cancelled && res.success) {
        setRepartidores(res.data || [])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [canViewAllDeliveries])

  const deliveryFilterUserId = useMemo(() => {
    if (canViewAllDeliveries) return repartidorId || undefined
    return user?.id || undefined
  }, [canViewAllDeliveries, repartidorId, user?.id])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await listDeliveries({
      status: statusFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      dateField: dateField || undefined,
      deliveredByUserId: deliveryFilterUserId,
      page: page + 1,
      limit: rowsPerPage,
    })
    if (!res.success) {
      setError(res.error || 'Error al cargar')
      setRows([])
      setTotal(0)
    } else {
      setRows(res.data.rows || [])
      setTotal(res.data.total ?? 0)
    }
    setLoading(false)
  }, [statusFilter, dateFrom, dateTo, dateField, deliveryFilterUserId, page, rowsPerPage])

  useEffect(() => {
    load()
  }, [load])

  const handleClearFilters = () => {
    setStatusFilter('')
    setDateFrom('')
    setDateTo('')
    setDateField('created')
    if (canViewAllDeliveries) setRepartidorId('')
    setPage(0)
  }

  const openRepartir = () => {
    setRepartirOpen(true)
    setRepartirNota('')
    setRepartirOrder(null)
    setRepartirError('')
    setRepartirSuccess('')
  }

  const closeRepartir = () => {
    setRepartirOpen(false)
    setRepartirNota('')
    setRepartirOrder(null)
    setRepartirError('')
    setRepartirSuccess('')
    setRepartirSearchLoading(false)
    setRepartirAddLoading(false)
  }

  const handleRepartirSearch = async () => {
    const q = repartirNota.trim()
    if (!q) {
      setRepartirError('Ingresa el número de nota de venta.')
      return
    }
    setRepartirSearchLoading(true)
    setRepartirError('')
    setRepartirSuccess('')
    setRepartirOrder(null)
    const res = await searchOrders({ orderNumber: q, page: 1, limit: 25, sortBy: 'createdAt', sortOrder: 'DESC' })
    setRepartirSearchLoading(false)
    if (!res.success) {
      setRepartirError(res.error || 'Error al buscar la nota.')
      return
    }
    const list = res.data?.orders || []
    if (list.length === 0) {
      setRepartirError('No se encontró ninguna nota con ese número.')
      return
    }
    const qUp = q.toUpperCase()
    const exact = list.find((o) => o.orderNumber && String(o.orderNumber).toUpperCase() === qUp)
    let chosen = exact || null
    if (!chosen && list.length === 1) chosen = list[0]
    if (!chosen) {
      setRepartirError('Hay varias coincidencias. Escribe el número completo de la nota (ej. ORD-000123).')
      return
    }
    setRepartirSearchLoading(true)
    const detail = await getOrderById(chosen.id)
    setRepartirSearchLoading(false)
    if (!detail.success || !detail.data) {
      setRepartirError(detail.error || 'No se pudo cargar el detalle de la nota.')
      return
    }
    setRepartirOrder(detail.data)
  }

  const handleRepartirAddEntrega = async () => {
    if (!repartirOrder?.id) return
    setRepartirAddLoading(true)
    setRepartirError('')
    setRepartirSuccess('')
    const res = await createDelivery({
      orderId: repartirOrder.id,
      ...(user?.id ? { deliveredByUserId: user.id } : {}),
    })
    setRepartirAddLoading(false)
    if (!res.success) {
      setRepartirError(res.error || 'No se pudo registrar la entrega.')
      return
    }
    const folio = res.data?.deliveryNumber || res.data?.id || ''
    setRepartirSuccess(
      folio
        ? `Entrega registrada correctamente. Folio: ${folio}.`
        : 'Entrega registrada correctamente.',
    )
    setPage(0)
    const refresh = await listDeliveries({
      status: statusFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      dateField: dateField || undefined,
      deliveredByUserId: deliveryFilterUserId,
      page: 1,
      limit: rowsPerPage,
    })
    if (refresh.success) {
      setRows(refresh.data.rows || [])
      setTotal(refresh.data.total ?? 0)
    }
  }

  /** Campos del panel de filtros: ancho de celda en grid (móvil 2 col, sm+ auto-fill). */
  const filtersFieldSx = { width: '100%', minWidth: 0 }

  if (!canViewPath('/repartidor')) {
    return null
  }

  const listContent = (
    <>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          spacing={1}
          sx={{ mb: 2, rowGap: 1, columnGap: 1 }}
        >
          {!embedded ? (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
              <LocalShipping color="primary" sx={{ fontSize: { xs: 28, sm: 32 }, flexShrink: 0 }} />
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
                Repartidor — entregas
              </Typography>
            </Stack>
          ) : null}
          {!isCompact && (
            <ToggleButtonGroup
              size="small"
              value={listViewMode}
              exclusive
              onChange={(_, v) => {
                if (v != null) setListViewMode(v)
              }}
              aria-label="Vista del listado"
              sx={{
                alignSelf: 'center',
                '& .MuiToggleButton-root': {
                  py: 0.5,
                  touchAction: 'manipulation',
                },
              }}
            >
              <ToggleButton value="table" aria-label="Tabla">
                <ViewList sx={{ fontSize: 18, mr: 0.5 }} />
                Tabla
              </ToggleButton>
              <ToggleButton value="cards" aria-label="Cards">
                <ViewModule sx={{ fontSize: 18, mr: 0.5 }} />
                Cards
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          {isCompact ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1,
                width: '100%',
              }}
            >
              <IconButton
                id="entregas-filtros-toggle"
                color="primary"
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
                aria-controls="entregas-filtros-panel"
                aria-label={filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
                sx={{
                  flexShrink: 0,
                  width: 44,
                  height: 44,
                  touchAction: 'manipulation',
                  border: 1,
                  borderColor: filtersOpen ? 'primary.main' : 'divider',
                  bgcolor: filtersOpen ? 'primary.main' : 'background.paper',
                  color: filtersOpen ? 'primary.contrastText' : 'primary.main',
                  '&:hover': {
                    bgcolor: filtersOpen ? 'primary.dark' : 'action.hover',
                    borderColor: filtersOpen ? 'primary.dark' : 'divider',
                  },
                }}
              >
                <FilterList />
              </IconButton>
              <Button
                variant="contained"
                color="secondary"
                size="small"
                startIcon={<LocalShipping sx={{ fontSize: 18 }} />}
                onClick={openRepartir}
                sx={{
                  flexShrink: 0,
                  width: 'auto',
                  minWidth: 'unset',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  lineHeight: 1.2,
                  py: 0.65,
                  px: 1.25,
                  touchAction: 'manipulation',
                  whiteSpace: 'nowrap',
                  '& .MuiButton-startIcon': {
                    mr: 0.5,
                    ml: -0.25,
                  },
                }}
              >
                Agregar Nota Venta
              </Button>
            </Box>
          ) : (
            <>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<FilterList />}
                endIcon={
                  <ExpandMore
                    sx={{
                      transition: 'transform 0.2s',
                      transform: filtersOpen ? 'rotate(180deg)' : 'none',
                    }}
                  />
                }
                onClick={() => setFiltersOpen((o) => !o)}
                aria-expanded={filtersOpen}
                aria-controls="entregas-filtros-panel"
                id="entregas-filtros-toggle"
                sx={{
                  alignSelf: 'center',
                  py: 0.75,
                  touchAction: 'manipulation',
                  flexShrink: 0,
                }}
              >
                Filtros
              </Button>
              <Box sx={{ flexGrow: 1, minWidth: 8 }} />
              <Button
                variant="contained"
                color="secondary"
                startIcon={<LocalShipping />}
                onClick={openRepartir}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  py: 1,
                  flexShrink: 0,
                  touchAction: 'manipulation',
                }}
              >
                Agregar Nota Venta
              </Button>
            </>
          )}
        </Stack>

        <Collapse in={filtersOpen} timeout="auto" unmountOnExit={false}>
          <Paper
            id="entregas-filtros-panel"
            role="region"
            aria-labelledby="entregas-filtros-toggle"
            elevation={2}
            sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}
          >
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
              Filtros
            </Typography>
            <Stack direction="column" spacing={2}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    sm: 'repeat(auto-fill, minmax(200px, 1fr))',
                  },
                  gap: { xs: 1.25, sm: 2 },
                  alignItems: 'stretch',
                }}
              >
                <TextField
                  size="small"
                  label="Desde"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setPage(0)
                    setDateFrom(e.target.value)
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={filtersFieldSx}
                />
                <TextField
                  size="small"
                  label="Hasta"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setPage(0)
                    setDateTo(e.target.value)
                  }}
                  InputLabelProps={{ shrink: true }}
                  sx={filtersFieldSx}
                />
                <FormControl size="small" sx={filtersFieldSx}>
                  <InputLabel id="entregas-fecha-tipo">Tipo de fecha</InputLabel>
                  <Select
                    labelId="entregas-fecha-tipo"
                    label="Tipo de fecha"
                    value={dateField}
                    onChange={(e) => {
                      setPage(0)
                      setDateField(e.target.value)
                    }}
                  >
                    {DATE_FIELD_OPTIONS.map((o) => (
                      <MenuItem key={o.value} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={filtersFieldSx}>
                  <InputLabel id="entregas-filtro-estado">Estatus</InputLabel>
                  <Select
                    labelId="entregas-filtro-estado"
                    label="Estatus"
                    value={statusFilter}
                    onChange={(e) => {
                      setPage(0)
                      setStatusFilter(e.target.value)
                    }}
                  >
                    {STATUS_FILTER_OPTIONS.map((o) => (
                      <MenuItem key={o.value || 'all'} value={o.value}>
                        {o.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {canViewAllDeliveries ? (
                  <FormControl
                    size="small"
                    sx={{
                      ...filtersFieldSx,
                      gridColumn: { xs: '1 / -1', sm: 'auto' },
                    }}
                  >
                    <InputLabel id="entregas-repartidor">Repartidor</InputLabel>
                    <Select
                      labelId="entregas-repartidor"
                      label="Repartidor"
                      value={repartidorId}
                      onChange={(e) => {
                        setPage(0)
                        setRepartidorId(e.target.value)
                      }}
                    >
                      <MenuItem value="">
                        <em>Todos</em>
                      </MenuItem>
                      {repartidores.map((u) => (
                        <MenuItem key={u.id} value={u.id}>
                          {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : null}
              </Box>
              <Stack
                direction="row"
                spacing={{ xs: 1, sm: 1 }}
                sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: { xs: 'stretch', sm: 'flex-start' } }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleClearFilters}
                  disabled={loading}
                  sx={{
                    flex: { xs: 1, sm: 'unset' },
                    maxWidth: { sm: 200 },
                    py: { xs: 0.45, sm: 0.65 },
                    px: { xs: 1, sm: 1.5 },
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    textTransform: 'none',
                    touchAction: 'manipulation',
                  }}
                >
                  Limpiar
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={load}
                  disabled={loading}
                  sx={{
                    flex: { xs: 1, sm: 'unset' },
                    maxWidth: { sm: 200 },
                    py: { xs: 0.45, sm: 0.65 },
                    px: { xs: 1, sm: 1.5 },
                    fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                    textTransform: 'none',
                    touchAction: 'manipulation',
                  }}
                >
                  Actualizar
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Collapse>

        {error && (
          <Alert severity="error" sx={{ mb: 2, '& .MuiAlert-message': { overflow: 'hidden', wordBreak: 'break-word' } }}>
            {error}
            {/Cannot GET|404|localhost:5173/i.test(error) ? (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Si configuraste <code>VITE_API_URL=http://localhost:3000/api/v1</code>, detén y vuelve a ejecutar{' '}
                <code>npm run dev</code> para que Vite cargue el <code>.env</code>. Si usas{' '}
                <code>VITE_API_URL=/api/v1</code>, las peticiones pasan por el proxy de Vite al puerto 3000: revisa{' '}
                <code>VITE_DEV_PROXY_TARGET</code> en <code>.env</code>.
              </Typography>
            ) : null}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : listViewMode === 'cards' ? (
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            {rows.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: 'repeat(2, minmax(0, 1fr))',
                    sm: 'repeat(3, minmax(0, 1fr))',
                    md: 'repeat(4, minmax(0, 1fr))',
                    lg: 'repeat(8, minmax(0, 1fr))',
                    xl: 'repeat(10, minmax(0, 1fr))',
                  },
                  gap: { xs: 0.75, sm: 0.9, md: 1, lg: 0.65, xl: 0.6 },
                  p: { xs: 0.75, sm: 1, md: 1.25, lg: 0.85, xl: 0.85 },
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {rows.map((r) => (
                  <DeliveryCompactCard key={r.id} row={r} showRepartidorColumn={canViewAllDeliveries} />
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  py: 4,
                  px: 2,
                  textAlign: 'center',
                  color: 'text.secondary',
                }}
              >
                {error
                  ? 'Sin datos. Revisa el mensaje de error arriba.'
                  : 'No hay entregas con estos criterios.'}
              </Box>
            )}
            <TablePagination
              component="div"
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10))
                setPage(0)
              }}
              labelRowsPerPage="Filas"
              labelDisplayedRows={({ from, to, count: c }) => `${from}–${to} de ${c !== -1 ? c : `más de ${to}`}`}
              sx={paginationToolbarSx}
            />
          </Paper>
        ) : (
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <TableContainer
              sx={{
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                maxWidth: '100%',
                mx: { xs: -0.5, sm: 0 },
              }}
            >
              <Table size="small" stickyHeader sx={deliveriesTableSx}>
                <TableHead>
                  <DeliveriesTableHeadRow showRepartidorColumn={canViewAllDeliveries} />
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={deliveriesTableColCount(canViewAllDeliveries)}
                        align="center"
                        sx={{
                          py: 4,
                          color: 'text.secondary',
                          borderBottom: 'none',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {error
                          ? 'Sin datos. Revisa el mensaje de error arriba.'
                          : 'No hay entregas con estos criterios.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r) => (
                      <TableRow key={r.id} hover>
                        <TableCell
                          sx={{
                            display: { xs: 'none', sm: 'table-cell' },
                            maxWidth: { sm: 100 },
                          }}
                        >
                          <Typography
                            component="span"
                            fontWeight={600}
                            fontFamily="monospace"
                            sx={{ fontSize: 'inherit', wordBreak: 'break-all' }}
                          >
                            {r.deliveryNumber || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell
                          sx={{
                            minWidth: { xs: 176, sm: 'auto' },
                            width: { xs: '46%', sm: 'auto' },
                            maxWidth: { xs: 'none', sm: 140 },
                          }}
                        >
                          <Link
                            component={RouterLink}
                            to={`/repartidor?folio=${encodeURIComponent(r.orderNumber || '')}`}
                            underline="hover"
                            fontWeight={600}
                            color="primary"
                            display="inline-block"
                            sx={{
                              wordBreak: 'break-word',
                              fontSize: 'inherit',
                              lineHeight: 1.25,
                            }}
                          >
                            {r.orderNumber || '—'}
                          </Link>
                        </TableCell>
                        {canViewAllDeliveries ? (
                          <TableCell sx={{ maxWidth: { xs: 72, sm: 160 } }}>
                            <Typography component="span" sx={{ fontSize: 'inherit', lineHeight: 1.25 }}>
                              {repartidorLabel(r)}
                            </Typography>
                          </TableCell>
                        ) : null}
                        <TableCell sx={{ whiteSpace: 'nowrap', width: { xs: '24%', sm: 'auto' } }}>
                          <Box component="span" sx={{ fontSize: 'inherit' }}>
                            {formatDate(r.deliveredAt)}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ width: { xs: '18%', sm: 'auto' } }}>
                          <DeliveryStatusChip
                            row={r}
                            sx={{
                              height: { xs: 18, sm: 24 },
                              maxWidth: '100%',
                              '& .MuiChip-label': {
                                px: { xs: 0.35, sm: 0.75 },
                                fontSize: { xs: '0.52rem', sm: '0.75rem' },
                                lineHeight: 1.1,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              },
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10))
                setPage(0)
              }}
              labelRowsPerPage="Filas"
              labelDisplayedRows={({ from, to, count: c }) => `${from}–${to} de ${c !== -1 ? c : `más de ${to}`}`}
              sx={paginationToolbarSx}
            />
          </Paper>
        )}

        <Dialog
          open={repartirOpen}
          onClose={closeRepartir}
          maxWidth="md"
          fullWidth
          fullScreen={isSmallScreen}
          scroll="paper"
          PaperProps={{
            sx: {
              borderRadius: isSmallScreen ? 0 : '12px',
              overflow: 'hidden',
              m: isSmallScreen ? 0 : undefined,
              maxHeight: isSmallScreen ? '100%' : undefined,
            },
          }}
        >
          <ModalHeader title="Agregar Nota Venta" onClose={closeRepartir} />
          <DialogContent
            sx={{
              px: { xs: 2, sm: 3 },
              pb: { xs: 'max(16px, env(safe-area-inset-bottom, 0px))', sm: 3 },
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Busca una nota de venta por su número y regístrala como entrega.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                flexWrap: 'wrap',
                gap: 1.5,
                alignItems: { xs: 'stretch', sm: 'flex-start' },
                mb: 2,
              }}
            >
              <TextField
                label="Número de nota de venta"
                placeholder="Ej. ORD-000123"
                size="small"
                value={repartirNota}
                onChange={(e) => setRepartirNota(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRepartirSearch()
                }}
                sx={{ flex: 1, width: { xs: '100%', sm: 'auto' }, minWidth: { xs: 0, sm: 220 } }}
              />
              <Button
                variant="contained"
                onClick={handleRepartirSearch}
                disabled={repartirSearchLoading}
                fullWidth={isSmallScreen}
                sx={{
                  mt: { xs: 0, sm: 0.5 },
                  alignSelf: { xs: 'stretch', sm: 'flex-start' },
                  py: { xs: 1.25, sm: 1 },
                  touchAction: 'manipulation',
                }}
              >
                Buscar
              </Button>
            </Box>
            {repartirSearchLoading && !repartirOrder && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress size={32} />
              </Box>
            )}
            {repartirError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRepartirError('')}>
                {repartirError}
              </Alert>
            )}
            {repartirSuccess && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setRepartirSuccess('')}>
                {repartirSuccess}
              </Alert>
            )}
            {repartirOrder && !repartirSearchLoading && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  {repartirOrder.orderNumber || 'Nota de venta'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} component="div">
                  Cliente: {getClientDisplayOrder(repartirOrder)} · Fecha: {formatOrderDateShort(repartirOrder.createdAt)} ·
                  Estado:{' '}
                  <Box component="span" sx={{ color: getOrderStatusColor(repartirOrder.status), fontWeight: 600 }}>
                    {getOrderStatusLabel(repartirOrder.status)}
                  </Box>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Total: <strong>{formatCurrencyOrder(repartirOrder.totalAmount, repartirOrder.currency)}</strong> · Canal:{' '}
                  {getSalesChannelLabelOrder(repartirOrder.salesChannel)}
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Productos ({(repartirOrder.items || []).length})
                </Typography>
                <TableContainer
                  sx={{
                    mb: 2,
                    maxWidth: '100%',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Table size="small" sx={{ minWidth: { xs: 280, sm: 400 } }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Producto / SKU</TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                          Cant.
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                          Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(repartirOrder.items || []).slice(0, 12).map((item) => (
                        <TableRow key={item.id || item.productId}>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, maxWidth: { xs: 140, sm: 'none' } }}>
                            {item.productName || '-'} {item.productSku && `(${item.productSku})`}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {item.quantity ?? '-'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {formatCurrencyOrder(item.totalPrice, repartirOrder.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {(repartirOrder.items || []).length > 12 && (
                  <Typography variant="caption" color="text.secondary">
                    Mostrando 12 de {(repartirOrder.items || []).length} líneas.
                  </Typography>
                )}
                <Box
                  sx={{
                    mt: 2,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    alignItems: 'center',
                    flexDirection: { xs: 'column', sm: 'row' },
                  }}
                >
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    fullWidth={isSmallScreen}
                    startIcon={<LocalShipping />}
                    onClick={handleRepartirAddEntrega}
                    disabled={repartirAddLoading}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 700,
                      py: { xs: 1.25, sm: 1 },
                      touchAction: 'manipulation',
                    }}
                  >
                    Agregar a entrega
                  </Button>
                  {repartirAddLoading && <CircularProgress size={28} sx={{ alignSelf: 'center' }} />}
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions
            sx={{
              px: { xs: 2, sm: 3 },
              pb: { xs: 'max(12px, env(safe-area-inset-bottom, 0px))', sm: 2 },
              flexWrap: 'wrap',
            }}
          >
            <Button onClick={closeRepartir} color="inherit" sx={{ py: { xs: 1.25, sm: 1 }, touchAction: 'manipulation' }}>
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>
    </>
  )

  if (embedded) {
    return listContent
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginTop: '70px',
          pt: { xs: 1.25, sm: 1.5, md: 3 },
          pr: { xs: 'max(12px, env(safe-area-inset-right, 0px))', sm: 2, md: 3 },
          pb: { xs: 'max(16px, env(safe-area-inset-bottom, 0px))', md: 4 },
          pl: {
            xs: 'max(12px, env(safe-area-inset-left, 0px))',
            sm: 2,
            md: `${SIDEBAR_WIDTH + 32}px`,
          },
          minHeight: 'calc(100vh - 70px)',
        }}
      >
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
        {listContent}
      </Box>
    </Box>
  )
}

export default function EntregasRepartidor() {
  return <RepartidorDeliveriesList embedded={false} />
}
