import { Box, Typography, Collapse } from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { EXPEDIENTE_ACCENT } from '../../utils/expedienteTheme'

export default function ExpedienteCollapsiblePanel({
  title,
  expanded,
  onToggle,
  children,
  count,
  headerAction,
  mb = 1.5,
  bodyPadding = 1.25,
}) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 1.5,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        mb,
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggle()
          }
        }}
        sx={{
          px: 1.25,
          py: 0.85,
          bgcolor: EXPEDIENTE_ACCENT,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: '0.78rem', lineHeight: 1.2 }}>
          {title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
          {headerAction}
          {count != null ? (
            <Typography sx={{ fontSize: '0.65rem', opacity: 0.88, fontWeight: 600 }}>
              {count}
            </Typography>
          ) : null}
          <ExpandMoreIcon
            sx={{
              fontSize: 20,
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          />
        </Box>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ p: bodyPadding }}>{children}</Box>
      </Collapse>
    </Box>
  )
}
