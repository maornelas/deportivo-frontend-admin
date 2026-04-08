import { apiFetch } from './http'

/**
 * @param {{
 *   page?: number,
 *   limit?: number,
 *   userId?: string,
 *   userSearch?: string,
 *   role?: string,
 *   startDate?: string,
 *   endDate?: string,
 * }} params
 */
export async function listActivityLogs(params = {}) {
  const sp = new URLSearchParams()
  if (params.page != null) sp.set('page', String(params.page))
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.userId?.trim()) sp.set('userId', params.userId.trim())
  if (params.userSearch?.trim()) sp.set('userSearch', params.userSearch.trim())
  if (params.role?.trim()) sp.set('role', params.role.trim())
  if (params.startDate?.trim()) sp.set('startDate', params.startDate.trim())
  if (params.endDate?.trim()) sp.set('endDate', params.endDate.trim())
  const res = await apiFetch(`/activity-logs?${sp.toString()}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success || !body.data) return { success: false, error: body.message || 'Error al cargar historial' }
  return { success: true, data: body.data }
}

/**
 * @param {string} id UUID del registro
 */
export async function getActivityLog(id) {
  const res = await apiFetch(`/activity-logs/${encodeURIComponent(id)}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success || !body.data) return { success: false, error: body.message || 'Error al cargar detalle' }
  return { success: true, data: body.data }
}
