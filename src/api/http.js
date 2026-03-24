const STORAGE_KEY = 'deportivo_admin_user'

export function getBaseUrl() {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  return 'http://localhost:3000/api/v1'
}

/** Cabeceras para auditoría en backend (historial de acciones). */
export function getAdminContextHeaders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const u = JSON.parse(raw)
    if (!u?.id) return {}
    return {
      'X-Admin-User-Id': u.id,
      'X-Admin-User-Email': u.email || '',
      'X-Admin-User-Name': [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '',
      'X-Admin-User-Role': u.role || 'admin',
    }
  } catch {
    return {}
  }
}

/**
 * @param {string} path - ruta relativa al API (ej. `/expenses`) o URL absoluta
 * @param {RequestInit} [options]
 */
export async function apiFetch(path, options = {}) {
  const base = getBaseUrl()
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`
  const headers = new Headers(options.headers || {})
  const ctx = getAdminContextHeaders()
  Object.entries(ctx).forEach(([k, v]) => {
    if (v != null && String(v).length) headers.set(k, String(v))
  })
  return fetch(url, { ...options, headers })
}
