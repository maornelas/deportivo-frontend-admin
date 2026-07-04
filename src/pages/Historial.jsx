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
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  IconButton,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import PageTitle from '../components/PageTitle'
import { getActivityLog, listActivityLogs } from '../api/activityLogs'
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

function fmtDateTime(v) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'medium' })
}

function formatMetadata(meta) {
  if (meta == null) return '—'
  if (typeof meta === 'object') {
    try {
      return JSON.stringify(meta, null, 2)
    } catch {
      return String(meta)
    }
  }
  return String(meta)
}

function pickRequestPayload(metadata) {
  if (!metadata || typeof metadata !== 'object') return null
  return Object.prototype.hasOwnProperty.call(metadata, 'requestPayload')
    ? metadata.requestPayload
    : null
}

function pickResponseStatusCode(metadata) {
  if (!metadata || typeof metadata !== 'object') return null
  return Object.prototype.hasOwnProperty.call(metadata, 'statusCode')
    ? metadata.statusCode
    : null
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

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [detail, setDetail] = useState(null)

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

  const closeDetail = () => {
    if (detailLoading) return
    setDetailOpen(false)
    setDetailError('')
    setDetail(null)
  }

  const openDetailForRow = async (rowId) => {
    setDetailOpen(true)
    setDetail(null)
    setDetailError('')
    setDetailLoading(true)
    const r = await getActivityLog(rowId)
    setDetailLoading(false)
    if (!r.success) {
      setDetailError(r.error || 'No se pudo cargar el detalle')
      return
    }
    setDetail(r.data)
  }

  if (!canViewPath('/historial')) {
    return null
  }

  const dialogRequestPayload = detail ? pickRequestPayload(detail.metadata) : null
  const dialogStatusCode = detail ? pickResponseStatusCode(detail.metadata) : null

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
          bgcolor: 'background.default',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
        <PageTitle sx={{ mb: 2 }}>Historial</PageTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 900 }}>
          Registro de acciones de escritura en la API (POST, PUT, PATCH, DELETE) con contexto del usuario del panel cuando
          la petición incluye las cabeceras de administrador. Doble clic en una fila para ver el detalle de la acción y el
          contexto del usuario.
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
                  <TableRow
                    key={r.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onDoubleClick={() => openDetailForRow(r.id)}
                  >
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

        <Dialog open={detailOpen} onClose={closeDetail} maxWidth="md" fullWidth scroll="paper">
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
            Detalle de la acción
            <IconButton
              onClick={closeDetail}
              disabled={detailLoading}
              aria-label="Cerrar"
              edge="end"
              size="small"
              sx={{
                color: '#fff',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
                '&.Mui-disabled': { color: 'rgba(255,255,255,0.5)' },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            {detailLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={36} />
              </Box>
            )}
            {!detailLoading && detailError && <Alert severity="error">{detailError}</Alert>}
            {!detailLoading && !detailError && detail && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Método HTTP
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={activityMethodLabel(detail.httpMethod)}
                      size="small"
                      color={detail.httpMethod === 'DELETE' ? 'error' : detail.httpMethod === 'POST' ? 'success' : 'primary'}
                      variant="outlined"
                    />
                    <Typography component="span" variant="body2" sx={{ ml: 1, fontFamily: 'monospace', fontWeight: 600 }}>
                      {detail.httpMethod}
                    </Typography>
                  </Box>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Ruta
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 13 }}>
                    {detail.path}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Módulo: {activityModuleLabel(detail.path)}
                  </Typography>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Contexto del usuario (panel)
                  </Typography>
                  <Box sx={{ mt: 1, display: 'grid', gap: 0.75 }}>
                    <Typography variant="body2">
                      <strong>Nombre:</strong> {detail.userDisplayName?.trim() || '—'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {detail.userEmail?.trim() || '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                      <strong>ID usuario:</strong> {detail.userId || '—'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Rol:</strong> {detail.roleLabel || '—'}
                    </Typography>
                  </Box>
                </Box>
                <Divider />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Resumen
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {detail.actionSummary || '—'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Payload enviado
                  </Typography>
                  <Box
                    component="pre"
                    sx={{
                      mt: 0.5,
                      p: 1.5,
                      bgcolor: 'grey.100',
                      borderRadius: 1,
                      fontSize: 12,
                      overflow: 'auto',
                      maxHeight: 240,
                      fontFamily: 'monospace',
                    }}
                  >
                    {formatMetadata(dialogRequestPayload)}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Código de estado HTTP (respuesta)
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, fontFamily: 'monospace' }}>
                    {dialogStatusCode != null ? String(dialogStatusCode) : '—'}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="caption" color="text.secondary">
                      IP
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {detail.ip || '—'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px' }}>
                    <Typography variant="caption" color="text.secondary">
                      Fecha y hora
                    </Typography>
                    <Typography variant="body2">{fmtDateTime(detail.createdAt)}</Typography>
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    User-Agent
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5, wordBreak: 'break-word', fontSize: 12 }}>
                    {detail.userAgent?.trim() || '—'}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  ID registro: {detail.id}
                </Typography>
              </Box>
            )}
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  )
}
