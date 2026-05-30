import {
  Box,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

function formatMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)
}

function vehicleLabel(line) {
  return [line.carBrand, line.carModel, line.carYears].filter(Boolean).join(' · ') || '—'
}

/**
 * Listado de piezas de la nota de venta vinculada.
 * @param {{ lines: array, loading: boolean, selectedOrderItemIds: Set<string>, onToggle: (line) => void, embedded?: boolean }} props
 */
export default function PurchaseOrderLinesPicker({ lines, loading, selectedOrderItemIds, onToggle, embedded = false }) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
        <CircularProgress size={22} />
        <Typography variant="body2" color="text.secondary">
          Cargando piezas de la nota de venta…
        </Typography>
      </Box>
    )
  }

  if (!lines?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        Esta nota de venta no tiene líneas de producto.
      </Typography>
    )
  }

  return (
    <Box sx={embedded ? undefined : { mt: 2 }}>
      {!embedded ? (
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
          Autopartes de la nota de venta
        </Typography>
      ) : null}
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
        Marca las piezas que se comprarán. Los nombres se listan en Notas; no suman importes al resumen.
        Las ya utilizadas en compras anteriores aparecen en gris y no pueden volver a elegirse.
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: embedded ? 420 : 320 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" />
              <TableCell>Pieza</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Vehículo</TableCell>
              <TableCell align="right">Cant.</TableCell>
              <TableCell align="right">P. venta</TableCell>
              <TableCell>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lines.map((line) => {
              const used = Boolean(line.alreadyPurchased)
              const checked = used || selectedOrderItemIds.has(line.orderItemId)
              const folios = (line.purchasedInFolios || []).join(', ')
              return (
                <TableRow
                  key={line.orderItemId}
                  sx={{
                    bgcolor: used ? 'action.hover' : undefined,
                    opacity: used ? 0.72 : 1,
                    '& .MuiTableCell-root': used ? { color: 'text.disabled' } : undefined,
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={checked}
                      disabled={used}
                      onChange={() => onToggle(line)}
                      inputProps={{ 'aria-label': `Seleccionar ${line.productName}` }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={used ? 400 : 600}>
                      {line.productName}
                    </Typography>
                  </TableCell>
                  <TableCell>{line.sku || '—'}</TableCell>
                  <TableCell>{vehicleLabel(line)}</TableCell>
                  <TableCell align="right">{line.quantity}</TableCell>
                  <TableCell align="right">{formatMoney(line.saleUnitPrice)}</TableCell>
                  <TableCell>
                    {used ? (
                      <Typography variant="caption" color="text.secondary">
                        Ya comprada{folios ? ` (${folios})` : ''}
                      </Typography>
                    ) : selectedOrderItemIds.has(line.orderItemId) ? (
                      <Typography variant="caption" color="primary.main" fontWeight={600}>
                        Marcada
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        Disponible
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
