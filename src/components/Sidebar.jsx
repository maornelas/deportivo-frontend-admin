import { useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { SIDEBAR_WIDTH } from '../config/layout'
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
  History as HistoryIcon,
  Notifications as NotificationsIcon,
  Assessment as ReporteriaIcon,
  FolderShared as ExpedienteIcon,
  LocalShipping as RepartidorIcon,
  People as PeopleIcon,
  Group as GroupIcon,
  MenuBook as CatalogosIcon,
  AdminPanelSettings as RolesIcon,
  OndemandVideo as TutorialesIcon,
} from '@mui/icons-material'

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Inventario', icon: <InventoryIcon />, path: '/inventario' },
  { text: 'Cotizaciones', icon: <CotizacionIcon />, path: '/cotizaciones' },
  { text: 'Ventas', icon: <VentasIcon />, path: '/ventas' },
  { text: 'Compras', icon: <ComprasIcon />, path: '/compras' },
  { text: 'Gastos', icon: <GastosIcon />, path: '/gastos' },
  { type: 'divider' },
  { text: 'Repartidor', icon: <RepartidorIcon />, path: '/repartidor' },
  { type: 'divider' },
  { text: 'Historial', icon: <HistoryIcon />, path: '/historial' },
  { text: 'Notificaciones', icon: <NotificationsIcon />, path: '/notificaciones' },
  { text: 'Reportería', icon: <ReporteriaIcon />, path: '/reporteria' },
  { text: 'Expediente digital', icon: <ExpedienteIcon />, path: '/expediente-digital' },
  { type: 'divider' },
  { text: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
  { text: 'Usuarios', icon: <GroupIcon />, path: '/usuarios' },
  { type: 'divider' },
  { text: 'Catálogos', icon: <CatalogosIcon />, path: '/catalogos' },
  { text: 'Roles y permisos', icon: <RolesIcon />, path: '/roles' },
  { type: 'divider' },
  { text: 'Tutoriales', icon: <TutorialesIcon />, path: '/tutoriales' },
]

const Sidebar = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { canViewPath } = useAuth()

  const visibleMenu = useMemo(() => {
    const out = []
    let pendingDivider = false
    for (const item of menuItems) {
      if (item.type === 'divider') {
        pendingDivider = true
        continue
      }
      if (item.path && canViewPath(item.path)) {
        if (pendingDivider && out.length > 0) {
          out.push({ type: 'divider' })
        }
        pendingDivider = false
        out.push(item)
      }
    }
    return out
  }, [canViewPath])

  return (
    <>
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
          width: SIDEBAR_WIDTH,
          height: '100vh',
          backgroundColor: '#424242',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          left: { xs: isOpen ? 0 : `-${SIDEBAR_WIDTH}px`, md: 0 },
          top: 0,
          zIndex: 1300,
          transition: 'left 0.3s ease',
          boxSizing: 'border-box',
        }}
      >
        <Box
          sx={{
            px: 1.25,
            py: 1.5,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
        <Typography
          variant="subtitle1"
          sx={{
            color: 'white',
            fontWeight: 700,
            letterSpacing: '0.06em',
            fontSize: '0.8rem',
            lineHeight: 1.25,
            textAlign: 'center',
          }}
        >
          EL DEPORTIVO
        </Typography>
      </Box>

      <List dense sx={{ flex: 1, py: 0.5, px: 0 }}>
        {visibleMenu.map((item, index) => {
          if (item.type === 'divider') {
            return (
              <Divider
                key={`sidebar-divider-${index}`}
                sx={{ borderColor: 'rgba(255, 255, 255, 0.15)', my: 0.75, mx: 1 }}
              />
            )
          }
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(`${item.path}/`))
          return (
            <ListItem key={item.text} disablePadding sx={{ px: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path)
                  if (onClose) onClose()
                }}
                sx={{
                  py: 0.65,
                  px: 1,
                  mx: 0,
                  borderRadius: 1,
                  minHeight: 40,
                  backgroundColor: isActive ? '#7b1fa2' : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive ? '#7b1fa2' : 'rgba(255, 255, 255, 0.08)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'white' : 'rgba(255, 255, 255, 0.72)',
                    minWidth: 32,
                    '& svg': { fontSize: 20 },
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    noWrap: true,
                    title: item.text,
                    sx: {
                      color: isActive ? 'white' : 'rgba(255, 255, 255, 0.72)',
                      fontSize: '0.8125rem',
                      fontWeight: isActive ? 600 : 400,
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
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

