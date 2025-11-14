import { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Link,
  Paper,
} from '@mui/material'

interface LoginPageProps {
  onLogin: () => void
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica de autenticación
    onLogin()
  }

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
      }}
    >
      {/* Left Section - Branding */}
      <Box
        sx={{
          flex: 1,
          background: 'linear-gradient(135deg, #1565C0 0%, #1976D2 50%, #2196F3 100%)',
          position: 'relative',
          display: { xs: 'none', md: 'flex' },
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3,
          }}
        />
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            textAlign: 'center',
            color: '#ffffff',
            px: 4,
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 4,
            }}
          >
            <img
              src="https://s3.us-east-1.amazonaws.com/deportivo.ketxal.com/images-prod/logo.png"
              alt="El Deportivo Logo"
              style={{
                height: '120px',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
          </Box>
          <Typography
            variant="body1"
            sx={{
              fontSize: '1.1rem',
              opacity: 0.9,
            }}
          >
            Cientos de marcas y miles de refacciones
          </Typography>
        </Box>
      </Box>

      {/* Right Section - Login Form */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          px: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            maxWidth: 400,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              textAlign: 'center',
              color: '#333333',
            }}
          >
            BIENVENIDO
          </Typography>
          <Typography
            variant="body1"
            sx={{
              textAlign: 'center',
              color: '#555555',
              mb: 4,
            }}
          >
            Inicie sesión en su cuenta
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Usuario"
              variant="standard"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiInput-underline:before': {
                  borderBottomColor: '#E0E0E0',
                },
                '& .MuiInput-underline:hover:before': {
                  borderBottomColor: '#AAAAAA',
                },
                '& .MuiInput-underline:after': {
                  borderBottomColor: '#E74C3C',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#E74C3C',
                },
              }}
            />
            <TextField
              fullWidth
              label="Contraseña"
              type="password"
              variant="standard"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiInput-underline:before': {
                  borderBottomColor: '#E0E0E0',
                },
                '& .MuiInput-underline:hover:before': {
                  borderBottomColor: '#AAAAAA',
                },
                '& .MuiInput-underline:after': {
                  borderBottomColor: '#E74C3C',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#E74C3C',
                },
              }}
            />

            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 4,
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    sx={{
                      color: '#E74C3C',
                      '&.Mui-checked': {
                        color: '#E74C3C',
                      },
                    }}
                  />
                }
                label="Recordarme"
                sx={{
                  '& .MuiFormControlLabel-label': {
                    fontSize: '0.875rem',
                    color: '#555555',
                  },
                }}
              />
              <Link
                href="#"
                sx={{
                  fontSize: '0.875rem',
                  color: '#E74C3C',
                  textDecoration: 'none',
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
              sx={{
                backgroundColor: '#333333',
                color: '#ffffff',
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#444444',
                },
              }}
            >
              Iniciar Sesión
            </Button>
          </Box>

          <Box
            sx={{
              mt: 4,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: '#AAAAAA',
                fontSize: '0.75rem',
              }}
            >
              Condiciones de Uso. Políticas de Privacidad
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default LoginPage
