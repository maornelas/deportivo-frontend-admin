import { useState, useEffect, useCallback, useMemo } from 'react'
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
  FormControlLabel,
  Switch,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  MoneyOff as MoneyOffIcon,
} from '@mui/icons-material'
import ModalHeader from './ModalHeader'
import {
  getExpenseTypes,
  createExpenseType,
  updateExpenseType,
  deleteExpenseType,
} from '../api/expenseTypes'
import { useAuth } from '../contexts/AuthContext'
import { ACTION } from '../config/actionPermissions'
import { usePermissionDenied } from '../hooks/usePermissionDenied'

export default function ExpenseTypesCatalog() {
  const { canDoAction } = useAuth()
  const { showDenied, permissionDeniedSnackbar } = usePermissionDenied()

  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })

  const [dialog, setDialog] = useState({ open: false, editId: null, name: '', isActive: true })
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const loadTypes = useCallback(async () => {
    setLoading(true)
    const res = await getExpenseTypes({ activeOnly: false })
    setLoading(false)
    if (res.success) setTypes(res.data || [])
    else setSnackbar({ open: true, message: res.error || 'Error al cargar', severity: 'error' })
  }, [])

  useEffect(() => {
    loadTypes()
  }, [loadTypes])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return types
    return types.filter((t) => (t.name || '').toLowerCase().includes(q))
  }, [types, search])

  const openNew = () => {
    if (!canDoAction(ACTION.CATALOGOS_TIPO_GASTO_CREAR)) {
      showDenied()
      return
    }
    setDialog({ open: true, editId: null, name: '', isActive: true })
  }

  const openEdit = (t) => {
    if (!canDoAction(ACTION.CATALOGOS_TIPO_GASTO_EDITAR)) {
      showDenied()
      return
    }
    setDialog({ open: true, editId: t.id, name: t.name || '', isActive: t.isActive !== false })
  }

  const save = async () => {
    const isEdit = !!dialog.editId
    if (isEdit) {
      if (!canDoAction(ACTION.CATALOGOS_TIPO_GASTO_EDITAR)) {
        showDenied()
        return
      }
    } else if (!canDoAction(ACTION.CATALOGOS_TIPO_GASTO_CREAR)) {
      showDenied()
      return
    }
    const name = (dialog.name || '').trim()
    if (!name) {
      setSnackbar({ open: true, message: 'El nombre es obligatorio', severity: 'warning' })
      return
    }
    setSaving(true)
    try {
      const res = isEdit
        ? await updateExpenseType(dialog.editId, { name, isActive: dialog.isActive })
        : await createExpenseType({ name, isActive: dialog.isActive })
      if (!res.success) {
        setSnackbar({ open: true, message: res.error || 'Error al guardar', severity: 'error' })
        return
      }
      setDialog({ open: false, editId: null, name: '', isActive: true })
      await loadTypes()
      setSnackbar({ open: true, message: isEdit ? 'Tipo actualizado' : 'Tipo creado', severity: 'success' })
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteId) return
    if (!canDoAction(ACTION.CATALOGOS_TIPO_GASTO_ELIMINAR)) {
      showDenied()
      setDeleteId(null)
      return
    }
    setDeleting(true)
    try {
      const res = await deleteExpenseType(deleteId)
      if (!res.success) {
        setSnackbar({ open: true, message: res.error || 'No se pudo eliminar', severity: 'error' })
        setDeleteId(null)
        return
      }
      setDeleteId(null)
      await loadTypes()
      setSnackbar({ open: true, message: 'Tipo eliminado', severity: 'success' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MoneyOffIcon sx={{ color: '#7b1fa2' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Tipos de gasto
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={openNew}
            sx={{ textTransform: 'none', bgcolor: '#7b1fa2' }}
          >
            Nuevo tipo
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Categorías usadas en el módulo de Gastos. Al editar el nombre se actualizan los gastos ya registrados con esa categoría.
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Buscar tipo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        {loading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 6, gap: 2 }}>
            <CircularProgress sx={{ color: '#7b1fa2' }} />
            <Typography variant="body2" color="text.secondary">
              Cargando tipos de gasto…
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 'calc(100vh - 320px)', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 600 }}>Categoría</TableCell>
                  <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 600 }} align="center">
                    Estado
                  </TableCell>
                  <TableCell sx={{ bgcolor: 'background.paper', fontWeight: 600 }} align="right">
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No hay tipos de gasto.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((t) => (
                    <TableRow key={t.id} hover>
                      <TableCell>{t.name}</TableCell>
                      <TableCell align="center">
                        {t.isActive === false ? (
                          <Chip label="Inactivo" size="small" color="default" />
                        ) : (
                          <Chip label="Activo" size="small" color="success" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => openEdit(t)} aria-label="Editar">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (!canDoAction(ACTION.CATALOGOS_TIPO_GASTO_ELIMINAR)) {
                              showDenied()
                              return
                            }
                            setDeleteId(t.id)
                          }}
                          aria-label="Eliminar"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialog.open} onClose={() => !saving && setDialog({ open: false, editId: null, name: '', isActive: true })} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
        <ModalHeader title={dialog.editId ? 'Editar tipo de gasto' : 'Nuevo tipo de gasto'} onClose={() => !saving && setDialog({ open: false, editId: null, name: '', isActive: true })} />
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            label="Nombre de la categoría"
            value={dialog.name}
            onChange={(e) => setDialog((d) => ({ ...d, name: e.target.value }))}
            margin="normal"
            placeholder="ej. GASOLINAS"
            inputProps={{ maxLength: 100 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={dialog.isActive}
                onChange={(e) => setDialog((d) => ({ ...d, isActive: e.target.checked }))}
                color="primary"
              />
            }
            label="Activo (visible al registrar gastos)"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog({ open: false, editId: null, name: '', isActive: true })} disabled={saving} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={save} disabled={saving} sx={{ textTransform: 'none', bgcolor: '#7b1fa2' }}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteId} onClose={() => !deleting && setDeleteId(null)}>
        <DialogContent>
          <Typography>¿Eliminar este tipo de gasto? No se puede si ya hay gastos con esa categoría.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={deleting} sx={{ textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete} disabled={deleting} sx={{ textTransform: 'none' }}>
            {deleting ? 'Eliminando…' : 'Eliminar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      {permissionDeniedSnackbar}
    </>
  )
}
