const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  return 'http://localhost:3000/api/v1'
}

export async function listQuotations(params = {}) {
  const baseUrl = getBaseUrl()
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.limit) sp.set('limit', String(params.limit))
  if (params.status) sp.set('status', params.status)
  if (params.startDate) sp.set('startDate', params.startDate)
  if (params.endDate) sp.set('endDate', params.endDate)
  if (params.clientSearch?.trim()) sp.set('clientSearch', params.clientSearch.trim())
  if (params.search?.trim()) sp.set('search', params.search.trim())
  const res = await fetch(`${baseUrl}/quotations?${sp}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success || !body.data) return { success: false, error: body.message || 'Error al cargar' }
  return { success: true, data: body.data }
}

export async function getQuotation(id) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/quotations/${id}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success || !body.data) return { success: false, error: 'No encontrada' }
  return { success: true, data: body.data }
}

export async function createQuotation(payload) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/quotations`, {
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
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/quotations/${id}`, {
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
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/quotations/${id}`, { method: 'DELETE' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  return { success: true }
}

export function getQuotationPdfUrl(id) {
  return `${getBaseUrl()}/quotations/${id}/pdf`
}

export async function sendQuotationEmailMock(id, email) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/quotations/${id}/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(email ? { email } : {}),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  return { success: true, message: body.message }
}
