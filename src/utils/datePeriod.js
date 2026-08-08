function formatLocalYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Zona horaria de negocio (México). Evita el salto de día tras las 18:00 con UTC. */
export const BUSINESS_TIMEZONE = 'America/Mexico_City'

/**
 * Día calendario actual en hora de México (YYYY-MM-DD).
 * Usar para defaults de fecha (compras, gastos, etc.): no usar toISOString().slice(0,10).
 */
export function todayYmdMexico(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date instanceof Date ? date : new Date(date))
}

/** Periodo por defecto: desde el sábado anterior hasta hoy. */
export function defaultPeriodRangeYmd() {
  const today = new Date()
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const day = start.getDay() // 0=dom … 6=sáb

  const daysBack = day === 6 ? 7 : day + 1
  start.setDate(start.getDate() - daysBack)

  return {
    start: formatLocalYmd(start),
    end: formatLocalYmd(today),
  }
}

/** Límites inclusivos en hora México para filtrar en cliente. */
export function ymdRangeToMexicoBounds(startYmd, endYmd) {
  return {
    start: startYmd ? new Date(`${startYmd}T00:00:00-06:00`) : null,
    end: endYmd ? new Date(`${endYmd}T23:59:59.999-06:00`) : null,
  }
}
