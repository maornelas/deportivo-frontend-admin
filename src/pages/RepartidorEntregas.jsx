import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams, Link as RouterLink } from 'react-router-dom'
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
  Checkbox,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
} from '@mui/material'
import {
  LocalShipping,
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
  LocationOn,
  Person,
  Close,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import PageTitle from '../components/PageTitle'
import DeliveryDestinationPicker from '../repartidor/DeliveryDestinationPicker'
import { loadGoogleMaps } from '../repartidor/googleMapsHelpers'
import SignaturePad from '../components/SignaturePad'
import { SIDEBAR_WIDTH } from '../config/layout'
import { useAuth } from '../contexts/AuthContext'
import { RepartidorDeliveriesList } from './EntregasRepartidor'
import { searchOrders, getOrderById, uploadSignedOrderSaleNotePdf } from '../api/orders'
import { getDeliveryByOrderId, createDelivery, updateDelivery } from '../api/deliveries'
/** Duración mínima de la pantalla de animación al iniciar entrega (ms). */
const MOTO_SPLASH_MIN_MS = 3000
/** Duración mínima del splash al confirmar entrega (evita parpadeo si la API responde muy rápido). */
const FINALIZING_SPLASH_MIN_MS = 2000

/**
 * Por encima del overlay de recorrido y capas internas de Google Maps (suelen usar z-index altos).
 * MUI 7: usar slotProps.root; ModalProps puede no aplicarse al nodo correcto.
 */
const DIALOG_ABOVE_MAP_Z = 20000
const dialogSlotPropsAboveMap = {
  root: {
    sx: { zIndex: DIALOG_ABOVE_MAP_Z },
  },
}

/** Estilo compartido pantalla recorrido / loading (slate profesional). */
const routeProPalette = {
  bg: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
  surface: 'rgba(30, 41, 59, 0.75)',
  border: 'rgba(148, 163, 184, 0.22)',
  textMuted: '#94a3b8',
  text: '#e2e8f0',
  accent: '#7dd3fc',
}

/** Pantalla completa: paquete en movimiento sobre la ruta (inicio o finalización de entrega). */
function DeliveryRouteSplashOverlay({ title, subtitle, zIndexBoost = 200 }) {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: (theme) => theme.zIndex.modal + zIndexBoost,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: routeProPalette.bg,
      }}
    >
      <Inventory2 sx={{ fontSize: 42, color: routeProPalette.accent, mb: 1.25, opacity: 0.95 }} />
      <Typography
        variant="h6"
        sx={{
          color: 'common.white',
          fontWeight: 700,
          textAlign: 'center',
          mb: 1,
          letterSpacing: 0.3,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{ color: 'rgba(255,255,255,0.72)', textAlign: 'center', mb: 4, maxWidth: 320, lineHeight: 1.5 }}
      >
        {subtitle}
      </Typography>

      <Box
        sx={{
          width: '100%',
          maxWidth: 520,
          height: 148,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 2,
          bgcolor: routeProPalette.surface,
          border: `1px solid ${routeProPalette.border}`,
          boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            bottom: 40,
            left: 0,
            right: 0,
            height: 14,
            bgcolor: '#334155',
            borderRadius: '2px',
            boxShadow: 'inset 0 2px 0 rgba(0,0,0,0.2)',
            backgroundImage:
              'repeating-linear-gradient(90deg, #94a3b8 0, #94a3b8 18px, transparent 18px, transparent 36px)',
            backgroundSize: '36px 4px',
            backgroundPosition: '0 5px',
            backgroundRepeat: 'repeat-x',
            animation: 'roadScroll 0.7s linear infinite',
            '@keyframes roadScroll': {
              '0%': { backgroundPosition: '0 5px' },
              '100%': { backgroundPosition: '36px 5px' },
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 26,
            width: 72,
            height: 64,
            left: '50%',
            marginLeft: '-36px',
            animation: 'packageRide 2.4s ease-in-out infinite',
            filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.4))',
            '@keyframes packageRide': {
              '0%': { transform: 'translateX(-42vw) translateY(0) rotate(-2deg)' },
              '25%': { transform: 'translateX(-14vw) translateY(-10px) rotate(0deg)' },
              '50%': { transform: 'translateX(14vw) translateY(0) rotate(2deg)' },
              '75%': { transform: 'translateX(38vw) translateY(-10px) rotate(0deg)' },
              '100%': { transform: 'translateX(42vw) translateY(0) rotate(-2deg)' },
            },
          }}
        >
          <Box component="svg" viewBox="0 0 72 64" sx={{ width: '100%', height: '100%', display: 'block' }}>
            <path
              d="M 8 52 L 18 22 L 58 22 L 64 52 Z"
              fill="#6d4c41"
              stroke="#3e2723"
              strokeWidth="1.2"
            />
            <path d="M 10 48 L 20 26 L 56 26 L 62 48 Z" fill="#8d6e63" opacity="0.95" />
            <rect x="14" y="30" width="44" height="5" rx="1" fill="#5d4037" opacity="0.85" />
            <rect x="22" y="18" width="28" height="10" rx="2" fill="#a1887f" stroke="#5d4037" strokeWidth="0.8" />
            <path d="M 36 18 L 36 52" stroke="#4e342e" strokeWidth="1" strokeDasharray="3 2" opacity="0.7" />
            <ellipse cx="36" cy="16" rx="8" ry="3" fill="#bcaaa4" opacity="0.9" />
          </Box>
        </Box>
      </Box>

      <CircularProgress size={36} sx={{ mt: 3, color: routeProPalette.accent }} />
    </Box>
  )
}

function MotoDeliverySplashOverlay() {
  return (
    <DeliveryRouteSplashOverlay
      title="Preparando tu entrega"
      subtitle="Un momento… estamos cargando tu ruta"
      zIndexBoost={200}
    />
  )
}

