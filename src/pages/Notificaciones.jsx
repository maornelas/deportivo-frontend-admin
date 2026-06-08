import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SIDEBAR_WIDTH } from '../config/layout'

import {
  Box,
  Button,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material'
import {
  Search as SearchIcon,
  TableRows as TableRowsIcon,
  ViewModule as ViewModuleIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotification,
} from '../api/notifications'
import { useAuth } from '../contexts/AuthContext'

const ROWS_PER_PAGE = 20

function fmtDate(v) {
  if (!v) return ''
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-MX')
}

function normalizePayloadObject(p) {
  if (p == null) return null
  if (typeof p === 'string') {
    try {
      const parsed = JSON.parse(p)
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : null
    } catch {
      return null
    }
  }
  if (typeof p === 'object' && !Array.isArray(p)) return p
  return null
}

const PAYLOAD_FIELD_LABELS = {
  orderId: 'ID de orden',
  orderNumber: 'Número de orden',
  totalAmount: 'Monto total',
  salesChannel: 'Canal de venta',
  quotationId: 'ID de cotización',
  quotationNumber: 'Número de cotización',
  purchaseId: 'ID de compra',
  purchaseNumber: 'Folio de compra',
  userId: 'ID de usuario',
  productId: 'ID de producto',
  deliveryId: 'ID de entrega',
  deliveryNumber: 'Folio de entrega',
}

function payloadFieldLabel(key) {
  if (PAYLOAD_FIELD_LABELS[key]) return PAYLOAD_FIELD_LABELS[key]
  const spaced = String(key)
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function formatPayloadFieldValue(key, value) {
  if (value == null) return '—'
  if (key === 'totalAmount' && (typeof value === 'number' || (typeof value === 'string' && value.trim() !== ''))) {
    const n = Number(value)
    if (!Number.isNaN(n)) {
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
    }
  }
  if (key === 'salesChannel' && typeof value === 'string') {
    const v = value.toLowerCase()
    if (v === 'advisor') return 'Asesor'
    if (v === 'online') return 'Online'
  }
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function payloadFieldEntries(p) {
  const obj = normalizePayloadObject(p)
  if (!obj || Object.keys(obj).length === 0) return []
  return Object.entries(obj).map(([key, value]) => ({
    key,
    label: payloadFieldLabel(key),
    value: formatPayloadFieldValue(key, value),
    multiline: typeof value === 'object' && value !== null,
  }))
}

function NotificationPayloadFields({ payload }) {
  const fields = payloadFieldEntries(payload)
  if (!fields.length) return null
  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
        Detalles
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {fields.map(({ key, label, value, multiline }) => (
          <TextField
            key={key}
            label={label}
            value={value}
            size="small"
            fullWidth
            InputProps={{ readOnly: true }}
            inputProps={{ 'aria-readonly': true }}
            multiline={multiline}
            minRows={multiline ? 2 : 1}
            maxRows={multiline ? 6 : 1}
          />
        ))}
      </Box>
    </Box>
  )
}

function NotificationChips({ n, dense, onPurple }) {
  const chipSx = dense
    ? { height: 22, '& .MuiChip-label': { px: 0.75, fontSize: '0.7rem' } }
    : {}
  const purpleSx = onPurple
    ? {
        color: 'common.white',
        borderColor: 'rgba(255,255,255,0.55)',
        bgcolor: 'rgba(255,255,255,0.12)',
        '& .MuiChip-label': { color: 'common.white' },
      }
    : {}
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: dense ? 0.5 : 1, flexWrap: 'wrap' }}>
      <Chip size="small" label={n.type} variant="outlined" sx={{ ...chipSx, ...purpleSx }} />
      {n.read ? (
        <Chip
          size="small"
          label="Leída"
          color={onPurple ? undefined : 'success'}
          variant="outlined"
          sx={{
            ...chipSx,
            ...(onPurple
              ? {
                  ...purpleSx,
                  borderColor: 'rgba(200,255,220,0.7)',
                  bgcolor: 'rgba(255,255,255,0.1)',
                }
              : {}),
          }}
        />
      ) : null}
    </Box>
  )
}

