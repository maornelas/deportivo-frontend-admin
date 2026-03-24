import { useCallback, useEffect, useState } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { listActivityLogs } from '../api/activityLogs'
import { useAuth } from '../contexts/AuthContext'

function fmtDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleString('es-MX')
}

export default function Historial() {
  const { canViewPath } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [limit] = useState(25)
  const [filterUserId, setFilterUserId] = useState('')
  const [appliedUserId, setAppliedUserId] = useState('')

  const load = useCallback(async () => {
    if (!canViewPath('/historial')) return
    setLoading(true)
    setError('')
    const r = await listActivityLogs({ page: page + 1, limit, userId: appliedUserId || undefined })
    setLoading(false)
    if (!r.success) {
      setError(r.error || 'Error al cargar')
      setRows([])
      setTotal(0)
      return
    }
    setRows(r.data.items || [])
    setTotal(r.data.total ?? 0)
  }, [page, limit, appliedUserId, canViewPath])

  useEffect(() => {
    load()
  }, [load])

  if (!canViewPath('/historial')) {
    return null
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
          Historial
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 900 }}>
          Registro de acciones de escritura en la API (POST, PUT, PATCH, DELETE) con contexto del usuario del panel cuando
          la petición incluye las cabeceras de administrador.
        </Typography>

        <Paper sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            label="Filtrar por ID de usuario"
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            sx={{ minWidth: 280 }}
          />
          <Typography
            component="button"
            type="button"
            onClick={() => {
              setAppliedUserId(filterUserId.trim())
              setPage(0)
            }}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 2, py: 1, bgcolor: 'background.paper', cursor: 'pointer' }}
          >
            Aplicar
          </Typography>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fecha</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Ruta</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Sin registros.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(r.createdAt)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{r.userDisplayName || r.userEmail || '—'}</Typography>
                      {r.userEmail && r.userDisplayName ? (
                        <Typography variant="caption" color="text.secondary" display="block">
                          {r.userEmail}
                        </Typography>
                      ) : null}
                    </TableCell>
                    <TableCell>{r.roleLabel || '—'}</TableCell>
                    <TableCell>{r.httpMethod}</TableCell>
                    <TableCell sx={{ maxWidth: 420, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12 }}>
                      {r.path}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={limit}
            rowsPerPageOptions={[limit]}
            labelRowsPerPage="Por página"
          />
        </TableContainer>
      </Box>
    </Box>
  )
}
