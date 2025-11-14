import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
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
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import BusinessIcon from '@mui/icons-material/Business'
import BadgeIcon from '@mui/icons-material/Badge'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

interface User {
  id: number
  name: string
  email: string
  role: string
  avatar: string
  status: 'active' | 'inactive'
  firstName?: string
  lastName?: string
  phone?: string
  companyName?: string
  rfc?: string
  birthDate?: string
  gender?: 'M' | 'F' | 'O'
  emailVerified?: boolean
  phoneVerified?: boolean
  createdAt?: string
  updatedAt?: string
  lastLogin?: string
}

const users: User[] = [
  {
    id: 1,
    name: 'Mario Lona',
    email: 'mario.lona@example.com',
    role: 'Administrador',
    avatar: 'ML',
    status: 'active',
    firstName: 'Mario',
    lastName: 'Lona',
    phone: '+52 477 123 4567',
    companyName: 'El Deportivo',
    rfc: 'ABC123456789',
    birthDate: '1985-05-15',
    gender: 'M',
    emailVerified: true,
    phoneVerified: true,
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    lastLogin: '2024-12-15T14:30:00Z',
  },
  {
    id: 2,
    name: 'Ana García',
    email: 'ana.garcia@example.com',
    role: 'Editor',
    avatar: 'AG',
    status: 'active',
    firstName: 'Ana',
    lastName: 'García',
    phone: '+52 477 234 5678',
    birthDate: '1990-08-20',
    gender: 'F',
    emailVerified: true,
    phoneVerified: false,
    createdAt: '2023-03-20T10:00:00Z',
    updatedAt: '2024-03-20T10:00:00Z',
    lastLogin: '2024-12-14T09:15:00Z',
  },
  {
    id: 3,
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@example.com',
    role: 'Vendedor',
    avatar: 'CR',
    status: 'active',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    phone: '+52 477 345 6789',
    birthDate: '1988-12-10',
    gender: 'M',
    emailVerified: true,
    phoneVerified: true,
    createdAt: '2023-06-10T10:00:00Z',
    updatedAt: '2024-06-10T10:00:00Z',
    lastLogin: '2024-12-15T16:45:00Z',
  },
  {
    id: 4,
    name: 'María López',
    email: 'maria.lopez@example.com',
    role: 'Vendedor',
    avatar: 'ML',
    status: 'inactive',
    firstName: 'María',
    lastName: 'López',
    phone: '+52 477 456 7890',
    birthDate: '1992-03-25',
    gender: 'F',
    emailVerified: true,
    phoneVerified: true,
    createdAt: '2023-09-05T10:00:00Z',
    updatedAt: '2024-09-05T10:00:00Z',
    lastLogin: '2024-11-20T11:20:00Z',
  },
]

