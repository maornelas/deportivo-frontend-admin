import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import CloseIcon from '@mui/icons-material/Close'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import EditIcon from '@mui/icons-material/Edit'
import AddIcon from '@mui/icons-material/Add'
import PersonIcon from '@mui/icons-material/Person'
import HomeIcon from '@mui/icons-material/Home'
import WorkIcon from '@mui/icons-material/Work'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'

interface DeliveryAddress {
  id: string
  type: 'home' | 'work' | 'other'
  label: string
  street: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
  instructions?: string
}

interface PaymentMethod {
  id: string
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer'
  label: string
  lastFourDigits?: string
  expiryDate?: string
  isDefault: boolean
  isActive: boolean
}

interface Client {
  id: number
  name: string
  location: string
  mobile: string
  avatar: string
  createdAt?: string
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    dateOfBirth?: string
    gender?: 'male' | 'female' | 'other'
  }
  addresses: DeliveryAddress[]
  paymentMethods: PaymentMethod[]
}

const clients: Client[] = [
  {
    id: 1,
    name: 'David Manriquez',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'DM',
    createdAt: '2023-01-15T10:00:00Z',
    personalInfo: {
      firstName: 'David',
      lastName: 'Manriquez',
      email: 'david.manriquez@email.com',
      phone: '871.567.4877',
      dateOfBirth: '1985-05-20',
      gender: 'male',
    },
    addresses: [
      {
        id: 'addr-001',
        type: 'home',
        label: 'Casa',
        street: 'Av. Universidad 123, Col. Centro',
        city: 'León',
        state: 'Guanajuato',
        postalCode: '37000',
        country: 'México',
        isDefault: true,
        instructions: 'Dejar en portería si no hay nadie',
      },
      {
        id: 'addr-002',
        type: 'work',
        label: 'Oficina',
        street: 'Blvd. López Mateos 789, Col. Industrial',
        city: 'León',
        state: 'Guanajuato',
        postalCode: '37290',
        country: 'México',
        isDefault: false,
        instructions: 'Entregar en recepción',
      },
    ],
    paymentMethods: [
      {
        id: 'pay-001',
        type: 'credit_card',
        label: 'Visa Terminada en 1234',
        lastFourDigits: '1234',
        expiryDate: '12/25',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'pay-002',
        type: 'debit_card',
        label: 'Mastercard Terminada en 5678',
        lastFourDigits: '5678',
        expiryDate: '08/26',
        isDefault: false,
        isActive: true,
      },
    ],
  },
  {
    id: 2,
    name: 'Alberto Maldonado',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'AM',
    createdAt: '2023-03-20T10:00:00Z',
    personalInfo: {
      firstName: 'Alberto',
      lastName: 'Maldonado',
      email: 'alberto.maldonado@email.com',
      phone: '871.567.4877',
      dateOfBirth: '1990-08-15',
      gender: 'male',
    },
    addresses: [
      {
        id: 'addr-003',
        type: 'home',
        label: 'Casa',
        street: 'Calle Morelos 456, Col. San Miguel',
        city: 'Guanajuato',
        state: 'Guanajuato',
        postalCode: '36000',
        country: 'México',
        isDefault: true,
      },
    ],
    paymentMethods: [
      {
        id: 'pay-003',
        type: 'credit_card',
        label: 'Visa Terminada en 9012',
        lastFourDigits: '9012',
        expiryDate: '03/27',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'pay-004',
        type: 'paypal',
        label: 'PayPal - alberto.maldonado@email.com',
        isDefault: false,
        isActive: true,
      },
    ],
  },
  {
    id: 3,
    name: 'Andres Gutierrez',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'AG',
    createdAt: '2023-06-10T10:00:00Z',
    personalInfo: {
      firstName: 'Andres',
      lastName: 'Gutierrez',
      email: 'andres.gutierrez@email.com',
      phone: '871.567.4877',
      dateOfBirth: '1988-12-10',
      gender: 'male',
    },
    addresses: [
      {
        id: 'addr-004',
        type: 'home',
        label: 'Casa',
        street: 'Av. Revolución 789, Col. Centro',
        city: 'León',
        state: 'Guanajuato',
        postalCode: '37000',
        country: 'México',
        isDefault: true,
        instructions: 'Llamar antes de entregar',
      },
      {
        id: 'addr-005',
        type: 'other',
        label: 'Casa de mis padres',
        street: 'Calle Hidalgo 321, Col. Centro',
        city: 'León',
        state: 'Guanajuato',
        postalCode: '37000',
        country: 'México',
        isDefault: false,
      },
    ],
    paymentMethods: [
      {
        id: 'pay-005',
        type: 'debit_card',
        label: 'Mastercard Terminada en 3456',
        lastFourDigits: '3456',
        expiryDate: '11/25',
        isDefault: true,
        isActive: true,
      },
    ],
  },
  {
    id: 4,
    name: 'Valentin Morales',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'VM',
    createdAt: '2023-09-05T10:00:00Z',
    personalInfo: {
      firstName: 'Valentin',
      lastName: 'Morales',
      email: 'valentin.morales@email.com',
      phone: '871.567.4877',
      dateOfBirth: '1992-03-25',
      gender: 'male',
    },
    addresses: [
      {
        id: 'addr-006',
        type: 'work',
        label: 'Oficina',
        street: 'Blvd. Adolfo López Mateos 1000, Col. Industrial',
        city: 'León',
        state: 'Guanajuato',
        postalCode: '37290',
        country: 'México',
        isDefault: true,
        instructions: 'Entregar en recepción, piso 3',
      },
    ],
    paymentMethods: [
      {
        id: 'pay-006',
        type: 'credit_card',
        label: 'Visa Terminada en 7890',
        lastFourDigits: '7890',
        expiryDate: '06/26',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'pay-007',
        type: 'bank_transfer',
        label: 'Transferencia Bancaria',
        isDefault: false,
        isActive: true,
      },
    ],
  },
  {
    id: 5,
    name: 'Antonio Fuentes',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'AF',
    createdAt: '2023-11-12T10:00:00Z',
    personalInfo: {
      firstName: 'Antonio',
      lastName: 'Fuentes',
      email: 'antonio.fuentes@email.com',
      phone: '871.567.4877',
      dateOfBirth: '1987-07-18',
      gender: 'male',
    },
    addresses: [
      {
        id: 'addr-007',
        type: 'home',
        label: 'Casa',
        street: 'Calle Juárez 654, Col. Centro',
        city: 'León',
        state: 'Guanajuato',
        postalCode: '37000',
        country: 'México',
        isDefault: true,
      },
    ],
    paymentMethods: [
      {
        id: 'pay-008',
        type: 'credit_card',
        label: 'American Express Terminada en 2468',
        lastFourDigits: '2468',
        expiryDate: '09/25',
        isDefault: true,
        isActive: true,
      },
    ],
  },
  {
    id: 6,
    name: 'Federico Saldaña',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'FS',
    createdAt: '2024-01-08T10:00:00Z',
    personalInfo: {
      firstName: 'Federico',
      lastName: 'Saldaña',
      email: 'federico.saldana@email.com',
      phone: '871.567.4877',
      dateOfBirth: '1989-11-30',
      gender: 'male',
    },
    addresses: [
      {
        id: 'addr-008',
        type: 'home',
        label: 'Casa',
        street: 'Av. Insurgentes 987, Col. San Miguel',
        city: 'León',
        state: 'Guanajuato',
        postalCode: '37000',
        country: 'México',
        isDefault: true,
        instructions: 'Casa con portón negro',
      },
    ],
    paymentMethods: [
      {
        id: 'pay-009',
        type: 'debit_card',
        label: 'Visa Débito Terminada en 1357',
        lastFourDigits: '1357',
        expiryDate: '04/26',
        isDefault: true,
        isActive: true,
      },
    ],
  },
  {
    id: 7,
    name: 'Nicolás Herrera',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'NH',
    createdAt: '2024-02-14T10:00:00Z',
    personalInfo: {
      firstName: 'Nicolás',
      lastName: 'Herrera',
      email: 'nicolas.herrera@email.com',
      phone: '871.567.4877',
      dateOfBirth: '1991-02-14',
      gender: 'male',
    },
    addresses: [
      {
        id: 'addr-009',
        type: 'work',
        label: 'Oficina',
        street: 'Blvd. Miguel Hidalgo 500, Col. Centro',
        city: 'León',
        state: 'Guanajuato',
        postalCode: '37000',
        country: 'México',
        isDefault: true,
      },
      {
        id: 'addr-010',
        type: 'home',
        label: 'Casa',
        street: 'Calle Allende 200, Col. Centro',
        city: 'León',
        state: 'Guanajuato',
        postalCode: '37000',
        country: 'México',
        isDefault: false,
      },
    ],
    paymentMethods: [
      {
        id: 'pay-010',
        type: 'credit_card',
        label: 'Mastercard Terminada en 8024',
        lastFourDigits: '8024',
        expiryDate: '12/25',
        isDefault: true,
        isActive: true,
      },
      {
        id: 'pay-011',
        type: 'paypal',
        label: 'PayPal - nicolas.herrera@email.com',
        isDefault: false,
        isActive: true,
      },
    ],
  },
  {
    id: 8,
    name: 'Marcelo Toledo',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'MT',
    createdAt: '2024-03-22T10:00:00Z',
    personalInfo: {
      firstName: 'Marcelo',
      lastName: 'Toledo',
      email: 'marcelo.toledo@email.com',
      phone: '871.567.4877',
      dateOfBirth: '1986-09-05',
      gender: 'male',
    },
    addresses: [
      {
        id: 'addr-011',
        type: 'home',
        label: 'Casa',
        street: 'Av. Constitución 111, Col. Centro',
        city: 'León',
        state: 'Guanajuato',
        postalCode: '37000',
        country: 'México',
        isDefault: true,
      },
    ],
    paymentMethods: [
      {
        id: 'pay-012',
        type: 'credit_card',
        label: 'Visa Terminada en 4680',
        lastFourDigits: '4680',
        expiryDate: '07/26',
        isDefault: true,
        isActive: true,
      },
    ],
  },
]

