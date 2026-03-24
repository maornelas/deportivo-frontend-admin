import { apiFetch } from './http'
import { getBrands, getCarModelsByBrand } from './products'

export { getBrands, getCarModelsByBrand }

export async function createBrand(payload) {
  const res = await apiFetch('/brand/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al crear marca' }
  return { success: true, data: body.data }
}

export async function updateBrand(id, payload) {
  const res = await apiFetch(`/brand/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al actualizar marca' }
  return { success: true, data: body.data }
}

export async function deleteBrand(id) {
  const res = await apiFetch(`/brand/delete/${id}`, { method: 'DELETE' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al eliminar marca' }
  return { success: true }
}

export async function createCarModel(brandId, model) {
  const res = await apiFetch('/car-models/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandId, model }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al crear modelo' }
  return { success: true, data: body.data }
}

export async function updateCarModel(id, model) {
  const res = await apiFetch(`/car-models/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al actualizar modelo' }
  return { success: true, data: body.data }
}

export async function deleteCarModel(id) {
  const res = await apiFetch(`/car-models/delete/${id}`, { method: 'DELETE' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al eliminar modelo' }
  return { success: true }
}
