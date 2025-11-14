import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Grid,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'
import FilterListIcon from '@mui/icons-material/FilterList'
import NotificationsIcon from '@mui/icons-material/Notifications'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CloseIcon from '@mui/icons-material/Close'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import TableChartIcon from '@mui/icons-material/TableChart'

interface Notification {
  id: string
  type: 'purchase' | 'payment' | 'shipping' | 'cancellation'
  title: string
  message: string
  customer: string
  amount: number
  date: Date
  status: 'new' | 'read'
  orderId: string
}

// Datos mock de notificaciones
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'purchase',
    title: 'Nueva compra realizada',
    message: 'Cliente realizó una compra de productos',
    customer: 'Juan Pérez',
    amount: 1250.50,
    date: new Date(2024, 10, 13, 14, 30),
    status: 'new',
    orderId: 'ORD-001',
  },
  {
    id: '2',
    type: 'payment',
    title: 'Pago confirmado',
    message: 'El pago de la orden ORD-002 ha sido confirmado',
    customer: 'María González',
    amount: 890.00,
    date: new Date(2024, 10, 13, 12, 15),
    status: 'new',
    orderId: 'ORD-002',
  },
  {
    id: '3',
    type: 'shipping',
    title: 'Envío procesado',
    message: 'La orden ORD-003 ha sido enviada',
    customer: 'Carlos Rodríguez',
    amount: 2100.75,
    date: new Date(2024, 10, 12, 16, 45),
    status: 'read',
    orderId: 'ORD-003',
  },
  {
    id: '4',
    type: 'purchase',
    title: 'Nueva compra realizada',
    message: 'Cliente realizó una compra de productos',
    customer: 'Ana Martínez',
    amount: 450.25,
    date: new Date(2024, 10, 12, 10, 20),
    status: 'read',
    orderId: 'ORD-004',
  },
  {
    id: '5',
    type: 'cancellation',
    title: 'Orden cancelada',
    message: 'La orden ORD-005 ha sido cancelada por el cliente',
    customer: 'Luis Hernández',
    amount: 750.00,
    date: new Date(2024, 10, 11, 18, 30),
    status: 'read',
    orderId: 'ORD-005',
  },
  {
    id: '6',
    type: 'purchase',
    title: 'Nueva compra realizada',
    message: 'Cliente realizó una compra de productos',
    customer: 'Patricia López',
    amount: 3200.00,
    date: new Date(2024, 10, 11, 9, 15),
    status: 'read',
    orderId: 'ORD-006',
  },
  {
    id: '7',
    type: 'payment',
    title: 'Pago confirmado',
    message: 'El pago de la orden ORD-007 ha sido confirmado',
    customer: 'Roberto Sánchez',
    amount: 1890.50,
    date: new Date(2024, 10, 10, 14, 0),
    status: 'read',
    orderId: 'ORD-007',
  },
  {
    id: '8',
    type: 'shipping',
    title: 'Envío procesado',
    message: 'La orden ORD-008 ha sido enviada',
    customer: 'Laura Fernández',
    amount: 650.00,
    date: new Date(2024, 10, 9, 11, 30),
    status: 'read',
    orderId: 'ORD-008',
  },
]

