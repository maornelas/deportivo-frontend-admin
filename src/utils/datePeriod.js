function formatLocalYmd(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
