/** Código de permiso `module.*` asociado a cada ruta del panel */
export const MODULE_CODE_BY_PATH = {
  '/dashboard': 'module.dashboard',
  '/inventario': 'module.inventario',
  '/cotizaciones': 'module.cotizaciones',
  '/ventas': 'module.ventas',
  '/compras': 'module.compras',
  '/gastos': 'module.gastos',
  '/historial': 'module.historial',
  '/notificaciones': 'module.notificaciones',
  '/reporteria': 'module.reporteria',
  '/clientes': 'module.clientes',
  '/usuarios': 'module.usuarios',
  '/catalogos': 'module.catalogos',
  '/roles': 'module.roles',
  '/repartidor': 'module.repartidor',
}

/** Rutas sin módulo RBAC (siempre accesibles si hay sesión) */
export const PUBLIC_ADMIN_PATHS = ['/perfil', '/login']

function baseAdminPath(pathname) {
  if (!pathname) return null
  const m = pathname.match(/^(\/[^/]+)/)
  return m ? m[1] : pathname
}

export function pathRequiresModule(pathname) {
  const base = baseAdminPath(pathname)
  return !!(base && Object.prototype.hasOwnProperty.call(MODULE_CODE_BY_PATH, base))
}

export function moduleCodeForPath(pathname) {
  const base = baseAdminPath(pathname)
  return base ? MODULE_CODE_BY_PATH[base] || null : null
}

/** Orden de navegación para elegir la primera pantalla tras login */
export const ADMIN_NAV_PATHS_ORDER = [
  '/dashboard',
  '/repartidor',
  '/inventario',
  '/cotizaciones',
  '/ventas',
  '/compras',
  '/gastos',
  '/historial',
  '/notificaciones',
  '/reporteria',
  '/clientes',
  '/usuarios',
  '/catalogos',
  '/roles',
]

export function canViewPathFromRbac(rbac, pathname) {
  if (!rbac || rbac.fullAccess) return true
  const code = moduleCodeForPath(pathname)
  if (!code) return true
  return (rbac.grants || []).some((g) => g.code === code)
}

export function firstAccessiblePathFromRbac(rbac) {
  for (const p of ADMIN_NAV_PATHS_ORDER) {
    if (canViewPathFromRbac(rbac, p)) return p
  }
  return '/perfil'
}