function NotificationsPage() {
  const [dateFilter, setDateFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const filteredNotifications = useMemo(() => {
    let filtered = [...mockNotifications]

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter((notif) => notif.type === typeFilter)
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((notif) => notif.status === statusFilter)
    }

    // Filtro por fecha
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)
    const lastMonth = new Date(today)
    lastMonth.setMonth(lastMonth.getMonth() - 1)

    if (dateFilter === 'today') {
      filtered = filtered.filter((notif) => notif.date >= today)
    } else if (dateFilter === 'yesterday') {
      filtered = filtered.filter(
        (notif) => notif.date >= yesterday && notif.date < today
      )
    } else if (dateFilter === 'week') {
      filtered = filtered.filter((notif) => notif.date >= lastWeek)
    } else if (dateFilter === 'month') {
      filtered = filtered.filter((notif) => notif.date >= lastMonth)
    } else if (dateFilter === 'custom' && startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter(
        (notif) => notif.date >= start && notif.date <= end
      )
    }

    // Ordenar por fecha (más recientes primero)
    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [dateFilter, startDate, endDate, typeFilter, statusFilter])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCartIcon sx={{ color: '#8BC34A' }} />
      case 'payment':
        return <CheckCircleIcon sx={{ color: '#2196F3' }} />
      case 'shipping':
        return <LocalShippingIcon sx={{ color: '#FFD700' }} />
      case 'cancellation':
        return <CancelIcon sx={{ color: '#E74C3C' }} />
      default:
        return <NotificationsIcon />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'purchase':
        return '#8BC34A'
      case 'payment':
        return '#2196F3'
      case 'shipping':
        return '#FFD700'
      case 'cancellation':
        return '#E74C3C'
      default:
        return '#AAAAAA'
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'purchase':
        return 'Compra'
      case 'payment':
        return 'Pago'
      case 'shipping':
        return 'Envío'
      case 'cancellation':
        return 'Cancelación'
      default:
        return type
    }
  }

  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Hace un momento'
    if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
    if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const clearFilters = () => {
    setDateFilter('all')
    setStartDate('')
    setEndDate('')
    setTypeFilter('all')
    setStatusFilter('all')
  }

  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification)
    setDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setSelectedNotification(null)
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'text.primary' }}>
        Notificaciones
      </Typography>

      {/* Panel de Filtros */}
      <Paper sx={{ p: 2, mb: 3, border: '1px solid #E0E0E0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon sx={{ color: 'text.secondary' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            Filtros
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filtro de Fecha</InputLabel>
              <Select
                value={dateFilter}
                label="Filtro de Fecha"
                onChange={(e) => setDateFilter(e.target.value)}
                sx={{
                  backgroundColor: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E0E0E0' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#AAAAAA' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E74C3C' },
                }}
              >
                <MenuItem value="all">Todas las fechas</MenuItem>
                <MenuItem value="today">Hoy</MenuItem>
                <MenuItem value="yesterday">Ayer</MenuItem>
                <MenuItem value="week">Última semana</MenuItem>
                <MenuItem value="month">Último mes</MenuItem>
                <MenuItem value="custom">Rango personalizado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {dateFilter === 'custom' && (
            <>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Fecha Inicio"
                  type="date"
                  fullWidth
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E0E0E0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#AAAAAA' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E74C3C' },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  label="Fecha Fin"
                  type="date"
                  fullWidth
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E0E0E0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#AAAAAA' },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E74C3C' },
                  }}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo</InputLabel>
              <Select
                value={typeFilter}
                label="Tipo"
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{
                  backgroundColor: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E0E0E0' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#AAAAAA' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E74C3C' },
                }}
              >
                <MenuItem value="all">Todos los tipos</MenuItem>
                <MenuItem value="purchase">Compra</MenuItem>
                <MenuItem value="payment">Pago</MenuItem>
                <MenuItem value="shipping">Envío</MenuItem>
                <MenuItem value="cancellation">Cancelación</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={statusFilter}
                label="Estado"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{
                  backgroundColor: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E0E0E0' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#AAAAAA' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E74C3C' },
                }}
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="new">No leídas</MenuItem>
                <MenuItem value="read">Leídas</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Button
              onClick={clearFilters}
              size="small"
              sx={{
                color: '#E74C3C',
                '&:hover': {
                  backgroundColor: '#f5f5f5',
                },
              }}
            >
              Limpiar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Lista de Notificaciones */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {filteredNotifications.length} notificación{filteredNotifications.length !== 1 ? 'es' : ''}
          </Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode !== null) {
                setViewMode(newMode)
              }
            }}
            size="small"
            aria-label="Vista de notificaciones"
          >
            <ToggleButton value="cards" aria-label="Vista de cards">
              <Tooltip title="Vista de cards">
                <ViewModuleIcon />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="table" aria-label="Vista de tabla">
              <Tooltip title="Vista de tabla">
                <TableChartIcon />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <NotificationsIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" sx={{ color: 'text.disabled' }}>
                No hay notificaciones que coincidan con los filtros seleccionados
              </Typography>
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          <Grid container spacing={2}>
            {filteredNotifications.map((notification) => (
              <Grid item xs={12} sm={6} md={4} key={notification.id}>
                <Card
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    border: notification.status === 'new' ? '2px solid #E74C3C' : '1px solid',
                    borderColor: (theme) => theme.palette.divider,
                    backgroundColor: notification.status === 'new' 
                      ? (theme) => theme.palette.mode === 'light' ? '#FFF5F5' : 'rgba(231, 76, 60, 0.1)'
                      : 'background.paper',
                    height: '100%',
                    minHeight: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.2s ease',
                    },
                  }}
                >
                  <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: 'text.primary',
                              fontSize: '0.875rem',
                              lineHeight: 1.2,
                            }}
                          >
                            {notification.title}
                          </Typography>
                          <Chip
                            label={notification.status === 'new' ? 'Nueva' : 'Leída'}
                            size="small"
                            sx={{
                              backgroundColor: notification.status === 'new' ? '#E74C3C' : '#8BC34A',
                              color: '#ffffff',
                              fontWeight: 600,
                              fontSize: '0.65rem',
                              height: 20,
                              flexShrink: 0,
                              '& .MuiChip-label': {
                                padding: '0 6px',
                              },
                            }}
                          />
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            mb: 1,
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {notification.message}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 'auto' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          <strong>Cliente:</strong> {notification.customer}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                          {formatDate(notification.date)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                          <strong>Orden:</strong> {notification.orderId}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.primary', fontSize: '0.7rem', fontWeight: 600 }}>
                          ${notification.amount.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
                        <Chip
                          label={getTypeLabel(notification.type)}
                          size="small"
                          sx={{
                            backgroundColor: getTypeColor(notification.type),
                            color: '#ffffff',
                            fontWeight: 500,
                            fontSize: '0.65rem',
                            height: 20,
                            '& .MuiChip-label': {
                              padding: '0 6px',
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: (theme) => theme.palette.mode === 'light' ? '#f5f5f5' : '#2a2a2a' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Título</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Mensaje</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Orden</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Monto</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredNotifications.map((notification) => (
                  <TableRow
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      cursor: 'pointer',
                      borderLeft: notification.status === 'new' ? '3px solid #E74C3C' : 'none',
                      backgroundColor: notification.status === 'new' 
                        ? (theme) => theme.palette.mode === 'light' ? '#FFF5F5' : 'rgba(231, 76, 60, 0.1)'
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: (theme) => theme.palette.mode === 'light' ? '#f5f5f5' : 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  >
                    <TableCell>
                      <Chip
                        label={getTypeLabel(notification.type)}
                        size="small"
                        sx={{
                          backgroundColor: getTypeColor(notification.type),
                          color: '#ffffff',
                          fontWeight: 500,
                          fontSize: '0.7rem',
                          height: 22,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {notification.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: 'text.secondary',
                          maxWidth: 300,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notification.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {notification.customer}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                        {notification.orderId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600 }}>
                        ${notification.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {formatDate(notification.date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={notification.status === 'new' ? 'Nueva' : 'Leída'}
                        size="small"
                        sx={{
                          backgroundColor: notification.status === 'new' ? '#E74C3C' : '#8BC34A',
                          color: '#ffffff',
                          fontWeight: 600,
                          fontSize: '0.7rem',
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Modal de Detalle de Notificación */}
      <Dialog
        open={detailOpen}
        onClose={() => {}}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pr: 1,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Detalle de Notificación
          </Typography>
          <IconButton
            onClick={handleCloseDetail}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {selectedNotification.title}
                  </Typography>
                  <Chip
                    label={selectedNotification.status === 'new' ? 'Nueva' : 'Leída'}
                    size="small"
                    sx={{
                      backgroundColor: selectedNotification.status === 'new' ? '#E74C3C' : '#8BC34A',
                      color: '#ffffff',
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                  {selectedNotification.message}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{
                    backgroundColor: '#f5f5f5',
                    p: 2,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>
                    Información de la Orden
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        <strong>Número de Orden:</strong>
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 600 }}>
                        {selectedNotification.orderId}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        <strong>Tipo:</strong>
                      </Typography>
                      <Chip
                        label={getTypeLabel(selectedNotification.type)}
                        size="small"
                        sx={{
                          backgroundColor: getTypeColor(selectedNotification.type),
                          color: '#ffffff',
                          fontWeight: 500,
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        <strong>Cliente:</strong>
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
                        {selectedNotification.customer}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        <strong>Monto Total:</strong>
                      </Typography>
                      <Typography variant="body1" sx={{ color: '#E74C3C', fontWeight: 700, fontSize: '1.25rem' }}>
                        ${selectedNotification.amount.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                        <strong>Fecha y Hora:</strong>
                      </Typography>
                      <Typography variant="body1" sx={{ color: 'text.primary' }}>
                        {selectedNotification.date.toLocaleString('es-MX', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseDetail}
            variant="contained"
            sx={{
              backgroundColor: '#E74C3C',
              '&:hover': {
                backgroundColor: '#D92323',
              },
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default NotificationsPage

