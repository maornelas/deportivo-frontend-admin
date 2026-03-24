import { apiFetch } from './http'

/**
 * Obtiene los métodos de pago de un usuario por su ID.
 * @param {string} userId
 * @returns {Promise<{ success: boolean, data?: object[], error?: string }>}
 */
export async function getPaymentsByUser(userId) {
  if (!userId) return { success: false, error: 'userId requerido' }
  const res = await apiFetch(`/user-payment/get-by-user/${userId}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !Array.isArray(body.data)) {
    return { success: false, error: body.message || 'Error al cargar formas de pago' }
  }
  return { success: true, data: body.data }
}

/**
 * Crea un método de pago para un usuario.
 * @param {object} payload - { userId, type, label, lastFourDigits?, expiryDate?, isDefault?, isActive? }
 * @param {string} payload.type - 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer'
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function createPayment(payload) {
  const res = await apiFetch('/user-payment/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al crear forma de pago' }
  }
  return { success: true, data: body.data }
}
