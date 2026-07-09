import { apiFetch, getBaseUrl } from './http'

/**
 * Buscar órdenes con filtros y paginación.
 * @param {object} params - { userId, page, limit, startDate, endDate, search, orderNumber, status, paymentStatus, sortBy, sortOrder }
 * @returns {Promise<{ success: boolean, data?: { orders, total, page, limit, totalPages }, error?: string }>}
 */
/**
 * Pedidos entregados con datos del repartidor (para módulo Entregas).
 * @param {{ startDate?: string, endDate?: string }} params - YYYY-MM-DD sobre fecha de entrega
 */
export async function listDeliveredOrdersByRepartidor(params = {}) {
  const sp = new URLSearchParams()
  if (params.startDate) sp.set('startDate', params.startDate)
  if (params.endDate) sp.set('endDate', params.endDate)
  const q = sp.toString() ? `?${sp.toString()}` : ''
  const res = await apiFetch(`/order/deliveries/by-repartidor${q}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !Array.isArray(body.data)) {
    return { success: false, error: body.message || 'Error al cargar entregas' }
  }
  return { success: true, data: body.data }
}

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
 * @param {{ startDate: string, endDate: string, salesChannel?: 'online'|'advisor' }} params - Fechas YYYY-MM-DD; canal opcional
 * @returns {Promise<{ success: boolean, data?: Array<{ date: string, totalAmount: number, orderCount: number }>, error?: string }>}
 */
export async function getOrderDailySales(params) {
  const searchParams = new URLSearchParams()
  if (params.startDate) searchParams.set('startDate', params.startDate)
  if (params.endDate) searchParams.set('endDate', params.endDate)
  if (params.salesChannel === 'online' || params.salesChannel === 'advisor') {
    searchParams.set('salesChannel', params.salesChannel)
  }
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
export function getOrderSaleNotePdfUrl(orderId, { seller, refresh = true, hidePrices = false } = {}) {
  const baseUrl = getBaseUrl()
  const params = new URLSearchParams()
  if (seller && String(seller).trim()) params.set('seller', String(seller).trim())
  if (hidePrices) {
    params.set('hidePrices', '1')
  } else if (refresh) {
    params.set('refresh', '1')
  }
  const q = params.toString() ? `?${params.toString()}` : ''
  return `${baseUrl}/order/pdf/${orderId}${q}`
}

function openBlobInNewTab(blob) {
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/**
 * Genera la nota de venta al vuelo (no se almacena en S3).
 * @param {string} orderId
 * @param {{ hidePrices?: boolean }} [options]
 */
async function fetchOrderSaleNotePdf(orderId, { hidePrices = false } = {}) {
  const params = new URLSearchParams({ inline: '1' })
  if (hidePrices) params.set('hidePrices', '1')
  const res = await apiFetch(`/order/pdf/${encodeURIComponent(orderId)}?${params.toString()}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  const blob = await res.blob()
  const contentType = res.headers.get('content-type') || blob.type || ''
  if (!blob.size || (contentType && !contentType.includes('pdf'))) {
    return { success: false, error: 'No se recibió un PDF válido' }
  }
  return { success: true, blob }
}

/**
 * Regenera la nota de venta y la abre en una pestaña nueva (no S3).
 * @param {string} orderId
 * @param {{ hidePrices?: boolean }} [options]
 */
export async function openOrderSaleNotePdfInNewTab(orderId, { hidePrices = false } = {}) {
  const result = await fetchOrderSaleNotePdf(orderId, { hidePrices })
  if (!result.success) return result
  openBlobInNewTab(result.blob)
  return { success: true }
}

/**
 * Genera en el servidor la nota de venta (mismo formato que la original) con acuse y firma, y la sube a S3.
 * @param {string} orderId
 * @param {{ recipientName: string, recipientRole?: string, signaturePngDataUri?: string, deliveredItemIndices?: number[] }} payload
 */
export async function uploadSignedOrderSaleNotePdf(orderId, payload) {
  const body =
    typeof payload === 'string'
      ? { pdfDataUri: payload }
      : {
          recipientName: payload.recipientName,
          recipientRole: payload.recipientRole || '',
          signaturePngDataUri: payload.signaturePngDataUri,
          deliveredItemIndices: payload.deliveredItemIndices,
        }
  const res = await apiFetch(`/order/pdf/${encodeURIComponent(orderId)}/signed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: json.message || json.error || `Error ${res.status}` }
  }
  if (!json.success || !json.data?.url) {
    return { success: false, error: json.message || 'No se pudo subir la nota firmada' }
  }
  return { success: true, data: json.data }
}

/**
 * Actualiza un ítem de la orden (p. ej. precio unitario al cambiar origen de pieza).
 * Recalcula totales de la nota en el backend.
 * @param {string} itemId
 * @param {{ unitPrice?: number, quantity?: number, productName?: string, productSku?: string }} payload
 */
export async function updateOrderItem(itemId, payload = {}) {
  const id = String(itemId || '').trim()
  if (!id) return { success: false, error: 'ID de pieza requerido' }
  const body = {}
  if (payload.unitPrice != null) body.unitPrice = Number(payload.unitPrice)
  if (payload.quantity != null) body.quantity = Number(payload.quantity)
  if (payload.productName != null) body.productName = String(payload.productName)
  if (payload.productSku != null) body.productSku = String(payload.productSku)
  const res = await apiFetch(`/order-item/update/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: json.message || json.error || `Error ${res.status}` }
  }
  if (!json.success) {
    return { success: false, error: json.message || 'No se pudo actualizar la pieza' }
  }
  return { success: true, data: json.data }
}

/**
 * Cancela una o varias piezas de una nota de venta (la nota permanece activa).
 * @param {string[]} itemIds
 * @param {string} cancellationReason
 */
export async function cancelOrderItems(itemIds, cancellationReason) {
  const res = await apiFetch('/order-item/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ itemIds, cancellationReason }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'No se pudieron cancelar las piezas' }
  }
  return { success: true, data: body.data }
}
