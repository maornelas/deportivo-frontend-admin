import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { computePurchaseTotal } from '../compras/shared'

const PurchasesContext = createContext(null)

function isCmpFolio(v) {
  return /^CMP-\d{6}$/.test(String(v || ''))
}

function buildCmpFolio(n) {
  return `CMP-${String(n).padStart(6, '0')}`
}

function maxCmpFrom(list = []) {
  let max = 0
  for (const p of list) {
    const id = String(p?.id || '')
    if (!isCmpFolio(id)) continue
    const n = Number(id.slice(4))
    if (!Number.isNaN(n) && n > max) max = n
  }
  return max
}

function normalizePurchaseIds(list = []) {
  const sorted = [...list].sort(
    (a, b) =>
      new Date(a?.createdAt || a?.purchaseDate || 0).getTime() -
      new Date(b?.createdAt || b?.purchaseDate || 0).getTime(),
  )
  let seq = maxCmpFrom(sorted)
  return sorted.map((p) => {
    if (isCmpFolio(p.id)) return p
    seq += 1
    return { ...p, id: buildCmpFolio(seq) }
  })
}

function buildSeedPurchases() {
  const seed = [
    {
      id: 'CMP-000001',
      providerName: 'Proveedor Demo SA de CV',
      purchaseDate: new Date().toISOString(),
      paymentMethod: 'transfer',
      status: 'pending',
      notes: 'Recibo pendiente de confirmación.',
      currency: 'MXN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      receiptFileName: '',
      vehicleBrandId: '',
      vehicleBrand: 'KIA',
      vehicleModel: 'RIO',
      vehicleYear: '2019',
      items: [
        {
          key: crypto.randomUUID(),
          productId: null,
          productName: 'Faro delantero',
          sku: '',
          partType: 'ORIGINAL',
          partCondition: 'NUEVO',
          unitPrice: 850,
          quantity: 2,
        },
        {
          key: crypto.randomUUID(),
          productId: null,
          productName: 'Filtro de aceite',
          sku: '',
          partType: 'GENÉRICO',
          partCondition: 'NUEVO',
          unitPrice: 120,
          quantity: 5,
        },
      ],
    },
  ]
  return seed.map((p) => ({
    ...p,
    total: computePurchaseTotal(p.items),
  }))
}

export function PurchasesProvider({ children }) {
  const [purchases, setPurchases] = useState(() => normalizePurchaseIds(buildSeedPurchases()))

  const addPurchase = useCallback((p) => {
    setPurchases((prev) => {
      const normalizedPrev = normalizePurchaseIds(prev)
      const nextNum = maxCmpFrom(normalizedPrev) + 1
      const folio = isCmpFolio(p?.id) ? String(p.id) : buildCmpFolio(nextNum)
      if (normalizedPrev.some((x) => String(x.id) === folio)) return normalizedPrev
      return [{ ...p, id: folio }, ...normalizedPrev]
    })
  }, [])

  const updatePurchase = useCallback((payload) => {
    setPurchases((prev) => prev.map((x) => (String(x.id) === String(payload.id) ? payload : x)))
  }, [])

  const removePurchase = useCallback((id) => {
    setPurchases((prev) => prev.filter((p) => String(p.id) !== String(id)))
  }, [])

  const value = useMemo(
    () => ({ purchases, setPurchases, addPurchase, updatePurchase, removePurchase }),
    [purchases, addPurchase, updatePurchase, removePurchase],
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
