import { useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Button,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import CancelIcon from '@mui/icons-material/Cancel'
import EditIcon from '@mui/icons-material/Edit'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import PhoneIcon from '@mui/icons-material/Phone'
import CalendarTodayIcon from '@mui/icons-material/CalendarToday'
import BusinessIcon from '@mui/icons-material/Business'
import BadgeIcon from '@mui/icons-material/Badge'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import LockIcon from '@mui/icons-material/Lock'

// Datos del usuario logueado (Mario Lona)
const currentUser = {
  id: 1,
  name: 'Mario Lona',
  email: 'mario.lona@example.com',
  role: 'Administrador',
  avatar: 'ML',
  status: 'active' as const,
  firstName: 'Mario',
  lastName: 'Lona',
  phone: '+52 477 123 4567',
  companyName: 'El Deportivo',
  rfc: 'ABC123456789',
  birthDate: '1985-05-15',
  gender: 'M' as 'M' | 'F' | 'O',
  emailVerified: true,
  phoneVerified: true,
  createdAt: '2023-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  lastLogin: '2024-12-15T14:30:00Z',
}

function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    phone: currentUser.phone,
    companyName: currentUser.companyName,
    rfc: currentUser.rfc,
    birthDate: currentUser.birthDate,
    gender: currentUser.gender,
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    setEditedData({
      name: currentUser.name,
      email: currentUser.email,
      firstName: currentUser.firstName,
      lastName: currentUser.lastName,
      phone: currentUser.phone,
      companyName: currentUser.companyName,
      rfc: currentUser.rfc,
      birthDate: currentUser.birthDate,
      gender: currentUser.gender,
    })
    setIsEditing(false)
  }

  const handleSave = () => {
    // Aquí se guardarían los cambios en el backend
    setIsEditing(false)
    // Actualizar currentUser con editedData
  }

  const handleChange = (field: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value,
    }))
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Mi Perfil
        </Typography>
        {!isEditing ? (
          <Button
            startIcon={<EditIcon />}
            onClick={handleEdit}
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
            Editar Perfil
          </Button>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              startIcon={<SaveIcon />}
              onClick={handleSave}
              variant="contained"
              sx={{
                backgroundColor: '#E74C3C',
                '&:hover': {
                  backgroundColor: '#D92323',
                },
              }}
            >
              Guardar Cambios
            </Button>
            <Button
              startIcon={<CancelIcon />}
              onClick={handleCancel}
              variant="outlined"
              sx={{
                borderColor: 'text.secondary',
                color: 'text.secondary',
              }}
            >
              Cancelar
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={3}>
        {/* Información Principal */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Avatar
                sx={{
                  width: 120,
                  height: 120,
                  bgcolor: '#E74C3C',
                  fontSize: '3rem',
                  fontWeight: 600,
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {currentUser.avatar}
              </Avatar>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
                {currentUser.name}
              </Typography>
              <Chip
                label={currentUser.role}
                sx={{
                  backgroundColor: getRoleColor(currentUser.role) + '20',
                  color: getRoleColor(currentUser.role),
                  fontWeight: 600,
                  mb: 2,
                }}
              />
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {currentUser.email}
                  </Typography>
                  {currentUser.emailVerified && (
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
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {currentUser.phone}
                  </Typography>
                  {currentUser.phoneVerified && (
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
              </Box>
            </CardContent>
          </Card>

          {/* Cambiar Contraseña */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LockIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Seguridad
                </Typography>
              </Box>
              <Button
                variant="outlined"
                fullWidth
                sx={{
                  borderColor: '#E74C3C',
                  color: '#E74C3C',
                  '&:hover': {
                    borderColor: '#D92323',
                    backgroundColor: '#FFF5F5',
                  },
                }}
              >
                Cambiar Contraseña
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Información Detallada */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                Información Personal
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Nombre Completo
                    </Typography>
                  </Box>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editedData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {currentUser.name}
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
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      type="email"
                      value={editedData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                        {currentUser.email}
                      </Typography>
                      {currentUser.emailVerified && (
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
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Nombre
                    </Typography>
                  </Box>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editedData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {currentUser.firstName}
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
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editedData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {currentUser.lastName}
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
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editedData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                        {currentUser.phone}
                      </Typography>
                      {currentUser.phoneVerified && (
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
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarTodayIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Fecha de Nacimiento
                    </Typography>
                  </Box>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={editedData.birthDate}
                      onChange={(e) => handleChange('birthDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {formatDate(currentUser.birthDate)}
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
                  {isEditing ? (
                    <FormControl fullWidth size="small">
                      <Select
                        value={editedData.gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                      >
                        <MenuItem value="M">Masculino</MenuItem>
                        <MenuItem value="F">Femenino</MenuItem>
                        <MenuItem value="O">Otro</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {getGenderLabel(currentUser.gender)}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BusinessIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Empresa
                    </Typography>
                  </Box>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editedData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {currentUser.companyName}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BadgeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      RFC
                    </Typography>
                  </Box>
                  {isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editedData.rfc}
                      onChange={(e) => handleChange('rfc', e.target.value)}
                      inputProps={{ maxLength: 13 }}
                    />
                  ) : (
                    <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                      {currentUser.rfc}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: 'text.primary' }}>
                Información del Sistema
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BadgeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Rol
                    </Typography>
                  </Box>
                  <Chip
                    label={currentUser.role}
                    sx={{
                      backgroundColor: getRoleColor(currentUser.role) + '20',
                      color: getRoleColor(currentUser.role),
                      fontWeight: 600,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BadgeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Estado
                    </Typography>
                  </Box>
                  <Chip
                    label={currentUser.status === 'active' ? 'Activo' : 'Inactivo'}
                    sx={{
                      backgroundColor: currentUser.status === 'active' ? '#8BC34A' : '#AAAAAA',
                      color: '#ffffff',
                      fontWeight: 600,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Fecha de Creación
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                    {formatDateTime(currentUser.createdAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Última Actualización
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'text.primary', mb: 2 }}>
                    {formatDateTime(currentUser.updatedAt)}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTimeIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      Último Acceso
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ color: 'text.primary' }}>
                    {formatDateTime(currentUser.lastLogin)}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProfilePage

