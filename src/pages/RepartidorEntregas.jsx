import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Alert,
  Stack,
  Chip,
} from '@mui/material'
import { LocalShipping, Description, Map as MapIcon } from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import SignaturePad from '../components/SignaturePad'
import { SIDEBAR_WIDTH } from '../config/layout'
import { useAuth } from '../contexts/AuthContext'
import jsPDF from 'jspdf'

const MAPS_SCRIPT_ID = 'deportivo-google-maps-js'

function loadGoogleMaps(apiKey) {
  if (!apiKey?.trim()) {
    return Promise.reject(new Error('Falta VITE_GOOGLE_MAPS_API_KEY'))
  }
  if (typeof window !== 'undefined' && window.google?.maps?.Map) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(MAPS_SCRIPT_ID)
    if (existing) {
      const t0 = Date.now()
      const iv = setInterval(() => {
        if (window.google?.maps?.Map) {
          clearInterval(iv)
          resolve()
        } else if (Date.now() - t0 > 15000) {
          clearInterval(iv)
          reject(new Error('Timeout cargando Google Maps'))
        }
      }, 100)
      return
    }
    const s = document.createElement('script')
    s.id = MAPS_SCRIPT_ID
    s.async = true
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey.trim())}`
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('No se pudo cargar el script de Google Maps'))
    document.head.appendChild(s)
  })
}

/**
 * Pin del repartidor: silueta de moto sobre fondo tipo mapa.
 * @param {typeof google.maps} maps
 */
function motoPinIcon(maps) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="58" viewBox="0 0 48 58">
  <path fill="#1565C0" stroke="#fff" stroke-width="2" d="M24 3C13.5 3 5 11.2 5 21.5 5 35 24 54 24 54s19-19 19-32.5C43 11.2 34.5 3 24 3z"/>
  <g fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="16.5" cy="19.5" r="3.8" stroke-width="1.9"/>
    <circle cx="31.5" cy="19.5" r="3.8" stroke-width="1.9"/>
    <path stroke-width="1.9" d="M16.5 19.5 L21 11.5 L27 11.5 L31.5 19.5"/>
    <path stroke-width="1.6" d="M21 11.5 L24 8.5 L29 10.5 L27 11.5"/>
    <path stroke="#BBDEFB" stroke-width="1.4" d="M24 8.5 L26.5 7"/>
    <ellipse cx="24" cy="13" rx="3" ry="1.3" fill="#fff" stroke="none" opacity="0.9"/>
  </g>
</svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(44, 54),
    anchor: new maps.Point(22, 54),
  }
}

/**
 * @param {typeof google.maps} maps
 */
function storePinIcon(maps) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="58" viewBox="0 0 48 58">
  <path fill="#2E7D32" stroke="#fff" stroke-width="2" d="M24 3C13.5 3 5 11.2 5 21.5 5 35 24 54 24 54s19-19 19-32.5C43 11.2 34.5 3 24 3z"/>
  <path fill="#fff" d="M11 20h26v14H11z"/>
  <path fill="#A5D6A7" d="M11 20L24 12l13 8"/>
  <rect x="19" y="26" width="10" height="8" rx="1" fill="#1B5E20"/>
</svg>`
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(44, 54),
    anchor: new maps.Point(22, 54),
  }
}

/** ~distancia en km, bearing aleatorio */
function randomDestination(lat, lng, minKm = 0.8, maxKm = 2.2) {
  const distKm = minKm + Math.random() * (maxKm - minKm)
  const bearing = Math.random() * 2 * Math.PI
  const radLat = (lat * Math.PI) / 180
  const dLat = (distKm / 111) * Math.cos(bearing)
  const dLng = (distKm / (111 * Math.max(0.2, Math.cos(radLat)))) * Math.sin(bearing)
  return { lat: lat + dLat, lng: lng + dLng }
}

