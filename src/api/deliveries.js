import { apiFetch } from './http'

/**
 * @param {{
 *   status?: 'pending'|'in_transit'|'delivered',
 *   dateFrom?: string,
 *   dateTo?: string,
 *   dateField?: 'created'|'delivered',
 *   deliveredByUserId?: string,
 *   page?: number,
 *   limit?: number,
 * }} params
 */
export async function listDeliveries(params = {}) {
  const sp = new URLSearchParams()
  if (params.status) sp.set('status', params.status)
  if (params.dateFrom) sp.set('dateFrom', params.dateFrom)
  if (params.dateTo) sp.set('dateTo', params.dateTo)
  if (params.dateField) sp.set('dateField', params.dateField)
  if (params.deliveredByUserId) sp.set('deliveredByUserId', params.deliveredByUserId)
  if (params.page != null) sp.set('page', String(params.page))
  if (params.limit != null) sp.set('limit', String(params.limit))
  const q = sp.toString() ? `?${sp.toString()}` : ''
  const res = await apiFetch(`/deliveries${q}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !body.data) {
    return { success: false, error: body.message || 'Error al cargar entregas' }
  }
  return { success: true, data: body.data }
}

/**
 * @param {object} payload - orderId obligatorio; resto opcional (ver CreateDeliveryDto backend)
 */
export async function createDelivery(payload) {
  const res = await apiFetch('/deliveries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al crear entrega' }
  }
  return { success: true, data: body.data }
}

/**
 * @param {string} id
 * @param {object} patch - UpdateDeliveryDto
 */
export async function updateDelivery(id, patch) {
  const res = await apiFetch(`/deliveries/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al actualizar' }
  }
  return { success: true, data: body.data }
}

/** @returns {{ success: true, data: object[] } | { success: false, error: string }} historial más reciente primero */
export async function getDeliveryByOrderId(orderId) {
  const res = await apiFetch(`/deliveries/by-order/${encodeURIComponent(orderId)}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !Array.isArray(body.data)) {
    return { success: false, error: body.message || 'Error al cargar entregas' }
  }
  return { success: true, data: body.data }
}
