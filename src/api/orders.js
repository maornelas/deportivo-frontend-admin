import { apiFetch, getBaseUrl } from './http'

/**
 * Buscar órdenes con filtros y paginación.
 * @param {object} params - { userId, page, limit, startDate, endDate, search, orderNumber, status, paymentStatus, sortBy, sortOrder }
 * @returns {Promise<{ success: boolean, data?: { orders, total, page, limit, totalPages }, error?: string }>}
 */
export async function searchOrders(params = {}) {
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
  if (params.salesChannel === 'online' || params.salesChannel === 'advisor') {
    searchParams.set('salesChannel', params.salesChannel)
  }
  if (params.sortBy) searchParams.set('sortBy', params.sortBy)
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder)

  const res = await apiFetch(`/order?${searchParams.toString()}`)
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
  const searchParams = new URLSearchParams()
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  const res = await apiFetch(`/order/stats?${searchParams.toString()}`)
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
  const searchParams = new URLSearchParams()
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  const res = await apiFetch(`/order/stats-daily?${searchParams.toString()}`)
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
  const searchParams = new URLSearchParams()
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  const res = await apiFetch(`/order/stats-daily-cancelled?${searchParams.toString()}`)
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
  const searchParams = new URLSearchParams()
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  const res = await apiFetch(`/order/stats-by-status?${searchParams.toString()}`)
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
  const searchParams = new URLSearchParams()
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  const res = await apiFetch(`/order/stats-amount-by-status?${searchParams.toString()}`)
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
  const res = await apiFetch(`/order/update/${id}`, {
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
 * Actualiza el canal de venta (online = venta directa, advisor = asesor).
 * @param {string} id
 * @param {'online'|'advisor'} salesChannel
 */
export async function updateOrderSalesChannel(id, salesChannel) {
  const res = await apiFetch(`/order/sales-channel/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ salesChannel }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al actualizar canal' }
  }
  return { success: true, data: body.data }
}

/**
 * Obtiene una orden por ID (detalle completo con ítems).
 * @param {string} id
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function getOrderById(id) {
  const res = await apiFetch(`/order/get/${id}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !body.data) {
    return { success: false, error: body.message || 'Orden no encontrada' }
  }
  return { success: true, data: body.data }
}

/**
 * URL del endpoint que redirige a la nota de venta (PDF en S3).
 * Abrir en nueva pestaña. Opcional: nombre del vendedor en el encabezado del PDF.
 */
export function getOrderSaleNotePdfUrl(orderId, { seller, refresh = true } = {}) {
  const baseUrl = getBaseUrl()
  const params = new URLSearchParams()
  if (seller && String(seller).trim()) params.set('seller', String(seller).trim())
  if (refresh) params.set('refresh', '1')
  const q = params.toString() ? `?${params.toString()}` : ''
  return `${baseUrl}/order/pdf/${orderId}${q}`
}
