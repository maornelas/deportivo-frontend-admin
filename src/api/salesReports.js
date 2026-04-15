import { apiFetch } from './http'

/**
 * @param {{
 *   kind: 'monthly' | 'by_channel' | 'by_advisor' | 'ventas_detalle' | 'ventas_asesor_nombres',
 *   startDate: string,
 *   endDate: string,
 *   advisorName?: string,
 *   salesChannel?: 'local' | 'foraneo',
 * }} params
 */
export async function getSalesReport(params) {
  const sp = new URLSearchParams({
    kind: params.kind,
    startDate: params.startDate,
    endDate: params.endDate,
  })
  if (params.advisorName?.trim()) sp.set('advisorName', params.advisorName.trim())
  if (params.salesChannel === 'local' || params.salesChannel === 'foraneo') {
    sp.set('salesChannel', params.salesChannel)
  }
  const res = await apiFetch(`/order/reports/sales?${sp.toString()}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success || !body.data) return { success: false, error: body.message || 'Error en reporte' }
  return { success: true, data: body.data }
}

/**
 * Nombres de asesor distintos en notas de pedidos (Asesor: …) en el rango.
 * @param {{ startDate: string, endDate: string }} range
 */
export async function getVentasAsesorNames(range) {
  return getSalesReport({
    kind: 'ventas_asesor_nombres',
    startDate: range.startDate,
    endDate: range.endDate,
  })
}

/**
 * Estado de resultados (ventas netas, gastos, utilidades).
 * @param {{ startDate: string, endDate: string }} range
 */
export async function getIncomeStatement(range) {
  const sp = new URLSearchParams({
    startDate: range.startDate,
    endDate: range.endDate,
  })
  const res = await apiFetch(`/order/reports/income-statement?${sp.toString()}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success || !body.data) return { success: false, error: body.message || 'Error en reporte' }
  return { success: true, data: body.data }
}
