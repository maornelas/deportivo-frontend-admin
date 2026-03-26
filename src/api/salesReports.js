import { apiFetch } from './http'

/**
 * @param {{ kind: 'monthly' | 'by_channel' | 'by_advisor' | 'ventas_detalle', startDate: string, endDate: string }} params
 */
export async function getSalesReport(params) {
  const sp = new URLSearchParams({
    kind: params.kind,
    startDate: params.startDate,
    endDate: params.endDate,
  })
  const res = await apiFetch(`/order/reports/sales?${sp.toString()}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success || !body.data) return { success: false, error: body.message || 'Error en reporte' }
  return { success: true, data: body.data }
}
