import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import AssignmentIcon from '@mui/icons-material/Assignment'
import InventoryIcon from '@mui/icons-material/Inventory'

type OrderStatus = 
  | 'pendiente'
  | 'confirmado'
  | 'en_preparacion'
  | 'listo_envio'
  | 'en_transito'
  | 'en_reparto'
  | 'entregado'
  | 'cancelado'
  | 'devuelto'

interface Shipping {
  id: string
  folio: string
  status: OrderStatus
  customerInfo: {
    name: string
    email: string
    phone: string
  }
  shippingInfo: {
    address: string
    city: string
    postalCode: string
    trackingNumber?: string
    estimatedDelivery?: string
  }
  orderDetails: {
    items: Array<{
      name: string
      quantity: number
      price: number
    }>
    total: number
    orderDate: string
  }
  statusHistory: Array<{
    status: OrderStatus
    timestamp: string
    description?: string
    location?: string
  }>
}

const shippings: Shipping[] = [
  {
    id: 'ship-001',
    folio: 'DP2024001',
    status: 'en_transito',
    customerInfo: {
      name: 'Juan Pérez',
      email: 'juan.perez@email.com',
      phone: '+52 477 123 4567',
    },
    shippingInfo: {
      address: 'Av. Universidad 123, Col. Centro',
      city: 'León, Guanajuato',
      postalCode: '37000',
      trackingNumber: 'TRK123456789',
      estimatedDelivery: '2024-01-18',
    },
    orderDetails: {
      items: [
        { name: 'Filtro de Aceite Motor', quantity: 2, price: 150.00 },
        { name: 'Pastillas de Freno Delanteras', quantity: 1, price: 320.00 },
      ],
      total: 620.00,
      orderDate: '2024-01-15T10:30:00Z',
    },
    statusHistory: [
      { status: 'pendiente', timestamp: '2024-01-15T10:30:00Z', description: 'Pedido registrado', location: 'Centro de León' },
      { status: 'confirmado', timestamp: '2024-01-15T14:20:00Z', description: 'Pedido confirmado', location: 'Centro de León' },
      { status: 'en_preparacion', timestamp: '2024-01-16T09:15:00Z', description: 'En preparación', location: 'Centro de León' },
      { status: 'listo_envio', timestamp: '2024-01-16T16:45:00Z', description: 'Listo para envío', location: 'Centro de León' },
      { status: 'en_transito', timestamp: '2024-01-17T08:30:00Z', description: 'En tránsito', location: 'Centro de León' },
    ],
  },
  {
    id: 'ship-002',
    folio: 'DP2024002',
    status: 'entregado',
    customerInfo: {
      name: 'María González',
      email: 'maria.gonzalez@email.com',
      phone: '+52 477 987 6543',
    },
    shippingInfo: {
      address: 'Calle Morelos 456, Col. San Miguel',
      city: 'León, Guanajuato',
      postalCode: '37020',
      trackingNumber: 'TRK987654321',
      estimatedDelivery: '2024-01-12',
    },
    orderDetails: {
      items: [
        { name: 'Batería Automotriz 12V', quantity: 1, price: 850.00 },
      ],
      total: 850.00,
      orderDate: '2024-01-10T09:15:00Z',
    },
    statusHistory: [
      { status: 'pendiente', timestamp: '2024-01-10T09:15:00Z', description: 'Pedido registrado', location: 'Centro de León' },
      { status: 'confirmado', timestamp: '2024-01-10T11:30:00Z', description: 'Pedido confirmado', location: 'Centro de León' },
      { status: 'en_preparacion', timestamp: '2024-01-11T08:00:00Z', description: 'En preparación', location: 'Centro de León' },
      { status: 'listo_envio', timestamp: '2024-01-11T15:20:00Z', description: 'Listo para envío', location: 'Centro de León' },
      { status: 'en_transito', timestamp: '2024-01-12T09:00:00Z', description: 'En tránsito', location: 'Centro de León' },
      { status: 'en_reparto', timestamp: '2024-01-12T14:30:00Z', description: 'En reparto', location: 'León, Guanajuato' },
      { status: 'entregado', timestamp: '2024-01-12T16:45:00Z', description: 'Entregado', location: 'León, Guanajuato' },
    ],
  },
  {
    id: 'ship-003',
    folio: 'DP2024003',
    status: 'en_preparacion',
    customerInfo: {
      name: 'Carlos Rodríguez',
      email: 'carlos.rodriguez@email.com',
      phone: '+52 477 555 1234',
    },
    shippingInfo: {
      address: 'Blvd. López Mateos 789, Col. Industrial',
      city: 'León, Guanajuato',
      postalCode: '37290',
      estimatedDelivery: '2024-01-22',
    },
    orderDetails: {
      items: [
        { name: 'Aceite Motor 5W-30', quantity: 4, price: 180.00 },
        { name: 'Filtro de Aire', quantity: 1, price: 95.00 },
        { name: 'Bujías de Encendido', quantity: 4, price: 45.00 },
      ],
      total: 995.00,
      orderDate: '2024-01-18T13:20:00Z',
    },
    statusHistory: [
      { status: 'pendiente', timestamp: '2024-01-18T13:20:00Z', description: 'Pedido registrado', location: 'Centro de León' },
      { status: 'confirmado', timestamp: '2024-01-18T15:45:00Z', description: 'Pedido confirmado', location: 'Centro de León' },
      { status: 'en_preparacion', timestamp: '2024-01-19T08:30:00Z', description: 'En preparación', location: 'Centro de León' },
    ],
  },
  {
    id: 'ship-004',
    folio: 'DP2024004',
    status: 'listo_envio',
    customerInfo: {
      name: 'Ana Martínez',
      email: 'ana.martinez@email.com',
      phone: '+52 477 444 5678',
    },
    shippingInfo: {
      address: 'Av. Insurgentes 321, Col. Moderna',
      city: 'Guanajuato, Guanajuato',
      postalCode: '36000',
      estimatedDelivery: '2024-01-25',
    },
    orderDetails: {
      items: [
        { name: 'Amortiguadores Delanteros', quantity: 2, price: 1200.00 },
        { name: 'Radiador', quantity: 1, price: 650.00 },
      ],
      total: 3050.00,
      orderDate: '2024-01-20T10:00:00Z',
    },
    statusHistory: [
      { status: 'pendiente', timestamp: '2024-01-20T10:00:00Z', description: 'Pedido registrado', location: 'Centro de León' },
      { status: 'confirmado', timestamp: '2024-01-20T12:30:00Z', description: 'Pedido confirmado', location: 'Centro de León' },
      { status: 'en_preparacion', timestamp: '2024-01-21T08:00:00Z', description: 'En preparación', location: 'Centro de León' },
      { status: 'listo_envio', timestamp: '2024-01-21T16:00:00Z', description: 'Listo para envío', location: 'Centro de León' },
    ],
  },
  {
    id: 'ship-005',
    folio: 'DP2024005',
    status: 'en_reparto',
    customerInfo: {
      name: 'Luis Hernández',
      email: 'luis.hernandez@email.com',
      phone: '+52 477 333 9876',
    },
    shippingInfo: {
      address: 'Calle Hidalgo 654, Col. Centro',
      city: 'Irapuato, Guanajuato',
      postalCode: '36500',
      trackingNumber: 'TRK456789123',
      estimatedDelivery: '2024-01-23',
    },
    orderDetails: {
      items: [
        { name: 'Alternador', quantity: 1, price: 800.00 },
        { name: 'Bomba de Agua', quantity: 1, price: 350.00 },
      ],
      total: 1150.00,
      orderDate: '2024-01-19T11:00:00Z',
    },
    statusHistory: [
      { status: 'pendiente', timestamp: '2024-01-19T11:00:00Z', description: 'Pedido registrado', location: 'Centro de León' },
      { status: 'confirmado', timestamp: '2024-01-19T13:00:00Z', description: 'Pedido confirmado', location: 'Centro de León' },
      { status: 'en_preparacion', timestamp: '2024-01-20T09:00:00Z', description: 'En preparación', location: 'Centro de León' },
      { status: 'listo_envio', timestamp: '2024-01-20T15:00:00Z', description: 'Listo para envío', location: 'Centro de León' },
      { status: 'en_transito', timestamp: '2024-01-21T08:00:00Z', description: 'En tránsito', location: 'Centro de León' },
      { status: 'en_reparto', timestamp: '2024-01-22T10:00:00Z', description: 'En reparto', location: 'Irapuato, Guanajuato' },
    ],
  },
  {
    id: 'ship-006',
    folio: 'DP2024006',
    status: 'cancelado',
    customerInfo: {
      name: 'Carmen López',
      email: 'carmen.lopez@email.com',
      phone: '+52 477 222 3456',
    },
    shippingInfo: {
      address: 'Av. Revolución 987, Col. Jardines',
      city: 'Celaya, Guanajuato',
      postalCode: '38000',
    },
    orderDetails: {
      items: [
        { name: 'Kit de Frenos Traseros', quantity: 1, price: 450.00 },
      ],
      total: 450.00,
      orderDate: '2024-01-17T14:00:00Z',
    },
    statusHistory: [
      { status: 'pendiente', timestamp: '2024-01-17T14:00:00Z', description: 'Pedido registrado', location: 'Centro de León' },
      { status: 'cancelado', timestamp: '2024-01-18T09:00:00Z', description: 'Pedido cancelado por el cliente', location: 'Centro de León' },
    ],
  },
]

