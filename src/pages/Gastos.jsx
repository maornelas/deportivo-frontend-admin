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
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material'
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
import { getExpenseTypes } from '../api/expenseTypes'
import { getUsers } from '../api/user'
import { getRoles } from '../api/rbac'
import { useAuth } from '../contexts/AuthContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'
import { usePushNotification } from '../hooks/usePushNotification'

const LIMIT = 15

function categoryNamesFromCatalog(catalog, { activeOnly = false } = {}) {
  const list = Array.isArray(catalog) ? catalog : []
  const filtered = activeOnly ? list.filter((t) => t.isActive !== false) : list
  return filtered.map((t) => t.name).filter(Boolean)
}

function categoryOptionsForSelect(catalogNames, currentValue) {
  const v = (currentValue || '').trim()
  if (v && !catalogNames.includes(v)) return [v, ...catalogNames]
  return catalogNames
}

function isEmpleadoRbacRole(role) {
  if (!role) return false
  const slug = String(role.slug || '')
    .toLowerCase()
    .trim()
  const name = String(role.name || '')
    .toLowerCase()
    .trim()
  return slug === 'empleado' || name === 'empleado'
}

function formatUserLabel(u) {
  if (!u) return ''
  const n = [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
  return n || u.email || ''
}

function formatDate(value) {
  if (!value) return '-'
  const s = typeof value === 'string' ? value.slice(0, 10) : value
  const d = new Date(s + (typeof value === 'string' && value.length <= 10 ? 'T12:00:00' : ''))
  return isNaN(d.getTime()) ? value : d.toLocaleDateString('es-MX', { dateStyle: 'short' })
}

function formatExpenseTime(createdAt) {
  if (!createdAt) return '—'
  const d = new Date(createdAt)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('es-MX', { timeStyle: 'medium' })
}

function formatCurrency(value) {
  if (value == null) return '-'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(value))
}

const EXPENSE_IVA_RATE = 0.16

function round2(n) {
  return Math.round(Number(n) * 100) / 100
}

function expenseLineBase(amount, quantity) {
  return round2((parseFloat(amount) || 0) * (Math.max(1, parseInt(String(quantity), 10) || 1)))
}

/** Monto neto de línea: manual sin IVA, o (monto × cantidad) + IVA si el manual está vacío. */
function expenseLineNet(amount, quantity, netLineSubtotalStr) {
  const line = expenseLineBase(amount, quantity)
  const netStr = String(netLineSubtotalStr ?? '').trim()
  if (netStr !== '') {
    return round2(parseFloat(netStr) || 0)
  }
  return round2(line * (1 + EXPENSE_IVA_RATE))
}

function sumLineItems(items) {
  if (!Array.isArray(items)) return 0
  return round2(items.reduce((acc, it) => acc + expenseLineBase(it.amount, it.quantity), 0))
}

function sumLineItemsNet(items) {
  if (!Array.isArray(items)) return 0
  return round2(
    items.reduce((acc, it) => acc + expenseLineNet(it.amount, it.quantity, it.netLineSubtotal), 0),
  )
}

function isManualNetLine(lineSubtotal, netLineSubtotal) {
  const line = round2(lineSubtotal)
  const net = round2(netLineSubtotal)
  const autoWithIva = round2(line * (1 + EXPENSE_IVA_RATE))
  return Math.abs(net - line) > 0.005 && Math.abs(net - autoWithIva) > 0.005
}

const emptyItem = () => ({
  amount: '',
  quantity: 1,
  netLineSubtotal: '',
})

