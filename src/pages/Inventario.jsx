import { useState, useCallback, useEffect, useRef } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogContent,
  DialogActions,
  MenuItem,
  InputAdornment,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Avatar,
  CircularProgress,
  Backdrop,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Chip,
} from '@mui/material'
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ModalHeader from '../components/ModalHeader'
import { getBrands, getCategories, getCarModelsByBrand, createProduct, createProductWithImages, searchProducts, uploadProductImages, deleteProductImage, getProductById, updateProduct, deleteProduct } from '../api/products'
import { useAuth } from '../contexts/AuthContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'

const ESTADO_OPCIONES = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'SEMINUEVO', label: 'Seminuevo' },
]

const TIPO_OPCIONES = [
  { value: 'ORIGINAL', label: 'Original' },
  { value: 'GENÉRICO', label: 'Genérico' },
]

const ESTATUS_OPCIONES = [
  { value: 'DISPONIBLE', label: 'Disponible' },
  { value: 'VENDIDO', label: 'Vendido' },
]

const MAX_FOTOS = 15

/** En "Detalle del producto": al editar, subir fotos a S3 (`images-products/{productId}/`) vía API. */
const DETAIL_ALLOW_IMAGE_UPLOAD = true
/** En "Nuevo producto": vista previa + colección; al guardar, `createProductWithImages` si hay archivos. */
const NEW_PRODUCT_ALLOW_IMAGE_UPLOAD = true

const getInitialProducto = () => ({
  marcaId: '',
  categoriaId: '',
  modelo: '',
  añoDesde: '',
  añoHasta: '',
  nombrePieza: '',
  estado: 'NUEVO',
  tipo: 'ORIGINAL',
  observaciones: '',
  descripcionCompleta: '',
  precio: '',
  /** Piezas disponibles en inventario (entero ≥ 1 por defecto al crear) */
  piezasDisponibles: '1',
  estatus: 'DISPONIBLE',
  imageFiles: [], // File[]; hasta MAX_FOTOS
})

