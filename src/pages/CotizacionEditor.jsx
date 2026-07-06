import { useState, useEffect, useCallback, useMemo } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

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
  createFilterOptions,
  Avatar,
  Chip,
  Tabs,
  Tab,
  InputAdornment,
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
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
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import PageTitle from '../components/PageTitle'
import {
  getQuotation,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  convertQuotationToAdvisorSale,
} from '../api/quotations'
import { searchProducts, getBrands, getCarModelsByBrand, getProductById } from '../api/products'
import { getUsers } from '../api/user'
import { getAddressesByUser } from '../api/userAddress'
import { useAuth } from '../contexts/AuthContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'
import { usePushNotification } from '../hooks/usePushNotification'

/** Subtotal de línea con descuento % por pieza (alineado con backend `QuotationItem.fromInput`) */
function lineDetail(unitPrice, qty, discountPercent) {
  const q = Math.max(1, parseInt(String(qty), 10) || 1)
  const gross = Math.round(Number(unitPrice) * q * 100) / 100
  const pct = Math.min(100, Math.max(0, Number(discountPercent) || 0))
  const disc = Math.round((gross * pct) / 100 * 100) / 100
  const sub = Math.round((gross - disc) * 100) / 100
  return { gross, disc, sub, qty: q }
}

function totalsFromLines(lines) {
  let gross = 0
  let disc = 0
  lines.forEach((l) => {
    const d = lineDetail(l.unitPrice, l.quantity, l.discountPercent ?? 0)
    gross += d.gross
    disc += d.disc
  })
  gross = Math.round(gross * 100) / 100
  disc = Math.round(disc * 100) / 100
  const net = Math.round((gross - disc) * 100) / 100
  const tax = Math.round(net * 0.16 * 100) / 100
  const total = Math.round((net + tax) * 100) / 100
  return { gross, disc, net, tax, total }
}

function clientDisplayName(user) {
  if (!user) return ''
  const kind = user.customerAccountKind || 'person'
  if (kind === 'company') {
    return user.companyName?.trim() || user.email || 'Cliente empresa'
  }
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return full || user.email || 'Cliente'
}

const filterCustomerOptions = createFilterOptions({
  limit: 50,
  stringify: (u) =>
    [u.firstName, u.lastName, u.companyName, u.email, u.phone, u.rfc].filter(Boolean).join(' '),
})

function formatMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)
}

function formatCartLineVehicle(l) {
  const parts = [(l.carBrand || '').trim(), (l.carModel || '').trim(), (l.carYears || '').trim()].filter(Boolean)
  return parts.join(' - ')
}

const DEFAULT_DELIVERY_LEAD_DAYS = 5

/** Extrae días de valores guardados («5 días», «7 días hábiles», etc.). */
function parseDeliveryLeadDays(value) {
  if (value == null || value === '') return DEFAULT_DELIVERY_LEAD_DAYS
  const m = String(value).trim().match(/^(\d+)/)
  if (!m) return DEFAULT_DELIVERY_LEAD_DAYS
  return Math.min(365, Math.max(1, parseInt(m[1], 10)))
}

