import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate, useParams, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Chip,
  Divider,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  OpenInNew as OpenInNewIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import PageTitle from '../components/PageTitle'
import { SIDEBAR_WIDTH } from '../config/layout'
import { useAuth } from '../contexts/AuthContext'
import { useExpedienteFavorites } from '../hooks/useExpedienteFavorites'
import ExpedienteTimeline from '../components/expediente/ExpedienteTimeline'
import { folderExpedienteLabel } from '../utils/expedienteDisplay'
import {
  getExpediente,
  uploadExpedienteDocument,
  deleteExpedienteDocument,
} from '../api/expediente'
import {
  EXPEDIENTE_ACCENT,
  EXPEDIENTE_ACCENT_HOVER,
  HEADER_SUBTITLE,
  sectionHeaderBg,
  chipNeutralBg,
  chipAccentBg,
  chipBlueBg,
  uploadPanelBg,
  timelineActiveBg,
  timelineActiveBorder,
} from '../utils/expedienteTheme'

const DOC_TYPES = [
  { value: 'empaquetado', label: 'Empaquetado' },
  { value: 'guia_rastreo', label: 'Guía de rastreo' },
  { value: 'fotografia', label: 'Fotografía' },
  { value: 'recibo', label: 'Recibo' },
  { value: 'otro', label: 'Otro' },
]

function formatDate(v) {
  if (!v) return '—'
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' })
}

function money(n, c = 'MXN') {
  if (n == null) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: c }).format(Number(n))
}

function InfoRow({ label, value }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 0.25, sm: 1 }, py: 0.5 }}>
      <Typography sx={{ fontSize: { xs: '0.78rem', lg: '0.82rem' }, color: 'text.secondary', minWidth: { sm: 110 } }}>
        {label}
      </Typography>
      <Typography sx={{ fontSize: { xs: '0.78rem', lg: '0.82rem' }, color: 'text.primary', fontWeight: 500 }}>
        {value || '—'}
      </Typography>
    </Box>
  )
}

function SplitCardHeader({ folio, title, headerColor }) {
  return (
    <Box
      sx={{
        px: { xs: 2, lg: 2.25 },
        py: { xs: 1.25, lg: 1.5 },
        bgcolor: headerColor || sectionHeaderBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: { xs: '0.92rem', lg: '1rem' },
          color: '#fff',
          lineHeight: 1.3,
        }}
      >
        {title}
      </Typography>
      {folio ? (
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: { xs: '0.82rem', lg: '0.88rem' },
            color: HEADER_SUBTITLE,
            textAlign: 'right',
            flexShrink: 0,
            fontFamily: 'monospace',
            letterSpacing: 0.3,
          }}
        >
          {folio}
        </Typography>
      ) : null}
    </Box>
  )
}

