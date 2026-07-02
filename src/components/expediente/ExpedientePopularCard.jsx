import { Box, Typography, IconButton } from '@mui/material'
import { Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material'
import { EXPEDIENTE_ACCENT, EXPEDIENTE_ACCENT_HOVER } from '../../utils/expedienteTheme'
import { formatExpedienteDateTime } from '../../utils/expedienteDisplay'

export default function ExpedientePopularCard({ row, label, isFavorite, onOpen, onToggleFavorite }) {
  return (
    <Box
      sx={{
        position: 'relative',
        minWidth: { xs: 128, lg: 138, xl: 148 },
        maxWidth: { xs: 128, lg: 138, xl: 148 },
        flex: '0 0 auto',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 8, lg: 10 },
          left: { xs: 10, lg: 12 },
          width: { xs: 38, lg: 42, xl: 44 },
          height: { xs: 10, lg: 11, xl: 12 },
          bgcolor: EXPEDIENTE_ACCENT_HOVER,
          borderRadius: '6px 6px 0 0',
          zIndex: 0,
        }}
      />
      <Box
        role="button"
        tabIndex={0}
        onClick={() => onOpen(row)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpen(row)
          }
        }}
        sx={{
          position: 'relative',
          zIndex: 1,
          bgcolor: EXPEDIENTE_ACCENT,
          borderRadius: '9px',
          minHeight: { xs: 138, lg: 148, xl: 158 },
          p: { xs: 1.35, lg: 1.5, xl: 1.65 },
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 10px 24px rgba(107, 91, 149, 0.35)',
          },
        }}
      >
        <IconButton
          size="small"
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Marcar favorito'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(row)
          }}
          sx={{
            alignSelf: 'flex-start',
            color: isFavorite ? '#F5C842' : 'rgba(255,255,255,0.75)',
            p: 0.25,
            ml: -0.5,
            mt: -0.5,
          }}
        >
          {isFavorite ? (
            <StarIcon sx={{ fontSize: { xs: 17, lg: 18, xl: 20 } }} />
          ) : (
            <StarBorderIcon sx={{ fontSize: { xs: 17, lg: 18, xl: 20 } }} />
          )}
        </IconButton>

        <Box sx={{ mt: 'auto' }}>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: { xs: '0.65rem', lg: '0.68rem', xl: '0.72rem' },
              lineHeight: 1.25,
              mb: 0.4,
            }}
          >
            {formatExpedienteDateTime(row.operationDate ?? row.createdAt)}
          </Typography>
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 600,
              fontSize: { xs: '0.74rem', lg: '0.78rem', xl: '0.82rem' },
              lineHeight: 1.22,
              wordBreak: 'break-word',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {label}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
