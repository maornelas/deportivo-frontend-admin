import { apiFetch, getBaseUrl } from './http'

export async function listQuotations(params = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.limit) sp.set('limit', String(params.limit))
  if (params.status) sp.set('status', params.status)
  if (params.startDate) sp.set('startDate', params.startDate)
  if (params.endDate) sp.set('endDate', params.endDate)
  if (params.clientSearch?.trim()) sp.set('clientSearch', params.clientSearch.trim())
  if (params.search?.trim()) sp.set('search', params.search.trim())
  const res = await apiFetch(`/quotations?${sp}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success || !body.data) return { success: false, error: body.message || 'Error al cargar' }
  return { success: true, data: body.data }
}

export async function getQuotation(id) {
  const res = await apiFetch(`/quotations/${id}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success || !body.data) return { success: false, error: 'No encontrada' }
  return { success: true, data: body.data }
}

export async function createQuotation(payload) {
  const res = await apiFetch('/quotations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al crear' }
  return { success: true, data: body.data }
}

export async function updateQuotation(id, payload) {
  const res = await apiFetch(`/quotations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al guardar' }
  return { success: true, data: body.data }
}

export async function deleteQuotation(id) {
  const res = await apiFetch(`/quotations/${id}`, { method: 'DELETE' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  return { success: true }
}

export function getQuotationPdfUrl(id) {
  return `${getBaseUrl()}/quotations/${id}/pdf`
}

export async function sendQuotationEmailMock(id, email) {
  const res = await apiFetch(`/quotations/${id}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(email ? { email } : {}),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  return { success: true, message: body.message }
}
