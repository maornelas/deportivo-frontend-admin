import { apiFetch } from './http'

/**
 * Obtiene la lista de usuarios.
 * @param {{ activeOnly?: boolean, role?: string, excludeRole?: string }} params - activeOnly: solo usuarios activos; role: filtrar por rol; excludeRole: excluir usuarios con este rol
 * @returns {Promise<{ success: boolean, data?: object[], error?: string }>}
 */
export async function getUsers(params = {}) {
  const searchParams = new URLSearchParams()
  if (params.activeOnly !== false) searchParams.set('activeOnly', 'true')
  else searchParams.set('activeOnly', 'false')
  if (params.role) searchParams.set('role', params.role)
  if (params.excludeRole) searchParams.set('excludeRole', params.excludeRole)
  const res = await apiFetch(`/user/get?${searchParams.toString()}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !Array.isArray(body.data)) {
    return { success: false, error: body.message || 'Error al cargar usuarios' }
  }
  return { success: true, data: body.data }
}

/**
 * Crea un nuevo usuario.
 * @param {object} payload - { email, passwordHash, firstName?, lastName?, companyName?, rfc?, phone?, role?, adminRoleId? }
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function createUser(payload) {
  const res = await apiFetch('/user/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al crear usuario' }
  }
  return { success: true, data: body.data }
}

/**
 * Obtiene un usuario por ID.
 * @param {string} id
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function getUserById(id) {
  let res
  try {
    res = await apiFetch(`/user/get/${id}`)
  } catch (err) {
    const msg = err?.message || 'Error de red'
    return {
      success: false,
      error: `Error de conexión: ${msg}. Comprueba que el backend esté en ejecución (ej. npm run start:dev en deportivo-backend) y que CORS_ORIGIN en .env incluya la URL del admin (ej. http://localhost:5174).`,
    }
  }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !body.data) {
    return { success: false, error: body.message || 'Usuario no encontrado' }
  }
  return { success: true, data: body.data }
}

/**
 * Actualiza un usuario. Solo enviar campos a modificar (todos opcionales).
 * @param {string} id
 * @param {object} payload - { firstName?, lastName?, companyName?, rfc?, phone?, birthDate?, gender?, role?, isActive? }
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function updateUser(id, payload) {
  const res = await apiFetch(`/user/update/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
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

/**
 * Elimina un usuario por ID.
 * @param {string} id
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function deleteUser(id) {
  const res = await apiFetch(`/user/delete/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al eliminar usuario' }
  }
  return { success: true }
}
