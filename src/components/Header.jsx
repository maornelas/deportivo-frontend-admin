import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Typography,
  Badge,
  Menu,
  MenuItem,
} from '@mui/material'
import {
  Search as SearchIcon,
  Language as LanguageIcon,
  Chat as ChatIcon,
  Notifications as NotificationsIcon,
  ArrowDropDown as ArrowDropDownIcon,
  Menu as MenuIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth()
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
  const handleLogout = () => {
    handleClose()
    logout()
    navigate('/login')
  }

  return (
      <Box
      sx={{
        height: '70px',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'fixed',
        top: 0,
        left: { xs: 0, md: '260px' },
        right: 0,
        zIndex: 1000,
        borderBottom: '1px solid #e0e0e0',
        transition: 'left 0.3s ease',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton
          onClick={onMenuClick}
          sx={{
            display: { xs: 'block', md: 'none' },
            color: '#757575',
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
              <SearchIcon sx={{ color: '#757575' }} />
            </InputAdornment>
          ),
        }}
        sx={{
          width: { xs: '200px', sm: '250px', md: '300px' },
          backgroundColor: 'white',
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#e0e0e0',
            },
            '&:hover fieldset': {
              borderColor: '#bdbdbd',
            },
          },
        }}
      />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton>
          <LanguageIcon sx={{ color: '#757575' }} />
        </IconButton>
        <IconButton>
          <ChatIcon sx={{ color: '#757575' }} />
        </IconButton>
        <IconButton>
          <Badge badgeContent={3} color="error">
            <NotificationsIcon sx={{ color: '#757575' }} />
          </Badge>
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
            sx={{
              width: '36px',
              height: '36px',
              backgroundColor: '#7b1fa2',
            }}
          >
            {initials}
          </Avatar>
          <Typography sx={{ color: '#424242', fontSize: '14px' }}>
            {displayName}
          </Typography>
          <ArrowDropDownIcon sx={{ color: '#757575' }} />
        </Box>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
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

