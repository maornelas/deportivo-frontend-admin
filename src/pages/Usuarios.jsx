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
  FormHelperText,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Snackbar,
} from '@mui/material'
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility,
  VisibilityOff,
  CheckCircle,
  RadioButtonUnchecked,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import PageTitle from '../components/PageTitle'
import ModalHeader from '../components/ModalHeader'
import { getUsers, getUserById, updateUser, createUser, deleteUser } from '../api/user'
import { getRoles as getRbacRoles } from '../api/rbac'
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

/** Política: más de 8 caracteres, al menos un número, una minúscula y una mayúscula */
function getPasswordPolicyState(password) {
  const p = password || ''
  return {
    lengthOver8: p.length > 8,
    hasNumber: /\d/.test(p),
    hasLowercase: /[a-z]/.test(p),
    hasUppercase: /[A-Z]/.test(p),
  }
}

function passwordMeetsPolicy(password) {
  const s = getPasswordPolicyState(password)
  return s.lengthOver8 && s.hasNumber && s.hasLowercase && s.hasUppercase
}

const Usuarios = () => {
  const { canDoAction } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailUser, setDetailUser] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [editForm, setEditForm] = useState({
    companyName: '',
    rfc: '',
    phone: '',
    role: 'customer',
    isActive: true,
    adminRoleId: '',
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    passwordHash: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    rfc: '',
    phone: '',
    /** UUID del rol en tabla `roles` (RBAC) */
    createRoleSelection: '',
  })
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState(null)
  const [showCreatePassword, setShowCreatePassword] = useState(false)
  const [showCreatePasswordConfirm, setShowCreatePasswordConfirm] = useState(false)
  const [rbacRoles, setRbacRoles] = useState([])

  const loadUsers = useCallback(async (opts = {}) => {
    const silent = opts.silent === true
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    const result = await getUsers({ activeOnly: false, excludeRole: 'customer' })
    if (!silent) setLoading(false)
    if (result.success && Array.isArray(result.data)) {
      setUsers(result.data)
      return true
    }
    if (!silent) {
      setError(result.error || 'Error al cargar usuarios')
      setUsers([])
    }
    return false
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    getRbacRoles().then((r) => {
      if (r.success && Array.isArray(r.data)) setRbacRoles(r.data)
    })
  }, [])

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
        adminRoleId: u.adminRoleId ?? '',
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
    if (!canDoAction(ACTION.USUARIOS_EDITAR)) {
      showDenied()
      return
    }
    if (!detailUser?.id) return
    setSaving(true)
    setSaveError(null)
    const payload = {
      companyName: editForm.companyName || undefined,
      rfc: editForm.rfc || undefined,
      phone: editForm.phone || undefined,
      role: editForm.role,
      isActive: editForm.isActive,
    }
    if (editForm.role === 'admin' || editForm.role === 'moderator') {
      payload.adminRoleId = editForm.adminRoleId ? editForm.adminRoleId : null
    }
    const result = await updateUser(detailUser.id, payload)
    setSaving(false)
    if (result.success && result.data) {
      setDetailUser(result.data)
      setUsers((prev) => prev.map((u) => (u.id === result.data.id ? result.data : u)))
      setSnackbar({
        open: true,
        message: 'Usuario actualizado correctamente.',
        severity: 'success',
      })
    } else {
      setSaveError(result.error || 'Error al guardar')
    }
  }, [detailUser, editForm, canDoAction, showDenied])

  const handleDeleteUser = useCallback(async () => {
    if (!canDoAction(ACTION.USUARIOS_ELIMINAR)) {
      showDenied()
      return
    }
    if (!detailUser?.id) return
    if (
      !window.confirm(
        `¿Eliminar definitivamente al usuario "${detailUser.email}"? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }
    setDeleting(true)
    setSaveError(null)
    const id = detailUser.id
    const result = await deleteUser(id)
    setDeleting(false)
    if (result.success) {
      handleCloseDetail()
      setUsers((prev) => prev.filter((u) => u.id !== id))
      setSnackbar({
        open: true,
        message: 'Usuario eliminado correctamente.',
        severity: 'success',
      })
    } else {
      setSaveError(result.error || 'No se pudo eliminar el usuario')
    }
  }, [detailUser, canDoAction, showDenied])

  const handleOpenCreate = () => {
    if (!canDoAction(ACTION.USUARIOS_CREAR)) {
      showDenied()
      return
    }
    setCreateOpen(true)
    const defaultRbac = rbacRoles.length > 0 ? rbacRoles[0].id : ''
    setCreateForm({
      email: '',
      passwordHash: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      companyName: '',
      rfc: '',
      phone: '',
      createRoleSelection: defaultRbac,
    })
    setShowCreatePassword(false)
    setShowCreatePasswordConfirm(false)
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
    if (!canDoAction(ACTION.USUARIOS_CREAR)) {
      showDenied()
      return
    }
    if (!createForm.email?.trim()) {
      setCreateError('El email es obligatorio.')
      return
    }
    if (!createForm.passwordHash?.trim()) {
      setCreateError('La contraseña es obligatoria.')
      return
    }
    if (!passwordMeetsPolicy(createForm.passwordHash)) {
      setCreateError(
        'La contraseña debe tener más de 8 caracteres e incluir al menos un número, una minúscula y una mayúscula.',
      )
      return
    }
    if (createForm.passwordHash !== createForm.confirmPassword) {
      setCreateError('La confirmación de contraseña no coincide.')
      return
    }
    const roleId = (createForm.createRoleSelection || '').trim()
    if (!roleId) {
      setCreateError('Selecciona un rol. Si no hay opciones, crea uno en Roles y permisos.')
      return
    }
    const rbacRole = rbacRoles.find((r) => r.id === roleId)
    if (!rbacRole) {
      setCreateError('El rol seleccionado ya no existe. Vuelve a elegir uno.')
      return
    }
    const slug = (rbacRole.slug || '').toLowerCase()
    let role = 'admin'
    let adminRoleId = roleId
    if (slug === 'customer') {
      role = 'customer'
      adminRoleId = undefined
    } else if (slug === 'moderator') {
      role = 'moderator'
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
      role,
      ...(adminRoleId ? { adminRoleId } : {}),
    })
    setCreateLoading(false)
    if (result.success) {
      const created = result.data
      handleCloseCreate()
      const refreshed = await loadUsers({ silent: true })
      if (
        !refreshed &&
        created?.id &&
        (created.role === 'admin' || created.role === 'moderator')
      ) {
        setUsers((prev) => (prev.some((u) => u.id === created.id) ? prev : [created, ...prev]))
      }
      setSnackbar({
        open: true,
        message: refreshed
          ? 'Usuario creado correctamente.'
          : 'Usuario creado. No se pudo refrescar la lista; recarga la página si no ves los cambios.',
        severity: refreshed ? 'success' : 'warning',
      })
    } else {
      setCreateError(result.error || 'Error al crear usuario')
    }
  }

  const rowRoleDisplay = (u) => {
    if (!u) return '-'
    if (u.role === 'customer') return 'Cliente'
    if (u.role === 'moderator' && !u.adminRoleId) return 'Moderador'
    if (u.role === 'moderator' && u.adminRoleId) {
      const r = rbacRoles.find((x) => x.id === u.adminRoleId)
      return r ? `Moderador · ${r.name}` : 'Moderador'
    }
    if (u.role === 'admin' && u.adminRoleId) {
      const r = rbacRoles.find((x) => x.id === u.adminRoleId)
      return r ? r.name : 'Admin'
    }
    return getRoleLabel(u.role)
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

  const createPwdPolicy = getPasswordPolicyState(createForm.passwordHash)
  const createPwdPolicyRows = [
    { ok: createPwdPolicy.lengthOver8, label: 'Más de 8 caracteres' },
    { ok: createPwdPolicy.hasNumber, label: 'Al menos un número' },
    { ok: createPwdPolicy.hasLowercase, label: 'Al menos una letra minúscula' },
    { ok: createPwdPolicy.hasUppercase, label: 'Al menos una letra mayúscula' },
  ]
  const confirmPwdMismatch =
    Boolean(createForm.confirmPassword) && createForm.passwordHash !== createForm.confirmPassword

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
          bgcolor: 'background.default',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={handleMenuClick} />
        <PageTitle>Usuarios</PageTitle>

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
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
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
                        <TableCell>{rowRoleDisplay(u)}</TableCell>
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

        <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}>
          <ModalHeader title="Detalle del usuario" onClose={handleCloseDetail} />
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
                {(editForm.role === 'admin' || editForm.role === 'moderator') && (
                  <FormControl size="small" fullWidth>
                    <InputLabel id="user-admin-rbac-label">Rol del panel (permisos)</InputLabel>
                    <Select
                      labelId="user-admin-rbac-label"
                      label="Rol del panel (permisos)"
                      value={editForm.adminRoleId || ''}
                      onChange={(e) => handleEditChange('adminRoleId', e.target.value)}
                    >
                      <MenuItem value="">
                        <em>Sin asignar — acceso total (solo admin legacy)</em>
                      </MenuItem>
                      {rbacRoles.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.name}
                          {r.isSystem ? ' (sistema)' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
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
          <DialogActions
            sx={{
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
            }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button onClick={handleCloseDetail}>Cerrar</Button>
              {detailUser && (
                <Button
                  color="error"
                  variant="outlined"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteUser}
                  disabled={saving || deleting}
                >
                  {deleting ? 'Eliminando…' : 'Eliminar'}
                </Button>
              )}
            </Box>
            {detailUser && (
              <Button variant="contained" onClick={handleSaveUser} disabled={saving || deleting}>
                {saving ? 'Guardando…' : 'Guardar'}
              </Button>
            )}
          </DialogActions>
        </Dialog>

        <Dialog open={createOpen} onClose={handleCloseCreate} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}>
          <ModalHeader title="Crear usuario" onClose={handleCloseCreate} />
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                  gap: 2,
                  alignItems: 'start',
                }}
              >
                <TextField
                  label="Email"
                  type="email"
                  size="small"
                  fullWidth
                  required
                  value={createForm.email}
                  onChange={(e) => handleCreateChange('email', e.target.value)}
                  sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}
                />
                <TextField
                  label="Nombre"
                  size="small"
                  fullWidth
                  value={createForm.firstName}
                  onChange={(e) => handleCreateChange('firstName', e.target.value)}
                />
                <TextField
                  label="Apellido"
                  size="small"
                  fullWidth
                  value={createForm.lastName}
                  onChange={(e) => handleCreateChange('lastName', e.target.value)}
                />
                <TextField
                  label="Empresa"
                  size="small"
                  fullWidth
                  value={createForm.companyName}
                  onChange={(e) => handleCreateChange('companyName', e.target.value)}
                />
                <TextField
                  label="RFC"
                  size="small"
                  fullWidth
                  value={createForm.rfc}
                  onChange={(e) => handleCreateChange('rfc', e.target.value)}
                />
                <TextField
                  label="Teléfono"
                  size="small"
                  fullWidth
                  value={createForm.phone}
                  onChange={(e) => handleCreateChange('phone', e.target.value)}
                />
                <FormControl size="small" fullWidth>
                  <InputLabel id="create-role-label">Rol</InputLabel>
                  <Select
                    labelId="create-role-label"
                    label="Rol"
                    value={createForm.createRoleSelection}
                    onChange={(e) => handleCreateChange('createRoleSelection', e.target.value)}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected) return <em>Selecciona un rol</em>
                      const r = rbacRoles.find((x) => x.id === selected)
                      return r ? `${r.name}${r.isSystem ? ' (sistema)' : ''}` : selected
                    }}
                  >
                    {rbacRoles.length === 0 ? (
                      <MenuItem value="" disabled>
                        No hay roles. Crea uno en Roles y permisos.
                      </MenuItem>
                    ) : (
                      rbacRoles.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.name}
                          {r.isSystem ? ' (sistema)' : ''}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {rbacRoles.length === 0 && (
                    <FormHelperText>
                      Crea al menos un rol en «Roles y permisos» para poder asignarlo aquí.
                    </FormHelperText>
                  )}
                </FormControl>

                <TextField
                  label="Contraseña"
                  type={showCreatePassword ? 'text' : 'password'}
                  size="small"
                  fullWidth
                  required
                  autoComplete="new-password"
                  value={createForm.passwordHash}
                  onChange={(e) => handleCreateChange('passwordHash', e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showCreatePassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                          onClick={() => setShowCreatePassword((v) => !v)}
                          edge="end"
                          size="small"
                        >
                          {showCreatePassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label="Confirmar contraseña"
                  type={showCreatePasswordConfirm ? 'text' : 'password'}
                  size="small"
                  fullWidth
                  required
                  autoComplete="new-password"
                  value={createForm.confirmPassword}
                  onChange={(e) => handleCreateChange('confirmPassword', e.target.value)}
                  error={confirmPwdMismatch}
                  helperText={confirmPwdMismatch ? 'Las contraseñas no coinciden' : undefined}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={showCreatePasswordConfirm ? 'Ocultar contraseña' : 'Ver contraseña'}
                          onClick={() => setShowCreatePasswordConfirm((v) => !v)}
                          edge="end"
                          size="small"
                        >
                          {showCreatePasswordConfirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 1 }}>
                    Requisitos de la contraseña
                  </Typography>
                  <Stack spacing={0.75}>
                    {createPwdPolicyRows.map(({ ok, label }) => (
                      <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {ok ? (
                          <CheckCircle sx={{ fontSize: 20, color: 'success.main', flexShrink: 0 }} />
                        ) : (
                          <RadioButtonUnchecked sx={{ fontSize: 20, color: 'action.disabled', flexShrink: 0 }} />
                        )}
                        <Typography variant="body2" sx={{ color: ok ? 'success.dark' : 'text.secondary' }}>
                          {label}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Box>

              {createError && (
                <Alert severity="error" onClose={() => setCreateError(null)}>
                  {createError}
                </Alert>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCreate}>Cancelar</Button>
            <Button variant="contained" onClick={handleSubmitCreate} disabled={createLoading}>
              {createLoading ? 'Creando…' : 'Crear'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={(_, reason) => {
            if (reason === 'clickaway') return
            setSnackbar((s) => ({ ...s, open: false }))
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ mt: { xs: 1, md: 9 } }}
        >
          <Alert
            severity={snackbar.severity}
            variant="filled"
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
            sx={{ width: '100%', boxShadow: 3 }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        {permissionDeniedSnackbar}
      </Box>
    </Box>
  )
}

export default Usuarios
