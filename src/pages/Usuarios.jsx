import { useState, useEffect, useCallback } from 'react'
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
  DialogTitle,
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
} from '@mui/material'
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { getUsers, getUserById, updateUser, createUser } from '../api/user'

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

const Usuarios = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUser, setDetailUser] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [editForm, setEditForm] = useState({ companyName: '', rfc: '', phone: '', role: 'customer', isActive: true })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    passwordHash: '',
    firstName: '',
    lastName: '',
    companyName: '',
    rfc: '',
    phone: '',
    role: 'admin',
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await getUsers({ activeOnly: false, excludeRole: 'customer' })
    setLoading(false)
    if (result.success && Array.isArray(result.data)) {
      setUsers(result.data)
    } else {
      setError(result.error || 'Error al cargar usuarios')
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
    setSaveError(null)
    setDetailLoading(true)
    const result = await getUserById(userId)
    setDetailLoading(false)
    if (result.success && result.data) {
      const u = result.data
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
  }, [])

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setDetailUser(null)
    setSaveError(null)
  }

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
    setSaveError(null)
  }

  const handleSaveUser = useCallback(async () => {
    if (!detailUser?.id) return
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
  }, [detailUser, editForm])

  const handleOpenCreate = () => {
    setCreateOpen(true)
    setCreateForm({
      email: '',
      passwordHash: '',
      firstName: '',
      lastName: '',
      companyName: '',
      rfc: '',
      phone: '',
      role: 'admin',
    })
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

  const handleSubmitCreate = async () => {
    if (!createForm.email?.trim() || !createForm.passwordHash?.trim()) {
      setCreateError('Email y contraseña son obligatorios.')
      return
    }
    setCreateLoading(true)
    setCreateError(null)
    const result = await createUser({
      email: createForm.email.trim(),
      passwordHash: createForm.passwordHash,
      firstName: createForm.firstName?.trim() || undefined,
      lastName: createForm.lastName?.trim() || undefined,
      companyName: createForm.companyName?.trim() || undefined,
      rfc: createForm.rfc?.trim() || undefined,
      phone: createForm.phone?.trim() || undefined,
      role: createForm.role,
    })
    setCreateLoading(false)
    if (result.success) {
      handleCloseCreate()
      loadUsers()
    } else {
      setCreateError(result.error || 'Error al crear usuario')
    }
  }

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
        <Typography
          variant="h4"
          sx={{
            color: '#424242',
            fontWeight: 'bold',
            marginBottom: { xs: '24px', sm: '28px', md: '32px' },
            fontSize: { xs: '24px', sm: '28px', md: '32px' },
          }}
        >
          Usuarios
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
            Crear usuario
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
                        {users.length === 0 ? 'No hay usuarios.' : 'No hay coincidencias con la búsqueda.'}
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

        <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="sm" fullWidth>
          <DialogTitle>Detalle del usuario</DialogTitle>
          <DialogContent>
            {detailLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : detailUser ? (
              <Stack spacing={2} sx={{ pt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 1 }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: 'primary.main',
                      fontSize: '1.25rem',
                    }}
                  >
                    {getInitials(detailUser)}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {[detailUser.firstName, detailUser.lastName].filter(Boolean).join(' ') || '—'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {detailUser.email ?? '—'}
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  label="Empresa"
                  size="small"
                  fullWidth
                  value={editForm.companyName}
                  onChange={(e) => handleEditChange('companyName', e.target.value)}
                />
                <TextField
                  label="RFC"
                  size="small"
                  fullWidth
                  value={editForm.rfc}
                  onChange={(e) => handleEditChange('rfc', e.target.value)}
                />
                <TextField
                  label="Teléfono"
                  size="small"
                  fullWidth
                  value={editForm.phone}
                  onChange={(e) => handleEditChange('phone', e.target.value)}
                />
                <FormControl size="small" fullWidth>
                  <InputLabel id="user-role-label">Rol</InputLabel>
                  <Select
                    labelId="user-role-label"
                    label="Rol"
                    value={editForm.role}
                    onChange={(e) => handleEditChange('role', e.target.value)}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editForm.isActive}
                      onChange={(e) => handleEditChange('isActive', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Usuario activo"
                />

                <Box sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 0.5, alignItems: 'baseline', pt: 1 }}>
                  <Typography variant="caption" color="text.secondary">Fecha de registro</Typography>
                  <Typography variant="body2">{formatDateTime(detailUser.createdAt)}</Typography>
                  {detailUser.updatedAt && (
                    <>
                      <Typography variant="caption" color="text.secondary">Última actualización</Typography>
                      <Typography variant="body2">{formatDateTime(detailUser.updatedAt)}</Typography>
                    </>
                  )}
                </Box>

                {saveError && (
                  <Alert severity="error" onClose={() => setSaveError(null)}>
                    {saveError}
                  </Alert>
                )}
              </Stack>
            ) : (
              <Typography color="text.secondary">No se pudo cargar el usuario.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDetail}>Cerrar</Button>
            {detailUser && (
              <Button
                variant="contained"
                onClick={handleSaveUser}
                disabled={saving}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="sm" fullWidth>
          <DialogTitle>Crear usuario</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                label="Email"
                type="email"
                size="small"
                fullWidth
                required
                value={createForm.email}
                onChange={(e) => handleCreateChange('email', e.target.value)}
              />
              <TextField
                label="Contraseña"
                type="password"
                size="small"
                fullWidth
                required
                value={createForm.passwordHash}
                onChange={(e) => handleCreateChange('passwordHash', e.target.value)}
              />
              <TextField label="Nombre" size="small" fullWidth value={createForm.firstName} onChange={(e) => handleCreateChange('firstName', e.target.value)} />
              <TextField label="Apellido" size="small" fullWidth value={createForm.lastName} onChange={(e) => handleCreateChange('lastName', e.target.value)} />
              <TextField label="Empresa" size="small" fullWidth value={createForm.companyName} onChange={(e) => handleCreateChange('companyName', e.target.value)} />
              <TextField label="RFC" size="small" fullWidth value={createForm.rfc} onChange={(e) => handleCreateChange('rfc', e.target.value)} />
              <TextField label="Teléfono" size="small" fullWidth value={createForm.phone} onChange={(e) => handleCreateChange('phone', e.target.value)} />
              <FormControl size="small" fullWidth>
                <InputLabel id="create-role-label">Rol</InputLabel>
                <Select
                  labelId="create-role-label"
                  label="Rol"
                  value={createForm.role}
                  onChange={(e) => handleCreateChange('role', e.target.value)}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {createError && <Alert severity="error" onClose={() => setCreateError(null)}>{createError}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreate}>Cancelar</Button>
            <Button variant="contained" onClick={handleSubmitCreate} disabled={createLoading}>
              {createLoading ? 'Creando…' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

export default Usuarios
