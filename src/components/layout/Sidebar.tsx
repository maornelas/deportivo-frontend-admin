import { useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/BarChart'
import InventoryIcon from '@mui/icons-material/Inventory2'
import ReceiptIcon from '@mui/icons-material/Receipt'
import PeopleIcon from '@mui/icons-material/People'
import PersonIcon from '@mui/icons-material/Person'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import NotificationsIcon from '@mui/icons-material/Notifications'

const menuItems = [
  { path: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { path: '/productos', label: 'Productos', icon: InventoryIcon },
  { path: '/facturas', label: 'Facturas', icon: ReceiptIcon },
  { path: '/clientes', label: 'Clientes', icon: PeopleIcon },
  { path: '/usuarios', label: 'Usuarios', icon: PersonIcon },
  { path: '/envios', label: 'Envios', icon: LocalShippingIcon },
  { path: '/notificaciones', label: 'Notificaciones', icon: NotificationsIcon },
]

interface SidebarProps {
  open: boolean
}

function Sidebar({ open }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Box
      sx={{
        width: open ? 200 : 70,
        minWidth: open ? 200 : 70,
        maxWidth: open ? 200 : 70,
        backgroundColor: '#374151',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          p: open ? 2.5 : 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: open ? 'flex-start' : 'center',
        }}
      >
        {open ? (
          <img
            src="https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-prod/logo.png"
            alt="El Deportivo Logo"
            style={{
              height: '40px',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        ) : (
          <img
            src="https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-prod/logo.png"
            alt="El Deportivo Logo"
            style={{
              height: '32px',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
        )}
      </Box>

      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item, index) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path

          const listItemButton = (
            <ListItemButton
              onClick={() => navigate(item.path)}
              sx={{
                mx: 1,
                borderRadius: 2,
                  backgroundColor: isActive ? '#E74C3C' : 'transparent',
                minHeight: 48,
                justifyContent: open ? 'flex-start' : 'center',
                px: open ? 2 : 1,
                '&:hover': {
                  backgroundColor: isActive ? '#E74C3C' : 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: open ? 40 : 'auto',
                  color: '#ffffff',
                  justifyContent: 'center',
                }}
              >
                <Icon />
              </ListItemIcon>
              {open && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400,
                    noWrap: true,
                  }}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                />
              )}
            </ListItemButton>
          )

          return (
            <ListItem key={`${item.path}-${index}`} disablePadding sx={{ mb: 0.5 }}>
              {open ? (
                listItemButton
              ) : (
                <Tooltip title={item.label} placement="right" arrow>
                  {listItemButton}
                </Tooltip>
              )}
            </ListItem>
          )
        })}
      </List>
    </Box>
  )
}

export default Sidebar

