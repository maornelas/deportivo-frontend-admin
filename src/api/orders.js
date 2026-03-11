const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  return 'http://localhost:3000/api/v1'
}

/**
 * Buscar órdenes con filtros y paginación.
 * @param {object} params - { userId, page, limit, startDate, endDate, search, orderNumber, status, paymentStatus, sortBy, sortOrder }
 * @returns {Promise<{ success: boolean, data?: { orders, total, page, limit, totalPages }, error?: string }>}
 */
export async function searchOrders(params = {}) {
  const baseUrl = getBaseUrl()
  const searchParams = new URLSearchParams()
  if (params.userId) searchParams.set('userId', params.userId)
  if (params.page != null) searchParams.set('page', String(params.page))
  if (params.limit != null) searchParams.set('limit', String(params.limit))
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  if (params.search?.trim()) searchParams.set('search', params.search.trim())
  if (params.orderNumber?.trim()) searchParams.set('orderNumber', params.orderNumber.trim())
  if (params.status) searchParams.set('status', params.status)
  if (params.paymentStatus) searchParams.set('paymentStatus', params.paymentStatus)
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const url = `${baseUrl}/order?${searchParams.toString()}`
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !body.data) {
    return { success: false, error: body.message || 'Error al cargar órdenes' }
  }
  return { success: true, data: body.data }
}

/**
 * Estadísticas de órdenes por rango de fechas (total y vendidas = no canceladas/reembolsadas).
 * @param {{ startDate: string, endDate: string }} params - Fechas YYYY-MM-DD
 * @returns {Promise<{ success: boolean, data?: { totalOrders, soldOrders }, error?: string }>}
 */
export async function getOrderStats(params) {
  const baseUrl = getBaseUrl()
  const searchParams = new URLSearchParams()
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  const url = `${baseUrl}/order/stats?${searchParams.toString()}`
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || body.data == null) {
    return { success: false, error: body.message || 'Error al cargar estadísticas' }
  }
  return { success: true, data: body.data }
}

/**
 * Ventas por día en un rango de fechas (órdenes vendidas, no canceladas/reembolsadas).
 * @param {{ startDate: string, endDate: string }} params - Fechas YYYY-MM-DD
 * @returns {Promise<{ success: boolean, data?: Array<{ date: string, totalAmount: number, orderCount: number }>, error?: string }>}
 */
export async function getOrderDailySales(params) {
  const baseUrl = getBaseUrl()
  const searchParams = new URLSearchParams()
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  const url = `${baseUrl}/order/stats-daily?${searchParams.toString()}`
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !Array.isArray(body.data)) {
    return { success: false, error: body.message || 'Error al cargar ventas por día' }
  }
  return { success: true, data: body.data }
}

/**
 * Total $ pedidos cancelados por día en un rango de fechas.
 * @param {{ startDate: string, endDate: string }} params - Fechas YYYY-MM-DD
 * @returns {Promise<{ success: boolean, data?: Array<{ date, totalAmount, orderCount }>, error?: string }>}
 */
export async function getOrderDailyCancelled(params) {
  const baseUrl = getBaseUrl()
  const searchParams = new URLSearchParams()
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  const url = `${baseUrl}/order/stats-daily-cancelled?${searchParams.toString()}`
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !Array.isArray(body.data)) {
    return { success: false, error: body.message || 'Error al cargar pedidos cancelados por día' }
  }
  return { success: true, data: body.data }
}

/**
 * Conteo de órdenes por estatus en un rango de fechas.
 * @param {{ startDate: string, endDate: string }} params - Fechas YYYY-MM-DD
 * @returns {Promise<{ success: boolean, data?: OrderCountByStatus, error?: string }>}
 */
export async function getOrderStatsByStatus(params) {
  const baseUrl = getBaseUrl()
  const searchParams = new URLSearchParams()
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  const url = `${baseUrl}/order/stats-by-status?${searchParams.toString()}`
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || body.data == null) {
    return { success: false, error: body.message || 'Error al cargar estatus' }
  }
  return { success: true, data: body.data }
}

/**
 * Total en dinero por estatus en un rango de fechas.
 * @param {{ startDate: string, endDate: string }} params - Fechas YYYY-MM-DD
 * @returns {Promise<{ success: boolean, data?: OrderAmountByStatus, error?: string }>}
 */
export async function getOrderStatsAmountByStatus(params) {
  const baseUrl = getBaseUrl()
  const searchParams = new URLSearchParams()
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  const url = `${baseUrl}/order/stats-amount-by-status?${searchParams.toString()}`
  const res = await fetch(url)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || body.data == null) {
    return { success: false, error: body.message || 'Error al cargar montos por estatus' }
  }
  return { success: true, data: body.data }
}

/**
 * Actualiza una orden (ej. estado).
 * @param {string} id
 * @param {object} payload - { status?, paymentStatus?, ... }
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function updateOrder(id, payload) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/order/update/${id}`, {
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
 * Obtiene una orden por ID (detalle completo con ítems).
 * @param {string} id
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function getOrderById(id) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/order/get/${id}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !body.data) {
    return { success: false, error: body.message || 'Orden no encontrada' }
  }
  return { success: true, data: body.data }
}
