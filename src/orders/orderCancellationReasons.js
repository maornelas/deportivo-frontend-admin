export const ORDER_CANCELLATION_REASONS = [
  { value: 'aseguradora_rechazo', label: 'Aseguradora rechazó la pieza' },
  { value: 'cliente_desistio', label: 'Cliente desistió' },
  { value: 'pieza_no_disponible', label: 'Pieza no disponible' },
  { value: 'error_cotizacion', label: 'Error en cotización' },
  { value: 'duplicado', label: 'Registro duplicado' },
  { value: 'error_captura', label: 'Error de captura' },
  { value: 'otra', label: 'Otra (especificar)' },
]

export function resolveCancellationReasonText(reasonKey, otherText) {
  if (reasonKey === 'otra') {
    return (otherText || '').trim()
  }
  const opt = ORDER_CANCELLATION_REASONS.find((r) => r.value === reasonKey)
  return opt?.label || (otherText || '').trim()
}
