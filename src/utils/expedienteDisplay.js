export function slugPart(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase()
}

/** Etiqueta corta: marca-modelo-año */
export function folderExpedienteLabel(row) {
  const brand = slugPart(row.vehicleBrand)
  const model = slugPart(row.vehicleModel)
  const yearRaw = String(row.vehicleYear ?? '').trim()
  const year = slugPart(yearRaw.replace(/[^0-9]/g, '') || yearRaw)
  const parts = [brand, model, year].filter(Boolean)
  if (parts.length >= 2) return parts.join('-')
  if (parts.length === 1) return parts[0]

  return String(row.expedienteNumber || '')
    .replace(/-COT-?\d+$/i, '')
    .replace(/-ORD-?\d+$/i, '')
    .replace(/^[^-]+-/, '')
}

export function formatExpedienteDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('es-MX', { dateStyle: 'short' })
}

export function formatExpedienteDateTime(v) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  const time = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })
  const date = d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })
  return `${time} ${date}`
}

export function timeAgo(v) {
  if (!v) return '—'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days <= 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  if (days < 30) return `Hace ${Math.floor(days / 7)} sem.`
  if (days < 365) return `Hace ${Math.floor(days / 30)} meses`
  return formatExpedienteDate(v)
}

const FOLDER_COLORS = ['#E8DEFF', '#D6E8FF', '#FFE8D6', '#E0F5E8', '#FFF0D6', '#F0E6FF']

export function folderCardColor(seed) {
  const n = String(seed || '')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return FOLDER_COLORS[n % FOLDER_COLORS.length]
}