function FinalizingDeliverySplashOverlay() {
  return (
    <DeliveryRouteSplashOverlay
      title="Finalizando entrega"
      subtitle="Estamos registrando la entrega en el sistema…"
      zIndexBoost={450}
    />
  )
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

/** Dirección de envío/facturación usada en el pedido (misma lógica que formatAddressLines). */
function getOrderShippingLikeAddress(order) {
  if (!order) return null
  return order.shippingAddress?.addressLine1 ? order.shippingAddress : order.billingAddress
}

function repartidorHandoffStorageKey(orderId, deliveryId) {
  return `deportivo-repartidor-handoff-${orderId}-${deliveryId}`
}

function isDeliveryMarkedDelivered(d) {
  if (!d) return false
  if (d.status === 'delivered') return true
  const label = String(d.statusLabel || '').toUpperCase()
  return label.includes('ENTREGAD')
}

function getDeliveryItemKey(item, index) {
  return item?.id || item?.productId || `${item?.productSku || 'sku'}-${index}`
}

function googleMapsPlaceUrl(order, destLatLng) {
  if (destLatLng?.lat != null && destLatLng?.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destLatLng.lat},${destLatLng.lng}&travelmode=driving`
  }
  const q = singleLineAddress(order)
  if (!q) return 'https://www.google.com/maps'
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export default function RepartidorEntregas() {
  const [searchParams] = useSearchParams()
  const { canViewPath, user } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [folioInput, setFolioInput] = useState('')
  const [loadState, setLoadState] = useState({ loading: false, error: '' })
  const [order, setOrder] = useState(null)
  const [delivery, setDelivery] = useState(null)

  /** 'detail' = resumen + piezas + dirección; 'enroute' = mapa recorrido */
  const [phase, setPhase] = useState('detail')

  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  const [mapsReady, setMapsReady] = useState(false)
  const [mapsError, setMapsError] = useState('')
  const [geoError, setGeoError] = useState('')
  const [routeSeed, setRouteSeed] = useState(null)
  const [liveDriver, setLiveDriver] = useState(null)
  const [routePaused, setRoutePaused] = useState(false)
  /** Tras ver el mapa: primero INICIAR VIAJE (zoom + GPS); luego FINALIZAR VIAJE. */
  const [tripStarted, setTripStarted] = useState(false)
  const [etaText, setEtaText] = useState('')
  const etaSecondsRef = useRef(null)
  /** Punto de entrega definido por el repartidor (coordenadas + texto) */
  const [deliveryDest, setDeliveryDest] = useState(null)
  const [iniciarBusy, setIniciarBusy] = useState(false)
  const iniciarLockRef = useRef(false)

  const [motoSplashOpen, setMotoSplashOpen] = useState(false)
  const motoSplashStartedAtRef = useRef(0)
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
  const handoffMediaInputRef = useRef(null)
  /** Productos marcados para entregar en el detalle. */
  const [itemDeliveryChecks, setItemDeliveryChecks] = useState({})
  /** Resumen del acuse tras confirmar (persistido en sessionStorage por pedido+entrega). */
  const [deliveredHandoffSummary, setDeliveredHandoffSummary] = useState(null)

  /** Panel lateral en mapa: dirección o destinatario (animado desde los iconos). */
  const [mapSidePanelKind, setMapSidePanelKind] = useState(null)

  const mapDivRef = useRef(null)
  const googleMapRef = useRef(null)
  const directionsResultRef = useRef(null)
  const directionsRendererRef = useRef(null)
  const motoMarkerRef = useRef(null)
  const destMarkerRef = useRef(null)
  const watchIdRef = useRef(null)
  const pathPointsRef = useRef([])
  const livePositionRef = useRef(null)
  const activeDeliveryIdRef = useRef(null)
  const routeSeedRef = useRef(null)
  /** Evita doble zoom si se pulsa INICIAR VIAJE dos veces antes de re-render. */
  const iniciarViajeAppliedRef = useRef(false)

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
    }
  }, [])

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

  useEffect(() => {
    if (!tripStarted) iniciarViajeAppliedRef.current = false
  }, [tripStarted])

  useEffect(() => {
    if (phase !== 'enroute') {
      setMapSidePanelKind(null)
    }
  }, [phase])

  const destLatLng =
    deliveryDest?.lat != null && deliveryDest?.lng != null
      ? { lat: deliveryDest.lat, lng: deliveryDest.lng }
      : delivery?.endPoint?.latitude != null && delivery?.endPoint?.longitude != null
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
    setDeliveredHandoffSummary(null)
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
    if (d0 && isDeliveryMarkedDelivered(d0)) {
      try {
        const raw = sessionStorage.getItem(repartidorHandoffStorageKey(chosen.id, d0.id))
        const parsed = raw ? JSON.parse(raw) : null
        if (parsed) {
          if (!parsed.signedNotePdfUrl && d0.signedDocumentUrl) parsed.signedNotePdfUrl = d0.signedDocumentUrl
          setDeliveredHandoffSummary(parsed)
        } else if (d0.signedDocumentUrl) {
          setDeliveredHandoffSummary({
            recipientName: '',
            recipientRole: '',
            hadSignature: false,
            signaturePng: null,
            deliveredItems: [],
            deliveredTotal: 0,
            photoFileName: null,
            docFileName: null,
            completedAt: d0.deliveredAt || d0.updatedAt || new Date().toISOString(),
            signedNotePdfDataUri: null,
            signedNotePdfUrl: d0.signedDocumentUrl,
          })
        } else {
          setDeliveredHandoffSummary(null)
        }
      } catch {
        setDeliveredHandoffSummary(null)
      }
    } else {
      setDeliveredHandoffSummary(null)
    }
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
    const orderAddr = singleLineAddress(detail.data)
    if (d0?.endPoint?.latitude != null && d0?.endPoint?.longitude != null) {
      setDeliveryDest({
        lat: Number(d0.endPoint.latitude),
        lng: Number(d0.endPoint.longitude),
        address: d0.destinationAddress || orderAddr || '',
      })
    } else {
      setDeliveryDest(null)
    }
    setPhase('detail')
    setLoadState({ loading: false, error: '' })
  }, [])

  useEffect(() => {
    const folioParam = searchParams.get('folio') || searchParams.get('orderNumber')
    const folio = folioParam != null ? String(folioParam).trim() : ''
    if (folio) {
      loadByFolio(folio)
    } else {
      setOrder(null)
      setDelivery(null)
      setDeliveryDest(null)
      setDeliveredHandoffSummary(null)
      setPhase('detail')
      setLoadState({ loading: false, error: '' })
      setFolioInput('')
      setItemDeliveryChecks({})
      setRouteSeed(null)
      setLiveDriver(null)
      setRoutePaused(false)
      setTripStarted(false)
      setMotoSplashOpen(false)
      pathPointsRef.current = []
    }
  }, [searchParams, loadByFolio])

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

  const onHandoffImageOrDocChange = (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const isPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
    if (isPdf) {
      setHandoffDocFile(f)
      return
    }
    setHandoffPhotoFile(f)
    setHandoffPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      if (f.type.startsWith('image/')) return URL.createObjectURL(f)
      return null
    })
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
    setTripStarted(false)
    iniciarViajeAppliedRef.current = false
    directionsResultRef.current = null
    googleMapRef.current = null
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
    const t0 = Date.now()
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
      const selectedDeliveredItems = (order?.items || [])
        .filter((item, index) => itemDeliveryChecks[getDeliveryItemKey(item, index)] ?? true)
        .map((item) => ({
          productName: item.productName || item.productSku || 'Producto',
          quantity: Number(item.quantity ?? 0),
          totalPrice: Number(item.totalPrice || 0),
        }))
      const summary = {
        recipientName: recipientName.trim(),
        recipientRole: recipientRole.trim(),
        hadSignature: Boolean(handoffSignaturePng),
        signaturePng: handoffSignaturePng || null,
        deliveredItems: selectedDeliveredItems,
        deliveredTotal: selectedDeliveredItems.reduce((acc, it) => acc + Number(it.totalPrice || 0), 0),
        photoFileName: handoffPhotoFile?.name ?? null,
        docFileName: handoffDocFile?.name ?? null,
        completedAt: new Date().toISOString(),
      }
      try {
        if (!order?.id) {
          throw new Error('No se encontró el ID de la orden para subir la nota firmada.')
        }
        const itemsForIndices = order?.items || []
        const deliveredItemIndices = itemsForIndices
          .map((_, index) => index)
          .filter((index) => itemDeliveryChecks[getDeliveryItemKey(itemsForIndices[index], index)] ?? true)
        const uploadRes = await uploadSignedOrderSaleNotePdf(order.id, {
          recipientName: summary.recipientName,
          recipientRole: summary.recipientRole,
          signaturePngDataUri: summary.signaturePng || undefined,
          deliveredItemIndices,
        })
        if (!uploadRes.success || !uploadRes.data?.url) {
          throw new Error(uploadRes.error || 'No se pudo subir la nota firmada al bucket.')
        }
        summary.signedNotePdfUrl = uploadRes.data.url
        summary.signedNotePdfDataUri = null
        await updateDelivery(id, { signedDocumentUrl: uploadRes.data.url })
      } catch {
        setHandoffError('No se pudo generar/subir la nota firmada a S3. Intenta nuevamente.')
        setHandoffBusy(false)
        return
      }
      if (order?.id && id) {
        try {
          sessionStorage.setItem(repartidorHandoffStorageKey(order.id, id), JSON.stringify(summary))
        } catch {
          /* storage lleno o modo privado */
        }
      }
      setDeliveredHandoffSummary(summary)
    } catch (e) {
      setHandoffError(e instanceof Error ? e.message : 'No se pudo registrar la entrega como entregada.')
      setHandoffBusy(false)
      return
    }
    const wait = Math.max(0, FINALIZING_SPLASH_MIN_MS - (Date.now() - t0))
    await new Promise((r) => window.setTimeout(r, wait))
    setHandoffBusy(false)
    resetHandoffUi()
    setPhase('detail')
    clearRouteUi()
  }, [
    clearRouteUi,
    resetHandoffUi,
    order?.id,
    recipientName,
    recipientRole,
    handoffSignaturePng,
    handoffPhotoFile,
    handoffDocFile,
    order?.items,
    itemDeliveryChecks,
  ])

  const viewSignedDeliveryNote = useCallback(() => {
    if (!order || !delivery) return
    const summary = deliveredHandoffSummary
    const urlPdf = summary?.signedNotePdfUrl || delivery.signedDocumentUrl
    if (urlPdf) {
      window.open(urlPdf, '_blank', 'noopener,noreferrer')
      return
    }
    if (summary?.signedNotePdfDataUri) {
      window.open(summary.signedNotePdfDataUri, '_blank', 'noopener,noreferrer')
      return
    }
  }, [order, delivery, deliveredHandoffSummary])

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

  /** Zoom a la ruta y enfoque tipo navegación; activa seguimiento GPS (watch + guardado). */
  const iniciarViaje = useCallback(() => {
    if (tripStarted || iniciarViajeAppliedRef.current) return
    iniciarViajeAppliedRef.current = true
    setTripStarted(true)
    const map = googleMapRef.current
    const g = window.google?.maps
    const rs = routeSeedRef.current
    if (map && g && rs) {
      const pad = { top: 100, right: 28, bottom: 180, left: 28 }
      const result = directionsResultRef.current
      if (result?.routes?.[0]?.bounds) {
        map.fitBounds(result.routes[0].bounds, pad)
      } else {
        const b = new g.LatLngBounds()
        b.extend(rs.driver)
        b.extend(rs.dest)
        map.fitBounds(b, pad)
      }
      window.setTimeout(() => {
        const pos = livePositionRef.current || rs.driver
        if (!pos || !googleMapRef.current) return
        const m = googleMapRef.current
        m.panTo(pos)
        /** Zoom cercano tipo navegación (18 ≈ manzana; antes 16 se veía lejos). */
        const tripStartZoom = 18
        const z = m.getZoom()
        if (z != null) m.setZoom(Math.max(z, tripStartZoom))
        else m.setZoom(tripStartZoom)
        try {
          m.setTilt(45)
        } catch {
          /* algunos entornos limitan tilt */
        }
      }, 500)
    }
  }, [tripStarted])

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

  const saveDeliveryDestination = useCallback(
    async (dest) => {
      const deliveryId = await ensureDeliveryId()
      const res = await updateDelivery(deliveryId, {
        endLatitude: dest.lat,
        endLongitude: dest.lng,
        destinationAddress: dest.address?.trim() || null,
      })
      if (!res.success) throw new Error(res.error || 'No se pudo guardar el destino')
      setDelivery((prev) =>
        prev
          ? {
              ...prev,
              endPoint: { latitude: dest.lat, longitude: dest.lng },
              destinationAddress: dest.address,
            }
          : prev,
      )
      setDeliveryDest(dest)
    },
    [ensureDeliveryId],
  )

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
    const dest =
      deliveryDest?.lat != null && deliveryDest?.lng != null
        ? { lat: deliveryDest.lat, lng: deliveryDest.lng }
        : null
    if (!dest) {
      setGeoError('Define y guarda el punto de entrega en el mapa antes de iniciar.')
      return
    }
    if (iniciarLockRef.current) return
    iniciarLockRef.current = true
    setIniciarBusy(true)
    motoSplashStartedAtRef.current = Date.now()
    setMotoSplashOpen(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const finishSplashAndRelease = () => {
          const elapsed = Date.now() - motoSplashStartedAtRef.current
          const wait = Math.max(0, MOTO_SPLASH_MIN_MS - elapsed)
          window.setTimeout(() => {
            setMotoSplashOpen(false)
            iniciarLockRef.current = false
            setIniciarBusy(false)
          }, wait)
        }
        const abortSplash = () => {
          setMotoSplashOpen(false)
          iniciarLockRef.current = false
          setIniciarBusy(false)
        }
        const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        try {
          await loadGoogleMaps(mapsKey)
        } catch (e) {
          abortSplash()
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
            destinationAddress: deliveryDest?.address?.trim() || null,
          })
          setTripStarted(false)
          setRouteSeed({ driver: origin, dest })
          livePositionRef.current = origin
          setLiveDriver(origin)
          setPhase('enroute')
          finishSplashAndRelease()
        } catch (e) {
          abortSplash()
          setGeoError(e instanceof Error ? e.message : 'No se pudo iniciar la entrega.')
        }
      },
      (err) => {
        iniciarLockRef.current = false
        setIniciarBusy(false)
        setMotoSplashOpen(false)
        setGeoError(
          err.message ||
            'No se pudo obtener tu ubicación. Revisa permisos del navegador o HTTPS e inténtalo de nuevo.',
        )
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }, [mapsKey, order, deliveryDest, ensureDeliveryId])

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
    googleMapRef.current = map

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
          directionsResultRef.current = result
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
      googleMapRef.current = null
      directionsResultRef.current = null
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
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        livePositionRef.current = p
        setLiveDriver(p)
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
    if (phase !== 'enroute' || routePaused || !tripStarted) return undefined
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
  }, [phase, routePaused, routeSeed, tripStarted])

  if (!canViewPath('/repartidor')) {
    return null
  }

  const items = order?.items || []
  const selectedItemsCount = items.reduce((acc, item, index) => {
    const key = getDeliveryItemKey(item, index)
    return acc + (itemDeliveryChecks[key] ?? true ? 1 : 0)
  }, 0)
  const selectedItemsTotal = items.reduce((acc, item, index) => {
    const key = getDeliveryItemKey(item, index)
    if (!(itemDeliveryChecks[key] ?? true)) return acc
    return acc + Number(item.totalPrice || 0)
  }, 0)
  const allItemsChecked = items.length > 0 && selectedItemsCount === items.length
  const addrLines = order ? formatAddressLines(order) : []
  const isDeliveryCompleted = isDeliveryMarkedDelivered(delivery)
  const canEditDestination = phase === 'detail' && !isDeliveryCompleted

  const folioFromUrl = String(searchParams.get('folio') || searchParams.get('orderNumber') || '').trim()
  /** Listado de entregas cuando la URL no trae folio de nota/pedido. */
  const showDeliveriesList = !folioFromUrl

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
          {!showDeliveriesList ? (
            <Button
              component={RouterLink}
              to="/repartidor"
              size="small"
              startIcon={<ArrowBack />}
              sx={{ textTransform: 'none', mr: 0.5 }}
            >
              Listado
            </Button>
          ) : null}
          <LocalShipping color="primary" sx={{ fontSize: { xs: 28, sm: 32 } }} />
          <PageTitle sx={{ mb: 0 }}>Repartidor — entregas</PageTitle>
        </Stack>

        {showDeliveriesList ? (
          <RepartidorDeliveriesList embedded />
        ) : (
          <>
        {(loadState.loading || loadState.error) && (
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
                      <Chip label={`${selectedItemsCount}/${items.length}`} size="small" />
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
                            <TableCell align="center" sx={{ width: 88 }}>
                              <Tooltip title={allItemsChecked ? 'Desmarcar todos' : 'Marcar todos'}>
                                <Checkbox
                                  size="small"
                                  checked={allItemsChecked}
                                  indeterminate={selectedItemsCount > 0 && !allItemsChecked}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    setItemDeliveryChecks(() => {
                                      const next = {}
                                      items.forEach((it, idx) => {
                                        next[getDeliveryItemKey(it, idx)] = checked
                                      })
                                      return next
                                    })
                                  }}
                                  inputProps={{ 'aria-label': 'Marcar todos los productos a entregar' }}
                                />
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {items.map((item, index) => {
                            const key = getDeliveryItemKey(item, index)
                            const checked = itemDeliveryChecks[key] ?? true
                            return (
                            <TableRow
                              key={key}
                              sx={
                                checked
                                  ? undefined
                                  : {
                                      bgcolor: 'rgba(220, 38, 38, 0.08)',
                                      '& td': { color: '#b91c1c' },
                                    }
                              }
                            >
                              <TableCell>
                                {item.productName || '—'}{' '}
                                {item.productSku ? (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color={checked ? 'text.secondary' : '#7f1d1d'}
                                  >
                                    ({item.productSku})
                                  </Typography>
                                ) : null}
                              </TableCell>
                              <TableCell align="right">{item.quantity ?? '—'}</TableCell>
                              <TableCell align="right">
                                {formatMxCurrency(item.totalPrice, order.currency)}
                              </TableCell>
                              <TableCell align="center">
                                <Checkbox
                                  size="small"
                                  checked={checked}
                                  onChange={() => {
                                    setItemDeliveryChecks((prev) => ({
                                      ...prev,
                                      [key]: !(prev[key] ?? true),
                                    }))
                                  }}
                                  inputProps={{ 'aria-label': `Marcar ${item.productName || 'producto'} para entrega` }}
                                />
                              </TableCell>
                            </TableRow>
                          )})}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Typography variant="body2" sx={{ mt: 1.5 }}>
                      Total pedido ({selectedItemsCount}/{items.length} piezas):{' '}
                      <strong>{formatMxCurrency(selectedItemsTotal, order.currency)}</strong>
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
                    {addrLines.length > 0 ? (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                          Dirección del pedido (referencia)
                        </Typography>
                        {addrLines.map((line, i) => (
                          <Typography key={`${i}-${line}`} variant="body2" sx={{ mb: 0.5 }}>
                            {line}
                          </Typography>
                        ))}
                      </Box>
                    ) : (
                      <Typography color="text.secondary" sx={{ mb: 2 }}>
                        Sin dirección en el pedido. Indica manualmente el punto de entrega.
                      </Typography>
                    )}
                    {mapsKey?.trim() ? (
                      <DeliveryDestinationPicker
                        mapsKey={mapsKey}
                        value={deliveryDest}
                        onChange={setDeliveryDest}
                        onSave={canEditDestination ? saveDeliveryDestination : undefined}
                        defaultAddress={
                          deliveryDest?.address ||
                          delivery?.destinationAddress ||
                          singleLineAddress(order) ||
                          ''
                        }
                        disabled={!canEditDestination}
                      />
                    ) : (
                      <Alert severity="error">Falta VITE_GOOGLE_MAPS_API_KEY en .env</Alert>
                    )}
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
                      disabled={!destLatLng}
                    >
                      Abrir en Google Maps
                    </Button>
                  </AccordionDetails>
                </Accordion>

                <Divider sx={{ my: 2 }} />

                {isDeliveryCompleted && (
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      mb: 2,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>
                      Detalle del acuse de entrega
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                      La nota firmada usa el mismo formato que la nota de venta del sistema; al pie incluye «RECIBÍ DE
                      CONFORMIDAD», la firma y los datos de quien recibe.
                    </Typography>
                    {deliveredHandoffSummary &&
                    Array.isArray(deliveredHandoffSummary.deliveredItems) &&
                    deliveredHandoffSummary.deliveredItems.length > 0 ? (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                          Piezas en esta entrega
                        </Typography>
                        <Stack spacing={0.75}>
                          {deliveredHandoffSummary.deliveredItems.map((it, idx) => (
                            <Typography key={`${it.productName}-${idx}`} variant="body2" color="text.secondary">
                              {idx + 1}. {it.productName}{' '}
                              <Box component="span" sx={{ color: 'text.primary' }}>
                                · Cant. {it.quantity} · {formatMxCurrency(it.totalPrice, order?.currency)}
                              </Box>
                            </Typography>
                          ))}
                        </Stack>
                        {deliveredHandoffSummary.deliveredTotal != null ? (
                          <Typography variant="body2" sx={{ mt: 1, fontWeight: 700 }}>
                            Total piezas entregadas:{' '}
                            {formatMxCurrency(deliveredHandoffSummary.deliveredTotal, order?.currency)}
                          </Typography>
                        ) : null}
                      </Box>
                    ) : null}

                    {deliveredHandoffSummary &&
                    (deliveredHandoffSummary.recipientName || deliveredHandoffSummary.recipientRole) ? (
                      <Box
                        sx={{
                          mb: 2,
                          p: 1.5,
                          borderRadius: 1,
                          bgcolor: 'background.paper',
                          border: 1,
                          borderColor: 'divider',
                        }}
                      >
                        <Typography
                          variant="caption"
                          fontWeight={800}
                          sx={{ display: 'block', textAlign: 'center', letterSpacing: 0.6, mb: 1.25 }}
                        >
                          RECIBÍ DE CONFORMIDAD
                        </Typography>
                        {deliveredHandoffSummary.signaturePng ? (
                          <Box
                            component="img"
                            src={deliveredHandoffSummary.signaturePng}
                            alt="Firma de quien recibe"
                            sx={{
                              display: 'block',
                              mx: 'auto',
                              maxWidth: '100%',
                              maxHeight: 120,
                              objectFit: 'contain',
                              mb: 1.25,
                            }}
                          />
                        ) : deliveredHandoffSummary.hadSignature ? (
                          <Chip
                            size="small"
                            color="success"
                            variant="outlined"
                            label="Firma registrada (ver PDF)"
                            sx={{ display: 'flex', mx: 'auto', mb: 1, width: 'fit-content' }}
                          />
                        ) : null}
                        <Typography variant="body2" align="center">
                          <Box component="span" color="text.secondary">
                            Nombre:{' '}
                          </Box>
                          <strong>{deliveredHandoffSummary.recipientName || '—'}</strong>
                        </Typography>
                        <Typography variant="body2" align="center" sx={{ mt: 0.5 }}>
                          <Box component="span" color="text.secondary">
                            Puesto:{' '}
                          </Box>
                          <strong>{deliveredHandoffSummary.recipientRole || '—'}</strong>
                        </Typography>
                      </Box>
                    ) : null}

                    {deliveredHandoffSummary?.photoFileName ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                        Evidencia (imagen):{' '}
                        <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                          {deliveredHandoffSummary.photoFileName}
                        </Box>
                      </Typography>
                    ) : null}
                    {deliveredHandoffSummary?.docFileName ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.75 }}>
                        Evidencia (documento):{' '}
                        <Box component="span" sx={{ color: 'text.primary', fontWeight: 600 }}>
                          {deliveredHandoffSummary.docFileName}
                        </Box>
                      </Typography>
                    ) : null}

                    {deliveredHandoffSummary &&
                    !deliveredHandoffSummary.recipientName &&
                    !deliveredHandoffSummary.photoFileName &&
                    !deliveredHandoffSummary.docFileName &&
                    !delivery?.signedDocumentUrl ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        No hay detalle guardado en este navegador. Si recargaste la página, abre la nota firmada (PDF)
                        desde el botón de abajo si ya se subió al servidor.
                      </Typography>
                    ) : null}

                    {!deliveredHandoffSummary && !delivery?.signedDocumentUrl ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        La entrega figura como completada. No hay PDF firmado enlazado; consúltalo en historial o desde
                        el equipo donde se cerró la entrega.
                      </Typography>
                    ) : null}

                    {deliveredHandoffSummary?.completedAt ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                        Registrado: {new Date(deliveredHandoffSummary.completedAt).toLocaleString('es-MX')}
                      </Typography>
                    ) : null}

                    {deliveredHandoffSummary?.signedNotePdfUrl || delivery?.signedDocumentUrl ? (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={viewSignedDeliveryNote}
                        sx={{ alignSelf: 'flex-start', textTransform: 'none', fontWeight: 700 }}
                      >
                        VER NOTA FIRMADA
                      </Button>
                    ) : null}
                  </Paper>
                )}

                {!isDeliveryCompleted && (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                      startIcon={<LocalShipping />}
                      onClick={iniciarEntrega}
                      disabled={
                        loadState.loading ||
                        iniciarBusy ||
                        !mapsKey?.trim() ||
                        deliveryDest?.lat == null ||
                        deliveryDest?.lng == null
                      }
                      sx={{ py: 1.5, fontWeight: 800, fontSize: '1rem', textTransform: 'none' }}
                    >
                      {iniciarBusy ? 'Obteniendo ubicación…' : 'INICIAR ENTREGA'}
                    </Button>
                    {(deliveryDest?.lat == null || deliveryDest?.lng == null) && mapsKey?.trim() && (
                      <Alert severity="info" sx={{ mt: 1.5 }}>
                        Marca el punto de entrega en el mapa y pulsa <strong>Guardar destino</strong> antes de
                        iniciar. Se usará tu GPS real y ese destino para la ruta.
                      </Alert>
                    )}
                  </>
                )}
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
              background: routeProPalette.bg,
              pb: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <AppBar
              position="static"
              elevation={0}
              sx={{
                bgcolor: 'rgba(15, 23, 42, 0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: `1px solid ${routeProPalette.border}`,
              }}
            >
              <Toolbar variant="dense" sx={{ flexWrap: 'wrap', gap: 1, py: 1.25, minHeight: 56 }}>
                <IconButton
                  edge="start"
                  aria-label="Volver al detalle"
                  onClick={() => void stopEntrega()}
                  size="large"
                  sx={{
                    color: routeProPalette.text,
                    '&:hover': { bgcolor: 'rgba(148,163,184,0.12)' },
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <Box sx={{ flex: 1, minWidth: 140 }}>
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{ color: routeProPalette.textMuted, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', fontSize: '0.65rem' }}
                  >
                    {tripStarted ? 'Tiempo estimado (tráfico)' : 'Ruta lista'}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: 800, color: routeProPalette.accent, lineHeight: 1.2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                  >
                    {tripStarted ? etaText || 'Calculando…' : etaText || 'Pulsa INICIAR VIAJE'}
                  </Typography>
                  {!tripStarted ? (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.25, color: routeProPalette.textMuted, lineHeight: 1.35 }}>
                      El GPS y el guardado del recorrido empiezan al iniciar.
                    </Typography>
                  ) : null}
                </Box>
                <Tooltip
                  title={
                    !tripStarted
                      ? 'Inicia el viaje para poder pausar'
                      : routePaused
                        ? 'Reanudar seguimiento'
                        : 'Pausar seguimiento'
                  }
                >
                  <span>
                    <Button
                      variant={routePaused ? 'contained' : 'outlined'}
                      color={routePaused ? 'warning' : 'inherit'}
                      size="small"
                      disabled={!tripStarted}
                      startIcon={routePaused ? <PlayArrow /> : <Pause />}
                      onClick={routePaused ? resumeEntrega : pauseEntrega}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        ...(routePaused
                          ? {}
                          : {
                              color: routeProPalette.text,
                              borderColor: routeProPalette.border,
                              '&:hover': { borderColor: '#94a3b8', bgcolor: 'rgba(148,163,184,0.08)' },
                            }),
                      }}
                    >
                      {routePaused ? 'Continuar' : 'Pausar'}
                    </Button>
                  </span>
                </Tooltip>
              </Toolbar>
            </AppBar>
            <Box
              sx={{
                px: 2,
                py: 1.25,
                bgcolor: routeProPalette.surface,
                borderBottom: `1px solid ${routeProPalette.border}`,
              }}
            >
              <Typography variant="caption" sx={{ color: routeProPalette.textMuted, lineHeight: 1.45, display: 'block' }}>
                {tripStarted
                  ? 'El recorrido se guarda en el servidor cada 10 s (incluido al usar atrás).'
                  : 'Pulsa INICIAR VIAJE para comenzar el seguimiento y el guardado del recorrido.'}
              </Typography>
              {mapsError ? (
                <Alert
                  severity="error"
                  sx={{
                    mt: 1,
                    bgcolor: 'rgba(127, 29, 29, 0.35)',
                    color: '#fecaca',
                    border: '1px solid rgba(248, 113, 113, 0.35)',
                    '& .MuiAlert-icon': { color: '#fca5a5' },
                  }}
                >
                  {mapsError}
                </Alert>
              ) : null}
              {geoError ? (
                <Alert
                  severity="warning"
                  sx={{
                    mt: 1,
                    bgcolor: 'rgba(120, 53, 15, 0.35)',
                    color: '#fed7aa',
                    border: '1px solid rgba(251, 146, 60, 0.35)',
                    '& .MuiAlert-icon': { color: '#fdba74' },
                  }}
                >
                  {geoError}
                </Alert>
              ) : null}
            </Box>
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                position: 'relative',
                width: '100%',
                p: { xs: 0, sm: 1.5 },
                boxSizing: 'border-box',
              }}
            >
              <Box
                ref={mapDivRef}
                sx={{
                  position: 'absolute',
                  inset: { xs: 0, sm: 12 },
                  zIndex: 0,
                  bgcolor: '#334155',
                  borderRadius: { xs: 0, sm: 2 },
                  overflow: 'hidden',
                  boxShadow: { xs: 'none', sm: '0 16px 48px rgba(0,0,0,0.35)' },
                  border: { xs: 'none', sm: `1px solid ${routeProPalette.border}` },
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  top: { xs: 10, sm: 22 },
                  left: { xs: 10, sm: 22 },
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 1,
                  maxWidth: { xs: 'calc(100vw - 20px)', sm: 420 },
                  pointerEvents: 'none',
                }}
              >
                <Stack direction="column" spacing={1} sx={{ pointerEvents: 'auto', flexShrink: 0 }}>
                  <Tooltip title={mapSidePanelKind === 'address' ? 'Ocultar dirección' : 'Dirección de entrega'}>
                    <IconButton
                      aria-label="Ver dirección de entrega"
                      aria-expanded={mapSidePanelKind === 'address'}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMapSidePanelKind((k) => (k === 'address' ? null : 'address'))
                      }}
                      sx={{
                        bgcolor: mapSidePanelKind === 'address' ? routeProPalette.accent : 'rgba(255,255,255,0.95)',
                        color: mapSidePanelKind === 'address' ? '#0f172a' : '#0f172a',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
                        '&:hover': {
                          bgcolor: mapSidePanelKind === 'address' ? '#bae6fd' : '#fff',
                        },
                      }}
                    >
                      <LocationOn />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={mapSidePanelKind === 'recipient' ? 'Ocultar destinatario' : 'Destinatario'}>
                    <IconButton
                      aria-label="Ver destinatario de la entrega"
                      aria-expanded={mapSidePanelKind === 'recipient'}
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMapSidePanelKind((k) => (k === 'recipient' ? null : 'recipient'))
                      }}
                      sx={{
                        bgcolor: mapSidePanelKind === 'recipient' ? routeProPalette.accent : 'rgba(255,255,255,0.95)',
                        color: '#0f172a',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
                        '&:hover': {
                          bgcolor: mapSidePanelKind === 'recipient' ? '#bae6fd' : '#fff',
                        },
                      }}
                    >
                      <Person />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Box sx={{ pointerEvents: 'auto', minWidth: 0, flex: '0 1 auto' }}>
                  <Slide
                    in={mapSidePanelKind != null}
                    direction="left"
                    timeout={{ enter: 320, exit: 260 }}
                    mountOnEnter
                    unmountOnExit
                  >
                    <Paper
                      elevation={12}
                      sx={{
                        width: { xs: 'min(calc(100vw - 92px), 300px)', sm: 300 },
                        maxHeight: { xs: 'min(52vh, 360px)', sm: 400 },
                        overflow: 'auto',
                        p: 1.75,
                        bgcolor: 'rgba(15, 23, 42, 0.98)',
                        color: routeProPalette.text,
                        border: `1px solid ${routeProPalette.border}`,
                        borderRadius: 2,
                        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(12px)',
                      }}
                    >
                      {mapSidePanelKind === 'address' ? (
                        <>
                          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} sx={{ mb: 1.25 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: routeProPalette.accent, pr: 1 }}>
                              Dirección de entrega
                            </Typography>
                            <IconButton
                              size="small"
                              aria-label="Cerrar panel"
                              onClick={() => setMapSidePanelKind(null)}
                              sx={{ color: routeProPalette.textMuted, mt: -0.5, mr: -0.5 }}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </Stack>
                          {addrLines.length === 0 ? (
                            <Typography variant="body2" sx={{ color: routeProPalette.textMuted }}>
                              Sin dirección en el pedido.
                            </Typography>
                          ) : (
                            addrLines.map((line, i) => (
                              <Typography key={`map-addr-${i}`} variant="body2" sx={{ mb: 0.5, lineHeight: 1.45 }}>
                                {line}
                              </Typography>
                            ))
                          )}
                        </>
                      ) : null}
                      {mapSidePanelKind === 'recipient' ? (
                        <>
                          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1} sx={{ mb: 1.25 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: routeProPalette.accent, pr: 1 }}>
                              Destinatario
                            </Typography>
                            <IconButton
                              size="small"
                              aria-label="Cerrar panel"
                              onClick={() => setMapSidePanelKind(null)}
                              sx={{ color: routeProPalette.textMuted, mt: -0.5, mr: -0.5 }}
                            >
                              <Close fontSize="small" />
                            </IconButton>
                          </Stack>
                          {(() => {
                            const addr = getOrderShippingLikeAddress(order)
                            const nm = addr ? [addr.firstName, addr.lastName].filter(Boolean).join(' ').trim() : ''
                            return (
                              <>
                                {nm ? (
                                  <Typography variant="body2" sx={{ mb: addr?.phone ? 1 : 0, fontWeight: 600 }}>
                                    {nm}
                                  </Typography>
                                ) : (
                                  <Typography variant="body2" sx={{ mb: 1, color: routeProPalette.textMuted }}>
                                    Sin nombre en la dirección de envío.
                                  </Typography>
                                )}
                                {addr?.phone ? (
                                  <Typography variant="body2" sx={{ color: routeProPalette.textMuted }}>
                                    Tel. {addr.phone}
                                  </Typography>
                                ) : null}
                                {recipientName.trim() ? (
                                  <>
                                    <Divider sx={{ my: 1.5, borderColor: routeProPalette.border }} />
                                    <Typography variant="caption" sx={{ color: routeProPalette.textMuted, display: 'block', mb: 0.5 }}>
                                      Confirmado al finalizar (acuse)
                                    </Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                      {recipientName.trim()}
                                      {recipientRole.trim() ? ` · ${recipientRole.trim()}` : ''}
                                    </Typography>
                                  </>
                                ) : null}
                              </>
                            )
                          })()}
                        </>
                      ) : null}
                    </Paper>
                  </Slide>
                </Box>
              </Box>
              {!evidencePanelOpen && (
                <Box
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 10,
                    isolation: 'isolate',
                    p: 1.5,
                    pt: 1,
                    bgcolor: 'rgba(15, 23, 42, 0.94)',
                    backdropFilter: 'blur(12px)',
                    borderTop: `1px solid ${routeProPalette.border}`,
                    boxShadow: '0 -8px 32px rgba(0,0,0,0.35)',
                    pointerEvents: 'auto',
                  }}
                >
                  <Button
                    type="button"
                    variant="contained"
                    size="large"
                    fullWidth
                    startIcon={tripStarted ? <CheckCircle /> : <PlayArrow />}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (!tripStarted) {
                        iniciarViaje()
                        return
                      }
                      setFinalizarConfirmOpen(true)
                    }}
                    sx={{
                      py: 1.35,
                      fontWeight: 800,
                      textTransform: 'none',
                      fontSize: '1rem',
                      bgcolor: '#22c55e',
                      color: '#0f172a',
                      boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                      '&:hover': { bgcolor: '#16a34a', color: '#0f172a' },
                    }}
                  >
                    {tripStarted ? 'FINALIZAR VIAJE' : 'INICIAR VIAJE'}
                  </Button>
                </Box>
              )}
              {evidencePanelOpen && (
                <Paper
                  elevation={0}
                  sx={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 20,
                    maxHeight: { xs: '62vh', sm: '56vh' },
                    overflow: 'auto',
                    borderRadius: '12px 12px 0 0',
                    p: { xs: 1.5, sm: 2 },
                    pb: 'max(16px, env(safe-area-inset-bottom, 0px))',
                    bgcolor: 'rgba(30, 41, 59, 0.98)',
                    color: routeProPalette.text,
                    border: `1px solid ${routeProPalette.border}`,
                    borderBottom: 'none',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.5 }}>
                    Entrega — acuse y evidencia
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1.5, color: routeProPalette.textMuted }}>
                    Recibe:{' '}
                    <Box component="span" sx={{ color: routeProPalette.text, fontWeight: 700 }}>
                      {recipientName.trim()}
                    </Box>{' '}
                    · Puesto:{' '}
                    <Box component="span" sx={{ color: routeProPalette.text, fontWeight: 700 }}>
                      {recipientRole.trim()}
                    </Box>
                  </Typography>
                  {handoffError && (
                    <Alert
                      severity="error"
                      sx={{
                        mb: 1.5,
                        bgcolor: 'rgba(127, 29, 29, 0.35)',
                        color: '#fecaca',
                        border: '1px solid rgba(248, 113, 113, 0.35)',
                        '& .MuiAlert-icon': { color: '#fca5a5' },
                      }}
                    >
                      {handoffError}
                    </Alert>
                  )}
                  <Typography variant="subtitle2" sx={{ mb: 0.5, color: routeProPalette.textMuted }}>
                    Firma de quien recibe
                  </Typography>
                  <SignaturePad
                    onChange={setHandoffSignaturePng}
                    sx={{ maxWidth: '100%' }}
                    clearButtonLabel="LIMPIAR FIRMA"
                    clearButtonSx={{
                      alignSelf: { xs: 'stretch', sm: 'flex-start' },
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: routeProPalette.text,
                      borderColor: routeProPalette.border,
                      '&:hover': {
                        borderColor: '#94a3b8',
                        bgcolor: 'rgba(148,163,184,0.12)',
                      },
                    }}
                  />
                  <Divider sx={{ my: 2, borderColor: routeProPalette.border }} />
                  <Typography variant="subtitle2" sx={{ mb: 1, color: routeProPalette.textMuted }}>
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
                    <input
                      ref={handoffMediaInputRef}
                      type="file"
                      hidden
                      accept="image/*,.pdf,application/pdf"
                      onChange={onHandoffImageOrDocChange}
                    />
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<PhotoCamera />}
                      onClick={() => handoffCameraInputRef.current?.click()}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        py: 1.25,
                        color: routeProPalette.text,
                        borderColor: routeProPalette.border,
                        '&:hover': { borderColor: '#94a3b8', bgcolor: 'rgba(148,163,184,0.08)' },
                      }}
                    >
                      TOMAR FOTO
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<AttachFile />}
                      onClick={() => handoffMediaInputRef.current?.click()}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        py: 1.25,
                        color: routeProPalette.text,
                        borderColor: routeProPalette.border,
                        '&:hover': { borderColor: '#94a3b8', bgcolor: 'rgba(148,163,184,0.08)' },
                      }}
                    >
                      CARGAR IMAGEN / DOCUMENTO
                    </Button>
                  </Stack>
                  {handoffPhotoFile && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: routeProPalette.textMuted }}>
                      Foto:{' '}
                      <Box component="span" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                        {handoffPhotoFile.name}
                      </Box>
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
                        border: `1px solid ${routeProPalette.border}`,
                        mt: 1,
                      }}
                    />
                  )}
                  {handoffDocFile && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block', color: routeProPalette.textMuted }}>
                      Documento:{' '}
                      <Box component="span" sx={{ fontWeight: 700, color: '#f1f5f9' }}>
                        {handoffDocFile.name}
                      </Box>
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
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        py: 1.25,
                        color: routeProPalette.text,
                        borderColor: routeProPalette.border,
                        '&:hover': { borderColor: '#94a3b8', bgcolor: 'rgba(148,163,184,0.08)' },
                      }}
                    >
                      VOLVER AL MAPA
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      disabled={handoffBusy}
                      onClick={() => void confirmDeliveryHandoff()}
                      startIcon={<CheckCircle />}
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.6,
                        fontWeight: 800,
                        fontSize: '0.8rem',
                        py: 1.25,
                      }}
                    >
                      CONFIRMAR ENTREGA
                    </Button>
                  </Stack>
                </Paper>
              )}
            </Box>

            <Dialog
              open={finalizarConfirmOpen}
              onClose={(_, reason) => {
                if (reason === 'backdropClick') return
                setFinalizarConfirmOpen(false)
              }}
              fullWidth
              maxWidth="xs"
              aria-labelledby="finalizar-entrega-confirm-title"
              slotProps={dialogSlotPropsAboveMap}
            >
              <DialogTitle
                id="finalizar-entrega-confirm-title"
                sx={{
                  bgcolor: '#0f172a',
                  color: routeProPalette.text,
                  borderBottom: `1px solid ${routeProPalette.border}`,
                  py: 1.75,
                  px: 3,
                  fontWeight: 700,
                  fontSize: '1.1rem',
                }}
              >
                Finalizar entrega
              </DialogTitle>
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
                  Sí, Finalizar
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
              slotProps={dialogSlotPropsAboveMap}
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

        {motoSplashOpen ? <MotoDeliverySplashOverlay /> : null}
        {handoffBusy ? <FinalizingDeliverySplashOverlay /> : null}
          </>
        )}
      </Box>
    </Box>
  )
}
