import {
  Box,
  IconButton,
  Avatar,
  Typography,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  ArrowDropDown as ArrowDropDownIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
  const { mode, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [anchorEl, setAnchorEl] = useState(null)

  const displayName =
    user?.firstName || user?.lastName
      ? [user.firstName, user.lastName].filter(Boolean).join(' ')
      : user?.email || 'Admin'

  const initials = displayName
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD'

  const handleProfileClick = (e) => setAnchorEl(e.currentTarget)
  const handleClose = () => setAnchorEl(null)
  const handlePerfil = () => {
    handleClose()
    navigate('/perfil')
  }
  const handleLogout = () => {
    handleClose()
    logout()
    navigate('/login')
  }

  return (
    <Box
      sx={{
        height: '70px',
        bgcolor: 'background.paper',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'fixed',
        top: 0,
        left: { xs: 0, md: '260px' },
        right: 0,
        zIndex: 1000,
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'left 0.3s ease',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton
          onClick={onMenuClick}
          sx={{ display: { xs: 'flex', md: 'none' }, color: 'text.secondary' }}
        >
          <MenuIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton onClick={toggleTheme} aria-label={mode === 'dark' ? 'Modo claro' : 'Modo oscuro'} color="inherit" size="small">
          {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          }}
          onClick={handleProfileClick}
        >
          <Avatar
            src={user?.avatarUrl}
            sx={{
              width: '36px',
              height: '36px',
              bgcolor: 'secondary.main',
            }}
          >
            {initials}
          </Avatar>
          <Typography sx={{ color: 'text.primary', fontSize: '14px' }}>
            {displayName}
          </Typography>
          <ArrowDropDownIcon color="action" />
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={handlePerfil}>
            <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
            Perfil
          </MenuItem>
          <MenuItem onClick={handleLogout}>
            <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  )
}

export default Header
