import { Box, Typography, IconButton } from '@mui/material'
import { Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material'
import { EXPEDIENTE_ACCENT, EXPEDIENTE_ACCENT_HOVER } from '../../utils/expedienteTheme'
import { formatExpedienteDateTime } from '../../utils/expedienteDisplay'

export default function ExpedientePopularCard({ row, label, isFavorite, onOpen, onToggleFavorite, layout = 'carousel' }) {
  const isSidebar = layout === 'sidebar'
  return (
    <Box
      sx={{
        position: 'relative',
        minWidth: isSidebar ? '100%' : { xs: 100, lg: 106, xl: 112 },
        maxWidth: isSidebar ? '100%' : { xs: 100, lg: 106, xl: 112 },
        flex: isSidebar ? '0 0 auto' : '0 0 auto',
        width: isSidebar ? '100%' : 'auto',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: { xs: 6, lg: 7 },
          left: { xs: 8, lg: 9 },
          width: { xs: 30, lg: 32, xl: 34 },
          height: { xs: 8, lg: 8, xl: 9 },
          bgcolor: EXPEDIENTE_ACCENT_HOVER,
          borderRadius: '5px 5px 0 0',
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
          borderRadius: '7px',
          minHeight: isSidebar ? { xs: 96, lg: 100 } : { xs: 108, lg: 112, xl: 116 },
          p: { xs: 1, lg: 1.1, xl: 1.15 },
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
            p: 0.15,
            ml: -0.35,
            mt: -0.35,
          }}
        >
          {isFavorite ? (
            <StarIcon sx={{ fontSize: { xs: 14, lg: 15, xl: 16 } }} />
          ) : (
            <StarBorderIcon sx={{ fontSize: { xs: 14, lg: 15, xl: 16 } }} />
          )}
        </IconButton>

        <Box sx={{ mt: 'auto' }}>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.75)',
              fontSize: { xs: '0.58rem', lg: '0.6rem', xl: '0.62rem' },
              lineHeight: 1.2,
              mb: 0.3,
            }}
          >
            {formatExpedienteDateTime(row.operationDate ?? row.createdAt)}
          </Typography>
          <Typography
            sx={{
              color: '#fff',
              fontWeight: 600,
              fontSize: { xs: '0.66rem', lg: '0.68rem', xl: '0.72rem' },
              lineHeight: 1.2,
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
