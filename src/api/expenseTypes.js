import { apiFetch } from './http'

export async function getExpenseTypes(opts = {}) {
  const activeOnly = opts.activeOnly !== false
  const res = await apiFetch(`/expense-types?activeOnly=${activeOnly}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al cargar tipos de gasto' }
  }
  return { success: true, data: body.data || [] }
}

export async function createExpenseType(payload) {
  const res = await apiFetch('/expense-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al crear' }
  return { success: true, data: body.data }
}

export async function updateExpenseType(id, payload) {
  const res = await apiFetch(`/expense-types/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al actualizar' }
  return { success: true, data: body.data }
}

export async function deleteExpenseType(id) {
  const res = await apiFetch(`/expense-types/${encodeURIComponent(id)}`, { method: 'DELETE' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error al eliminar' }
  return { success: true }
}
