import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import PurchaseOrderLinesPicker from './PurchaseOrderLinesPicker'
import { salesOrderOptionLabel } from './PurchaseSalesOrderPicker'

/**
 * Modal para elegir autopartes de la nota de venta vinculada.
 */
export default function PurchaseOrderLinesModal({
  open,
  onClose,
  salesOrder,
  lines,
  loading,
  selectedOrderItemIds,
  onToggle,
}) {
  const selectedCount = selectedOrderItemIds?.size ?? 0

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle
        sx={{
          bgcolor: '#7B2CBF',
          color: '#fff',
          fontWeight: 600,
          py: 2,
          pr: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box>
          <Typography component="span" variant="h6" sx={{ fontWeight: 600, display: 'block' }}>
            Autopartes de la nota de venta
          </Typography>
          {salesOrder ? (
            <Typography component="span" variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              {salesOrderOptionLabel(salesOrder)}
            </Typography>
          ) : null}
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff' }} aria-label="Cerrar">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2.5 }}>
        <PurchaseOrderLinesPicker
          lines={lines}
          loading={loading}
          selectedOrderItemIds={selectedOrderItemIds}
          onToggle={onToggle}
          embedded
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {selectedCount > 0
            ? `${selectedCount} pieza${selectedCount === 1 ? '' : 's'} marcada${selectedCount === 1 ? '' : 's'} para comprar`
            : 'Ninguna pieza marcada aún'}
        </Typography>
        <Button onClick={onClose} variant="contained">
          Listo
        </Button>
      </DialogActions>
    </Dialog>
  )
}
