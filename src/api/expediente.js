import { apiFetch } from './http'

export async function listExpedientes(params = {}) {
  const sp = new URLSearchParams()
  if (params.page) sp.set('page', String(params.page))
  if (params.limit) sp.set('limit', String(params.limit))
  if (params.startDate) sp.set('startDate', params.startDate)
  if (params.endDate) sp.set('endDate', params.endDate)
  if (params.search?.trim()) sp.set('search', params.search.trim())
  if (params.resolveRef?.trim()) sp.set('resolveRef', params.resolveRef.trim())
  if (params.vehicleBrand?.trim()) sp.set('vehicleBrand', params.vehicleBrand.trim())
  if (params.vehicleModel?.trim()) sp.set('vehicleModel', params.vehicleModel.trim())
  if (params.vehicleYear?.trim()) sp.set('vehicleYear', params.vehicleYear.trim())
  if (params.providerName?.trim()) sp.set('providerName', params.providerName.trim())
  const res = await apiFetch(`/expedientes?${sp}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.error || 'Error al cargar' }
  return { success: true, data: body.data }
}

export async function getExpedienteFilterOptions() {
  const res = await apiFetch('/expedientes/filter-options')
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.error || 'Error al cargar filtros' }
  return { success: true, data: body.data || { brands: [], models: [], years: [], providers: [] } }
}

export async function getExpediente(ref) {
  const res = await apiFetch(`/expedientes/${encodeURIComponent(ref)}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success || !body.data) return { success: false, error: body.error || 'No encontrado' }
  return { success: true, data: body.data }
}

export async function getExpedienteDocumentTypes() {
  const res = await apiFetch('/expedientes/document-types')
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.error || `Error ${res.status}` }
  return { success: true, data: body.data || [] }
}

export async function uploadExpedienteDocument(ref, file, { documentType, title, notes, uploadedByUserId } = {}) {
  const fd = new FormData()
  fd.append('file', file)
  if (documentType) fd.append('documentType', documentType)
  if (title) fd.append('title', title)
  if (notes) fd.append('notes', notes)
  if (uploadedByUserId) fd.append('uploadedByUserId', uploadedByUserId)
  const res = await apiFetch(`/expedientes/${encodeURIComponent(ref)}/documents`, {
    method: 'POST',
    body: fd,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.error || 'Error al subir' }
  return { success: true, data: body.data }
}

export async function deleteExpedienteDocument(documentId) {
  const res = await apiFetch(`/expedientes/documents/${encodeURIComponent(documentId)}`, {
    method: 'DELETE',
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  return { success: body.success !== false, error: body.error }
}
