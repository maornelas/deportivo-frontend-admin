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
  Divider,
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  PointOfSale as VentasIcon,
  ShoppingCart as ComprasIcon,
  MoneyOff as GastosIcon,
  RequestQuote as CotizacionIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  MenuBook as CatalogosIcon,
} from '@mui/icons-material'

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Inventario', icon: <InventoryIcon />, path: '/inventario' },
  { text: 'Cotizaciones', icon: <CotizacionIcon />, path: '/cotizaciones' },
  { text: 'Ventas', icon: <VentasIcon />, path: '/ventas' },
  { text: 'Compras', icon: <ComprasIcon />, path: '/compras' },
  { text: 'Gastos', icon: <GastosIcon />, path: '/gastos' },
  { type: 'divider' },
  { text: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
  { text: 'Usuarios', icon: <GroupIcon />, path: '/usuarios' },
  { type: 'divider' },
  { text: 'Catálogos', icon: <CatalogosIcon />, path: '/catalogos' },
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
        {menuItems.map((item, index) => {
          if (item.type === 'divider') {
            return <Divider key={`sidebar-divider-${index}`} sx={{ borderColor: 'rgba(255, 255, 255, 0.2)', margin: '12px 16px' }} />
          }
          const isActive = location.pathname === item.path
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => {
                  navigate(item.path)
                  if (onClose) onClose()
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
                <ListItemIcon sx={{ color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)', minWidth: '40px' }}>
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

