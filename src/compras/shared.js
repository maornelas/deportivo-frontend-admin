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
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
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

/** Lista de piezas del resumen: scroll interno para mantener totales visibles. */
export const purchaseSummaryListScrollSx = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  WebkitOverflowScrolling: 'touch',
  mb: 1,
  maxHeight: { xs: 'min(360px, 55vh)', md: 'calc(100vh - 430px)' },
}
