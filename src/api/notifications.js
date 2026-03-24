import { apiFetch } from './http'

export async function listNotifications(params = {}) {
  const sp = new URLSearchParams()
  if (params.page != null) sp.set('page', String(params.page))
  if (params.limit != null) sp.set('limit', String(params.limit))
  const res = await apiFetch(`/notifications?${sp.toString()}`)
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success || !body.data) return { success: false, error: body.message || 'Error al cargar notificaciones' }
  return { success: true, data: body.data }
}

export async function getUnreadNotificationCount() {
  const res = await apiFetch('/notifications/unread-count')
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}`, count: 0 }
  return { success: true, count: body.data?.count ?? 0 }
}

export async function createNotification(payload) {
  const res = await apiFetch('/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || body.error || `Error ${res.status}` }
  if (!body.success) return { success: false, error: body.message || 'Error' }
  return { success: true, data: body.data }
}

export async function markNotificationRead(id) {
  const res = await apiFetch(`/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  return { success: true }
}

export async function markAllNotificationsRead() {
  const res = await apiFetch('/notifications/mark-all-read', { method: 'POST' })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { success: false, error: body.message || `Error ${res.status}` }
  return { success: true }
}
