import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
} from '@mui/material'
import { Star as StarIcon, StarBorder as StarBorderIcon } from '@mui/icons-material'
import { folderExpedienteLabel, formatExpedienteDate } from '../../utils/expedienteDisplay'
import { cardHoverBg } from '../../utils/expedienteTheme'

function directorySubtitle(row) {
  if (row.clientName) return row.clientName
  if (row.orderNumber) return `NV ${row.orderNumber}`
  if (row.quotationNumber) return `COT ${row.quotationNumber}`
  return '—'
}

function folioRef(row) {
  if (row.orderNumber) return row.orderNumber
  if (row.quotationNumber) return row.quotationNumber
  return '—'
}

export default function ExpedienteDirectoryTable({
  rows,
  isFavorite,
  onOpen,
  onToggleFavorite,
}) {
  return (
    <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 44, px: 1 }} />
            <TableCell>Vehículo</TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Cliente</TableCell>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>COT / NV</TableCell>
            <TableCell sx={{ whiteSpace: 'nowrap' }}>Fecha creación</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.id}
              hover
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: (theme) => cardHoverBg(theme),
                },
              }}
              onClick={() => onOpen(row)}
            >
              <TableCell sx={{ px: 1 }} onClick={(e) => e.stopPropagation()}>
                <IconButton
                  size="small"
                  aria-label={isFavorite(row.id) ? 'Quitar de favoritos' : 'Marcar favorito'}
                  onClick={() => onToggleFavorite(row)}
                  sx={{ color: isFavorite(row.id) ? '#F5A623' : 'action.disabled', p: 0.5 }}
                >
                  {isFavorite(row.id) ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                </IconButton>
              </TableCell>
              <TableCell>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.3 }}>
                  {folderExpedienteLabel(row)}
                </Typography>
                {row.expedienteNumber ? (
                  <Typography
                    sx={{
                      fontSize: '0.72rem',
                      color: 'text.secondary',
                      fontFamily: 'monospace',
                      mt: 0.25,
                    }}
                  >
                    {row.expedienteNumber}
                  </Typography>
                ) : null}
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, maxWidth: 180 }}>
                <Typography noWrap sx={{ fontSize: '0.82rem' }}>
                  {directorySubtitle(row)}
                </Typography>
              </TableCell>
              <TableCell
                sx={{
                  display: { xs: 'none', md: 'table-cell' },
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                }}
              >
                {folioRef(row)}
              </TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.82rem', color: 'text.secondary' }}>
                {formatExpedienteDate(row.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
