import { useState, useCallback, useEffect, useRef } from 'react'
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
} from '@mui/material'
import {
  Add as AddIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  Image as ImageIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ModalHeader from '../components/ModalHeader'
import { getBrands, getCategories, getCarModelsByBrand, createProduct, searchProducts, uploadProductImages, getProductById, updateProduct, deleteProduct } from '../api/products'

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

const MAX_FOTOS = 10

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
  estatus: 'DISPONIBLE',
  imageFiles: [], // File[]; hasta 10
})

const parseCarYearRange = (carYearRange) => {
  if (!carYearRange || typeof carYearRange !== 'string') return { añoDesde: '', añoHasta: '' }
  const parts = carYearRange.split(/\s*-\s*/).map((s) => s.trim())
  return { añoDesde: parts[0] || '', añoHasta: parts[1] || '' }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isValidUUID = (s) => typeof s === 'string' && UUID_REGEX.test(s.trim())

const Inventario = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [producto, setProducto] = useState(getInitialProducto())
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [carModels, setCarModels] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [listError, setListError] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailProductId, setDetailProductId] = useState(null)
  const [detailProduct, setDetailProduct] = useState(getInitialProducto())
  const [detailCarModels, setDetailCarModels] = useState([])
  const [detailImages, setDetailImages] = useState([])
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
  const filtersRef = useRef({ filterPieza: '', filterMarca: '', filterModelo: '', filterAño: '' })
  useEffect(() => {
    filtersRef.current = { filterPieza, filterMarca, filterModelo, filterAño }
  }, [filterPieza, filterMarca, filterModelo, filterAño])

  const loadBrands = useCallback(async () => {
    const res = await getBrands({ activeOnly: false })
    if (res.success) setBrands(res.data || [])
  }, [])

  const loadCategories = useCallback(async () => {
    const res = await getCategories({ activeOnly: false })
    if (res.success) setCategories(res.data || [])
  }, [])

  const loadProducts = useCallback(async () => {
    setListError('')
    const f = filtersRef.current
    const res = await searchProducts({
      limit: 100,
      search: (f.filterPieza || '').trim() || undefined,
      brandId: f.filterMarca || undefined,
      modelSearch: (f.filterModelo || '').trim() || undefined,
      year: (f.filterAño || '').trim() || undefined,
    })
    if (res.success && res.data) {
      setProducts(res.data.products || [])
    } else {
      setListError(res.error || 'Error al cargar productos')
    }
  }, [])

  useEffect(() => {
    loadBrands()
    loadCategories()
    loadProducts()
  }, [loadBrands, loadCategories, loadProducts])

  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState(null)

  const handleOpenDialog = () => {
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
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
    setProducto((prev) => {
      const current = prev.imageFiles || []
      const next = [...current, ...files].slice(0, MAX_FOTOS)
      return { ...prev, imageFiles: next }
    })
    e.target.value = ''
  }

  const handleImageDrop = (e) => {
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
      stockQuantity: 0,
    }
    const result = await createProduct(payload)
    if (!result.success) {
      setLoading(false)
      setSubmitError(result.error || 'Error al guardar el producto.')
      return
    }
    const productId = result.data?.id
    const imageFiles = (producto.imageFiles || []).slice(0, MAX_FOTOS)
    if (productId && imageFiles.length > 0) {
      const uploadRes = await uploadProductImages(productId, imageFiles)
      if (!uploadRes.success) {
        setSubmitError(uploadRes.error || 'Producto guardado pero falló la subida de imágenes.')
        setLoading(false)
        return
      }
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
      estatus: d.isActive === true ? 'DISPONIBLE' : 'VENDIDO',
      imageFiles: [],
    })
    // Mismo orden que al crear: imágenes ordenadas por sortOrder (backend ya devuelve ASC)
    setDetailImages(Array.isArray(d.images) ? d.images.map((img) => img.imageUrl) : [])
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
    setDetailEditing(false)
    setDetailError('')
    setDetailPreviewImageIndex(null)
  }

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
      stockQuantity: 0,
    }
    const result = await updateProduct(detailProductId, payload)
    setDetailLoading(false)
    if (!result.success) {
      setDetailError(result.error || 'Error al guardar.')
      return
    }
    setSnackbar({ open: true, message: 'Producto actualizado correctamente', severity: 'success' })
    closeDetailModal()
    loadProducts()
  }

  const openDeleteConfirm = () => {
    if (detailProductId) setDeleteConfirmOpen(true)
  }

  const closeDeleteConfirm = () => setDeleteConfirmOpen(false)

  const handleConfirmDelete = async () => {
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
  const canAddMoreImages = imageFiles.length < MAX_FOTOS

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <Box
        sx={{
          marginLeft: { xs: 0, md: '260px' },
          marginTop: { xs: 0, md: '70px' },
          width: { xs: '100%', md: 'calc(100% - 260px)' },
          padding: { xs: '16px', sm: '24px', md: '32px' },
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
          <Box sx={{ display: 'flex', gap: 2 }}>
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
          <Typography variant="h6" sx={{ color: '#424242', fontWeight: 'bold', marginBottom: '20px', fontSize: { xs: '18px', sm: '20px', md: '24px' } }}>
            Lista de Inventario
          </Typography>

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
              sx={{ textTransform: 'none', borderColor: '#757575', color: '#757575' }}
            >
              Limpiar
            </Button>
          </Box>

          {listError && (
            <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setListError('')}>
              {listError}
            </Alert>
          )}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>Pieza</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>Marca</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>Modelo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>Año</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>Tipo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ padding: '40px' }}>
                      <Typography variant="body2" sx={{ color: '#757575' }}>
                        No hay productos registrados. Agrega un nuevo producto o carga un archivo.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((p) => {
                    const brandName = brands.find((b) => b.id === p.brandId)?.name ?? brands.find((b) => b.id === p.brandId)?.nombre ?? p.brandName ?? p.brandId ?? '—'
                    const modelDisplay = p.carModel?.name ?? p.model ?? p.carModelId ?? '—'
                    const estadoLabel = p.partCondition === 'SEMINUEVO' ? 'Seminuevo' : p.partCondition === 'NUEVO' ? 'Nuevo' : p.partCondition || '—'
                    const tipoLabel = p.partType === 'GENÉRICO' ? 'Genérico' : p.partType === 'ORIGINAL' ? 'Original' : p.partType || '—'
                    return (
                      <TableRow
                        key={p.id}
                        onDoubleClick={() => openDetailModal(p.id)}
                        sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                      >
                        <TableCell>{p.name}</TableCell>
                        <TableCell>{brandName}</TableCell>
                        <TableCell>{modelDisplay}</TableCell>
                        <TableCell>{p.carYearRange || '—'}</TableCell>
                        <TableCell>{estadoLabel}</TableCell>
                        <TableCell>{tipoLabel}</TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
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

              {/* Columna derecha: Vista previa (clic o arrastrar imagen) */}
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
                }}
                component="label"
                onDrop={handleImageDrop}
                onDragOver={handleDragOver}
              >
                <input type="file" hidden accept="image/*" multiple onChange={handleImageFiles} />
                <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600, mb: 1.5 }}>Vista previa</Typography>
                <Avatar
                  src={avatarPreviewUrl}
                  variant="rounded"
                  sx={{
                    width: 160,
                    height: 160,
                    bgcolor: 'grey.200',
                    '&:hover': { bgcolor: 'grey.300' },
                  }}
                >
                  {!avatarPreviewUrl && <ImageIcon sx={{ fontSize: 64, color: 'grey.500' }} />}
                </Avatar>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, textAlign: 'center' }}>
                  Clic o arrastrar imagen aquí
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

            {/* Fotos: subir imágenes (se guardan en S3 en images-products/{productId}/) */}
            <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600, mb: 1.5 }}>Fotos de la pieza (hasta {MAX_FOTOS})</Typography>
            {canAddMoreImages && (
              <Button component="label" variant="outlined" size="small" startIcon={<UploadIcon />} sx={{ textTransform: 'none', mb: 2 }}>
                Cargar imágenes
                <input type="file" hidden accept="image/*" multiple onChange={handleImageFiles} />
              </Button>
            )}
            {/* Vistas previas de las partes cargadas (parte inferior); clic abre vista ampliada */}
            {imageFiles.length > 0 && (
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

        {/* Modal detalle del producto (doble clic en fila) */}
        <Dialog open={detailOpen} onClose={closeDetailModal} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}>
          <ModalHeader title={detailProduct.nombrePieza ? `Detalle: ${detailProduct.nombrePieza}` : 'Detalle del producto'} onClose={closeDetailModal} />
          <DialogContent sx={{ padding: '24px 24px 8px' }}>
            {detailLoading && !detailProduct.nombrePieza ? (
              <Typography sx={{ py: 3, color: '#757575' }}>Cargando…</Typography>
            ) : (
              <>
                {detailError && (
                  <Alert severity="error" sx={{ mb: 2 }} onClose={() => setDetailError('')}>
                    {detailError}
                  </Alert>
                )}

                {/* Misma disposición que en Nuevo Producto: nombre (izq) + Vista previa (derecha, 220px, Avatar 160x160) */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 3 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600, mb: 1.5 }}>Nombre de la pieza</Typography>
                    <TextField fullWidth label="Nombre pieza" name="nombrePieza" value={detailProduct.nombrePieza} onChange={handleDetailInputChange} variant="outlined" size="small" required disabled={!detailEditing} />
                  </Box>
                  <Box
                    sx={{
                      flexShrink: 0,
                      width: { xs: '100%', md: 220 },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid',
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      bgcolor: 'grey.50',
                      p: 2,
                      minHeight: 280,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600, mb: 1.5 }}>Vista previa</Typography>
                    <Avatar
                      src={detailImages[0]}
                      variant="rounded"
                      sx={{
                        width: 160,
                        height: 160,
                        bgcolor: 'grey.200',
                      }}
                    >
                      {!detailImages[0] && <ImageIcon sx={{ fontSize: 64, color: 'grey.500' }} />}
                    </Avatar>
                    {detailImages.length > 1 && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5 }}>{detailImages.length} imágenes</Typography>
                    )}
                  </Box>
                </Box>

                {/* Mismas vistas previas que en Nuevo Producto: grid 100x100, clic para ampliar */}
                {detailImages.length > 0 && (
                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600, mb: 1.5 }}>Vistas previas de las imágenes (clic para ampliar)</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      {detailImages.map((url, i) => (
                        <Box
                          key={i}
                          onClick={() => setDetailPreviewImageIndex(i)}
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
                            sx={{
                              width: 100,
                              height: 100,
                              objectFit: 'cover',
                              display: 'block',
                            }}
                          />
                          <Typography variant="caption" sx={{ display: 'block', px: 1, py: 0.5, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Imagen {i + 1}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Dialog vista ampliada en detalle (misma UX que en Nuevo Producto) */}
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
                    {detailPreviewImageIndex !== null && detailImages[detailPreviewImageIndex] && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <Box
                          component="img"
                          src={detailImages[detailPreviewImageIndex]}
                          alt={`Imagen ${detailPreviewImageIndex + 1}`}
                          sx={{
                            maxWidth: '90vw',
                            maxHeight: '75vh',
                            objectFit: 'contain',
                          }}
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

                <Grid container spacing={2} sx={{ mb: 2, '& > .MuiGrid-item': { overflow: 'hidden' } }}>
                  <Grid item xs={12} sm={4} sx={{ minWidth: 0, overflow: 'hidden', flex: { xs: '1 1 100%', sm: '0 0 33.333%' }, maxWidth: { xs: '100%', sm: '33.333%' } }}>
                    <FormControl fullWidth required size="small" variant="outlined" sx={{ width: '100%', maxWidth: '100%', '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' } }}>
                      <InputLabel id="detail-marca-label" shrink>Marca</InputLabel>
                      <Select name="marcaId" value={detailProduct.marcaId} onChange={handleDetailInputChange} labelId="detail-marca-label" label="Marca" displayEmpty disabled={!detailEditing} MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}>
                        <MenuItem value="">Seleccione marca</MenuItem>
                        {brands.map((b) => (
                          <MenuItem key={b.id} value={b.id}>{b.name || b.nombre || '-'}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ minWidth: 0, overflow: 'hidden', flex: { xs: '1 1 100%', sm: '0 0 33.333%' }, maxWidth: { xs: '100%', sm: '33.333%' } }}>
                    <FormControl fullWidth size="small" variant="outlined" disabled={!detailEditing || !detailProduct.marcaId} sx={{ width: '100%', maxWidth: '100%', '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' } }}>
                      <InputLabel id="detail-modelo-label" shrink>Modelo</InputLabel>
                      <Select name="modelo" value={detailProduct.modelo} onChange={handleDetailInputChange} labelId="detail-modelo-label" label="Modelo" displayEmpty MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}>
                        <MenuItem value="">{detailProduct.marcaId ? 'Seleccione modelo' : 'Seleccione marca primero'}</MenuItem>
                        {detailCarModels.map((m) => (
                          <MenuItem key={m.id} value={m.id}>{m.model || m.name || '-'}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4} sx={{ minWidth: 0, overflow: 'hidden', flex: { xs: '1 1 100%', sm: '0 0 33.333%' }, maxWidth: { xs: '100%', sm: '33.333%' } }}>
                    <FormControl fullWidth size="small" variant="outlined" sx={{ width: '100%', maxWidth: '100%', '& .MuiSelect-select': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' } }}>
                      <InputLabel id="detail-categoria-label" shrink>Categoría</InputLabel>
                      <Select name="categoriaId" value={detailProduct.categoriaId} onChange={handleDetailInputChange} labelId="detail-categoria-label" label="Categoría" displayEmpty disabled={!detailEditing} MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}>
                        <MenuItem value="">Ninguna</MenuItem>
                        {categories.map((c) => (
                          <MenuItem key={c.id} value={c.id}>{c.name || c.nombre || '-'}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', gap: 2, mb: 3, width: '100%', flexWrap: 'wrap' }}>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0' }, minWidth: 0 }}>
                    <TextField fullWidth label="Año desde" name="añoDesde" type="number" value={detailProduct.añoDesde} onChange={handleDetailInputChange} variant="outlined" size="small" inputProps={{ min: 1900, max: 2100 }} disabled={!detailEditing} />
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0' }, minWidth: 0 }}>
                    <TextField fullWidth label="Año hasta" name="añoHasta" type="number" value={detailProduct.añoHasta} onChange={handleDetailInputChange} variant="outlined" size="small" inputProps={{ min: 1900, max: 2100 }} disabled={!detailEditing} />
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0' }, minWidth: 0 }}>
                    <FormControl fullWidth size="small" variant="outlined">
                      <InputLabel id="detail-estado-label" shrink>Estado</InputLabel>
                      <Select name="estado" value={detailProduct.estado} onChange={handleDetailInputChange} labelId="detail-estado-label" label="Estado" disabled={!detailEditing}>
                        {ESTADO_OPCIONES.map((o) => (
                          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 0' }, minWidth: 0 }}>
                    <FormControl fullWidth size="small" variant="outlined">
                      <InputLabel id="detail-tipo-label" shrink>Tipo</InputLabel>
                      <Select name="tipo" value={detailProduct.tipo} onChange={handleDetailInputChange} labelId="detail-tipo-label" label="Tipo" disabled={!detailEditing}>
                        {TIPO_OPCIONES.map((o) => (
                          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>

                <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600, mb: 1.5 }}>Observaciones</Typography>
                <TextField fullWidth label="Observaciones" name="observaciones" value={detailProduct.observaciones} onChange={handleDetailInputChange} variant="outlined" size="small" multiline rows={2} sx={{ mb: 3 }} disabled={!detailEditing} />

                <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600, mb: 1.5 }}>Precio y estatus</Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField fullWidth label="Precio" name="precio" type="number" value={detailProduct.precio} onChange={handleDetailInputChange} variant="outlined" size="small" InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, inputProps: { min: 0, step: 0.01 } }} disabled={!detailEditing} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Estatus</InputLabel>
                      <Select name="estatus" value={detailProduct.estatus} onChange={handleDetailInputChange} label="Estatus" disabled={!detailEditing}>
                        {ESTATUS_OPCIONES.map((o) => (
                          <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" sx={{ color: '#757575', fontWeight: 600, mb: 1.5 }}>Descripción completa</Typography>
                <TextField fullWidth label="Descripción completa" name="descripcionCompleta" value={detailProduct.descripcionCompleta} onChange={handleDetailInputChange} variant="outlined" size="small" multiline rows={4} sx={{ mb: 3 }} disabled={!detailEditing} />
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
              <Button onClick={() => setDetailEditing(true)} sx={{ textTransform: 'none', color: '#7b1fa2' }} disabled={detailLoading}>Editar</Button>
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
      </Box>
    </Box>
  )
}

export default Inventario
