const STORAGE_KEY = 'deportivo_admin_user'

export function getBaseUrl() {
  const raw = import.meta.env.VITE_API_URL?.trim()
  if (raw) {
    const base = raw.replace(/\/$/, '')
    if (base.startsWith('http://') || base.startsWith('https://')) {
      if (base.endsWith('/api/v1')) return base
      return `${base}/api/v1`
    }
    if (base === '/api/v1' || base.endsWith('/api/v1')) return base.startsWith('/') ? base : `/${base}`
    const withPrefix = `${base}/api/v1`.replace(/\/{2,}/g, '/')
    return withPrefix.startsWith('/') ? withPrefix : `/${withPrefix}`
  }
  return 'http://localhost:3000/api/v1'
}

/** Une base + path de forma segura (conserva ?query en path). */
function resolveApiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  const base = getBaseUrl()
  if (base.startsWith('http://') || base.startsWith('https://')) {
    const root = base.replace(/\/$/, '')
    return `${root}${p}`
  }
  const root = base.replace(/\/$/, '')
  return `${root}${p}`
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
  const url = resolveApiUrl(path)
  const headers = new Headers(options.headers || {})
  const ctx = getAdminContextHeaders()
  Object.entries(ctx).forEach(([k, v]) => {
    if (v != null && String(v).length) headers.set(k, String(v))
  })
  return fetch(url, { ...options, headers })
}
