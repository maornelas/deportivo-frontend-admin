import { apiFetch } from './http'

/**
 * @param {{ startDate?: string, endDate?: string, status?: string }} [params]
 */
export async function listPurchases(params = {}) {
  const sp = new URLSearchParams()
  if (params.startDate) sp.set('startDate', params.startDate)
  if (params.endDate) sp.set('endDate', params.endDate)
  if (params.status) sp.set('status', params.status)
  const qs = sp.toString()
  const res = await apiFetch(qs ? `/purchases?${qs}` : '/purchases')
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !Array.isArray(body.data)) {
    return { success: false, error: body.message || 'Error al cargar compras' }
  }
  return { success: true, data: body.data }
}

/** @param {string} ref - Folio CMP-… o UUID */
export async function getPurchase(ref) {
  const res = await apiFetch(`/purchases/${encodeURIComponent(ref)}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !body.data) {
    return { success: false, error: body.message || 'Compra no encontrada' }
  }
  return { success: true, data: body.data }
}

export async function createPurchase(payload) {
  const res = await apiFetch('/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !body.data) {
    return { success: false, error: body.message || 'Error al crear compra' }
  }
  return { success: true, data: body.data }
}

export async function updatePurchase(ref, payload) {
  const res = await apiFetch(`/purchases/${encodeURIComponent(ref)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !body.data) {
    return { success: false, error: body.message || 'Error al actualizar' }
  }
  return { success: true, data: body.data }
}

export async function deletePurchase(ref) {
  const res = await apiFetch(`/purchases/${encodeURIComponent(ref)}`, { method: 'DELETE' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al eliminar' }
  }
  return { success: true }
}

/** @param {{ startDate: string, endDate: string }} range */
export async function getPurchasesDaily(range) {
  const sp = new URLSearchParams({
    startDate: range.startDate,
    endDate: range.endDate,
  })
  const res = await apiFetch(`/purchases/daily?${sp.toString()}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !Array.isArray(body.data)) {
    return { success: false, error: body.message || 'Error al cargar compras' }
  }
  return { success: true, data: body.data }
}
