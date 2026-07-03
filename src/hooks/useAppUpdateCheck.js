import { useCallback, useEffect, useRef, useState } from 'react'
import { BUILD_ID } from '../config/app'

const POLL_INTERVAL_MS = 5 * 60 * 1000

async function fetchDeployedVersion() {
  const url = `/version.json?_=${Date.now()}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) return null
  const data = await res.json()
  if (!data?.buildId) return null
  return data
}

/**
 * Compara el build cargado en el navegador con el desplegado en el servidor.
 * Si hay un deploy nuevo, devuelve updateAvailable = true.
 */
export function useAppUpdateCheck({ enabled = true } = {}) {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [remoteVersion, setRemoteVersion] = useState(null)
  const checkingRef = useRef(false)

  const checkForUpdate = useCallback(async () => {
    if (!enabled || checkingRef.current || updateAvailable) return
    checkingRef.current = true
    try {
      const remote = await fetchDeployedVersion()
      if (!remote) return
      setRemoteVersion(remote)
      if (remote.buildId !== BUILD_ID) {
        setUpdateAvailable(true)
      }
    } catch {
      // Sin conexión o sin version.json: no interrumpir al usuario
    } finally {
      checkingRef.current = false
    }
  }, [enabled, updateAvailable])

  useEffect(() => {
    if (!enabled) return undefined

    const initialDelay = window.setTimeout(checkForUpdate, 15_000)

    const intervalId = window.setInterval(checkForUpdate, POLL_INTERVAL_MS)

    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.clearTimeout(initialDelay)
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [enabled, checkForUpdate])

  const applyUpdate = useCallback(() => {
    window.location.reload()
  }, [])

  return { updateAvailable, remoteVersion, applyUpdate, checkForUpdate }
}
