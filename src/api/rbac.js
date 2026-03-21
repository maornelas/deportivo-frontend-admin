const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  return 'http://localhost:3000/api/v1'
}

export async function getPermissionsCatalog() {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/rbac/permissions`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true, data: body.data || [] }
}

export async function getRoles() {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/rbac/roles`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true, data: body.data || [] }
}

export async function getRoleById(id) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/rbac/roles/${encodeURIComponent(id)}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true, data: body.data }
}

export async function createRole({ name, description, slug }) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/rbac/roles`, {
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
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/rbac/roles/${encodeURIComponent(id)}`, {
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
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/rbac/roles/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true }
}

export async function setRolePermissions(id, grants) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/rbac/roles/${encodeURIComponent(id)}/permissions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grants }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true }
}
