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
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import Logo from '../components/Logo'
import logoImage from '../assets/images/logo.png'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

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
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Left Section - Brand */}
      <Box
        sx={{
          width: '40%',
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          position: 'relative',
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            top: '-50px',
            right: '-50px',
            filter: 'blur(40px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            bottom: '100px',
            left: '-30px',
            filter: 'blur(30px)',
          }}
        />
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Logo variant="light" imageSrc={logoImage} />
          <Typography
            variant="body1"
            sx={{
              color: 'white',
              fontSize: '14px',
              maxWidth: '300px',
              margin: '24px auto 0',
              textAlign: 'center',
            }}
          >
            Cientos de marcas y miles de refacciones
          </Typography>
        </Box>
      </Box>

      {/* Right Section - Login Form */}
      <Box
        sx={{
          width: { xs: '100%', md: '60%' },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'white',
          padding: 4,
        }}
      >
        <Container maxWidth="sm">
          <Typography
            variant="h3"
            sx={{
              color: '#424242',
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: '8px',
              letterSpacing: '1px',
            }}
          >
            BIENVENIDO
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#757575',
              textAlign: 'center',
              marginBottom: '48px',
            }}
          >
            Inicie sesión en su cuenta
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
              variant="standard"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              sx={{
                marginBottom: '32px',
                '& .MuiInput-underline:before': {
                  borderBottomColor: '#e0e0e0',
                },
                '& .MuiInput-underline:hover:before': {
                  borderBottomColor: '#bdbdbd',
                },
              }}
            />
            <TextField
              fullWidth
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              variant="standard"
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
                      sx={{ color: '#757575' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                marginBottom: '24px',
                '& .MuiInput-underline:before': {
                  borderBottomColor: '#e0e0e0',
                },
                '& .MuiInput-underline:hover:before': {
                  borderBottomColor: '#bdbdbd',
                },
              }}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  sx={{
                    color: '#424242',
                    '&.Mui-checked': {
                      color: '#424242',
                    },
                  }}
                />
                <Typography variant="body2" sx={{ color: '#757575' }}>
                  Recordarme
                </Typography>
              </Box>
              <Link
                href="#"
                sx={{
                  color: '#757575',
                  textDecoration: 'none',
                  fontSize: '14px',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Olvide Contraseña
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={submitting}
              sx={{
                backgroundColor: '#424242',
                color: 'white',
                padding: '12px',
                fontSize: '16px',
                fontWeight: '500',
                textTransform: 'none',
                marginBottom: '32px',
                '&:hover': {
                  backgroundColor: '#616161',
                },
              }}
            >
              Iniciar Sesión
            </Button>
          </Box>

          <Typography
            variant="caption"
            sx={{
              color: '#757575',
              fontSize: '12px',
              textAlign: 'right',
              display: 'block',
            }}
          >
            Condiciones de Uso. Políticas de Privacidad
          </Typography>
        </Container>
      </Box>
    </Box>
  )
}

export default Login