const parseCarYearRange = (carYearRange) => {
  if (!carYearRange || typeof carYearRange !== 'string') return { añoDesde: '', añoHasta: '' }
  const parts = carYearRange.split(/\s*-\s*/).map((s) => s.trim())
  return { añoDesde: parts[0] || '', añoHasta: parts[1] || '' }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isValidUUID = (s) => typeof s === 'string' && UUID_REGEX.test(s.trim())

function formatInventoryPrice(value) {
  if (value == null || value === '') return '—'
  const n = Number(value)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

/** Unidades en inventario desde el payload del API (lista o detalle) */
function stockUnitsFromApi(p) {
  if (!p || typeof p !== 'object') return null
  const v = p.stockQuantity ?? p.stock_quantity
  if (v == null || v === '') return null
  const n = Math.floor(Number(v))
  if (Number.isNaN(n)) return null
  return Math.max(0, n)
}

function productMarkedSoldFromApi(p) {
  if (!p || typeof p !== 'object') return false
  const t = p.soldAt ?? p.sold_at
  return t != null && t !== ''
}

const Inventario = () => {
  const { canDoAction } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [producto, setProducto] = useState(getInitialProducto())
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [carModels, setCarModels] = useState([])
  const [products, setProducts] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [listError, setListError] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailProductId, setDetailProductId] = useState(null)
  const [detailProduct, setDetailProduct] = useState(getInitialProducto())
  const [detailCarModels, setDetailCarModels] = useState([])
  const [detailImages, setDetailImages] = useState([])
  /** Imágenes persistidas al abrir el detalle { id, imageUrl } */
  const [detailServerImages, setDetailServerImages] = useState([])
  /** Copia editable al pulsar Editar */
  const [detailExistingImages, setDetailExistingImages] = useState([])
  const [detailNewImageFiles, setDetailNewImageFiles] = useState([])
  const [detailDeletedImageIds, setDetailDeletedImageIds] = useState([])
  const detailExistingImagesRef = useRef([])
  const [detailEditing, setDetailEditing] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [detailPreviewImageIndex, setDetailPreviewImageIndex] = useState(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const [filterPieza, setFilterPieza] = useState('')
  const [filterMarca, setFilterMarca] = useState('')
  const [filterModelo, setFilterModelo] = useState('')
  const [filterAño, setFilterAño] = useState('')
  const [inventoryViewMode, setInventoryViewMode] = useState('table')
  /** available = solo en inventario; sold = agotadas/vendidas; all = ambos */
  const [inventoryListFilter, setInventoryListFilter] = useState('available')
  const filtersRef = useRef({ filterPieza: '', filterMarca: '', filterModelo: '', filterAño: '' })
  useEffect(() => {
    filtersRef.current = { filterPieza, filterMarca, filterModelo, filterAño }
  }, [filterPieza, filterMarca, filterModelo, filterAño])

  useEffect(() => {
    detailExistingImagesRef.current = detailExistingImages
  }, [detailExistingImages])

  const [detailNewPreviewUrls, setDetailNewPreviewUrls] = useState([])
  useEffect(() => {
    const files = detailNewImageFiles || []
    const urls = files.map((f) => URL.createObjectURL(f))
    setDetailNewPreviewUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [detailNewImageFiles])

  const detailEditLightboxUrls =
    detailEditing
      ? [...detailExistingImages.map((x) => x.imageUrl), ...detailNewPreviewUrls]
      : detailImages
  const detailEditAvatarSrc =
    detailEditing
      ? detailExistingImages[0]?.imageUrl || detailNewPreviewUrls[0] || null
      : detailImages[0] || null

  const loadBrands = useCallback(async () => {
    const res = await getBrands({ activeOnly: false })
    if (res.success) setBrands(res.data || [])
  }, [])

  const loadCategories = useCallback(async () => {
    const res = await getCategories({ activeOnly: false })
    if (res.success) setCategories(res.data || [])
  }, [])

  const loadProducts = useCallback(async () => {
    setListLoading(true)
    setListError('')
    try {
      const f = filtersRef.current
      const res = await searchProducts({
        limit: 100,
        search: (f.filterPieza || '').trim() || undefined,
        brandId: f.filterMarca || undefined,
        modelSearch: (f.filterModelo || '').trim() || undefined,
        year: (f.filterAño || '').trim() || undefined,
        inventoryAvailability: inventoryListFilter === 'available' ? undefined : inventoryListFilter,
      })
      if (res.success && res.data) {
        setProducts(res.data.products || [])
      } else {
        setListError(res.error || 'Error al cargar productos')
      }
    } finally {
      setListLoading(false)
    }
  }, [inventoryListFilter])

  useEffect(() => {
    loadBrands()
    loadCategories()
    loadProducts()
  }, [loadBrands, loadCategories, loadProducts])

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null)

  const handleOpenDialog = () => {
    if (!canDoAction(ACTION.INVENTARIO_CREAR_PRODUCTO)) {
      showDenied()
      return
    }
    setOpenDialog(true)
    setSubmitError('')
    setProducto(getInitialProducto())
    setCarModels([])
    setAvatarPreviewUrl(null)
    loadBrands()
    loadCategories()
  }

  useEffect(() => {
    if (!openDialog) return
    if (producto.marcaId) {
      getCarModelsByBrand(producto.marcaId).then((r) => {
        if (r.success) setCarModels(r.data || [])
        else setCarModels([])
      })
    } else {
      setCarModels([])
    }
  }, [openDialog, producto.marcaId])

  useEffect(() => {
    const first = producto.imageFiles?.[0]
    const url = first ? URL.createObjectURL(first) : null
    setAvatarPreviewUrl(url)
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [producto.imageFiles?.length, producto.imageFiles?.[0]?.name])

  // URLs de vista previa para todas las imágenes (miniaturas en la parte inferior)
  const [imagePreviewUrls, setImagePreviewUrls] = useState([])
  useEffect(() => {
    const files = producto.imageFiles || []
    const urls = files.map((f) => URL.createObjectURL(f))
    setImagePreviewUrls(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [producto.imageFiles])

  // Índice de la imagen abierta en vista ampliada (null = cerrada)
  const [previewImageIndex, setPreviewImageIndex] = useState(null)

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setProducto(getInitialProducto())
    setSubmitError('')
    setPreviewImageIndex(null)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProducto((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'marcaId') next.modelo = ''
      return next
    })
  }

  const handleImageFiles = (e) => {
    if (!NEW_PRODUCT_ALLOW_IMAGE_UPLOAD) return
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
    setProducto((prev) => {
      const current = prev.imageFiles || []
      const next = [...current, ...files].slice(0, MAX_FOTOS)
      return { ...prev, imageFiles: next }
    })
    e.target.value = ''
  }

  const handleImageDrop = (e) => {
    if (!NEW_PRODUCT_ALLOW_IMAGE_UPLOAD) return
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    setProducto((prev) => {
      const current = prev.imageFiles || []
      const next = [...current, ...files].slice(0, MAX_FOTOS)
      return { ...prev, imageFiles: next }
    })
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }

  const removeImageFile = (index) => {
    setProducto((prev) => {
      const next = [...(prev.imageFiles || [])]
      next.splice(index, 1)
      return { ...prev, imageFiles: next }
    })
  }

  const handleSubmit = async () => {
    if (!canDoAction(ACTION.INVENTARIO_CREAR_PRODUCTO)) {
      showDenied()
      return
    }
    setSubmitError('')
    const nombrePieza = (producto.nombrePieza || '').trim()
    const sku = `PROD-${Date.now()}`
    const brandId = (producto.marcaId || '').trim()
    const categoryId = (producto.categoriaId || '').trim() || (categories[0]?.id ?? '')
    if (!nombrePieza) {
      setSubmitError('El nombre de la pieza es obligatorio.')
      return
    }
    if (!brandId) {
      setSubmitError('Debe seleccionar una marca.')
      return
    }
    if (!categoryId) {
      setSubmitError('Debe existir al menos una categoría en el sistema. Cree una categoría o seleccione una.')
      return
    }
    const precio = parseFloat(producto.precio)
    if (Number.isNaN(precio) || precio < 0) {
      setSubmitError('El precio debe ser un número mayor o igual a 0.')
      return
    }
    const piezasRaw = String(producto.piezasDisponibles ?? '').trim()
    const piezasDisp = piezasRaw === '' ? 1 : parseInt(piezasRaw, 10)
    if (Number.isNaN(piezasDisp) || piezasDisp < 0) {
      setSubmitError('Las piezas disponibles deben ser un número entero mayor o igual a 0.')
      return
    }

    let carYearRange = ''
    const añoDesde = producto.añoDesde?.toString().trim()
    const añoHasta = producto.añoHasta?.toString().trim()
    if (añoDesde || añoHasta) {
      carYearRange = [añoDesde, añoHasta].filter(Boolean).join(' - ')
    }

    setLoading(true)
    const carModelId = (producto.modelo || '').trim() || undefined
    const payload = {
      sku,
      name: nombrePieza,
      description: (producto.descripcionCompleta || '').trim() || undefined,
      brandId,
      carModelId,
      carYearRange: carYearRange || undefined,
      partCondition: producto.estado || 'NUEVO',
      partType: producto.tipo || 'ORIGINAL',
      observations: (producto.observaciones || '').trim() || undefined,
      categoryId: categoryId,
      price: precio,
      isActive: producto.estatus === 'DISPONIBLE',
      stockQuantity: piezasDisp,
    }
    const imageFiles = NEW_PRODUCT_ALLOW_IMAGE_UPLOAD
      ? (producto.imageFiles || []).slice(0, MAX_FOTOS)
      : []
    const result =
      imageFiles.length > 0
        ? await createProductWithImages(payload, imageFiles)
        : await createProduct(payload)
    if (!result.success) {
      setLoading(false)
      setSubmitError(result.error || 'Error al guardar el producto.')
      return
    }
    setLoading(false)
    handleCloseDialog()
    loadProducts()
  }

  const openDetailModal = async (productId) => {
    setDetailProductId(productId)
    setDetailOpen(true)
    setDetailError('')
    setDetailEditing(false)
    setDetailImages([])
    setDetailServerImages([])
    setDetailExistingImages([])
    setDetailNewImageFiles([])
    setDetailDeletedImageIds([])
    setDetailProduct(getInitialProducto())
    setDetailLoading(true)
    loadBrands()
    loadCategories()
    const res = await getProductById(productId)
    setDetailLoading(false)
    if (!res.success) {
      setDetailError(res.error || 'Error al cargar el producto')
      return
    }
    const d = res.data
    const years = parseCarYearRange(d.carYearRange)
    setDetailProduct({
      marcaId: d.brandId || '',
      categoriaId: d.categoryId || '',
      modelo: d.carModelId || '',
      añoDesde: years.añoDesde,
      añoHasta: years.añoHasta,
      nombrePieza: d.name || '',
      estado: d.partCondition || 'NUEVO',
      tipo: d.partType || 'ORIGINAL',
      observaciones: d.observations || '',
      descripcionCompleta: d.description || '',
      precio: d.price != null ? String(d.price) : '',
      piezasDisponibles: String(stockUnitsFromApi(d) ?? 0),
      estatus: d.isActive === true ? 'DISPONIBLE' : 'VENDIDO',
      imageFiles: [],
    })
    const serverImgs = Array.isArray(d.images)
      ? d.images
          .filter((img) => img && img.imageUrl)
          .map((img) => ({ id: img.id, imageUrl: img.imageUrl }))
      : []
    setDetailServerImages(serverImgs)
    setDetailImages(serverImgs.map((x) => x.imageUrl))
    if (d.brandId) {
      getCarModelsByBrand(d.brandId).then((r) => setDetailCarModels(r.success ? (r.data || []) : []))
    } else {
      setDetailCarModels([])
    }
  }

  const closeDetailModal = () => {
    setDetailOpen(false)
    setDetailProductId(null)
    setDetailProduct(getInitialProducto())
    setDetailCarModels([])
    setDetailImages([])
    setDetailServerImages([])
    setDetailExistingImages([])
    setDetailNewImageFiles([])
    setDetailDeletedImageIds([])
    setDetailEditing(false)
    setDetailError('')
    setDetailPreviewImageIndex(null)
  }

  const handleStartDetailEdit = () => {
    if (!canDoAction(ACTION.INVENTARIO_EDITAR_PRODUCTO)) {
      showDenied()
      return
    }
    setDetailExistingImages(detailServerImages.map((x) => ({ id: x.id, imageUrl: x.imageUrl })))
    setDetailNewImageFiles([])
    setDetailDeletedImageIds([])
    setDetailEditing(true)
  }

  const removeDetailExistingImage = (imageId) => {
    if (!imageId) return
    setDetailExistingImages((prev) => prev.filter((x) => x.id !== imageId))
    setDetailDeletedImageIds((prev) => [...new Set([...prev, imageId])])
  }

  const removeDetailNewImageFile = (index) => {
    setDetailNewImageFiles((prev) => {
      const n = [...prev]
      n.splice(index, 1)
      return n
    })
  }

  const handleDetailImageFiles = (e) => {
    if (!DETAIL_ALLOW_IMAGE_UPLOAD) return
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    setDetailNewImageFiles((prev) => {
      const ex = detailExistingImagesRef.current.length
      const room = Math.max(0, MAX_FOTOS - ex - prev.length)
      return [...prev, ...files.slice(0, room)]
    })
    e.target.value = ''
  }

  const handleDetailImageDrop = (e) => {
    if (!DETAIL_ALLOW_IMAGE_UPLOAD) return
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files || []).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    setDetailNewImageFiles((prev) => {
      const ex = detailExistingImagesRef.current.length
      const room = Math.max(0, MAX_FOTOS - ex - prev.length)
      return [...prev, ...files.slice(0, room)]
    })
  }

  const detailEditImageCount = detailExistingImages.length + detailNewImageFiles.length
  const detailCanAddMoreImages = DETAIL_ALLOW_IMAGE_UPLOAD && detailEditing && detailEditImageCount < MAX_FOTOS

  const handleDetailInputChange = (e) => {
    const { name, value } = e.target
    setDetailProduct((prev) => {
      const next = { ...prev, [name]: value }
      if (name === 'marcaId') {
        next.modelo = ''
        getCarModelsByBrand(value || '').then((r) => setDetailCarModels(r.success ? (r.data || []) : []))
      }
      return next
    })
  }

  const handleDetailSave = async () => {
    if (!canDoAction(ACTION.INVENTARIO_EDITAR_PRODUCTO)) {
      showDenied()
      return
    }
    if (!detailProductId) return
    setDetailError('')
    const nombrePieza = (detailProduct.nombrePieza || '').trim()
    if (!nombrePieza) {
      setDetailError('El nombre de la pieza es obligatorio.')
      return
    }
    const brandId = (detailProduct.marcaId || '').trim()
    if (!brandId) {
      setDetailError('Debe seleccionar una marca.')
      return
    }
    const precio = parseFloat(detailProduct.precio)
    if (Number.isNaN(precio) || precio < 0) {
      setDetailError('El precio debe ser un número mayor o igual a 0.')
      return
    }
    const piezasRawD = String(detailProduct.piezasDisponibles ?? '').trim()
    const piezasDispD = piezasRawD === '' ? 0 : parseInt(piezasRawD, 10)
    if (Number.isNaN(piezasDispD) || piezasDispD < 0) {
      setDetailError('Las piezas disponibles deben ser un número entero mayor o igual a 0.')
      return
    }
    let carYearRange = ''
    const añoDesde = detailProduct.añoDesde?.toString().trim()
    const añoHasta = detailProduct.añoHasta?.toString().trim()
    if (añoDesde || añoHasta) {
      carYearRange = [añoDesde, añoHasta].filter(Boolean).join(' - ')
    }
    setDetailLoading(true)
    const modeloId = (detailProduct.modelo || '').trim()
    const payload = {
      name: nombrePieza,
      description: (detailProduct.descripcionCompleta || '').trim() || undefined,
      brandId,
      ...(isValidUUID(modeloId) ? { carModelId: modeloId } : {}),
      carYearRange: carYearRange || undefined,
      partCondition: detailProduct.estado || 'NUEVO',
      partType: detailProduct.tipo || 'ORIGINAL',
      observations: (detailProduct.observaciones || '').trim() || undefined,
      categoryId: (detailProduct.categoriaId || '').trim() || undefined,
      price: precio,
      isActive: detailProduct.estatus === 'DISPONIBLE',
      stockQuantity: piezasDispD,
    }
    const result = await updateProduct(detailProductId, payload)
    if (!result.success) {
      setDetailLoading(false)
      setDetailError(result.error || 'Error al guardar.')
      return
    }

    for (const imageId of detailDeletedImageIds) {
      const dr = await deleteProductImage(detailProductId, imageId)
      if (!dr.success) {
        setDetailLoading(false)
        setDetailError(dr.error || 'Error al eliminar una imagen.')
        return
      }
    }

    if (DETAIL_ALLOW_IMAGE_UPLOAD && detailNewImageFiles.length > 0) {
      const ur = await uploadProductImages(detailProductId, detailNewImageFiles)
      if (!ur.success) {
        setDetailLoading(false)
        setDetailError(ur.error || 'Error al subir las imágenes nuevas.')
        return
      }
    }

    setDetailLoading(false)
    setSnackbar({ open: true, message: 'Producto actualizado correctamente', severity: 'success' })
    closeDetailModal()
    loadProducts()
  }

  const openDeleteConfirm = () => {
    if (!canDoAction(ACTION.INVENTARIO_ELIMINAR_PRODUCTO)) {
      showDenied()
      return
    }
    if (detailProductId) setDeleteConfirmOpen(true)
  }

  const closeDeleteConfirm = () => setDeleteConfirmOpen(false)

  const handleConfirmDelete = async () => {
    if (!canDoAction(ACTION.INVENTARIO_ELIMINAR_PRODUCTO)) {
      showDenied()
      return
    }
    if (!detailProductId) return
    setDetailError('')
    setDetailLoading(true)
    const result = await deleteProduct(detailProductId)
    setDetailLoading(false)
    if (!result.success) {
      setDetailError(result.error || 'Error al eliminar.')
      setDeleteConfirmOpen(false)
      return
    }
    closeDeleteConfirm()
    closeDetailModal()
    loadProducts()
  }

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen)
  const handleSidebarClose = () => setSidebarOpen(false)

  const imageFiles = producto.imageFiles || []
  const canAddMoreImages = NEW_PRODUCT_ALLOW_IMAGE_UPLOAD && imageFiles.length < MAX_FOTOS

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
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
        <Header onMenuClick={handleMenuClick} />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: { xs: '24px', sm: '28px', md: '32px' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold', fontSize: { xs: '24px', sm: '28px', md: '32px' } }}>
            Inventario
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              component="label"
              sx={{
                textTransform: 'none',
                borderColor: '#7b1fa2',
                color: '#7b1fa2',
                '&:hover': { borderColor: '#6a1b9a', backgroundColor: 'rgba(123, 31, 162, 0.04)' },
              }}
            >
              Cargar Archivo
              <input type="file" hidden accept=".csv,.xlsx,.xls" onChange={() => {}} />
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{
                textTransform: 'none',
                backgroundColor: '#7b1fa2',
                '&:hover': { backgroundColor: '#6a1b9a' },
              }}
            >
              Nuevo Producto
            </Button>
          </Box>
        </Box>

        <Paper elevation={2} sx={{ padding: { xs: '16px', sm: '24px' }, borderRadius: '12px' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end', mb: 3 }}>
            <TextField
              label="Pieza"
              size="small"
              placeholder="Nombre de la pieza"
              value={filterPieza}
              onChange={(e) => setFilterPieza(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 160 } }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 160 } }}>
              <InputLabel id="filter-marca-label" shrink>Marca</InputLabel>
              <Select
                labelId="filter-marca-label"
                label="Marca"
                value={filterMarca}
                onChange={(e) => setFilterMarca(e.target.value)}
                displayEmpty
                MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
              >
                <MenuItem value="">Todas</MenuItem>
                {brands.map((b) => (
                  <MenuItem key={b.id} value={b.id}>{b.name || b.nombre || '-'}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Modelo"
              size="small"
              placeholder="Modelo"
              value={filterModelo}
              onChange={(e) => setFilterModelo(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 140 } }}
            />
            <TextField
              label="Año"
              size="small"
              placeholder="ej. 2015"
              value={filterAño}
              onChange={(e) => setFilterAño(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 100 } }}
            />
            <Button
              variant="contained"
              onClick={() => loadProducts()}
              disabled={listLoading}
              sx={{ textTransform: 'none', backgroundColor: '#7b1fa2', '&:hover': { backgroundColor: '#6a1b9a' } }}
            >
              Buscar
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setFilterPieza('')
                setFilterMarca('')
                setFilterModelo('')
                setFilterAño('')
                filtersRef.current = { filterPieza: '', filterMarca: '', filterModelo: '', filterAño: '' }
                loadProducts()
              }}
              disabled={listLoading}
              sx={{ textTransform: 'none', borderColor: '#757575', color: '#757575' }}
            >
              Limpiar
            </Button>
            <ToggleButtonGroup
              value={inventoryListFilter}
              exclusive
              onChange={(_, v) => v && setInventoryListFilter(v)}
              size="small"
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.25 } }}
            >
              <Tooltip title="Piezas con stock en inventario">
                <ToggleButton value="available" aria-label="disponibles">
                  Disponibles
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Piezas marcadas como vendidas (stock en cero por venta desde cotización)">
                <ToggleButton value="sold" aria-label="vendidas">
                  Vendidas
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Mostrar todo el catálogo">
                <ToggleButton value="all" aria-label="todas">
                  Todas
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
            <Box sx={{ flexGrow: 1, minWidth: 8 }} />
            <ToggleButtonGroup
              value={inventoryViewMode}
              exclusive
              onChange={(_, v) => v && setInventoryViewMode(v)}
              size="small"
              sx={{ '& .MuiToggleButton-root': { textTransform: 'none', px: 1.5 } }}
            >
              <Tooltip title="Vista tabla">
                <ToggleButton value="table" aria-label="tabla">
                  <ViewListIcon fontSize="small" sx={{ mr: 0.5 }} /> Tabla
                </ToggleButton>
              </Tooltip>
              <Tooltip title="Vista tarjetas">
                <ToggleButton value="cards" aria-label="tarjetas">
                  <ViewModuleIcon fontSize="small" sx={{ mr: 0.5 }} /> Tarjetas
                </ToggleButton>
              </Tooltip>
            </ToggleButtonGroup>
          </Box>

          {listError && (
            <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setListError('')}>
              {listError}
            </Alert>
          )}

          {inventoryViewMode === 'table' ? (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', color: '#757575', width: 56 }} align="center">Vista</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>Pieza</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>Marca</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>Modelo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>Año</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>Estado</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#757575' }} align="center">
                      Inventario
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#757575' }} align="center">
                      Piezas disp.
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#757575' }} align="right">
                      Precio
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {listLoading ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={40} sx={{ color: '#7b1fa2' }} aria-label="Cargando inventario" />
                        <Typography variant="body2" sx={{ color: '#757575', mt: 2, display: 'block' }}>
                          Cargando productos…
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ padding: '40px' }}>
                        <Typography variant="body2" sx={{ color: '#757575' }}>
                          {inventoryListFilter === 'sold'
                            ? 'No hay piezas vendidas con estos filtros.'
                            : inventoryListFilter === 'all'
                              ? 'No hay productos con estos filtros.'
                              : 'No hay productos registrados. Agrega un nuevo producto o carga un archivo.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((p) => {
                      const brandName =
                        (p.brandName && String(p.brandName).trim()) ||
                        brands.find((b) => b.id === p.brandId)?.name ||
                        brands.find((b) => b.id === p.brandId)?.nombre ||
                        '—'
                      const modelDisplay =
                        (p.modelName && String(p.modelName).trim()) ||
                        p.carModel?.name ||
                        p.model ||
                        '—'
                      const estadoLabel = p.partCondition === 'SEMINUEVO' ? 'Seminuevo' : p.partCondition === 'NUEVO' ? 'Nuevo' : p.partCondition || '—'
                      const tipoLabel = p.partType === 'GENÉRICO' ? 'Genérico' : p.partType === 'ORIGINAL' ? 'Original' : p.partType || '—'
                      const stockN = stockUnitsFromApi(p)
                      const soldInv = productMarkedSoldFromApi(p)
                      return (
                        <TableRow
                          key={p.id}
                          onDoubleClick={() => openDetailModal(p.id)}
                          sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                        >
                          <TableCell align="center" sx={{ py: 1 }}>
                            <Avatar
                              src={p.primaryImageUrl || undefined}
                              variant="rounded"
                              sx={{ width: 40, height: 40, mx: 'auto', bgcolor: 'grey.200' }}
                            >
                              {!p.primaryImageUrl && <ImageIcon sx={{ fontSize: 22, color: 'grey.500' }} />}
                            </Avatar>
                          </TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell>{brandName}</TableCell>
                          <TableCell>{modelDisplay}</TableCell>
                          <TableCell>{p.carYearRange || '—'}</TableCell>
                          <TableCell>{estadoLabel}</TableCell>
                          <TableCell>{tipoLabel}</TableCell>
                          <TableCell align="center">
                            <Chip
                              size="small"
                              label={soldInv ? 'Vendida' : 'Disponible'}
                              color={soldInv ? 'default' : 'success'}
                              variant={soldInv ? 'filled' : 'outlined'}
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>
                            {stockN != null ? stockN : '—'}
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            {formatInventoryPrice(p.price)}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box>
              {listLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                  <CircularProgress size={40} sx={{ color: '#7b1fa2' }} aria-label="Cargando inventario" />
                  <Typography variant="body2" sx={{ color: '#757575', mt: 2 }}>
                    Cargando productos…
                  </Typography>
                </Box>
              ) : products.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#757575', textAlign: 'center', py: 6 }}>
                  {inventoryListFilter === 'sold'
                    ? 'No hay piezas vendidas con estos filtros.'
                    : inventoryListFilter === 'all'
                      ? 'No hay productos con estos filtros.'
                      : 'No hay productos registrados. Agrega un nuevo producto o carga un archivo.'}
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {products.map((p) => {
                    const brandName =
                      (p.brandName && String(p.brandName).trim()) ||
                      brands.find((b) => b.id === p.brandId)?.name ||
                      brands.find((b) => b.id === p.brandId)?.nombre ||
                      '—'
                    const stockCard = stockUnitsFromApi(p)
                    const soldCard = productMarkedSoldFromApi(p)
                    return (
                      <Grid item xs={6} sm={4} md={3} lg={2} key={p.id}>
                        <Card
                          elevation={2}
                          onDoubleClick={() => openDetailModal(p.id)}
                          sx={{
                            cursor: 'pointer',
                            borderRadius: 2,
                            overflow: 'hidden',
                            transition: 'box-shadow 0.2s',
                            '&:hover': { boxShadow: 4 },
                          }}
                        >
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box
                              sx={{
                                width: '100%',
                                height: 88,
                                borderRadius: 1,
                                overflow: 'hidden',
                                bgcolor: 'grey.100',
                                mb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {p.primaryImageUrl ? (
                                <Box component="img" src={p.primaryImageUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <ImageIcon sx={{ fontSize: 40, color: 'grey.400' }} />
                              )}
                            </Box>
                            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} title={p.name}>
                              {p.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={brandName}>
                              {brandName}
                            </Typography>
                            <Box sx={{ mt: 0.75, display: 'flex', justifyContent: 'center' }}>
                              <Chip
                                size="small"
                                label={soldCard ? 'Vendida' : 'Disponible'}
                                color={soldCard ? 'default' : 'success'}
                                variant={soldCard ? 'filled' : 'outlined'}
                                sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }}
                              />
                            </Box>
                            <Typography variant="caption" color="primary" sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}>
                              {stockCard != null ? `Disp.: ${stockCard}` : 'Disp.: —'}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )
                  })}
                </Grid>
              )}
            </Box>
          )}
        </Paper>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}>
          <ModalHeader title="Nuevo Producto de Autopartes" onClose={handleCloseDialog} />
          <DialogContent sx={{ padding: '24px 24px 8px', position: 'relative' }}>
            {/* Overlay de loading centrado al guardar */}
            <Backdrop
              open={loading}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <CircularProgress size={56} thickness={4} sx={{ color: 'primary.main' }} />
              <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
                Guardando producto…
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Subiendo imágenes al bucket
              </Typography>
            </Backdrop>
            {submitError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError('')}>
                {submitError}
              </Alert>
            )}

            {/* Dos columnas: izquierda = inputs (ancho fijo), derecha = vista previa */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
              {/* Columna izquierda: Nombre, Marca|Modelo, Año desde|hasta, Estado|Tipo */}
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600 }}>Nombre de la pieza</Typography>
                <TextField fullWidth label="Nombre pieza" name="nombrePieza" value={producto.nombrePieza} onChange={handleInputChange} variant="outlined" size="small" required sx={{ maxWidth: '100%' }} />

                {/* Marca y Modelo en dos columnas */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth required size="small" variant="outlined" sx={{ minWidth: 0, '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}>
                    <InputLabel id="inventario-marca-label" shrink>Marca</InputLabel>
                    <Select name="marcaId" value={producto.marcaId} onChange={handleInputChange} labelId="inventario-marca-label" label="Marca" displayEmpty MenuProps={{ PaperProps: { sx: { maxHeight: 320 } }, autoFocus: false }}>
                      <MenuItem value="">Seleccione marca</MenuItem>
                      {brands.map((b) => (
                        <MenuItem key={b.id} value={b.id}>{b.name || b.nombre || '-'}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" variant="outlined" disabled={!producto.marcaId} sx={{ minWidth: 0, '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}>
                    <InputLabel id="inventario-modelo-label" shrink>Modelo</InputLabel>
                    <Select name="modelo" value={producto.modelo} onChange={handleInputChange} labelId="inventario-modelo-label" label="Modelo" displayEmpty MenuProps={{ PaperProps: { sx: { maxHeight: 320 } }, autoFocus: false }}>
                      <MenuItem value="">{producto.marcaId ? 'Seleccione modelo' : 'Seleccione marca primero'}</MenuItem>
                      {carModels.map((m) => (
                        <MenuItem key={m.id} value={m.id}>{m.model || m.name || '-'}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                {/* Año desde y Año hasta */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField fullWidth label="Año desde" name="añoDesde" type="number" value={producto.añoDesde} onChange={handleInputChange} variant="outlined" size="small" placeholder="ej. 2013" inputProps={{ min: 1900, max: 2100 }} required />
                  <TextField fullWidth label="Año hasta" name="añoHasta" type="number" value={producto.añoHasta} onChange={handleInputChange} variant="outlined" size="small" placeholder="ej. 2017" inputProps={{ min: 1900, max: 2100 }} required />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth required size="small" variant="outlined">
                    <InputLabel id="inventario-estado-label" shrink>Estado</InputLabel>
                    <Select name="estado" value={producto.estado} onChange={handleInputChange} labelId="inventario-estado-label" label="Estado">
                      {ESTADO_OPCIONES.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth required size="small" variant="outlined">
                    <InputLabel id="inventario-tipo-label" shrink>Tipo</InputLabel>
                    <Select name="tipo" value={producto.tipo} onChange={handleInputChange} labelId="inventario-tipo-label" label="Tipo">
                      {TIPO_OPCIONES.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Columna derecha: Vista previa (solo si se permiten imágenes al crear) */}
              <Box
                sx={{
                  flexShrink: 0,
                  width: { xs: '100%', md: 220 },
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  borderRadius: 2,
                  bgcolor: 'grey.50',
                  p: 2,
                  minHeight: 280,
                  ...(NEW_PRODUCT_ALLOW_IMAGE_UPLOAD ? { cursor: 'pointer', '&:hover': { borderColor: 'grey.500', bgcolor: 'grey.100' } } : {}),
                }}
                component={NEW_PRODUCT_ALLOW_IMAGE_UPLOAD ? 'label' : 'div'}
                onDrop={NEW_PRODUCT_ALLOW_IMAGE_UPLOAD ? handleImageDrop : undefined}
                onDragOver={NEW_PRODUCT_ALLOW_IMAGE_UPLOAD ? handleDragOver : undefined}
              >
                {NEW_PRODUCT_ALLOW_IMAGE_UPLOAD && (
                  <input type="file" hidden accept="image/*" multiple onChange={handleImageFiles} />
                )}
                <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600, mb: 1.5 }}>Vista previa</Typography>
                <Avatar
                  src={NEW_PRODUCT_ALLOW_IMAGE_UPLOAD ? avatarPreviewUrl : undefined}
                  variant="rounded"
                  sx={{
                    width: 160,
                    height: 160,
                    bgcolor: 'grey.200',
                    ...(NEW_PRODUCT_ALLOW_IMAGE_UPLOAD ? { '&:hover': { bgcolor: 'grey.300' } } : {}),
                  }}
                >
                  {(NEW_PRODUCT_ALLOW_IMAGE_UPLOAD ? !avatarPreviewUrl : true) && (
                    <ImageIcon sx={{ fontSize: 64, color: 'grey.500' }} />
                  )}
                </Avatar>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, textAlign: 'center' }}>
                  {NEW_PRODUCT_ALLOW_IMAGE_UPLOAD ? 'Clic o arrastrar imagen aquí' : 'Carga de imágenes no disponible aquí'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField
                label="Precio"
                name="precio"
                type="number"
                value={producto.precio}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                sx={{ flex: '1 1 120px', minWidth: 0 }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, inputProps: { min: 0, step: 0.01 } }}
              />
              <TextField
                label="Piezas disponibles"
                name="piezasDisponibles"
                type="number"
                value={producto.piezasDisponibles}
                onChange={handleInputChange}
                variant="outlined"
                size="small"
                sx={{ flex: '1 1 120px', minWidth: 0 }}
                helperText="Unidades en inventario"
                inputProps={{ min: 0, step: 1 }}
              />
              <FormControl size="small" sx={{ flex: '1 1 140px', minWidth: 0 }}>
                <InputLabel>Estatus</InputLabel>
                <Select name="estatus" value={producto.estatus} onChange={handleInputChange} label="Estatus">
                  {ESTATUS_OPCIONES.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" variant="outlined" sx={{ flex: '1 1 200px', minWidth: 0, '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}>
                <InputLabel id="inventario-categoria-label" shrink>Categoría (opcional)</InputLabel>
                <Select name="categoriaId" value={producto.categoriaId} onChange={handleInputChange} labelId="inventario-categoria-label" label="Categoría (opcional)" displayEmpty MenuProps={{ PaperProps: { sx: { maxHeight: 320 } }, autoFocus: false }}>
                  <MenuItem value="">Ninguna</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={c.id}>{c.name || c.nombre || '-'}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Observaciones y Descripción en dos columnas */}
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <TextField fullWidth label="Observaciones" name="observaciones" value={producto.observaciones} onChange={handleInputChange} variant="outlined" size="small" multiline rows={3} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <TextField fullWidth label="Descripción completa" name="descripcionCompleta" value={producto.descripcionCompleta} onChange={handleInputChange} variant="outlined" size="small" multiline rows={3} required />
              </Box>
            </Box>

            {/* Fotos al crear (solo si NEW_PRODUCT_ALLOW_IMAGE_UPLOAD) */}
            {NEW_PRODUCT_ALLOW_IMAGE_UPLOAD && (
              <>
                <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600, mb: 1.5 }}>
                  Fotos de la pieza (hasta {MAX_FOTOS})
                </Typography>
                {canAddMoreImages && (
                  <Button component="label" variant="outlined" size="small" startIcon={<UploadIcon />} sx={{ textTransform: 'none', mb: 2 }}>
                    Cargar imágenes
                    <input type="file" hidden accept="image/*" multiple onChange={handleImageFiles} />
                  </Button>
                )}
              </>
            )}
            {/* Vistas previas de las partes cargadas (parte inferior); clic abre vista ampliada */}
            {NEW_PRODUCT_ALLOW_IMAGE_UPLOAD && imageFiles.length > 0 && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>Vistas previas de las imágenes cargadas (clic para ampliar)</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  {imageFiles.map((file, i) => (
                    <Box
                      key={i}
                      sx={{
                        position: 'relative',
                        border: '1px solid',
                        borderColor: 'grey.300',
                        borderRadius: 1,
                        overflow: 'hidden',
                        bgcolor: 'grey.100',
                        cursor: 'pointer',
                        '&:hover': { borderColor: 'grey.500', boxShadow: 1 },
                      }}
                    >
                      <Box
                        component="img"
                        src={imagePreviewUrls[i]}
                        alt={file.name}
                        onClick={() => setPreviewImageIndex(i)}
                        sx={{
                          width: 100,
                          height: 100,
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeImageFile(i)
                        }}
                        color="error"
                        aria-label="Quitar imagen"
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          bgcolor: 'rgba(255,255,255,0.9)',
                          '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="caption" sx={{ display: 'block', px: 1, py: 0.5, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>
                        {file.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Dialog vista ampliada de la imagen (al hacer clic en una miniatura) */}
            <Dialog
              open={previewImageIndex !== null}
              onClose={() => setPreviewImageIndex(null)}
              maxWidth={false}
              PaperProps={{
                sx: {
                  maxWidth: '95vw',
                  maxHeight: '95vh',
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: 'grey.900',
                },
              }}
            >
              <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 280, minHeight: 200 }}>
                {previewImageIndex !== null && imagePreviewUrls[previewImageIndex] && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="img"
                      src={imagePreviewUrls[previewImageIndex]}
                      alt={imageFiles[previewImageIndex]?.name || 'Vista previa'}
                      sx={{
                        maxWidth: '90vw',
                        maxHeight: '75vh',
                        objectFit: 'contain',
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'grey.400', textAlign: 'center', maxWidth: '90vw' }}>
                      {imageFiles[previewImageIndex]?.name}
                    </Typography>
                  </Box>
                )}
              </DialogContent>
              <DialogActions sx={{ justifyContent: 'center', py: 1, bgcolor: 'grey.900' }}>
                <Button onClick={() => setPreviewImageIndex(null)} sx={{ textTransform: 'none', color: 'grey.300' }}>
                  Cerrar
                </Button>
              </DialogActions>
            </Dialog>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
            <Button onClick={handleCloseDialog} sx={{ textTransform: 'none', color: '#757575' }} disabled={loading}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained" disabled={loading} sx={{ textTransform: 'none', backgroundColor: '#7b1fa2', '&:hover': { backgroundColor: '#6a1b9a' } }}>
              {loading ? 'Guardando…' : 'Guardar Producto'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal detalle: misma disposición gráfica que Nuevo Producto */}
        <Dialog open={detailOpen} onClose={closeDetailModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}>
          <ModalHeader title={detailProduct.nombrePieza ? `Detalle del producto: ${detailProduct.nombrePieza}` : 'Detalle del producto'} onClose={closeDetailModal} />
          <DialogContent sx={{ padding: '24px 24px 8px', position: 'relative', minHeight: detailLoading ? 420 : 'auto' }}>
            <Backdrop
              open={detailLoading}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 10,
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <CircularProgress size={56} thickness={4} sx={{ color: 'primary.main' }} />
              <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
                Cargando detalle del producto…
              </Typography>
            </Backdrop>

            {!detailLoading && detailError && !detailProduct.nombrePieza && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDetailError('')}>
                {detailError}
              </Alert>
            )}

            {!detailLoading && detailProduct.nombrePieza && (
              <>
                {detailError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDetailError('')}>
                    {detailError}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
                  <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600 }}>Nombre de la pieza</Typography>
                    <TextField fullWidth label="Nombre pieza" name="nombrePieza" value={detailProduct.nombrePieza} onChange={handleDetailInputChange} variant="outlined" size="small" required sx={{ maxWidth: '100%' }} disabled={!detailEditing} />
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl fullWidth required size="small" variant="outlined" sx={{ minWidth: 0, '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}>
                        <InputLabel id="detail-marca-label" shrink>Marca</InputLabel>
                        <Select name="marcaId" value={detailProduct.marcaId} onChange={handleDetailInputChange} labelId="detail-marca-label" label="Marca" displayEmpty disabled={!detailEditing} MenuProps={{ PaperProps: { sx: { maxHeight: 320 } }, autoFocus: false }}>
                          <MenuItem value="">Seleccione marca</MenuItem>
                          {brands.map((b) => (
                            <MenuItem key={b.id} value={b.id}>{b.name || b.nombre || '-'}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth size="small" variant="outlined" disabled={!detailEditing || !detailProduct.marcaId} sx={{ minWidth: 0, '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}>
                        <InputLabel id="detail-modelo-label" shrink>Modelo</InputLabel>
                        <Select name="modelo" value={detailProduct.modelo} onChange={handleDetailInputChange} labelId="detail-modelo-label" label="Modelo" displayEmpty MenuProps={{ PaperProps: { sx: { maxHeight: 320 } }, autoFocus: false }}>
                          <MenuItem value="">{detailProduct.marcaId ? 'Seleccione modelo' : 'Seleccione marca primero'}</MenuItem>
                          {detailCarModels.map((m) => (
                            <MenuItem key={m.id} value={m.id}>{m.model || m.name || '-'}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <TextField fullWidth label="Año desde" name="añoDesde" type="number" value={detailProduct.añoDesde} onChange={handleDetailInputChange} variant="outlined" size="small" placeholder="ej. 2013" inputProps={{ min: 1900, max: 2100 }} disabled={!detailEditing} />
                      <TextField fullWidth label="Año hasta" name="añoHasta" type="number" value={detailProduct.añoHasta} onChange={handleDetailInputChange} variant="outlined" size="small" placeholder="ej. 2017" inputProps={{ min: 1900, max: 2100 }} disabled={!detailEditing} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <FormControl fullWidth required size="small" variant="outlined">
                        <InputLabel id="detail-estado-label" shrink>Estado</InputLabel>
                        <Select name="estado" value={detailProduct.estado} onChange={handleDetailInputChange} labelId="detail-estado-label" label="Estado" disabled={!detailEditing}>
                          {ESTADO_OPCIONES.map((o) => (
                            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <FormControl fullWidth required size="small" variant="outlined">
                        <InputLabel id="detail-tipo-label" shrink>Tipo</InputLabel>
                        <Select name="tipo" value={detailProduct.tipo} onChange={handleDetailInputChange} labelId="detail-tipo-label" label="Tipo" disabled={!detailEditing}>
                          {TIPO_OPCIONES.map((o) => (
                            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: { xs: '100%', md: 220 },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px dashed',
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      bgcolor: 'grey.50',
                      p: 2,
                      minHeight: 280,
                      ...(DETAIL_ALLOW_IMAGE_UPLOAD && detailEditing
                        ? { cursor: 'pointer', '&:hover': { borderColor: 'grey.500', bgcolor: 'grey.100' } }
                        : {}),
                    }}
                    component={DETAIL_ALLOW_IMAGE_UPLOAD && detailEditing ? 'label' : 'div'}
                    onDrop={DETAIL_ALLOW_IMAGE_UPLOAD && detailEditing ? handleDetailImageDrop : undefined}
                    onDragOver={DETAIL_ALLOW_IMAGE_UPLOAD && detailEditing ? handleDragOver : undefined}
                  >
                    {DETAIL_ALLOW_IMAGE_UPLOAD && detailEditing && (
                      <input type="file" hidden accept="image/*" multiple onChange={handleDetailImageFiles} />
                    )}
                    <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600, mb: 1.5 }}>Vista previa</Typography>
                    <Avatar
                      src={detailEditAvatarSrc || undefined}
                      variant="rounded"
                      sx={{ width: 160, height: 160, bgcolor: 'grey.200' }}
                    >
                      {!detailEditAvatarSrc && <ImageIcon sx={{ fontSize: 64, color: 'grey.500' }} />}
                    </Avatar>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, textAlign: 'center' }}>
                      {!DETAIL_ALLOW_IMAGE_UPLOAD
                        ? (() => {
                            const n = detailEditing ? detailExistingImages.length : detailImages.length
                            const hasImg = detailEditing ? !!detailEditAvatarSrc : !!(detailImages[0])
                            if (n > 1) return `${n} imágenes`
                            if (hasImg) return 'Imagen principal'
                            return 'Sin imagen'
                          })()
                        : detailEditing
                          ? detailCanAddMoreImages
                            ? 'Clic o arrastrar para agregar fotos'
                            : `Máximo ${MAX_FOTOS} imágenes`
                          : detailImages.length > 1
                            ? `${detailImages.length} imágenes`
                            : detailImages[0]
                              ? 'Imagen principal'
                              : 'Sin imagen'}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                  <TextField
                    label="Precio"
                    name="precio"
                    type="number"
                    value={detailProduct.precio}
                    onChange={handleDetailInputChange}
                    variant="outlined"
                    size="small"
                    sx={{ flex: '1 1 120px', minWidth: 0 }}
                    InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, inputProps: { min: 0, step: 0.01 } }}
                    disabled={!detailEditing}
                  />
                  <TextField
                    label="Piezas disponibles"
                    name="piezasDisponibles"
                    type="number"
                    value={detailProduct.piezasDisponibles}
                    onChange={handleDetailInputChange}
                    variant="outlined"
                    size="small"
                    sx={{ flex: '1 1 120px', minWidth: 0 }}
                    helperText="Unidades en inventario"
                    inputProps={{ min: 0, step: 1 }}
                    disabled={!detailEditing}
                  />
                  <FormControl size="small" sx={{ flex: '1 1 140px', minWidth: 0 }}>
                    <InputLabel shrink>Estatus</InputLabel>
                    <Select name="estatus" value={detailProduct.estatus} onChange={handleDetailInputChange} label="Estatus" disabled={!detailEditing}>
                      {ESTATUS_OPCIONES.map((o) => (
                        <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small" variant="outlined" sx={{ flex: '1 1 200px', minWidth: 0, '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }}>
                    <InputLabel id="detail-categoria-label" shrink>Categoría (opcional)</InputLabel>
                    <Select name="categoriaId" value={detailProduct.categoriaId} onChange={handleDetailInputChange} labelId="detail-categoria-label" label="Categoría (opcional)" displayEmpty disabled={!detailEditing} MenuProps={{ PaperProps: { sx: { maxHeight: 320 } }, autoFocus: false }}>
                      <MenuItem value="">Ninguna</MenuItem>
                      {categories.map((c) => (
                        <MenuItem key={c.id} value={c.id}>{c.name || c.nombre || '-'}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <TextField fullWidth label="Observaciones" name="observaciones" value={detailProduct.observaciones} onChange={handleDetailInputChange} variant="outlined" size="small" multiline rows={3} disabled={!detailEditing} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <TextField fullWidth label="Descripción completa" name="descripcionCompleta" value={detailProduct.descripcionCompleta} onChange={handleDetailInputChange} variant="outlined" size="small" multiline rows={3} required disabled={!detailEditing} />
                  </Box>
                </Box>

                <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600, mb: 1.5 }}>
                  {DETAIL_ALLOW_IMAGE_UPLOAD ? `Fotos de la pieza (hasta ${MAX_FOTOS})` : 'Fotos del producto'}
                </Typography>
                {DETAIL_ALLOW_IMAGE_UPLOAD && detailEditing && detailCanAddMoreImages && (
                  <Button component="label" variant="outlined" size="small" startIcon={<UploadIcon />} sx={{ textTransform: 'none', mb: 2 }}>
                    Cargar imágenes
                    <input type="file" hidden accept="image/*" multiple onChange={handleDetailImageFiles} />
                  </Button>
                )}
                {detailEditing && (detailExistingImages.length > 0 || (DETAIL_ALLOW_IMAGE_UPLOAD && detailNewImageFiles.length > 0)) && (
                  <Box sx={{ mt: 0, mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>Vistas previas (clic para ampliar; use la papelera para quitar)</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {detailExistingImages.map((img, i) => (
                        <Box
                          key={img.id || `ex-${i}`}
                          sx={{
                            position: 'relative',
                            border: '1px solid',
                            borderColor: 'grey.300',
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: 'grey.100',
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'grey.500', boxShadow: 1 },
                          }}
                        >
                          <Box
                            component="img"
                            src={img.imageUrl}
                            alt={`Imagen ${i + 1}`}
                            onClick={() => setDetailPreviewImageIndex(i)}
                            sx={{ width: 100, height: 100, objectFit: 'cover', display: 'block' }}
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeDetailExistingImage(img.id)
                            }}
                            disabled={!isValidUUID(img.id)}
                            color="error"
                            aria-label="Quitar imagen"
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(255,255,255,0.9)',
                              '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="caption" sx={{ display: 'block', px: 1, py: 0.5, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Imagen {i + 1}
                          </Typography>
                        </Box>
                      ))}
                      {detailNewImageFiles.map((file, i) => (
                        <Box
                          key={`new-${i}-${file.name}`}
                          sx={{
                            position: 'relative',
                            border: '1px solid',
                            borderColor: 'grey.300',
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: 'grey.100',
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'grey.500', boxShadow: 1 },
                          }}
                        >
                          <Box
                            component="img"
                            src={detailNewPreviewUrls[i]}
                            alt={file.name}
                            onClick={() => setDetailPreviewImageIndex(detailExistingImages.length + i)}
                            sx={{ width: 100, height: 100, objectFit: 'cover', display: 'block' }}
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeDetailNewImageFile(i)
                            }}
                            color="error"
                            aria-label="Quitar imagen"
                            sx={{
                              position: 'absolute',
                              top: 4,
                              right: 4,
                              bgcolor: 'rgba(255,255,255,0.9)',
                              '&:hover': { bgcolor: 'rgba(255,255,255,1)' },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                          <Typography variant="caption" sx={{ display: 'block', px: 1, py: 0.5, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={file.name}>
                            {file.name}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
                {!detailEditing && detailImages.length > 0 && (
                  <Box sx={{ mt: 0, mb: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>Vistas previas de las imágenes cargadas (clic para ampliar)</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {detailImages.map((url, i) => (
                        <Box
                          key={i}
                          sx={{
                            position: 'relative',
                            border: '1px solid',
                            borderColor: 'grey.300',
                            borderRadius: 1,
                            overflow: 'hidden',
                            bgcolor: 'grey.100',
                            cursor: 'pointer',
                            '&:hover': { borderColor: 'grey.500', boxShadow: 1 },
                          }}
                        >
                          <Box
                            component="img"
                            src={url}
                            alt={`Imagen ${i + 1}`}
                            onClick={() => setDetailPreviewImageIndex(i)}
                            sx={{ width: 100, height: 100, objectFit: 'cover', display: 'block' }}
                          />
                          <Typography variant="caption" sx={{ display: 'block', px: 1, py: 0.5, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Imagen {i + 1}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                <Dialog
                  open={detailPreviewImageIndex !== null}
                  onClose={() => setDetailPreviewImageIndex(null)}
                  maxWidth={false}
                  PaperProps={{
                    sx: {
                      maxWidth: '95vw',
                      maxHeight: '95vh',
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: 'grey.900',
                    },
                  }}
                >
                  <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: 280, minHeight: 200 }}>
                    {detailPreviewImageIndex !== null && detailEditLightboxUrls[detailPreviewImageIndex] && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Box
                          component="img"
                          src={detailEditLightboxUrls[detailPreviewImageIndex]}
                          alt={`Imagen ${detailPreviewImageIndex + 1}`}
                          sx={{ maxWidth: '90vw', maxHeight: '75vh', objectFit: 'contain' }}
                        />
                        <Typography variant="caption" sx={{ color: 'grey.400', textAlign: 'center', maxWidth: '90vw' }}>
                          Imagen {detailPreviewImageIndex + 1}
                        </Typography>
                      </Box>
                    )}
                  </DialogContent>
                  <DialogActions sx={{ justifyContent: 'center', py: 1, bgcolor: 'grey.900' }}>
                    <Button onClick={() => setDetailPreviewImageIndex(null)} sx={{ textTransform: 'none', color: 'grey.300' }}>
                      Cerrar
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
            <Button onClick={closeDetailModal} sx={{ textTransform: 'none', color: '#757575' }} disabled={detailLoading}>Cerrar</Button>
            {detailEditing ? (
              <Button onClick={handleDetailSave} variant="contained" disabled={detailLoading} sx={{ textTransform: 'none', backgroundColor: '#7b1fa2', '&:hover': { backgroundColor: '#6a1b9a' } }}>
                {detailLoading ? 'Guardando…' : 'Guardar'}
              </Button>
            ) : (
              <Button onClick={handleStartDetailEdit} sx={{ textTransform: 'none', color: '#7b1fa2' }} disabled={detailLoading}>Editar</Button>
            )}
            <Button onClick={openDeleteConfirm} color="error" sx={{ textTransform: 'none' }} disabled={detailLoading}>
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal de confirmación para eliminar producto */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={closeDeleteConfirm}
          maxWidth="xs"
          fullWidth
          PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}
        >
          <ModalHeader title="Confirmar eliminación" onClose={closeDeleteConfirm} />
          <DialogContent sx={{ padding: '24px' }}>
            <Typography>
              ¿Está seguro que desea eliminar el producto <strong>{detailProduct.nombrePieza || '(sin nombre)'}</strong>? Esta acción no se puede deshacer.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0', backgroundColor: '#fafafa' }}>
            <Button onClick={closeDeleteConfirm} sx={{ textTransform: 'none', color: '#757575' }} disabled={detailLoading}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={detailLoading} sx={{ textTransform: 'none' }}>
              {detailLoading ? 'Eliminando…' : 'Eliminar producto'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            elevation={6}
            variant="filled"
            severity={snackbar.severity}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        {permissionDeniedSnackbar}
      </Box>
    </Box>
  )
}

export default Inventario
