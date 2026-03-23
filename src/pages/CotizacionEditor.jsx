import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Badge,
  Autocomplete,
  Avatar,
  Chip,
  Tabs,
  Tab,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  PictureAsPdf as PdfIcon,
  Search as SearchIcon,
  Add as AddQtyIcon,
  Remove as RemoveQtyIcon,
  ShoppingCart as CartIcon,
  AddShoppingCart as AddToCartIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Close as CloseIcon,
  ImageNotSupported as NoImageIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import {
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
} from '../api/quotations'
import { searchProducts, getBrands, getCarModelsByBrand, getProductById } from '../api/products'
import { getUsers } from '../api/user'
import { useAuth } from '../contexts/AuthContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'

function lineCalc(unitPrice, qty) {
  const q = Math.max(1, parseInt(qty, 10) || 1)
  const sub = Math.round(Number(unitPrice) * q * 100) / 100
  return { sub, qty: q }
}

function totalsFromLines(lines) {
  let gross = 0
  lines.forEach((l) => {
    const { sub } = lineCalc(l.unitPrice, l.quantity)
    gross += sub
  })
  gross = Math.round(gross * 100) / 100
  const tax = Math.round(gross * 0.16 * 100) / 100
  const total = Math.round((gross + tax) * 100) / 100
  return { gross, disc: 0, net: gross, tax, total }
}

function formatMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)
}

function cartLineKey(productId, sku) {
  return productId ? `id:${productId}` : `sku:${sku || ''}`
}

const PIEZA_MANUAL_TIPO = [
  { value: 'ORIGINAL', label: 'Original' },
  { value: 'GENÉRICO', label: 'Genérico' },
]

const PIEZA_MANUAL_ESTADO = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'SEMINUEVO', label: 'Seminuevo' },
]

function partTypeLabel(v) {
  return v === 'GENÉRICO' ? 'Genérico' : 'Original'
}

function partConditionLabel(v) {
  if (v == null || v === '') return '—'
  const u = String(v).toUpperCase()
  if (u === 'SEMINUEVO' || u === 'USADO') return 'Seminuevo'
  return 'Nuevo'
}

/** Marca en PDF (Original / No original / Seminueva) desde pieza manual */
function lineToPdfPartConditionFromManual(l) {
  if (!l.isManual || !l.partType) return undefined
  if (l.partCondition === 'SEMINUEVO') return 'seminueva'
  if (l.partType === 'GENÉRICO') return 'non_original'
  return 'original'
}

/** Tipo de refacción según datos del producto en inventario */
function mapProductPartsToPdfPartCondition(partType, partCondition) {
  const c = String(partCondition ?? '').toUpperCase()
  if (c === 'SEMINUEVO' || c === 'USADO') return 'seminueva'
  const t = String(partType ?? '').toUpperCase()
  if (t.includes('GEN') || t === 'GENERICO') return 'non_original'
  return 'original'
}

function resolvePartConditionForApi(l) {
  const s = l.savedPartCondition
  if (s === 'original' || s === 'non_original' || s === 'seminueva') return s
  const fromManual = lineToPdfPartConditionFromManual(l)
  if (fromManual) return fromManual
  if (l.productPartType != null || l.productPartCondition != null) {
    return mapProductPartsToPdfPartCondition(l.productPartType, l.productPartCondition)
  }
  return undefined
}

/** Nombre que se envía al API / PDF (incluye tipo y estado en piezas manuales) */
function buildQuotationProductName(line) {
  const base = (line.productName || '').trim()
  if (!line.isManual) return base
  if (!line.partType || !line.partCondition) return base
  const suffix = ` (${partTypeLabel(line.partType)} · ${partConditionLabel(line.partCondition)})`
  const combined = base + suffix
  return combined.length > 500 ? `${combined.slice(0, 496)}…` : combined
}

/** Al cargar cotización: separar nombre y tipo/estado si venían guardados en productName */
/** Unidades en inventario (entero ≥ 0); null si no aplica o desconocido */
function normalizeInventoryUnits(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  if (Number.isNaN(n)) return null
  return Math.max(0, Math.floor(n))
}

/** Lee stock del payload del API (camelCase o snake_case) */
function inventoryUnitsFromProduct(p) {
  if (!p || typeof p !== 'object') return null
  return normalizeInventoryUnits(p.stockQuantity ?? p.stock_quantity)
}

function parseManualLineFromApi(productName, sku, productId) {
  const isManual = !productId && String(sku || '').startsWith('EXT-')
  if (!isManual) {
    return { productName: productName || '', partType: undefined, partCondition: undefined }
  }
  const raw = (productName || '').trim()
  const m = raw.match(/^(.+?)\s*\((Original|Genérico) · (Nuevo|Seminuevo)\)\s*$/i)
  if (!m) {
    return { productName: raw, partType: undefined, partCondition: undefined }
  }
  const partType = m[2].toLowerCase().includes('gen') ? 'GENÉRICO' : 'ORIGINAL'
  const partCondition = m[3].toLowerCase().includes('semi') ? 'SEMINUEVO' : 'NUEVO'
  return { productName: m[1].trim(), partType, partCondition }
}