export default function Notificaciones() {
  const { canViewPath } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const highlightId = searchParams.get('id') || ''

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [viewMode, setViewMode] = useState(() => {
    try {
      const v = localStorage.getItem('admin_notif_view')
      if (v === 'grid') return 'grid'
    } catch {
      /* ignore */
    }
    return 'table'
  })

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailNotif, setDetailNotif] = useState(null)
  const openedHighlightRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400)
    return () => clearTimeout(t)
  }, [searchInput])

  useEffect(() => {
    setPage(0)
  }, [debouncedSearch])

  useEffect(() => {
    try {
      localStorage.setItem('admin_notif_view', viewMode)
    } catch {
      /* ignore */
    }
  }, [viewMode])

  useEffect(() => {
    openedHighlightRef.current = null
  }, [highlightId])

  const load = useCallback(async () => {
    if (!canViewPath('/notificaciones')) return
    setLoading(true)
    setError('')
    const r = await listNotifications({
      page: page + 1,
      limit: ROWS_PER_PAGE,
      search: debouncedSearch || undefined,
    })
    setLoading(false)
    if (!r.success) {
      setError(r.error || 'Error')
      setItems([])
      setTotal(0)
      return
    }
    setItems(r.data.items || [])
    setTotal(r.data.total ?? 0)
  }, [canViewPath, page, debouncedSearch])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!highlightId) return
    let cancelled = false
    ;(async () => {
      const r = await getNotification(highlightId)
      if (cancelled || !r.success || !r.data) return
      setItems((prev) => {
        if (prev.some((p) => p.id === r.data.id)) return prev
        return [r.data, ...prev]
      })
    })()
    return () => {
      cancelled = true
    }
  }, [highlightId])

  useEffect(() => {
    if (!highlightId || loading) return
    if (openedHighlightRef.current === highlightId) return
    const n = items.find((x) => x.id === highlightId)
    if (!n) return
    openedHighlightRef.current = highlightId
    void (async () => {
      if (!n.read) await markNotificationRead(n.id)
      setDetailNotif(n)
      setDetailOpen(true)
      load()
    })()
  }, [highlightId, loading, items, load])

  useEffect(() => {
    if (!highlightId || loading) return
    const t = setTimeout(() => {
      const el = document.getElementById(`notif-${highlightId}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 200)
    return () => clearTimeout(t)
  }, [highlightId, loading, items])

  const openDetail = async (n) => {
    setDetailNotif(n)
    setDetailOpen(true)
    if (!n.read) {
      await markNotificationRead(n.id)
      load()
    }
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setDetailNotif(null)
  }

  const onReadAll = async () => {
    const r = await markAllNotificationsRead()
    if (r.success) load()
  }

  const clearHighlight = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('id')
    setSearchParams(next, { replace: true })
  }

  if (!canViewPath('/notificaciones')) {
    return null
  }

  const hasPayloadFields = detailNotif ? payloadFieldEntries(detailNotif.payload).length > 0 : false

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold' }}>
            Notificaciones
          </Typography>
          <Button variant="outlined" onClick={onReadAll} disabled={loading || total === 0}>
            Marcar todas como leídas
          </Button>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Buscar por título, mensaje o tipo…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && setDebouncedSearch(searchInput.trim())}
              sx={{ flex: 1, minWidth: 220 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(_, v) => v && setViewMode(v)}
              aria-label="Vista de notificaciones"
            >
              <ToggleButton value="table" aria-label="Tabla">
                <TableRowsIcon fontSize="small" sx={{ mr: 0.5 }} />
                Tabla
              </ToggleButton>
              <ToggleButton value="grid" aria-label="Tarjetas">
                <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} />
                Tarjetas
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          {highlightId ? (
            <Alert severity="info" sx={{ mt: 2 }} onClose={clearHighlight}>
              Mostrando la notificación seleccionada. Puede cerrar este aviso para quitar el resaltado.
            </Alert>
          ) : null}
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper>
          {loading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ py: 4, px: 2, color: 'text.secondary' }}>
              {debouncedSearch ? 'No hay resultados para la búsqueda.' : 'No hay notificaciones.'}
            </Box>
          ) : viewMode === 'table' ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Título / vista previa</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((n) => (
                    <TableRow
                      key={n.id}
                      id={`notif-${n.id}`}
                      hover
                      onClick={() => void openDetail(n)}
                      sx={{
                        cursor: 'pointer',
                        bgcolor: n.read ? 'inherit' : 'action.hover',
                        ...(highlightId && n.id === highlightId
                          ? { boxShadow: (t) => `inset 0 0 0 2px ${t.palette.primary.main}` }
                          : {}),
                      }}
                    >
                      <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>{fmtDate(n.createdAt)}</TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        <Chip size="small" label={n.type} variant="outlined" />
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        <Typography variant="body2" fontWeight={600}>
                          {n.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {(n.message || '').slice(0, 120)}
                          {(n.message || '').length > 120 ? '…' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        {n.read ? (
                          <Chip size="small" label="Leída" color="success" variant="outlined" />
                        ) : (
                          <Chip size="small" label="Nueva" color="primary" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 1.5 }}>
              <Grid container spacing={1.25}>
                {items.map((n) => (
                  <Grid key={n.id} size={{ xs: 6, sm: 4, md: 3, lg: 2 }}>
                    <Card
                      id={`notif-${n.id}`}
                      variant="outlined"
                      sx={{
                        height: '100%',
                        ...(highlightId && n.id === highlightId
                          ? { boxShadow: (t) => `0 0 0 2px ${t.palette.primary.main}` }
                          : {}),
                      }}
                    >
                      <CardActionArea
                        onClick={() => void openDetail(n)}
                        sx={{
                          height: '100%',
                          alignItems: 'stretch',
                          bgcolor: n.read ? 'background.paper' : 'action.hover',
                        }}
                      >
                        <CardContent
                          sx={{
                            p: 1,
                            '&:last-child': { pb: 1 },
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            minHeight: 112,
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{
                              fontSize: '0.8rem',
                              lineHeight: 1.25,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {n.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              lineHeight: 1.2,
                              flex: 1,
                            }}
                          >
                            {n.message || '—'}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 0.5, mt: 'auto' }}>
                            <NotificationChips n={n} dense />
                          </Box>
                          <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                            {fmtDate(n.createdAt)}
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          {!loading && total > ROWS_PER_PAGE ? (
            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={ROWS_PER_PAGE}
              rowsPerPageOptions={[ROWS_PER_PAGE]}
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          ) : null}
        </Paper>

        <Dialog open={detailOpen} onClose={closeDetail} maxWidth="sm" fullWidth scroll="paper">
          <DialogTitle
            sx={{
              position: 'relative',
              pr: 6,
              pt: 2,
              pb: 2,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 1,
              bgcolor: '#7B2CBF',
              color: 'common.white',
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: 'common.white' }}>
                {detailNotif?.title}
              </Typography>
              {detailNotif ? (
                <Box sx={{ mt: 1 }}>
                  <NotificationChips n={detailNotif} onPurple />
                </Box>
              ) : null}
            </Box>
            <IconButton
              aria-label="Cerrar"
              onClick={closeDetail}
              size="small"
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'common.white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.14)' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {detailNotif ? (
              <>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                  {fmtDate(detailNotif.createdAt)}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {detailNotif.message}
                </Typography>
                {hasPayloadFields ? <NotificationPayloadFields payload={detailNotif.payload} /> : null}
              </>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDetail}>Cerrar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}
