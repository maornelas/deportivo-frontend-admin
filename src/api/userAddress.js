const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  return 'http://localhost:3000/api/v1'
}

/**
 * Obtiene las direcciones de un usuario por su ID.
 * @param {string} userId
 * @returns {Promise<{ success: boolean, data?: object[], error?: string }>}
 */
export async function getAddressesByUser(userId) {
  if (!userId) return { success: false, error: 'userId requerido' }
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/user-address/get-by-user/${userId}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !Array.isArray(body.data)) {
    return { success: false, error: body.message || 'Error al cargar direcciones' }
  }
  return { success: true, data: body.data }
}

/**
 * Crea una dirección para un usuario.
 * @param {object} payload - { userId, type, addressLine1, addressLine2?, city, state, postalCode, country, addressPhone?, isDefault?, deliveryInstructions? }
 * @param {string} payload.type - 'Casa' | 'Oficina' | 'Otro'
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function createAddress(payload) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/user-address/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al crear dirección' }
  }
  return { success: true, data: body.data }
}
