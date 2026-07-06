function parseAmount(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

/** UTILIDAD = SEGURO − MONTO (sin IVA). Monto o seguro ausente se tratan como 0 si el otro existe. */
export function resolveLineUtilidad(monto, seguro) {
  const mn = parseAmount(monto)
  const sn = parseAmount(seguro)
  if (mn == null && sn == null) return null
  return Math.round(((sn ?? 0) - (mn ?? 0)) * 100) / 100
}

/** Líneas canceladas no deben restar de totales: montos en $0. */
export function normalizeVentasLineForTotals(row) {
  if (String(row?.status || '').toUpperCase() !== 'CANCELADA') return row
  return {
    ...row,
    monto: 0,
    montoNeto: 0,
    seguro: 0,
    seguroNeto: 0,
    utilidad: 0,
  }
}

/** Asegura utilidad = seguro − monto en cada línea. */
export function enrichVentasLines(lines) {
  return (lines || []).map((row) => {
    const normalized = normalizeVentasLineForTotals(row)
    const utilidad = resolveLineUtilidad(normalized.monto, normalized.seguro)
    return normalized.utilidad === utilidad ? normalized : { ...normalized, utilidad }
  })
}

/** Suma numérica de una columna en líneas de ventas_detalle (p. ej. monto). */
export function sumVentasColumn(lines, key) {
  return (
    Math.round(
      (lines || []).reduce((acc, row) => {
        const v = row[key]
        if (v == null || v === '') return acc
        const n = Number(v)
        return Number.isNaN(n) ? acc : acc + n
      }, 0) * 100,
    ) / 100
  )
}

export function sumVentasMonto(lines) {
  return sumVentasColumn(lines, 'monto')
}

export function sumVentasSeguro(lines) {
  return sumVentasColumn(lines, 'seguro')
}

/** Suma una columna donde canalVenta coincide (p. ej. «Asesor», «Online»). */
export function sumVentasColumnByCanal(lines, canalVenta, key = 'monto') {
  const target = String(canalVenta || '').toLowerCase()
  return sumVentasColumn(
    (lines || []).filter((row) => String(row.canalVenta || '').toLowerCase() === target),
    key,
  )
}

/** Suma Monto donde canalVenta coincide (p. ej. «Asesor», «Online»). */
export function sumVentasMontoByCanal(lines, canalVenta) {
  return sumVentasColumnByCanal(lines, canalVenta, 'monto')
}

/** Suma Seguro (cotización) donde canalVenta coincide. */
export function sumVentasSeguroByCanal(lines, canalVenta) {
  return sumVentasColumnByCanal(lines, canalVenta, 'seguro')
}

/** Agrupa Seguro (±) por día de creación del pedido — mismo criterio que Reportería/Dashboard. */
export function aggregateDailySeguro(lines) {
  const byDate = new Map()
  for (const row of lines || []) {
    const raw = row.orderCreatedAt ?? row.createdAt ?? ''
    const key = typeof raw === 'string' ? raw.slice(0, 10) : ''
    if (!key) continue
    const seguro = Number(row.seguro ?? 0)
    if (Number.isNaN(seguro)) continue
    byDate.set(key, (byDate.get(key) || 0) + seguro)
  }
  return Array.from(byDate.entries())
    .map(([date, totalAmount]) => ({
      date,
      totalAmount: Math.round(totalAmount * 100) / 100,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Tasa de comisión sobre el total Seguro (sin IVA) en reportería de ventas. */
export const VENTAS_COMISION_RATE = 0.025

export function computeComisionFromSeguro(seguroTotal) {
  const s = Number(seguroTotal)
  if (Number.isNaN(s)) return 0
  return Math.round(s * VENTAS_COMISION_RATE * 100) / 100
}

export function buildVentasTotals(rows) {
  const enriched = enrichVentasLines(rows)
  if (!enriched.length) return null
  const monto = sumVentasColumn(enriched, 'monto')
  const seguro = sumVentasColumn(enriched, 'seguro')
  return {
    monto,
    montoNeto: sumVentasColumn(enriched, 'montoNeto'),
    seguro,
    seguroNeto: sumVentasColumn(enriched, 'seguroNeto'),
    utilidad: Math.round((seguro - monto) * 100) / 100,
    comision: computeComisionFromSeguro(seguro),
  }
}
