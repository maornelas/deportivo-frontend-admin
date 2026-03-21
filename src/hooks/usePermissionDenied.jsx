import { useState, useCallback, useMemo } from 'react'
import { Snackbar, Alert } from '@mui/material'

const MSG = 'No tienes permisos suficientes para realizar esta acción.'

/**
 * Snackbar superior derecha cuando una acción RBAC no está permitida.
 */
export function usePermissionDenied() {
  const [open, setOpen] = useState(false)

  const showDenied = useCallback(() => {
    setOpen(true)
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
        <Alert severity="warning" variant="filled" onClose={() => setOpen(false)} sx={{ boxShadow: 3 }}>
          {MSG}
        </Alert>
      </Snackbar>
    ),
    [open],
  )

  return { showDenied, permissionDeniedSnackbar: snackbar }
}