function CardHeader({ title, subtitle, headerColor }) {
  return (
    <Box
      sx={{
        px: { xs: 2, lg: 2.25 },
        py: { xs: 1.25, lg: 1.5 },
        bgcolor: headerColor || sectionHeaderBg,
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: { xs: '0.92rem', lg: '1rem' }, color: '#fff', lineHeight: 1.3 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography sx={{ fontSize: '0.75rem', color: HEADER_SUBTITLE, mt: 0.35 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  )
}

function SummaryCard({ title, subtitle, folio, splitHeader = false, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      {splitHeader ? (
        <SplitCardHeader folio={folio} title={title} />
      ) : (
        <CardHeader title={title} subtitle={subtitle} />
      )}
      <Box sx={{ p: { xs: 2, lg: 2.25, xl: 2.5 }, flex: 1, bgcolor: 'background.paper' }}>
        {children}
      </Box>
    </Paper>
  )
}

function DetailSectionCard({ title, subtitle, headerColor, children }) {
  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <CardHeader title={title} subtitle={subtitle} headerColor={headerColor} />
      <Box sx={{ p: { xs: 2, lg: 2.25, xl: 2.5 }, bgcolor: 'background.paper' }}>
        {children}
      </Box>
    </Paper>
  )
}

export default function ExpedienteDetalle() {
  const { ref } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useExpedienteFavorites(user?.id)
  const fileInputRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)
  const [docType, setDocType] = useState('fotografia')
  const [docTitle, setDocTitle] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')

  const load = useCallback(async () => {
    if (!ref) return
    setLoading(true)
    setError('')
    const r = await getExpediente(ref)
    setLoading(false)
    if (!r.success) {
      setError(r.error || 'No se pudo cargar el expediente')
      setData(null)
      return
    }
    setData(r.data)
    const timeline = r.data?.timeline || []
    if (timeline.length) {
      const latest = [...timeline].sort(
        (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
      )[0]
      setSelectedEvent(latest)
    }
  }, [ref])

  useEffect(() => {
    load()
  }, [load])

  const handleTimelineSelect = (ev) => {
    setSelectedEvent(ev)
  }

  const handleUpload = async (e) => {
    const isPhotoBatch = docType === 'fotografia'
    const files = isPhotoBatch
      ? Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'))
      : [e.target.files?.[0]].filter(Boolean)
    e.target.value = ''
    if (!files.length || !ref) return

    setUploading(true)
    setUploadError('')

    const title = docTitle.trim() || undefined
    let uploaded = 0
    const failures = []

    for (const file of files) {
      const r = await uploadExpedienteDocument(ref, file, {
        documentType: docType,
        title: files.length === 1 ? title : undefined,
        uploadedByUserId: user?.id,
      })
      if (r.success) uploaded += 1
      else failures.push(`${file.name}: ${r.error || 'Error'}`)
    }

    setUploading(false)

    if (failures.length > 0) {
      const summary =
        uploaded > 0
          ? `${uploaded} de ${files.length} archivo(s) subido(s). `
          : ''
      setUploadError(`${summary}${failures.join('; ')}`)
      if (uploaded > 0) {
        setDocTitle('')
        await load()
      }
      return
    }

    setDocTitle('')
    await load()
  }

  const handleDeleteDoc = async (documentId) => {
    if (!window.confirm('¿Eliminar este documento?')) return
    const r = await deleteExpedienteDocument(documentId)
    if (!r.success) {
      setUploadError(r.error || 'No se pudo eliminar')
      return
    }
    await load()
  }

  const exp = data?.expediente
  const favoriteRow = exp
    ? {
        id: exp.id,
        expedienteNumber: exp.expedienteNumber,
        clientName: exp.clientName,
        orderNumber: data?.order?.orderNumber,
        quotationNumber: data?.quotation?.quotationNumber,
        vehicleBrand: data?.quotation?.vehicleBrand || data?.order?.vehicleBrand,
        vehicleModel: data?.quotation?.vehicleModel || data?.order?.vehicleModel,
        vehicleYear: data?.quotation?.vehicleYear || data?.order?.vehicleYear,
      }
    : null

  const vehicleLabel = useMemo(() => {
    if (!data) return ''
    return folderExpedienteLabel({
      vehicleBrand: data?.quotation?.vehicleBrand || data?.order?.vehicleBrand,
      vehicleModel: data?.quotation?.vehicleModel || data?.order?.vehicleModel,
      vehicleYear: data?.quotation?.vehicleYear || data?.order?.vehicleYear,
      expedienteNumber: exp?.expedienteNumber,
    })
  }, [data, exp])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginTop: { xs: 0, md: '70px' },
          pl: { xs: 2, sm: 3, md: `${SIDEBAR_WIDTH + 24}px` },
          pr: { xs: 2, sm: 3, md: 3 },
          pt: { xs: 2, sm: 3, md: 3 },
          pb: { xs: 2, sm: 3, md: 3 },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          <IconButton
            onClick={() => navigate('/expediente-digital')}
            aria-label="Volver a expedientes"
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: timelineActiveBg,
                borderColor: timelineActiveBorder,
              },
            }}
          >
            <ArrowBackIcon sx={{ color: EXPEDIENTE_ACCENT }} />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <PageTitle sx={{ mb: 0 }}>Expediente digital</PageTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 0.25 }}>
              <Button
                size="small"
                onClick={() => navigate('/expediente-digital')}
                sx={{ textTransform: 'none', color: EXPEDIENTE_ACCENT, fontWeight: 600, p: 0, minWidth: 0 }}
              >
                Expedientes
              </Button>
              <ChevronRightIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
              <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary' }}>Detalle</Typography>
              {vehicleLabel && (
                <>
                  <ChevronRightIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
                  <Typography sx={{ fontSize: '0.82rem', color: 'text.primary', fontWeight: 600 }}>
                    {vehicleLabel}
                  </Typography>
                </>
              )}
            </Box>
          </Box>
          {favoriteRow && (
            <IconButton
              aria-label={isFavorite(favoriteRow.id) ? 'Quitar de favoritos' : 'Marcar favorito'}
              onClick={() => toggleFavorite(favoriteRow)}
              sx={{ color: isFavorite(favoriteRow.id) ? '#F5A623' : 'action.disabled' }}
            >
              {isFavorite(favoriteRow.id) ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>
          )}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: EXPEDIENTE_ACCENT }} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: 'minmax(300px, 340px) 1fr',
                xl: 'minmax(340px, 380px) 1fr',
              },
              gap: { xs: 2, lg: 2, xl: 2.5 },
              alignItems: 'start',
            }}
          >
            {/* Timeline izquierda */}
            <ExpedienteTimeline
              events={data?.timeline || []}
              selectedId={selectedEvent?.id}
              onSelect={handleTimelineSelect}
            />

            {/* Contenido principal */}
            <Box sx={{ minWidth: 0 }}>
              {/* Encabezado del evento / expediente */}
              <Box sx={{ mb: 2 }}>
              <DetailSectionCard
                title={selectedEvent?.title || 'Expediente digital'}
                subtitle={selectedEvent?.description || exp?.expedienteNumber}
                headerColor={EXPEDIENTE_ACCENT}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      size="small"
                      label={exp?.clientName || 'Sin cliente'}
                      sx={(theme) => ({ bgcolor: chipNeutralBg(theme), fontSize: '0.75rem' })}
                    />
                    {data?.quotation?.claimNumber && (
                      <Chip
                        size="small"
                        label={`Siniestro ${data.quotation.claimNumber}`}
                        sx={(theme) => ({ bgcolor: chipAccentBg(theme), color: EXPEDIENTE_ACCENT, fontSize: '0.75rem' })}
                      />
                    )}
                    {data?.order?.orderNumber && (
                      <Chip
                        size="small"
                        label={data.order.orderNumber}
                        sx={(theme) => ({
                          bgcolor: chipBlueBg(theme),
                          color: theme.palette.mode === 'dark' ? '#90CAF9' : '#1565C0',
                          fontSize: '0.75rem',
                        })}
                      />
                    )}
                  </Box>
                  {selectedEvent && (
                    <Typography sx={{ fontSize: '0.8rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {formatDate(selectedEvent.occurredAt)}
                    </Typography>
                  )}
                </Box>
              </DetailSectionCard>
              </Box>

              {/* Cotización + Nota de venta */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                  gap: { xs: 2, lg: 2, xl: 2.5 },
                  mb: 2,
                }}
              >
                <SummaryCard
                  title="Cotización"
                  folio={data?.quotation?.quotationNumber}
                  splitHeader
                >
                  {!data?.quotation ? (
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Sin cotización vinculada.</Typography>
                  ) : (
                    <>
                      <InfoRow label="Estado" value={data.quotation.status} />
                      <InfoRow label="Cliente" value={data.quotation.clientName} />
                      <InfoRow label="Asesor" value={data.quotation.advisorName} />
                      <InfoRow label="Total" value={money(data.quotation.totalAmount)} />
                      <InfoRow label="Creada" value={formatDate(data.quotation.createdAt)} />
                      <Link
                        component={RouterLink}
                        to={`/cotizaciones/${data.quotation.id}`}
                        sx={{ fontSize: '0.82rem', mt: 1, display: 'inline-block', fontWeight: 600 }}
                      >
                        Ver cotización
                      </Link>
                      {data.quotation.pdfUrl && (
                        <Link href={data.quotation.pdfUrl} target="_blank" rel="noopener" sx={{ fontSize: '0.82rem', mt: 1, ml: 2, display: 'inline-block' }}>
                          Ver PDF <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
                        </Link>
                      )}
                    </>
                  )}
                </SummaryCard>

                <SummaryCard
                  title="Nota de venta"
                  folio={data?.order?.orderNumber}
                  splitHeader
                >
                  {!data?.order ? (
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>Sin nota de venta vinculada.</Typography>
                  ) : (
                    <>
                      <InfoRow label="Estado" value={data.order.status} />
                      <InfoRow
                        label="Cliente"
                        value={`${data.order.billingFirstName} ${data.order.billingLastName}`.trim()}
                      />
                      <InfoRow label="Canal" value={data.order.salesChannel} />
                      <InfoRow label="Total" value={money(data.order.totalAmount)} />
                      <InfoRow label="Rastreo" value={data.order.trackingNumber} />
                      <InfoRow label="Creada" value={formatDate(data.order.createdAt)} />
                      {data.order.pdfUrl && (
                        <Link href={data.order.pdfUrl} target="_blank" rel="noopener" sx={{ fontSize: '0.82rem', mt: 1, display: 'inline-block' }}>
                          Ver PDF <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
                        </Link>
                      )}
                    </>
                  )}
                </SummaryCard>
              </Box>

              {/* Compras y entregas vinculadas a la nota de venta */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                  gap: { xs: 2, lg: 2, xl: 2.5 },
                  mb: 2,
                }}
              >
                <SummaryCard
                  title={`Compras (${data?.purchases?.length ?? 0})`}
                  folio={data?.purchases?.length === 1 ? data.purchases[0].folio : undefined}
                  splitHeader
                >
                  {!data?.order ? (
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                      Sin nota de venta vinculada. Las compras se muestran cuando existe una orden.
                    </Typography>
                  ) : (data?.purchases || []).length === 0 ? (
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                      No hay compras registradas para {data.order.orderNumber}.
                    </Typography>
                  ) : (
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Folio</TableCell>
                            <TableCell>Proveedor</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.purchases.map((p) => (
                            <TableRow
                              key={p.folio}
                              hover
                              sx={{ cursor: 'pointer' }}
                              onClick={() => navigate(`/compras/${p.folio}`)}
                            >
                              <TableCell sx={{ fontWeight: 600 }}>{p.folio}</TableCell>
                              <TableCell>{p.providerName}</TableCell>
                              <TableCell>{money(p.total)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </SummaryCard>

                <SummaryCard
                  title={`Entregas (${data?.deliveries?.length ?? 0})`}
                  folio={data?.deliveries?.length === 1 ? data.deliveries[0].deliveryNumber : undefined}
                  splitHeader
                >
                  {!data?.order ? (
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                      Sin nota de venta vinculada. Las entregas se asocian a la orden de venta.
                    </Typography>
                  ) : (data?.deliveries || []).length === 0 ? (
                    <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                      No hay entregas registradas para {data.order.orderNumber}.
                    </Typography>
                  ) : (
                    <TableContainer sx={{ overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Folio</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell sx={{ whiteSpace: 'nowrap' }}>Entregado</TableCell>
                            <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>Repartidor</TableCell>
                            <TableCell>Doc.</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.deliveries.map((d) => (
                            <TableRow key={d.id}>
                              <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{d.deliveryNumber}</TableCell>
                              <TableCell>{d.status}</TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(d.deliveredAt)}</TableCell>
                              <TableCell sx={{ display: { xs: 'none', xl: 'table-cell' } }}>{d.repartidor || '—'}</TableCell>
                              <TableCell>
                                {d.signedDocumentUrl ? (
                                  <Link href={d.signedDocumentUrl} target="_blank" rel="noopener">
                                    Ver
                                  </Link>
                                ) : (
                                  '—'
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </SummaryCard>
              </Box>

              {/* Documentos del expediente */}
              <DetailSectionCard
                title={`Documentos (${data?.documents?.length ?? 0})`}
                subtitle="Archivos adjuntos al expediente digital"
              >
                <Box sx={(theme) => ({ mb: 2, p: 2, bgcolor: uploadPanelBg(theme), borderRadius: 1.5, border: 1, borderColor: 'divider' })}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', mb: 1.5 }}>
                    Cargar documento
                  </Typography>
                  {uploadError && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                      {uploadError}
                    </Alert>
                  )}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Tipo</InputLabel>
                      <Select value={docType} label="Tipo" onChange={(e) => setDocType(e.target.value)}>
                        {DOC_TYPES.map((t) => (
                          <MenuItem key={t.value} value={t.value}>
                            {t.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      size="small"
                      label="Título (opcional)"
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      hidden
                      multiple={docType === 'fotografia'}
                      accept={docType === 'fotografia' ? 'image/*' : 'image/*,.pdf,.doc,.docx'}
                      onChange={handleUpload}
                    />
                    <Button
                      variant="contained"
                      startIcon={uploading ? <CircularProgress size={18} color="inherit" /> : <UploadIcon />}
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      sx={{ bgcolor: EXPEDIENTE_ACCENT, textTransform: 'none', '&:hover': { bgcolor: EXPEDIENTE_ACCENT_HOVER } }}
                    >
                      {uploading
                        ? docType === 'fotografia'
                          ? 'Subiendo fotos…'
                          : 'Subiendo…'
                        : docType === 'fotografia'
                          ? 'Subir fotos'
                          : 'Subir archivo'}
                    </Button>
                  </Box>
                  {docType === 'fotografia' && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                      Puedes seleccionar varias imágenes a la vez.
                    </Typography>
                  )}
                </Box>
                <Divider sx={{ mb: 2 }} />
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Archivo</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>Fecha</TableCell>
                        <TableCell align="right">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(data?.documents || []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                            Sin documentos adicionales
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>{doc.documentTypeLabel || doc.documentType}</TableCell>
                            <TableCell>
                              <Link href={doc.fileUrl} target="_blank" rel="noopener">
                                {doc.fileName}
                              </Link>
                            </TableCell>
                            <TableCell>{formatDate(doc.createdAt)}</TableCell>
                            <TableCell align="right">
                              <IconButton size="small" color="error" onClick={() => handleDeleteDoc(doc.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </DetailSectionCard>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  )
}