export default function RepartidorEntregas() {
  const { canViewPath, user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [tab, setTab] = useState(0)

  const [folio, setFolio] = useState('')
  const [signaturePng, setSignaturePng] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null)

  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  const [mapsReady, setMapsReady] = useState(false)
  const [mapsError, setMapsError] = useState('')
  const [routeActive, setRouteActive] = useState(false)
  /** Origen y destino al iniciar (ruta fija en el mapa) */
  const [routeSeed, setRouteSeed] = useState(null)
  /** Posición actual del repartidor (se actualiza con watchPosition) */
  const [liveDriver, setLiveDriver] = useState(null)
  const [geoError, setGeoError] = useState('')
  const mapDivRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const directionsRendererRef = useRef(null)
  /** Marcador moto = posición del repartidor */
  const motoMarkerRef = useRef(null)
  /** Marcador tienda = punto de entrega simulado */
  const storeMarkerRef = useRef(null)
  const watchIdRef = useRef(null)

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl)
    }
  }, [uploadPreviewUrl])

  const handleFile = (e) => {
    const f = e.target.files?.[0]
    setUploadedFile(f || null)
    if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl)
    if (f && f.type.startsWith('image/')) {
      setUploadPreviewUrl(URL.createObjectURL(f))
    } else {
      setUploadPreviewUrl(null)
    }
  }

  const buildPdfWithSignature = useCallback(() => {
    if (!signaturePng) return
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    const title = 'Nota de venta — firma digital'
    pdf.setFontSize(14)
    pdf.text(title, 14, 18)
    pdf.setFontSize(10)
    pdf.text(`Folio / referencia: ${folio.trim() || '—'}`, 14, 26)
    pdf.text(`Repartidor: ${[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '—'}`, 14, 32)
    pdf.text(`Fecha: ${new Date().toLocaleString('es-MX')}`, 14, 38)
    pdf.addImage(signaturePng, 'PNG', 14, 48, 120, 45)
    pdf.setFontSize(8)
    pdf.text('Firma del cliente / receptor', 14, 98)
    pdf.save(`nota-venta-${folio.trim() || 'sin-folio'}.pdf`)
  }, [signaturePng, folio, user])

  const stopRoute = useCallback(() => {
    setRouteActive(false)
    setRouteSeed(null)
    setLiveDriver(null)
    setMapsReady(false)
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (motoMarkerRef.current) {
      motoMarkerRef.current.setMap(null)
      motoMarkerRef.current = null
    }
    if (storeMarkerRef.current) {
      storeMarkerRef.current.setMap(null)
      storeMarkerRef.current = null
    }
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = null
    }
    mapInstanceRef.current = null
  }, [])

  const startRoute = useCallback(() => {
    setGeoError('')
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no permite geolocalización.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const dest = randomDestination(lat, lng)
        const origin = { lat, lng }
        setRouteSeed({ driver: origin, dest })
        setLiveDriver(origin)
        setRouteActive(true)
      },
      (err) => {
        setGeoError(err.message || 'No se pudo obtener tu ubicación (¿permisos o HTTPS?).')
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }, [])

  useEffect(() => {
    if (!routeActive || !routeSeed || !mapsKey) return
    let cancelled = false
    ;(async () => {
      try {
        await loadGoogleMaps(mapsKey)
        if (cancelled) return
        setMapsError('')
        setMapsReady(true)
      } catch (e) {
        if (!cancelled) setMapsError(e instanceof Error ? e.message : 'Maps error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [routeActive, routeSeed, mapsKey])

  useEffect(() => {
    if (!mapsReady || !routeActive || !routeSeed) return
    const el = mapDivRef.current
    if (!el || !window.google?.maps) return

    const { driver, dest } = routeSeed
    const map = new window.google.maps.Map(el, {
      center: driver,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })
    mapInstanceRef.current = map

    const directionsService = new window.google.maps.DirectionsService()
    const renderer = new window.google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
    })
    directionsRendererRef.current = renderer

    directionsService.route(
      {
        origin: driver,
        destination: dest,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          renderer.setDirections(result)
        }
      },
    )

    const g = window.google.maps
    motoMarkerRef.current = new g.Marker({
      map,
      position: driver,
      title: 'Moto — tu ubicación (repartidor)',
      icon: motoPinIcon(g),
      zIndex: 3,
    })

    storeMarkerRef.current = new g.Marker({
      map,
      position: dest,
      title: 'Tienda — punto de entrega',
      icon: storePinIcon(g),
      zIndex: 2,
    })

    return () => {
      if (motoMarkerRef.current) {
        motoMarkerRef.current.setMap(null)
        motoMarkerRef.current = null
      }
      if (storeMarkerRef.current) {
        storeMarkerRef.current.setMap(null)
        storeMarkerRef.current = null
      }
      renderer.setMap(null)
      directionsRendererRef.current = null
      mapInstanceRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- init solo al abrir ruta con routeSeed; liveDriver se actualiza aparte
  }, [mapsReady, routeActive, routeSeed])

  useEffect(() => {
    if (!liveDriver || !motoMarkerRef.current) return
    motoMarkerRef.current.setPosition(liveDriver)
  }, [liveDriver])

  useEffect(() => {
    if (!routeActive) return
    if (!navigator.geolocation) return
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLiveDriver({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    )
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [routeActive])

  if (!canViewPath('/repartidor')) {
    return null
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginTop: { xs: 0, md: '70px' },
          pt: { xs: 1.5, sm: 2, md: 3 },
          pr: { xs: 1.5, sm: 2, md: 3 },
          pb: { xs: 3, md: 4 },
          pl: { xs: 1.5, sm: 2, md: `${SIDEBAR_WIDTH + 32}px` },
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <LocalShipping color="primary" sx={{ fontSize: { xs: 28, sm: 32 } }} />
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
            Repartidor — entregas
          </Typography>
          <Chip size="small" label="Vista móvil" variant="outlined" sx={{ ml: { xs: 0, sm: 1 } }} />
        </Stack>

        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              minHeight: 48,
              '& .MuiTab-root': { minHeight: 48, fontSize: { xs: '0.8rem', sm: '0.875rem' }, py: 1 },
            }}
          >
            <Tab icon={<Description sx={{ fontSize: 20 }} />} iconPosition="start" label="Nota de venta" />
            <Tab icon={<MapIcon sx={{ fontSize: 20 }} />} iconPosition="start" label="Recorrido" />
          </Tabs>

          <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
            <Box sx={{ display: tab === 0 ? 'block' : 'none' }} aria-hidden={tab !== 0}>
              <Stack spacing={2}>
                <Alert severity="info" sx={{ '& .MuiAlert-message': { width: '100%' } }}>
                  Registra la nota firmada en el momento o sube una foto/PDF ya firmado. El PDF con firma digital se
                  genera en tu dispositivo (no se envía al servidor en esta versión).
                </Alert>
                <TextField
                  fullWidth
                  size="small"
                  label="Folio o número de pedido (opcional)"
                  value={folio}
                  onChange={(e) => setFolio(e.target.value)}
                  placeholder="Ej. ORD-12345"
                />
                <Typography variant="subtitle2">Firma digital (dedo o lápiz en pantalla)</Typography>
                <SignaturePad onChange={setSignaturePng} sx={{ maxWidth: '100%' }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant="contained"
                    fullWidth
                    disabled={!signaturePng}
                    onClick={buildPdfWithSignature}
                  >
                    Descargar PDF con firma
                  </Button>
                </Stack>
                <Typography variant="subtitle2">O subir nota ya firmada</Typography>
                <Button variant="outlined" component="label" fullWidth sx={{ py: 1.5 }}>
                  Elegir archivo (PDF o imagen)
                  <input type="file" hidden accept="image/*,.pdf,application/pdf" onChange={handleFile} />
                </Button>
                {uploadedFile && (
                  <Typography variant="body2" color="text.secondary">
                    Archivo: <strong>{uploadedFile.name}</strong> ({Math.round(uploadedFile.size / 1024)} KB)
                  </Typography>
                )}
                {uploadPreviewUrl && (
                  <Box
                    component="img"
                    src={uploadPreviewUrl}
                    alt="Vista previa"
                    sx={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 1, border: 1, borderColor: 'divider' }}
                  />
                )}
              </Stack>
            </Box>

            <Box sx={{ display: tab === 1 ? 'block' : 'none' }} aria-hidden={tab !== 1}>
              <Stack spacing={2}>
                <Alert severity="warning">
                  El punto de entrega es <strong>simulado</strong> (aleatorio cerca de tu posición) solo para demostrar el
                  mapa. En producción vendría de la dirección del pedido.
                </Alert>
                {!mapsKey && (
                  <Alert severity="error">
                    Configura <code>VITE_GOOGLE_MAPS_API_KEY</code> en <code>.env</code> y vuelve a compilar el admin.
                  </Alert>
                )}
                {mapsError && <Alert severity="error">{mapsError}</Alert>}
                {geoError && <Alert severity="error">{geoError}</Alert>}
                <Typography variant="body2" color="text.secondary">
                  La geolocalización suele requerir <strong>HTTPS</strong> (excepto localhost). Si no ves el mapa o la
                  posición, prueba desde un dominio seguro o concede permisos de ubicación.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  {!routeActive ? (
                    <Button variant="contained" size="large" fullWidth onClick={startRoute} disabled={!mapsKey}>
                      Iniciar recorrido
                    </Button>
                  ) : (
                    <Button variant="outlined" color="secondary" size="large" fullWidth onClick={stopRoute}>
                      Finalizar recorrido
                    </Button>
                  )}
                </Stack>
                {routeActive && liveDriver && routeSeed && (
                  <Stack spacing={0.5}>
                    <Typography variant="caption" color="text.secondary" component="div">
                      <strong>PIN azul (moto):</strong> repartidor / tu ubicación ·{' '}
                      <strong>PIN verde (tienda):</strong> punto de entrega simulado
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="div">
                      GPS moto: {liveDriver.lat.toFixed(5)}, {liveDriver.lng.toFixed(5)} · Tienda:{' '}
                      {routeSeed.dest.lat.toFixed(5)}, {routeSeed.dest.lng.toFixed(5)}
                    </Typography>
                  </Stack>
                )}
                <Box
                  ref={mapDivRef}
                  sx={{
                    width: '100%',
                    height: { xs: 'min(55vh, 420px)', md: 420 },
                    minHeight: 280,
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                  }}
                />
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
