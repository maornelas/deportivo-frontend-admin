const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  return 'http://localhost:3000/api/v1'
}

/**
 * Obtiene la lista de usuarios.
 * @param {{ activeOnly?: boolean, role?: string, excludeRole?: string }} params - activeOnly: solo usuarios activos; role: filtrar por rol; excludeRole: excluir usuarios con este rol
 * @returns {Promise<{ success: boolean, data?: object[], error?: string }>}
 */
export async function getUsers(params = {}) {
  const baseUrl = getBaseUrl()
  const searchParams = new URLSearchParams()
  if (params.activeOnly !== false) searchParams.set('activeOnly', 'true')
  else searchParams.set('activeOnly', 'false')
  if (params.role) searchParams.set('role', params.role)
  if (params.excludeRole) searchParams.set('excludeRole', params.excludeRole)
  const url = `${baseUrl}/user/get?${searchParams.toString()}`
  const res = await fetch(url)
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
 * @param {object} payload - { email, passwordHash, firstName?, lastName?, companyName?, rfc?, phone?, role? }
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function createUser(payload) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/user/create`, {
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
  const baseUrl = getBaseUrl()
  let res
  try {
    res = await fetch(`${baseUrl}/user/get/${id}`)
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
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/user/update/${id}`, {
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
