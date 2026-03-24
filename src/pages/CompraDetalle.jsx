import { useEffect, useMemo, useState } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  List,
  ListItem,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  ArrowBack as BackIcon,
  Delete as DeleteIcon,
  Remove as RemoveQtyIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { getBrands, getCarModelsByBrand } from '../api/products'
import { downloadPurchaseNotePdf } from '../compras/purchaseNotePdf'
import { useAuth } from '../contexts/AuthContext'
import { usePurchases } from '../contexts/PurchasesContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'
import { showBrowserNotificationIfAllowed } from '../utils/browserPush'
import { PAYMENT_OPTIONS, formatDateValue, matchBrandIdFromName, safeTrim } from '../compras/shared'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const PART_TYPE_OPTIONS = [
  { value: 'ORIGINAL', label: 'Original' },
  { value: 'GENÉRICO', label: 'Genérica' },
]

const PART_STATE_OPTIONS = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'SEMINUEVO', label: 'Seminueva' },
]

const sectionHeaderSx = {
  bgcolor: '#757575',
  color: '#fff',
  py: 1.25,
  px: 2,
  borderBottom: '1px solid',
  borderColor: '#616161',
}

function formatMoney(n, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(n) || 0)
}

function partTypeLabel(v) {
  return v === 'GENÉRICO' ? 'Genérica' : 'Original'
}

function partConditionLabel(v) {
  return v === 'SEMINUEVO' ? 'Seminueva' : 'Nuevo'
}

function lineSubtotal(l) {
  const q = Math.max(1, parseInt(l.quantity, 10) || 1)
  return Math.round(Number(l.unitPrice || 0) * q * 100) / 100
}

function mapItemsToLines(items) {
  if (!items || !items.length) return []
  return items.map((it) => ({
    key: it.key || crypto.randomUUID(),
    productId: it.productId ?? null,
    productName: it.productName,
    sku: it.sku || '',
    partType: it.partType === 'GENÉRICO' ? 'GENÉRICO' : 'ORIGINAL',
    partCondition: it.partCondition === 'SEMINUEVO' ? 'SEMINUEVO' : 'NUEVO',
    unitPrice: Number(it.unitPrice || 0),
    quantity: Number(it.quantity || 1),
  }))
}