export default function CotizacionEditor() {
  const { id } = useParams()
  const isNew = !id || id === 'nueva'
  const navigate = useNavigate()
  const { canDoAction, user } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState('')
  const [quotationId, setQuotationId] = useState(isNew ? null : id)
  const [quotationNumber, setQuotationNumber] = useState('')

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [claimNumber, setClaimNumber] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [status, setStatus] = useState('draft')

  /** Carrito: solo piezas agregadas desde búsqueda */
  const [cartLines, setCartLines] = useState([])
  const [users, setUsers] = useState([])
  const [brands, setBrands] = useState([])
  const [carModels, setCarModels] = useState([])
  const [filterBrandId, setFilterBrandId] = useState('')
  const [filterModel, setFilterModel] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterPieceName, setFilterPieceName] = useState('')
  const [productOptions, setProductOptions] = useState([])
  const [productLoading, setProductLoading] = useState(false)

  /** Pieza manual (fuera de inventario) — marca/modelo/año vienen de «Datos del Vehículo» */
  const [manualPieceName, setManualPieceName] = useState('')
  const [manualPartType, setManualPartType] = useState('ORIGINAL')
  const [manualPartCondition, setManualPartCondition] = useState('NUEVO')
  const [manualUnitPrice, setManualUnitPrice] = useState('')
  const [manualFormError, setManualFormError] = useState('')
  /** 0 = buscar inventario, 1 = pieza externa */
  const [pieceSectionTab, setPieceSectionTab] = useState(0)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [quotationPdfUrl, setQuotationPdfUrl] = useState(null)
  const [imageGallery, setImageGallery] = useState({ open: false, urls: [], index: 0, title: '' })
  const [busyModal, setBusyModal] = useState({ open: false, message: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const totals = useMemo(() => totalsFromLines(cartLines), [cartLines])
  const vehicleBrandNameForApi = useMemo(
    () => (brands.find((b) => b.id === filterBrandId)?.name || '').trim(),
    [brands, filterBrandId],
  )
  /** Vehículo único (Datos del Vehículo) — se muestra en el header del carrito */
  const cartHeaderVehicle = useMemo(() => {
    const parts = [vehicleBrandNameForApi, filterModel?.trim(), filterYear?.trim()].filter(Boolean)
    return parts.length ? parts.join(' - ') : ''
  }, [vehicleBrandNameForApi, filterModel, filterYear])
  const totalPiezas = useMemo(
    () => cartLines.reduce((s, l) => s + Math.max(1, parseInt(l.quantity, 10) || 1), 0),
    [cartLines],
  )

  const loadUsers = useCallback(async () => {
    const r = await getUsers({ activeOnly: true })
    if (r.success) setUsers(r.data || [])
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

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

  useEffect(() => {
    if (isNew) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      const r = await getQuotation(id)
      if (cancelled) return
      setLoading(false)
      if (!r.success) {
        setError(r.error || 'Error')
        return
      }
      const q = r.data
      setQuotationId(q.id)
      setQuotationNumber(q.quotationNumber || '')
      setClientName(q.clientName || '')
      setClientPhone(q.clientPhone || '')
      setClientEmail(q.clientEmail || '')
      setNotes(q.notes || '')
      setClaimNumber(q.claimNumber || '')
      setSerialNumber(q.serialNumber || '')
      setStatus(q.status || 'draft')
      const brandsRes = await getBrands({ activeOnly: true })
      const brandList = brandsRes.success ? brandsRes.data || [] : []
      if (brandsRes.success) setBrands(brandList)
      let matchedBrandId = ''
      if (q.vehicleBrand?.trim()) {
        const vn = q.vehicleBrand.trim().toLowerCase()
        const hit = brandList.find((b) => (b.name || '').trim().toLowerCase() === vn)
        if (hit) matchedBrandId = hit.id
      }
      setFilterBrandId(matchedBrandId)
      setFilterModel(q.vehicleModel || '')
      setFilterYear(q.vehicleYear || '')
      setQuotationPdfUrl(q.pdfUrl || null)
      if (q.items?.length) {
        const baseLines = q.items.map((it) => {
          const isManual = !it.productId && String(it.sku || '').startsWith('EXT-')
          const parsed = parseManualLineFromApi(it.productName, it.sku, it.productId)
          return {
            key: it.id || crypto.randomUUID(),
            productId: it.productId,
            productName: parsed.productName,
            sku: it.sku,
            unitPrice: Number(it.unitPrice),
            quantity: it.quantity,
            carBrand: it.carBrand || '',
            carModel: it.carModel || '',
            carYears: it.carYears || '',
            isManual,
            savedPartCondition: it.partCondition || undefined,
            ...(parsed.partType ? { partType: parsed.partType, partCondition: parsed.partCondition } : {}),
          }
        })
        const productIds = [...new Set(baseLines.map((l) => l.productId).filter(Boolean))]
        const productMetaById = new Map()
        if (productIds.length) {
          await Promise.all(
            productIds.map(async (pid) => {
              const pr = await getProductById(pid)
              if (cancelled || !pr.success || !pr.data) return
              const p = pr.data
              const u = inventoryUnitsFromProduct(p)
              productMetaById.set(pid, {
                stockQuantity: u,
                partType: p.partType ?? p.part_type,
                partCondition: p.partCondition ?? p.part_condition,
              })
            }),
          )
        }
        if (cancelled) return
        setCartLines(
          baseLines.map((l) => {
            if (!l.productId || !productMetaById.has(l.productId)) return l
            const m = productMetaById.get(l.productId)
            return {
              ...l,
              ...(m.stockQuantity != null ? { stockQuantity: m.stockQuantity } : {}),
              productPartType: m.partType,
              productPartCondition: m.partCondition,
            }
          }),
        )
      } else {
        setCartLines([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, isNew])

  const runProductSearch = useCallback(async () => {
    setProductLoading(true)
    const r = await searchProducts({
      brandId: filterBrandId || undefined,
      modelSearch: filterModel?.trim() || undefined,
      year: filterYear?.trim() || undefined,
      search: filterPieceName?.trim() || undefined,
      limit: 40,
      isActive: true,
    })
    setProductLoading(false)
    if (r.success && r.data?.products) setProductOptions(r.data.products)
    else setProductOptions([])
  }, [filterBrandId, filterModel, filterYear, filterPieceName])

  const itemsPayload = cartLines.map((l) => ({
    productId: l.productId || undefined,
    productName: buildQuotationProductName(l),
    sku: String(l.sku || '').slice(0, 100),
    unitPrice: Number(l.unitPrice) || 0,
    quantity: Math.max(1, parseInt(l.quantity, 10) || 1),
    discountType: 'percent',
    discountValue: 0,
    carBrand: (l.carBrand || '').trim() || undefined,
    carModel: (l.carModel || '').trim() || undefined,
    carYears: (l.carYears || '').trim() || undefined,
    partCondition: resolvePartConditionForApi(l),
  }))

  const capQtyToStock = (line, qty) => {
    const q = Math.max(1, parseInt(qty, 10) || 1)
    if (line.isManual) return q
    const stock = normalizeInventoryUnits(line.stockQuantity)
    if (stock == null) return q
    const maxQ = Math.max(1, stock)
    return Math.min(q, maxQ)
  }

  const addToCart = (p) => {
    if (!p?.id && !p?.sku) return
    const pid = p.id || null
    const sku = p.sku || ''
    const inv = inventoryUnitsFromProduct(p)
    setCartLines((prev) => {
      const idx = prev.findIndex((l) => (pid && l.productId === pid) || (!pid && l.sku === sku && l.productName === (p.name || '')))
      if (idx >= 0) {
        const next = [...prev]
        const line = next[idx]
        const merged = {
          ...line,
          stockQuantity: inv != null ? inv : line.stockQuantity,
          productPartType: line.productPartType ?? p.partType ?? p.part_type,
          productPartCondition: line.productPartCondition ?? p.partCondition ?? p.part_condition,
          quantity: capQtyToStock(
            { ...line, stockQuantity: inv != null ? inv : line.stockQuantity },
            (parseInt(line.quantity, 10) || 1) + 1,
          ),
        }
        next[idx] = merged
        return next
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          productId: pid,
          isManual: false,
          productName: p.name || 'Pieza',
          sku,
          unitPrice: Number(p.price) || 0,
          quantity: inv != null ? capQtyToStock({ isManual: false, stockQuantity: inv }, 1) : 1,
          carBrand: (p.brandName || '').trim(),
          carModel: (p.modelName || '').trim(),
          carYears: (p.carYearRange || '').trim(),
          productPartType: p.partType ?? p.part_type,
          productPartCondition: p.partCondition ?? p.part_condition,
          ...(inv != null ? { stockQuantity: inv } : {}),
        },
      ]
    })
  }

  const setQuantity = (key, qty) => {
    setCartLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const q = Math.max(1, parseInt(qty, 10) || 1)
        return { ...l, quantity: capQtyToStock(l, q) }
      }),
    )
  }

  const bumpQuantity = (key, delta) => {
    setCartLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const n = Math.max(1, (parseInt(l.quantity, 10) || 1) + delta)
        return { ...l, quantity: capQtyToStock(l, n) }
      }),
    )
  }

  const removeFromCart = (key) => {
    setCartLines((prev) => prev.filter((l) => l.key !== key))
  }

  const addManualPartToCart = () => {
    setManualFormError('')
    const name = (manualPieceName || '').trim()
    if (!filterBrandId) {
      setManualFormError('Selecciona la marca en «Datos del Vehículo».')
      return
    }
    if (!name) {
      setManualFormError('Indica el nombre de la pieza.')
      return
    }
    const price = parseFloat(String(manualUnitPrice).replace(',', '.'))
    if (Number.isNaN(price) || price < 0) {
      setManualFormError('Indica un precio unitario válido (mayor o igual a 0).')
      return
    }
    const brandName = (brands.find((b) => b.id === filterBrandId)?.name || '').trim()
    const modelName = (filterModel || '').trim()
    const years = (filterYear || '').trim()
    const sku = `EXT-${Date.now()}`
    setCartLines((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        productId: null,
        isManual: true,
        productName: name,
        sku,
        unitPrice: Math.round(price * 100) / 100,
        quantity: 1,
        carBrand: brandName,
        carModel: modelName,
        carYears: years,
        partType: manualPartType,
        partCondition: manualPartCondition,
      },
    ])
    setManualPieceName('')
    setManualUnitPrice('')
    setSnackbar({ open: true, message: 'Pieza externa agregada al carrito', severity: 'success' })
  }

  const openProductImages = (p) => {
    const urls = Array.isArray(p.imageUrls) && p.imageUrls.length > 0
      ? [...p.imageUrls]
      : p.primaryImageUrl
        ? [p.primaryImageUrl]
        : []
    if (!urls.length) return
    setImageGallery({ open: true, urls, index: 0, title: p.name || 'Pieza' })
  }

  /** Crea o actualiza la cotización con estado enviada y regenera el PDF en el servidor. */
  const generateQuotation = async () => {
    const creating = isNew || !quotationId
    if (creating) {
      if (!canDoAction(ACTION.COTIZACIONES_CREAR)) {
        showDenied()
        return
      }
    } else if (!canDoAction(ACTION.COTIZACIONES_EDITAR)) {
      showDenied()
      return
    }
    if (!clientName.trim()) {
      setError('Indique el nombre del cliente')
      return
    }
    if (itemsPayload.length < 1) {
      setError('Agregue al menos una pieza al carrito')
      return
    }
    setBusyModal({ open: true, message: 'Guardando cotización y generando PDF…' })
    setError('')
    const body = {
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      clientEmail: clientEmail.trim() || undefined,
      pdfAdvisorName:
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email?.trim() || undefined,
      notes: notes.trim() || undefined,
      claimNumber: claimNumber.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      vehicleBrand: vehicleBrandNameForApi || undefined,
      vehicleModel: filterModel.trim() || undefined,
      vehicleYear: filterYear.trim() || undefined,
      status: 'sent',
      items: itemsPayload,
    }
    let r = { success: false }
    try {
      if (isNew || !quotationId) {
        r = await createQuotation(body)
        if (r.success && r.data?.id) {
          navigate(`/cotizaciones/${r.data.id}`, { replace: true })
          setQuotationId(r.data.id)
          setQuotationNumber(r.data.quotationNumber || '')
          if (r.data.pdfUrl) setQuotationPdfUrl(r.data.pdfUrl)
        }
      } else {
        r = await updateQuotation(quotationId, body)
        if (r.success && r.data?.pdfUrl) setQuotationPdfUrl(r.data.pdfUrl)
      }
    } finally {
      setBusyModal({ open: false, message: '' })
    }
    if (!r.success) {
      setError(r.error || 'Error al generar la cotización')
      return
    }
    if (r.data) {
      setStatus(r.data.status || 'sent')
      setQuotationNumber(r.data.quotationNumber || quotationNumber)
      if (r.data.pdfUrl) setQuotationPdfUrl(r.data.pdfUrl)
    }
    const pdfUrl = r.data?.pdfUrl
    if (pdfUrl) {
      window.open(pdfUrl, '_blank', 'noopener,noreferrer')
    }
    setSnackbar({
      open: true,
      message: pdfUrl ? 'Cotización guardada y PDF generado' : 'Cotización guardada',
      severity: 'success',
    })
  }

  const pickClient = (u) => {
    if (!u) return
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email
    setClientName(name)
    setClientEmail(u.email || '')
    setClientPhone(u.phone || '')
  }

  const handleDelete = async () => {
    if (!canDoAction(ACTION.COTIZACIONES_ELIMINAR)) {
      showDenied()
      return
    }
    if (!quotationId) return
    setDeleteLoading(true)
    setError('')
    try {
      const r = await deleteQuotation(quotationId)
      if (!r.success) {
        setError(r.error || 'No se pudo eliminar')
        return
      }
      setDeleteOpen(false)
      navigate('/cotizaciones', { replace: true, state: { quotationDeleted: true } })
    } finally {
      setDeleteLoading(false)
    }
  }

  const canDownloadPdf = Boolean(quotationPdfUrl) && !busyModal.open

  const sectionHeaderSx = {
    bgcolor: '#757575',
    color: '#fff',
    py: 1.25,
    px: 2,
    borderBottom: '1px solid',
    borderColor: '#616161',
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        sx={{
          marginLeft: { xs: 0, md: '260px' },
          marginTop: { xs: 0, md: '70px' },
          width: { xs: '100%', md: 'calc(100% - 260px)' },
          px: { xs: 2, sm: 3, md: 4 },
          pt: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 2, sm: 3, md: 4 },
          boxSizing: 'border-box',
          minHeight: { xs: '100vh', lg: 'calc(100vh - 70px)' },
          /* lg+: sin scroll de página; scroll solo en columna izquierda y lista del carrito */
          height: { xs: 'auto', lg: 'calc(100vh - 70px)' },
          maxHeight: { xs: 'none', lg: 'calc(100vh - 70px)' },
          display: 'flex',
          flexDirection: 'column',
          overflow: { xs: 'visible', lg: 'hidden' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2, flexShrink: 0 }}>
          <IconButton onClick={() => navigate('/cotizaciones')} size="small" aria-label="Volver">
            <BackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#424242', flex: 1, fontSize: { xs: '22px', md: '28px' } }}>
            {isNew ? 'Nueva cotización' : `Cotización ${quotationNumber || '…'}`}
          </Typography>
          {quotationId && (
            <>
              <Button
                variant="outlined"
                startIcon={<PdfIcon />}
                size="small"
                disabled={!canDownloadPdf}
                onClick={() => {
                  if (quotationPdfUrl) window.open(quotationPdfUrl, '_blank', 'noopener,noreferrer')
                }}
                title={!quotationPdfUrl ? 'Use «Generar cotización» para crear el PDF' : 'Abrir PDF en nueva pestaña'}
              >
                Descargar PDF
              </Button>
              {!isNew && (
                <Button
                  color="error"
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    if (!canDoAction(ACTION.COTIZACIONES_ELIMINAR)) {
                      showDenied()
                      return
                    }
                    setDeleteOpen(true)
                  }}
                >
                  Eliminar
                </Button>
              )}
            </>
          )}
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: { xs: 'visible', lg: 'hidden' },
          }}
        >
        {loading ? (
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 2, flexShrink: 0 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}

            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 2,
                alignItems: { xs: 'flex-start', lg: 'stretch' },
              }}
            >
              {/* Izquierda: cliente + búsqueda — scroll interno en desktop */}
              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                  width: '100%',
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
                      Datos del Cliente
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Autocomplete
                      sx={{ minWidth: 260, flex: 1 }}
                      options={users}
                      getOptionLabel={(u) => [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || ''}
                      filterOptions={(x) => x}
                      onChange={(_, v) => pickClient(v)}
                      renderInput={(params) => (
                        <TextField {...params} label="Buscar cliente (usuarios)" placeholder="Nombre o email" size="small" />
                      )}
                      renderOption={(props, u) => (
                        <li {...props} key={u.id}>
                          <Box>
                            <Typography variant="body2">{[u.firstName, u.lastName].filter(Boolean).join(' ')}</Typography>
                            <Typography variant="caption" color="text.secondary">{u.email}</Typography>
                          </Box>
                        </li>
                      )}
                    />
                    <TextField
                      label="Nombre del cliente"
                      size="small"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      sx={{ minWidth: 200, flex: 1 }}
                    />
                    <TextField label="Teléfono" size="small" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} sx={{ width: 150 }} />
                    <TextField label="Email" size="small" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} sx={{ minWidth: 200 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 0.5 }}>
                    Opcional para el PDF: notas, siniestro y no. de serie
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
                    <TextField
                      label="Notas"
                      size="small"
                      multiline
                      minRows={2}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      sx={{ flex: '1 1 240px', minWidth: 200 }}
                    />
                    <TextField
                      label="Número de siniestro"
                      size="small"
                      value={claimNumber}
                      onChange={(e) => setClaimNumber(e.target.value)}
                      placeholder="Ej. B82263851"
                      sx={{ flex: '1 1 200px', minWidth: 180 }}
                      inputProps={{ maxLength: 120 }}
                    />
                    <TextField
                      label="No. de serie"
                      size="small"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="VIN o no. de serie"
                      sx={{ flex: '1 1 200px', minWidth: 180 }}
                      inputProps={{ maxLength: 120 }}
                    />
                  </Box>
                  {!isNew && (
                    <FormControl size="small" sx={{ mt: 2, minWidth: 200 }}>
                      <InputLabel>Estado</InputLabel>
                      <Select label="Estado" value={status} onChange={(e) => setStatus(e.target.value)}>
                        <MenuItem value="draft">Borrador</MenuItem>
                        <MenuItem value="sent">Enviada</MenuItem>
                        <MenuItem value="approved">Aprobada</MenuItem>
                        <MenuItem value="rejected">Rechazada</MenuItem>
                      </Select>
                    </FormControl>
                  )}
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
                      Una sola unidad para toda la cotización. Estos mismos datos se usan al buscar en inventario y al agregar piezas externas.
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
                        >
                          <MenuItem value="">Todas / sin especificar</MenuItem>
                          {brands.map((b) => (
                            <MenuItem key={b.id} value={b.id}>
                              {b.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl size="small" sx={{ minWidth: 200 }} disabled={!filterBrandId}>
                        <InputLabel>Modelo</InputLabel>
                        <Select label="Modelo" value={filterModel} onChange={(e) => setFilterModel(e.target.value)}>
                          <MenuItem value="">Todos / sin especificar</MenuItem>
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
                        sx={{ width: 110 }}
                        inputProps={{ maxLength: 32 }}
                      />
                    </Box>
                  </Box>
                </Paper>

                <Paper sx={{ mb: 2, overflow: 'hidden' }} elevation={2}>
                  <Box sx={sectionHeaderSx}>
                    <Typography variant="subtitle1" fontWeight={700} letterSpacing={0.3}>
                      Piezas para la cotización
                    </Typography>
                  </Box>
                  <Tabs
                    value={pieceSectionTab}
                    onChange={(_, v) => setPieceSectionTab(v)}
                    variant="fullWidth"
                    sx={{
                      borderBottom: 1,
                      borderColor: 'divider',
                      bgcolor: 'grey.100',
                      '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.875rem' },
                    }}
                  >
                    <Tab label="Buscar en inventario" />
                    <Tab label="Pieza externa" />
                  </Tabs>

                  {pieceSectionTab === 0 && (
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2, alignItems: 'flex-end' }}>
                        <TextField
                          label="Nombre pieza"
                          size="small"
                          placeholder="faro, filtro…"
                          value={filterPieceName}
                          onChange={(e) => setFilterPieceName(e.target.value)}
                          sx={{ minWidth: 220, flex: 1 }}
                        />
                        <Button variant="contained" startIcon={<SearchIcon />} onClick={runProductSearch} disabled={productLoading} size="small">
                          Buscar
                        </Button>
                      </Box>

                      {productLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={32} /></Box>
                      ) : productOptions.length === 0 ? (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                          {filterPieceName?.trim() || filterBrandId || filterModel || filterYear
                            ? 'Sin resultados. Prueba otro nombre o ajusta marca/modelo/año en Datos del Vehículo.'
                            : 'Escribe el nombre de la pieza y pulsa Buscar (opcional: define el vehículo arriba para acotar).'}
                        </Typography>
                      ) : (
                        <List dense disablePadding sx={{ maxHeight: 420, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                          {productOptions.map((p) => {
                            const thumb = p.primaryImageUrl || (p.imageUrls && p.imageUrls[0])
                            const hasGallery = (p.imageUrls && p.imageUrls.length > 0) || !!p.primaryImageUrl
                            const invUnits = inventoryUnitsFromProduct(p)
                            return (
                              <ListItem
                                key={p.id}
                                secondaryAction={
                                  <Button size="small" variant="contained" startIcon={<AddToCartIcon />} onClick={() => addToCart(p)} sx={{ ml: 1 }}>
                                    Al carrito
                                  </Button>
                                }
                                sx={{ alignItems: 'center', py: 1.25, borderBottom: '1px solid', borderColor: 'divider', pr: '140px' }}
                              >
                                <Avatar
                                  src={thumb || undefined}
                                  variant="rounded"
                                  onClick={() => hasGallery && openProductImages(p)}
                                  sx={{
                                    width: 56,
                                    height: 56,
                                    mr: 1.5,
                                    flexShrink: 0,
                                    bgcolor: '#EDE7F6',
                                    cursor: hasGallery ? 'pointer' : 'default',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                  }}
                                >
                                  {!thumb ? <NoImageIcon sx={{ color: '#7B2CBF', fontSize: 28 }} /> : null}
                                </Avatar>
                                <ListItemText
                                  primary={p.name}
                                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                                  secondary={
                                    <Typography component="span" variant="caption" display="block">
                                      SKU: {p.sku || '—'} · {formatMoney(p.price)}
                                      {invUnits != null ? ` · Unidades en inventario: ${invUnits}` : ''}
                                      {p.carYearRange ? ` · ${p.carYearRange}` : ''}
                                      {hasGallery ? ' · Clic en la imagen para ampliar' : ''}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            )
                          })}
                        </List>
                      )}
                    </Box>
                  )}

                  {pieceSectionTab === 1 && (
                    <Box sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Piezas fuera del catálogo. Marca, modelo y año del vehículo están en <strong>Datos del Vehículo</strong> (requerida la marca para agregar al carrito).
                      </Typography>
                      {manualFormError && (
                        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setManualFormError('')}>
                          {manualFormError}
                        </Alert>
                      )}
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-end' }}>
                        <Box
                          sx={{
                            flex: '1 1 420px',
                            minWidth: { xs: '100%', sm: 360 },
                            maxWidth: '100%',
                          }}
                        >
                          <TextField
                            label="Nombre de la pieza"
                            size="small"
                            required
                            fullWidth
                            placeholder="Descripción de la pieza"
                            value={manualPieceName}
                            onChange={(e) => setManualPieceName(e.target.value)}
                          />
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-end', mt: 2 }}>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                          <InputLabel>Tipo</InputLabel>
                          <Select label="Tipo" value={manualPartType} onChange={(e) => setManualPartType(e.target.value)}>
                            {PIEZA_MANUAL_TIPO.map((o) => (
                              <MenuItem key={o.value} value={o.value}>
                                {o.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 160 }}>
                          <InputLabel>Estado</InputLabel>
                          <Select
                            label="Estado"
                            value={manualPartCondition}
                            onChange={(e) => setManualPartCondition(e.target.value)}
                          >
                            {PIEZA_MANUAL_ESTADO.map((o) => (
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
                          required
                          value={manualUnitPrice}
                          onChange={(e) => setManualUnitPrice(e.target.value)}
                          InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                          sx={{ width: 140 }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', mt: 2 }}>
                        <Button
                          variant="contained"
                          color="secondary"
                          startIcon={<AddToCartIcon />}
                          onClick={addManualPartToCart}
                          size="small"
                          sx={{ textTransform: 'none' }}
                        >
                          Agregar al carrito
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Box>

              {/* Derecha: carrito + botón — misma altura que la fila (desktop), sin scroll de página */}
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
                    <CartIcon sx={{ color: '#fff' }} />
                  </Badge>
                  <Typography variant="subtitle1" fontWeight={700} letterSpacing={0.3}>
                    Carrito
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', ml: { xs: 0, sm: 1 } }}>
                    ({cartLines.length} {cartLines.length === 1 ? 'línea' : 'líneas'} · {totalPiezas} piezas)
                  </Typography>
                  {cartHeaderVehicle ? (
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
                      {cartHeaderVehicle}
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
                    {cartLines.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center', px: 1 }}>
                        Vacío. Agrega desde el catálogo o desde «Pieza externa (sin inventario)».
                      </Typography>
                    ) : (
                      <List dense disablePadding>
                        {cartLines.map((l) => {
                          const { sub, qty } = lineCalc(l.unitPrice, l.quantity)
                          const invN = !l.isManual ? normalizeInventoryUnits(l.stockQuantity) : null
                          const maxPieces = invN != null ? Math.max(1, invN) : undefined
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
                                pr: 4.5,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => removeFromCart(l.key)}
                                aria-label="Quitar"
                                color="error"
                                sx={{ position: 'absolute', top: 2, right: 2, p: 0.35 }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, flexWrap: 'wrap', pr: 3 }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{
                                    lineHeight: 1.25,
                                    fontSize: '0.8125rem',
                                    flex: '1 1 auto',
                                    minWidth: 0,
                                  }}
                                >
                                  {l.productName}
                                </Typography>
                                {l.isManual ? (
                                  <Chip label="Externa" size="small" color="secondary" variant="outlined" sx={{ height: 22, fontSize: '0.65rem' }} />
                                ) : null}
                              </Box>
                              {l.isManual && l.partType && l.partCondition ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                  sx={{ mt: 0.125, mb: 0.125, lineHeight: 1.25, fontSize: '0.7rem' }}
                                >
                                  {partTypeLabel(l.partType)} · {partConditionLabel(l.partCondition)}
                                </Typography>
                              ) : null}
                              {!l.isManual && (l.productPartType || l.productPartCondition) ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                  sx={{ mt: 0.125, mb: 0.125, lineHeight: 1.25, fontSize: '0.7rem' }}
                                >
                                  {l.productPartType ? partTypeLabel(l.productPartType) : '—'}
                                  {' · '}
                                  {l.productPartCondition ? partConditionLabel(l.productPartCondition) : '—'}
                                </Typography>
                              ) : null}
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                display="block"
                                sx={{ mb: 0.35, lineHeight: 1.25, fontSize: '0.7rem' }}
                              >
                                SKU {l.sku || '—'}
                              </Typography>
                              {invN != null ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                  sx={{ mb: 0.35, lineHeight: 1.25, fontSize: '0.7rem' }}
                                >
                                  Unidades en inventario: {invN}
                                  {invN >= qty && qty > 0
                                    ? ` · Quedarían en almacén: ${Math.max(0, invN - qty)} uds.`
                                    : ''}
                                </Typography>
                              ) : null}
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
                                  {maxPieces != null ? ` (máx. ${maxPieces})` : ''}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                  <IconButton size="small" sx={{ p: 0.25 }} onClick={() => bumpQuantity(l.key, -1)} aria-label="Menos">
                                    <RemoveQtyIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                  <TextField
                                    size="small"
                                    value={qty}
                                    onChange={(e) => setQuantity(l.key, e.target.value)}
                                    inputProps={{
                                      min: 1,
                                      ...(maxPieces != null ? { max: maxPieces } : {}),
                                      style: { textAlign: 'center', width: 40, padding: '4px 0', fontSize: '0.8rem' },
                                    }}
                                    sx={{ width: 52, '& .MuiInputBase-input': { py: 0.35 } }}
                                  />
                                  <IconButton
                                    size="small"
                                    sx={{ p: 0.25 }}
                                    onClick={() => bumpQuantity(l.key, 1)}
                                    aria-label="Más"
                                    disabled={maxPieces != null && qty >= maxPieces}
                                  >
                                    <AddQtyIcon sx={{ fontSize: 18 }} />
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
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                      Subtotal
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 0.35, lineHeight: 1.3 }}>{formatMoney(totals.gross)}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                      IVA (16%)
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 0.5, lineHeight: 1.3 }}>{formatMoney(totals.tax)}</Typography>
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
                    disabled={busyModal.open}
                    onClick={generateQuotation}
                    sx={{
                      width: '50%',
                      minWidth: 140,
                      py: 1.25,
                      bgcolor: '#7B2CBF',
                      '&:hover': { bgcolor: '#6A26A8' },
                      textTransform: 'uppercase',
                      fontWeight: 700,
                      letterSpacing: 0.5,
                    }}
                  >
                    Generar cotización
                  </Button>
                </Box>
              </Box>
            </Box>
          </>
        )}
        </Box>

        <Dialog open={imageGallery.open} onClose={() => setImageGallery((g) => ({ ...g, open: false }))} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
            <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600, pr: 2 }} noWrap>
              {imageGallery.title}
            </Typography>
            <IconButton aria-label="Cerrar" onClick={() => setImageGallery((g) => ({ ...g, open: false }))}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ textAlign: 'center', bgcolor: '#000', position: 'relative', minHeight: 320 }}>
            {imageGallery.urls.length > 0 && (
              <>
                <Box
                  component="img"
                  src={imageGallery.urls[imageGallery.index]}
                  alt=""
                  sx={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', display: 'block', mx: 'auto' }}
                />
                {imageGallery.urls.length > 1 && (
                  <>
                    <IconButton
                      onClick={() =>
                        setImageGallery((g) => ({
                          ...g,
                          index: g.index <= 0 ? g.urls.length - 1 : g.index - 1,
                        }))
                      }
                      sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: '#fff', bgcolor: 'rgba(0,0,0,0.45)' }}
                      size="large"
                    >
                      <ChevronLeftIcon fontSize="large" />
                    </IconButton>
                    <IconButton
                      onClick={() =>
                        setImageGallery((g) => ({
                          ...g,
                          index: g.index >= g.urls.length - 1 ? 0 : g.index + 1,
                        }))
                      }
                      sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#fff', bgcolor: 'rgba(0,0,0,0.45)' }}
                      size="large"
                    >
                      <ChevronRightIcon fontSize="large" />
                    </IconButton>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', display: 'block', mt: 1 }}>
                      {imageGallery.index + 1} / {imageGallery.urls.length}
                    </Typography>
                  </>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={busyModal.open}
          disableEscapeKeyDown
          PaperProps={{
            sx: {
              p: { xs: 4, sm: 6 },
              minWidth: { xs: '85vw', sm: 400 },
              maxWidth: 480,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              borderRadius: 2,
            },
          }}
        >
          <CircularProgress size={72} thickness={4} sx={{ mb: 3, color: '#7B2CBF', display: 'block' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#424242', px: 1, width: '100%' }}>
            {busyModal.message}
          </Typography>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} variant="filled" sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>

        <Dialog
          open={deleteOpen}
          onClose={() => {
            if (!deleteLoading) setDeleteOpen(false)
          }}
          disableEscapeKeyDown={deleteLoading}
          PaperProps={{ sx: { position: 'relative', minWidth: 320 } }}
        >
          <DialogTitle>¿Eliminar cotización?</DialogTitle>
          <DialogContent>
            {deleteLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, minHeight: 56 }}>
                <CircularProgress size={32} />
                <Typography color="text.secondary">Eliminando cotización…</Typography>
              </Box>
            ) : (
              <Typography color="text.secondary" variant="body2">
                Esta acción no se puede deshacer.
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button color="error" variant="contained" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
        {permissionDeniedSnackbar}
      </Box>
    </Box>
  )
}
