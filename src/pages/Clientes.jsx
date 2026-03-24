import { useState, useEffect, useCallback } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Avatar,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Card,
  CardContent,
  Chip,
  Stepper,
  Step,
  StepLabel,
  IconButton,
} from '@mui/material'
import { Search as SearchIcon, Person, LocationOn, ShoppingCart, CreditCard, AssignmentReturn, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ModalHeader from '../components/ModalHeader'
import { getUsers, getUserById, updateUser, createUser } from '../api/user'
import { getAddressesByUser, createAddress } from '../api/userAddress'
import { getPaymentsByUser, createPayment } from '../api/userPayment'
import { searchOrders } from '../api/orders'
import { useAuth } from '../contexts/AuthContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'

function formatDate(value) {
  if (!value) return '-'
  const d = typeof value === 'string' ? new Date(value) : value
  return isNaN(d.getTime()) ? value : d.toLocaleDateString('es-MX', { dateStyle: 'short' })
}

function formatDateTime(value) {
  if (!value) return '-'
  const d = typeof value === 'string' ? new Date(value) : value
  return isNaN(d.getTime()) ? value : d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

function getInitials(user) {
  const first = (user.firstName || '').trim()
  const last = (user.lastName || '').trim()
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase()
  if (first) return first.slice(0, 2).toUpperCase()
  if (user.email) return user.email.slice(0, 2).toUpperCase()
  return '?'
}

const ROLE_OPTIONS = [
  { value: 'customer', label: 'Cliente' },
  { value: 'admin', label: 'Admin' },
  { value: 'moderator', label: 'Moderador' },
]

function getRoleLabel(role) {
  if (!role) return '-'
  const opt = ROLE_OPTIONS.find((o) => o.value === role)
  return opt ? opt.label : role
}

function formatCurrency(value, currency = 'MXN') {
  if (value == null) return '-'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(value))
}

const ORDER_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped', label: 'En camino' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'refunded', label: 'Reembolsado' },
]

function getOrderStatusLabel(status) {
  const opt = ORDER_STATUS_OPTIONS.find((o) => o.value === status)
  return opt ? opt.label : status || '-'
}

function formatAddressType(type) {
  if (!type) return '—'
  const t = String(type).toUpperCase()
  if (t === 'CASA' || t === 'HOME') return 'Casa'
  if (t === 'OFICINA' || t === 'OFFICE') return 'Oficina'
  if (t === 'OTRO' || t === 'OTHER') return 'Otro'
  return type
}

function formatPaymentType(type) {
  if (!type) return '—'
  const t = String(type).toLowerCase()
  if (t === 'credit_card') return 'Tarjeta de crédito'
  if (t === 'debit_card') return 'Tarjeta de débito'
  if (t === 'paypal') return 'PayPal'
  if (t === 'bank_transfer') return 'Transferencia bancaria'
  return type
}

const ADDRESS_TYPE_OPTIONS = [
  { value: 'Casa', label: 'Casa' },
  { value: 'Oficina', label: 'Oficina' },
  { value: 'Otro', label: 'Otro' },
]

const PAYMENT_TYPE_OPTIONS = [
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'debit_card', label: 'Tarjeta de débito' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'bank_transfer', label: 'Transferencia bancaria' },
]

const emptyAddress = () => ({
  type: 'Casa',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'México',
  addressPhone: '',
  isDefault: false,
  deliveryInstructions: '',
})

const emptyPayment = () => ({
  type: 'credit_card',
  label: '',
  lastFourDigits: '',
  expiryDate: '',
  isDefault: false,
})

