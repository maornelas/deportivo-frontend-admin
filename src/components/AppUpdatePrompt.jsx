import { Snackbar, Button, Typography, Box, Paper, IconButton } from '@mui/material'
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt'
import CloseIcon from '@mui/icons-material/Close'
import { useState } from 'react'
import { useAppUpdateCheck } from '../hooks/useAppUpdateCheck'
import { APP_VERSION } from '../config/app'

export default function AppUpdatePrompt() {
  const { updateAvailable, remoteVersion, applyUpdate } = useAppUpdateCheck()
  const [dismissed, setDismissed] = useState(false)

  if (!updateAvailable || dismissed) return null

  const nextLabel =
    remoteVersion?.version && remoteVersion.version !== APP_VERSION
      ? remoteVersion.version
      : 'la nueva versión'

  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      sx={{
        bottom: { xs: 16, sm: 24 },
        right: { xs: 16, sm: 24 },
        left: 'auto',
      }}
    >
      <Paper
        elevation={8}
        sx={{
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          p: { xs: 1.5, sm: 2 },
          maxWidth: { xs: 300, sm: 360 },
          borderRadius: 2,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 1.25,
          boxShadow: '0 8px 28px rgba(123, 31, 162, 0.45)',
        }}
      >
        <SystemUpdateAltIcon sx={{ fontSize: 22, mt: 0.25, flexShrink: 0, opacity: 0.95 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.35, color: 'inherit' }}>
            Hay una actualización disponible
          </Typography>
          <Typography
            variant="caption"
            sx={{ display: 'block', mt: 0.5, lineHeight: 1.4, color: 'rgba(255,255,255,0.88)' }}
          >
            Estás en {APP_VERSION}. Pulsa Actualizar para cargar {nextLabel}.
          </Typography>
          <Button
            size="small"
            variant="contained"
            onClick={applyUpdate}
            sx={{
              mt: 1.25,
              bgcolor: '#fff',
              color: 'primary.main',
              fontWeight: 700,
              textTransform: 'none',
              boxShadow: 'none',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.92)', boxShadow: 1 },
            }}
          >
            Actualizar
          </Button>
        </Box>
        <IconButton
          size="small"
          aria-label="Cerrar aviso"
          onClick={() => setDismissed(true)}
          sx={{
            color: 'rgba(255,255,255,0.85)',
            mt: -0.5,
            mr: -0.5,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.12)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Paper>
    </Snackbar>
  )
}
