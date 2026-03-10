import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { login as apiLogin } from '../api/auth'

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
    }
    setUser(toStore)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

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

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUserProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
