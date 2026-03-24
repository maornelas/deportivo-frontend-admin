import { apiFetch } from './http'

export async function getPermissionsCatalog() {
  const res = await apiFetch('/rbac/permissions')
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true, data: body.data || [] }
}

export async function getRoles() {
  const res = await apiFetch('/rbac/roles')
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true, data: body.data || [] }
}

export async function getRoleById(id) {
  const res = await apiFetch(`/rbac/roles/${encodeURIComponent(id)}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true, data: body.data }
}

export async function createRole({ name, description, slug }) {
  const res = await apiFetch('/rbac/roles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, slug }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true, data: body.data }
}

export async function updateRole(id, { name, description }) {
  const res = await apiFetch(`/rbac/roles/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true, data: body.data }
}

export async function deleteRole(id) {
  const res = await apiFetch(`/rbac/roles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true }
}

export async function setRolePermissions(id, grants) {
  const res = await apiFetch(`/rbac/roles/${encodeURIComponent(id)}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grants }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true }
}
