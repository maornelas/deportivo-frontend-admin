import { useState, useCallback, useMemo } from 'react'
import { Snackbar, Alert } from '@mui/material'
import { showBrowserNotificationIfAllowed } from '../utils/browserPush'

/**
 * Notificación tipo “push”: Snackbar arriba a la derecha + Notification del sistema si hay permiso.
 */
export function usePushNotification() {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState('success')

  const notify = useCallback((msg, options = {}) => {
    const {
      severity: sev = 'success',
      browserTitle = 'Deportivo Admin',
      browserBody,
      skipBrowser = false,
    } = options
    setMessage(msg)
    setSeverity(sev)
    setOpen(true)
    if (!skipBrowser) {
      showBrowserNotificationIfAllowed(browserTitle, browserBody ?? msg)
    }
  }, [])

  const snackbar = useMemo(
    () => (
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={(_, reason) => {
          if (reason === 'clickaway') return
          setOpen(false)
        }}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{ mt: { xs: 1, md: 9 } }}
      >
        <Alert
          severity={severity}
          variant="filled"
          onClose={() => setOpen(false)}
          sx={{ boxShadow: 3, width: '100%' }}
        >
          {message}
        </Alert>
      </Snackbar>
    ),
    [open, message, severity],
  )

  return { notify, pushNotificationSnackbar: snackbar }
}
