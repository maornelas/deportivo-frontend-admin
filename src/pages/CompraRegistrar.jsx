import { useEffect, useMemo, useState } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import { useNavigate } from 'react-router-dom'
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
  ArrowBack as BackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Remove as RemoveQtyIcon,
  ShoppingCart as ShoppingCartIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { getBrands, getCarModelsByBrand } from '../api/products'
import { createNotification } from '../api/notifications'
import { downloadPurchaseNotePdf } from '../compras/purchaseNotePdf'
import { useAuth } from '../contexts/AuthContext'
import { usePurchases } from '../contexts/PurchasesContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'
import {
  formatLineVehicleLabel,
  summarizePurchaseHeaderVehicle,
  vehicleLineFingerprint,
} from '../compras/shared'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'paid', label: 'Pagado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const PAYMENT_OPTIONS = [
  { value: 'transfer', label: 'Transferencia' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'other', label: 'Otro' },
]

const PART_TYPE_OPTIONS = [
  { value: 'ORIGINAL', label: 'Original' },
  { value: 'GENÉRICO', label: 'Genérica' },
]

const PART_STATE_OPTIONS = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'SEMINUEVO', label: 'Seminueva' },
]

function formatMoney(n, currency = 'MXN') {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(n) || 0)
}

function formatDateValue(d) {
  const x = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(x.getTime())) return ''
  return x.toISOString().slice(0, 10)
}

