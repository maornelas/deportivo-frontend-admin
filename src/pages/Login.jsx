import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Container,
  TextField,
  Button,
  Checkbox,
  Typography,
  Link,
  InputAdornment,
  IconButton,
  CircularProgress,
  Paper,
} from '@mui/material'
import { Visibility, VisibilityOff, DarkMode, LightMode } from '@mui/icons-material'
import Logo from '../components/Logo'
import logoImage from '../assets/images/logo.png'
import logoGrisImage from '../assets/images/logo_gris.png'
import { useAuth } from '../contexts/AuthContext'
import { useTheme as useAppTheme } from '../contexts/ThemeContext'

const Login = () => {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { mode, toggleTheme } = useAppTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!usuario.trim() || !password) {
      setError('Ingrese usuario y contraseña')
      return
    }
    setSubmitting(true)
    const result = await login(usuario.trim(), password)
    setSubmitting(false)
    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.error || 'Usuario o contraseña incorrectos')
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 3,
        px: 2,
      }}
    >
      {/* Toggle modo oscuro - esquina superior derecha */}
      <IconButton
        onClick={toggleTheme}
        aria-label={mode === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1300,
          bgcolor: 'background.paper',
          color: 'text.secondary',
          boxShadow: 2,
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        {mode === 'dark' ? <LightMode /> : <DarkMode />}
      </IconButton>

      <Container maxWidth="sm">
        <Paper
          elevation={mode === 'dark' ? 0 : 2}
          sx={{
            p: { xs: 3, sm: 4 },
            borderRadius: 2,
            bgcolor: 'background.paper',
            border: mode === 'dark' ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          {/* Logo centrado; en modo claro usa logo_gris.png */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              mb: 4,
            }}
          >
            <Logo
              variant={mode === 'dark' ? 'dark' : 'light'}
              imageSrc={mode === 'light' ? logoGrisImage : logoImage}
              size="large"
            />
            <Typography
              variant="overline"
              sx={{
                color: 'text.secondary',
                letterSpacing: 1.0,
                fontSize: '1rem',
                mt: 0,
              }}
            >
              Panel de administración
            </Typography>
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              textAlign: 'center',
              color: 'text.primary',
              mb: 0.5,
            }}
          >
            Iniciar sesión
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              textAlign: 'center',
              mb: 3,
            }}
          >
            Ingrese sus credenciales para acceder
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            {error && (
              <Typography
                sx={{
                  color: 'error.main',
                  fontSize: '14px',
                  mb: 2,
                  textAlign: 'center',
                }}
              >
                {error}
              </Typography>
            )}
            <TextField
              fullWidth
              label="Usuario (email)"
              variant="outlined"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              sx={{ mb: 2 }}
              size="medium"
            />
            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      onClick={() => setShowPassword((s) => !s)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
              size="medium"
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  Recordarme
                </Typography>
              </Box>
              <Link
                href="#"
                variant="body2"
                sx={{
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                Olvidé mi contraseña
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              size="large"
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {submitting ? 'Validando…' : 'Iniciar sesión'}
            </Button>
          </Box>

          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              display: 'block',
              textAlign: 'center',
              mt: 3,
            }}
          >
            Condiciones de uso · Políticas de privacidad
          </Typography>
        </Paper>
      </Container>
    </Box>
  )
}

export default Login
