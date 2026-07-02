import { Box, Typography, IconButton } from '@mui/material'
import { Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material'
import { EXPEDIENTE_ACCENT, cardHoverShadow } from '../../utils/expedienteTheme'

export default function ExpedienteDirectoryCard({
  row,
  label,
  isFavorite,
  onOpen,
  onToggleFavorite,
  subtitle,
}) {
  return (
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
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
        borderRadius: '9px',
        minHeight: { xs: 128, lg: 140, xl: 152 },
        p: { xs: 1.75, lg: 2, xl: 2.25 },
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        textAlign: 'left',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          transform: 'scale(1.02)',
          borderColor: 'text.disabled',
          boxShadow: cardHoverShadow,
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
          position: 'absolute',
          top: { xs: 8, lg: 10 },
          left: { xs: 8, lg: 10 },
          color: isFavorite ? '#F5A623' : 'action.disabled',
          p: 0.25,
        }}
      >
        {isFavorite ? (
          <StarIcon sx={{ fontSize: { xs: 17, lg: 18, xl: 20 } }} />
        ) : (
          <StarBorderIcon sx={{ fontSize: { xs: 17, lg: 18, xl: 20 } }} />
        )}
      </IconButton>

      <Box sx={{ flex: 1, minHeight: { xs: 18, lg: 22 } }} />

      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: { xs: '0.68rem', lg: '0.72rem', xl: '0.75rem' },
          lineHeight: 1.25,
          mb: 0.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {subtitle}
      </Typography>
      <Typography
        sx={{
          color: 'text.primary',
          fontWeight: 700,
          fontSize: { xs: '0.82rem', lg: '0.86rem', xl: '0.92rem' },
          lineHeight: 1.28,
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
  )
}
