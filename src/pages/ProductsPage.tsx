import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  IconButton,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Paper,
  Collapse,
  InputAdornment,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import FilterListIcon from '@mui/icons-material/FilterList'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import { products as mockProducts, Product } from '../data/products'

const categories = [
  'Motor',
  'Llantas y Ruedas',
  'Frenos',
  'Transmisión',
  'Iluminación',
  'Accesorios',
  'Lubricantes',
  'Filtros',
  'Baterías',
]

const brands = ['Brandix', 'Premium Parts', 'Mobil', 'K&N', 'ACDelco', 'Bosch', 'Fantastic Motors', 'Sport Clutch']
const models = ['Versa', 'Sentra', 'Altima', 'Maxima', 'Rogue', 'Pathfinder', 'Frontier', 'Titan']
const versions = ['Base', 'S', 'SV', 'SL', 'Platinum', 'Pro-4X', 'Sport']
const years = ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017']

function ProductsPage() {
  const [open, setOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    originalPrice: '',
    image: '',
    rating: '0',
    reviewCount: '0',
    badge: '',
    inStock: true,
    brand: '',
    category: '',
  })

  // Filtros
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const [selectedVersion, setSelectedVersion] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [promotionFilter, setPromotionFilter] = useState('')
  const [discountFilter, setDiscountFilter] = useState(false)
  const [sortBy, setSortBy] = useState('name-asc')

  const handleOpen = () => {
    setSelectedProduct(null)
    setFormData({
      name: '',
      sku: '',
      price: '',
      originalPrice: '',
      image: '',
      rating: '0',
      reviewCount: '0',
      badge: '',
      inStock: true,
      brand: '',
      category: '',
    })
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setSelectedProduct(null)
    setFormData({
      name: '',
      sku: '',
      price: '',
      originalPrice: '',
      image: '',
      rating: '0',
      reviewCount: '0',
      badge: '',
      inStock: true,
      brand: '',
      category: '',
    })
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      image: product.image,
      rating: product.rating.toString(),
      reviewCount: product.reviewCount.toString(),
      badge: product.badge || '',
      inStock: product.inStock,
      brand: product.brand || '',
      category: product.category,
    })
    setOpen(true)
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProduct = () => {
    if (selectedProduct) {
      console.log('Producto actualizado:', formData)
      // Aquí iría la lógica para actualizar el producto
    } else {
      console.log('Producto creado:', formData)
      // Aquí iría la lógica para crear el producto
    }
    handleClose()
  }

  // Filtrar y ordenar productos
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...mockProducts]

    // Búsqueda por nombre o SKU
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtro por marca
    if (selectedBrand) {
      filtered = filtered.filter((p) => p.brand === selectedBrand)
    }

    // Filtro por modelo (si existiera en los datos)
    // if (selectedModel) {
    //   filtered = filtered.filter((p) => p.model === selectedModel)
    // }

    // Filtro por versión (si existiera en los datos)
    // if (selectedVersion) {
    //   filtered = filtered.filter((p) => p.version === selectedVersion)
    // }

    // Filtro por rango de precio
    if (minPrice) {
      filtered = filtered.filter((p) => p.price >= parseFloat(minPrice))
    }
    if (maxPrice) {
      filtered = filtered.filter((p) => p.price <= parseFloat(maxPrice))
    }

    // Filtro por promociones (badge)
    if (promotionFilter) {
      filtered = filtered.filter((p) => p.badge === promotionFilter)
    }

    // Filtro por descuentos
    if (discountFilter) {
      filtered = filtered.filter((p) => p.originalPrice !== undefined)
    }

    // Ordenamiento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'price-asc':
          return a.price - b.price
        case 'price-desc':
          return b.price - a.price
        default:
          return 0
      }
    })

    return filtered
  }, [searchQuery, selectedBrand, selectedModel, selectedVersion, selectedYear, minPrice, maxPrice, promotionFilter, discountFilter, sortBy])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedBrand('')
    setSelectedModel('')
    setSelectedVersion('')
    setSelectedYear('')
    setMinPrice('')
    setMaxPrice('')
    setPromotionFilter('')
    setDiscountFilter(false)
    setSortBy('name-asc')
  }

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#333333' }}>
          Productos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{
            backgroundColor: '#E74C3C',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#D92323',
            },
          }}
        >
          Nuevo producto
        </Button>
      </Box>

      {/* Panel de Filtros */}
      <Paper sx={{ p: 2, mb: 3, border: '1px solid #E0E0E0' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
            <TextField
              placeholder="Buscar por nombre o SKU..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#AAAAAA' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                maxWidth: 400,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#f5f5f5',
                  '& fieldset': {
                    borderColor: '#E0E0E0',
                  },
                  '&:hover fieldset': {
                    borderColor: '#AAAAAA',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#E74C3C',
                  },
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortBy}
                label="Ordenar por"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name-asc">Nombre (A-Z)</MenuItem>
                <MenuItem value="name-desc">Nombre (Z-A)</MenuItem>
                <MenuItem value="price-asc">Precio (Menor a Mayor)</MenuItem>
                <MenuItem value="price-desc">Precio (Mayor a Menor)</MenuItem>
              </Select>
            </FormControl>
            <Button
              startIcon={<FilterListIcon />}
              onClick={() => setFiltersOpen(!filtersOpen)}
              sx={{
                color: '#555555',
                border: '1px solid #E0E0E0',
                '&:hover': {
                  borderColor: '#E74C3C',
                  color: '#E74C3C',
                },
              }}
            >
              Filtros
            </Button>
            {(selectedBrand || selectedModel || selectedVersion || selectedYear || minPrice || maxPrice || promotionFilter || discountFilter) && (
              <Button onClick={clearFilters} size="small" sx={{ color: '#E74C3C' }}>
                Limpiar
              </Button>
            )}
          </Box>
        </Box>

        <Collapse in={filtersOpen}>
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: '#333333',
                mb: 2,
                fontSize: '0.875rem',
              }}
            >
              Filtros de Vehículo
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="medium" variant="outlined">
                  <InputLabel
                    id="brand-label"
                    sx={{
                      '&.Mui-focused': {
                        color: '#E74C3C',
                      },
                    }}
                  >
                    Marca
                  </InputLabel>
                  <Select
                    labelId="brand-label"
                    value={selectedBrand}
                    label="Marca"
                    onChange={(e) => setSelectedBrand(e.target.value)}
                    displayEmpty
                    renderValue={(value) => {
                      if (!value) {
                        return <span style={{ color: '#AAAAAA' }}>Todas las marcas</span>
                      }
                      return value
                    }}
                    sx={{
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#AAAAAA',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E74C3C',
                      },
                      '& .MuiSelect-select': {
                        padding: '12px 14px',
                      },
                    }}
                  >
                    {brands.map((brand) => (
                      <MenuItem key={brand} value={brand}>
                        {brand}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="medium" variant="outlined">
                  <InputLabel
                    id="model-label"
                    sx={{
                      '&.Mui-focused': {
                        color: '#E74C3C',
                      },
                    }}
                  >
                    Modelo
                  </InputLabel>
                  <Select
                    labelId="model-label"
                    value={selectedModel}
                    label="Modelo"
                    onChange={(e) => setSelectedModel(e.target.value)}
                    displayEmpty
                    renderValue={(value) => {
                      if (!value) {
                        return <span style={{ color: '#AAAAAA' }}>Todos los modelos</span>
                      }
                      return value
                    }}
                    sx={{
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#AAAAAA',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E74C3C',
                      },
                      '& .MuiSelect-select': {
                        padding: '12px 14px',
                      },
                    }}
                  >
                    {models.map((model) => (
                      <MenuItem key={model} value={model}>
                        {model}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="medium" variant="outlined">
                  <InputLabel
                    id="version-label"
                    sx={{
                      '&.Mui-focused': {
                        color: '#E74C3C',
                      },
                    }}
                  >
                    Versión
                  </InputLabel>
                  <Select
                    labelId="version-label"
                    value={selectedVersion}
                    label="Versión"
                    onChange={(e) => setSelectedVersion(e.target.value)}
                    displayEmpty
                    renderValue={(value) => {
                      if (!value) {
                        return <span style={{ color: '#AAAAAA' }}>Todas las versiones</span>
                      }
                      return value
                    }}
                    sx={{
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#AAAAAA',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E74C3C',
                      },
                      '& .MuiSelect-select': {
                        padding: '12px 14px',
                      },
                    }}
                  >
                    {versions.map((version) => (
                      <MenuItem key={version} value={version}>
                        {version}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="medium" variant="outlined">
                  <InputLabel
                    id="year-label"
                    sx={{
                      '&.Mui-focused': {
                        color: '#E74C3C',
                      },
                    }}
                  >
                    Año
                  </InputLabel>
                  <Select
                    labelId="year-label"
                    value={selectedYear}
                    label="Año"
                    onChange={(e) => setSelectedYear(e.target.value)}
                    displayEmpty
                    renderValue={(value) => {
                      if (!value) {
                        return <span style={{ color: '#AAAAAA' }}>Todos los años</span>
                      }
                      return value
                    }}
                    sx={{
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#AAAAAA',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E74C3C',
                      },
                      '& .MuiSelect-select': {
                        padding: '12px 14px',
                      },
                    }}
                  >
                    {years.map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: '#333333',
                mb: 2,
                fontSize: '0.875rem',
              }}
            >
              Filtros de Precio y Promociones
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Precio Mínimo"
                  type="number"
                  size="small"
                  fullWidth
                  variant="outlined"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: '#555555' }}>
                        $
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#AAAAAA',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#E74C3C',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#E74C3C',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Precio Máximo"
                  type="number"
                  size="small"
                  fullWidth
                  variant="outlined"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ color: '#555555' }}>
                        $
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover fieldset': {
                        borderColor: '#AAAAAA',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#E74C3C',
                      },
                    },
                    '& .MuiInputLabel-root.Mui-focused': {
                      color: '#E74C3C',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small" variant="outlined">
                  <InputLabel
                    sx={{
                      '&.Mui-focused': {
                        color: '#E74C3C',
                      },
                    }}
                  >
                    Promociones
                  </InputLabel>
                  <Select
                    value={promotionFilter}
                    label="Promociones"
                    onChange={(e) => setPromotionFilter(e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E0E0E0',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#AAAAAA',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#E74C3C',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>Todas</em>
                    </MenuItem>
                    <MenuItem value="sale">Ofertas</MenuItem>
                    <MenuItem value="hot">Destacados</MenuItem>
                    <MenuItem value="new">Nuevos</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '100%',
                    pl: 1,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        checked={discountFilter}
                        onChange={(e) => setDiscountFilter(e.target.checked)}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: '#E74C3C',
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: '#E74C3C',
                          },
                        }}
                      />
                    }
                    label={
                      <Typography variant="body2" sx={{ color: '#555555', fontSize: '0.875rem' }}>
                        Solo con descuento
                      </Typography>
                    }
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* Grid de Productos */}
      <Grid container spacing={1.5}>
        {filteredAndSortedProducts.map((product) => (
          <Grid item xs={4} sm={3} md={2} lg={2} xl={2} key={product.id}>
            <Card
              onClick={() => handleProductClick(product)}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                backgroundColor: 'transparent',
                border: '1px solid #E0E0E0',
                boxShadow: 'none',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  zIndex: 1,
                  display: 'flex',
                  gap: 0.5,
                }}
              >
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleProductClick(product)
                  }}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    width: 20,
                    height: 20,
                    padding: 0.5,
                    '&:hover': { backgroundColor: '#ffffff' },
                  }}
                >
                  <EditIcon sx={{ fontSize: 12 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Aquí iría la lógica para eliminar
                  }}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    width: 20,
                    height: 20,
                    padding: 0.5,
                    '&:hover': { backgroundColor: '#ffffff' },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 12 }} />
                </IconButton>
              </Box>
              {product.badge && (
                <Chip
                  label={product.badge.toUpperCase()}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 4,
                    left: 4,
                    zIndex: 1,
                    backgroundColor:
                      product.badge === 'sale'
                        ? '#E74C3C'
                        : product.badge === 'hot'
                          ? '#FFA500'
                          : '#2196F3',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.6rem',
                    height: 16,
                    '& .MuiChip-label': {
                      padding: '0 4px',
                    },
                  }}
                />
              )}
              <CardMedia
                component="img"
                sx={{
                  height: 120,
                  width: '100%',
                  objectFit: 'cover',
                  backgroundColor: '#f5f5f5',
                }}
                image={product.image}
                alt={product.name}
              />
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  p: 1,
                  minHeight: 110,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: '#AAAAAA',
                    fontSize: '0.6rem',
                    mb: 0.5,
                  }}
                >
                  SKU: {product.sku}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    mb: 0.5,
                    fontSize: '0.7rem',
                    minHeight: 32,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    color: '#333333',
                    lineHeight: 1.2,
                  }}
                >
                  {product.name}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mb: 0.5,
                    minHeight: 16,
                  }}
                >
                  <Rating value={product.rating} readOnly size="small" sx={{ fontSize: '0.75rem' }} />
                  <Typography
                    variant="body2"
                    sx={{ color: '#AAAAAA', fontSize: '0.6rem' }}
                  >
                    ({product.reviewCount})
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mb: 0.75,
                    minHeight: 20,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      color: '#333333',
                      fontSize: '0.8rem',
                    }}
                  >
                    ${product.price.toFixed(2)}
                  </Typography>
                  {product.originalPrice && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#AAAAAA',
                        textDecoration: 'line-through',
                        fontSize: '0.65rem',
                      }}
                    >
                      ${product.originalPrice.toFixed(2)}
                    </Typography>
                  )}
                </Box>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mt: 'auto',
                    minHeight: 16,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ color: '#AAAAAA', fontSize: '0.6rem' }}
                  >
                    {product.brand}
                  </Typography>
                  <Chip
                    label={product.inStock ? 'Stock' : 'Sin'}
                    size="small"
                    sx={{
                      fontSize: '0.6rem',
                      height: 16,
                      backgroundColor: product.inStock ? '#8BC34A' : '#AAAAAA',
                      color: '#ffffff',
                      '& .MuiChip-label': {
                        padding: '0 3px',
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filteredAndSortedProducts.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ color: '#AAAAAA' }}>
            No se encontraron productos
          </Typography>
        </Box>
      )}

      {/* Dialog unificado para nuevo producto y editar producto */}
      <Dialog 
        open={open} 
        onClose={() => {}} 
        maxWidth="lg" 
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            pr: 1,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#333333' }}>
            {selectedProduct ? 'Detalle del Producto' : 'Nuevo Producto'}
          </Typography>
          <IconButton
            onClick={handleClose}
            sx={{
              color: '#555555',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={4} sx={{ mt: 1 }}>
            {/* Imagen del Producto */}
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  width: '100%',
                  maxWidth: 300,
                  aspectRatio: '4/3',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  mx: 'auto',
                }}
              >
                <img
                  src={formData.image || 'https://via.placeholder.com/300'}
                  alt={formData.name || 'Producto'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Box>
              <TextField
                label="URL de Imagen"
                fullWidth
                value={formData.image}
                onChange={(e) => handleChange('image', e.target.value)}
                sx={{ mb: 2 }}
              />
            </Grid>

            {/* Información del Producto */}
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  label="Nombre del Producto"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    sx: { fontSize: '1.5rem', fontWeight: 700 },
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="SKU"
                    fullWidth
                    required
                    value={formData.sku}
                    onChange={(e) => handleChange('sku', e.target.value)}
                  />
                  <FormControl fullWidth>
                    <InputLabel>Marca</InputLabel>
                    <Select
                      value={formData.brand}
                      label="Marca"
                      onChange={(e) => handleChange('brand', e.target.value)}
                    >
                      {brands.map((brand) => (
                        <MenuItem key={brand} value={brand}>
                          {brand}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="Precio"
                    type="number"
                    fullWidth
                    required
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1, color: '#555555' }}>$</Typography>,
                    }}
                  />
                  <TextField
                    label="Precio Original"
                    type="number"
                    fullWidth
                    value={formData.originalPrice}
                    onChange={(e) => handleChange('originalPrice', e.target.value)}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1, color: '#555555' }}>$</Typography>,
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField
                    label="Calificación (0-5)"
                    type="number"
                    fullWidth
                    value={formData.rating}
                    onChange={(e) => handleChange('rating', e.target.value)}
                    inputProps={{ min: 0, max: 5, step: 0.1 }}
                    InputProps={{
                      endAdornment: (
                        <Box sx={{ ml: 1 }}>
                          <Rating value={parseFloat(formData.rating) || 0} readOnly precision={0.1} />
                        </Box>
                      ),
                    }}
                  />
                  <TextField
                    label="Número de Reseñas"
                    type="number"
                    fullWidth
                    value={formData.reviewCount}
                    onChange={(e) => handleChange('reviewCount', e.target.value)}
                    inputProps={{ min: 0 }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <FormControl fullWidth required>
                    <InputLabel>Categoría</InputLabel>
                    <Select
                      value={formData.category}
                      label="Categoría"
                      onChange={(e) => handleChange('category', e.target.value)}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Promoción</InputLabel>
                    <Select
                      value={formData.badge}
                      label="Promoción"
                      onChange={(e) => handleChange('badge', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Ninguna</em>
                      </MenuItem>
                      <MenuItem value="sale">Oferta</MenuItem>
                      <MenuItem value="hot">Destacado</MenuItem>
                      <MenuItem value="new">Nuevo</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.inStock}
                      onChange={(e) => handleChange('inStock', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#E74C3C',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#E74C3C',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography variant="body1" sx={{ color: '#333333' }}>
                      En Stock
                    </Typography>
                  }
                />
              </Box>

              {/* Información adicional similar al frontend */}
              {formData.sku && (
                <Box
                  sx={{
                    backgroundColor: '#f5f5f5',
                    p: 2,
                    borderRadius: 1,
                    mb: 2,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#333333' }}>
                    Información del Producto
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#555555' }}>
                        SKU: <strong>{formData.sku}</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#555555' }}>
                        Marca: <strong style={{ color: '#E74C3C' }}>{formData.brand || 'N/A'}</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#555555' }}>
                        Categoría: <strong>{formData.category || 'N/A'}</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: '#555555' }}>
                        Estado: <strong>{formData.inStock ? 'En Stock' : 'Sin Stock'}</strong>
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleSaveProduct}
            variant="contained"
            disabled={
              !formData.name ||
              !formData.sku ||
              !formData.price ||
              !formData.image ||
              !formData.category
            }
            sx={{
              backgroundColor: '#E74C3C',
              '&:hover': {
                backgroundColor: '#D92323',
              },
            }}
          >
            {selectedProduct ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProductsPage
