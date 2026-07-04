import { Box, Typography, IconButton } from '@mui/material'
import { Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material'
import { EXPEDIENTE_ACCENT, cardHoverBg, cardHoverShadow, timelineActiveBorder } from '../../utils/expedienteTheme'
import { formatExpedienteDate } from '../../utils/expedienteDisplay'

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
        borderRadius: '7px',
        minHeight: { xs: 108, lg: 112, xl: 116 },
        p: { xs: 1.1, lg: 1.2, xl: 1.25 },
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        textAlign: 'left',
        position: 'relative',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background-color 0.2s ease',
        '&:hover': (theme) => ({
          bgcolor: cardHoverBg(theme),
          transform: 'scale(1.02)',
          borderColor: timelineActiveBorder(theme),
          boxShadow: cardHoverShadow(theme),
        }),
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
          top: { xs: 5, lg: 6 },
          left: { xs: 5, lg: 6 },
          color: isFavorite ? '#F5A623' : 'action.disabled',
          p: 0.15,
        }}
      >
        {isFavorite ? (
          <StarIcon sx={{ fontSize: { xs: 14, lg: 15, xl: 16 } }} />
        ) : (
          <StarBorderIcon sx={{ fontSize: { xs: 14, lg: 15, xl: 16 } }} />
        )}
      </IconButton>

      <Box sx={{ flex: 1, minHeight: { xs: 12, lg: 14 } }} />

      <Typography
        sx={{
          color: 'text.secondary',
          fontSize: { xs: '0.6rem', lg: '0.62rem', xl: '0.64rem' },
          lineHeight: 1.2,
          mb: 0.25,
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
          fontSize: { xs: '0.72rem', lg: '0.74rem', xl: '0.78rem' },
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
      <Typography
        sx={{
          color: 'text.disabled',
          fontSize: { xs: '0.55rem', lg: '0.57rem', xl: '0.58rem' },
          lineHeight: 1.15,
          mt: 0.3,
        }}
      >
        Creado: {formatExpedienteDate(row.createdAt)}
      </Typography>
    </Box>
  )
}
