import { useState, useEffect, useCallback, useMemo } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItemButton,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  TextField,
  Chip,
  Snackbar,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Inventory as InventoryIcon,
  PointOfSale as VentasIcon,
  ShoppingCart as ComprasIcon,
  MoneyOff as GastosIcon,
  RequestQuote as CotizacionIcon,
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  Assessment as ReporteriaIcon,
  LocalShipping as RepartidorSectionIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  MenuBook as CatalogosIcon,
  AdminPanelSettings as RolesIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ModalHeader from '../components/ModalHeader'
import { useAuth } from '../contexts/AuthContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'
import { getPermissionsCatalog, getRoles, getRoleById, createRole, deleteRole, setRolePermissions } from '../api/rbac'

const SECTIONS = [
  { key: 'inventario', label: 'Inventario', moduleCode: 'module.inventario', Icon: InventoryIcon },
  { key: 'cotizaciones', label: 'Cotizaciones', moduleCode: 'module.cotizaciones', Icon: CotizacionIcon },
  { key: 'ventas', label: 'Ventas', moduleCode: 'module.ventas', Icon: VentasIcon },
  { key: 'compras', label: 'Compras', moduleCode: 'module.compras', Icon: ComprasIcon },
  { key: 'gastos', label: 'Gastos', moduleCode: 'module.gastos', Icon: GastosIcon },
  { key: 'historial', label: 'Historial', moduleCode: 'module.historial', Icon: HistoryIcon },
  { key: 'notificaciones', label: 'Notificaciones', moduleCode: 'module.notificaciones', Icon: NotificationsIcon },
  { key: 'reporteria', label: 'Reportería', moduleCode: 'module.reporteria', Icon: ReporteriaIcon },
  { key: 'repartidor', label: 'Repartidor', moduleCode: 'module.repartidor', Icon: RepartidorSectionIcon },
  { key: 'clientes', label: 'Clientes', moduleCode: 'module.clientes', Icon: PeopleIcon },
  { key: 'usuarios', label: 'Usuarios', moduleCode: 'module.usuarios', Icon: GroupIcon },
  { key: 'catalogos', label: 'Catálogos', moduleCode: 'module.catalogos', Icon: CatalogosIcon },
  { key: 'roles', label: 'Roles y permisos', moduleCode: 'module.roles', Icon: RolesIcon },
]

const ACCESS_OPTIONS = [
  { value: 'none', label: 'Ocultar' },
  { value: 'read', label: 'Solo lectura' },
  { value: 'write', label: 'Lectura y escritura' },
]