const Clientes = () => {
  const { canDoAction } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()
  const canEditCliente = canDoAction(ACTION.CLIENTES_EDITAR)
  const canCrearCliente = canDoAction(ACTION.CLIENTES_CREAR)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUser, setDetailUser] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailTab, setDetailTab] = useState(0)
  const [clientAddresses, setClientAddresses] = useState([])
  const [clientPayments, setClientPayments] = useState([])
  const [clientOrders, setClientOrders] = useState([])
  const [editForm, setEditForm] = useState({ companyName: '', rfc: '', phone: '', role: 'customer', isActive: true })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState(0)
  const [createForm, setCreateForm] = useState({
    email: '',
    passwordHash: '',
    firstName: '',
    lastName: '',
    companyName: '',
    rfc: '',
    phone: '',
  })
  const [createAddresses, setCreateAddresses] = useState([])
  const [createPayments, setCreatePayments] = useState([])
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getUsers({ activeOnly: false, role: 'customer' })
    setLoading(false)
    if (result.success && Array.isArray(result.data)) {
      setUsers(result.data)
    } else {
      setError(result.error || 'Error al cargar clientes')
      setUsers([])
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  const handleRowDoubleClick = useCallback(async (userId) => {
    if (!userId) return
    setDetailOpen(true)
    setDetailUser(null)
    setClientAddresses([])
    setClientPayments([])
    setClientOrders([])
    setSaveError(null)
    setDetailTab(0)
    setDetailLoading(true)
    try {
      const [userRes, addrRes, payRes, ordersRes] = await Promise.all([
        getUserById(userId),
        getAddressesByUser(userId),
        getPaymentsByUser(userId),
        searchOrders({ userId, limit: 100, sortBy: 'createdAt', sortOrder: 'DESC' }),
      ])
      if (userRes.success && userRes.data) {
        const u = userRes.data
        setDetailUser(u)
        setEditForm({
          companyName: u.companyName ?? '',
          rfc: u.rfc ?? '',
          phone: u.phone ?? '',
          role: u.role ?? 'customer',
          isActive: u.isActive !== false,
        })
      } else {
        setDetailUser(null)
      }
      setClientAddresses(addrRes.success && Array.isArray(addrRes.data) ? addrRes.data : [])
      setClientPayments(payRes.success && Array.isArray(payRes.data) ? payRes.data : [])
      setClientOrders(ordersRes.success && ordersRes.data?.orders ? ordersRes.data.orders : [])
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setDetailUser(null)
    setClientAddresses([])
    setClientPayments([])
    setClientOrders([])
    setSaveError(null)
  }

  const clientRefunds = clientOrders.filter((o) => o.status === 'refunded')

  const handleOpenCreate = () => {
    if (!canCrearCliente) {
      showDenied()
      return
    }
    setCreateOpen(true)
    setCreateStep(0)
    setCreateForm({ email: '', passwordHash: '', firstName: '', lastName: '', companyName: '', rfc: '', phone: '' })
    setCreateAddresses([])
    setCreatePayments([])
    setCreateError(null)
  }

  const handleCloseCreate = () => {
    setCreateOpen(false)
    setCreateError(null)
  }

  const handleCreateChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }))
    setCreateError(null)
  }

  const handleAddAddress = () => setCreateAddresses((prev) => [...prev, emptyAddress()])
  const handleRemoveAddress = (index) => setCreateAddresses((prev) => prev.filter((_, i) => i !== index))
  const handleAddressChange = (index, field, value) => {
    setCreateAddresses((prev) => prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)))
    setCreateError(null)
  }

  const handleAddPayment = () => setCreatePayments((prev) => [...prev, emptyPayment()])
  const handleRemovePayment = (index) => setCreatePayments((prev) => prev.filter((_, i) => i !== index))
  const handlePaymentChange = (index, field, value) => {
    setCreatePayments((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
    setCreateError(null)
  }

  const handleCreateNext = () => {
    if (createStep === 0) {
      if (!createForm.email?.trim() || !createForm.passwordHash?.trim()) {
        setCreateError('Email y contraseña son obligatorios.')
        return
      }
      setCreateError(null)
    }
    setCreateStep((s) => Math.min(s + 1, 2))
  }

  const handleCreateBack = () => setCreateStep((s) => Math.max(s - 1, 0))

  const handleSubmitCreate = async () => {
    if (!canCrearCliente) {
      showDenied()
      return
    }
    if (!createForm.email?.trim() || !createForm.passwordHash?.trim()) {
      setCreateError('Email y contraseña son obligatorios.')
      return
    }
    setCreateLoading(true)
    setCreateError(null)
    try {
      const userRes = await createUser({
        email: createForm.email.trim(),
        passwordHash: createForm.passwordHash,
        firstName: createForm.firstName?.trim() || undefined,
        lastName: createForm.lastName?.trim() || undefined,
        companyName: createForm.companyName?.trim() || undefined,
        rfc: createForm.rfc?.trim() || undefined,
        phone: createForm.phone?.trim() || undefined,
        role: 'customer',
      })
      if (!userRes.success || !userRes.data?.id) {
        setCreateError(userRes.error || 'Error al crear cliente')
        return
      }
      const userId = userRes.data.id
      for (const addr of createAddresses) {
        if (!addr.addressLine1?.trim() || !addr.city?.trim() || !addr.state?.trim() || !addr.postalCode?.trim() || !addr.country?.trim()) continue
        const aRes = await createAddress({
          userId,
          type: addr.type,
          addressLine1: addr.addressLine1.trim(),
          addressLine2: addr.addressLine2?.trim() || undefined,
          city: addr.city.trim(),
          state: addr.state.trim(),
          postalCode: addr.postalCode.trim(),
          country: addr.country.trim(),
          addressPhone: addr.addressPhone?.trim() || undefined,
          isDefault: !!addr.isDefault,
          deliveryInstructions: addr.deliveryInstructions?.trim() || undefined,
        })
        if (!aRes.success) setCreateError(aRes.error || 'Error al guardar una dirección')
      }
      for (const pay of createPayments) {
        if (!pay.label?.trim()) continue
        const pRes = await createPayment({
          userId,
          type: pay.type,
          label: pay.label.trim(),
          lastFourDigits: pay.lastFourDigits?.trim() || undefined,
          expiryDate: pay.expiryDate?.trim() || undefined,
          isDefault: !!pay.isDefault,
          isActive: true,
        })
        if (!pRes.success) setCreateError(pRes.error || 'Error al guardar una forma de pago')
      }
      handleCloseCreate()
      loadUsers()
    } finally {
      setCreateLoading(false)
    }
  }

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
    setSaveError(null)
  }

  const handleSaveUser = useCallback(async () => {
    if (!detailUser?.id) return
    if (!canEditCliente) {
      showDenied()
      return
    }
    setSaving(true)
    setSaveError(null)
    const result = await updateUser(detailUser.id, {
      companyName: editForm.companyName || undefined,
      rfc: editForm.rfc || undefined,
      phone: editForm.phone || undefined,
      role: editForm.role,
      isActive: editForm.isActive,
    })
    setSaving(false)
    if (result.success && result.data) {
      setDetailUser(result.data)
      setUsers((prev) => prev.map((u) => (u.id === result.data.id ? result.data : u)))
    } else {
      setSaveError(result.error || 'Error al guardar')
    }
  }, [detailUser, editForm, canEditCliente, showDenied])

  const searchLower = (search || '').toLowerCase().trim()
  const filtered =
    !searchLower
      ? users
      : users.filter(
          (u) =>
            (u.email && u.email.toLowerCase().includes(searchLower)) ||
            (u.firstName && u.firstName.toLowerCase().includes(searchLower)) ||
            (u.lastName && u.lastName.toLowerCase().includes(searchLower)) ||
            (u.companyName && u.companyName.toLowerCase().includes(searchLower))
        )

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
        <Typography
          variant="h4"
          sx={{
            color: '#424242',
            fontWeight: 'bold',
            marginBottom: { xs: '24px', sm: '28px', md: '32px' },
            fontSize: { xs: '24px', sm: '28px', md: '32px' },
          }}
        >
          Clientes
        </Typography>

        <Box sx={{ marginBottom: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Buscar por email, nombre o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: 280 }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
            Crear cliente
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Paper
          elevation={0}
          sx={{
            padding: 0,
            borderRadius: '12px',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600, width: 56 }} />
                    <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Empresa</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Rol</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Activo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Registro</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        {users.length === 0 ? 'No hay clientes.' : 'No hay coincidencias con la búsqueda.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((u) => (
                      <TableRow
                        key={u.id}
                        hover
                        onDoubleClick={() => handleRowDoubleClick(u.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell sx={{ py: 1 }}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              bgcolor: 'primary.main',
                              fontSize: '0.875rem',
                            }}
                          >
                            {getInitials(u)}
                          </Avatar>
                        </TableCell>
                        <TableCell>{u.email ?? '-'}</TableCell>
                        <TableCell>
                          {[u.firstName, u.lastName].filter(Boolean).join(' ') || '-'}
                        </TableCell>
                        <TableCell>{u.companyName ?? '-'}</TableCell>
                        <TableCell>{getRoleLabel(u.role)}</TableCell>
                        <TableCell>{u.isActive === false ? 'No' : 'Sí'}</TableCell>
                        <TableCell>{formatDate(u.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}>
          <ModalHeader
            title={detailUser ? [detailUser.firstName, detailUser.lastName].filter(Boolean).join(' ') || detailUser.email || 'Cliente' : 'Detalle del cliente'}
            onClose={handleCloseDetail}
          />
          <DialogContent dividers sx={{ minHeight: 480, height: 520, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {detailLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress />
              </Box>
            ) : detailUser ? (
              <>
                <Tabs value={detailTab} onChange={(_, v) => setDetailTab(v)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, flexShrink: 0 }}>
                  <Tab icon={<Person />} iconPosition="start" label="Datos personales" />
                  <Tab icon={<LocationOn />} iconPosition="start" label={`Direcciones (${clientAddresses.length})`} />
                  <Tab icon={<ShoppingCart />} iconPosition="start" label={`Pedidos (${clientOrders.length})`} />
                  <Tab icon={<CreditCard />} iconPosition="start" label={`Formas de pago (${clientPayments.length})`} />
                  <Tab icon={<AssignmentReturn />} iconPosition="start" label={`Devoluciones (${clientRefunds.length})`} />
                </Tabs>
                <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                {detailTab === 0 && (
                  <Stack spacing={2}>
                    <Typography variant="subtitle2" color="text.secondary">Información editable</Typography>
                    <TextField label="Empresa" size="small" fullWidth value={editForm.companyName} onChange={(e) => handleEditChange('companyName', e.target.value)} disabled={!canEditCliente} />
                    <TextField label="RFC" size="small" fullWidth value={editForm.rfc} onChange={(e) => handleEditChange('rfc', e.target.value)} disabled={!canEditCliente} />
                    <TextField label="Teléfono" size="small" fullWidth value={editForm.phone} onChange={(e) => handleEditChange('phone', e.target.value)} disabled={!canEditCliente} />
                    <FormControl size="small" fullWidth disabled={!canEditCliente}>
                      <InputLabel id="client-role-label">Rol</InputLabel>
                      <Select labelId="client-role-label" label="Rol" value={editForm.role} onChange={(e) => handleEditChange('role', e.target.value)}>
                        {ROLE_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
                      </Select>
                    </FormControl>
                    <FormControlLabel control={<Switch checked={editForm.isActive} onChange={(e) => handleEditChange('isActive', e.target.checked)} color="primary" disabled={!canEditCliente} />} label="Cliente activo" disabled={!canEditCliente} />
                    <Typography variant="subtitle2" color="text.secondary" sx={{ pt: 1 }}>Información de cuenta</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 0.5, alignItems: 'baseline' }}>
                      <Typography variant="caption" color="text.secondary">Email</Typography>
                      <Typography variant="body2">{detailUser.email ?? '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">Nombre</Typography>
                      <Typography variant="body2">{[detailUser.firstName, detailUser.lastName].filter(Boolean).join(' ') || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">Fecha de registro</Typography>
                      <Typography variant="body2">{formatDateTime(detailUser.createdAt)}</Typography>
                      {detailUser.updatedAt && (
                        <>
                          <Typography variant="caption" color="text.secondary">Última actualización</Typography>
                          <Typography variant="body2">{formatDateTime(detailUser.updatedAt)}</Typography>
                        </>
                      )}
                    </Box>
                    {saveError && <Alert severity="error" onClose={() => setSaveError(null)}>{saveError}</Alert>}
                  </Stack>
                )}

                {detailTab === 1 && (
                  <Stack spacing={2}>
                    {clientAddresses.length === 0 ? (
                      <Typography color="text.secondary">No hay direcciones registradas.</Typography>
                    ) : (
                      clientAddresses.map((addr) => (
                        <Card key={addr.id} variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="subtitle2">{formatAddressType(addr.type)}</Typography>
                              {addr.isDefault && <Chip size="small" label="Por defecto" color="primary" />}
                            </Box>
                            <Typography variant="body2">
                              {[addr.addressLine1, addr.addressLine2].filter(Boolean).join(', ')}
                            </Typography>
                            <Typography variant="body2">
                              {[addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')} {addr.country || ''}
                            </Typography>
                            {addr.addressPhone && <Typography variant="caption" color="text.secondary">Tel: {addr.addressPhone}</Typography>}
                            {addr.deliveryInstructions && <Typography variant="caption" display="block" color="text.secondary">{addr.deliveryInstructions}</Typography>}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Stack>
                )}

                {detailTab === 2 && (
                  <Stack spacing={2}>
                    {clientOrders.length === 0 ? (
                      <Typography color="text.secondary">No hay pedidos.</Typography>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: 'grey.100' }}>
                              <TableCell sx={{ fontWeight: 600 }}>Orden</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {clientOrders.map((ord) => (
                              <TableRow key={ord.id}>
                                <TableCell>{ord.orderNumber ?? ord.id?.slice(0, 8) ?? '—'}</TableCell>
                                <TableCell>{formatDateTime(ord.createdAt)}</TableCell>
                                <TableCell><Chip size="small" label={getOrderStatusLabel(ord.status)} color={ord.status === 'cancelled' || ord.status === 'refunded' ? 'error' : 'default'} /></TableCell>
                                <TableCell align="right">{formatCurrency(ord.totalAmount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Stack>
                )}

                {detailTab === 3 && (
                  <Stack spacing={2}>
                    {clientPayments.length === 0 ? (
                      <Typography color="text.secondary">No hay formas de pago registradas.</Typography>
                    ) : (
                      clientPayments.map((pay) => (
                        <Card key={pay.id} variant="outlined">
                          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                              <Typography variant="subtitle2">{pay.label ?? formatPaymentType(pay.type)}</Typography>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {pay.isDefault && <Chip size="small" label="Por defecto" color="primary" />}
                                {!pay.isActive && <Chip size="small" label="Inactivo" variant="outlined" />}
                              </Box>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {formatPaymentType(pay.type)}
                              {pay.lastFourDigits ? ` •••• ${pay.lastFourDigits}` : ''}
                              {pay.expiryDate ? ` • Vence ${pay.expiryDate}` : ''}
                            </Typography>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </Stack>
                )}

                {detailTab === 4 && (
                  <Stack spacing={2}>
                    {clientRefunds.length === 0 ? (
                      <Typography color="text.secondary">No hay devoluciones (pedidos reembolsados).</Typography>
                    ) : (
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow sx={{ backgroundColor: 'grey.100' }}>
                              <TableCell sx={{ fontWeight: 600 }}>Orden</TableCell>
                              <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                              <TableCell sx={{ fontWeight: 600 }} align="right">Monto reembolsado</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {clientRefunds.map((ord) => (
                              <TableRow key={ord.id}>
                                <TableCell>{ord.orderNumber ?? ord.id?.slice(0, 8) ?? '—'}</TableCell>
                                <TableCell>{formatDateTime(ord.createdAt)}</TableCell>
                                <TableCell align="right">{formatCurrency(ord.totalAmount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </Stack>
                )}
                </Box>
              </>
            ) : (
              <Typography color="text.secondary">No se pudo cargar el cliente.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetail}>Cerrar</Button>
            {detailUser && canEditCliente && (
              <Button variant="contained" onClick={handleSaveUser} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}>
          <ModalHeader title="Crear cliente" onClose={handleCloseCreate} />
          <DialogContent>
            <Stepper activeStep={createStep} sx={{ pt: 2, pb: 3 }}>
              <Step><StepLabel>Datos personales</StepLabel></Step>
              <Step><StepLabel>Direcciones</StepLabel></Step>
              <Step><StepLabel>Formas de pago</StepLabel></Step>
            </Stepper>

            {createStep === 0 && (
              <Stack spacing={2}>
                <Typography variant="subtitle2" color="text.secondary">Información del cliente</Typography>
                <TextField label="Email" type="email" size="small" fullWidth required value={createForm.email} onChange={(e) => handleCreateChange('email', e.target.value)} />
                <TextField label="Contraseña" type="password" size="small" fullWidth required value={createForm.passwordHash} onChange={(e) => handleCreateChange('passwordHash', e.target.value)} />
                <TextField label="Nombre" size="small" fullWidth value={createForm.firstName} onChange={(e) => handleCreateChange('firstName', e.target.value)} />
                <TextField label="Apellido" size="small" fullWidth value={createForm.lastName} onChange={(e) => handleCreateChange('lastName', e.target.value)} />
                <TextField label="Empresa" size="small" fullWidth value={createForm.companyName} onChange={(e) => handleCreateChange('companyName', e.target.value)} />
                <TextField label="RFC" size="small" fullWidth value={createForm.rfc} onChange={(e) => handleCreateChange('rfc', e.target.value)} />
                <TextField label="Teléfono" size="small" fullWidth value={createForm.phone} onChange={(e) => handleCreateChange('phone', e.target.value)} />
              </Stack>
            )}

            {createStep === 1 && (
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">Direcciones (opcional)</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={handleAddAddress}>Agregar dirección</Button>
                </Box>
                {createAddresses.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No hay direcciones. Puedes agregar al menos una o continuar sin ellas.</Typography>
                )}
                {createAddresses.map((addr, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">Dirección {index + 1}</Typography>
                        <IconButton size="small" onClick={() => handleRemoveAddress(index)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                      <Stack spacing={1.5}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Tipo</InputLabel>
                          <Select label="Tipo" value={addr.type} onChange={(e) => handleAddressChange(index, 'type', e.target.value)}>
                            {ADDRESS_TYPE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <TextField size="small" fullWidth label="Calle y número" required value={addr.addressLine1} onChange={(e) => handleAddressChange(index, 'addressLine1', e.target.value)} />
                        <TextField size="small" fullWidth label="Referencias" value={addr.addressLine2} onChange={(e) => handleAddressChange(index, 'addressLine2', e.target.value)} />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField size="small" fullWidth label="Ciudad" required value={addr.city} onChange={(e) => handleAddressChange(index, 'city', e.target.value)} />
                          <TextField size="small" fullWidth label="Estado" required value={addr.state} onChange={(e) => handleAddressChange(index, 'state', e.target.value)} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField size="small" fullWidth label="Código postal" required value={addr.postalCode} onChange={(e) => handleAddressChange(index, 'postalCode', e.target.value)} />
                          <TextField size="small" fullWidth label="País" required value={addr.country} onChange={(e) => handleAddressChange(index, 'country', e.target.value)} />
                        </Box>
                        <TextField size="small" fullWidth label="Teléfono del domicilio" value={addr.addressPhone} onChange={(e) => handleAddressChange(index, 'addressPhone', e.target.value)} />
                        <TextField size="small" fullWidth label="Instrucciones de entrega" value={addr.deliveryInstructions} onChange={(e) => handleAddressChange(index, 'deliveryInstructions', e.target.value)} />
                        <FormControlLabel control={<Switch size="small" checked={!!addr.isDefault} onChange={(e) => handleAddressChange(index, 'isDefault', e.target.checked)} />} label="Predeterminada" />
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            {createStep === 2 && (
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" color="text.secondary">Formas de pago (opcional)</Typography>
                  <Button size="small" startIcon={<AddIcon />} onClick={handleAddPayment}>Agregar forma de pago</Button>
                </Box>
                {createPayments.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No hay formas de pago. Puedes agregar al menos una o continuar sin ellas.</Typography>
                )}
                {createPayments.map((pay, index) => (
                  <Card key={index} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2">Método de pago {index + 1}</Typography>
                        <IconButton size="small" onClick={() => handleRemovePayment(index)}><DeleteIcon fontSize="small" /></IconButton>
                      </Box>
                      <Stack spacing={1.5}>
                        <FormControl size="small" fullWidth>
                          <InputLabel>Tipo</InputLabel>
                          <Select label="Tipo" value={pay.type} onChange={(e) => handlePaymentChange(index, 'type', e.target.value)}>
                            {PAYMENT_TYPE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <TextField size="small" fullWidth label="Etiqueta (ej: Visa ****1234)" required value={pay.label} onChange={(e) => handlePaymentChange(index, 'label', e.target.value)} />
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <TextField size="small" label="Últimos 4 dígitos" value={pay.lastFourDigits} onChange={(e) => handlePaymentChange(index, 'lastFourDigits', e.target.value.replace(/\D/g, '').slice(0, 4))} inputProps={{ maxLength: 4 }} />
                          <TextField size="small" label="Vencimiento (MM/AA)" placeholder="12/28" value={pay.expiryDate} onChange={(e) => handlePaymentChange(index, 'expiryDate', e.target.value)} />
                        </Box>
                        <FormControlLabel control={<Switch size="small" checked={!!pay.isDefault} onChange={(e) => handlePaymentChange(index, 'isDefault', e.target.checked)} />} label="Predeterminado" />
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}

            {createError && <Alert severity="error" onClose={() => setCreateError(null)} sx={{ mt: 2 }}>{createError}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreate}>Cancelar</Button>
            <Box sx={{ flex: 1 }} />
            {createStep > 0 && <Button onClick={handleCreateBack}>Atrás</Button>}
            {createStep < 2 ? (
              <Button variant="contained" onClick={handleCreateNext}>Siguiente</Button>
            ) : (
              <Button variant="contained" onClick={handleSubmitCreate} disabled={createLoading}>
                {createLoading ? 'Creando…' : 'Crear cliente'}
              </Button>
            )}
          </DialogActions>
        </Dialog>
        {permissionDeniedSnackbar}
      </Box>
    </Box>
  )
}

export default Clientes
