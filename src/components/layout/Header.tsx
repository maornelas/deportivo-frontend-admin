import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Typography,
  Menu,
  MenuItem,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import MenuIcon from '@mui/icons-material/Menu'
import LanguageIcon from '@mui/icons-material/Language'
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline'
import NotificationsIcon from '@mui/icons-material/Notifications'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import { useState } from 'react'

interface HeaderProps {
  onLogout: () => void
  onMenuClick: () => void
}

function Header({ onLogout, onMenuClick }: HeaderProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <Box
      sx={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #E0E0E0',
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
            color: '#555555',
            '&:hover': {
              backgroundColor: '#f5f5f5',
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
                <SearchIcon sx={{ color: '#AAAAAA' }} />
              </InputAdornment>
            ),
          }}
          sx={{
            width: 300,
            '& .MuiOutlinedInput-root': {
              backgroundColor: '#f5f5f5',
              '& fieldset': {
                borderColor: '#E0E0E0',
              },
              '&:hover fieldset': {
                borderColor: '#AAAAAA',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#E74C3C',
              },
            },
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton size="small" sx={{ color: '#555555' }}>
          <LanguageIcon />
        </IconButton>
        <IconButton size="small" sx={{ color: '#555555' }}>
          <ChatBubbleOutlineIcon />
        </IconButton>
        <IconButton
          size="small"
          sx={{
            color: '#555555',
            position: 'relative',
          }}
        >
          <NotificationsIcon />
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#FFA500',
            }}
          />
        </IconButton>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
          }}
          onClick={handleClick}
        >
          <Typography sx={{ color: '#333333', fontWeight: 500 }}>
            Mario Lona
          </Typography>
          <KeyboardArrowDownIcon sx={{ color: '#555555' }} />
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
          <MenuItem onClick={handleClose}>Perfil</MenuItem>
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