export default function Roles() {
  const { user, canWritePath, canDoAction } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()
  const canEdit = canWritePath('/roles')
  /** Super Administrador: puede editar permisos de roles de sistema */
  const hasFullAccess = Boolean(user?.rbac?.fullAccess)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [roles, setRoles] = useState([])
  const [catalog, setCatalog] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detail, setDetail] = useState(null)
  const [accessMap, setAccessMap] = useState({})
  const [saveMsg, setSaveMsg] = useState({ type: '', text: '' })
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  const [savePermissionsLoading, setSavePermissionsLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    setError('')
    const [r1, r2] = await Promise.all([getRoles(), getPermissionsCatalog()])
    setLoading(false)
    if (!r1.success) return setError(r1.error || 'Error al cargar roles')
    if (!r2.success) return setError(r2.error || 'Error al cargar permisos')
    setRoles(r1.data || [])
    setCatalog(r2.data || [])
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  /** Solo permisos de módulo (module.*), en el orden de SECTIONS */
  const modulePermissionsRows = useMemo(() => {
    const byCode = Object.fromEntries((catalog || []).filter((p) => p?.code).map((p) => [p.code, p]))
    return SECTIONS.map((s) => ({
      key: s.key,
      label: s.label,
      moduleCode: s.moduleCode,
      Icon: s.Icon,
      permission: byCode[s.moduleCode] || null,
    }))
  }, [catalog])

  const loadDetail = useCallback(
    async (id) => {
      if (!id) return
      setDetailLoading(true)
      setSaveMsg({ type: '', text: '' })
      const res = await getRoleById(id)
      setDetailLoading(false)
      if (!res.success || !res.data) {
        setDetail(null)
        setAccessMap({})
        return
      }
      setDetail(res.data)
      const next = {}
      for (const row of modulePermissionsRows) {
        if (row.permission) next[row.permission.id] = 'none'
      }
      for (const g of res.data.grants || []) {
        if (next[g.permissionId] !== undefined) {
          next[g.permissionId] = g.accessLevel === 'write' ? 'write' : 'read'
        }
      }
      setAccessMap(next)
    },
    [modulePermissionsRows],
  )

  useEffect(() => {
    if (selectedId && modulePermissionsRows.some((r) => r.permission)) loadDetail(selectedId)
  }, [selectedId, modulePermissionsRows, loadDetail])

  const permissionsLocked = (isSystem) => isSystem && !hasFullAccess

  const handleSavePermissions = async () => {
    if (!detail || permissionsLocked(detail.isSystem) || !canEdit) return
    if (!canDoAction(ACTION.ROLES_GUARDAR_PERMISOS)) {
      showDenied()
      return
    }
    const grants = modulePermissionsRows
      .filter((r) => r.permission)
      .map((r) => ({ permissionId: r.permission.id, accessLevel: accessMap[r.permission.id] || 'none' }))
      .filter((x) => x.accessLevel === 'read' || x.accessLevel === 'write')
    setSaveMsg({ type: '', text: '' })
    setSavePermissionsLoading(true)
    try {
      const res = await setRolePermissions(detail.id, grants)
      if (!res.success) {
        setSaveMsg({ type: 'error', text: res.error || 'Error al guardar' })
        return
      }
      setSnackbar({
        open: true,
        message: 'Permisos guardados correctamente.',
        severity: 'success',
      })
      await loadDetail(detail.id)
      await loadAll()
    } finally {
      setSavePermissionsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    if (!canDoAction(ACTION.ROLES_CREAR)) {
      showDenied()
      return
    }
    const res = await createRole({ name: newName.trim(), description: newDesc.trim() || undefined })
    if (!res.success) return setSaveMsg({ type: 'error', text: res.error || 'Error al crear' })
    setCreateOpen(false)
    setNewName('')
    setNewDesc('')
    await loadAll()
    if (res.data?.id) setSelectedId(res.data.id)
  }

  const handleDelete = async () => {
    if (!detail || detail.isSystem || !canEdit) return
    if (!canDoAction(ACTION.ROLES_ELIMINAR)) {
      showDenied()
      return
    }
    if (!window.confirm(`¿Eliminar el rol "${detail.name}"?`)) return
    const res = await deleteRole(detail.id)
    if (!res.success) return setSaveMsg({ type: 'error', text: res.error || 'No se puede eliminar' })
    setSelectedId(null)
    setDetail(null)
    setAccessMap({})
    loadAll()
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
          pt: { xs: 2, sm: 3, md: 4 },
          pr: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 2, sm: 3, md: 4 },
          pl: { xs: 2, sm: 3, md: `${SIDEBAR_WIDTH + 32}px` },
          backgroundColor: '#fafafa',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
        <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold', mb: 2 }}>
          Roles y permisos
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 780 }}>
          Por cada módulo del panel: ocultar la sección, permitir solo consulta o lectura y escritura.
        </Typography>

        {!canEdit && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Tienes acceso de solo lectura a esta sección.
          </Alert>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {saveMsg.text && saveMsg.type === 'error' && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveMsg({ type: '', text: '' })}>
            {saveMsg.text}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>
            <Paper sx={{ width: { xs: '100%', md: 280 }, flexShrink: 0, p: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, py: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Roles
                </Typography>
                {canEdit && (
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      if (!canDoAction(ACTION.ROLES_CREAR)) {
                        showDenied()
                        return
                      }
                      setCreateOpen(true)
                    }}
                  >
                    Nuevo
                  </Button>
                )}
              </Box>
              <List dense disablePadding>
                {roles.map((r) => (
                  <ListItemButton key={r.id} selected={selectedId === r.id} onClick={() => setSelectedId(r.id)}>
                    <ListItemText
                      primary={r.name}
                      secondary={r.slug}
                      primaryTypographyProps={{ fontSize: '0.9rem' }}
                      secondaryTypographyProps={{ fontSize: '0.7rem' }}
                    />
                    {r.isSystem ? <Chip label="Sistema" size="small" sx={{ ml: 1 }} /> : null}
                  </ListItemButton>
                ))}
              </List>
            </Paper>

            <Paper sx={{ flex: 1, minWidth: 0, p: 2 }}>
              {!selectedId ? (
                <Typography color="text.secondary">Selecciona un rol para configurar sus secciones.</Typography>
              ) : detailLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : !detail ? (
                <Typography color="error">No se pudo cargar el rol.</Typography>
              ) : (
                <>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" sx={{ flex: '1 1 auto' }}>
                      {detail.name}
                    </Typography>
                    {detail.isSystem ? (
                      <Chip
                        color="primary"
                        label={
                          hasFullAccess
                            ? 'Rol de sistema'
                            : 'Rol de sistema (permisos fijos)'
                        }
                      />
                    ) : null}
                    {canEdit && !permissionsLocked(detail.isSystem) ? (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleSavePermissions}
                        disabled={savePermissionsLoading}
                        startIcon={
                          savePermissionsLoading ? (
                            <CircularProgress size={18} color="inherit" aria-hidden />
                          ) : (
                            <SaveIcon />
                          )
                        }
                      >
                        {savePermissionsLoading ? 'Guardando…' : 'Guardar permisos'}
                      </Button>
                    ) : null}
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Lista de módulos del administrador. &quot;Lectura y escritura&quot; incluye las acciones de cada sección (crear, editar, eliminar, etc.).
                  </Typography>

                  <Paper variant="outlined" sx={{ p: 2, overflow: 'hidden' }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, minmax(0, 1fr))',
                          md: 'repeat(3, minmax(0, 1fr))',
                        },
                        columnGap: 2,
                        rowGap: 2,
                      }}
                    >
                      {modulePermissionsRows.map((row) => {
                        const SectionIcon = row.Icon
                        return (
                        <Box
                          key={row.key}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: 'action.hover',
                            minWidth: 0,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                            <SectionIcon sx={{ color: 'primary.main', fontSize: 28, flexShrink: 0 }} />
                            <Typography variant="body1" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                              {row.label}
                            </Typography>
                          </Box>
                          {!row.permission ? (
                            <Typography variant="body2" color="warning.main">
                              Permiso de módulo no encontrado en catálogo
                            </Typography>
                          ) : (
                            <FormControl
                              size="small"
                              fullWidth
                              disabled={permissionsLocked(detail.isSystem) || !canEdit || savePermissionsLoading}
                            >
                              <InputLabel id={`access-${row.key}`}>Acceso</InputLabel>
                              <Select
                                labelId={`access-${row.key}`}
                                label="Acceso"
                                value={accessMap[row.permission.id] || 'none'}
                                onChange={(e) =>
                                  setAccessMap((prev) => ({ ...prev, [row.permission.id]: e.target.value }))
                                }
                              >
                                {ACCESS_OPTIONS.map((o) => (
                                  <MenuItem key={o.value} value={o.value}>
                                    {o.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        </Box>
                        )
                      })}
                    </Box>
                  </Paper>

                  {!detail.isSystem && canEdit && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button color="error" size="small" startIcon={<DeleteIcon />} onClick={handleDelete}>
                        Eliminar rol
                      </Button>
                    </Box>
                  )}
                </>
              )}
            </Paper>
          </Box>
        )}

        <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <ModalHeader title="Nuevo rol" onClose={() => setCreateOpen(false)} />
          <DialogContent>
            <TextField
              fullWidth
              label="Nombre del rol"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Descripción (opcional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              margin="normal"
              multiline
              rows={2}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button variant="contained" onClick={handleCreate} disabled={!newName.trim()}>
              Crear
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