function formatDeliveryLeadTime(days) {
  const d = Math.min(365, Math.max(1, parseInt(String(days), 10) || DEFAULT_DELIVERY_LEAD_DAYS))
  return `${d} días`
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

/** Una línea para cotización / PDF (máx. 500) desde dirección del usuario */
function formatUserAddressLine(a) {
  if (!a || typeof a !== 'object') return ''
  const l1 = String(a.addressLine1 ?? a.address_line1 ?? '').trim()
  const l2 = String(a.addressLine2 ?? a.address_line2 ?? '').trim()
  const city = String(a.city ?? '').trim()
  const state = String(a.state ?? '').trim()
  const cp = String(a.postalCode ?? a.postal_code ?? '').trim()
  const country = String(a.country ?? '').trim()
  const cityState = [city, state].filter(Boolean).join(', ')
  const parts = [l1, l2, cityState, cp, country].filter(Boolean)
  const s = parts.join(', ')
  return s.length > 500 ? `${s.slice(0, 496)}…` : s
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
  const { notify, pushNotificationSnackbar } = usePushNotification()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [error, setError] = useState('')
  const [quotationId, setQuotationId] = useState(isNew ? null : id)
  const [quotationNumber, setQuotationNumber] = useState('')

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [workshopName, setWorkshopName] = useState('')
  const [notes, setNotes] = useState('')
  const [claimNumber, setClaimNumber] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  /** Días de surtido al agregar pieza externa (cada línea guarda el suyo). */
  const [manualDeliveryLeadDays, setManualDeliveryLeadDays] = useState(DEFAULT_DELIVERY_LEAD_DAYS)
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
  const [markSoldConfirmOpen, setMarkSoldConfirmOpen] = useState(false)
  const [markSoldLoading, setMarkSoldLoading] = useState(false)
  const [linkedOrderNumber, setLinkedOrderNumber] = useState('')
  const [quotationPdfUrl, setQuotationPdfUrl] = useState(null)
  const [imageGallery, setImageGallery] = useState({ open: false, urls: [], index: 0, title: '' })
  const [busyModal, setBusyModal] = useState({ open: false, message: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  /** Editar línea del carrito (nombre, cantidad, precio, descuento, vehículo) */
  const [editLineKey, setEditLineKey] = useState(null)
  const [dlgProductName, setDlgProductName] = useState('')
  const [dlgQuantity, setDlgQuantity] = useState('1')
  const [dlgUnitPrice, setDlgUnitPrice] = useState('')
  const [dlgDiscountPercent, setDlgDiscountPercent] = useState('0')
  const [dlgBrandId, setDlgBrandId] = useState('')
  const [dlgModel, setDlgModel] = useState('')
  const [dlgYear, setDlgYear] = useState('')
  const [dlgPartType, setDlgPartType] = useState('ORIGINAL')
  const [dlgPartCondition, setDlgPartCondition] = useState('NUEVO')
  const [dlgDeliveryLeadDays, setDlgDeliveryLeadDays] = useState(DEFAULT_DELIVERY_LEAD_DAYS)
  const [dlgCarModels, setDlgCarModels] = useState([])

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
    const r = await getUsers({ activeOnly: true, role: 'customer' })
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
    if (!dlgBrandId) {
      setDlgCarModels([])
      return
    }
    getCarModelsByBrand(dlgBrandId).then((r) => {
      if (r.success) setDlgCarModels(r.data || [])
    })
  }, [dlgBrandId])

  const editLine = useMemo(
    () => (editLineKey ? cartLines.find((l) => l.key === editLineKey) : null),
    [editLineKey, cartLines],
  )
  const cartReadOnly = status === 'sold'
  const soldMissingOrder = status === 'sold' && !linkedOrderNumber

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
      setClientAddress(q.clientAddress || '')
      setWorkshopName(q.workshopName || '')
      setNotes(q.notes || '')
      setClaimNumber(q.claimNumber || '')
      setSerialNumber(q.serialNumber || '')
      setStatus(q.status || 'draft')
      setLinkedOrderNumber(q.linkedOrder?.orderNumber || '')
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
            discountPercent: it.discountType === 'percent' ? Math.min(100, Math.max(0, Number(it.discountValue) || 0)) : 0,
            carBrand: it.carBrand || '',
            carModel: it.carModel || '',
            carYears: it.carYears || '',
            isManual,
            savedPartCondition: it.partCondition || undefined,
            ...(parsed.partType ? { partType: parsed.partType, partCondition: parsed.partCondition } : {}),
            ...(isManual
              ? { deliveryLeadDays: parseDeliveryLeadDays(it.deliveryLeadTime) }
              : {}),
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
    discountValue: Math.min(100, Math.max(0, Number(l.discountPercent) || 0)),
    carBrand: (l.carBrand || '').trim() || undefined,
    carModel: (l.carModel || '').trim() || undefined,
    carYears: (l.carYears || '').trim() || undefined,
    partCondition: resolvePartConditionForApi(l),
    ...(l.isManual
      ? { deliveryLeadTime: formatDeliveryLeadTime(l.deliveryLeadDays ?? DEFAULT_DELIVERY_LEAD_DAYS) }
      : {}),
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
          discountPercent: 0,
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

  const updateCartLine = (key, patch) => {
    setCartLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  }

  const openEditLineDialog = (key) => {
    if (cartReadOnly) return
    const l = cartLines.find((x) => x.key === key)
    if (!l) return
    let matchedBrandId = ''
    if (l.carBrand?.trim()) {
      const vn = l.carBrand.trim().toLowerCase()
      const hit = brands.find((b) => (b.name || '').trim().toLowerCase() === vn)
      if (hit) matchedBrandId = hit.id
    }
    setEditLineKey(key)
    setDlgProductName(l.productName || '')
    setDlgQuantity(String(Math.max(1, parseInt(l.quantity, 10) || 1)))
    setDlgUnitPrice(String(l.unitPrice ?? ''))
    setDlgDiscountPercent(String(l.discountPercent ?? 0))
    setDlgBrandId(matchedBrandId)
    setDlgModel(l.carModel || '')
    setDlgYear(l.carYears || '')
    setDlgPartType(l.partType || 'ORIGINAL')
    setDlgPartCondition(l.partCondition || 'NUEVO')
    setDlgDeliveryLeadDays(l.deliveryLeadDays ?? DEFAULT_DELIVERY_LEAD_DAYS)
  }

  const closeEditLineDialog = () => {
    setEditLineKey(null)
  }

  const saveEditLineDialog = () => {
    if (!editLineKey || !editLine) return
    const productName = (dlgProductName || '').trim()
    if (!productName) {
      setError('Indica el nombre de la pieza')
      return
    }
    const qRaw = parseInt(String(dlgQuantity), 10)
    const quantity = Number.isNaN(qRaw) ? 1 : Math.max(1, qRaw)
    const unitPrice = Number(dlgUnitPrice)
    if (Number.isNaN(unitPrice) || unitPrice < 0) {
      setError('Indica un precio unitario válido')
      return
    }
    const discRaw = parseFloat(String(dlgDiscountPercent).replace(',', '.'))
    const discountPercent = Number.isNaN(discRaw) ? 0 : Math.min(100, Math.max(0, discRaw))
    const brandName = (brands.find((b) => b.id === dlgBrandId)?.name || '').trim()
    const cappedQty = capQtyToStock(editLine, quantity)
    const patch = {
      productName,
      quantity: cappedQty,
      unitPrice: Math.round(unitPrice * 100) / 100,
      discountPercent,
      carBrand: brandName,
      carModel: (dlgModel || '').trim(),
      carYears: (dlgYear || '').trim(),
    }
    if (editLine.isManual) {
      patch.partType = dlgPartType
      patch.partCondition = dlgPartCondition
      patch.deliveryLeadDays = Math.min(
        365,
        Math.max(1, parseInt(String(dlgDeliveryLeadDays), 10) || DEFAULT_DELIVERY_LEAD_DAYS),
      )
    }
    updateCartLine(editLineKey, patch)
    setError('')
    closeEditLineDialog()
    notify('Pieza actualizada correctamente', {
      browserTitle: 'Cotización — pieza actualizada',
      browserBody: productName,
    })
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
        discountPercent: 0,
        carBrand: brandName,
        carModel: modelName,
        carYears: years,
        partType: manualPartType,
        partCondition: manualPartCondition,
        deliveryLeadDays: manualDeliveryLeadDays,
      },
    ])
    setManualPieceName('')
    setManualUnitPrice('')
    setManualDeliveryLeadDays(DEFAULT_DELIVERY_LEAD_DAYS)
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
    if (!creating && status === 'sold') {
      setError('Esta cotización está vendida; no se puede volver a generar.')
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
      clientAddress: clientAddress.trim() || undefined,
      workshopName: workshopName.trim() || undefined,
      pdfAdvisorName:
        [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || user?.email?.trim() || undefined,
      notes: notes.trim() || undefined,
      claimNumber: claimNumber.trim() || undefined,
      serialNumber: serialNumber.trim() || undefined,
      vehicleBrand: vehicleBrandNameForApi || undefined,
      vehicleModel: filterModel.trim() || undefined,
      vehicleYear: filterYear.trim() || undefined,
      status: creating ? 'sent' : status === 'sold' ? 'sold' : 'sent',
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

  const pickClient = async (u) => {
    if (!u) return
    setClientName(clientDisplayName(u))
    const kind = u.customerAccountKind || 'person'
    if (kind === 'company') {
      const workshop = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
      setWorkshopName(workshop)
    } else {
      setWorkshopName('')
    }
    setClientEmail(u.email || '')
    setClientPhone(u.phone || '')
    if (!u.id) return
    const r = await getAddressesByUser(u.id)
    if (!r.success || !r.data?.length) {
      setClientAddress('')
      return
    }
    const list = r.data
    const def = list.find((x) => x.isDefault || x.is_default) || list[0]
    setClientAddress(formatUserAddressLine(def))
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

  const openMarkSoldConfirm = () => {
    if (!quotationId) return
    if (status === 'sold' && linkedOrderNumber) return
    if (!canDoAction(ACTION.COTIZACIONES_EDITAR)) {
      showDenied()
      return
    }
    setMarkSoldConfirmOpen(true)
  }

  const confirmMarkAsSold = async () => {
    if (!quotationId) return
    if (status === 'sold' && linkedOrderNumber) return
    if (!canDoAction(ACTION.COTIZACIONES_EDITAR)) {
      showDenied()
      return
    }
    setMarkSoldLoading(true)
    setError('')
    let r = { success: false }
    try {
      r = await convertQuotationToAdvisorSale(quotationId)
    } finally {
      setMarkSoldLoading(false)
    }
    if (!r.success) {
      setError(r.error || 'No se pudo registrar la venta')
      return
    }
    setMarkSoldConfirmOpen(false)
    if (r.data?.quotation?.status) setStatus(r.data.quotation.status)
    else setStatus('sold')
    const ord = r.data?.order
    if (ord?.orderNumber) setLinkedOrderNumber(ord.orderNumber)
    const extra = ord?.orderNumber ? ` Orden ${ord.orderNumber}.` : ''
    const exp = r.data?.expediente?.expedienteNumber
    const expExtra = exp ? ` Expediente ${exp}.` : ''
    setSnackbar({
      open: true,
      message: `Venta registrada (canal Asesor).${extra}${expExtra} Redirigiendo a Ventas…`,
      severity: 'success',
    })
    navigate('/ventas?canal=asesor')
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
          <PageTitle sx={{ flex: 1, mb: 0 }}>
            {isNew ? 'Nueva cotización' : `Cotización ${quotationNumber || '…'}`}
            {linkedOrderNumber && (
              <Typography component="span" sx={{ ml: 1.5, fontSize: '0.82rem', fontWeight: 500, color: 'text.secondary' }}>
                → {linkedOrderNumber}
              </Typography>
            )}
          </PageTitle>
          {quotationId && (
            <>
              {!isNew && soldMissingOrder && (
                <Button
                  variant="contained"
                  color="warning"
                  size="small"
                  startIcon={<CheckCircleIcon />}
                  disabled={busyModal.open || markSoldLoading}
                  onClick={openMarkSoldConfirm}
                >
                  Completar nota de venta
                </Button>
              )}
              {!isNew && status !== 'sold' && (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<CheckCircleIcon />}
                  disabled={busyModal.open || markSoldLoading}
                  onClick={openMarkSoldConfirm}
                >
                  Marcar como vendido
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<PdfIcon />}
                size="small"
                disabled={!canDownloadPdf}
                onClick={() => {
                  if (quotationPdfUrl) window.open(quotationPdfUrl, '_blank', 'noopener,noreferrer')
                }}
                title={
                  !quotationPdfUrl
                    ? status === 'sold'
                      ? 'No hay PDF guardado para esta cotización'
                      : 'Use «Generar cotización» para crear el PDF'
                    : 'Abrir PDF en nueva pestaña'
                }
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
            {soldMissingOrder && (
              <Alert severity="warning" sx={{ mb: 2, flexShrink: 0 }}>
                Esta cotización está vendida pero no tiene nota de venta ni expediente digital. Use{' '}
                <strong>Completar nota de venta</strong> para registrarla en Ventas y Expediente digital.
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
                      getOptionLabel={clientDisplayName}
                      filterOptions={filterCustomerOptions}
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                      noOptionsText="Sin coincidencias"
                      onChange={(_, v) => pickClient(v)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar cliente"
                          placeholder="Nombre, empresa o email"
                          size="small"
                        />
                      )}
                      renderOption={(props, u) => (
                        <li {...props} key={u.id}>
                          <Box>
                            <Typography variant="body2">{clientDisplayName(u)}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {[u.email, u.phone].filter(Boolean).join(' · ') || '—'}
                            </Typography>
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
                    <TextField
                      label="Nombre del taller"
                      size="small"
                      value={workshopName}
                      onChange={(e) => setWorkshopName(e.target.value)}
                      placeholder="Razón social de entrega"
                      sx={{ minWidth: 200, flex: 1 }}
                      inputProps={{ maxLength: 255 }}
                    />
                    <TextField label="Teléfono" size="small" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} sx={{ width: 150 }} />
                    <TextField label="Email" size="small" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} sx={{ minWidth: 200 }} />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      mt: 2,
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2,
                      alignItems: 'stretch',
                    }}
                  >
                    <TextField
                      label="Dirección"
                      size="small"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Se llena al elegir cliente o escribe aquí"
                      fullWidth
                      sx={{ flex: 1, minWidth: 0 }}
                      inputProps={{ maxLength: 500 }}
                    />
                    <TextField
                      label="Notas"
                      size="small"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notas del asesor (opcional)"
                      fullWidth
                      sx={{ flex: 1, minWidth: 0 }}
                    />
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
                      <TextField
                        label="Número de siniestro"
                        size="small"
                        value={claimNumber}
                        onChange={(e) => setClaimNumber(e.target.value)}
                        placeholder="Ej. B82263851"
                        sx={{ flex: '1 1 220px', minWidth: 180 }}
                        inputProps={{ maxLength: 120 }}
                      />
                      <TextField
                        label="No. de serie (VIN)"
                        size="small"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder="VIN o no. de serie"
                        sx={{ flex: '1 1 220px', minWidth: 180 }}
                        inputProps={{ maxLength: 120 }}
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
                        <TextField
                          label="Surtido"
                          size="small"
                          type="number"
                          value={manualDeliveryLeadDays}
                          onChange={(e) => {
                            const n = parseInt(e.target.value, 10)
                            if (!Number.isNaN(n)) {
                              setManualDeliveryLeadDays(Math.min(365, Math.max(1, n)))
                            }
                          }}
                          title="Tiempo de surtido de esta pieza (columna Arribo en el PDF)"
                          sx={{ width: 108 }}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end" sx={{ '& .MuiTypography-root': { fontSize: '0.8125rem' } }}>
                                días
                              </InputAdornment>
                            ),
                          }}
                          inputProps={{ min: 1, max: 365, step: 1 }}
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
                          const { sub, qty } = lineDetail(l.unitPrice, l.quantity, l.discountPercent ?? 0)
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
                                pr: cartReadOnly ? 4.5 : 7,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            >
                              {!cartReadOnly ? (
                                <IconButton
                                  size="small"
                                  onClick={() => openEditLineDialog(l.key)}
                                  aria-label="Editar pieza"
                                  sx={{ position: 'absolute', top: 2, right: 30, p: 0.35 }}
                                  color="primary"
                                >
                                  <EditIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              ) : null}
                              <IconButton
                                size="small"
                                onClick={() => removeFromCart(l.key)}
                                aria-label="Quitar"
                                color="error"
                                disabled={cartReadOnly}
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
                              {l.isManual ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                  sx={{ mb: 0.25, lineHeight: 1.25, fontSize: '0.7rem' }}
                                >
                                  Arribo: {formatDeliveryLeadTime(l.deliveryLeadDays ?? DEFAULT_DELIVERY_LEAD_DAYS)}
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
                              {formatCartLineVehicle(l) ? (
                                <Typography
                                  variant="caption"
                                  color="primary"
                                  display="block"
                                  sx={{ mt: 0.125, mb: 0.2, lineHeight: 1.25, fontSize: '0.68rem', fontWeight: 600 }}
                                >
                                  Vehículo: {formatCartLineVehicle(l)}
                                </Typography>
                              ) : null}
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.15, fontSize: '0.7rem' }}>
                                Precio u.: {formatMoney(l.unitPrice)}
                                {(l.discountPercent ?? 0) > 0 ? ` · Desc. ${l.discountPercent}%` : ''}
                              </Typography>
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
                                  gap: 0.75,
                                  rowGap: 0.5,
                                }}
                              >
                                <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                                  Núm. piezas
                                  {maxPieces != null ? ` (máx. ${maxPieces})` : ''}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                                  <IconButton
                                    size="small"
                                    sx={{ p: 0.25 }}
                                    onClick={() => bumpQuantity(l.key, -1)}
                                    aria-label="Menos"
                                    disabled={cartReadOnly}
                                  >
                                    <RemoveQtyIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                  <TextField
                                    size="small"
                                    value={qty}
                                    onChange={(e) => setQuantity(l.key, e.target.value)}
                                    disabled={cartReadOnly}
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
                                    disabled={cartReadOnly || (maxPieces != null && qty >= maxPieces)}
                                  >
                                    <AddQtyIcon sx={{ fontSize: 18 }} />
                                  </IconButton>
                                </Box>
                                <Typography variant="body2" fontWeight={700} sx={{ ml: { xs: 0, sm: 'auto' }, fontSize: '0.8125rem' }}>
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
                      Subtotal (piezas)
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 0.35, lineHeight: 1.3 }}>{formatMoney(totals.gross)}</Typography>
                    {totals.disc > 0 ? (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>
                          Descuentos por pieza
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 0.35, lineHeight: 1.3 }}>−{formatMoney(totals.disc)}</Typography>
                      </>
                    ) : null}
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
                    disabled={busyModal.open || (Boolean(quotationId) && status === 'sold')}
                    onClick={generateQuotation}
                    title={
                      quotationId && status === 'sold'
                        ? 'Cotización vendida: use Descargar PDF o Eliminar.'
                        : undefined
                    }
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
                    {quotationId ? 'Regenerar cotización' : 'Generar cotización'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </>
        )}
        </Box>

        <Dialog open={editLineKey != null} onClose={closeEditLineDialog} maxWidth="sm" fullWidth>
          <DialogTitle
            sx={{
              bgcolor: '#7B2CBF',
              color: '#fff',
              fontWeight: 600,
              py: 1,
              px: 2,
              pr: 0.75,
              minHeight: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography component="span" variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
              Editar pieza
            </Typography>
            <IconButton size="small" onClick={closeEditLineDialog} sx={{ color: '#fff', p: 0.5 }} aria-label="Cerrar">
              <CloseIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 2.5 }}>
            <TextField
              label="Nombre de pieza"
              size="small"
              value={dlgProductName}
              onChange={(e) => setDlgProductName(e.target.value)}
              fullWidth
              sx={{ mt: 1.5, mb: 2 }}
              inputProps={{ maxLength: 255 }}
            />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
              <TextField
                label="Cantidad"
                size="small"
                type="number"
                value={dlgQuantity}
                onChange={(e) => setDlgQuantity(e.target.value)}
                inputProps={{
                  min: 1,
                  ...(editLine && !editLine.isManual && normalizeInventoryUnits(editLine.stockQuantity) != null
                    ? { max: Math.max(1, normalizeInventoryUnits(editLine.stockQuantity)) }
                    : {}),
                  step: 1,
                }}
                sx={{ width: 110 }}
                helperText={
                  editLine && !editLine.isManual && normalizeInventoryUnits(editLine.stockQuantity) != null
                    ? `Máx. ${Math.max(1, normalizeInventoryUnits(editLine.stockQuantity))} en inventario`
                    : undefined
                }
              />
              <TextField
                label="Precio unitario"
                size="small"
                type="number"
                value={dlgUnitPrice}
                onChange={(e) => setDlgUnitPrice(e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                sx={{ width: 160 }}
              />
              <TextField
                label="Desc. %"
                size="small"
                type="number"
                value={dlgDiscountPercent}
                onChange={(e) => setDlgDiscountPercent(e.target.value)}
                inputProps={{ min: 0, max: 100, step: 0.5 }}
                sx={{ width: 110 }}
              />
            </Box>
            {editLine?.isManual ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Pieza externa
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Tipo</InputLabel>
                    <Select label="Tipo" value={dlgPartType} onChange={(e) => setDlgPartType(e.target.value)}>
                      {PIEZA_MANUAL_TIPO.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Estado</InputLabel>
                    <Select label="Estado" value={dlgPartCondition} onChange={(e) => setDlgPartCondition(e.target.value)}>
                      {PIEZA_MANUAL_ESTADO.map((o) => (
                        <MenuItem key={o.value} value={o.value}>
                          {o.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Surtido (días)"
                    size="small"
                    type="number"
                    value={dlgDeliveryLeadDays}
                    onChange={(e) => setDlgDeliveryLeadDays(e.target.value)}
                    inputProps={{ min: 1, max: 365, step: 1 }}
                    sx={{ width: 140 }}
                  />
                </Box>
              </>
            ) : editLine && (editLine.productPartType || editLine.productPartCondition) ? (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary" display="block">
                  {editLine.productPartType ? partTypeLabel(editLine.productPartType) : '—'}
                  {' · '}
                  {editLine.productPartCondition ? partConditionLabel(editLine.productPartCondition) : '—'}
                </Typography>
              </>
            ) : null}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Vehículo
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
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
                    <MenuItem key={m.id ?? m.name} value={m.name}>
                      {m.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Año"
                size="small"
                value={dlgYear}
                onChange={(e) => setDlgYear(e.target.value)}
                sx={{ width: 100 }}
                inputProps={{ maxLength: 20 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeEditLineDialog}>Cancelar</Button>
            <Button variant="contained" onClick={saveEditLineDialog} sx={{ bgcolor: '#7B2CBF', '&:hover': { bgcolor: '#6A26A8' } }}>
              Guardar
            </Button>
          </DialogActions>
        </Dialog>

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
          open={markSoldConfirmOpen}
          onClose={() => {
            if (!markSoldLoading) setMarkSoldConfirmOpen(false)
          }}
          disableEscapeKeyDown={markSoldLoading}
          PaperProps={{ sx: { position: 'relative', minWidth: 320, maxWidth: 440 } }}
        >
          <DialogTitle>{soldMissingOrder ? 'Completar nota de venta' : 'Marcar como vendido'}</DialogTitle>
          <DialogContent>
            {markSoldLoading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, minHeight: 56 }}>
                <CircularProgress size={32} />
                <Typography color="text.secondary">
                  {soldMissingOrder ? 'Creando nota de venta y expediente…' : 'Registrando venta en el sistema…'}
                </Typography>
              </Box>
            ) : soldMissingOrder ? (
              <Typography color="text.secondary" variant="body2">
                Esta cotización está marcada como <strong>vendida</strong> pero no tiene nota de venta ni expediente
                digital. Se creará el registro en <strong>Ventas</strong> (canal Asesor) y su expediente. ¿Desea
                continuar?
              </Typography>
            ) : (
              <Typography color="text.secondary" variant="body2">
                Se creará un registro en <strong>Ventas</strong> con tipo <strong>Asesor</strong> (mismas piezas y
                montos de esta cotización) y la cotización quedará como <strong>vendida</strong>. ¿Desea continuar?
              </Typography>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setMarkSoldConfirmOpen(false)} disabled={markSoldLoading}>
              Cancelar
            </Button>
            <Button color="success" variant="contained" onClick={() => void confirmMarkAsSold()} disabled={markSoldLoading}>
              {markSoldLoading ? 'Procesando…' : 'Confirmar'}
            </Button>
          </DialogActions>
        </Dialog>

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
        {pushNotificationSnackbar}
      </Box>
    </Box>
  )
}
