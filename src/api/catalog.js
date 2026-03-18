import { getBrands, getCarModelsByBrand } from './products'

const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  return 'http://localhost:3000/api/v1'
}

export { getBrands, getCarModelsByBrand }

export async function createBrand(payload) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/brand/create`, {
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
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/brand/update/${id}`, {
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
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/brand/delete/${id}`, { method: 'DELETE' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al eliminar marca' }
  return { success: true }
}

export async function createCarModel(brandId, model) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/car-models/create`, {
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
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/car-models/update/${id}`, {
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
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/car-models/delete/${id}`, { method: 'DELETE' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al eliminar modelo' }
  return { success: true }
}
