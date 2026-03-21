import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Chip,
  CircularProgress,
  InputAdornment,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  DirectionsCar as CarIcon,
  Search as SearchIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ModalHeader from '../components/ModalHeader'
import {
  getBrands,
  getCarModelsByBrand,
  createBrand,
  updateBrand,
  deleteBrand,
  createCarModel,
  updateCarModel,
  deleteCarModel,
} from '../api/catalog'
import { useAuth } from '../contexts/AuthContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'

const Catalogos = () => {
  const { canDoAction } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()
  const navigate = useNavigate()
  const location = useLocation()
  const fromInventario = location.state?.from === 'inventario'

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [brands, setBrands] = useState([])
  const [selectedBrand, setSelectedBrand] = useState(null)
  const [models, setModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [brandsLoading, setBrandsLoading] = useState(true)
  const [brandSearch, setBrandSearch] = useState('')
  const [modelSearch, setModelSearch] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const [brandDialog, setBrandDialog] = useState({ open: false, editId: null, name: '' })
  const [brandSaving, setBrandSaving] = useState(false)
  const [modelDialog, setModelDialog] = useState({ open: false, editId: null, name: '' })
  const [deleteBrandId, setDeleteBrandId] = useState(null)
  const [deleteModelId, setDeleteModelId] = useState(null)
  const [modelDeleting, setModelDeleting] = useState(false)
  const [modelSaving, setModelSaving] = useState(false)

  const loadBrands = useCallback(async (opts = { showLoading: true }) => {
    if (opts.showLoading) setBrandsLoading(true)
    const res = await getBrands({ activeOnly: false })
    if (opts.showLoading) setBrandsLoading(false)
    if (res.success) setBrands(res.data || [])
    else setSnackbar({ open: true, message: res.error || 'Error al cargar marcas', severity: 'error' })
  }, [])

  useEffect(() => {
    loadBrands({ showLoading: true })
  }, [loadBrands])

  const loadModels = async (brandId) => {
    if (!brandId) {
      setModels([])
      return
    }
    setModelsLoading(true)
    const res = await getCarModelsByBrand(brandId)
    setModelsLoading(false)
    setModels(res.success ? res.data || [] : [])
  }

  useEffect(() => {
    setModelSearch('')
    if (selectedBrand?.id) loadModels(selectedBrand.id)
    else setModels([])
  }, [selectedBrand?.id])

  const filteredBrands = useMemo(() => {
    const q = (brandSearch || '').trim().toLowerCase()
    if (!q) return brands
    return brands.filter((b) => (b.name || '').toLowerCase().includes(q))
  }, [brands, brandSearch])

  const filteredModels = useMemo(() => {
    const q = (modelSearch || '').trim().toLowerCase()
    if (!q) return models
    return models.filter((m) => (m.model || '').toLowerCase().includes(q))
  }, [models, modelSearch])

  const openNewBrand = () => {
    if (!canDoAction(ACTION.CATALOGOS_MARCA_CREAR)) {
      showDenied()
      return
    }
    setBrandDialog({ open: true, editId: null, name: '' })
  }
  const openEditBrand = (b) => {
    if (!canDoAction(ACTION.CATALOGOS_MARCA_EDITAR)) {
      showDenied()
      return
    }
    setBrandDialog({ open: true, editId: b.id, name: b.name || '' })
  }

  const saveBrand = async () => {
    const isEdit = !!brandDialog.editId
    if (isEdit) {
      if (!canDoAction(ACTION.CATALOGOS_MARCA_EDITAR)) {
        showDenied()
        return
      }
    } else if (!canDoAction(ACTION.CATALOGOS_MARCA_CREAR)) {
      showDenied()
      return
    }
    const name = (brandDialog.name || '').trim()
    if (!name) {
      setSnackbar({ open: true, message: 'El nombre de la marca es obligatorio', severity: 'warning' })
      return
    }
    const editId = brandDialog.editId
    setBrandSaving(true)
    try {
      let res
      if (isEdit) {
        res = await updateBrand(editId, { name })
      } else {
        res = await createBrand({ name })
      }
      if (!res.success) {
        setSnackbar({ open: true, message: res.error || 'Error al guardar', severity: 'error' })
        return
      }

      setBrandDialog({ open: false, editId: null, name: '' })
      await loadBrands({ showLoading: false })
      if (isEdit && selectedBrand?.id === editId) {
        setSelectedBrand((prev) => (prev ? { ...prev, name } : null))
      }
      if (!isEdit && res.data?.id) {
        setSelectedBrand({ id: res.data.id, name: res.data.name || name })
      }
      setSnackbar({ open: true, message: isEdit ? 'Marca actualizada' : 'Marca creada', severity: 'success' })
    } finally {
      setBrandSaving(false)
    }
  }

  const confirmDeleteBrand = async () => {
    if (!deleteBrandId) return
    if (!canDoAction(ACTION.CATALOGOS_MARCA_ELIMINAR)) {
      showDenied()
      setDeleteBrandId(null)
      return
    }
    const res = await deleteBrand(deleteBrandId)
    if (!res.success) {
      setSnackbar({ open: true, message: res.error || 'No se pudo eliminar la marca', severity: 'error' })
      setDeleteBrandId(null)
      return
    }
    if (selectedBrand?.id === deleteBrandId) {
      setSelectedBrand(null)
      setModels([])
    }
    setDeleteBrandId(null)
    await loadBrands({ showLoading: false })
    setSnackbar({ open: true, message: 'Marca eliminada', severity: 'success' })
  }

  const openNewModel = () => {
    if (!selectedBrand?.id) {
      setSnackbar({ open: true, message: 'Seleccione una marca primero', severity: 'warning' })
      return
    }
    if (!canDoAction(ACTION.CATALOGOS_MODELO_CREAR)) {
      showDenied()
      return
    }
    setModelDialog({ open: true, editId: null, name: '' })
  }
  const openEditModel = (m) => {
    if (!canDoAction(ACTION.CATALOGOS_MODELO_EDITAR)) {
      showDenied()
      return
    }
    setModelDialog({ open: true, editId: m.id, name: m.model || '' })
  }

  const saveModel = async () => {
    const isEdit = !!modelDialog.editId
    if (isEdit) {
      if (!canDoAction(ACTION.CATALOGOS_MODELO_EDITAR)) {
        showDenied()
        return
      }
    } else if (!canDoAction(ACTION.CATALOGOS_MODELO_CREAR)) {
      showDenied()
      return
    }
    const modelName = (modelDialog.name || '').trim()
    if (!modelName) {
      setSnackbar({ open: true, message: 'El nombre del modelo es obligatorio', severity: 'warning' })
      return
    }
    const editId = modelDialog.editId
    setModelSaving(true)
    try {
      let res
      if (isEdit) {
        res = await updateCarModel(editId, modelName)
      } else {
        res = await createCarModel(selectedBrand.id, modelName)
      }
      if (!res.success) {
        setSnackbar({ open: true, message: res.error || 'Error al guardar', severity: 'error' })
        return
      }
      setModelDialog({ open: false, editId: null, name: '' })
      await loadModels(selectedBrand.id)
      setSnackbar({ open: true, message: isEdit ? 'Modelo actualizado' : 'Modelo creado', severity: 'success' })
    } finally {
      setModelSaving(false)
    }
  }

  const confirmDeleteModel = async () => {
    if (!deleteModelId || !selectedBrand?.id) return
    if (!canDoAction(ACTION.CATALOGOS_MODELO_ELIMINAR)) {
      showDenied()
      setDeleteModelId(null)
      return
    }
    setModelDeleting(true)
    try {
      const res = await deleteCarModel(deleteModelId)
      if (!res.success) {
        setSnackbar({ open: true, message: res.error || 'No se pudo eliminar', severity: 'error' })
        setDeleteModelId(null)
        return
      }
      setDeleteModelId(null)
      await loadModels(selectedBrand.id)
      setSnackbar({ open: true, message: 'Modelo eliminado', severity: 'success' })
    } finally {
      setModelDeleting(false)
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
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

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          {fromInventario && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/inventario')}
              sx={{ textTransform: 'none', color: '#7b1fa2' }}
            >
              Volver a Inventario
            </Button>
          )}
          <CarIcon sx={{ fontSize: 36, color: '#7b1fa2' }} />
          <Box>
            <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold', fontSize: { xs: '22px', md: '28px' } }}>
              Catálogos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Autos para capturar: marcas (<strong>brands</strong>) y modelos (<strong>car_models</strong>) usados en inventario y productos.
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
            alignItems: 'start',
          }}
        >
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Marcas
              </Typography>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={openNewBrand} sx={{ textTransform: 'none', bgcolor: '#7b1fa2' }}>
                Nueva marca
              </Button>
            </Box>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar marca…"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
            {brandsLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
                <CircularProgress sx={{ color: '#7b1fa2' }} />
                <Typography variant="body2" color="text.secondary">
                  Cargando marcas…
                </Typography>
              </Box>
            ) : (
              <TableContainer
                sx={{
                  maxHeight: { xs: 'min(50vh, 360px)', lg: 'calc(100vh - 300px)' },
                  overflow: 'auto',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: 'background.paper' }}>Marca</TableCell>
                      <TableCell align="right" sx={{ bgcolor: 'background.paper' }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredBrands.map((b) => (
                      <TableRow
                        key={b.id}
                        hover
                        selected={selectedBrand?.id === b.id}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setSelectedBrand({ id: b.id, name: b.name })}
                      >
                        <TableCell>
                          {b.name}
                          {b.isActive === false && (
                            <Chip label="Inactiva" size="small" sx={{ ml: 1 }} color="default" />
                          )}
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <IconButton size="small" onClick={() => openEditBrand(b)} color="primary" aria-label="Editar marca">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              if (!canDoAction(ACTION.CATALOGOS_MARCA_ELIMINAR)) {
                                showDenied()
                                return
                              }
                              setDeleteBrandId(b.id)
                            }}
                            color="error"
                            aria-label="Eliminar marca"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!brandsLoading && brands.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          No hay marcas. Cree la primera con &quot;Nueva marca&quot;.
                        </TableCell>
                      </TableRow>
                    )}
                    {!brandsLoading && brands.length > 0 && filteredBrands.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                          Ninguna marca coincide con la búsqueda.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Modelos
                {selectedBrand && (
                  <Typography component="span" variant="body2" color="primary" sx={{ ml: 1, fontWeight: 500 }}>
                    — {selectedBrand.name}
                  </Typography>
                )}
              </Typography>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={openNewModel}
                disabled={!selectedBrand}
                sx={{ textTransform: 'none', bgcolor: '#7b1fa2' }}
              >
                Nuevo modelo
              </Button>
            </Box>
            {!selectedBrand ? (
              <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Seleccione una marca en la tabla izquierda para ver y editar sus modelos.
              </Typography>
            ) : modelsLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 2 }}>
                <CircularProgress sx={{ color: '#7b1fa2' }} />
                <Typography variant="body2" color="text.secondary">
                  Cargando modelos…
                </Typography>
              </Box>
            ) : (
              <>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar modelo…"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TableContainer
                  sx={{
                    maxHeight: { xs: 'min(50vh, 360px)', lg: 'calc(100vh - 300px)' },
                    overflow: 'auto',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ bgcolor: 'background.paper' }}>Modelo</TableCell>
                        <TableCell align="right" sx={{ bgcolor: 'background.paper' }}>
                          Acciones
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredModels.map((m) => (
                        <TableRow key={m.id} hover>
                          <TableCell>{m.model}</TableCell>
                          <TableCell align="right">
                            <IconButton size="small" onClick={() => openEditModel(m)} color="primary" aria-label="Editar modelo">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (!canDoAction(ACTION.CATALOGOS_MODELO_ELIMINAR)) {
                                  showDenied()
                                  return
                                }
                                setDeleteModelId(m.id)
                              }}
                              color="error"
                              aria-label="Eliminar modelo"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {models.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            Sin modelos para esta marca. Use &quot;Nuevo modelo&quot;.
                          </TableCell>
                        </TableRow>
                      )}
                      {models.length > 0 && filteredModels.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            Ningún modelo coincide con la búsqueda.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
          </Paper>
        </Box>

        <Dialog open={brandDialog.open} onClose={() => setBrandDialog((d) => ({ ...d, open: false }))} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <ModalHeader title={brandDialog.editId ? 'Editar marca' : 'Nueva marca'} onClose={() => setBrandDialog((d) => ({ ...d, open: false }))} />
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Nombre de la marca"
              value={brandDialog.name}
              onChange={(e) => setBrandDialog((d) => ({ ...d, name: e.target.value }))}
              margin="normal"
              size="small"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={() => setBrandDialog((d) => ({ ...d, open: false }))}
              disabled={brandSaving}
              sx={{ textTransform: 'none' }}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={saveBrand}
              disabled={brandSaving}
              sx={{ textTransform: 'none', bgcolor: '#7b1fa2' }}
            >
              {brandSaving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={modelDialog.open} onClose={() => !modelSaving && setModelDialog((d) => ({ ...d, open: false }))} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <ModalHeader title={modelDialog.editId ? 'Editar modelo' : 'Nuevo modelo'} onClose={() => !modelSaving && setModelDialog((d) => ({ ...d, open: false }))} />
          <DialogContent>
            <TextField
              autoFocus
              fullWidth
              label="Nombre del modelo"
              value={modelDialog.name}
              onChange={(e) => setModelDialog((d) => ({ ...d, name: e.target.value }))}
              margin="normal"
              size="small"
              placeholder="ej. A3, Corolla"
              disabled={modelSaving}
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setModelDialog((d) => ({ ...d, open: false }))} disabled={modelSaving} sx={{ textTransform: 'none' }}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={saveModel} disabled={modelSaving} sx={{ textTransform: 'none', bgcolor: '#7b1fa2' }}>
              {modelSaving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Guardar'}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!deleteBrandId} onClose={() => setDeleteBrandId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <ModalHeader title="Eliminar marca" onClose={() => setDeleteBrandId(null)} />
          <DialogContent>
            <Typography>¿Eliminar esta marca? Se eliminarán también sus modelos asociados. No podrá hacerlo si hay productos que la usan.</Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteBrandId(null)} sx={{ textTransform: 'none' }}>
              Cancelar
            </Button>
            <Button color="error" variant="contained" onClick={confirmDeleteBrand} sx={{ textTransform: 'none' }}>
              Eliminar
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={!!deleteModelId} onClose={() => setDeleteModelId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
          <ModalHeader title="Eliminar modelo" onClose={() => setDeleteModelId(null)} />
          <DialogContent>
            <Typography>¿Eliminar este modelo? No podrá si hay productos que lo tienen asignado.</Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDeleteModelId(null)} disabled={modelDeleting} sx={{ textTransform: 'none' }}>
              Cancelar
            </Button>
            <Button color="error" variant="contained" onClick={confirmDeleteModel} disabled={modelDeleting} sx={{ textTransform: 'none' }}>
              {modelDeleting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Eliminar'}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
        {permissionDeniedSnackbar}
      </Box>
    </Box>
  )
}

export default Catalogos
