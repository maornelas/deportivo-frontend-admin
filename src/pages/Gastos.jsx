import { useState, useEffect, useCallback, useMemo } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import {
  Box,
  Typography,
  Paper,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  InputAdornment,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Tooltip,
} from '@mui/material'
import { Search as SearchIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ModalHeader from '../components/ModalHeader'
import {
  listExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
} from '../api/expenses'
import { useAuth } from '../contexts/AuthContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'

const LIMIT = 15

const CATEGORY_HINTS = ['gasolina', 'nómina', 'mantenimiento', 'servicios', 'renta', 'suministros']

function formatDate(value) {
  if (!value) return '-'
  const s = typeof value === 'string' ? value.slice(0, 10) : value
  const d = new Date(s + (typeof value === 'string' && value.length <= 10 ? 'T12:00:00' : ''))
  return isNaN(d.getTime()) ? value : d.toLocaleDateString('es-MX', { dateStyle: 'short' })
}

function formatCurrency(value) {
  if (value == null) return '-'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value))
}

function round2(n) {
  return Math.round(Number(n) * 100) / 100
}

function sumLineItems(items) {
  if (!Array.isArray(items)) return 0
  return round2(items.reduce((acc, it) => acc + Number(it.amount || 0) * Number(it.quantity || 0), 0))
}

const emptyItem = () => ({ concept: '', amount: '', quantity: 1 })

