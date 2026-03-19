const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  return 'http://localhost:3000/api/v1'
}

/**
 * @param {object} params
 * @param {number} [params.page]
 * @param {number} [params.limit]
 * @param {string} [params.search]
 * @param {string} [params.category]
 * @param {string} [params.startDate] YYYY-MM-DD
 * @param {string} [params.endDate] YYYY-MM-DD
 * @param {number} [params.minAmount]
 * @param {number} [params.maxAmount]
 * @param {'date'|'amount'} [params.sortBy]
 * @param {'ASC'|'DESC'} [params.sortOrder]
 */
export async function listExpenses(params = {}) {
  const baseUrl = getBaseUrl()
  const sp = new URLSearchParams()
  if (params.page != null) sp.set('page', String(params.page))
  if (params.limit != null) sp.set('limit', String(params.limit))
  if (params.search?.trim()) sp.set('search', params.search.trim())
  if (params.category?.trim()) sp.set('category', params.category.trim())
  if (params.startDate) sp.set('startDate', params.startDate)
  if (params.endDate) sp.set('endDate', params.endDate)
  if (params.minAmount != null && params.minAmount !== '') sp.set('minAmount', String(params.minAmount))
  if (params.maxAmount != null && params.maxAmount !== '') sp.set('maxAmount', String(params.maxAmount))
  if (params.sortBy) sp.set('sortBy', params.sortBy)
  if (params.sortOrder) sp.set('sortOrder', params.sortOrder)

  const res = await fetch(`${baseUrl}/expenses?${sp.toString()}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success || !body.data) {
    return { success: false, error: body.message || 'Error al listar gastos' }
  }
  return { success: true, data: body.data }
}

export async function getExpenseById(id) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/expenses/${encodeURIComponent(id)}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Gasto no encontrado' }
  }
  return { success: true, data: body.data }
}

/**
 * @param {object} payload - { expenseDate, totalAmount, category, description?, items: { concept, amount, quantity }[] }
 */
export async function createExpense(payload) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al crear gasto' }
  }
  return { success: true, data: body.data }
}

export async function updateExpense(id, payload) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/expenses/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al actualizar gasto' }
  }
  return { success: true, data: body.data }
}

export async function deleteExpense(id) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/expenses/${encodeURIComponent(id)}`, { method: 'DELETE' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error al eliminar' }
  }
  return { success: true }
}

/**
 * Reporte JSON por rango de fechas (agrupado por categoría).
 * @param {{ startDate: string, endDate: string }} range
 */
export async function getExpenseReportSummary(range) {
  const baseUrl = getBaseUrl()
  const sp = new URLSearchParams({
    startDate: range.startDate,
    endDate: range.endDate,
  })
  const res = await fetch(`${baseUrl}/expenses/report?${sp.toString()}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return { success: false, error: body.message || body.error || `Error ${res.status}` }
  }
  if (!body.success) {
    return { success: false, error: body.message || 'Error en reporte' }
  }
  return { success: true, data: body.data }
}

/**
 * Descarga CSV (detalle o resumen por categoría).
 * @param {'csv'|'summary_csv'} format
 */
export async function downloadExpenseReportCsv(range, format) {
  const baseUrl = getBaseUrl()
  const sp = new URLSearchParams({
    startDate: range.startDate,
    endDate: range.endDate,
    format,
  })
  const res = await fetch(`${baseUrl}/expenses/report?${sp.toString()}`)
  if (!res.ok) {
    const t = await res.text()
    return { success: false, error: t || `Error ${res.status}` }
  }
  const blob = await res.blob()
  const dispo = res.headers.get('Content-Disposition') || ''
  const m = dispo.match(/filename="?([^";]+)"?/)
  const name = m ? m[1] : `gastos_${range.startDate}_${range.endDate}.csv`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
  return { success: true }
}
