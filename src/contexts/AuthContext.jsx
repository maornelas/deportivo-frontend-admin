import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { login as apiLogin } from '../api/auth'
import { moduleCodeForPath, firstAccessiblePathFromRbac } from '../config/adminModules'

const STORAGE_KEY = 'deportivo_admin_user'
const AVATAR_KEY_PREFIX = 'deportivo_admin_avatar_'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadStoredUser = useCallback(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && (parsed.id || parsed.email)) {
          const avatarUrl = parsed.id ? localStorage.getItem(AVATAR_KEY_PREFIX + parsed.id) : null
          if (avatarUrl) parsed.avatarUrl = avatarUrl
          if (!parsed.rbac) parsed.rbac = { fullAccess: true, grants: [] }
          setUser(parsed)
        }
      }
    } catch (_) {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStoredUser()
  }, [loadStoredUser])

  const login = useCallback(async (email, password) => {
    const result = await apiLogin({ email, password })
    if (!result.success) {
      return { success: false, error: result.error }
    }
    const userData = result.data
    const toStore = {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      adminRoleId: userData.adminRoleId ?? null,
      rbac: userData.rbac || { fullAccess: false, grants: [] },
    }
    setUser(toStore)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    const redirectTo = firstAccessiblePathFromRbac(toStore.rbac)
    return { success: true, redirectTo }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const canAccessModuleCode = useCallback(
    (code, needWrite = false) => {
      if (!user?.rbac) return true
      const { fullAccess, grants } = user.rbac
      if (fullAccess) return true
      if (!code) return true
      const g = (grants || []).find((x) => x.code === code)
      if (!g) return false
      if (!needWrite) return true
      return g.accessLevel === 'write'
    },
    [user],
  )

  const canViewPath = useCallback(
    (pathname) => {
      const code = moduleCodeForPath(pathname)
      if (!code) return true
      return canAccessModuleCode(code, false)
    },
    [canAccessModuleCode],
  )

  const canWritePath = useCallback(
    (pathname) => {
      const code = moduleCodeForPath(pathname)
      if (!code) return true
      return canAccessModuleCode(code, true)
    },
    [canAccessModuleCode],
  )

  /**
   * Permiso granular por código `action.*` en grants del login.
   * @param {string} actionCode - ej. action.inventario.crear_producto
   * @param {{ requireWrite?: boolean }} options - si false, basta `read` o `write` (p. ej. solo consultar)
   */
  const canDoAction = useCallback(
    (actionCode, options = {}) => {
      const { requireWrite = true } = options
      if (!user?.rbac) return true
      const { fullAccess, grants } = user.rbac
      if (fullAccess) return true
      if (!actionCode) return true
      const list = grants || []
      const g = list.find((x) => x.code === actionCode)
      if (g) {
        if (requireWrite) return g.accessLevel === 'write'
        return g.accessLevel === 'read' || g.accessLevel === 'write'
      }
      // Sin fila `action.*`: usar el módulo padre `action.{sección}.*` → `module.{sección}`
      const m = String(actionCode).match(/^action\.([^.]+)\./)
      if (!m) return false
      const moduleCode = `module.${m[1]}`
      const mg = list.find((x) => x.code === moduleCode)
      if (!mg) return false
      if (requireWrite) return mg.accessLevel === 'write'
      return mg.accessLevel === 'read' || mg.accessLevel === 'write'
    },
    [user],
  )

  const updateUserProfile = useCallback((updated) => {
    if (!updated || !user) return
    if (updated.avatarUrl !== undefined && user.id) {
      localStorage.setItem(AVATAR_KEY_PREFIX + user.id, updated.avatarUrl)
    }
    const { avatarUrl: _a, ...rest } = updated
    const next = { ...user, ...rest }
    if (updated.avatarUrl !== undefined) next.avatarUrl = updated.avatarUrl
    setUser(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...next, avatarUrl: undefined }))
  }, [user])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      logout,
      updateUserProfile,
      canAccessModuleCode,
      canViewPath,
      canWritePath,
      canDoAction,
    }),
    [user, loading, login, logout, updateUserProfile, canAccessModuleCode, canViewPath, canWritePath, canDoAction],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
