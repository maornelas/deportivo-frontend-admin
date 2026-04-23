import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material'
import {
  LocalShipping,
  Description,
  Map as MapIcon,
  ArrowBack,
  ExpandMore,
  Inventory2,
  Place,
  Pause,
  PlayArrow,
  OpenInNew,
  PhotoCamera,
  AttachFile,
  CheckCircle,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import SignaturePad from '../components/SignaturePad'
import { SIDEBAR_WIDTH } from '../config/layout'
import { useAuth } from '../contexts/AuthContext'
import { searchOrders, getOrderById } from '../api/orders'
import { getDeliveryByOrderId, createDelivery, updateDelivery } from '../api/deliveries'
import jsPDF from 'jspdf'

const MAPS_SCRIPT_ID = 'deportivo-google-maps-js'

/** Por encima del overlay de recorrido (theme.zIndex.modal + 2) para que los Dialog reciban foco y clics. */
const dialogAboveRouteOverlaySx = { zIndex: (theme) => theme.zIndex.modal + 100 }

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

/** Pin moto */
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

/** Destino aleatorio cerca de una posición (simulación / vista previa). */
function randomDestination(lat, lng, minKm = 0.8, maxKm = 2.2) {
  const distKm = minKm + Math.random() * (maxKm - minKm)
  const bearing = Math.random() * 2 * Math.PI
  const radLat = (lat * Math.PI) / 180
  const dLat = (distKm / 111) * Math.cos(bearing)
  const dLng = (distKm / (111 * Math.max(0.2, Math.cos(radLat)))) * Math.sin(bearing)
  return { lat: lat + dLat, lng: lng + dLng }
}

function formatMxCurrency(value, currency = 'MXN') {
  if (value == null) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(Number(value))
}

function formatAddressLines(order) {
  const a = order.shippingAddress?.addressLine1 ? order.shippingAddress : order.billingAddress
  if (!a) return []
  const lines = []
  const name = [a.firstName, a.lastName].filter(Boolean).join(' ')
  if (name) lines.push(name)
  const street = [a.addressLine1, a.addressLine2].filter(Boolean).join(', ')
  if (street) lines.push(street)
  const cityLine = [a.city, a.state, a.postalCode].filter(Boolean).join(', ')
  if (cityLine) lines.push(cityLine)
  if (a.country) lines.push(a.country)
  if (a.phone) lines.push(`Tel. ${a.phone}`)
  return lines
}

function singleLineAddress(order) {
  return formatAddressLines(order).join(', ')
}

function googleMapsPlaceUrl(order, destLatLng) {
  if (destLatLng?.lat != null && destLatLng?.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destLatLng.lat},${destLatLng.lng}&travelmode=driving`
  }
  const q = singleLineAddress(order)
  if (!q) return 'https://www.google.com/maps'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

function staticMapUrl(lat, lng, apiKey) {
  if (!apiKey || lat == null || lng == null) return null
  const center = `${lat},${lng}`
  const markers = `color:red|${lat},${lng}`
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(center)}&zoom=15&size=640x280&scale=2&maptype=roadmap&markers=${encodeURIComponent(markers)}&key=${encodeURIComponent(apiKey.trim())}`
}

export default function RepartidorEntregas() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { canViewPath, user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [folioInput, setFolioInput] = useState('')
  const [loadState, setLoadState] = useState({ loading: false, error: '' })
  const [order, setOrder] = useState(null)
  const [delivery, setDelivery] = useState(null)

  /** 'detail' = resumen + piezas + dirección; 'enroute' = mapa recorrido */
  const [phase, setPhase] = useState('detail')
  const [signaturePng, setSignaturePng] = useState(null)
  const [uploadedFile, setUploadedFile] = useState(null)
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState(null)

  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  const [mapsReady, setMapsReady] = useState(false)
  const [mapsError, setMapsError] = useState('')
  const [geoError, setGeoError] = useState('')
  const [routeSeed, setRouteSeed] = useState(null)
  const [liveDriver, setLiveDriver] = useState(null)
  const [routePaused, setRoutePaused] = useState(false)
  const [etaText, setEtaText] = useState('')
  const etaSecondsRef = useRef(null)
  /** Destino simulado según tu GPS: misma lógica en vista previa e INICIAR ENTREGA */
  const [simulatedDest, setSimulatedDest] = useState(null)
  const [previewGeoLoading, setPreviewGeoLoading] = useState(false)
  const [previewGeoError, setPreviewGeoError] = useState('')
  const [iniciarBusy, setIniciarBusy] = useState(false)
  const iniciarLockRef = useRef(false)

  const [viajeSnackbarOpen, setViajeSnackbarOpen] = useState(false)
  const [finalizarConfirmOpen, setFinalizarConfirmOpen] = useState(false)
  const [receiverModalOpen, setReceiverModalOpen] = useState(false)
  const [receiverModalError, setReceiverModalError] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientRole, setRecipientRole] = useState('')
  const [evidencePanelOpen, setEvidencePanelOpen] = useState(false)
  const [handoffSignaturePng, setHandoffSignaturePng] = useState(null)
  const [handoffPhotoFile, setHandoffPhotoFile] = useState(null)
  const [handoffPhotoPreview, setHandoffPhotoPreview] = useState(null)
  const [handoffDocFile, setHandoffDocFile] = useState(null)
  const [handoffError, setHandoffError] = useState('')
  const [handoffBusy, setHandoffBusy] = useState(false)
  const handoffCameraInputRef = useRef(null)

  const mapDivRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const motoMarkerRef = useRef(null)
  const destMarkerRef = useRef(null)
  const watchIdRef = useRef(null)
  const pathPointsRef = useRef([])
  const livePositionRef = useRef(null)
  const activeDeliveryIdRef = useRef(null)
  const routeSeedRef = useRef(null)

  useEffect(() => {
    const folioParam = searchParams.get('folio') || searchParams.get('orderNumber')
    if (folioParam != null && String(folioParam).trim() !== '') {
      setFolioInput(String(folioParam).trim())
    }
  }, [searchParams])

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl)
    }
  }, [uploadPreviewUrl])

  useEffect(() => {
    return () => {
      if (handoffPhotoPreview) URL.revokeObjectURL(handoffPhotoPreview)
    }
  }, [handoffPhotoPreview])

  useEffect(() => {
    livePositionRef.current = liveDriver
  }, [liveDriver])

  useEffect(() => {
    activeDeliveryIdRef.current = delivery?.id || null
  }, [delivery?.id])

  useEffect(() => {
    routeSeedRef.current = routeSeed
  }, [routeSeed])

  /** Vista previa: destino aleatorio según tu posición actual */
  useEffect(() => {
    if (!order || phase !== 'detail') return
    setPreviewGeoLoading(true)
    setPreviewGeoError('')
    if (!navigator.geolocation) {
      setPreviewGeoError('Tu navegador no permite ubicación.')
      setPreviewGeoLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setSimulatedDest(randomDestination(pos.coords.latitude, pos.coords.longitude))
        setPreviewGeoLoading(false)
      },
      (err) => {
        setPreviewGeoError(err.message || 'Permite ubicación para generar el destino simulado en el mapa.')
        setPreviewGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    )
  }, [order?.id, phase])

  const destLatLng = delivery?.endPoint?.latitude != null &&
    delivery?.endPoint?.longitude != null
    ? {
        lat: Number(delivery.endPoint.latitude),
        lng: Number(delivery.endPoint.longitude),
      }
    : null

  const loadByFolio = useCallback(async (folioRaw) => {
    const q = String(folioRaw || '').trim()
    if (!q) {
      setLoadState({ loading: false, error: 'Escribe el número de nota de venta.' })
      return
    }
    setLoadState({ loading: true, error: '' })
    setOrder(null)
    setDelivery(null)
    const search = await searchOrders({
      orderNumber: q,
      page: 1,
      limit: 25,
      sortBy: 'createdAt',
      sortOrder: 'DESC',
    })
    if (!search.success) {
      setLoadState({ loading: false, error: search.error || 'Error al buscar.' })
      return
    }
    const list = search.data?.orders || []
    if (list.length === 0) {
      setLoadState({ loading: false, error: 'No se encontró ninguna nota con ese número.' })
      return
    }
    const qUp = q.toUpperCase()
    const exact = list.find((o) => o.orderNumber && String(o.orderNumber).toUpperCase() === qUp)
    let chosen = exact || null
    if (!chosen && list.length === 1) chosen = list[0]
    if (!chosen) {
      setLoadState({
        loading: false,
        error: 'Hay varias coincidencias. Escribe el número completo de la nota.',
      })
      return
    }
    const detail = await getOrderById(chosen.id)
    if (!detail.success || !detail.data) {
      setLoadState({ loading: false, error: detail.error || 'No se pudo cargar el pedido.' })
      return
    }
    const delRes = await getDeliveryByOrderId(chosen.id)
    const deliveries = delRes.success ? delRes.data || [] : []
    const d0 = deliveries[0] || null
    setDelivery(d0)
    if (d0?.routePath && Array.isArray(d0.routePath) && d0.routePath.length > 0) {
      pathPointsRef.current = d0.routePath.map((p) => ({
        latitude: p.latitude,
        longitude: p.longitude,
        recordedAt: p.recordedAt,
      }))
    } else {
      pathPointsRef.current = []
    }
    setOrder(detail.data)
    setSimulatedDest(null)
    setPreviewGeoError('')
    setPhase('detail')
    setLoadState({ loading: false, error: '' })
  }, [])

  useEffect(() => {
    const folioParam = searchParams.get('folio') || searchParams.get('orderNumber')
    if (folioParam != null && String(folioParam).trim() !== '') {
      loadByFolio(String(folioParam).trim())
    }
  }, [searchParams, loadByFolio])

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
    const folio = order?.orderNumber || folioInput
    pdf.setFontSize(14)
    pdf.text('Nota de venta — firma digital', 14, 18)
    pdf.setFontSize(10)
    pdf.text(`Folio / referencia: ${folio?.trim() || '—'}`, 14, 26)
    pdf.text(`Repartidor: ${[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '—'}`, 14, 32)
    pdf.text(`Fecha: ${new Date().toLocaleString('es-MX')}`, 14, 38)
    pdf.addImage(signaturePng, 'PNG', 14, 48, 120, 45)
    pdf.setFontSize(8)
    pdf.text('Firma del cliente / receptor', 14, 98)
    pdf.save(`nota-venta-${String(folio || 'sin-folio').replace(/\s+/g, '-')}.pdf`)
  }, [signaturePng, folioInput, order, user])

  const buildHandoffPdf = useCallback(() => {
    if (!handoffSignaturePng) return
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
    const folio = order?.orderNumber || folioInput
    pdf.setFontSize(14)
    pdf.text('Acuse de entrega — firma del receptor', 14, 18)
    pdf.setFontSize(10)
    pdf.text(`Folio: ${folio?.trim() || '—'}`, 14, 26)
    pdf.text(`Entrega: ${delivery?.deliveryNumber || '—'}`, 14, 32)
    pdf.text(`Recibe: ${recipientName.trim() || '—'}`, 14, 38)
    pdf.text(`Puesto: ${recipientRole.trim() || '—'}`, 14, 44)
    pdf.text(
      `Repartidor: ${[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '—'}`,
      14,
      50,
    )
    pdf.text(`Fecha: ${new Date().toLocaleString('es-MX')}`, 14, 56)
    pdf.addImage(handoffSignaturePng, 'PNG', 14, 62, 120, 45)
    pdf.setFontSize(8)
    pdf.text('Firma de quien recibe', 14, 112)
    pdf.save(`acuse-entrega-${String(folio || 'sin-folio').replace(/\s+/g, '-')}.pdf`)
  }, [handoffSignaturePng, recipientName, recipientRole, folioInput, order, delivery, user])

  const resetHandoffUi = useCallback(() => {
    setFinalizarConfirmOpen(false)
    setReceiverModalOpen(false)
    setReceiverModalError('')
    setEvidencePanelOpen(false)
    setRecipientName('')
    setRecipientRole('')
    setHandoffSignaturePng(null)
    setHandoffPhotoFile(null)
    setHandoffDocFile(null)
    setHandoffError('')
    setHandoffBusy(false)
    setHandoffPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
  }, [])

  const onHandoffPhotoChange = (e) => {
    const f = e.target.files?.[0]
    setHandoffPhotoFile(f || null)
    setHandoffPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      if (f && f.type.startsWith('image/')) return URL.createObjectURL(f)
      return null
    })
    e.target.value = ''
  }

  const onHandoffDocChange = (e) => {
    const f = e.target.files?.[0]
    setHandoffDocFile(f || null)
    e.target.value = ''
  }

  const submitReceiverModal = () => {
    const n = recipientName.trim()
    const r = recipientRole.trim()
    if (!n || !r) {
      setReceiverModalError('Indica el nombre y el puesto de quien recibe el paquete.')
      return
    }
    setReceiverModalError('')
    setReceiverModalOpen(false)
    setEvidencePanelOpen(true)
  }

  const clearRouteUi = useCallback(() => {
    setMapsReady(false)
    setMapsError('')
    setEtaText('')
    etaSecondsRef.current = null
    setRouteSeed(null)
    setLiveDriver(null)
    setRoutePaused(false)
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (motoMarkerRef.current) {
      motoMarkerRef.current.setMap(null)
      motoMarkerRef.current = null
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.setMap(null)
      destMarkerRef.current = null
    }
    if (directionsRendererRef.current) {
      directionsRendererRef.current.setMap(null)
      directionsRendererRef.current = null
    }
  }, [])

  const stopEntrega = useCallback(async () => {
    const id = activeDeliveryIdRef.current
    const rs = routeSeedRef.current
    const pos = livePositionRef.current
    if (id && rs) {
      if (pos) {
        pathPointsRef.current.push({
          latitude: pos.lat,
          longitude: pos.lng,
          recordedAt: new Date().toISOString(),
        })
      }
      try {
        await updateDelivery(id, {
          routePath: [...pathPointsRef.current],
          status: 'in_transit',
          startLatitude: rs.driver.lat,
          startLongitude: rs.driver.lng,
          endLatitude: rs.dest.lat,
          endLongitude: rs.dest.lng,
          ...(etaSecondsRef.current != null ? { estimatedDurationSeconds: etaSecondsRef.current } : {}),
        })
      } catch {
        /* ignorar fallo de red al salir */
      }
    }
    resetHandoffUi()
    setPhase('detail')
    clearRouteUi()
  }, [clearRouteUi, resetHandoffUi])

  const confirmDeliveryHandoff = useCallback(async () => {
    setHandoffError('')
    const id = activeDeliveryIdRef.current
    const rs = routeSeedRef.current
    if (!id || !rs) {
      setHandoffError('No hay entrega activa.')
      return
    }
    setHandoffBusy(true)
    const pos = livePositionRef.current
    if (pos) {
      pathPointsRef.current.push({
        latitude: pos.lat,
        longitude: pos.lng,
        recordedAt: new Date().toISOString(),
      })
    }
    try {
      await updateDelivery(id, {
        routePath: [...pathPointsRef.current],
        status: 'delivered',
        deliveredAt: new Date().toISOString(),
        startLatitude: rs.driver.lat,
        startLongitude: rs.driver.lng,
        endLatitude: rs.dest.lat,
        endLongitude: rs.dest.lng,
        ...(etaSecondsRef.current != null ? { estimatedDurationSeconds: etaSecondsRef.current } : {}),
      })
      setDelivery((prev) =>
        prev
          ? {
              ...prev,
              status: 'delivered',
              statusLabel: 'ENTREGADA',
            }
          : prev,
      )
    } catch (e) {
      setHandoffError(e instanceof Error ? e.message : 'No se pudo registrar la entrega como entregada.')
      setHandoffBusy(false)
      return
    }
    setHandoffBusy(false)
    resetHandoffUi()
    setPhase('detail')
    clearRouteUi()
  }, [clearRouteUi, resetHandoffUi])

  const pauseEntrega = useCallback(() => {
    setRoutePaused(true)
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  const resumeEntrega = useCallback(() => {
    setRoutePaused(false)
  }, [])

  const ensureDeliveryId = useCallback(async () => {
    if (delivery?.id) return delivery.id
    if (!order?.id) throw new Error('Sin pedido cargado.')
    const res = await createDelivery({
      orderId: order.id,
      ...(user?.id ? { deliveredByUserId: user.id } : {}),
      status: 'pending',
    })
    if (!res.success || !res.data?.id) {
      throw new Error(res.error || 'No se pudo crear el registro de entrega.')
    }
    setDelivery(res.data)
    activeDeliveryIdRef.current = res.data.id
    return res.data.id
  }, [delivery?.id, order?.id, user?.id])

  const iniciarEntrega = useCallback(() => {
    setGeoError('')
    if (!mapsKey?.trim()) {
      setGeoError('Configura VITE_GOOGLE_MAPS_API_KEY en .env')
      return
    }
    if (!order) {
      setGeoError('Carga primero una nota de venta.')
      return
    }
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no permite geolocalización.')
      return
    }
    if (iniciarLockRef.current) return
    iniciarLockRef.current = true
    setIniciarBusy(true)
    setViajeSnackbarOpen(true)
    /** Si aún no hay permiso o falló la vista previa, se vuelve a pedir GPS y se genera el destino aquí. */
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          const dest =
            simulatedDest != null
              ? { lat: simulatedDest.lat, lng: simulatedDest.lng }
              : randomDestination(origin.lat, origin.lng)
          if (simulatedDest == null) {
            setSimulatedDest(dest)
          }
          setPreviewGeoError('')
          try {
            await loadGoogleMaps(mapsKey)
          } catch (e) {
            setViajeSnackbarOpen(false)
            setGeoError(e instanceof Error ? e.message : 'No se pudo cargar Google Maps')
            return
          }
          try {
            const deliveryId = await ensureDeliveryId()
            pathPointsRef.current = [
              {
                latitude: origin.lat,
                longitude: origin.lng,
                recordedAt: new Date().toISOString(),
              },
            ]
            await updateDelivery(deliveryId, {
              routePath: [...pathPointsRef.current],
              status: 'in_transit',
              startLatitude: origin.lat,
              startLongitude: origin.lng,
              endLatitude: dest.lat,
              endLongitude: dest.lng,
            })
            setRouteSeed({ driver: origin, dest })
            livePositionRef.current = origin
            setLiveDriver(origin)
            setPhase('enroute')
          } catch (e) {
            setViajeSnackbarOpen(false)
            setGeoError(e instanceof Error ? e.message : 'No se pudo iniciar la entrega.')
          }
        } finally {
          iniciarLockRef.current = false
          setIniciarBusy(false)
        }
      },
      (err) => {
        iniciarLockRef.current = false
        setIniciarBusy(false)
        setViajeSnackbarOpen(false)
        setGeoError(
          err.message ||
            'No se pudo obtener tu ubicación. Revisa permisos del navegador o HTTPS e inténtalo de nuevo.',
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }, [mapsKey, order, simulatedDest, ensureDeliveryId])

  useEffect(() => {
    if (phase !== 'enroute' || !routeSeed || !mapsKey) return
    let cancelled = false
    ;(async () => {
      try {
        await loadGoogleMaps(mapsKey)
        if (!cancelled) {
          setMapsError('')
          setMapsReady(true)
        }
      } catch (e) {
        if (!cancelled) setMapsError(e instanceof Error ? e.message : 'Maps error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [phase, routeSeed, mapsKey])

  useEffect(() => {
    if (!mapsReady || phase !== 'enroute' || !routeSeed) return
    const el = mapDivRef.current
    if (!el || !window.google?.maps) return

    const { driver, dest } = routeSeed
    const map = new window.google.maps.Map(el, {
      center: driver,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    })

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
          const leg = result.routes?.[0]?.legs?.[0]
          if (leg?.duration?.text) setEtaText(leg.duration.text)
          if (leg?.duration?.value != null) {
            etaSecondsRef.current = leg.duration.value
            const id = activeDeliveryIdRef.current
            if (id) {
              void updateDelivery(id, { estimatedDurationSeconds: leg.duration.value })
            }
          }
        }
      },
    )

    const g = window.google.maps
    motoMarkerRef.current = new g.Marker({
      map,
      position: driver,
      title: 'Tu ubicación',
      icon: motoPinIcon(g),
      zIndex: 3,
    })

    destMarkerRef.current = new g.Marker({
      map,
      position: dest,
      title: 'Destino de entrega',
      icon: destPinIcon(g),
      zIndex: 2,
    })

    return () => {
      if (motoMarkerRef.current) {
        motoMarkerRef.current.setMap(null)
        motoMarkerRef.current = null
      }
      if (destMarkerRef.current) {
        destMarkerRef.current.setMap(null)
        destMarkerRef.current = null
      }
      renderer.setMap(null)
      directionsRendererRef.current = null
    }
  }, [mapsReady, phase, routeSeed])

  useEffect(() => {
    if (!liveDriver || !motoMarkerRef.current) return
    motoMarkerRef.current.setPosition(liveDriver)
  }, [liveDriver])

  useEffect(() => {
    if (phase !== 'enroute' || routePaused) return
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
  }, [phase, routePaused])

  /** Guardar recorrido GPS cada 10 s en la base de datos */
  useEffect(() => {
    if (phase !== 'enroute' || routePaused) return undefined
    const id = activeDeliveryIdRef.current
    if (!id) return undefined
    const tick = async () => {
      const pos = livePositionRef.current
      const rs = routeSeedRef.current
      if (!pos || !rs || !activeDeliveryIdRef.current) return
      pathPointsRef.current.push({
        latitude: pos.lat,
        longitude: pos.lng,
        recordedAt: new Date().toISOString(),
      })
      try {
        await updateDelivery(activeDeliveryIdRef.current, {
          routePath: [...pathPointsRef.current],
          status: 'in_transit',
          startLatitude: rs.driver.lat,
          startLongitude: rs.driver.lng,
          endLatitude: rs.dest.lat,
          endLongitude: rs.dest.lng,
          ...(etaSecondsRef.current != null ? { estimatedDurationSeconds: etaSecondsRef.current } : {}),
        })
      } catch {
        /* red */
      }
    }
    const int = setInterval(tick, 10000)
    return () => clearInterval(int)
  }, [phase, routePaused, routeSeed])

  if (!canViewPath('/repartidor') && !canViewPath('/entregas')) {
    return null
  }

  const items = order?.items || []
  const addrLines = order ? formatAddressLines(order) : []
  const mapPreviewSrc =
    simulatedDest && mapsKey ? staticMapUrl(simulatedDest.lat, simulatedDest.lng, mapsKey) : null

  const folioFromUrl = String(searchParams.get('folio') || searchParams.get('orderNumber') || '').trim()
  /** Solo en /repartidor sin folio en URL y sin pedido: permitir buscar manualmente. */
  const showManualFolioSearch = !folioFromUrl && !order

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginTop: '70px',
          pt: { xs: 1.25, sm: 1.5, md: 3 },
          pr: { xs: 'max(12px, env(safe-area-inset-right, 0px))', sm: 2, md: 3 },
          pb: { xs: 'max(16px, env(safe-area-inset-bottom, 0px))', md: 4 },
          pl: {
            xs: 'max(12px, env(safe-area-inset-left, 0px))',
            sm: 2,
            md: `${SIDEBAR_WIDTH + 32}px`,
          },
          minHeight: 'calc(100vh - 70px)',
        }}
      >
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          <Tooltip title={canViewPath('/entregas') ? 'Volver a Entregas' : 'Volver'}>
            <IconButton
              color="primary"
              aria-label="Volver"
              onClick={() => {
                if (canViewPath('/entregas')) navigate('/entregas')
                else navigate(-1)
              }}
              sx={{ mr: { xs: 0, sm: 0.5 } }}
            >
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <LocalShipping color="primary" sx={{ fontSize: { xs: 28, sm: 32 } }} />
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.15rem', sm: '1.5rem' } }}>
            Repartidor — entregas
          </Typography>
        </Stack>

        {showManualFolioSearch && (
          <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Número de nota de venta"
                value={folioInput}
                onChange={(e) => setFolioInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') loadByFolio(folioInput)
                }}
                placeholder="Ej. ORD-000123"
              />
              <Button variant="contained" onClick={() => loadByFolio(folioInput)} disabled={loadState.loading}>
                Cargar
              </Button>
            </Stack>
            {loadState.loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            )}
            {loadState.error && (
              <Alert severity="warning" sx={{ mb: 1 }}>
                {loadState.error}
              </Alert>
            )}
          </Paper>
        )}
        {!showManualFolioSearch && (loadState.loading || loadState.error) && (
          <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 2 }}>
            {loadState.loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                <CircularProgress />
              </Box>
            )}
            {loadState.error && (
              <Alert severity="warning" sx={{ mb: 0 }}>
                {loadState.error}
              </Alert>
            )}
          </Paper>
        )}

        {order && phase === 'detail' && (
          <>
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
              <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                <Typography variant="overline" sx={{ opacity: 0.9 }}>
                  Entrega
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'monospace' }}>
                  {delivery?.deliveryNumber || '—'}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ mt: 0.5 }}>
                  <Typography variant="body2">Nota: {order.orderNumber || '—'}</Typography>
                  {delivery?.statusLabel && (
                    <Chip
                      size="small"
                      label={delivery.statusLabel}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}
                    />
                  )}
                </Stack>
                {delivery?.estimatedDurationFormatted ? (
                  <Typography variant="caption" sx={{ display: 'block', mt: 1, opacity: 0.9 }}>
                    Tiempo estimado (registro): {delivery.estimatedDurationFormatted}
                  </Typography>
                ) : null}
              </Box>

              <Stack spacing={0} sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Accordion disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Inventory2 color="primary" />
                      <Typography fontWeight={700}>Piezas a entregar</Typography>
                      <Chip label={items.length} size="small" />
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer sx={{ maxHeight: 320, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Producto / SKU</TableCell>
                            <TableCell align="right">Cant.</TableCell>
                            <TableCell align="right">Importe</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {items.map((item) => (
                            <TableRow key={item.id || item.productId}>
                              <TableCell>
                                {item.productName || '—'}{' '}
                                {item.productSku ? (
                                  <Typography component="span" variant="caption" color="text.secondary">
                                    ({item.productSku})
                                  </Typography>
                                ) : null}
                              </TableCell>
                              <TableCell align="right">{item.quantity ?? '—'}</TableCell>
                              <TableCell align="right">
                                {formatMxCurrency(item.totalPrice, order.currency)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Typography variant="body2" sx={{ mt: 1.5 }}>
                      Total pedido:{' '}
                      <strong>{formatMxCurrency(order.totalAmount, order.currency)}</strong>
                    </Typography>
                  </AccordionDetails>
                </Accordion>

                <Divider sx={{ my: 1 }} />

                <Accordion disableGutters elevation={0}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Place color="primary" />
                      <Typography fontWeight={700}>Dirección y mapa</Typography>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    {addrLines.length === 0 ? (
                      <Typography color="text.secondary">Sin dirección en el pedido.</Typography>
                    ) : (
                      addrLines.map((line, i) => (
                        <Typography key={`${i}-${line}`} variant="body2" sx={{ mb: 0.5 }}>
                          {line}
                        </Typography>
                      ))
                    )}
                    {previewGeoLoading && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1.5 }}>
                        <CircularProgress size={22} />
                        <Typography variant="body2" color="text.secondary">
                          Obteniendo tu ubicación para el destino simulado…
                        </Typography>
                      </Box>
                    )}
                    {previewGeoError && (
                      <Alert severity="warning" sx={{ mt: 1.5 }}>
                        {previewGeoError}
                      </Alert>
                    )}
                    {mapPreviewSrc ? (
                      <>
                        <Alert severity="info" sx={{ mt: 1.5 }}>
                          Vista previa: <strong>destino de entrega simulado</strong> (aleatorio cerca de tu posición).
                          Al pulsar INICIAR ENTREGA se usa el mismo destino para el recorrido.
                        </Alert>
                        <Box
                          component="img"
                          src={mapPreviewSrc}
                          alt="Destino simulado en mapa"
                          sx={{
                            width: '100%',
                            maxHeight: 220,
                            objectFit: 'cover',
                            borderRadius: 1,
                            mt: 1.5,
                            border: 1,
                            borderColor: 'divider',
                          }}
                        />
                      </>
                    ) : null}
                    <Button
                      component="a"
                      href={googleMapsPlaceUrl(order, destLatLng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      fullWidth
                      startIcon={<MapIcon />}
                      endIcon={<OpenInNew sx={{ fontSize: 18 }} />}
                      sx={{ mt: 2, textTransform: 'none' }}
                    >
                      Abrir en Google Maps
                    </Button>
                    {!destLatLng && (
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Si no hay coordenadas guardadas en la entrega, Google Maps abrirá la búsqueda por dirección.
                      </Typography>
                    )}
                  </AccordionDetails>
                </Accordion>

                <Divider sx={{ my: 2 }} />

                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  startIcon={<LocalShipping />}
                  onClick={iniciarEntrega}
                  disabled={loadState.loading}
                  sx={{ py: 1.5, fontWeight: 800, fontSize: '1rem', textTransform: 'none' }}
                >
                  {iniciarBusy ? 'Obteniendo ubicación…' : 'INICIAR ENTREGA'}
                </Button>
                {!mapsKey?.trim() && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    Falta <code>VITE_GOOGLE_MAPS_API_KEY</code> en <code>.env</code>.
                  </Alert>
                )}
                {geoError && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {geoError}
                  </Alert>
                )}
              </Stack>
            </Paper>

            <Accordion sx={{ borderRadius: 2, mb: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Description color="action" />
                  <Typography fontWeight={600}>Firma de nota (opcional)</Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Genera un PDF con firma en el dispositivo o sube una foto/PDF ya firmado.
                </Alert>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Firma digital
                </Typography>
                <SignaturePad onChange={setSignaturePng} sx={{ maxWidth: '100%' }} />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                  <Button variant="contained" fullWidth disabled={!signaturePng} onClick={buildPdfWithSignature}>
                    Descargar PDF con firma
                  </Button>
                </Stack>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                  Subir nota firmada
                </Typography>
                <Button variant="outlined" component="label" fullWidth sx={{ py: 1.5 }}>
                  Elegir archivo (PDF o imagen)
                  <input type="file" hidden accept="image/*,.pdf,application/pdf" onChange={handleFile} />
                </Button>
                {uploadedFile && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Archivo: <strong>{uploadedFile.name}</strong>
                  </Typography>
                )}
                {uploadPreviewUrl && (
                  <Box
                    component="img"
                    src={uploadPreviewUrl}
                    alt="Vista previa"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 240,
                      objectFit: 'contain',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                      mt: 1,
                    }}
                  />
                )}
              </AccordionDetails>
            </Accordion>
          </>
        )}

        {phase === 'enroute' && routeSeed && (
          <Box
            sx={{
              position: 'fixed',
              inset: 0,
              zIndex: (t) => t.zIndex.modal + 2,
              display: 'flex',
              flexDirection: 'column',
              bgcolor: 'background.default',
              pb: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <AppBar position="static" elevation={1} color="default">
              <Toolbar variant="dense" sx={{ flexWrap: 'wrap', gap: 1, py: 1 }}>
                <IconButton edge="start" aria-label="Volver al detalle" onClick={() => void stopEntrega()} size="large">
                  <ArrowBack />
                </IconButton>
                <Box sx={{ flex: 1, minWidth: 140 }}>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Tiempo estimado (tráfico)
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main', lineHeight: 1.2 }}>
                    {etaText || 'Calculando…'}
                  </Typography>
                </Box>
                <Button
                  variant={routePaused ? 'contained' : 'outlined'}
                  color="warning"
                  size="small"
                  startIcon={routePaused ? <PlayArrow /> : <Pause />}
                  onClick={routePaused ? resumeEntrega : pauseEntrega}
                  sx={{ textTransform: 'none' }}
                >
                  {routePaused ? 'Continuar' : 'Pausar'}
                </Button>
              </Toolbar>
            </AppBar>
            <Box sx={{ px: 2, py: 1, bgcolor: 'action.hover', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary">
                El recorrido se guarda en el servidor cada 10 s (incluido al usar atrás).
              </Typography>
              {mapsError ? (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {mapsError}
                </Alert>
              ) : null}
              {geoError ? (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  {geoError}
                </Alert>
              ) : null}
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, position: 'relative', width: '100%' }}>
              <Box
                ref={mapDivRef}
                sx={{
                  position: 'absolute',
                  inset: 0,
                  bgcolor: 'action.hover',
                }}
              />
              {!evidencePanelOpen && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 2,
                    p: 1.5,
                    pt: 1,
                    bgcolor: 'background.paper',
                    borderTop: 1,
                    borderColor: 'divider',
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
                  }}
                >
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    fullWidth
                    startIcon={<CheckCircle />}
                    onClick={() => setFinalizarConfirmOpen(true)}
                    sx={{ py: 1.35, fontWeight: 800, textTransform: 'none', fontSize: '1rem' }}
                  >
                    FINALIZAR ENTREGA
                  </Button>
                </Box>
              )}
              {evidencePanelOpen && (
                <Paper
                  elevation={8}
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 3,
                    maxHeight: { xs: '62vh', sm: '56vh' },
                    overflow: 'auto',
                    borderRadius: '12px 12px 0 0',
                    p: { xs: 1.5, sm: 2 },
                    pb: 'max(16px, env(safe-area-inset-bottom, 0px))',
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>
                    Entrega — acuse y evidencia
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Recibe: <strong>{recipientName.trim()}</strong> · Puesto:{' '}
                    <strong>{recipientRole.trim()}</strong>
                  </Typography>
                  {handoffError && (
                    <Alert severity="error" sx={{ mb: 1.5 }}>
                      {handoffError}
                    </Alert>
                  )}
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Firma de quien recibe
                  </Typography>
                  <SignaturePad onChange={setHandoffSignaturePng} sx={{ maxWidth: '100%' }} />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      disabled={!handoffSignaturePng}
                      onClick={buildHandoffPdf}
                      sx={{ textTransform: 'none' }}
                    >
                      Descargar PDF con firma
                    </Button>
                  </Stack>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Evidencia (foto o documento)
                  </Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <input
                      ref={handoffCameraInputRef}
                      type="file"
                      hidden
                      accept="image/*"
                      capture="environment"
                      onChange={onHandoffPhotoChange}
                    />
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<PhotoCamera />}
                      onClick={() => handoffCameraInputRef.current?.click()}
                      sx={{ textTransform: 'none', py: 1.25 }}
                    >
                      Tomar foto
                    </Button>
                    <Button variant="outlined" component="label" fullWidth startIcon={<AttachFile />} sx={{ py: 1.25 }}>
                      Cargar imagen
                      <input type="file" hidden accept="image/*" onChange={onHandoffPhotoChange} />
                    </Button>
                    <Button variant="outlined" component="label" fullWidth startIcon={<AttachFile />} sx={{ py: 1.25 }}>
                      Cargar documento
                      <input type="file" hidden accept="image/*,.pdf,application/pdf" onChange={onHandoffDocChange} />
                    </Button>
                  </Stack>
                  {handoffPhotoFile && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Foto: <strong>{handoffPhotoFile.name}</strong>
                    </Typography>
                  )}
                  {handoffPhotoPreview && (
                    <Box
                      component="img"
                      src={handoffPhotoPreview}
                      alt="Evidencia"
                      sx={{
                        maxWidth: '100%',
                        maxHeight: 160,
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: 1,
                        borderColor: 'divider',
                        mt: 1,
                      }}
                    />
                  )}
                  {handoffDocFile && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Documento: <strong>{handoffDocFile.name}</strong>
                    </Typography>
                  )}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="inherit"
                      fullWidth
                      disabled={handoffBusy}
                      onClick={() => {
                        setEvidencePanelOpen(false)
                        setHandoffError('')
                      }}
                      sx={{ textTransform: 'none', py: 1.25 }}
                    >
                      Volver al mapa
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      disabled={handoffBusy}
                      onClick={() => void confirmDeliveryHandoff()}
                      startIcon={handoffBusy ? <CircularProgress size={18} color="inherit" /> : <CheckCircle />}
                      sx={{ textTransform: 'none', py: 1.25, fontWeight: 700 }}
                    >
                      {handoffBusy ? 'Guardando…' : 'Confirmar entrega'}
                    </Button>
                  </Stack>
                </Paper>
              )}
            </Box>

            <Dialog
              open={finalizarConfirmOpen}
              onClose={() => setFinalizarConfirmOpen(false)}
              fullWidth
              maxWidth="xs"
              aria-labelledby="finalizar-entrega-confirm-title"
              ModalProps={{ sx: dialogAboveRouteOverlaySx }}
            >
              <DialogTitle id="finalizar-entrega-confirm-title">Finalizar entrega</DialogTitle>
              <DialogContent>
                <Typography variant="body2" color="text.secondary">
                  ¿Confirmas que deseas finalizar esta entrega? Después podrás indicar quién recibió el paquete, firmar y
                  adjuntar evidencia.
                </Typography>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={() => setFinalizarConfirmOpen(false)} color="inherit" sx={{ textTransform: 'none' }}>
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => {
                    setFinalizarConfirmOpen(false)
                    setReceiverModalError('')
                    setReceiverModalOpen(true)
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Sí, continuar
                </Button>
              </DialogActions>
            </Dialog>

            <Dialog
              open={receiverModalOpen}
              onClose={() => {
                if (!handoffBusy) setReceiverModalOpen(false)
              }}
              fullWidth
              maxWidth="sm"
              aria-labelledby="receptor-entrega-title"
              ModalProps={{ sx: dialogAboveRouteOverlaySx }}
            >
              <DialogTitle id="receptor-entrega-title">¿Quién recibe el paquete?</DialogTitle>
              <DialogContent>
                {receiverModalError && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {receiverModalError}
                  </Alert>
                )}
                <Stack spacing={2} sx={{ pt: 0.5 }}>
                  <TextField
                    autoFocus
                    label="Nombre completo"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    fullWidth
                    required
                    margin="dense"
                  />
                  <TextField
                    label="Puesto o área"
                    value={recipientRole}
                    onChange={(e) => setRecipientRole(e.target.value)}
                    fullWidth
                    required
                    margin="dense"
                    placeholder="Ej. Almacén, Mostrador, Compras…"
                  />
                </Stack>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Button
                  onClick={() => setReceiverModalOpen(false)}
                  color="inherit"
                  sx={{ textTransform: 'none' }}
                >
                  Cancelar
                </Button>
                <Button variant="contained" onClick={submitReceiverModal} sx={{ textTransform: 'none' }}>
                  Continuar
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        )}

        <Snackbar
          open={viajeSnackbarOpen}
          autoHideDuration={4500}
          onClose={(_, reason) => {
            if (reason === 'clickaway') return
            setViajeSnackbarOpen(false)
          }}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{
            zIndex: (theme) => theme.zIndex.modal + 120,
            top: {
              xs: 'max(88px, calc(70px + env(safe-area-inset-top, 0px)))',
              sm: 'max(96px, calc(70px + env(safe-area-inset-top, 0px)))',
            },
            bottom: 'auto',
          }}
        >
          <Alert
            onClose={() => setViajeSnackbarOpen(false)}
            severity="info"
            variant="filled"
            sx={{ width: '100%' }}
          >
            Iniciando Viaje
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  )
}
