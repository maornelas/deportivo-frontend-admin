import { useCallback, useEffect, useState } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'

import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications'
import { useAuth } from '../contexts/AuthContext'

function fmtDate(v) {
  if (!v) return ''
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('es-MX')
}

export default function Notificaciones() {
  const { canViewPath } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [items, setItems] = useState([])

  const load = useCallback(async () => {
    if (!canViewPath('/notificaciones')) return
    setLoading(true)
    setError('')
    const r = await listNotifications({ page: 1, limit: 50 })
    setLoading(false)
    if (!r.success) {
      setError(r.error || 'Error')
      setItems([])
      return
    }
    setItems(r.data.items || [])
  }, [canViewPath])

  useEffect(() => {
    load()
  }, [load])

  const onRead = async (id) => {
    const r = await markNotificationRead(id)
    if (r.success) load()
  }

  const onReadAll = async () => {
    const r = await markAllNotificationsRead()
    if (r.success) load()
  }

  if (!canViewPath('/notificaciones')) {
    return null
  }

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginTop: { xs: 0, md: '70px' },
          pt: { xs: 2, sm: 3, md: 4 },
          pr: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 2, sm: 3, md: 4 },
          pl: { xs: 2, sm: 3, md: `${SIDEBAR_WIDTH + 32}px` },
          backgroundColor: '#fafafa',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold' }}>
            Notificaciones
          </Typography>
          <Button variant="outlined" onClick={onReadAll} disabled={loading || items.length === 0}>
            Marcar todas como leídas
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper>
          {loading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CircularProgress />
            </Box>
          ) : items.length === 0 ? (
            <Box sx={{ py: 4, px: 2, color: 'text.secondary' }}>No hay notificaciones.</Box>
          ) : (
            <List disablePadding>
              {items.map((n) => (
                <ListItem
                  key={n.id}
                  divider
                  secondaryAction={
                    !n.read ? (
                      <Button size="small" onClick={() => onRead(n.id)}>
                        Marcar leída
                      </Button>
                    ) : null
                  }
                  sx={{ bgcolor: n.read ? 'transparent' : 'action.hover', alignItems: 'flex-start' }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {n.title}
                        </Typography>
                        <Chip size="small" label={n.type} variant="outlined" />
                        {n.read ? <Chip size="small" label="Leída" color="success" variant="outlined" /> : null}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary" display="block" sx={{ mt: 0.5 }}>
                          {n.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {fmtDate(n.createdAt)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
    </Box>
  )
}
