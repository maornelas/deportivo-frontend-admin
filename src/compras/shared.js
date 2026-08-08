export const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pendiente', color: 'default' },
  { value: 'paid', label: 'Pagado', color: 'success' },
  { value: 'cancelled', label: 'Cancelado', color: 'error' },
]

export const PAYMENT_OPTIONS = [
  { value: 'transfer', label: 'Transferencia' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'other', label: 'Otro' },
]

export const PART_TYPE_OPTIONS = [
  { value: 'ORIGINAL', label: 'Original' },
  { value: 'GENÉRICO', label: 'Genérica' },
]

export const PART_STATE_OPTIONS = [
  { value: 'NUEVO', label: 'Nuevo' },
  { value: 'SEMINUEVO', label: 'Seminueva' },
]

export function formatMoney(n, currency = 'MXN') {
  if (n == null || Number.isNaN(Number(n))) return '-'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(n))
}

export function formatDateValue(v) {
  if (!v) return ''
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.trim())) return v.trim()
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  // Día en America/Mexico_City (evita +1 día después de las 18:00 con UTC).
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function safeTrim(s) {
  return String(s ?? '').trim()
}

export function getStatusChip(status) {
  return STATUS_OPTIONS.find((o) => o.value === status) || { label: status, color: 'default' }
}

export function matchBrandIdFromName(brands, name) {
  const n = safeTrim(name).toLowerCase()
  if (!n) return ''
  const b = brands.find((x) => safeTrim(x.name).toLowerCase() === n)
  return b?.id || ''
}

export function emptyLine() {
  return {
    key: crypto.randomUUID(),
    productId: null,
    productName: '',
    sku: '',
    partType: 'ORIGINAL',
    partCondition: 'NUEVO',
    unitPrice: 0,
    quantity: 1,
    vehicleBrandId: '',
    vehicleBrand: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleVersion: '',
  }
}

/** Texto compacto para mostrar / PDF: marca · modelo · año · versión */
export function formatLineVehicleLabel(line) {
  const parts = [line?.vehicleBrand, line?.vehicleModel, line?.vehicleYear, line?.vehicleVersion]
    .map((s) => safeTrim(s))
    .filter(Boolean)
  return parts.length ? parts.join(' · ') : ''
}

export function vehicleLineFingerprint(line) {
  return [line?.vehicleBrandId, line?.vehicleBrand, line?.vehicleModel, line?.vehicleYear, line?.vehicleVersion]
    .map((s) => safeTrim(s))
    .join('|')
}

/** Cabecera de compra (un solo vehículo) o vacío si hay varios vehículos en las líneas. */
export function summarizePurchaseHeaderVehicle(lines = []) {
  const withV = lines.filter((l) => formatLineVehicleLabel(l))
  if (withV.length === 0) {
    return { vehicleBrandId: '', vehicleBrand: '', vehicleModel: '', vehicleYear: '', vehicleVersion: '' }
  }
  const fp = vehicleLineFingerprint
  const first = withV[0]
  if (withV.every((l) => fp(l) === fp(first))) {
    return {
      vehicleBrandId: first.vehicleBrandId || '',
      vehicleBrand: first.vehicleBrand || '',
      vehicleModel: first.vehicleModel || '',
      vehicleYear: first.vehicleYear || '',
      vehicleVersion: first.vehicleVersion || '',
    }
  }
  return { vehicleBrandId: '', vehicleBrand: '', vehicleModel: '', vehicleYear: '', vehicleVersion: '' }
}

export function computePurchaseTotal(items) {
  const t = (items || []).reduce((s, it) => s + Number(it.unitPrice || 0) * Math.max(1, Number(it.quantity || 1)), 0)
  return Math.round(t * 100) / 100
}

/** Columna derecha: card de resumen + botón de acción siempre visible. */
export const purchaseSummaryColumnSx = {
  width: { xs: '100%', lg: 520 },
  minWidth: { lg: 480 },
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  height: { xs: 'auto', lg: '100%' },
  maxHeight: { xs: 'none', lg: '100%' },
  minHeight: { xs: 'auto', lg: 0 },
  overflow: 'hidden',
}

/** Card del carrito: ocupa casi toda la altura de la columna; la lista hace scroll. */
export const purchaseSummaryCardSx = (theme) => ({
  width: '100%',
  flex: 1,
  minHeight: { xs: 360, lg: 0 },
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: '1px solid',
  borderColor: 'grey.300',
  boxShadow: theme.shadows[2],
  bgcolor: 'background.paper',
})

export const purchaseSummaryBodySx = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

/** Solo la lista de piezas hace scroll dentro del card. */
export const purchaseSummaryListScrollSx = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  px: 1.5,
  pt: 1.5,
}

/** Totales fijos al pie del card (sin botón de acción). */
export const purchaseSummaryTotalsSx = {
  flexShrink: 0,
  px: 1.5,
  pt: 1,
  pb: 1.5,
  borderTop: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
}

/** Botón principal fuera del card, siempre visible. */
export const purchaseSummaryActionSx = {
  flexShrink: 0,
  display: 'flex',
  justifyContent: 'flex-end',
  pt: 1.5,
}

export const purchaseSummaryGenerateButtonSx = {
  width: '50%',
  minWidth: 160,
  py: 1.25,
  bgcolor: '#7B2CBF',
  '&:hover': { bgcolor: '#6A26A8' },
  textTransform: 'uppercase',
  fontWeight: 700,
  letterSpacing: 0.5,
}
