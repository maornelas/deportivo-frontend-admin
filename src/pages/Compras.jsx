import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { searchProducts } from '../api/products'

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: 'default' },
  { value: 'paid', label: 'Pagado', color: 'success' },
  { value: 'cancelled', label: 'Cancelado', color: 'error' },
]

const PAYMENT_OPTIONS = [
  { value: 'transfer', label: 'Transferencia' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'other', label: 'Otro' },
]

function formatMoney(n, currency = 'MXN') {
  if (n == null || Number.isNaN(Number(n))) return '-'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(n))
}

function formatDateValue(v) {
  if (!v) return ''
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function safeTrim(s) {
  return String(s ?? '').trim()
}

function getStatusChip(status) {
  return STATUS_OPTIONS.find((o) => o.value === status) || { label: status, color: 'default' }
}

const emptyLine = () => ({
  key: crypto.randomUUID(),
  productId: null,
  productName: '',
  sku: '',
  unitPrice: 0,
  quantity: 1,
})

const Compras = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // MOCK (para que la UI funcione ya). Cuando exista backend de compras, conectamos estas operaciones.
  const [purchases, setPurchases] = useState([])

  // Paginación
  const [page, setPage] = useState(0)
  const [limit] = useState(10)

  // Filtros
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('')
  const [providerSearch, setProviderSearch] = useState('')
  const [searchApplied, setSearchApplied] = useState('')

  // Modal
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState('create') // create | view | edit
  const [editorId, setEditorId] = useState(null)

  const [editorProvider, setEditorProvider] = useState('')
  const [editorPurchaseDate, setEditorPurchaseDate] = useState('')
  const [editorPaymentMethod, setEditorPaymentMethod] = useState('transfer')
  const [editorStatus, setEditorStatus] = useState('pending')
  const [editorNotes, setEditorNotes] = useState('')

  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptFileName, setReceiptFileName] = useState('')

  // Líneas (carrito de compra)
  const [lines, setLines] = useState([emptyLine()])

  // Búsqueda de piezas
  const [productQuery, setProductQuery] = useState('')
  const [productLoading, setProductLoading] = useState(false)
  const [productOptions, setProductOptions] = useState([])

  const totals = useMemo(() => {
    const total = lines.reduce((s, l) => s + Number(l.unitPrice || 0) * Math.max(1, parseInt(l.quantity, 10) || 1), 0)
    return { total: Math.round(total * 100) / 100 }
  }, [lines])

  // Semilla mínima para ver la UI
  useEffect(() => {
    const seed = [
      {
        id: crypto.randomUUID(),
        providerName: 'Proveedor Demo SA de CV',
        purchaseDate: new Date().toISOString(),
        paymentMethod: 'transfer',
        status: 'pending',
        notes: 'Recibo pendiente de confirmación.',
        currency: 'MXN',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        receiptFileName: '',
        items: [
          { key: crypto.randomUUID(), productId: null, productName: 'Faro delantero', sku: 'FARO-DEL-01', unitPrice: 850, quantity: 2 },
          { key: crypto.randomUUID(), productId: null, productName: 'Filtro de aceite', sku: 'FILT-OIL-02', unitPrice: 120, quantity: 5 },
        ],
      },
    ]

    const withTotals = seed.map((p) => ({
      ...p,
      total: Math.round(
        (p.items || []).reduce((s, it) => s + Number(it.unitPrice || 0) * Math.max(1, Number(it.quantity || 1)), 0) * 100,
      ) / 100,
    }))
    setPurchases(withTotals)
  }, [])

  const computedPurchases = useMemo(() => {
    const q = safeTrim(searchApplied).toLowerCase()
    const ps = safeTrim(providerSearch).toLowerCase()
    const sDate = startDate ? new Date(startDate + 'T00:00:00.000Z') : null
    const eDate = endDate ? new Date(endDate + 'T23:59:59.999Z') : null

    const filtered = purchases.filter((p) => {
      if (status && p.status !== status) return false
      if (ps && !(p.providerName || '').toLowerCase().includes(ps)) return false
      if (q) {
        const provider = (p.providerName || '').toLowerCase().includes(q)
        const id = String(p.id || '').toLowerCase().includes(q)
        if (!provider && !id) return false
      }
      if (sDate) {
        const pd = new Date(p.purchaseDate)
        if (pd.getTime() < sDate.getTime()) return false
      }
      if (eDate) {
        const pd = new Date(p.purchaseDate)
        if (pd.getTime() > eDate.getTime()) return false
      }
      return true
    })

    filtered.sort((a, b) => new Date(b.createdAt || b.purchaseDate).getTime() - new Date(a.createdAt || a.purchaseDate).getTime())
    return filtered
  }, [purchases, status, providerSearch, searchApplied, startDate, endDate])

  const pagedPurchases = useMemo(() => {
    const start = page * limit
    return computedPurchases.slice(start, start + limit)
  }, [computedPurchases, page, limit])

  const resetEditor = () => {
    setEditorId(null)
    setEditorProvider('')
    setEditorPurchaseDate('')
    setEditorPaymentMethod('transfer')
    setEditorStatus('pending')
    setEditorNotes('')
    setReceiptFile(null)
    setReceiptFileName('')
    setLines([emptyLine()])
    setProductQuery('')
    setProductOptions([])
    setProductLoading(false)
  }

  const openCreate = () => {
    resetEditor()
    setDialogMode('create')
    setDialogOpen(true)
    setEditorPurchaseDate(formatDateValue(new Date()))
  }

  const openView = (p) => {
    setDialogMode('view')
    setEditorId(p.id)
    setEditorProvider(p.providerName || '')
    setEditorPurchaseDate(formatDateValue(p.purchaseDate))
    setEditorPaymentMethod(p.paymentMethod || 'transfer')
    setEditorStatus(p.status || 'pending')
    setEditorNotes(p.notes || '')
    setReceiptFile(null)
    setReceiptFileName(p.receiptFileName || '')
    setLines(
      (p.items || []).length
        ? p.items.map((it) => ({
            key: it.key || crypto.randomUUID(),
            productId: it.productId ?? null,
            productName: it.productName,
            sku: it.sku || '',
            unitPrice: Number(it.unitPrice || 0),
            quantity: Number(it.quantity || 1),
          }))
        : [emptyLine()],
    )
    setDialogOpen(true)
  }

  const openEdit = (p) => {
    openView(p)
    setDialogMode('edit')
  }

  const closeDialog = () => setDialogOpen(false)

  const canEdit = dialogMode === 'create' || dialogMode === 'edit'

  useEffect(() => {
    if (!canEdit) return
    const q = safeTrim(productQuery)
    if (q.length < 2) {
      setProductOptions([])
      return
    }
    const t = setTimeout(async () => {
      setProductLoading(true)
      const r = await searchProducts({ search: q, limit: 15, isActive: true })
      setProductLoading(false)
      if (r.success && r.data?.products) setProductOptions(r.data.products)
      else setProductOptions([])
    }, 300)
    return () => clearTimeout(t)
  }, [productQuery, canEdit])

  const addLineFromProduct = (p) => {
    if (!p) return
    const sku = p.sku || ''
    const pid = p.id || null
    const name = p.name || ''
    const unitPrice = Number(p.price || 0)

    setLines((prev) => {
      const idx = prev.findIndex((l) => (pid && l.productId === pid) || (!pid && l.sku === sku && l.productName === name))
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: Math.max(1, Number(next[idx].quantity || 1) + 1) }
        return next
      }
      const withoutEmpty = prev.filter((x) => safeTrim(x.productName))
      return [...(withoutEmpty.length ? withoutEmpty : prev.slice(0, 0)), { key: crypto.randomUUID(), productId: pid, productName: name, sku, unitPrice, quantity: 1 }]
    })

    setProductQuery('')
    setProductOptions([])
  }

  const updateLine = (key, patch) => setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)))
  const removeLine = (key) => setLines((prev) => (prev.length <= 1 ? [emptyLine()] : prev.filter((l) => l.key !== key)))

  const validateEditor = () => {
    if (!safeTrim(editorProvider)) return 'Indica el proveedor'
    if (!editorPurchaseDate) return 'Indica la fecha de compra'
    const cleanLines = lines.filter((l) => safeTrim(l.productName))
    if (cleanLines.length < 1) return 'Agrega al menos una pieza'
    return ''
  }

  const savePurchase = async () => {
    const msg = validateEditor()
    if (msg) {
      setError(msg)
      return
    }

    setError('')
    setLoading(true)
    try {
      const cleanLines = lines.filter((l) => safeTrim(l.productName))
      const payload = {
        id: editorId || crypto.randomUUID(),
        providerName: editorProvider.trim(),
        purchaseDate: editorPurchaseDate,
        paymentMethod: editorPaymentMethod,
        status: editorStatus,
        notes: editorNotes || '',
        currency: 'MXN',
        receiptFileName: receiptFileName || '',
        createdAt: editorId ? purchases.find((x) => x.id === editorId)?.createdAt || new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: cleanLines.map((l) => ({
          key: l.key,
          productId: l.productId ?? null,
          productName: l.productName,
          sku: l.sku || '',
          unitPrice: Number(l.unitPrice || 0),
          quantity: Number(l.quantity || 1),
        })),
      }
      payload.total = totals.total

      setPurchases((prev) => {
        const exists = prev.some((x) => x.id === payload.id)
        if (exists) return prev.map((x) => (x.id === payload.id ? payload : x))
        return [payload, ...prev]
      })
      closeDialog()
    } finally {
      setLoading(false)
    }
  }

  const deletePurchase = async () => {
    if (!editorId) return
    setLoading(true)
    setError('')
    try {
      setPurchases((prev) => prev.filter((p) => p.id !== editorId))
      closeDialog()
    } finally {
      setLoading(false)
    }
  }

  const deleteById = async (id) => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      setPurchases((prev) => prev.filter((p) => p.id !== id))
      if (editorId === id) closeDialog()
    } finally {
      setLoading(false)
    }
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
          backgroundColor: '#fafafa',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold', marginBottom: 2, fontSize: { xs: '24px', sm: '28px', md: '32px' } }}>
          Compras
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
            <TextField label="Fecha inicio" type="date" size="small" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
            <TextField label="Fecha fin" type="date" size="small" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Estado</InputLabel>
              <Select label="Estado" value={status} onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField label="Proveedor" size="small" value={providerSearch} onChange={(e) => setProviderSearch(e.target.value)} sx={{ minWidth: 220, flex: 1 }} />

            <TextField
              label="Búsqueda"
              size="small"
              value={searchApplied}
              onChange={(e) => setSearchApplied(e.target.value)}
              placeholder="ID o proveedor"
              sx={{ minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}>
                    <SearchIcon fontSize="small" color="action" />
                  </Box>
                ),
              }}
            />

            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ bgcolor: '#7B2CBF', '&:hover': { bgcolor: '#6A26A8' } }}>
              Nueva compra
            </Button>
          </Box>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

        <TableContainer component={Paper}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Proveedor</strong></TableCell>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell align="right"><strong>Total</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                    <TableCell><strong>Pago</strong></TableCell>
                    <TableCell align="right"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedPurchases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        Sin resultados con los filtros seleccionados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedPurchases.map((p) => {
                      const chip = getStatusChip(p.status)
                      return (
                        <TableRow key={p.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace" fontSize={12}>
                              {String(p.id).slice(0, 8)}…
                            </Typography>
                          </TableCell>
                          <TableCell>{p.providerName || '-'}</TableCell>
                          <TableCell>{formatDateValue(p.purchaseDate) || '-'}</TableCell>
                          <TableCell align="right">{formatMoney(p.total, p.currency)}</TableCell>
                          <TableCell>
                            <Chip size="small" label={chip.label} color={chip.color} variant="outlined" />
                          </TableCell>
                          <TableCell>{p.paymentMethod || '-'}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => openView(p)} aria-label="Consultar">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => openEdit(p)} aria-label="Editar" color="primary">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const ok = window.confirm('¿Eliminar esta compra?')
                                if (!ok) return
                                deleteById(p.id)
                              }}
                              aria-label="Eliminar"
                              color="error"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={computedPurchases.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={limit}
                rowsPerPageOptions={[limit]}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </>
          )}
        </TableContainer>

        <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6" fontWeight={700}>
              {dialogMode === 'create' ? 'Nueva compra' : dialogMode === 'view' ? 'Consultar compra' : 'Editar compra'}
            </Typography>
            {dialogMode === 'view' ? (
              <Chip size="small" variant="outlined" label="Solo lectura" />
            ) : null}
          </DialogTitle>

          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                    Datos de la compra
                  </Typography>

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
                      label="Fecha"
                      type="date"
                      size="small"
                      value={editorPurchaseDate}
                      onChange={(e) => setEditorPurchaseDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      disabled={!canEdit}
                      sx={{ width: 180 }}
                    />

                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Estado</InputLabel>
                      <Select label="Estado" value={editorStatus} onChange={(e) => setEditorStatus(e.target.value)} disabled={!canEdit}>
                        {STATUS_OPTIONS.map((s) => (
                          <MenuItem key={s.value} value={s.value}>
                            {s.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <FormControl size="small" sx={{ minWidth: 220 }}>
                      <InputLabel>Método de pago</InputLabel>
                      <Select label="Método de pago" value={editorPaymentMethod} onChange={(e) => setEditorPaymentMethod(e.target.value)} disabled={!canEdit}>
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
                    <Button variant="outlined" component="label" disabled={!canEdit}>
                      Subir recibo
                      <input
                        type="file"
                        hidden
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null
                          setReceiptFile(file)
                          setReceiptFileName(file?.name || '')
                        }}
                      />
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      {receiptFileName ? `Documento: ${receiptFileName}` : 'Ningún documento seleccionado'}
                    </Typography>
                  </Box>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
                    Piezas compradas
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
                    <Autocomplete
                      options={productOptions}
                      loading={productLoading}
                      value={null}
                      inputValue={productQuery}
                      onInputChange={(_, v) => setProductQuery(v)}
                      onChange={(_, v) => addLineFromProduct(v)}
                      getOptionLabel={(p) => (p?.name ? `${p.name} · ${p.sku || ''}` : '')}
                      renderInput={(params) => <TextField {...params} label="Buscar pieza (nombre/SKU)" size="small" disabled={!canEdit} />}
                      noOptionsText={safeTrim(productQuery).length < 2 ? 'Escribe para buscar…' : 'Sin resultados'}
                      sx={{ flex: 1, minWidth: 280 }}
                    />
                  </Box>

                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell width={140}>SKU</TableCell>
                        <TableCell width={140} align="right">
                          Precio
                        </TableCell>
                        <TableCell width={120} align="center">
                          Cant.
                        </TableCell>
                        <TableCell width={160} align="right">
                          Subtotal
                        </TableCell>
                        <TableCell width={60} align="right">
                          Acc.
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lines.filter((l) => safeTrim(l.productName)).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            Agrega piezas para registrar la compra.
                          </TableCell>
                        </TableRow>
                      ) : (
                        lines.map((l) => (
                          <TableRow key={l.key}>
                            <TableCell>{l.productName || '-'}</TableCell>
                            <TableCell>{l.sku || '-'}</TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                disabled={!canEdit}
                                value={l.unitPrice}
                                inputProps={{ min: 0, step: 0.01 }}
                                onChange={(e) => updateLine(l.key, { unitPrice: parseFloat(e.target.value) || 0 })}
                                sx={{ width: 120, ml: 'auto' }}
                              />
                            </TableCell>
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                disabled={!canEdit}
                                value={l.quantity}
                                inputProps={{ min: 1, step: 1 }}
                                onChange={(e) => updateLine(l.key, { quantity: parseInt(e.target.value, 10) || 1 })}
                                sx={{ width: 90 }}
                              />
                            </TableCell>
                            <TableCell align="right">{formatMoney(Number(l.unitPrice || 0) * Math.max(1, Number(l.quantity || 1)))}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" disabled={!canEdit} onClick={() => removeLine(l.key)} aria-label="Quitar" color="error">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </Paper>
              </Box>

              <Box sx={{ width: { xs: '100%', lg: 360 }, flexShrink: 0 }}>
                <Paper sx={{ p: 2, position: 'sticky', top: 88 }}>
                  <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 1 }}>
                    Resumen
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="text.secondary">Piezas</Typography>
                    <Typography fontWeight={700}>
                      {lines.reduce((s, l) => s + (safeTrim(l.productName) ? Math.max(1, parseInt(l.quantity, 10) || 1) : 0), 0)}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Total</Typography>
                    <Typography fontWeight={900}>{formatMoney(totals.total)}</Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ pr: 3, pb: 2 }}>
            {dialogMode === 'view' ? (
              <Button onClick={closeDialog} disabled={loading}>
                Cerrar
              </Button>
            ) : (
              <>
                <Button onClick={closeDialog} disabled={loading}>
                  Cancelar
                </Button>
                <Button variant="contained" onClick={savePurchase} disabled={loading} sx={{ bgcolor: '#7B2CBF', '&:hover': { bgcolor: '#6A26A8' } }}>
                  {loading ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Guardar'}
                </Button>
              </>
            )}

            {dialogMode === 'edit' && canEdit ? (
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  if (!editorId) return
                  const ok = window.confirm('¿Eliminar esta compra?')
                  if (!ok) return
                  deletePurchase()
                }}
                disabled={loading}
                sx={{ ml: 'auto' }}
              >
                Eliminar
              </Button>
            ) : null}
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

export default Compras
