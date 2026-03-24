import { useState, useEffect, useRef } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { getUserById, updateUser } from '../api/user'

const Perfil = () => {
  const { user, updateUserProfile } = useAuth()
  const fileInputRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    setLoading(true)
    setError('')
    getUserById(user.id)
      .then((res) => {
        if (cancelled) return
        setLoading(false)
        if (!res.success) {
          setError(res.error || 'Error al cargar el perfil')
          return
        }
        const u = res.data
        setForm({
          firstName: u.firstName ?? '',
          lastName: u.lastName ?? '',
          phone: u.phone ?? '',
          email: u.email ?? user?.email ?? '',
        })
      })
      .catch((err) => {
        if (!cancelled) {
          setLoading(false)
          setError(err?.message || 'Error de conexión')
        }
      })
    return () => { cancelled = true }
  }, [user?.id, user?.email])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
    setSuccess('')
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !file.type.startsWith('image/') || !user?.id) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result
      updateUserProfile({ avatarUrl: dataUrl })
      setSuccess('Foto de perfil actualizada')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user?.id) return
    setSaving(true)
    setError('')
    setSuccess('')
    const payload = {
      firstName: form.firstName.trim() || undefined,
      lastName: form.lastName.trim() || undefined,
      phone: form.phone.trim() || undefined,
    }
    const result = await updateUser(user.id, payload)
    setSaving(false)
    if (!result.success) {
      setError(result.error || 'Error al guardar')
      return
    }
    setSuccess('Perfil actualizado correctamente')
    const updated = result.data
    updateUserProfile({
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      email: updated.email,
    })
  }

  const handleMenuClick = () => setSidebarOpen(!sidebarOpen)
  const handleSidebarClose = () => setSidebarOpen(false)

  const initials = [form.firstName, form.lastName]
    .filter(Boolean)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || (user?.email || 'A').slice(0, 2).toUpperCase()

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginTop: { xs: 0, md: '70px' },
          pt: { xs: '16px', sm: '24px', md: '32px' },
          pr: { xs: '16px', sm: '24px', md: '32px' },
          pb: { xs: '16px', sm: '24px', md: '32px' },
          pl: { xs: '16px', sm: '24px', md: `${SIDEBAR_WIDTH + 32}px` },
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={handleMenuClick} />
        <Typography
          variant="h4"
          sx={{
            color: '#424242',
            fontWeight: 'bold',
            marginBottom: 2,
            fontSize: { xs: '24px', sm: '28px', md: '32px' },
          }}
        >
          Mi perfil
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ p: 3, width: '100%', maxWidth: 560, boxSizing: 'border-box' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                {success}
              </Alert>
            )}

            {/* Foto de perfil */}
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={user?.avatarUrl}
                sx={{ width: 80, height: 80, backgroundColor: '#7b1fa2' }}
              >
                {initials}
              </Avatar>
              <Box>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ textTransform: 'none' }}
                >
                  Cambiar foto de perfil
                </Button>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  JPG, PNG o GIF. Solo se guarda en este dispositivo.
                </Typography>
              </Box>
            </Box>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                '& .MuiTextField-root': { width: '100%', minWidth: 0 },
              }}
            >
              <TextField
                fullWidth
                label="Nombre"
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Apellidos"
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Teléfono"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Email"
                name="email"
                value={form.email}
                variant="outlined"
                InputProps={{ readOnly: true }}
                helperText="El correo no se puede modificar desde aquí."
              />
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                sx={{
                  backgroundColor: '#424242',
                  alignSelf: 'flex-start',
                  '&:hover': { backgroundColor: '#616161' },
                }}
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  )
}

export default Perfil
