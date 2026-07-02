import { useState, useEffect, useCallback } from 'react'
import { folderExpedienteLabel } from '../utils/expedienteDisplay'

const STORAGE_PREFIX = 'deportivo_expediente_favorites_'

function readFavorites(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function useExpedienteFavorites(userId) {
  const storageKey = `${STORAGE_PREFIX}${userId || 'anon'}`
  const [favorites, setFavorites] = useState(() => readFavorites(storageKey))

  useEffect(() => {
    setFavorites(readFavorites(storageKey))
  }, [storageKey])

  const persist = useCallback(
    (next) => {
      setFavorites(next)
      localStorage.setItem(storageKey, JSON.stringify(next))
    },
    [storageKey],
  )

  const isFavorite = useCallback(
    (id) => favorites.some((f) => f.id === id),
    [favorites],
  )

  const toggleFavorite = useCallback(
    (row) => {
      const id = row?.id
      if (!id) return
      const exists = favorites.find((f) => f.id === id)
      if (exists) {
        persist(favorites.filter((f) => f.id !== id))
        return
      }
      persist([
        {
          id,
          expedienteNumber: row.expedienteNumber,
          label: folderExpedienteLabel(row),
          clientName: row.clientName || null,
          orderNumber: row.orderNumber || null,
          quotationNumber: row.quotationNumber || null,
          addedAt: Date.now(),
        },
        ...favorites,
      ])
    },
    [favorites, persist],
  )

  return { favorites, isFavorite, toggleFavorite }
}