function ClientsPage() {
  const [tabValue, setTabValue] = useState(0)
  const [clientsList, setClientsList] = useState<Client[]>(clients)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailTabValue, setDetailTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'location'>('name')

  const filteredAndSortedClients = useMemo(() => {
    let filtered = [...clientsList]

    // Filtrar por nombre o teléfono
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.mobile.toLowerCase().includes(query) ||
          client.personalInfo.phone.toLowerCase().includes(query) ||
          client.personalInfo.firstName.toLowerCase().includes(query) ||
          client.personalInfo.lastName.toLowerCase().includes(query) ||
          client.personalInfo.email.toLowerCase().includes(query)
      )
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'createdAt':
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
          return dateB - dateA // Más recientes primero
        case 'location':
          return a.location.localeCompare(b.location)
        default:
          return 0
      }
    })

    return sorted
  }, [clientsList, searchQuery, sortBy])
  
  // Estados para edición
  const [isEditingPersonal, setIsEditingPersonal] = useState(false)
  const [editedPersonalInfo, setEditedPersonalInfo] = useState<Client['personalInfo'] | null>(null)
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [editedAddress, setEditedAddress] = useState<DeliveryAddress | null>(null)
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null)
  const [editedPayment, setEditedPayment] = useState<PaymentMethod | null>(null)
  
  // Estados para creación
  const [isCreatingAddress, setIsCreatingAddress] = useState(false)
  const [newAddress, setNewAddress] = useState<Omit<DeliveryAddress, 'id'> | null>(null)
  const [isCreatingPayment, setIsCreatingPayment] = useState(false)
  const [newPayment, setNewPayment] = useState<Omit<PaymentMethod, 'id'> | null>(null)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  const handleClientClick = (client: Client) => {
    setSelectedClient(client)
    setDetailOpen(true)
    setDetailTabValue(0)
    setIsEditingPersonal(false)
    setEditingAddressId(null)
    setEditingPaymentId(null)
    setIsCreatingAddress(false)
    setIsCreatingPayment(false)
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setSelectedClient(null)
    setDetailTabValue(0)
    setIsEditingPersonal(false)
    setEditedPersonalInfo(null)
    setEditingAddressId(null)
    setEditedAddress(null)
    setEditingPaymentId(null)
    setEditedPayment(null)
    setIsCreatingAddress(false)
    setNewAddress(null)
    setIsCreatingPayment(false)
    setNewPayment(null)
  }

  const handleDetailTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setDetailTabValue(newValue)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getAddressTypeIcon = (type: 'home' | 'work' | 'other') => {
    switch (type) {
      case 'home':
        return <HomeIcon fontSize="small" />
      case 'work':
        return <WorkIcon fontSize="small" />
      default:
        return <LocationOnIcon fontSize="small" />
    }
  }

  const getAddressTypeLabel = (type: 'home' | 'work' | 'other') => {
    switch (type) {
      case 'home':
        return 'Casa'
      case 'work':
        return 'Oficina'
      default:
        return 'Otro'
    }
  }

  const getPaymentTypeLabel = (type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer') => {
    switch (type) {
      case 'credit_card':
        return 'Tarjeta de Crédito'
      case 'debit_card':
        return 'Tarjeta de Débito'
      case 'paypal':
        return 'PayPal'
      case 'bank_transfer':
        return 'Transferencia Bancaria'
    }
  }

  const getGenderLabel = (gender?: 'male' | 'female' | 'other') => {
    switch (gender) {
      case 'male':
        return 'Masculino'
      case 'female':
        return 'Femenino'
      case 'other':
        return 'Otro'
      default:
        return 'No especificado'
    }
  }

  // Funciones para editar información personal
  const handleEditPersonal = () => {
    if (selectedClient) {
      setEditedPersonalInfo({ ...selectedClient.personalInfo })
      setIsEditingPersonal(true)
    }
  }

  const handleSavePersonal = () => {
    if (selectedClient && editedPersonalInfo) {
      const updatedClient = {
        ...selectedClient,
        personalInfo: editedPersonalInfo,
      }
      setSelectedClient(updatedClient)
      setClientsList(clientsList.map(c => c.id === updatedClient.id ? updatedClient : c))
      setIsEditingPersonal(false)
    }
  }

  const handleCancelEditPersonal = () => {
    setIsEditingPersonal(false)
    setEditedPersonalInfo(null)
  }

  // Funciones para editar direcciones
  const handleEditAddress = (address: DeliveryAddress) => {
    setEditedAddress({ ...address })
    setEditingAddressId(address.id)
  }

  const handleSaveAddress = () => {
    if (selectedClient && editedAddress) {
      const updatedAddresses = selectedClient.addresses.map(addr =>
        addr.id === editedAddress.id ? editedAddress : addr
      )
      const updatedClient = {
        ...selectedClient,
        addresses: updatedAddresses,
      }
      setSelectedClient(updatedClient)
      setClientsList(clientsList.map(c => c.id === updatedClient.id ? updatedClient : c))
      setEditingAddressId(null)
      setEditedAddress(null)
    }
  }

  const handleCancelEditAddress = () => {
    setEditingAddressId(null)
    setEditedAddress(null)
  }

  // Funciones para editar métodos de pago
  const handleEditPayment = (payment: PaymentMethod) => {
    setEditedPayment({ ...payment })
    setEditingPaymentId(payment.id)
  }

  const handleSavePayment = () => {
    if (selectedClient && editedPayment) {
      const updatedPayments = selectedClient.paymentMethods.map(pay =>
        pay.id === editedPayment.id ? editedPayment : pay
      )
      const updatedClient = {
        ...selectedClient,
        paymentMethods: updatedPayments,
      }
      setSelectedClient(updatedClient)
      setClientsList(clientsList.map(c => c.id === updatedClient.id ? updatedClient : c))
      setEditingPaymentId(null)
      setEditedPayment(null)
    }
  }

  const handleCancelEditPayment = () => {
    setEditingPaymentId(null)
    setEditedPayment(null)
  }

  // Funciones para crear direcciones
  const handleAddAddress = () => {
    setNewAddress({
      type: 'home',
      label: '',
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'México',
      isDefault: false,
      instructions: '',
    })
    setIsCreatingAddress(true)
  }

  const handleSaveNewAddress = () => {
    if (selectedClient && newAddress && newAddress.label && newAddress.street && newAddress.city && newAddress.state && newAddress.postalCode) {
      const addressToAdd: DeliveryAddress = {
        id: `addr-${Date.now()}`,
        ...newAddress,
      }
      const updatedClient = {
        ...selectedClient,
        addresses: [...selectedClient.addresses, addressToAdd],
      }
      setSelectedClient(updatedClient)
      setClientsList(clientsList.map(c => c.id === updatedClient.id ? updatedClient : c))
      setIsCreatingAddress(false)
      setNewAddress(null)
    }
  }

  const handleCancelNewAddress = () => {
    setIsCreatingAddress(false)
    setNewAddress(null)
  }

  // Funciones para crear métodos de pago
  const handleAddPayment = () => {
    setNewPayment({
      type: 'credit_card',
      label: '',
      lastFourDigits: '',
      expiryDate: '',
      isDefault: false,
      isActive: true,
    })
    setIsCreatingPayment(true)
  }

  const handleSaveNewPayment = () => {
    if (selectedClient && newPayment && newPayment.label) {
      const paymentToAdd: PaymentMethod = {
        id: `pay-${Date.now()}`,
        ...newPayment,
      }
      const updatedClient = {
        ...selectedClient,
        paymentMethods: [...selectedClient.paymentMethods, paymentToAdd],
      }
      setSelectedClient(updatedClient)
      setClientsList(clientsList.map(c => c.id === updatedClient.id ? updatedClient : c))
      setIsCreatingPayment(false)
      setNewPayment(null)
    }
  }

  const handleCancelNewPayment = () => {
    setIsCreatingPayment(false)
    setNewPayment(null)
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
        Clientes
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab
            label="Cliente"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              '&.Mui-selected': {
                color: '#E74C3C',
              },
            }}
          />
          <Tab
            label="Agencias"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              '&.Mui-selected': {
                color: '#E74C3C',
              },
            }}
          />
        </Tabs>
      </Box>

      {/* Filtros y Búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre, teléfono o email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Ordenar por</InputLabel>
              <Select
                value={sortBy}
                label="Ordenar por"
                onChange={(e) => setSortBy(e.target.value as 'name' | 'createdAt' | 'location')}
              >
                <MenuItem value="name">Nombre</MenuItem>
                <MenuItem value="createdAt">Fecha de Creación</MenuItem>
                <MenuItem value="location">Ubicación</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {filteredAndSortedClients.length} cliente{filteredAndSortedClients.length !== 1 ? 's' : ''}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {filteredAndSortedClients.map((client) => (
          <Grid item xs={12} sm={6} key={client.id}>
            <Card
              onClick={() => handleClientClick(client)}
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 4,
                  transform: 'translateY(-2px)',
                  transition: 'all 0.2s ease',
                },
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: '#E74C3C',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                      }}
                    >
                      {client.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {client.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {client.location}
                      </Typography>
                    </Box>
                  </Box>
                  <Box onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" sx={{ color: '#E74C3C' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Mobile: {client.mobile}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination count={5} page={1} color="primary" />
      </Box>

      {/* Modal de Detalle del Cliente */}
      <Dialog
        open={detailOpen}
        onClose={() => {}}
        maxWidth="md"
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
            {selectedClient && (
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: '#E74C3C',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                {selectedClient.avatar}
              </Avatar>
            )}
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {selectedClient?.name}
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
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={detailTabValue} onChange={handleDetailTabChange}>
              <Tab
                label="Datos Personales"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: '#E74C3C',
                  },
                }}
              />
              <Tab
                label="Direcciones"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: '#E74C3C',
                  },
                }}
              />
              <Tab
                label="Métodos de Pago"
                sx={{
                  textTransform: 'none',
                  fontWeight: 500,
                  '&.Mui-selected': {
                    color: '#E74C3C',
                  },
                }}
              />
            </Tabs>
          </Box>

          <Box sx={{ p: 3 }}>
            {detailTabValue === 0 && selectedClient && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Información Personal
                  </Typography>
                  {!isEditingPersonal ? (
                    <Button
                      startIcon={<EditIcon />}
                      onClick={handleEditPersonal}
                      variant="outlined"
                      sx={{
                        borderColor: '#E74C3C',
                        color: '#E74C3C',
                        '&:hover': {
                          borderColor: '#D92323',
                          backgroundColor: '#FFF5F5',
                        },
                      }}
                    >
                      Editar
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        startIcon={<SaveIcon />}
                        onClick={handleSavePersonal}
                        variant="contained"
                        sx={{
                          backgroundColor: '#E74C3C',
                          '&:hover': {
                            backgroundColor: '#D92323',
                          },
                        }}
                      >
                        Guardar
                      </Button>
                      <Button
                        startIcon={<CancelIcon />}
                        onClick={handleCancelEditPersonal}
                        variant="outlined"
                        sx={{
                          borderColor: '#555555',
                          color: 'text.secondary',
                        }}
                      >
                        Cancelar
                      </Button>
                    </Box>
                  )}
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Nombre
                      </Typography>
                    </Box>
                    {isEditingPersonal && editedPersonalInfo ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={editedPersonalInfo.firstName}
                        onChange={(e) => setEditedPersonalInfo({ ...editedPersonalInfo, firstName: e.target.value })}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                        {selectedClient.personalInfo.firstName}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Apellido
                      </Typography>
                    </Box>
                    {isEditingPersonal && editedPersonalInfo ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={editedPersonalInfo.lastName}
                        onChange={(e) => setEditedPersonalInfo({ ...editedPersonalInfo, lastName: e.target.value })}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                        {selectedClient.personalInfo.lastName}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Correo Electrónico
                      </Typography>
                    </Box>
                    {isEditingPersonal && editedPersonalInfo ? (
                      <TextField
                        fullWidth
                        size="small"
                        type="email"
                        value={editedPersonalInfo.email}
                        onChange={(e) => setEditedPersonalInfo({ ...editedPersonalInfo, email: e.target.value })}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                        {selectedClient.personalInfo.email}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Teléfono
                      </Typography>
                    </Box>
                    {isEditingPersonal && editedPersonalInfo ? (
                      <TextField
                        fullWidth
                        size="small"
                        value={editedPersonalInfo.phone}
                        onChange={(e) => setEditedPersonalInfo({ ...editedPersonalInfo, phone: e.target.value })}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                        {selectedClient.personalInfo.phone}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Fecha de Nacimiento
                      </Typography>
                    </Box>
                    {isEditingPersonal && editedPersonalInfo ? (
                      <TextField
                        fullWidth
                        size="small"
                        type="date"
                        value={editedPersonalInfo.dateOfBirth || ''}
                        onChange={(e) => setEditedPersonalInfo({ ...editedPersonalInfo, dateOfBirth: e.target.value })}
                        InputLabelProps={{ shrink: true }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                        {formatDate(selectedClient.personalInfo.dateOfBirth)}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Género
                      </Typography>
                    </Box>
                    {isEditingPersonal && editedPersonalInfo ? (
                      <FormControl fullWidth size="small">
                        <Select
                          value={editedPersonalInfo.gender || ''}
                          onChange={(e) => setEditedPersonalInfo({ ...editedPersonalInfo, gender: e.target.value as 'male' | 'female' | 'other' })}
                        >
                          <MenuItem value="male">Masculino</MenuItem>
                          <MenuItem value="female">Femenino</MenuItem>
                          <MenuItem value="other">Otro</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Typography variant="body1" sx={{ color: 'text.primary' }}>
                        {getGenderLabel(selectedClient.personalInfo.gender)}
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Box>
            )}

            {detailTabValue === 1 && selectedClient && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Direcciones ({selectedClient.addresses.length})
                  </Typography>
                  {!isCreatingAddress && (
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddAddress}
                      variant="contained"
                      sx={{
                        backgroundColor: '#E74C3C',
                        '&:hover': {
                          backgroundColor: '#D92323',
                        },
                      }}
                    >
                      Agregar Dirección
                    </Button>
                  )}
                </Box>
                {isCreatingAddress && newAddress ? (
                  <Card variant="outlined" sx={{ border: '2px dashed #E74C3C', mb: 2, backgroundColor: '#FFF5F5' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Nueva Dirección
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={handleSaveNewAddress}
                            disabled={!newAddress.label || !newAddress.street || !newAddress.city || !newAddress.state || !newAddress.postalCode}
                            sx={{ color: '#E74C3C' }}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={handleCancelNewAddress}
                            sx={{ color: 'text.secondary' }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                          <TextField
                            size="small"
                            label="Etiqueta"
                            value={newAddress.label}
                            onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                            sx={{ width: 150 }}
                            required
                          />
                          <FormControl size="small" sx={{ minWidth: 120 }}>
                            <InputLabel>Tipo</InputLabel>
                            <Select
                              value={newAddress.type}
                              label="Tipo"
                              onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value as 'home' | 'work' | 'other' })}
                            >
                              <MenuItem value="home">Casa</MenuItem>
                              <MenuItem value="work">Oficina</MenuItem>
                              <MenuItem value="other">Otro</MenuItem>
                            </Select>
                          </FormControl>
                        </Box>
                        <TextField
                          fullWidth
                          size="small"
                          label="Calle"
                          value={newAddress.street}
                          onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                          required
                        />
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Ciudad"
                              value={newAddress.city}
                              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Estado"
                              value={newAddress.state}
                              onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Código Postal"
                              value={newAddress.postalCode}
                              onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                              required
                            />
                          </Grid>
                        </Grid>
                        <TextField
                          fullWidth
                          size="small"
                          label="País"
                          value={newAddress.country}
                          onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Instrucciones"
                          multiline
                          rows={2}
                          value={newAddress.instructions || ''}
                          onChange={(e) => setNewAddress({ ...newAddress, instructions: e.target.value })}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={newAddress.isDefault}
                              onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                              size="small"
                            />
                          }
                          label="Dirección predeterminada"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ) : null}
                {selectedClient.addresses.length === 0 && !isCreatingAddress ? (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    No hay direcciones registradas.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {selectedClient.addresses.map((address) => {
                      const isEditing = editingAddressId === address.id
                      const currentAddress = isEditing && editedAddress ? editedAddress : address
                      return (
                        <Grid item xs={12} key={address.id}>
                          <Card
                            variant="outlined"
                            sx={{
                              border: address.isDefault ? '2px solid #E74C3C' : '1px solid #E0E0E0',
                              backgroundColor: address.isDefault ? '#FFF5F5' : '#ffffff',
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {getAddressTypeIcon(currentAddress.type)}
                                  {isEditing && editedAddress ? (
                                    <TextField
                                      size="small"
                                      value={editedAddress.label}
                                      onChange={(e) => setEditedAddress({ ...editedAddress, label: e.target.value })}
                                      sx={{ width: 150 }}
                                    />
                                  ) : (
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                      {currentAddress.label}
                                    </Typography>
                                  )}
                                  {!isEditing && (
                                    <Chip
                                      label={getAddressTypeLabel(currentAddress.type)}
                                      size="small"
                                      sx={{
                                        backgroundColor: '#f5f5f5',
                                        color: 'text.secondary',
                                        fontSize: '0.7rem',
                                        height: 20,
                                      }}
                                    />
                                  )}
                                  {isEditing && editedAddress && (
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                      <Select
                                        value={editedAddress.type}
                                        onChange={(e) => setEditedAddress({ ...editedAddress, type: e.target.value as 'home' | 'work' | 'other' })}
                                      >
                                        <MenuItem value="home">Casa</MenuItem>
                                        <MenuItem value="work">Oficina</MenuItem>
                                        <MenuItem value="other">Otro</MenuItem>
                                      </Select>
                                    </FormControl>
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                  {!isEditing && address.isDefault && (
                                    <Chip
                                      label="Predeterminada"
                                      size="small"
                                      sx={{
                                        backgroundColor: '#E74C3C',
                                        color: '#ffffff',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        height: 20,
                                      }}
                                    />
                                  )}
                                  {isEditing ? (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <IconButton
                                        size="small"
                                        onClick={handleSaveAddress}
                                        sx={{ color: '#E74C3C' }}
                                      >
                                        <SaveIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={handleCancelEditAddress}
                                        sx={{ color: 'text.secondary' }}
                                      >
                                        <CancelIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  ) : (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditAddress(address)}
                                      sx={{
                                        color: '#E74C3C',
                                        '&:hover': {
                                          backgroundColor: '#FFF5F5',
                                          color: '#D92323',
                                        },
                                      }}
                                      title="Editar dirección"
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                </Box>
                              </Box>
                              {isEditing && editedAddress ? (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Calle"
                                    value={editedAddress.street}
                                    onChange={(e) => setEditedAddress({ ...editedAddress, street: e.target.value })}
                                  />
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Ciudad"
                                        value={editedAddress.city}
                                        onChange={(e) => setEditedAddress({ ...editedAddress, city: e.target.value })}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Estado"
                                        value={editedAddress.state}
                                        onChange={(e) => setEditedAddress({ ...editedAddress, state: e.target.value })}
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Código Postal"
                                        value={editedAddress.postalCode}
                                        onChange={(e) => setEditedAddress({ ...editedAddress, postalCode: e.target.value })}
                                      />
                                    </Grid>
                                  </Grid>
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="País"
                                    value={editedAddress.country}
                                    onChange={(e) => setEditedAddress({ ...editedAddress, country: e.target.value })}
                                  />
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Instrucciones"
                                    multiline
                                    rows={2}
                                    value={editedAddress.instructions || ''}
                                    onChange={(e) => setEditedAddress({ ...editedAddress, instructions: e.target.value })}
                                  />
                                  <FormControlLabel
                                    control={
                                      <Switch
                                        checked={editedAddress.isDefault}
                                        onChange={(e) => setEditedAddress({ ...editedAddress, isDefault: e.target.checked })}
                                        size="small"
                                      />
                                    }
                                    label="Dirección predeterminada"
                                  />
                                </Box>
                              ) : (
                                <>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                    {currentAddress.street}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                    {currentAddress.city}, {currentAddress.state} {currentAddress.postalCode}
                                  </Typography>
                                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                                    {currentAddress.country}
                                  </Typography>
                                  {currentAddress.instructions && (
                                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #E0E0E0' }}>
                                      <Typography variant="caption" sx={{ color: 'text.disabled', fontStyle: 'italic' }}>
                                        <strong>Instrucciones:</strong> {currentAddress.instructions}
                                      </Typography>
                                    </Box>
                                  )}
                                </>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      )
                    })}
                  </Grid>
                )}
              </Box>
            )}

            {detailTabValue === 2 && selectedClient && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Métodos de Pago ({selectedClient.paymentMethods.length})
                  </Typography>
                  {!isCreatingPayment && (
                    <Button
                      startIcon={<AddIcon />}
                      onClick={handleAddPayment}
                      variant="contained"
                      sx={{
                        backgroundColor: '#E74C3C',
                        '&:hover': {
                          backgroundColor: '#D92323',
                        },
                      }}
                    >
                      Agregar Método de Pago
                    </Button>
                  )}
                </Box>
                {isCreatingPayment && newPayment ? (
                  <Card variant="outlined" sx={{ border: '2px dashed #E74C3C', mb: 2, backgroundColor: '#FFF5F5' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                          Nuevo Método de Pago
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={handleSaveNewPayment}
                            disabled={!newPayment.label}
                            sx={{ color: '#E74C3C' }}
                          >
                            <SaveIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={handleCancelNewPayment}
                            sx={{ color: 'text.secondary' }}
                          >
                            <CancelIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Tipo</InputLabel>
                          <Select
                            value={newPayment.type}
                            label="Tipo"
                            onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value as 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' })}
                          >
                            <MenuItem value="credit_card">Tarjeta de Crédito</MenuItem>
                            <MenuItem value="debit_card">Tarjeta de Débito</MenuItem>
                            <MenuItem value="paypal">PayPal</MenuItem>
                            <MenuItem value="bank_transfer">Transferencia Bancaria</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          size="small"
                          label="Etiqueta"
                          value={newPayment.label}
                          onChange={(e) => setNewPayment({ ...newPayment, label: e.target.value })}
                          required
                        />
                        {(newPayment.type === 'credit_card' || newPayment.type === 'debit_card') && (
                          <>
                            <TextField
                              fullWidth
                              size="small"
                              label="Últimos 4 dígitos"
                              value={newPayment.lastFourDigits || ''}
                              onChange={(e) => setNewPayment({ ...newPayment, lastFourDigits: e.target.value })}
                              inputProps={{ maxLength: 4 }}
                            />
                            <TextField
                              fullWidth
                              size="small"
                              label="Fecha de expiración (MM/AA)"
                              value={newPayment.expiryDate || ''}
                              onChange={(e) => setNewPayment({ ...newPayment, expiryDate: e.target.value })}
                              placeholder="MM/AA"
                              inputProps={{ maxLength: 5 }}
                            />
                          </>
                        )}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={newPayment.isDefault}
                                onChange={(e) => setNewPayment({ ...newPayment, isDefault: e.target.checked })}
                                size="small"
                              />
                            }
                            label="Método predeterminado"
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                checked={newPayment.isActive}
                                onChange={(e) => setNewPayment({ ...newPayment, isActive: e.target.checked })}
                                size="small"
                              />
                            }
                            label="Activo"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ) : null}
                {selectedClient.paymentMethods.length === 0 && !isCreatingPayment ? (
                  <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                    No hay métodos de pago registrados.
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {selectedClient.paymentMethods.map((payment) => {
                      const isEditing = editingPaymentId === payment.id
                      const currentPayment = isEditing && editedPayment ? editedPayment : payment
                      return (
                        <Grid item xs={12} key={payment.id}>
                          <Card variant="outlined" sx={{ border: '1px solid #E0E0E0' }}>
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                  <Box
                                    sx={{
                                      width: 48,
                                      height: 48,
                                      backgroundColor: '#f5f5f5',
                                      borderRadius: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <CreditCardIcon sx={{ color: 'text.secondary' }} />
                                  </Box>
                                  {isEditing && editedPayment ? (
                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                      <FormControl fullWidth size="small">
                                        <InputLabel>Tipo</InputLabel>
                                        <Select
                                          value={editedPayment.type}
                                          label="Tipo"
                                          onChange={(e) => setEditedPayment({ ...editedPayment, type: e.target.value as 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' })}
                                        >
                                          <MenuItem value="credit_card">Tarjeta de Crédito</MenuItem>
                                          <MenuItem value="debit_card">Tarjeta de Débito</MenuItem>
                                          <MenuItem value="paypal">PayPal</MenuItem>
                                          <MenuItem value="bank_transfer">Transferencia Bancaria</MenuItem>
                                        </Select>
                                      </FormControl>
                                      <TextField
                                        fullWidth
                                        size="small"
                                        label="Etiqueta"
                                        value={editedPayment.label}
                                        onChange={(e) => setEditedPayment({ ...editedPayment, label: e.target.value })}
                                      />
                                      {(editedPayment.type === 'credit_card' || editedPayment.type === 'debit_card') && (
                                        <>
                                          <TextField
                                            fullWidth
                                            size="small"
                                            label="Últimos 4 dígitos"
                                            value={editedPayment.lastFourDigits || ''}
                                            onChange={(e) => setEditedPayment({ ...editedPayment, lastFourDigits: e.target.value })}
                                            inputProps={{ maxLength: 4 }}
                                          />
                                          <TextField
                                            fullWidth
                                            size="small"
                                            label="Fecha de expiración (MM/AA)"
                                            value={editedPayment.expiryDate || ''}
                                            onChange={(e) => setEditedPayment({ ...editedPayment, expiryDate: e.target.value })}
                                            placeholder="MM/AA"
                                            inputProps={{ maxLength: 5 }}
                                          />
                                        </>
                                      )}
                                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              checked={editedPayment.isDefault}
                                              onChange={(e) => setEditedPayment({ ...editedPayment, isDefault: e.target.checked })}
                                              size="small"
                                            />
                                          }
                                          label="Método predeterminado"
                                        />
                                        <FormControlLabel
                                          control={
                                            <Switch
                                              checked={editedPayment.isActive}
                                              onChange={(e) => setEditedPayment({ ...editedPayment, isActive: e.target.checked })}
                                              size="small"
                                            />
                                          }
                                          label="Activo"
                                        />
                                      </Box>
                                    </Box>
                                  ) : (
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                                        {currentPayment.label}
                                      </Typography>
                                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                                        <Chip
                                          label={getPaymentTypeLabel(currentPayment.type)}
                                          size="small"
                                          sx={{
                                            backgroundColor: '#f5f5f5',
                                            color: 'text.secondary',
                                            fontSize: '0.7rem',
                                            height: 20,
                                          }}
                                        />
                                        {currentPayment.lastFourDigits && (
                                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            Termina en {currentPayment.lastFourDigits}
                                          </Typography>
                                        )}
                                        {currentPayment.expiryDate && (
                                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            • Expira {currentPayment.expiryDate}
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  )}
                                </Box>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
                                  {isEditing ? (
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <IconButton
                                        size="small"
                                        onClick={handleSavePayment}
                                        sx={{ color: '#E74C3C' }}
                                      >
                                        <SaveIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        onClick={handleCancelEditPayment}
                                        sx={{ color: 'text.secondary' }}
                                      >
                                        <CancelIcon fontSize="small" />
                                      </IconButton>
                                    </Box>
                                  ) : (
                                    <>
                                      {currentPayment.isDefault && (
                                        <Chip
                                          label="Predeterminado"
                                          size="small"
                                          sx={{
                                            backgroundColor: '#E74C3C',
                                            color: '#ffffff',
                                            fontWeight: 600,
                                            fontSize: '0.7rem',
                                            height: 20,
                                            mb: 1,
                                          }}
                                        />
                                      )}
                                      <Chip
                                        label={currentPayment.isActive ? 'Activo' : 'Inactivo'}
                                        size="small"
                                        sx={{
                                          backgroundColor: currentPayment.isActive ? '#8BC34A' : '#AAAAAA',
                                          color: '#ffffff',
                                          fontSize: '0.7rem',
                                          height: 20,
                                          mb: 1,
                                        }}
                                      />
                                      <IconButton
                                        size="small"
                                        onClick={() => handleEditPayment(payment)}
                                        sx={{
                                          color: '#E74C3C',
                                          '&:hover': {
                                            backgroundColor: '#FFF5F5',
                                            color: '#D92323',
                                          },
                                        }}
                                        title="Editar método de pago"
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                    </>
                                  )}
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      )
                    })}
                  </Grid>
                )}
              </Box>
            )}
          </Box>
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

export default ClientsPage

