import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Typography,
  Menu,
  MenuItem,
  Tooltip,
  Divider,
  Button,
  Badge,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import MenuIcon from '@mui/icons-material/Menu'
import NotificationsIcon from '@mui/icons-material/Notifications'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import CancelIcon from '@mui/icons-material/Cancel'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'

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

// Datos mock de notificaciones (últimas 5)
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
]

interface HeaderProps {
  onLogout: () => void
  onMenuClick: () => void
}

function Header({ onLogout, onMenuClick }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null)
  const { mode, toggleMode } = useTheme()
  const navigate = useNavigate()

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget)
  }

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null)
  }

  const handleViewAll = () => {
    handleNotificationClose()
    navigate('/notificaciones')
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'purchase':
        return <ShoppingCartIcon fontSize="small" />
      case 'payment':
        return <CheckCircleIcon fontSize="small" />
      case 'shipping':
        return <LocalShippingIcon fontSize="small" />
      case 'cancellation':
        return <CancelIcon fontSize="small" />
      default:
        return <NotificationsIcon fontSize="small" />
    }
  }

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'purchase':
        return '#2196F3'
      case 'payment':
        return '#8BC34A'
      case 'shipping':
        return '#FF9800'
      case 'cancellation':
        return '#E74C3C'
      default:
        return '#555555'
    }
  }

  const formatNotificationDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (minutes < 1) return 'Hace un momento'
    if (minutes < 60) return `Hace ${minutes} min`
    if (hours < 24) return `Hace ${hours} h`
    if (days < 7) return `Hace ${days} días`
    return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }

  const newNotificationsCount = mockNotifications.filter(n => n.status === 'new').length

  return (
    <Box
      sx={{
        backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
        borderBottom: `1px solid ${mode === 'light' ? '#E0E0E0' : '#333333'}`,
        px: 3,
        py: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton
          onClick={onMenuClick}
          sx={{
            color: mode === 'light' ? '#555555' : '#ffffff',
            '&:hover': {
              backgroundColor: mode === 'light' ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          <MenuIcon />
        </IconButton>
        <TextField
          placeholder="Buscar"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: 300,
            '& .MuiOutlinedInput-root': {
              backgroundColor: mode === 'light' ? '#f5f5f5' : '#2a2a2a',
              color: mode === 'light' ? '#333333' : '#ffffff',
              '& fieldset': {
                borderColor: mode === 'light' ? '#E0E0E0' : '#444444',
              },
              '&:hover fieldset': {
                borderColor: mode === 'light' ? '#AAAAAA' : '#666666',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#E74C3C',
              },
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title={mode === 'light' ? 'Modo Oscuro' : 'Modo Claro'}>
          <IconButton
            size="small"
            onClick={toggleMode}
            sx={{
              color: mode === 'light' ? '#555555' : '#ffffff',
              '&:hover': {
                backgroundColor: mode === 'light' ? '#f5f5f5' : 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Notificaciones">
          <IconButton
            size="small"
            onClick={handleNotificationClick}
            sx={{
              color: mode === 'light' ? '#555555' : '#ffffff',
              position: 'relative',
            }}
          >
            <Badge badgeContent={newNotificationsCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>
        <Menu
          anchorEl={notificationAnchorEl}
          open={Boolean(notificationAnchorEl)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              width: 360,
              maxHeight: 500,
              mt: 1,
            },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
              Notificaciones
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {mockNotifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No hay notificaciones
                </Typography>
              </Box>
            ) : (
              mockNotifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={handleNotificationClose}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderLeft: notification.status === 'new' ? '3px solid #E74C3C' : 'none',
                    backgroundColor: notification.status === 'new' && mode === 'light' ? '#FFF5F5' : notification.status === 'new' && mode === 'dark' ? 'rgba(231, 76, 60, 0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: mode === 'light' ? '#f5f5f5' : 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 1.5, width: '100%' }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: getNotificationColor(notification.type),
                      }}
                    >
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: notification.status === 'new' ? 600 : 500,
                          color: 'text.primary',
                          mb: 0.5,
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary',
                          fontSize: '0.75rem',
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.disabled',
                            fontSize: '0.7rem',
                          }}
                        >
                          {formatNotificationDate(notification.date)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        >
                          ${notification.amount.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </MenuItem>
              ))
            )}
          </Box>
          <Divider />
          <Box sx={{ p: 1 }}>
            <Button
              fullWidth
              onClick={handleViewAll}
              sx={{
                color: '#E74C3C',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: mode === 'light' ? '#FFF5F5' : 'rgba(231, 76, 60, 0.1)',
                },
              }}
            >
              Ver más
            </Button>
          </Box>
        </Menu>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
          }}
          onClick={handleClick}
        >
          <Typography sx={{ color: mode === 'light' ? '#333333' : '#ffffff', fontWeight: 500 }}>
            Mario Lona
          </Typography>
          <KeyboardArrowDownIcon sx={{ color: mode === 'light' ? '#555555' : '#b0b0b0' }} />
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: '#E74C3C',
            }}
          >
            ML
          </Avatar>
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem
            onClick={() => {
              handleClose()
              navigate('/perfil')
            }}
          >
            Perfil
          </MenuItem>
          <MenuItem onClick={handleClose}>Configuración</MenuItem>
          <MenuItem
            onClick={() => {
              handleClose()
              onLogout()
            }}
          >
            Cerrar Sesión
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}

export default Header