function safeTrim(s) {
  return String(s ?? '').trim()
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

const sectionHeaderSx = {
  bgcolor: '#757575',
  color: '#fff',
  py: 1.25,
  px: 2,
  borderBottom: '1px solid',
  borderColor: '#616161',
}

export default function CompraRegistrar() {
  const navigate = useNavigate()
  const { canDoAction, user } = useAuth()
  const { addPurchase, purchases } = usePurchases()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [editorProvider, setEditorProvider] = useState('')
  const [editorPurchaseDate, setEditorPurchaseDate] = useState(formatDateValue(new Date()))
  const [editorPaymentMethod, setEditorPaymentMethod] = useState('transfer')
  const [editorStatus, setEditorStatus] = useState('pending')
  const [editorNotes, setEditorNotes] = useState('')
  const [receiptFileName, setReceiptFileName] = useState('')

  const [brands, setBrands] = useState([])
  const [draftCarModels, setDraftCarModels] = useState([])

  const [lines, setLines] = useState([])

  /** Formulario de una pieza (se envía al resumen con «Agregar pieza») */
  const [draftName, setDraftName] = useState('')
  const [draftPartType, setDraftPartType] = useState('ORIGINAL')
  const [draftPartCondition, setDraftPartCondition] = useState('NUEVO')
  const [draftUnitPrice, setDraftUnitPrice] = useState('')
  const [draftBrandId, setDraftBrandId] = useState('')
  const [draftModel, setDraftModel] = useState('')
  const [draftYear, setDraftYear] = useState('')
  const [draftVersion, setDraftVersion] = useState('')

  /** Editar vehículo de una línea ya en el resumen */
  const [vehicleDialogKey, setVehicleDialogKey] = useState(null)
  const [dlgBrandId, setDlgBrandId] = useState('')
  const [dlgModel, setDlgModel] = useState('')
  const [dlgYear, setDlgYear] = useState('')
  const [dlgVersion, setDlgVersion] = useState('')
  const [dlgCarModels, setDlgCarModels] = useState([])

  const draftVehicleBrandName = useMemo(
    () => (brands.find((b) => b.id === draftBrandId)?.name || '').trim(),
    [brands, draftBrandId],
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
    const withV = lines.filter((l) => formatLineVehicleLabel(l))
    if (withV.length === 0) return ''
    const uniq = new Set(withV.map((l) => vehicleLineFingerprint(l)))
    if (uniq.size === 1) return formatLineVehicleLabel(withV[0])
    return 'Varios vehículos'
  }, [lines])

  useEffect(() => {
    getBrands({ activeOnly: true }).then((r) => {
      if (r.success) setBrands(r.data || [])
    })
  }, [])

  useEffect(() => {
    if (!draftBrandId) {
      setDraftCarModels([])
      return
    }
    getCarModelsByBrand(draftBrandId).then((r) => {
      if (r.success) setDraftCarModels(r.data || [])
    })
  }, [draftBrandId])

  useEffect(() => {
    if (!dlgBrandId) {
      setDlgCarModels([])
      return
    }
    getCarModelsByBrand(dlgBrandId).then((r) => {
      if (r.success) setDlgCarModels(r.data || [])
    })
  }, [dlgBrandId])

  const updateLine = (key, patch) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const removeLine = (key) => setLines((prev) => prev.filter((l) => l.key !== key))

  const openVehicleDialog = (key) => {
    const l = lines.find((x) => x.key === key)
    if (!l) return
    setVehicleDialogKey(key)
    setDlgBrandId(l.vehicleBrandId || '')
    setDlgModel(l.vehicleModel || '')
    setDlgYear(l.vehicleYear || '')
    setDlgVersion(l.vehicleVersion || '')
  }

  const closeVehicleDialog = () => {
    setVehicleDialogKey(null)
  }

  const saveVehicleDialog = () => {
    if (!vehicleDialogKey) return
    const name = (brands.find((b) => b.id === dlgBrandId)?.name || '').trim()
    updateLine(vehicleDialogKey, {
      vehicleBrandId: dlgBrandId || '',
      vehicleBrand: name,
      vehicleModel: dlgModel?.trim() || '',
      vehicleYear: dlgYear?.trim() || '',
      vehicleVersion: dlgVersion?.trim() || '',
    })
    closeVehicleDialog()
  }

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
      vehicleBrandId: draftBrandId || '',
      vehicleBrand: draftVehicleBrandName || '',
      vehicleModel: draftModel?.trim() || '',
      vehicleYear: draftYear?.trim() || '',
      vehicleVersion: draftVersion?.trim() || '',
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

  const handleSave = async () => {
    if (!canDoAction(ACTION.COMPRAS_CREAR)) {
      showDenied()
      return
    }
    const msg = validate()
    if (msg) {
      setError(msg)
      return
    }
    setError('')
    setSaving(true)
    try {
      const cleanLines = lines.filter((l) => safeTrim(l.productName))
      const maxCmp = purchases.reduce((max, p) => {
        const id = String(p?.id || '')
        if (!/^CMP-\d{6}$/.test(id)) return max
        const n = Number(id.slice(4))
        return !Number.isNaN(n) && n > max ? n : max
      }, 0)
      const id = `CMP-${String(maxCmp + 1).padStart(6, '0')}`
      const headerVeh = summarizePurchaseHeaderVehicle(cleanLines)
      const payload = {
        id,
        providerName: editorProvider.trim(),
        purchaseDate: editorPurchaseDate,
        paymentMethod: editorPaymentMethod,
        status: editorStatus,
        notes: editorNotes || '',
        currency: 'MXN',
        receiptFileName: receiptFileName || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        vehicleBrandId: headerVeh.vehicleBrandId,
        vehicleBrand: headerVeh.vehicleBrand,
        vehicleModel: headerVeh.vehicleModel,
        vehicleYear: headerVeh.vehicleYear,
        vehicleVersion: headerVeh.vehicleVersion,
        items: cleanLines.map((l) => ({
          key: l.key,
          productId: null,
          productName: l.productName.trim(),
          sku: '',
          partType: l.partType,
          partCondition: l.partCondition,
          unitPrice: Number(l.unitPrice || 0),
          quantity: Math.max(1, parseInt(l.quantity, 10) || 1),
          vehicleBrandId: l.vehicleBrandId || '',
          vehicleBrand: l.vehicleBrand || '',
          vehicleModel: l.vehicleModel || '',
          vehicleYear: l.vehicleYear || '',
          vehicleVersion: l.vehicleVersion || '',
        })),
      }
      payload.total = totals.total
      addPurchase(payload)
      void createNotification({
        type: 'purchase_created',
        title: 'Nueva compra en el panel',
        message: `Compra a ${payload.providerName} · Total ${formatMoney(totals.total)}`,
        payload: { purchaseId: payload.id, providerName: payload.providerName, total: totals.total },
      }).catch(() => {})
      try {
        const registeredByDisplayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
        downloadPurchaseNotePdf(payload, totals, { registeredByDisplayName })
      } catch (pdfErr) {
        console.error(pdfErr)
      }
      navigate('/compras')
    } finally {
      setSaving(false)
    }
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

        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2, flexShrink: 0 }}>
          <IconButton onClick={() => navigate('/compras')} size="small" aria-label="Volver">
            <BackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#424242', flex: 1, fontSize: { xs: '22px', md: '28px' } }}>
            Nota de compra
          </Typography>
        </Box>

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
                    sx={{ minWidth: 260, flex: 1 }}
                  />
                  <TextField
                    label="Fecha de compra"
                    type="date"
                    size="small"
                    value={editorPurchaseDate}
                    onChange={(e) => setEditorPurchaseDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: 180 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Estado del pago</InputLabel>
                    <Select label="Estado del pago" value={editorStatus} onChange={(e) => setEditorStatus(e.target.value)}>
                      {STATUS_OPTIONS.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                          {s.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Método de pago</InputLabel>
                    <Select label="Método de pago" value={editorPaymentMethod} onChange={(e) => setEditorPaymentMethod(e.target.value)}>
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
                    sx={{ flexBasis: '100%' }}
                    multiline
                    minRows={2}
                  />
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                  <Button variant="outlined" component="label" size="small">
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
                  Piezas a comprar
                </Typography>
              </Box>
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end', mb: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel>Marca</InputLabel>
                    <Select
                      label="Marca"
                      value={draftBrandId}
                      onChange={(e) => {
                        setDraftBrandId(e.target.value)
                        setDraftModel('')
                      }}
                    >
                      <MenuItem value="">Sin especificar</MenuItem>
                      {brands.map((b) => (
                        <MenuItem key={b.id} value={b.id}>
                          {b.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 200 }} disabled={!draftBrandId}>
                    <InputLabel>Modelo</InputLabel>
                    <Select label="Modelo" value={draftModel} onChange={(e) => setDraftModel(e.target.value)}>
                      <MenuItem value="">Sin especificar</MenuItem>
                      {draftCarModels.map((m) => (
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
                    value={draftYear}
                    onChange={(e) => setDraftYear(e.target.value)}
                    sx={{ width: 110 }}
                    inputProps={{ maxLength: 32 }}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Descripción completa"
                  size="small"
                  placeholder="Detalle del vehículo o aplicación (opcional)"
                  value={draftVersion}
                  onChange={(e) => setDraftVersion(e.target.value)}
                  sx={{ mb: 2 }}
                  inputProps={{ maxLength: 500 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, fontWeight: 600 }}>
                  Pieza y precio
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
                  <TextField
                    label="Nombre de la pieza"
                    size="small"
                    required
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    sx={{ flex: '1 1 240px', minWidth: 200 }}
                  />
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select label="Tipo" value={draftPartType} onChange={(e) => setDraftPartType(e.target.value)}>
                      {PART_TYPE_OPTIONS.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select label="Estado" value={draftPartCondition} onChange={(e) => setDraftPartCondition(e.target.value)}>
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
                    sx={{ width: 140 }}
                  />
                </Box>
                <Button startIcon={<AddIcon />} onClick={addPieceFromDraft} sx={{ mt: 2 }} variant="contained" color="secondary" size="small">
                  Agregar pieza
                </Button>
              </Box>
            </Paper>
          </Box>

          {/* Columna tipo carrito (cotización) */}
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
                              pr: 7,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => openVehicleDialog(l.key)}
                              aria-label="Editar vehículo de la línea"
                              sx={{ position: 'absolute', top: 2, right: 30, p: 0.35 }}
                              color="primary"
                            >
                              <EditIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => removeLine(l.key)}
                              aria-label="Eliminar pieza"
                              color="error"
                              sx={{ position: 'absolute', top: 2, right: 2, p: 0.35 }}
                            >
                              <DeleteIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.25, fontSize: '0.8125rem', pr: 2 }}>
                              {l.productName}
                            </Typography>
                            {formatLineVehicleLabel(l) ? (
                              <Typography
                                variant="caption"
                                color="primary"
                                display="block"
                                sx={{ mt: 0.125, mb: 0.2, lineHeight: 1.25, fontSize: '0.68rem', fontWeight: 600 }}
                              >
                                Vehículo: {formatLineVehicleLabel(l)}
                              </Typography>
                            ) : null}
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
                disabled={saving}
                onClick={handleSave}
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
                {saving ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Generar Compra'}
              </Button>
            </Box>
          </Box>
        </Box>
        </Box>
        <Dialog open={vehicleDialogKey != null} onClose={closeVehicleDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Vehículo de esta línea</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1, alignItems: 'flex-end' }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Marca</InputLabel>
                <Select
                  label="Marca"
                  value={dlgBrandId}
                  onChange={(e) => {
                    setDlgBrandId(e.target.value)
                    setDlgModel('')
                  }}
                >
                  <MenuItem value="">Sin especificar</MenuItem>
                  {brands.map((b) => (
                    <MenuItem key={b.id} value={b.id}>
                      {b.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 200 }} disabled={!dlgBrandId}>
                <InputLabel>Modelo</InputLabel>
                <Select label="Modelo" value={dlgModel} onChange={(e) => setDlgModel(e.target.value)}>
                  <MenuItem value="">Sin especificar</MenuItem>
                  {dlgCarModels.map((m) => (
                    <MenuItem key={m.id} value={m.model}>
                      {m.model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Año"
                size="small"
                value={dlgYear}
                onChange={(e) => setDlgYear(e.target.value)}
                sx={{ width: 110 }}
                inputProps={{ maxLength: 32 }}
              />
            </Box>
            <TextField
              fullWidth
              label="Descripción completa"
              size="small"
              placeholder="Detalle del vehículo o aplicación (opcional)"
              value={dlgVersion}
              onChange={(e) => setDlgVersion(e.target.value)}
              sx={{ mt: 2 }}
              inputProps={{ maxLength: 500 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeVehicleDialog}>Cancelar</Button>
            <Button variant="contained" onClick={saveVehicleDialog}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>
        {permissionDeniedSnackbar}
      </Box>
    </Box>
  )
}
