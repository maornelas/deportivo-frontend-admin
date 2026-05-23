import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from '@mui/material'
import { MyLocation as MyLocationIcon, Save as SaveIcon } from '@mui/icons-material'
import { geocodeAddress, loadGoogleMaps, reverseGeocode } from './googleMapsHelpers'

function destPinIcon(maps) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="58" viewBox="0 0 48 58">
  <path fill="#C62828" stroke="#fff" stroke-width="2" d="M24 3C13.5 3 5 11.2 5 21.5 5 35 24 54 24 54s19-19 19-32.5C43 11.2 34.5 3 24 3z"/>
  <circle cx="24" cy="21" r="6" fill="#fff"/>
</svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(44, 54),
    anchor: new maps.Point(22, 54),
  }
}

/**
 * @param {{
 *   mapsKey: string,
 *   value: { lat: number, lng: number, address: string } | null,
 *   onChange: (v: { lat: number, lng: number, address: string }) => void,
 *   onSave?: (v: { lat: number, lng: number, address: string }) => Promise<void>,
 *   defaultAddress?: string,
 *   disabled?: boolean,
 * }} props
 */
export default function DeliveryDestinationPicker({
  mapsKey,
  value,
  onChange,
  onSave,
  defaultAddress = '',
  disabled = false,
}) {
  const mapDivRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const [addressInput, setAddressInput] = useState(value?.address || defaultAddress || '')
  const [mapLoading, setMapLoading] = useState(true)
  const [mapError, setMapError] = useState('')
  const [geoBusy, setGeoBusy] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const placeMarker = useCallback(
    (lat, lng, pan = true) => {
      const map = mapRef.current
      const g = window.google?.maps
      if (!map || !g) return
      const pos = { lat, lng }
      if (!markerRef.current) {
        markerRef.current = new g.Marker({
          map,
          position: pos,
          draggable: !disabled,
          title: 'Punto de entrega',
          icon: destPinIcon(g),
        })
        markerRef.current.addListener('dragend', () => {
          const p = markerRef.current.getPosition()
          if (!p) return
          const next = { lat: p.lat(), lng: p.lng() }
          onChange({ lat: next.lat, lng: next.lng, address: addressInput })
          void reverseGeocode(next.lat, next.lng)
            .then((formatted) => {
              setAddressInput(formatted)
              onChange({ lat: next.lat, lng: next.lng, address: formatted })
            })
            .catch(() => {
              onChange({ lat: next.lat, lng: next.lng, address: addressInput })
            })
        })
      } else {
        markerRef.current.setPosition(pos)
      }
      if (pan) map.panTo(pos)
    },
    [addressInput, disabled, onChange],
  )

  useEffect(() => {
    setAddressInput(value?.address || defaultAddress || '')
  }, [value?.address, defaultAddress])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setMapLoading(true)
      setMapError('')
      try {
        await loadGoogleMaps(mapsKey)
        if (cancelled) return
        const el = mapDivRef.current
        if (!el) return
        const center =
          value?.lat != null && value?.lng != null
            ? { lat: value.lat, lng: value.lng }
            : { lat: 21.125, lng: -101.686 }
        const map = new window.google.maps.Map(el, {
          center,
          zoom: value?.lat != null ? 16 : 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })
        mapRef.current = map
        map.addListener('click', (e) => {
          if (disabled || !e.latLng) return
          const lat = e.latLng.lat()
          const lng = e.latLng.lng()
          placeMarker(lat, lng, false)
          onChange({ lat, lng, address: addressInput })
          void reverseGeocode(lat, lng)
            .then((formatted) => {
              setAddressInput(formatted)
              onChange({ lat, lng, address: formatted })
            })
            .catch(() => onChange({ lat, lng, address: addressInput }))
        })
        if (value?.lat != null && value?.lng != null) {
          placeMarker(value.lat, value.lng, false)
        } else if (defaultAddress?.trim()) {
          try {
            const g = await geocodeAddress(defaultAddress)
            if (!cancelled) {
              placeMarker(g.lat, g.lng, true)
              setAddressInput(g.formattedAddress)
              onChange({ lat: g.lat, lng: g.lng, address: g.formattedAddress })
            }
          } catch {
            /* sin coords iniciales */
          }
        }
      } catch (e) {
        if (!cancelled) setMapError(e instanceof Error ? e.message : 'Error al cargar el mapa')
      } finally {
        if (!cancelled) setMapLoading(false)
      }
    })()
    return () => {
      cancelled = true
      markerRef.current = null
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsKey])

  useEffect(() => {
    if (value?.lat != null && value?.lng != null && mapRef.current) {
      placeMarker(value.lat, value.lng, true)
    }
  }, [value?.lat, value?.lng, placeMarker])

  const handleGeocode = async () => {
    setGeoBusy(true)
    setMapError('')
    try {
      await loadGoogleMaps(mapsKey)
      const g = await geocodeAddress(addressInput)
      placeMarker(g.lat, g.lng, true)
      setAddressInput(g.formattedAddress)
      onChange({ lat: g.lat, lng: g.lng, address: g.formattedAddress })
    } catch (e) {
      setMapError(e instanceof Error ? e.message : 'No se pudo ubicar la dirección')
    } finally {
      setGeoBusy(false)
    }
  }

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Tu navegador no permite geolocalización')
      return
    }
    setGeoBusy(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await loadGoogleMaps(mapsKey)
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          placeMarker(lat, lng, true)
          let addr = addressInput
          try {
            addr = await reverseGeocode(lat, lng)
            setAddressInput(addr)
          } catch {
            /* keep text */
          }
          onChange({ lat, lng, address: addr })
        } finally {
          setGeoBusy(false)
        }
      },
      (err) => {
        setGeoBusy(false)
        setMapError(err.message || 'No se pudo obtener tu ubicación')
      },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const handleSave = async () => {
    if (value?.lat == null || value?.lng == null) {
      setMapError('Coloca el marcador en el mapa o busca una dirección')
      return
    }
    if (!onSave) return
    setSaveBusy(true)
    setSaveMsg('')
    try {
      await onSave({ lat: value.lat, lng: value.lng, address: value.address || addressInput })
      setSaveMsg('Ubicación guardada')
    } catch (e) {
      setMapError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setSaveBusy(false)
    }
  }

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Ajusta la dirección y arrastra el marcador rojo al punto exacto de entrega.
      </Typography>
      <TextField
        fullWidth
        size="small"
        label="Dirección de entrega"
        value={addressInput}
        onChange={(e) => setAddressInput(e.target.value)}
        disabled={disabled}
        multiline
        minRows={2}
        sx={{ mb: 1 }}
      />
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={handleGeocode}
          disabled={disabled || geoBusy}
        >
          {geoBusy ? 'Buscando…' : 'Ubicar en mapa'}
        </Button>
        <Button
          size="small"
          variant="outlined"
          startIcon={<MyLocationIcon />}
          onClick={handleUseMyLocation}
          disabled={disabled || geoBusy}
        >
          Mi ubicación
        </Button>
        {onSave ? (
          <Button
            size="small"
            variant="contained"
            startIcon={saveBusy ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={disabled || saveBusy || value?.lat == null}
          >
            Guardar destino
          </Button>
        ) : null}
      </Box>
      {saveMsg ? (
        <Typography variant="caption" color="success.main" sx={{ display: 'block', mb: 1 }}>
          {saveMsg}
        </Typography>
      ) : null}
      {mapError ? (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {mapError}
        </Alert>
      ) : null}
      <Box
        sx={{
          position: 'relative',
          height: 280,
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {mapLoading ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
            }}
          >
            <CircularProgress size={28} />
          </Box>
        ) : null}
        <Box ref={mapDivRef} sx={{ width: '100%', height: '100%' }} />
      </Box>
      {value?.lat != null ? (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Coordenadas: {value.lat.toFixed(6)}, {value.lng.toFixed(6)}
        </Typography>
      ) : (
        <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
          Debes definir el punto de entrega antes de iniciar el recorrido.
        </Typography>
      )}
    </Box>
  )
}
