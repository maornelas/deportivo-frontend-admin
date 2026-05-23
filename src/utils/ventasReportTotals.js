/** UTILIDAD = SEGURO − MONTO (sin IVA). */
export function resolveLineUtilidad(monto, seguro) {
  if (monto == null || monto === '' || seguro == null || seguro === '') return null
  const mn = Number(monto)
  const sn = Number(seguro)
  if (Number.isNaN(mn) || Number.isNaN(sn)) return null
  return Math.round((sn - mn) * 100) / 100
}

/** Asegura utilidad en cada línea cuando hay monto y seguro. */
export function enrichVentasLines(lines) {
  return (lines || []).map((row) => {
    const utilidad = resolveLineUtilidad(row.monto, row.seguro) ?? row.utilidad ?? null
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
  }
}