const Gastos = () => {
  const { canDoAction, user } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()
  const { notify, pushNotificationSnackbar } = usePushNotification()
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
  const [selectedSueldoUserId, setSelectedSueldoUserId] = useState('')
  const [empleadoUsers, setEmpleadoUsers] = useState([])
  const [empleadosLoading, setEmpleadosLoading] = useState(false)
  const [empleadosListMessage, setEmpleadosListMessage] = useState('')
  /** Al editar un SUELDO: texto guardado en la primera línea para preseleccionar empleado cuando cargue la lista. */
  const [pendingSueldoLabelForEdit, setPendingSueldoLabelForEdit] = useState('')
  const [items, setItems] = useState([emptyItem()])

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [detailExpense, setDetailExpense] = useState(null)
  const [expenseTypeCatalog, setExpenseTypeCatalog] = useState([])

  const filterCategoryNames = useMemo(
    () => categoryNamesFromCatalog(expenseTypeCatalog, { activeOnly: false }),
    [expenseTypeCatalog],
  )
  const formCategoryNames = useMemo(
    () => categoryNamesFromCatalog(expenseTypeCatalog, { activeOnly: true }),
    [expenseTypeCatalog],
  )

  const computedTotal = useMemo(() => sumLineItems(items), [items])
  const computedTotalNet = useMemo(() => sumLineItemsNet(items), [items])

  useEffect(() => {
    getExpenseTypes({ activeOnly: false }).then((r) => {
      if (r.success) setExpenseTypeCatalog(r.data || [])
    })
  }, [])

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

  useEffect(() => {
    if (!formOpen || formCategory.trim() !== 'SUELDO') {
      setEmpleadoUsers([])
      setEmpleadosListMessage('')
      setEmpleadosLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setEmpleadosLoading(true)
      setEmpleadosListMessage('')
      const rr = await getRoles()
      if (cancelled) return
      if (!rr.success) {
        setEmpleadosLoading(false)
        setEmpleadoUsers([])
        setEmpleadosListMessage(rr.error || 'No se pudieron cargar los roles')
        setPendingSueldoLabelForEdit('')
        return
      }
      const empleadoRole = (rr.data || []).find(isEmpleadoRbacRole)
      if (!empleadoRole) {
        setEmpleadosLoading(false)
        setEmpleadoUsers([])
        setEmpleadosListMessage(
          'No existe un rol «Empleado» en Roles y permisos. Crea uno con nombre o slug «empleado» y asígnalo a los usuarios.',
        )
        setPendingSueldoLabelForEdit('')
        return
      }
      const ru = await getUsers({ activeOnly: true, excludeRole: 'customer' })
      if (cancelled) return
      setEmpleadosLoading(false)
      if (!ru.success) {
        setEmpleadoUsers([])
        setEmpleadosListMessage(ru.error || 'No se pudieron cargar usuarios')
        setPendingSueldoLabelForEdit('')
        return
      }
      const list = (ru.data || []).filter(
        (u) => u.adminRoleId === empleadoRole.id && u.isActive !== false,
      )
      setEmpleadoUsers(list)
      if (list.length === 0) {
        setEmpleadosListMessage('No hay usuarios activos con el rol Empleado.')
        setPendingSueldoLabelForEdit('')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [formOpen, formCategory])

  useEffect(() => {
    if (!pendingSueldoLabelForEdit.trim() || selectedSueldoUserId) {
      return
    }
    if (!empleadoUsers.length) return
    const found = empleadoUsers.find(
      (u) => formatUserLabel(u).toLowerCase() === pendingSueldoLabelForEdit.toLowerCase(),
    )
    if (found) setSelectedSueldoUserId(found.id)
    setPendingSueldoLabelForEdit('')
  }, [empleadoUsers, pendingSueldoLabelForEdit, selectedSueldoUserId])

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
    setSelectedSueldoUserId('')
    setPendingSueldoLabelForEdit('')
    setEmpleadoUsers([])
    setEmpleadosListMessage('')
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
    setSelectedSueldoUserId('')
    setPendingSueldoLabelForEdit(
      (e.category || '').trim() === 'SUELDO'
        ? String((e.items || [])[0]?.employeeOrUnit || '').trim()
        : '',
    )
    setEmpleadosListMessage('')
    setItems(
      (e.items || []).length
        ? e.items.map((i) => {
            const line = Number(i.lineSubtotal ?? 0)
            const net = i.netLineSubtotal != null ? Number(i.netLineSubtotal) : line
            return {
              amount: i.amount,
              quantity: i.quantity ?? 1,
              netLineSubtotal: isManualNetLine(line, net) ? String(net) : '',
            }
          })
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
    const cat = formCategory.trim()
    let sueldoEmployeeOrUnit = ''
    if (cat === 'SUELDO') {
      if (!selectedSueldoUserId.trim()) {
        return { error: 'Selecciona el empleado para el gasto de categoría SUELDO.' }
      }
      const u = empleadoUsers.find((x) => x.id === selectedSueldoUserId)
      sueldoEmployeeOrUnit = formatUserLabel(u)
      if (!sueldoEmployeeOrUnit) {
        return { error: 'El empleado seleccionado ya no está disponible. Vuelve a abrir el formulario o elige otro.' }
      }
    }
    const cleanItems = items
      .filter((i) => String(i.amount || '').trim() !== '' && parseFloat(i.amount) > 0)
      .map((i) => {
        const amount = round2(parseFloat(i.amount) || 0)
        const quantity = Math.max(1, parseInt(String(i.quantity), 10) || 1)
        const netStr = String(i.netLineSubtotal ?? '').trim()
        const base = { amount, quantity }
        if (netStr !== '') {
          base.netLineSubtotal = round2(parseFloat(netStr) || 0)
        }
        if (sueldoEmployeeOrUnit) {
          base.employeeOrUnit = sueldoEmployeeOrUnit
        }
        return base
      })
    if (!cleanItems.length) {
      return { error: 'Agrega al menos una línea con monto.' }
    }
    const totalAmount = sumLineItems(cleanItems)
    if (!cat) {
      return { error: 'Selecciona una categoría.' }
    }
    if (formMode === 'create' && formCategoryNames.length > 0 && !formCategoryNames.includes(cat)) {
      return { error: 'Categoría no válida o inactiva. Revise el catálogo en Catálogos → Tipos de gasto.' }
    }
    if (!expenseDate) {
      return { error: 'La fecha es obligatoria.' }
    }
    return {
      payload: {
        expenseDate,
        totalAmount,
        category: cat,
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
    const d = result.data
    const folio = d?.expenseNumber
    const amt = d?.totalAmount != null ? formatCurrency(d.totalAmount) : ''
    if (formMode === 'create') {
      notify(
        folio ? `Gasto registrado · ${folio}${amt ? ` · ${amt}` : ''}` : 'Gasto registrado correctamente',
        { browserTitle: 'Gasto registrado', browserBody: folio ? `Folio ${folio}` : 'Registro guardado' },
      )
    } else {
      notify(
        folio ? `Gasto actualizado · ${folio}${amt ? ` · ${amt}` : ''}` : 'Gasto actualizado correctamente',
        { browserTitle: 'Gasto actualizado', browserBody: folio ? `Folio ${folio}` : 'Cambios guardados' },
      )
    }
    fetchList()
  }

  const closeDetail = () => setDetailExpense(null)

  const openEditFromDetail = () => {
    const e = detailExpense
    closeDetail()
    if (e) openEdit(e)
  }

  const openDeleteFromDetail = () => {
    const e = detailExpense
    closeDetail()
    if (!e) return
    if (!canDoAction(ACTION.GASTOS_ELIMINAR)) {
      showDenied()
      return
    }
    setDeleteTarget(e)
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
    const folio = deleteTarget.expenseNumber
    const amt = deleteTarget.totalAmount != null ? formatCurrency(deleteTarget.totalAmount) : ''
    notify(
      folio ? `Gasto eliminado · ${folio}${amt ? ` · ${amt}` : ''}` : 'Gasto eliminado',
      { browserTitle: 'Gasto eliminado', browserBody: folio ? `Folio ${folio}` : '' },
    )
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
          <Box>
            <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold', fontSize: { xs: '24px', sm: '28px', md: '32px' } }}>
              Gastos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Elige la categoría del gasto y las líneas de monto. El registro queda a nombre del usuario conectado; el
              proveedor se guarda como DEPORTIVO. Doble clic para ver el detalle.
            </Typography>
          </Box>
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
                label="Buscar (GST, categoría, concepto, empleado, proveedor)"
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
              <FormControl fullWidth size="small">
                <InputLabel>Categoría</InputLabel>
                <Select
                  label="Categoría"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Todas</em>
                  </MenuItem>
                  {filterCategoryNames.map((c) => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                  <TableCell>ID gasto</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Hora</TableCell>
                  <TableCell>Categoría</TableCell>
                  <TableCell align="right">Total</TableCell>
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
                    <TableRow
                      key={row.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onDoubleClick={() => setDetailExpense(row)}
                    >
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{row.expenseNumber || '—'}</TableCell>
                      <TableCell>{formatDate(row.expenseDate)}</TableCell>
                      <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{formatExpenseTime(row.createdAt)}</TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell align="right">{formatCurrency(row.totalAmount)}</TableCell>
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

        <Dialog open={formOpen} onClose={() => !formLoading && setFormOpen(false)} maxWidth="lg" fullWidth>
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
                    <FormControl fullWidth size="small" required>
                      <InputLabel id="gastos-categoria-label" shrink>
                        Categoría
                      </InputLabel>
                      <Select
                        labelId="gastos-categoria-label"
                        label="Categoría"
                        value={formCategory}
                        onChange={(e) => {
                          const v = e.target.value
                          setFormCategory(v)
                          if (v.trim() !== 'SUELDO') {
                            setSelectedSueldoUserId('')
                            setPendingSueldoLabelForEdit('')
                          }
                        }}
                        displayEmpty
                        renderValue={(selected) =>
                          selected ? (
                            selected
                          ) : (
                            <Box component="span" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                              Seleccionar categoría
                            </Box>
                          )
                        }
                      >
                        <MenuItem value="" disabled sx={{ display: 'none' }}>
                          —
                        </MenuItem>
                        {categoryOptionsForSelect(formCategoryNames, formCategory).map((c) => (
                          <MenuItem key={c} value={c}>
                            {c}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Se usa en reportes y en cada línea como concepto. Proveedor: DEPORTIVO (automático).
                    </Typography>
                  </Grid>
                  {formCategory.trim() === 'SUELDO' && (
                    <Grid item xs={12}>
                      {empleadosListMessage ? (
                        <Alert severity={empleadoUsers.length ? 'info' : 'warning'} sx={{ mb: 1.5 }}>
                          {empleadosListMessage}
                        </Alert>
                      ) : null}
                      <FormControl fullWidth size="small" required>
                        <InputLabel id="gastos-sueldo-empleado-label">Empleado</InputLabel>
                        <Select
                          labelId="gastos-sueldo-empleado-label"
                          label="Empleado"
                          value={selectedSueldoUserId}
                          onChange={(e) => setSelectedSueldoUserId(e.target.value)}
                          disabled={empleadosLoading || empleadoUsers.length === 0}
                        >
                          <MenuItem value="">
                            <em>{empleadosLoading ? 'Cargando…' : 'Seleccionar empleado'}</em>
                          </MenuItem>
                          {empleadoUsers.map((u) => (
                            <MenuItem key={u.id} value={u.id}>
                              {formatUserLabel(u)}
                              {u.email ? ` · ${u.email}` : ''}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Lista de usuarios activos con rol RBAC «Empleado» (nombre o slug <strong>empleado</strong> en Roles y
                        permisos). Se guarda en cada línea del gasto como empleado / unidad.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1.5, mb: 1 }}>
                  Registrado como:{' '}
                  <strong>
                    {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '—'}
                  </strong>
                </Typography>
                <Typography variant="subtitle2" sx={{ mt: 1, mb: 1 }}>
                  Líneas de monto (misma categoría en todas las líneas de este gasto)
                </Typography>
                {items.map((it, idx) => (
                  <Grid container spacing={1} key={idx} sx={{ mb: 1.5 }} alignItems="flex-start">
                    <Grid item xs={6} sm={4} md={3}>
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
                    <Grid item xs={6} sm={3} md={1}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Cant."
                        type="number"
                        inputProps={{ min: 1 }}
                        value={it.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Monto neto (línea)"
                        type="number"
                        inputProps={{ step: '0.01', min: 0 }}
                        value={it.netLineSubtotal}
                        onChange={(e) => updateItem(idx, 'netLineSubtotal', e.target.value)}
                        placeholder="opcional"
                        helperText="Si vacío = (monto × cant.) + IVA 16 %"
                      />
                    </Grid>
                    <Grid item xs={6} sm={4} md={2}>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {String(it.netLineSubtotal ?? '').trim() ? 'Neto (manual)' : 'Neto (+ IVA)'}
                      </Typography>
                      <Typography variant="body2" sx={{ pt: 0.5, fontWeight: 600 }}>
                        {formatCurrency(expenseLineNet(it.amount, it.quantity, it.netLineSubtotal))}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4} md={1}>
                      <Button size="small" disabled={items.length <= 1} onClick={() => removeItemRow(idx)} sx={{ mt: 1 }}>
                        Quitar
                      </Button>
                    </Grid>
                  </Grid>
                ))}
                <Button size="small" onClick={addItemRow} sx={{ mt: 1 }}>
                  + Agregar línea
                </Button>
                <Alert severity="info" sx={{ mt: 2 }}>
                  Total monto sin IVA (registro): <strong>{formatCurrency(computedTotal)}</strong>
                  <br />
                  Total neto líneas: <strong>{formatCurrency(computedTotalNet)}</strong>
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

        <Dialog open={!!detailExpense} onClose={closeDetail} maxWidth="md" fullWidth scroll="paper">
          <DialogTitle
            sx={{
              bgcolor: '#7B2CBF',
              color: '#fff',
              fontWeight: 600,
              py: 2,
              pr: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            Detalle del gasto
            <IconButton
              onClick={closeDetail}
              edge="end"
              size="small"
              aria-label="Cerrar"
              sx={{
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {detailExpense && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    ID gasto
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                    {detailExpense.expenseNumber || '—'}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 140px' }}>
                    <Typography variant="caption" color="text.secondary">
                      Fecha del gasto
                    </Typography>
                    <Typography variant="body2">{formatDate(detailExpense.expenseDate)}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 140px' }}>
                    <Typography variant="caption" color="text.secondary">
                      Hora de registro
                    </Typography>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {formatExpenseTime(detailExpense.createdAt)}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Categoría
                  </Typography>
                  <Typography variant="body2">{detailExpense.category}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatCurrency(detailExpense.totalAmount)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Registrado por
                    </Typography>
                    <Typography variant="body2">
                      {(detailExpense.items && detailExpense.items[0]?.employeeOrUnit) || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Proveedor
                    </Typography>
                    <Typography variant="body2">DEPORTIVO</Typography>
                  </Box>
                </Box>
                <Divider />
                <Typography variant="subtitle2">Ítems</Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Empleado</TableCell>
                      <TableCell>Concepto</TableCell>
                      <TableCell>Proveedor</TableCell>
                      <TableCell align="right">Monto u.</TableCell>
                      <TableCell align="right">Cant.</TableCell>
                      <TableCell align="right">Monto</TableCell>
                      <TableCell align="right">Monto neto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(detailExpense.items || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                          <Typography variant="body2" color="text.secondary">
                            Sin ítems
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      (detailExpense.items || []).map((it) => (
                        <TableRow key={it.id || `${it.concept}-${it.amount}`}>
                          <TableCell>{it.employeeOrUnit || '—'}</TableCell>
                          <TableCell>{it.concept}</TableCell>
                          <TableCell>{it.supplier || '—'}</TableCell>
                          <TableCell align="right">{formatCurrency(it.amount)}</TableCell>
                          <TableCell align="right">{it.quantity ?? 1}</TableCell>
                          <TableCell align="right">{formatCurrency(it.lineSubtotal)}</TableCell>
                          <TableCell align="right">
                            {formatCurrency(it.netLineSubtotal ?? it.lineSubtotal)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 2, py: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Button onClick={closeDetail}>Cerrar</Button>
            <Box sx={{ flex: '1 1 auto' }} />
            {canDoAction(ACTION.GASTOS_EDITAR) && (
              <Button startIcon={<EditIcon />} variant="outlined" onClick={openEditFromDetail}>
                Editar
              </Button>
            )}
            {canDoAction(ACTION.GASTOS_ELIMINAR) && (
              <Button startIcon={<DeleteIcon />} color="error" variant="outlined" onClick={openDeleteFromDetail}>
                Eliminar
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Dialog open={!!deleteTarget} onClose={() => !deleteLoading && setDeleteTarget(null)}>
          <DialogContent>
            <Typography>
              ¿Eliminar el gasto {deleteTarget?.expenseNumber ? `${deleteTarget.expenseNumber} ` : ''}
              del {deleteTarget ? formatDate(deleteTarget.expenseDate) : ''} — {deleteTarget?.category} (
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
        {pushNotificationSnackbar}
      </Box>
    </Box>
  )
}

export default Gastos
