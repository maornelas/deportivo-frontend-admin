import { useEffect, useState } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import {
  ORDER_CANCELLATION_REASONS,
  resolveCancellationReasonText,
} from './orderCancellationReasons'

/**
 * Modal para capturar la causa al cancelar o reembolsar una nota de venta.
 */
export default function OrderCancellationDialog({
  open,
  onClose,
  onConfirm,
  statusLabel = 'Cancelado',
  title = 'Causa de cancelación',
  description,
  confirmLabel = 'Confirmar cancelación',
  saving = false,
}) {
  const [reasonKey, setReasonKey] = useState('')
  const [otherText, setOtherText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setReasonKey('')
    setOtherText('')
    setError('')
  }, [open])

  const handleConfirm = () => {
    const text = resolveCancellationReasonText(reasonKey, otherText)
    if (!reasonKey) {
      setError('Selecciona una causa de cancelación')
      return
    }
    if (reasonKey === 'otra' && !text) {
      setError('Describe la causa de cancelación')
      return
    }
    setError('')
    onConfirm(text)
  }

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <Box
        sx={{
          bgcolor: '#7B2CBF',
          color: '#fff',
          py: 1,
          px: 2,
          pr: 0.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={saving} sx={{ color: '#fff', p: 0.5 }} aria-label="Cerrar">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <DialogContent sx={{ pt: 2.5 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description ?? (
            <>
              La orden pasará a estado <strong>{statusLabel}</strong>. Indica el motivo para control interno.
            </>
          )}
        </Typography>
        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
          <InputLabel>Causa</InputLabel>
          <Select label="Causa" value={reasonKey} onChange={(e) => setReasonKey(e.target.value)}>
            {ORDER_CANCELLATION_REASONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {reasonKey === 'otra' ? (
          <TextField
            label="Detalle"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            inputProps={{ maxLength: 500 }}
            placeholder="Describe la causa…"
          />
        ) : null}
        {error ? (
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            {error}
          </Typography>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Volver
        </Button>
        <Button variant="contained" color="error" onClick={handleConfirm} disabled={saving}>
          {saving ? 'Guardando…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