const Gastos = () => {
  const { canDoAction } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expenses, setExpenses] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [limit] = useState(LIMIT)

  const [search, setSearch] = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [category, setCategory] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('DESC')

  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState('create')
  const [editingId, setEditingId] = useState(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [expenseDate, setExpenseDate] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [description, setDescription] = useState('')
  const [items, setItems] = useState([emptyItem()])

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const computedTotal = useMemo(() => sumLineItems(items), [items])

  const fetchList = useCallback(async () => {
    setLoading(true)
    setError('')
    const params = {
      page: page + 1,
      limit,
      sortBy,
      sortOrder,
    }
    if (searchApplied) params.search = searchApplied
    if (category.trim()) params.category = category.trim()
    if (startDate) params.startDate = startDate
    if (endDate) params.endDate = endDate
    if (minAmount !== '') {
      const n = parseFloat(minAmount)
      if (!Number.isNaN(n)) params.minAmount = n
    }
    if (maxAmount !== '') {
      const n = parseFloat(maxAmount)
      if (!Number.isNaN(n)) params.maxAmount = n
    }

    const result = await listExpenses(params)
    setLoading(false)
    if (!result.success) {
      setError(result.error || 'Error al cargar gastos')
      return
    }
    setExpenses(result.data.expenses || [])
    setTotal(result.data.total ?? 0)
  }, [page, limit, searchApplied, category, startDate, endDate, minAmount, maxAmount, sortBy, sortOrder])

  useEffect(() => {
    fetchList()
  }, [fetchList])

  const handleApplyFilters = () => {
    setSearchApplied(search)
    setPage(0)
  }

  const openCreate = () => {
    if (!canDoAction(ACTION.GASTOS_CREAR)) {
      showDenied()
      return
    }
    setFormMode('create')
    setEditingId(null)
    setExpenseDate(new Date().toISOString().slice(0, 10))
    setFormCategory('')
    setDescription('')
    setItems([emptyItem()])
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = async (row) => {
    if (!canDoAction(ACTION.GASTOS_EDITAR)) {
      showDenied()
      return
    }
    setFormMode('edit')
    setEditingId(row.id)
    setFormLoading(true)
    setFormError('')
    setFormOpen(true)
    const r = await getExpenseById(row.id)
    setFormLoading(false)
    if (!r.success) {
      setFormError(r.error || 'No se pudo cargar el gasto')
      return
    }
    const e = r.data
    setExpenseDate((e.expenseDate || '').slice(0, 10))
    setFormCategory(e.category || '')
    setDescription(e.description || '')
    setItems(
      (e.items || []).length
        ? e.items.map((i) => ({
            concept: i.concept || '',
            amount: i.amount,
            quantity: i.quantity ?? 1,
          }))
        : [emptyItem()],
    )
  }

  const addItemRow = () => setItems((prev) => [...prev, emptyItem()])
  const removeItemRow = (idx) => {
    setItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)))
  }
  const updateItem = (idx, field, value) => {
    setItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: field === 'quantity' || field === 'amount' ? value : value } : row)),
    )
  }

  const buildPayload = () => {
    const cleanItems = items
      .filter((i) => String(i.concept || '').trim())
      .map((i) => ({
        concept: String(i.concept).trim(),
        amount: round2(parseFloat(i.amount) || 0),
        quantity: Math.max(1, parseInt(String(i.quantity), 10) || 1),
      }))
    if (!cleanItems.length) {
      return { error: 'Agrega al menos un ítem con concepto.' }
    }
    const totalAmount = sumLineItems(cleanItems)
    if (!formCategory.trim()) {
      return { error: 'La categoría es obligatoria.' }
    }
    if (!expenseDate) {
      return { error: 'La fecha es obligatoria.' }
    }
    return {
      payload: {
        expenseDate,
        totalAmount,
        category: formCategory.trim(),
        description: description.trim() || undefined,
        items: cleanItems,
      },
    }
  }

  const handleSubmitForm = async () => {
    if (formMode === 'create') {
      if (!canDoAction(ACTION.GASTOS_CREAR)) {
        showDenied()
        return
      }
    } else if (!canDoAction(ACTION.GASTOS_EDITAR)) {
      showDenied()
      return
    }
    const built = buildPayload()
    if (built.error) {
      setFormError(built.error)
      return
    }
    setFormError('')
    setFormLoading(true)
    let result
    if (formMode === 'create') {
      result = await createExpense(built.payload)
    } else {
      result = await updateExpense(editingId, built.payload)
    }
    setFormLoading(false)
    if (!result.success) {
      setFormError(result.error || 'Error al guardar')
      return
    }
    setFormOpen(false)
    fetchList()
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return
    if (!canDoAction(ACTION.GASTOS_ELIMINAR)) {
      showDenied()
      setDeleteTarget(null)
      return
    }
    setDeleteLoading(true)
    const r = await deleteExpense(deleteTarget.id)
    setDeleteLoading(false)
    if (!r.success) {
      setError(r.error || 'Error al eliminar')
      setDeleteTarget(null)
      return
    }
    setDeleteTarget(null)
    fetchList()
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
          pt: { xs: '16px', sm: '24px', md: '32px' },
          pr: { xs: '16px', sm: '24px', md: '32px' },
          pb: { xs: '16px', sm: '24px', md: '32px' },
          pl: { xs: '16px', sm: '24px', md: `${SIDEBAR_WIDTH + 32}px` },
          backgroundColor: '#fafafa',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 2 }}>
          <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold', fontSize: { xs: '24px', sm: '28px', md: '32px' } }}>
            Gastos
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Nuevo gasto
          </Button>
        </Box>

        <Paper elevation={2} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Filtros
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Buscar (categoría o descripción)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleApplyFilters}>
                        <SearchIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField fullWidth size="small" label="Categoría exacta" value={category} onChange={(e) => setCategory(e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Desde"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Hasta"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField fullWidth size="small" label="Mín $" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={3} md={1.5}>
              <TextField fullWidth size="small" label="Máx $" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} />
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Ordenar por</InputLabel>
                <Select label="Ordenar por" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <MenuItem value="date">Fecha</MenuItem>
                  <MenuItem value="amount">Monto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Orden</InputLabel>
                <Select label="Orden" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                  <MenuItem value="DESC">Descendente</MenuItem>
                  <MenuItem value="ASC">Ascendente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4} md={2}>
              <Button variant="outlined" onClick={handleApplyFilters} fullWidth>
                Aplicar filtros
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right" width={120}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No hay gastos con los filtros actuales.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{formatDate(row.expenseDate)}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
                      <TableCell sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.description || '—'}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar">
                          <IconButton size="small" color="primary" onClick={() => openEdit(row)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (!canDoAction(ACTION.GASTOS_ELIMINAR)) {
                                showDenied()
                                return
                              }
                              setDeleteTarget(row)
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={limit}
            rowsPerPageOptions={[LIMIT]}
            labelRowsPerPage="Por página"
          />
        </Paper>

        <Dialog open={formOpen} onClose={() => !formLoading && setFormOpen(false)} maxWidth="md" fullWidth>
          <ModalHeader title={formMode === 'create' ? 'Nuevo gasto' : 'Editar gasto'} onClose={() => !formLoading && setFormOpen(false)} />
          <DialogContent dividers>
            {formLoading && formMode === 'edit' && !expenseDate ? (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {formError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {formError}
                  </Alert>
                )}
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      label="Fecha del gasto"
                      InputLabelProps={{ shrink: true }}
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Categoría"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      placeholder="ej. gasolina, nómina…"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Sugerencias: {CATEGORY_HINTS.join(', ')}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Descripción (opcional)"
                      multiline
                      minRows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </Grid>
                </Grid>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Ítems (el total debe coincidir con la suma de monto × cantidad)
                </Typography>
                {items.map((it, idx) => (
                  <Grid container spacing={1} key={idx} sx={{ mb: 1 }} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Concepto"
                        value={it.concept}
                        onChange={(e) => updateItem(idx, 'concept', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={5} sm={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Monto unit."
                        type="number"
                        inputProps={{ step: '0.01', min: 0 }}
                        value={it.amount}
                        onChange={(e) => updateItem(idx, 'amount', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={4} sm={2}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Cantidad"
                        type="number"
                        inputProps={{ min: 1 }}
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={3} sm={2}>
                      <Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
                        Subtotal: {formatCurrency((parseFloat(it.amount) || 0) * (parseInt(it.quantity, 10) || 0))}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={1}>
                      <Button size="small" disabled={items.length <= 1} onClick={() => removeItemRow(idx)}>
                        Quitar
                      </Button>
                    </Grid>
                  </Grid>
                ))}
                <Button size="small" onClick={addItemRow} sx={{ mt: 1 }}>
                  + Agregar línea
                </Button>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Total calculado (se envía al API): <strong>{formatCurrency(computedTotal)}</strong>
                </Alert>
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setFormOpen(false)} disabled={formLoading}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSubmitForm} disabled={formLoading}>
              {formLoading ? <CircularProgress size={22} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!deleteTarget} onClose={() => !deleteLoading && setDeleteTarget(null)}>
          <DialogContent>
            <Typography>
              ¿Eliminar el gasto del {deleteTarget ? formatDate(deleteTarget.expenseDate) : ''} — {deleteTarget?.category} (
              {deleteTarget ? formatCurrency(deleteTarget.totalAmount) : ''})?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Es una eliminación lógica; no se mostrará en listados normales.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button color="error" variant="contained" onClick={handleConfirmDelete} disabled={deleteLoading}>
              {deleteLoading ? <CircularProgress size={22} color="inherit" /> : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>
        {permissionDeniedSnackbar}
      </Box>
    </Box>
  )
}

export default Gastos