function ShippingPage() {
  const [selectedShipping, setSelectedShipping] = useState<Shipping | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'status' | 'folio' | 'date' | 'total'>('status')

  const handleShippingClick = (shipping: Shipping) => {
    setSelectedShipping(shipping)
    setDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setSelectedShipping(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      en_preparacion: 'En Preparación',
      listo_envio: 'Listo para Envío',
      en_transito: 'En Tránsito',
      en_reparto: 'En Reparto',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
      devuelto: 'Devuelto',
    }
    return labels[status]
  }

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pendiente: '#FFD700',
      confirmado: '#2196F3',
      en_preparacion: '#9C27B0',
      listo_envio: '#3F51B5',
      en_transito: '#00BCD4',
      en_reparto: '#FF9800',
      entregado: '#8BC34A',
      cancelado: '#E74C3C',
      devuelto: '#AAAAAA',
    }
    return colors[status]
  }

  const filteredAndSortedShippings = useMemo(() => {
    let filtered = shippings

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter)
    }

    // Buscar por identificador (folio, número de guía, nombre, email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(s => 
        s.folio.toLowerCase().includes(query) ||
        s.customerInfo.name.toLowerCase().includes(query) ||
        s.customerInfo.email.toLowerCase().includes(query) ||
        (s.shippingInfo.trackingNumber && s.shippingInfo.trackingNumber.toLowerCase().includes(query)) ||
        s.id.toLowerCase().includes(query)
      )
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'status':
          return a.status.localeCompare(b.status)
        case 'folio':
          return a.folio.localeCompare(b.folio)
        case 'date':
          return new Date(b.orderDetails.orderDate).getTime() - new Date(a.orderDetails.orderDate).getTime()
        case 'total':
          return b.orderDetails.total - a.orderDetails.total
        default:
          return 0
      }
    })

    return sorted
  }, [statusFilter, searchQuery, sortBy])

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Envíos
        </Typography>
      </Box>

      {/* Filtros y Búsqueda */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Buscar por folio, guía, cliente o email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Filtrar por Estado</InputLabel>
                <Select
                  value={statusFilter}
                  label="Filtrar por Estado"
                  onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="pendiente">Pendiente</MenuItem>
                  <MenuItem value="confirmado">Confirmado</MenuItem>
                  <MenuItem value="en_preparacion">En Preparación</MenuItem>
                  <MenuItem value="listo_envio">Listo para Envío</MenuItem>
                  <MenuItem value="en_transito">En Tránsito</MenuItem>
                  <MenuItem value="en_reparto">En Reparto</MenuItem>
                  <MenuItem value="entregado">Entregado</MenuItem>
                  <MenuItem value="cancelado">Cancelado</MenuItem>
                  <MenuItem value="devuelto">Devuelto</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Ordenar por</InputLabel>
                <Select
                  value={sortBy}
                  label="Ordenar por"
                  onChange={(e) => setSortBy(e.target.value as 'status' | 'folio' | 'date' | 'total')}
                >
                  <MenuItem value="status">Estado</MenuItem>
                  <MenuItem value="folio">Folio</MenuItem>
                  <MenuItem value="date">Fecha (más reciente)</MenuItem>
                  <MenuItem value="total">Total (mayor a menor)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                {filteredAndSortedShippings.length} envío{filteredAndSortedShippings.length !== 1 ? 's' : ''}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabla de Envíos */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Folio</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Dirección</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Ciudad</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Número de Guía</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Entrega Estimada</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAndSortedShippings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                        No se encontraron envíos que coincidan con los filtros.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedShippings.map((shipping) => (
                    <TableRow
                      key={shipping.id}
                      onClick={() => handleShippingClick(shipping)}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                        },
                      }}
                    >
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>
                        {shipping.folio}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>
                            {shipping.customerInfo.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {shipping.customerInfo.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {shipping.shippingInfo.address}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>
                          {shipping.shippingInfo.city}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          CP: {shipping.shippingInfo.postalCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(shipping.status)}
                          size="small"
                          sx={{
                            backgroundColor: getStatusColor(shipping.status),
                            color: '#ffffff',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {shipping.shippingInfo.trackingNumber ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <InventoryIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
                            <Typography variant="body2" sx={{ color: 'text.primary' }}>
                              {shipping.shippingInfo.trackingNumber}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                            Sin guía
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {shipping.shippingInfo.estimatedDelivery ? (
                          <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {formatDate(shipping.shippingInfo.estimatedDelivery)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                          N/A
                        </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          ${shipping.orderDetails.total.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <IconButton
                          size="small"
                          onClick={() => handleShippingClick(shipping)}
                          sx={{ color: '#E74C3C' }}
                        >
                          <LocalShippingIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Modal de Detalle del Envío */}
      <Dialog
        open={detailOpen}
        onClose={() => {}}
        maxWidth="lg"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pr: 1,
            pb: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <LocalShippingIcon sx={{ color: '#E74C3C', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Envío {selectedShipping?.folio}
            </Typography>
          </Box>
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
          {selectedShipping && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Información del Envío
                </Typography>
                <Chip
                  label={getStatusLabel(selectedShipping.status)}
                  sx={{
                    backgroundColor: getStatusColor(selectedShipping.status),
                    color: '#ffffff',
                    fontWeight: 600,
                  }}
                />
              </Box>

              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ backgroundColor: '#f5f5f5' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                        Información del Cliente
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            <strong>Nombre:</strong> {selectedShipping.customerInfo.name}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            <strong>Email:</strong> {selectedShipping.customerInfo.email}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                          <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            <strong>Teléfono:</strong> {selectedShipping.customerInfo.phone}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined" sx={{ backgroundColor: '#f5f5f5' }}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                        Dirección de Envío
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <LocationOnIcon sx={{ color: 'text.secondary', fontSize: 20, mt: 0.5 }} />
                          <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {selectedShipping.shippingInfo.address}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.primary', ml: 3 }}>
                          {selectedShipping.shippingInfo.city} {selectedShipping.shippingInfo.postalCode}
                        </Typography>
                        {selectedShipping.shippingInfo.trackingNumber && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <InventoryIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: 'text.primary' }}>
                              <strong>Número de Guía:</strong> {selectedShipping.shippingInfo.trackingNumber}
                            </Typography>
                          </Box>
                        )}
                        {selectedShipping.shippingInfo.estimatedDelivery && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                            <Typography variant="body2" sx={{ color: 'text.primary' }}>
                              <strong>Entrega Estimada:</strong> {formatDate(selectedShipping.shippingInfo.estimatedDelivery)}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Productos del Pedido
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Producto</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Cantidad</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Precio Unitario</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedShipping.orderDetails.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                        <TableCell align="right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Total:
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: '#E74C3C', fontSize: '1.1rem' }}>
                        ${selectedShipping.orderDetails.total.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                Historial de Estados
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {selectedShipping.statusHistory.map((update, index) => (
                  <Card key={index} variant="outlined" sx={{ borderLeft: `4px solid ${getStatusColor(update.status)}` }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Chip
                              label={getStatusLabel(update.status)}
                              size="small"
                              sx={{
                                backgroundColor: getStatusColor(update.status),
                                color: '#ffffff',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                              }}
                            />
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {formatDateTime(update.timestamp)}
                            </Typography>
                          </Box>
                          {update.description && (
                            <Typography variant="body2" sx={{ color: 'text.primary', mb: 0.5 }}>
                              {update.description}
                            </Typography>
                          )}
                          {update.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <LocationOnIcon sx={{ color: 'text.disabled', fontSize: 14 }} />
                              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                {update.location}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
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

export default ShippingPage

