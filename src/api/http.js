const STORAGE_KEY = 'deportivo_admin_user'

/**
 * Base del API. En `npm run dev`, usar `/api/v1` para que Vite haga proxy a `VITE_DEV_PROXY_TARGET`
 * (mismo origen que :5173 → sin CORS). `http://localhost:3000/api/v1` en el .env provoca cross-origin y fallos de preflight.
 */
export function getBaseUrl() {
  const raw = import.meta.env.VITE_API_URL?.trim()
  let base
  if (raw) {
    const b = raw.replace(/\/$/, '')
    if (b.startsWith('http://') || b.startsWith('https://')) {
      base = b.endsWith('/api/v1') ? b : `${b}/api/v1`
    } else if (b === '/api/v1' || b.endsWith('/api/v1')) {
      base = b.startsWith('/') ? b : `/${b}`
    } else {
      const withPrefix = `${b}/api/v1`.replace(/\/{2,}/g, '/')
      base = withPrefix.startsWith('/') ? withPrefix : `/${withPrefix}`
    }
  } else {
    base = import.meta.env.DEV ? '/api/v1' : 'http://localhost:3000/api/v1'
  }

  if (
    import.meta.env.DEV &&
    import.meta.env.VITE_API_SKIP_PROXY !== 'true' &&
    /^https?:\/\/(localhost|127\.0\.0\.1):3000\/api\/v1$/i.test(base)
  ) {
    return '/api/v1'
  }
  return base
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
