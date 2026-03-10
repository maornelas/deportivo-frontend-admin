const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  return 'http://localhost:3000/api/v1'
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
 * @param {object} payload - { firstName?, lastName?, companyName?, rfc?, phone?, birthDate?, gender? }
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