function UsersPage() {
  const [usersList, setUsersList] = useState<User[]>(users)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'role'>('name')
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Vendedor',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    rfc: '',
    birthDate: '',
    gender: '' as 'M' | 'F' | 'O' | '',
    status: 'active' as 'active' | 'inactive',
    emailVerified: false,
    phoneVerified: false,
  })

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...usersList]

    // Filtrar por nombre
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          (user.firstName && user.firstName.toLowerCase().includes(query)) ||
          (user.lastName && user.lastName.toLowerCase().includes(query))
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
        case 'role':
          return a.role.localeCompare(b.role)
        default:
          return 0
      }
    })

    return sorted
  }, [usersList, searchQuery, sortBy])

  const handleUserClick = (user: User) => {
    setSelectedUser(user)
    setDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setSelectedUser(null)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getGenderLabel = (gender?: 'M' | 'F' | 'O') => {
    switch (gender) {
      case 'M':
        return 'Masculino'
      case 'F':
        return 'Femenino'
      case 'O':
        return 'Otro'
      default:
        return 'No especificado'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'administrador':
        return '#E74C3C'
      case 'editor':
        return '#2196F3'
      case 'vendedor':
        return '#8BC34A'
      default:
        return '#555555'
    }
  }

  const handleAddUser = () => {
    setNewUser({
      name: '',
      email: '',
      role: 'Vendedor',
      firstName: '',
      lastName: '',
      phone: '',
      companyName: '',
      rfc: '',
      birthDate: '',
      gender: '',
      status: 'active',
      emailVerified: false,
      phoneVerified: false,
    })
    setCreateOpen(true)
  }

  const handleCloseCreate = () => {
    setCreateOpen(false)
    setNewUser({
      name: '',
      email: '',
      role: 'Vendedor',
      firstName: '',
      lastName: '',
      phone: '',
      companyName: '',
      rfc: '',
      birthDate: '',
      gender: '',
      status: 'active',
      emailVerified: false,
      phoneVerified: false,
    })
  }

  const handleSaveNewUser = () => {
    if (newUser.name && newUser.email && newUser.role) {
      const firstName = newUser.firstName || newUser.name.split(' ')[0]
      const lastName = newUser.lastName || newUser.name.split(' ').slice(1).join(' ') || ''
      const avatar = `${firstName[0]}${lastName[0] || firstName[1] || ''}`.toUpperCase()
      
      const userToAdd: User = {
        id: usersList.length + 1,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: avatar,
        status: newUser.status,
        firstName: newUser.firstName || undefined,
        lastName: newUser.lastName || undefined,
        phone: newUser.phone || undefined,
        companyName: newUser.companyName || undefined,
        rfc: newUser.rfc || undefined,
        birthDate: newUser.birthDate || undefined,
        gender: newUser.gender || undefined,
        emailVerified: newUser.emailVerified,
        phoneVerified: newUser.phoneVerified,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      setUsersList([...usersList, userToAdd])
      handleCloseCreate()
    }
  }

  const handleNewUserChange = (field: string, value: any) => {
    setNewUser(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Usuarios
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={handleAddUser}
          variant="contained"
          sx={{
            backgroundColor: '#E74C3C',
            '&:hover': {
              backgroundColor: '#D92323',
            },
          }}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {/* Filtros y Búsqueda */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar por nombre o email..."
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
                onChange={(e) => setSortBy(e.target.value as 'name' | 'createdAt' | 'role')}
              >
                <MenuItem value="name">Nombre</MenuItem>
                <MenuItem value="createdAt">Fecha de Creación</MenuItem>
                <MenuItem value="role">Rol</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {filteredAndSortedUsers.length} usuario{filteredAndSortedUsers.length !== 1 ? 's' : ''}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        {filteredAndSortedUsers.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <Card
              onClick={() => handleUserClick(user)}
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
                      {user.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {user.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Box onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" sx={{ color: '#E74C3C' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={user.role}
                    size="small"
                    sx={{
                      backgroundColor: getRoleColor(user.role) + '20',
                      color: getRoleColor(user.role),
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    label={user.status === 'active' ? 'Activo' : 'Inactivo'}
                    size="small"
                    sx={{
                      backgroundColor: user.status === 'active' ? '#8BC34A' : '#AAAAAA',
                      color: '#ffffff',
                      fontWeight: 500,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Modal de Detalle del Usuario */}
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
            {selectedUser && (
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: '#E74C3C',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
              >
                {selectedUser.avatar}
              </Avatar>
            )}
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {selectedUser?.name}
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
          {selectedUser && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                Información del Usuario
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Nombre Completo
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                    {selectedUser.firstName && selectedUser.lastName
                      ? `${selectedUser.firstName} ${selectedUser.lastName}`
                      : selectedUser.name}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Correo Electrónico
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {selectedUser.email}
                    </Typography>
                    {selectedUser.emailVerified && (
                      <Chip
                        icon={<VerifiedUserIcon />}
                        label="Verificado"
                        size="small"
                        sx={{
                          backgroundColor: '#8BC34A',
                          color: '#ffffff',
                          fontSize: '0.7rem',
                          height: 20,
                        }}
                      />
                    )}
                  </Box>
                </Grid>
                {selectedUser.phone && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Teléfono
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                        {selectedUser.phone}
                      </Typography>
                      {selectedUser.phoneVerified && (
                        <Chip
                          icon={<VerifiedUserIcon />}
                          label="Verificado"
                          size="small"
                          sx={{
                            backgroundColor: '#8BC34A',
                            color: '#ffffff',
                            fontSize: '0.7rem',
                            height: 20,
                          }}
                        />
                      )}
                    </Box>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BadgeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Rol
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedUser.role}
                    size="small"
                    sx={{
                      backgroundColor: getRoleColor(selectedUser.role) + '20',
                      color: getRoleColor(selectedUser.role),
                      fontWeight: 600,
                    }}
                  />
                </Grid>
                {selectedUser.birthDate && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Fecha de Nacimiento
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {formatDate(selectedUser.birthDate)}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Género
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                    {getGenderLabel(selectedUser.gender)}
                  </Typography>
                </Grid>
                {selectedUser.companyName && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <BusinessIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Empresa
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {selectedUser.companyName}
                    </Typography>
                  </Grid>
                )}
                {selectedUser.rfc && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <BadgeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        RFC
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {selectedUser.rfc}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BadgeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Estado
                    </Typography>
                  </Box>
                  <Chip
                    label={selectedUser.status === 'active' ? 'Activo' : 'Inactivo'}
                    size="small"
                    sx={{
                      backgroundColor: selectedUser.status === 'active' ? '#8BC34A' : '#AAAAAA',
                      color: '#ffffff',
                      fontWeight: 600,
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                Información del Sistema
              </Typography>

              <Grid container spacing={3}>
                {selectedUser.createdAt && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Fecha de Creación
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {formatDateTime(selectedUser.createdAt)}
                    </Typography>
                  </Grid>
                )}
                {selectedUser.updatedAt && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Última Actualización
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {formatDateTime(selectedUser.updatedAt)}
                    </Typography>
                  </Grid>
                )}
                {selectedUser.lastLogin && (
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                        Último Acceso
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ color: 'text.primary' }}>
                      {formatDateTime(selectedUser.lastLogin)}
                    </Typography>
                  </Grid>
                )}
              </Grid>
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

      {/* Modal para Crear Usuario */}
      <Dialog
        open={createOpen}
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Nuevo Usuario
          </Typography>
          <IconButton
            onClick={handleCloseCreate}
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
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre Completo"
                  fullWidth
                  required
                  size="small"
                  value={newUser.name}
                  onChange={(e) => handleNewUserChange('name', e.target.value)}
                  helperText="Nombre completo del usuario"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Correo Electrónico"
                  fullWidth
                  required
                  type="email"
                  size="small"
                  value={newUser.email}
                  onChange={(e) => handleNewUserChange('email', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Nombre"
                  fullWidth
                  size="small"
                  value={newUser.firstName}
                  onChange={(e) => handleNewUserChange('firstName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Apellido"
                  fullWidth
                  size="small"
                  value={newUser.lastName}
                  onChange={(e) => handleNewUserChange('lastName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Teléfono"
                  fullWidth
                  size="small"
                  value={newUser.phone}
                  onChange={(e) => handleNewUserChange('phone', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Rol</InputLabel>
                  <Select
                    value={newUser.role}
                    label="Rol"
                    onChange={(e) => handleNewUserChange('role', e.target.value)}
                  >
                    <MenuItem value="Administrador">Administrador</MenuItem>
                    <MenuItem value="Editor">Editor</MenuItem>
                    <MenuItem value="Vendedor">Vendedor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de Nacimiento"
                  type="date"
                  fullWidth
                  size="small"
                  value={newUser.birthDate}
                  onChange={(e) => handleNewUserChange('birthDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Género</InputLabel>
                  <Select
                    value={newUser.gender}
                    label="Género"
                    onChange={(e) => handleNewUserChange('gender', e.target.value)}
                  >
                    <MenuItem value="">No especificado</MenuItem>
                    <MenuItem value="M">Masculino</MenuItem>
                    <MenuItem value="F">Femenino</MenuItem>
                    <MenuItem value="O">Otro</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Empresa"
                  fullWidth
                  size="small"
                  value={newUser.companyName}
                  onChange={(e) => handleNewUserChange('companyName', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="RFC"
                  fullWidth
                  size="small"
                  value={newUser.rfc}
                  onChange={(e) => handleNewUserChange('rfc', e.target.value)}
                  inputProps={{ maxLength: 13 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={newUser.status}
                    label="Estado"
                    onChange={(e) => handleNewUserChange('status', e.target.value as 'active' | 'inactive')}
                  >
                    <MenuItem value="active">Activo</MenuItem>
                    <MenuItem value="inactive">Inactivo</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newUser.emailVerified}
                    onChange={(e) => handleNewUserChange('emailVerified', e.target.checked)}
                    size="small"
                  />
                }
                label="Email Verificado"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={newUser.phoneVerified}
                    onChange={(e) => handleNewUserChange('phoneVerified', e.target.checked)}
                    size="small"
                  />
                }
                label="Teléfono Verificado"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseCreate}
            variant="outlined"
            sx={{
              borderColor: '#555555',
              color: 'text.secondary',
            }}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveNewUser}
            variant="contained"
            disabled={!newUser.name || !newUser.email || !newUser.role}
            sx={{
              backgroundColor: '#E74C3C',
              '&:hover': {
                backgroundColor: '#D92323',
              },
            }}
            startIcon={<SaveIcon />}
          >
            Crear Usuario
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default UsersPage