export default function CompraDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { purchases, updatePurchase, removePurchase } = usePurchases()
  const { canDoAction, user } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false)

  const [editorProvider, setEditorProvider] = useState('')
  const [editorPurchaseDate, setEditorPurchaseDate] = useState('')
  const [editorPaymentMethod, setEditorPaymentMethod] = useState('transfer')
  const [editorStatus, setEditorStatus] = useState('pending')
  const [editorNotes, setEditorNotes] = useState('')
  const [receiptFileName, setReceiptFileName] = useState('')

  const [brands, setBrands] = useState([])
  const [carModels, setCarModels] = useState([])
  const [filterBrandId, setFilterBrandId] = useState('')
  const [filterModel, setFilterModel] = useState('')
  const [filterYear, setFilterYear] = useState('')

  const [lines, setLines] = useState([])

  const [draftName, setDraftName] = useState('')
  const [draftPartType, setDraftPartType] = useState('ORIGINAL')
  const [draftPartCondition, setDraftPartCondition] = useState('NUEVO')
  const [draftUnitPrice, setDraftUnitPrice] = useState('')

  const purchase = useMemo(
    () => purchases.find((p) => String(p.id) === String(id)),
    [purchases, id],
  )

  const vehicleBrandName = useMemo(
    () => (brands.find((b) => b.id === filterBrandId)?.name || '').trim(),
    [brands, filterBrandId],
  )

  const totals = useMemo(() => {
    const gross = lines.reduce((s, l) => s + Number(l.unitPrice || 0) * Math.max(1, parseInt(l.quantity, 10) || 1), 0)
    const subtotal = Math.round(gross * 100) / 100
    const tax = Math.round(subtotal * 0.16 * 100) / 100
    const total = Math.round((subtotal + tax) * 100) / 100
    return { subtotal, tax, total }
  }, [lines])

  const totalPiezas = useMemo(
    () => lines.reduce((s, l) => s + Math.max(1, parseInt(l.quantity, 10) || 1), 0),
    [lines],
  )

  const summaryVehicle = useMemo(() => {
    const parts = [vehicleBrandName, filterModel?.trim(), filterYear?.trim()].filter(Boolean)
    return parts.length ? parts.join(' - ') : ''
  }, [vehicleBrandName, filterModel, filterYear])

  const canEdit = canDoAction(ACTION.COMPRAS_EDITAR)

  useEffect(() => {
    const ok =
      canDoAction(ACTION.COMPRAS_EDITAR, { requireWrite: false }) ||
      canDoAction(ACTION.COMPRAS_CREAR, { requireWrite: false }) ||
      canDoAction(ACTION.COMPRAS_ELIMINAR, { requireWrite: false })
    if (!ok) {
      showDenied()
      navigate('/compras', { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!id) {
      navigate('/compras', { replace: true })
      return
    }
    if (!purchase) {
      navigate('/compras', { replace: true })
    }
  }, [id, purchase, navigate])

  useEffect(() => {
    getBrands({ activeOnly: true }).then((r) => {
      if (r.success) setBrands(r.data || [])
    })
  }, [])

  useEffect(() => {
    if (!filterBrandId) {
      setCarModels([])
      setFilterModel('')
      return
    }
    getCarModelsByBrand(filterBrandId).then((r) => {
      if (r.success) setCarModels(r.data || [])
    })
  }, [filterBrandId])

  const rehydrateFormFromPurchase = (p) => {
    if (!p) return
    setEditorProvider(p.providerName || '')
    setEditorPurchaseDate(formatDateValue(p.purchaseDate))
    setEditorPaymentMethod(p.paymentMethod || 'transfer')
    setEditorStatus(p.status || 'pending')
    setEditorNotes(p.notes || '')
    setReceiptFileName(p.receiptFileName || '')
    const bid = p.vehicleBrandId || matchBrandIdFromName(brands, p.vehicleBrand)
    setFilterBrandId(bid || '')
    setFilterModel(p.vehicleModel || '')
    setFilterYear(p.vehicleYear || '')
    setLines(mapItemsToLines(p.items))
    setDraftName('')
    setDraftUnitPrice('')
  }

  useEffect(() => {
    if (!purchase) return
    rehydrateFormFromPurchase(purchase)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchase?.id])

  useEffect(() => {
    if (!purchase || brands.length === 0) return
    const bid = purchase.vehicleBrandId || matchBrandIdFromName(brands, purchase.vehicleBrand)
    if (bid) setFilterBrandId(bid)
  }, [brands, purchase])

  const updateLine = (key, patch) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const removeLine = (key) => setLines((prev) => prev.filter((l) => l.key !== key))

  const bumpQuantity = (key, delta) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const q = Math.max(1, (parseInt(l.quantity, 10) || 1) + delta)
        return { ...l, quantity: q }
      }),
    )
  }

  const setQuantity = (key, raw) => {
    const n = parseInt(String(raw), 10)
    const q = Number.isNaN(n) ? 1 : Math.max(1, n)
    updateLine(key, { quantity: q })
  }

  const addPieceFromDraft = () => {
    const name = safeTrim(draftName)
    if (!name) {
      setError('Indica el nombre de la pieza')
      return
    }
    const price = Number(draftUnitPrice)
    if (Number.isNaN(price) || price < 0) {
      setError('Indica un precio unitario válido')
      return
    }
    setError('')
    const row = {
      key: crypto.randomUUID(),
      productName: name,
      partType: draftPartType,
      partCondition: draftPartCondition,
      unitPrice: price,
      quantity: 1,
    }
    setLines((prev) => [...prev, row])
    setDraftName('')
    setDraftUnitPrice('')
  }

  const validate = () => {
    if (!safeTrim(editorProvider)) return 'Indica el proveedor'
    if (!editorPurchaseDate) return 'Indica la fecha de compra'
    const clean = lines.filter((l) => safeTrim(l.productName))
    if (clean.length < 1) return 'Agrega al menos una pieza'
    for (const l of clean) {
      if (!l.partType || !l.partCondition) return 'Completa tipo y estado en cada pieza'
      if (Number(l.unitPrice) < 0 || Number.isNaN(Number(l.unitPrice))) return 'Revisa los precios unitarios'
    }
    return ''
  }

  const buildPurchasePayload = () => {
    const msg = validate()
    if (msg) return { error: msg }
    const cleanLines = lines.filter((l) => safeTrim(l.productName))
    const payload = {
      id: purchase.id,
      providerName: editorProvider.trim(),
      purchaseDate: editorPurchaseDate,
      paymentMethod: editorPaymentMethod,
      status: editorStatus,
      notes: editorNotes || '',
      currency: purchase.currency || 'MXN',
      receiptFileName: receiptFileName || '',
      createdAt: purchase.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vehicleBrandId: filterBrandId || '',
      vehicleBrand: vehicleBrandName || '',
      vehicleModel: filterModel || '',
      vehicleYear: filterYear || '',
      items: cleanLines.map((l) => ({
        key: l.key,
        productId: l.productId ?? null,
        productName: l.productName.trim(),
        sku: l.sku || '',
        partType: l.partType,
        partCondition: l.partCondition,
        unitPrice: Number(l.unitPrice || 0),
        quantity: Math.max(1, parseInt(l.quantity, 10) || 1),
      })),
    }
    payload.total = totals.total
    return { payload }
  }

  const handleGenerarCompra = async () => {
    if (canEdit && !canDoAction(ACTION.COMPRAS_EDITAR)) {
      showDenied()
      return
    }
    const built = buildPurchasePayload()
    if (built.error) {
      setError(built.error)
      return
    }
    setError('')
    setLoading(true)
    try {
      if (canEdit) {
        updatePurchase(built.payload)
      }
      const registeredByDisplayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
      downloadPurchaseNotePdf(built.payload, totals, { registeredByDisplayName })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const openCancelCompraModal = () => {
    if (!canDoAction(ACTION.COMPRAS_ELIMINAR)) {
      showDenied()
      return
    }
    setDeleteConfirmOpen(true)
  }

  const closeDeleteConfirm = () => {
    if (deleteConfirmLoading) return
    setDeleteConfirmOpen(false)
  }

  const handleConfirmDelete = () => {
    if (!purchase) return
    if (!canDoAction(ACTION.COMPRAS_ELIMINAR)) {
      showDenied()
      closeDeleteConfirm()
      return
    }
    setDeleteConfirmLoading(true)
    setError('')
    try {
      removePurchase(purchase.id)
      setDeleteConfirmOpen(false)
      const providerLabel = purchase.providerName ? ` · ${purchase.providerName}` : ''
      const flash = `La compra se canceló correctamente${providerLabel}.`
      showBrowserNotificationIfAllowed('Compra cancelada', `La compra se eliminó del registro${providerLabel}.`)
      navigate('/compras', { replace: true, state: { flashSuccess: flash } })
    } finally {
      setDeleteConfirmLoading(false)
    }
  }

  if (!purchase) {
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
          pl: { xs: 2, sm: 3, md: `${SIDEBAR_WIDTH + 32}px` },
          pr: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 2, sm: 3, md: 4 },
          minHeight: { xs: '100vh', lg: 'calc(100vh - 70px)' },
          maxHeight: { xs: 'none', lg: 'calc(100vh - 70px)' },
          backgroundColor: '#fafafa',
          display: 'flex',
          flexDirection: 'column',
          overflow: { xs: 'visible', lg: 'hidden' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 1, flexShrink: 0 }}>
          <IconButton onClick={() => navigate('/compras')} size="small" aria-label="Volver">
            <BackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#424242', flex: 1, fontSize: { xs: '22px', md: '28px' } }}>
            Nota de compra
          </Typography>
          {canDoAction(ACTION.COMPRAS_ELIMINAR) ? (
            <IconButton
              onClick={openCancelCompraModal}
              color="error"
              size="small"
              aria-label="Eliminar compra"
              disabled={loading}
            >
              <DeleteIcon />
            </IconButton>
          ) : null}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2, fontFamily: 'monospace', flexShrink: 0 }}>
          ID: {purchase.id}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: { xs: 'visible', lg: 'hidden' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 2,
              flex: 1,
              minHeight: 0,
              alignItems: { xs: 'stretch', lg: 'stretch' },
            }}
          >
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                minHeight: { xs: 'auto', lg: 0 },
                overflowY: { xs: 'visible', lg: 'auto' },
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                pr: { lg: 0.5 },
              }}
            >
              <Paper sx={{ mb: 2, overflow: 'hidden' }} elevation={2}>
                <Box sx={sectionHeaderSx}>
                  <Typography variant="subtitle1" fontWeight={700} letterSpacing={0.3}>
                    Datos del Proveedor
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <TextField
                      label="Proveedor"
                      value={editorProvider}
                      onChange={(e) => setEditorProvider(e.target.value)}
                      size="small"
                      required
                      disabled={!canEdit}
                      sx={{ minWidth: 260, flex: 1 }}
                    />
                    <TextField
                      label="Fecha de compra"
                      type="date"
                      size="small"
                      value={editorPurchaseDate}
                      onChange={(e) => setEditorPurchaseDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      disabled={!canEdit}
                      sx={{ width: 180 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Estado del pago</InputLabel>
                      <Select
                        label="Estado del pago"
                        value={editorStatus}
                        onChange={(e) => setEditorStatus(e.target.value)}
                        disabled={!canEdit}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <MenuItem key={s.value} value={s.value}>
                            {s.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 220 }}>
                      <InputLabel>Método de pago</InputLabel>
                      <Select
                        label="Método de pago"
                        value={editorPaymentMethod}
                        onChange={(e) => setEditorPaymentMethod(e.target.value)}
                        disabled={!canEdit}
                      >
                        {PAYMENT_OPTIONS.map((p) => (
                          <MenuItem key={p.value} value={p.value}>
                            {p.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Notas"
                      size="small"
                      value={editorNotes}
                      onChange={(e) => setEditorNotes(e.target.value)}
                      disabled={!canEdit}
                      sx={{ flexBasis: '100%' }}
                      multiline
                      minRows={2}
                    />
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <Button variant="outlined" component="label" size="small" disabled={!canEdit}>
                      Subir recibo
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setReceiptFileName(file?.name || '')
                        }}
                      />
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      {receiptFileName ? `Documento: ${receiptFileName}` : 'Ningún documento seleccionado'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Paper sx={{ mb: 2, overflow: 'hidden' }} elevation={2}>
                <Box sx={sectionHeaderSx}>
                  <Typography variant="subtitle1" fontWeight={700} letterSpacing={0.3}>
                    Datos del Vehículo
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Opcional. Asocia la compra a una unidad (misma idea que en cotización).
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel>Marca</InputLabel>
                      <Select
                        label="Marca"
                        value={filterBrandId}
                        onChange={(e) => {
                          setFilterBrandId(e.target.value)
                          setFilterModel('')
                        }}
                        disabled={!canEdit}
                      >
                        <MenuItem value="">Sin especificar</MenuItem>
                        {brands.map((b) => (
                          <MenuItem key={b.id} value={b.id}>
                            {b.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 200 }} disabled={!filterBrandId || !canEdit}>
                      <InputLabel>Modelo</InputLabel>
                      <Select label="Modelo" value={filterModel} onChange={(e) => setFilterModel(e.target.value)} disabled={!canEdit}>
                        <MenuItem value="">Sin especificar</MenuItem>
                        {carModels.map((m) => (
                          <MenuItem key={m.id} value={m.model}>
                            {m.model}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Año"
                      size="small"
                      placeholder="2024"
                      value={filterYear}
                      onChange={(e) => setFilterYear(e.target.value)}
                      disabled={!canEdit}
                      sx={{ width: 110 }}
                      inputProps={{ maxLength: 32 }}
                    />
                  </Box>
                </Box>
              </Paper>

              <Paper sx={{ mb: 2, overflow: 'hidden' }} elevation={2}>
                <Box sx={sectionHeaderSx}>
                  <Typography variant="subtitle1" fontWeight={700} letterSpacing={0.3}>
                    Piezas a comprar
                  </Typography>
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Completa los datos y pulsa <strong>Agregar pieza</strong>; la pieza aparecerá en el resumen a la derecha.
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
                    <TextField
                      label="Nombre de la pieza"
                      size="small"
                      required
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                      disabled={!canEdit}
                      sx={{ flex: '1 1 240px', minWidth: 200 }}
                    />
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Tipo</InputLabel>
                      <Select label="Tipo" value={draftPartType} onChange={(e) => setDraftPartType(e.target.value)} disabled={!canEdit}>
                        {PART_TYPE_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Estado</InputLabel>
                      <Select label="Estado" value={draftPartCondition} onChange={(e) => setDraftPartCondition(e.target.value)} disabled={!canEdit}>
                        {PART_STATE_OPTIONS.map((o) => (
                          <MenuItem key={o.value} value={o.value}>
                            {o.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Precio unitario"
                      size="small"
                      type="number"
                      value={draftUnitPrice}
                      inputProps={{ min: 0, step: 0.01 }}
                      onChange={(e) => setDraftUnitPrice(e.target.value)}
                      disabled={!canEdit}
                      sx={{ width: 140 }}
                    />
                  </Box>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={addPieceFromDraft}
                    sx={{ mt: 2 }}
                    variant="contained"
                    color="secondary"
                    size="small"
                    disabled={!canEdit}
                  >
                    Agregar pieza
                  </Button>
                </Box>
              </Paper>
            </Box>

            <Box
              sx={{
                width: { xs: '100%', lg: 520 },
                minWidth: { lg: 480 },
                flexShrink: 0,
                display: 'flex',
                flexDirection: 'column',
                height: { xs: 'auto', lg: '100%' },
                maxHeight: { xs: 'none', lg: '100%' },
                minHeight: { xs: 'auto', lg: 0 },
                overflow: 'hidden',
              }}
            >
              <Paper
                sx={(theme) => ({
                  width: '100%',
                  flex: 1,
                  minHeight: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'grey.300',
                  boxShadow: theme.shadows[2],
                })}
                elevation={0}
              >
                <Box
                  sx={{
                    ...sectionHeaderSx,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    flexWrap: 'wrap',
                  }}
                >
                  <Badge badgeContent={totalPiezas} color="secondary" max={999} sx={{ '& .MuiBadge-badge': { bgcolor: '#fff', color: '#757575' } }}>
                    <ShoppingCartIcon sx={{ color: '#fff' }} />
                  </Badge>
                  <Typography variant="subtitle1" fontWeight={700} letterSpacing={0.3}>
                    Resumen de compra
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', ml: { xs: 0, sm: 1 } }}>
                    ({lines.length} {lines.length === 1 ? 'línea' : 'líneas'} · {totalPiezas} piezas)
                  </Typography>
                  {summaryVehicle ? (
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.95)',
                        fontWeight: 600,
                        ml: { xs: 0, sm: 'auto' },
                        width: { xs: '100%', sm: 'auto' },
                        textAlign: { xs: 'left', sm: 'right' },
                        pl: { xs: 0, sm: 1 },
                      }}
                    >
                      {summaryVehicle}
                    </Typography>
                  ) : null}
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    minHeight: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    p: 1.5,
                    pt: 1.5,
                  }}
                >
                  <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', mb: 1 }}>
                    {lines.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center', px: 1 }}>
                        Vacío. Usa «Agregar pieza» para añadir líneas al resumen.
                      </Typography>
                    ) : (
                      <List dense disablePadding>
                        {lines.map((l) => {
                          const sub = lineSubtotal(l)
                          const qty = Math.max(1, parseInt(l.quantity, 10) || 1)
                          return (
                            <ListItem
                              key={l.key}
                              sx={{
                                position: 'relative',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                mb: 0.75,
                                py: 0.75,
                                px: 1,
                                pr: canEdit ? 4.5 : 1,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              {canEdit ? (
                                <IconButton
                                  size="small"
                                  onClick={() => removeLine(l.key)}
                                  aria-label="Eliminar pieza"
                                  color="error"
                                  sx={{ position: 'absolute', top: 2, right: 2, p: 0.35 }}
                                >
                                  <DeleteIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              ) : null}
                              <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.25, fontSize: '0.8125rem', pr: canEdit ? 2 : 0 }}>
                                {l.productName}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                sx={{ mt: 0.125, mb: 0.35, lineHeight: 1.25, fontSize: '0.7rem' }}
                              >
                                {partTypeLabel(l.partType)} · {partConditionLabel(l.partCondition)}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.35, fontSize: '0.7rem' }}>
                                Precio u.: {formatMoney(l.unitPrice)}
                              </Typography>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  flexWrap: 'wrap',
                                  gap: 0.5,
                                  rowGap: 0.25,
                                }}
                              >
                                <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                                  Núm. piezas
                                </Typography>
                                {canEdit ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                    <IconButton size="small" sx={{ p: 0.25 }} onClick={() => bumpQuantity(l.key, -1)} aria-label="Menos unidades">
                                      <RemoveQtyIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                    <TextField
                                      size="small"
                                      value={qty}
                                      onChange={(e) => setQuantity(l.key, e.target.value)}
                                      inputProps={{
                                        min: 1,
                                        step: 1,
                                        style: { textAlign: 'center', width: 40, padding: '4px 0', fontSize: '0.8rem' },
                                      }}
                                      sx={{ width: 52, '& .MuiInputBase-input': { py: 0.35 } }}
                                    />
                                    <IconButton size="small" sx={{ p: 0.25 }} onClick={() => bumpQuantity(l.key, 1)} aria-label="Más unidades">
                                      <AddIcon sx={{ fontSize: 18 }} />
                                    </IconButton>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.8125rem' }}>
                                    {qty}
                                  </Typography>
                                )}
                                <Typography variant="body2" fontWeight={700} sx={{ ml: 'auto', fontSize: '0.8125rem' }}>
                                  {formatMoney(sub)}
                                </Typography>
                              </Box>
                            </ListItem>
                          )
                        })}
                      </List>
                    )}
                  </Box>

                  <Box sx={{ flexShrink: 0 }}>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.75 }}>
                      <Typography variant="body2" color="text.secondary">
                        Subtotal
                      </Typography>
                      <Typography variant="body1">{formatMoney(totals.subtotal)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.35 }}>
                      <Box sx={{ minWidth: 0, pr: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          IVA (16%)
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.35 }}>
                          Importe que se cobra por IVA
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={700}>
                        {formatMoney(totals.tax)}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, lineHeight: 1.35 }}>
                      16% × {formatMoney(totals.subtotal)} = {formatMoney(totals.tax)}
                    </Typography>
                    <Divider sx={{ my: 0.75 }} />
                    <Typography variant="h6" color="primary" sx={{ fontSize: '1.05rem', lineHeight: 1.3 }}>
                      Total: {formatMoney(totals.total)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
              <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                <Button
                  variant="contained"
                  disabled={loading}
                  onClick={handleGenerarCompra}
                  sx={{
                    width: '50%',
                    minWidth: 160,
                    py: 1.25,
                    bgcolor: '#7B2CBF',
                    '&:hover': { bgcolor: '#6A26A8' },
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Generar Compra'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Box>

        <Dialog
          open={deleteConfirmOpen}
          onClose={closeDeleteConfirm}
          disableEscapeKeyDown={deleteConfirmLoading}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2 } }}
        >
          <DialogTitle sx={{ fontWeight: 700 }}>La compra se eliminará</DialogTitle>
          <DialogContent>
            {deleteConfirmLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1, minHeight: 48 }}>
                <CircularProgress size={28} />
                <Typography color="text.secondary" variant="body2">
                  Eliminando compra…
                </Typography>
              </Box>
            ) : (
              <Typography color="text.secondary" variant="body2" component="div" sx={{ lineHeight: 1.6 }}>
                <Typography component="p" variant="body2" color="text.primary" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Si confirmas, esta compra se eliminará por completo del registro y desaparecerá del listado. No podrás recuperarla.
                </Typography>
                {purchase?.providerName ? (
                  <Typography component="p" variant="body2" color="text.secondary">
                    Compra de <strong>{purchase.providerName}</strong>
                    {purchase.total != null ? <> · Total {formatMoney(purchase.total, purchase.currency)}</> : null}
                  </Typography>
                ) : null}
                <Typography component="p" variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                  ¿Deseas continuar?
                </Typography>
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDeleteConfirm} disabled={deleteConfirmLoading} variant="outlined">
              No, mantener compra
            </Button>
            <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleteConfirmLoading}>
              {deleteConfirmLoading ? 'Eliminando…' : 'Sí, eliminar compra'}
            </Button>
          </DialogActions>
        </Dialog>

        {permissionDeniedSnackbar}
      </Box>
    </Box>
  )
}
