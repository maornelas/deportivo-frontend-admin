import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { computePurchaseTotal } from '../compras/shared'

const PurchasesContext = createContext(null)

function buildSeedPurchases() {
  const seed = [
    {
      id: crypto.randomUUID(),
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
  const [purchases, setPurchases] = useState(buildSeedPurchases)

  const addPurchase = useCallback((p) => {
    setPurchases((prev) => {
      if (prev.some((x) => String(x.id) === String(p.id))) return prev
      return [p, ...prev]
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
