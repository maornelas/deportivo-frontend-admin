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
  Button,
  Chip,
} from '@mui/material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { listActivityLogs } from '../api/activityLogs'
import { useAuth } from '../contexts/AuthContext'
import { activityMethodLabel, activityModuleLabel } from '../utils/activityLogDisplay'

function fmtDateOnly(v) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-MX', { dateStyle: 'short' })
}

function fmtTimeOnly(v) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('es-MX', { timeStyle: 'medium' })
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

  const [filterUserSearch, setFilterUserSearch] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')

  const [appliedUserSearch, setAppliedUserSearch] = useState('')
  const [appliedRole, setAppliedRole] = useState('')
  const [appliedStartDate, setAppliedStartDate] = useState('')
  const [appliedEndDate, setAppliedEndDate] = useState('')

  const applyFilters = () => {
    setAppliedUserSearch(filterUserSearch.trim())
    setAppliedRole(filterRole.trim())
    setAppliedStartDate(filterStartDate.trim())
    setAppliedEndDate(filterEndDate.trim())
    setPage(0)
  }

  const load = useCallback(async () => {
    if (!canViewPath('/historial')) return
    setLoading(true)
    setError('')
    const r = await listActivityLogs({
      page: page + 1,
      limit,
      userSearch: appliedUserSearch || undefined,
      role: appliedRole || undefined,
      startDate: appliedStartDate || undefined,
      endDate: appliedEndDate || undefined,
    })
    setLoading(false)
    if (!r.success) {
      setError(r.error || 'Error al cargar')
      setRows([])
      setTotal(0)
      return
    }
    setRows(r.data.items || [])
    setTotal(r.data.total ?? 0)
  }, [page, limit, appliedUserSearch, appliedRole, appliedStartDate, appliedEndDate, canViewPath])

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

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
            <TextField
              size="small"
              label="Usuario (nombre o email)"
              value={filterUserSearch}
              onChange={(e) => setFilterUserSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              sx={{ minWidth: 220, flex: '1 1 200px' }}
            />
            <TextField
              size="small"
              label="Rol"
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="ej. admin"
              sx={{ minWidth: 140, flex: '0 1 160px' }}
            />
            <TextField
              size="small"
              label="Desde"
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <TextField
              size="small"
              label="Hasta"
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <Button variant="contained" onClick={applyFilters} sx={{ bgcolor: '#7B2CBF', '&:hover': { bgcolor: '#6A26A8' } }}>
              Aplicar
            </Button>
          </Box>
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
                <TableCell>Hora</TableCell>
                <TableCell>Usuario</TableCell>
                <TableCell>Rol</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Módulo</TableCell>
                <TableCell>Ruta</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={32} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                    Sin registros.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDateOnly(r.createdAt)}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                      {fmtTimeOnly(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{r.userDisplayName?.trim() || '—'}</Typography>
                    </TableCell>
                    <TableCell>{r.roleLabel || '—'}</TableCell>
                    <TableCell>
                      <Chip
                        label={activityMethodLabel(r.httpMethod)}
                        size="small"
                        color={r.httpMethod === 'DELETE' ? 'error' : r.httpMethod === 'POST' ? 'success' : 'primary'}
                        variant="outlined"
                        sx={{
                          height: 22,
                          fontWeight: 500,
                          '& .MuiChip-label': {
                            px: 0.75,
                            fontSize: '0.65rem',
                            lineHeight: 1.2,
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{activityModuleLabel(r.path)}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 360, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12 }}>
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
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </TableContainer>
      </Box>
    </Box>
  )
}
