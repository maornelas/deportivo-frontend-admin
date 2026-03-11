import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material'
import {
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as PedidosIcon,
  Receipt as ReceiptIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  CalendarToday as CalendarIcon,
  Help as HelpIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'

const menuItems = [
  { text: 'Inicio', icon: <HomeIcon />, path: '/dashboard' },
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Productos', icon: <InventoryIcon />, path: '/productos' },
  { text: 'Pedidos', icon: <PedidosIcon />, path: '/pedidos' },
  { text: 'Facturas', icon: <ReceiptIcon />, path: '/facturas' },
  { text: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
  { text: 'Usuarios', icon: <GroupIcon />, path: '/usuarios' },
  { text: 'Envios', icon: <CalendarIcon />, path: '/envios' },
  { text: 'Centro de Ayuda', icon: <HelpIcon />, path: '/ayuda' },
  { text: 'Configuración', icon: <SettingsIcon />, path: '/configuracion' },
]

const Sidebar = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <Box
          onClick={onClose}
          sx={{
            display: { xs: 'block', md: 'none' },
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1200,
          }}
        />
      )}
      <Box
        sx={{
          width: '260px',
          height: '100vh',
          backgroundColor: '#424242',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: { xs: isOpen ? 0 : '-260px', md: 0 },
          top: 0,
          zIndex: 1300,
          transition: 'left 0.3s ease',
        }}
      >
      <Box
        sx={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: 'white',
            fontWeight: 'bold',
            letterSpacing: '1px',
          }}
        >
          EL DEPORTIVO
        </Typography>
      </Box>

      <List sx={{ flex: 1, paddingTop: '8px' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(item.path)
                  // Cerrar sidebar en móvil al hacer click
                  if (onClose) {
                    onClose()
                  }
                }}
                sx={{
                  padding: '12px 20px',
                  margin: '4px 12px',
                  borderRadius: '8px',
                  backgroundColor: isActive ? '#7b1fa2' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive ? '#7b1fa2' : 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                    minWidth: '40px',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiListItemText-primary': {
                      color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      fontWeight: isActive ? 600 : 400,
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      </Box>
    </>
  )
}

export default Sidebar

