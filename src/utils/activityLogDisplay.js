/**
 * Etiquetas amigables para métodos HTTP en el historial de actividad.
 */
export function activityMethodLabel(method) {
  const m = String(method || '').toUpperCase()
  switch (m) {
    case 'GET':
      return 'LEER'
    case 'POST':
      return 'CREAR'
    case 'PUT':
    case 'PATCH':
      return 'ACTUALIZAR'
    case 'DELETE':
      return 'ELIMINAR'
    default:
      return m || '—'
  }
}

/**
 * Primer segmento de ruta tras el prefijo de API (ej. notifications → Notificaciones).
 */
function firstRouteSegment(path) {
  const clean = String(path || '')
    .replace(/\?.*$/, '')
    .replace(/\/+$/, '')
  const parts = clean.split('/').filter(Boolean)
  const vIdx = parts.findIndex((x) => /^v\d+$/i.test(x))
  if (vIdx >= 0 && parts[vIdx + 1]) return parts[vIdx + 1].toLowerCase()
  if (parts[0]?.toLowerCase() === 'api' && parts[2]) return parts[2].toLowerCase()
  return (parts[0] || '').toLowerCase()
}

/**
 * Módulo funcional del panel según la ruta registrada.
 */
export function activityModuleLabel(path) {
  const seg = firstRouteSegment(path)
  switch (seg) {
    case 'notifications':
      return 'Notificaciones'
    case 'quotations':
      return 'Cotizaciones'
    case 'order-item':
    case 'order':
      return 'Ventas'
    case 'expenses':
      return 'Gastos'
    case 'products':
      return 'Productos'
    case 'user':
      return 'Usuarios'
    case 'rbac':
      return 'Roles y permisos'
    case 'activity-logs':
      return 'Historial'
    case 'car-models':
    case 'brand':
    case 'categories':
      return 'Catálogos'
    case 'auth':
      return 'Autenticación'
    case 'user-address':
    case 'user-payment':
      return 'Clientes'
    case 'cart-item':
      return 'Carrito'
    case 'product-review':
      return 'Reseñas'
    case 'health':
      return 'Sistema'
    default:
      if (!seg) return 'Otros'
      return seg
        .split('-')
        .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
        .join(' ')
  }
}
