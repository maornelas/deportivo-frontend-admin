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

/** Asegura utilidad = seguro − monto en cada línea. */
export function enrichVentasLines(lines) {
  return (lines || []).map((row) => {
    const utilidad = resolveLineUtilidad(row.monto, row.seguro)
    return row.utilidad === utilidad ? row : { ...row, utilidad }
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
