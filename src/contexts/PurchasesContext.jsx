import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { listPurchases } from '../api/purchases'

const PurchasesContext = createContext(null)

export function PurchasesProvider({ children }) {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshPurchases = useCallback(async (params = {}) => {
    setLoading(true)
    setError(null)
    const r = await listPurchases(params)
    setLoading(false)
    if (r.success) {
      setPurchases(r.data || [])
      return true
    }
    setError(r.error || 'Error al cargar compras')
    setPurchases([])
    return false
  }, [])

  useEffect(() => {
    refreshPurchases()
  }, [refreshPurchases])

  const value = useMemo(
    () => ({ purchases, loading, error, refreshPurchases }),
    [purchases, loading, error, refreshPurchases],
  )

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>
}

export function usePurchases() {
  const ctx = useContext(PurchasesContext)
  if (!ctx) {
    throw new Error('usePurchases debe usarse dentro de PurchasesProvider')
  }
  return ctx
}
