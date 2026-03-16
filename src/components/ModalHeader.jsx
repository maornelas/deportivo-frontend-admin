import { Typography, IconButton, Box } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

const HEADER_BG = '#7b1fa2'
const HEADER_HOVER = '#6a1b9a'

/**
 * Encabezado unificado para modales. Fondo según paleta (púrpura), título en blanco y botón cerrar.
 * @param {string} title - Título del modal
 * @param {function} onClose - Callback al cerrar (opcional; si no se pasa, no se muestra el botón)
 */
export default function ModalHeader({ title, onClose }) {
  return (
    <Box
      sx={{
        background: HEADER_BG,
        color: '#fff',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '12px 12px 0 0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <Typography variant="h6" component="span" sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
        {title}
      </Typography>
      {onClose && (
        <IconButton
          size="small"
          onClick={onClose}
          sx={{
            color: '#fff',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.12)',
              color: '#fff',
            },
          }}
          aria-label="Cerrar"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  )
}

export { HEADER_BG, HEADER_HOVER }
