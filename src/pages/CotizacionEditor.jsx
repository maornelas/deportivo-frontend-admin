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
import { searchProducts, getBrands, getCarModelsByBrand } from '../api/products'
import { getUsers } from '../api/user'

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

export default function CotizacionEditor() {
  const { id } = useParams()
  const isNew = !id || id === 'nueva'
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [quotationId, setQuotationId] = useState(isNew ? null : id)
  const [quotationNumber, setQuotationNumber] = useState('')

  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [notes, setNotes] = useState('')
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
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [quotationPdfUrl, setQuotationPdfUrl] = useState(null)
  const [imageGallery, setImageGallery] = useState({ open: false, urls: [], index: 0, title: '' })
  const [busyModal, setBusyModal] = useState({ open: false, message: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const totals = useMemo(() => totalsFromLines(cartLines), [cartLines])
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
      setStatus(q.status || 'draft')
      setQuotationPdfUrl(q.pdfUrl || null)
      if (q.items?.length) {
        setCartLines(
          q.items.map((it) => ({
            key: it.id || crypto.randomUUID(),
            productId: it.productId,
            productName: it.productName,
            sku: it.sku,
            unitPrice: Number(it.unitPrice),
            quantity: it.quantity,
            carBrand: it.carBrand || '',
            carModel: it.carModel || '',
            carYears: it.carYears || '',
          })),
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
    productName: l.productName.trim(),
    sku: String(l.sku || '').slice(0, 100),
    unitPrice: Number(l.unitPrice) || 0,
    quantity: Math.max(1, parseInt(l.quantity, 10) || 1),
    discountType: 'percent',
    discountValue: 0,
    carBrand: (l.carBrand || '').trim() || undefined,
    carModel: (l.carModel || '').trim() || undefined,
    carYears: (l.carYears || '').trim() || undefined,
  }))

  const addToCart = (p) => {
    if (!p?.id && !p?.sku) return
    const pid = p.id || null
    const sku = p.sku || ''
    setCartLines((prev) => {
      const idx = prev.findIndex((l) => (pid && l.productId === pid) || (!pid && l.sku === sku && l.productName === (p.name || '')))
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: Math.max(1, next[idx].quantity + 1) }
        return next
      }
      return [
        ...prev,
        {
          key: crypto.randomUUID(),
          productId: pid,
          productName: p.name || 'Pieza',
          sku,
          unitPrice: Number(p.price) || 0,
          quantity: 1,
          carBrand: (p.brandName || '').trim(),
          carModel: (p.modelName || '').trim(),
          carYears: (p.carYearRange || '').trim(),
        },
      ]
    })
  }

  const setQuantity = (key, qty) => {
    const q = Math.max(1, parseInt(qty, 10) || 1)
    setCartLines((prev) => prev.map((l) => (l.key === key ? { ...l, quantity: q } : l)))
  }

  const bumpQuantity = (key, delta) => {
    setCartLines((prev) =>
      prev.map((l) => {
        if (l.key !== key) return l
        const n = Math.max(1, (parseInt(l.quantity, 10) || 1) + delta)
        return { ...l, quantity: n }
      }),
    )
  }

  const removeFromCart = (key) => {
    setCartLines((prev) => prev.filter((l) => l.key !== key))
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

  const save = async (nextStatus) => {
    if (!clientName.trim()) {
      setError('Indique el nombre del cliente')
      return
    }
    if (itemsPayload.length < 1) {
      setError('Agregue al menos una pieza al carrito')
      return
    }
    const isGenerate = nextStatus === 'sent'
    if (isGenerate) {
      setBusyModal({ open: true, message: 'Generando cotización, espere un momento' })
    } else {
      setSaving(true)
    }
    setError('')
    const body = {
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim() || undefined,
      clientEmail: clientEmail.trim() || undefined,
      notes: notes.trim() || undefined,
      status: nextStatus,
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
        r = await updateQuotation(quotationId, { ...body, status: nextStatus })
        if (r.success && r.data?.pdfUrl) setQuotationPdfUrl(r.data.pdfUrl)
      }
    } finally {
      if (isGenerate) setBusyModal({ open: false, message: '' })
      else setSaving(false)
    }
    if (!r.success) {
      setError(r.error || 'Error al guardar')
      return
    }
    if (r.data) {
      setStatus(r.data.status)
      setQuotationNumber(r.data.quotationNumber || quotationNumber)
      if (isGenerate && r.data.pdfUrl) setQuotationPdfUrl(r.data.pdfUrl)
    }
    if (isGenerate) {
      setSnackbar({ open: true, message: 'Cotización generada exitosamente', severity: 'success' })
    }
  }

  const saveChangesOnly = async () => {
    if (itemsPayload.length < 1) {
      setError('El carrito está vacío')
      return
    }
    setBusyModal({ open: true, message: 'Guardando cambios, espere un momento' })
    setError('')
    let r = { success: false }
    try {
      r = await updateQuotation(quotationId, {
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim() || undefined,
        clientEmail: clientEmail.trim() || undefined,
        notes: notes.trim() || undefined,
        status,
        items: itemsPayload,
      })
    } finally {
      setBusyModal({ open: false, message: '' })
    }
    if (!r.success) {
      setError(r.error || 'Error')
      return
    }
    if (r.data?.pdfUrl) setQuotationPdfUrl(r.data.pdfUrl)
    setSnackbar({ open: true, message: 'Cambios guardados correctamente', severity: 'success' })
  }

  const pickClient = (u) => {
    if (!u) return
    const name = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email
    setClientName(name)
    setClientEmail(u.email || '')
    setClientPhone(u.phone || '')
  }

  const handleDelete = async () => {
    if (!quotationId) return
    const r = await deleteQuotation(quotationId)
    setDeleteOpen(false)
    if (!r.success) {
      setError(r.error || 'No se pudo eliminar')
      return
    }
    navigate('/cotizaciones')
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
          padding: { xs: '16px', sm: '24px', md: '32px' },
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2, mb: 2 }}>
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
                title={!quotationPdfUrl ? 'Genere la cotización para habilitar la descarga del PDF' : 'Descargar PDF'}
              >
                Descargar PDF
              </Button>
              {!isNew && (
                <Button color="error" variant="outlined" size="small" onClick={() => setDeleteOpen(true)}>
                  Eliminar
                </Button>
              )}
            </>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
        ) : (
          <>
            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', lg: 'row' },
                gap: 2,
                alignItems: 'flex-start',
              }}
            >
              {/* Izquierda: cliente + solo búsqueda */}
              <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
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
                  <TextField label="Notas" size="small" fullWidth multiline minRows={2} value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mt: 2 }} />
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
                      Buscar Piezas
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Filtra por marca, versión, año y nombre. Luego agrega cada pieza al carrito con el botón correspondiente.
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2, alignItems: 'flex-end' }}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Marca</InputLabel>
                      <Select
                        label="Marca"
                        value={filterBrandId}
                        onChange={(e) => {
                          setFilterBrandId(e.target.value)
                          setFilterModel('')
                        }}
                      >
                        <MenuItem value="">Todas</MenuItem>
                        {brands.map((b) => (
                          <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 180 }} disabled={!filterBrandId}>
                      <InputLabel>Versión</InputLabel>
                      <Select label="Versión" value={filterModel} onChange={(e) => setFilterModel(e.target.value)}>
                        <MenuItem value="">Todas</MenuItem>
                        {carModels.map((m) => (
                          <MenuItem key={m.id} value={m.model}>{m.model}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField label="Año" size="small" placeholder="2020" value={filterYear} onChange={(e) => setFilterYear(e.target.value)} sx={{ width: 100 }} />
                    <TextField
                      label="Nombre pieza"
                      size="small"
                      placeholder="faro, filtro…"
                      value={filterPieceName}
                      onChange={(e) => setFilterPieceName(e.target.value)}
                      sx={{ minWidth: 200, flex: 1 }}
                    />
                    <Button variant="contained" startIcon={<SearchIcon />} onClick={runProductSearch} disabled={productLoading} size="small">
                      Buscar
                    </Button>
                  </Box>

                  {productLoading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={32} /></Box>
                  ) : productOptions.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      {filterBrandId || filterPieceName || filterYear ? 'Sin resultados. Prueba otros filtros.' : 'Usa los filtros y pulsa Buscar.'}
                    </Typography>
                  ) : (
                    <List dense disablePadding sx={{ maxHeight: 420, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      {productOptions.map((p) => {
                        const thumb = p.primaryImageUrl || (p.imageUrls && p.imageUrls[0])
                        const hasGallery = (p.imageUrls && p.imageUrls.length > 0) || !!p.primaryImageUrl
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
                </Paper>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                  <Button variant="contained" color="inherit" disabled={saving || busyModal.open} onClick={() => save('draft')}>
                    Guardar borrador
                  </Button>
                  <Button
                    variant="contained"
                    disabled={saving || busyModal.open}
                    onClick={() => save('sent')}
                    sx={{ bgcolor: '#7B2CBF', '&:hover': { bgcolor: '#6A26A8' } }}
                  >
                    Generar cotización
                  </Button>
                  {!isNew && (
                    <Button variant="outlined" disabled={saving || busyModal.open} onClick={saveChangesOnly}>
                      Guardar cambios
                    </Button>
                  )}
                </Box>
              </Box>

              {/* Derecha: carrito */}
              <Paper
                sx={{
                  width: { xs: '100%', lg: 520 },
                  minWidth: { lg: 480 },
                  flexShrink: 0,
                  position: { lg: 'sticky' },
                  top: { lg: 88 },
                  alignSelf: 'flex-start',
                  overflow: 'hidden',
                  bgcolor: '#fafafa',
                }}
                elevation={2}
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
                </Box>
                <Box sx={{ p: 2 }}>
                {cartLines.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    Vacío. Busca piezas a la izquierda y pulsa «Al carrito».
                  </Typography>
                ) : (
                  <List dense disablePadding sx={{ maxHeight: 320, overflow: 'auto', mb: 2 }}>
                    {cartLines.map((l) => {
                      const { sub, qty } = lineCalc(l.unitPrice, l.quantity)
                      return (
                        <ListItem
                          key={l.key}
                          sx={{
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            bgcolor: 'background.paper',
                            borderRadius: 1,
                            mb: 1,
                            py: 1.5,
                            px: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                            <Typography variant="body2" fontWeight={600} sx={{ flex: 1, pr: 1 }}>
                              {l.productName}
                            </Typography>
                            <IconButton size="small" onClick={() => removeFromCart(l.key)} aria-label="Quitar" color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                            SKU {l.sku || '—'} · {formatMoney(l.unitPrice)} c/u
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="caption" fontWeight={600}>
                              Núm. piezas
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <IconButton size="small" onClick={() => bumpQuantity(l.key, -1)} aria-label="Menos">
                                <RemoveQtyIcon fontSize="small" />
                              </IconButton>
                              <TextField
                                size="small"
                                value={qty}
                                onChange={(e) => setQuantity(l.key, e.target.value)}
                                inputProps={{ min: 1, style: { textAlign: 'center', width: 48 } }}
                                sx={{ width: 64 }}
                              />
                              <IconButton size="small" onClick={() => bumpQuantity(l.key, 1)} aria-label="Más">
                                <AddQtyIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <Typography variant="body2" fontWeight={700} sx={{ ml: 'auto' }}>
                              {formatMoney(sub)}
                            </Typography>
                          </Box>
                        </ListItem>
                      )
                    })}
                  </List>
                )}

                <Divider sx={{ my: 1.5 }} />
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body1" sx={{ mb: 0.5 }}>{formatMoney(totals.gross)}</Typography>
                <Typography variant="body2" color="text.secondary">IVA (16%)</Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>{formatMoney(totals.tax)}</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="h6" color="primary">Total: {formatMoney(totals.total)}</Typography>
                </Box>
              </Paper>
            </Box>
          </>
        )}

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
              textAlign: 'center',
              borderRadius: 2,
            },
          }}
        >
          <CircularProgress size={72} thickness={4} sx={{ mb: 3, color: '#7B2CBF' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#424242', px: 1 }}>
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

        <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
          <DialogTitle>¿Eliminar cotización?</DialogTitle>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>Eliminar</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}
