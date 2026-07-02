import { Box, Typography, useTheme } from '@mui/material'
import {
  DescriptionOutlined as CotIcon,
  ReceiptLongOutlined as OrderIcon,
  ShoppingCartOutlined as PurchaseIcon,
  LocalShippingOutlined as DeliveryIcon,
  AttachFileOutlined as DocIcon,
  FolderOutlined as ExpIcon,
  HistoryOutlined as HistoryIcon,
} from '@mui/icons-material'
import {
  EXPEDIENTE_ACCENT,
  timelineActiveBg,
  timelineActiveBorder,
  timelineHoverBg,
} from '../../utils/expedienteTheme'

const EVENT_ICONS = {
  cotizacion: CotIcon,
  venta: OrderIcon,
  compra: PurchaseIcon,
  entrega: DeliveryIcon,
  documento: DocIcon,
  expediente_creado: ExpIcon,
}

function formatTimelineDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}

function eventIcon(eventType) {
  return EVENT_ICONS[eventType] || HistoryIcon
}

export default function ExpedienteTimeline({ events, selectedId, onSelect }) {
  const theme = useTheme()
  const sorted = [...(events || [])].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
  )

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        height: 'fit-content',
        position: { lg: 'sticky' },
        top: { lg: 86, xl: 90 },
        maxHeight: { lg: 'calc(100vh - 100px)', xl: 'calc(100vh - 110px)' },
        overflowY: 'auto',
      }}
    >
      <Box
        sx={{
          px: { xs: 2, lg: 2.25 },
          py: { xs: 1.25, lg: 1.5 },
          bgcolor: EXPEDIENTE_ACCENT,
        }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.95rem', lg: '1.05rem' }, color: '#fff' }}>
          Línea de tiempo
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.75)', mt: 0.35 }}>
          {sorted.length} evento{sorted.length === 1 ? '' : 's'} en el expediente
        </Typography>
      </Box>

      <Box sx={{ p: { xs: 2, lg: 2.25 } }}>
        {sorted.length === 0 ? (
          <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Sin eventos registrados.</Typography>
        ) : (
          <Box sx={{ position: 'relative', pl: 0.5 }}>
            <Box
              sx={{
                position: 'absolute',
                left: 11,
                top: 12,
                bottom: 12,
                width: 2,
                bgcolor: 'divider',
                borderRadius: 1,
              }}
            />
            {sorted.map((ev) => {
              const Icon = eventIcon(ev.eventType)
              const active = selectedId === ev.id
              return (
                <Box
                  key={ev.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(ev)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(ev)
                    }
                  }}
                  sx={{
                    display: 'flex',
                    gap: 1.25,
                    py: 1.25,
                    px: 1,
                    mb: 0.5,
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    bgcolor: active ? timelineActiveBg(theme) : 'transparent',
                    border: active ? `1px solid ${timelineActiveBorder(theme)}` : '1px solid transparent',
                    transition: 'background-color 0.15s ease',
                    '&:hover': {
                      bgcolor: active ? timelineActiveBg(theme) : timelineHoverBg(theme),
                    },
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      bgcolor: active ? EXPEDIENTE_ACCENT : 'background.paper',
                      border: 2,
                      borderColor: active ? EXPEDIENTE_ACCENT : 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      mt: 0.25,
                    }}
                  >
                    <Icon sx={{ fontSize: 13, color: active ? '#fff' : 'text.secondary' }} />
                  </Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      sx={{
                        fontWeight: active ? 700 : 600,
                        fontSize: '0.82rem',
                        color: 'text.primary',
                        lineHeight: 1.3,
                      }}
                    >
                      {ev.title}
                    </Typography>
                    {ev.description && (
                      <Typography
                        sx={{
                          fontSize: '0.72rem',
                          color: 'text.secondary',
                          mt: 0.25,
                          lineHeight: 1.35,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {ev.description}
                      </Typography>
                    )}
                    <Typography sx={{ fontSize: '0.68rem', color: 'text.disabled', mt: 0.35 }}>
                      {formatTimelineDate(ev.occurredAt)}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
          </Box>
        )}
      </Box>
    </Box>
  )
}
