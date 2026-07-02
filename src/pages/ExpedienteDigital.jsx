import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Divider,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Folder as FolderIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import { SIDEBAR_WIDTH } from '../config/layout'
import { useAuth } from '../contexts/AuthContext'
import { listExpedientes, getExpedienteFilterOptions } from '../api/expediente'
import { getBrands, getCarModelsByBrand } from '../api/products'
import { useExpedienteFavorites } from '../hooks/useExpedienteFavorites'
import ExpedientePopularCard from '../components/expediente/ExpedientePopularCard'
import ExpedienteDirectoryCard from '../components/expediente/ExpedienteDirectoryCard'
import { folderExpedienteLabel, formatExpedienteDate } from '../utils/expedienteDisplay'
import {
  EXPEDIENTE_ACCENT,
  EXPEDIENTE_ACCENT_HOVER,
  timelineActiveBg,
  timelineHoverBg,
  timelineActiveBorder,
} from '../utils/expedienteTheme'

const FOLDER_LIMIT = 24
const RECENT_LIMIT = 8
const POPULAR_LIMIT = 8
const SEARCH_HINT = 'Marca, modelo, año, siniestro, ORD, COT, proveedor, cliente…'

function buildYearOptions() {
  const current = new Date().getFullYear()
  const years = []
  for (let y = current + 1; y >= 1990; y -= 1) years.push(String(y))
  return years
}

const YEAR_OPTIONS = buildYearOptions()

function monthRangeYmd() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const last = new Date(y, now.getMonth() + 1, 0).getDate()
  return {
    start: `${y}-${m}-01`,
    end: `${y}-${m}-${String(last).padStart(2, '0')}`,
  }
}

function openExpediente(navigate, row) {
  const ref = typeof row === 'string' ? row : row?.expedienteNumber
  if (!ref) return
  navigate(`/expediente-digital/${encodeURIComponent(ref)}`)
}

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const ORD_RX = /^ORD-\d{6}$/i
const COT_RX = /^COT-\d{6}$/i

/** Solo ORD/COT/UUID abren expediente al vuelo; marca/modelo/etc. son búsqueda normal. */
function shouldResolveRef(term) {
  const t = String(term || '').trim()
  if (!t) return false
  if (ORD_RX.test(t) || COT_RX.test(t)) return true
  if (UUID_RX.test(t)) return true
  return false
}

function SectionHeader({ title, action }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: 'text.primary' }}>{title}</Typography>
      {action}
    </Box>
  )
}

function FilterSidebar({
  startDate,
  endDate,
  onStartDate,
  onEndDate,
  brands,
  carModels,
  filterBrandId,
  filterModel,
  filterYear,
  filterProvider,
  onFilterBrandId,
  onFilterModel,
  onFilterYear,
  onFilterProvider,
  providers,
  onApply,
  onClear,
  loading,
}) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        p: 2,
        height: 'fit-content',
      }}
    >
      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary', mb: 1.5 }}>
        Filtros
      </Typography>

      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Periodo
      </Typography>
      <TextField
        label="Desde"
        type="date"
        size="small"
        fullWidth
        value={startDate}
        onChange={(e) => onStartDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 1.5 }}
      />
      <TextField
        label="Hasta"
        type="date"
        size="small"
        fullWidth
        value={endDate}
        onChange={(e) => onEndDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ mb: 2 }}
      />

      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Vehículo
      </Typography>
      <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
        <InputLabel id="expediente-filter-brand-label">Marca</InputLabel>
        <Select
          labelId="expediente-filter-brand-label"
          label="Marca"
          value={filterBrandId}
          onChange={(e) => onFilterBrandId(e.target.value)}
          MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
        >
          <MenuItem value="">Todas</MenuItem>
          {brands.map((b) => (
            <MenuItem key={b.id} value={b.id}>
              {b.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth size="small" sx={{ mb: 1.5 }} disabled={!filterBrandId}>
        <InputLabel id="expediente-filter-model-label">Modelo</InputLabel>
        <Select
          labelId="expediente-filter-model-label"
          label="Modelo"
          value={filterModel}
          onChange={(e) => onFilterModel(e.target.value)}
          MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
        >
          <MenuItem value="">Todos</MenuItem>
          {carModels.map((m) => (
            <MenuItem key={m.id} value={m.model}>
              {m.model}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="expediente-filter-year-label">Año</InputLabel>
        <Select
          labelId="expediente-filter-year-label"
          label="Año"
          value={filterYear}
          onChange={(e) => onFilterYear(e.target.value)}
          MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
        >
          <MenuItem value="">Todos</MenuItem>
          {YEAR_OPTIONS.map((y) => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Proveedor
      </Typography>
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel id="expediente-filter-provider-label">Proveedor</InputLabel>
        <Select
          labelId="expediente-filter-provider-label"
          label="Proveedor"
          value={filterProvider}
          onChange={(e) => onFilterProvider(e.target.value)}
          MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
        >
          <MenuItem value="">Todos</MenuItem>
          {providers.map((p) => (
            <MenuItem key={p} value={p}>{p}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        fullWidth
        variant="contained"
        onClick={onApply}
        disabled={loading}
        sx={{ bgcolor: EXPEDIENTE_ACCENT, textTransform: 'none', fontWeight: 600, mb: 1, '&:hover': { bgcolor: EXPEDIENTE_ACCENT_HOVER } }}
      >
        Aplicar periodo
      </Button>
      <Button
        fullWidth
        variant="outlined"
        onClick={onClear}
        disabled={loading}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          color: EXPEDIENTE_ACCENT,
          borderColor: timelineActiveBorder,
          '&:hover': {
            borderColor: EXPEDIENTE_ACCENT,
            bgcolor: timelineActiveBg,
          },
        }}
      >
        Limpiar filtros
      </Button>
    </Box>
  )
}

function RightSidebar({ favorites, onOpen }) {
  return (
    <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider', p: 2 }}>
      <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: 'text.primary', mb: 1 }}>
        Favoritos
      </Typography>
      {favorites.length === 0 ? (
        <Typography sx={{ fontSize: '0.82rem', color: 'text.secondary', lineHeight: 1.5 }}>
          Marca expedientes con la estrella para verlos aquí.
        </Typography>
      ) : (
        favorites.slice(0, 5).map((fav) => (
          <Box
            key={fav.id}
            onClick={() => onOpen(fav)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              py: 0.75,
              cursor: 'pointer',
              borderRadius: 1,
              '&:hover': { bgcolor: timelineHoverBg },
            }}
          >
            <FolderIcon sx={{ fontSize: 18, color: EXPEDIENTE_ACCENT }} />
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary' }} noWrap>
              {fav.label}
            </Typography>
          </Box>
        ))
      )}
    </Box>
  )
}

export default function ExpedienteDigital() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { favorites, isFavorite, toggleFavorite } = useExpedienteFavorites(user?.id)
  const carouselRef = useRef(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recentLoading, setRecentLoading] = useState(true)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [recentRows, setRecentRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)

  const defaultRange = monthRangeYmd()
  const [startDate, setStartDate] = useState(defaultRange.start)
  const [endDate, setEndDate] = useState(defaultRange.end)
  const [startApplied, setStartApplied] = useState(defaultRange.start)
  const [endApplied, setEndApplied] = useState(defaultRange.end)
  const [search, setSearch] = useState('')
  const [searchApplied, setSearchApplied] = useState('')
  const [catalogBrands, setCatalogBrands] = useState([])
  const [carModels, setCarModels] = useState([])
  const [providers, setProviders] = useState([])
  const [filterBrandId, setFilterBrandId] = useState('')
  const [filterModel, setFilterModel] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterProvider, setFilterProvider] = useState('')

  const selectedBrandName = catalogBrands.find((b) => b.id === filterBrandId)?.name || ''

  useEffect(() => {
    getBrands({ activeOnly: true }).then((r) => {
      if (r.success) {
        const list = (r.data || [])
          .map((b) => ({ id: b.id, name: b.name || b.nombre }))
          .filter((b) => b.id && b.name)
          .sort((a, b) => a.name.localeCompare(b.name, 'es'))
        setCatalogBrands(list)
      }
    })
    getExpedienteFilterOptions().then((r) => {
      if (r.success) setProviders(r.data?.providers || [])
    })
  }, [])

  useEffect(() => {
    if (!filterBrandId) {
      setCarModels([])
      setFilterModel('')
      return
    }
    getCarModelsByBrand(filterBrandId).then((r) => {
      if (r.success) {
        const list = (r.data || []).slice().sort((a, b) => (a.model || '').localeCompare(b.model || '', 'es'))
        setCarModels(list)
      } else {
        setCarModels([])
      }
    })
  }, [filterBrandId])

  const handleFilterBrandId = (brandId) => {
    setFilterBrandId(brandId)
    setFilterModel('')
    setPage(0)
  }

  const handleFilterModel = (model) => {
    setFilterModel(model)
    setPage(0)
  }

  const handleFilterYear = (year) => {
    setFilterYear(year)
    setPage(0)
  }

  const handleFilterProvider = (provider) => {
    setFilterProvider(provider)
    setPage(0)
  }

  const fetchRecent = useCallback(async () => {
    setRecentLoading(true)
    const r = await listExpedientes({ page: 1, limit: RECENT_LIMIT })
    setRecentLoading(false)
    if (r.success) setRecentRows(r.data?.rows || [])
    else setRecentRows([])
  }, [])

  const fetchRows = useCallback(async () => {
    setLoading(true)
    setError('')
    const term = searchApplied.trim()
    const r = await listExpedientes({
      page: page + 1,
      limit: FOLDER_LIMIT,
      startDate: startApplied || undefined,
      endDate: endApplied || undefined,
      search: term || undefined,
      resolveRef: shouldResolveRef(term) ? term : undefined,
      vehicleBrand: selectedBrandName || undefined,
      vehicleModel: filterModel || undefined,
      vehicleYear: filterYear || undefined,
      providerName: filterProvider || undefined,
    })
    setLoading(false)
    if (!r.success) {
      setError(r.error || 'Error al cargar expedientes')
      setRows([])
      setTotal(0)
      return
    }
    const data = r.data || {}
    const list = data.rows || []

    setRows(list)
    setTotal(data.total ?? list.length)

    if (shouldResolveRef(term) && list.length === 1) {
      openExpediente(navigate, list[0])
    }
  }, [
    page,
    startApplied,
    endApplied,
    searchApplied,
    selectedBrandName,
    filterModel,
    filterYear,
    filterProvider,
    navigate,
  ])

  useEffect(() => {
    fetchRecent()
  }, [fetchRecent])

  useEffect(() => {
    fetchRows()
  }, [fetchRows])

  const handleApply = () => {
    setStartApplied(startDate)
    setEndApplied(endDate)
    setSearchApplied(search)
    setPage(0)
  }

  const handleClearFilters = () => {
    const range = monthRangeYmd()
    setStartDate(range.start)
    setEndDate(range.end)
    setStartApplied(range.start)
    setEndApplied(range.end)
    setSearch('')
    setSearchApplied('')
    setFilterBrandId('')
    setFilterModel('')
    setFilterYear('')
    setFilterProvider('')
    setPage(0)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleApply()
  }

  const handleOpen = (row) => openExpediente(navigate, row)

  const scrollCarousel = (dir) => {
    if (!carouselRef.current) return
    carouselRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' })
  }

  const directorySubtitle = (row) => {
    if (row.clientName) return row.clientName
    if (row.orderNumber) return `NV ${row.orderNumber}`
    if (row.quotationNumber) return `COT ${row.quotationNumber}`
    return formatExpedienteDate(row.operationDate ?? row.createdAt)
  }

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

        {/* Barra de búsqueda */}
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: 1,
            borderColor: 'divider',
            px: 2,
            py: 2,
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              mb: 1.5,
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: 'text.primary' }}>
              Expediente digital
            </Typography>
            <Button
              variant="contained"
              onClick={handleApply}
              disabled={loading}
              sx={{
                bgcolor: EXPEDIENTE_ACCENT,
                textTransform: 'none',
                fontWeight: 600,
                px: 2.5,
                '&:hover': { bgcolor: EXPEDIENTE_ACCENT_HOVER },
              }}
            >
              Consultar
            </Button>
          </Box>
          <TextField
            placeholder={SEARCH_HINT}
            size="medium"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary', fontSize: 22 }} />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '&.Mui-focused fieldset': { borderColor: EXPEDIENTE_ACCENT },
              },
              '& .MuiOutlinedInput-input': {
                py: 1.25,
                fontSize: '0.95rem',
              },
            }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: '210px 1fr 200px',
              xl: '230px 1fr 220px',
            },
            gap: { xs: 2, lg: 2, xl: 2.5 },
            alignItems: 'start',
          }}
        >
          {/* Filtros izquierda */}
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <FilterSidebar
              startDate={startDate}
              endDate={endDate}
              onStartDate={setStartDate}
              onEndDate={setEndDate}
              brands={catalogBrands}
              carModels={carModels}
              filterBrandId={filterBrandId}
              filterModel={filterModel}
              filterYear={filterYear}
              filterProvider={filterProvider}
              onFilterBrandId={handleFilterBrandId}
              onFilterModel={handleFilterModel}
              onFilterYear={handleFilterYear}
              onFilterProvider={handleFilterProvider}
              providers={providers}
              onApply={handleApply}
              onClear={handleClearFilters}
              loading={loading}
            />
          </Box>

          {/* Contenido principal */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            {/* Últimos agregados - carousel */}
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider', p: 2 }}>
              <SectionHeader
                title="Últimos agregados"
                action={
                  <Box>
                    <IconButton size="small" onClick={() => scrollCarousel(-1)} sx={{ color: 'text.secondary' }}>
                      <ChevronLeftIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => scrollCarousel(1)} sx={{ color: 'text.secondary' }}>
                      <ChevronRightIcon />
                    </IconButton>
                  </Box>
                }
              />
              {recentLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress size={28} sx={{ color: EXPEDIENTE_ACCENT }} />
                </Box>
              ) : recentRows.length === 0 ? (
                <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                  No hay expedientes agregados recientemente.
                </Typography>
              ) : (
                <Box
                  ref={carouselRef}
                  sx={{
                    display: 'flex',
                    gap: { xs: 1.5, lg: 1.75, xl: 2 },
                    overflowX: 'auto',
                    pb: 0.5,
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                  }}
                >
                  {recentRows.slice(0, POPULAR_LIMIT).map((row) => (
                    <ExpedientePopularCard
                      key={row.id}
                      row={row}
                      label={folderExpedienteLabel(row)}
                      isFavorite={isFavorite(row.id)}
                      onOpen={handleOpen}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* Expedientes del periodo */}
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider', p: 2 }}>
              <SectionHeader
                title="Expedientes del periodo"
                action={
                  <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {total} en total
                  </Typography>
                }
              />
              <Divider sx={{ mb: 2 }} />

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                  <CircularProgress size={32} sx={{ color: EXPEDIENTE_ACCENT }} />
                </Box>
              ) : rows.length === 0 ? (
                <Typography align="center" sx={{ py: 5, color: 'text.secondary', fontSize: '0.85rem' }}>
                  No hay expedientes en este periodo. Ajusta los filtros o busca por ORD / COT.
                </Typography>
              ) : (
                <>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: {
                        xs: 'repeat(auto-fill, minmax(140px, 1fr))',
                        sm: 'repeat(auto-fill, minmax(145px, 1fr))',
                        lg: 'repeat(auto-fill, minmax(155px, 1fr))',
                        xl: 'repeat(auto-fill, minmax(165px, 1fr))',
                      },
                      gap: { xs: 1.5, lg: 1.75, xl: 2 },
                    }}
                  >
                    {rows.map((row) => (
                      <ExpedienteDirectoryCard
                        key={row.id}
                        row={row}
                        label={folderExpedienteLabel(row)}
                        subtitle={directorySubtitle(row)}
                        isFavorite={isFavorite(row.id)}
                        onOpen={handleOpen}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </Box>
                  <TablePagination
                    component="div"
                    count={total}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={FOLDER_LIMIT}
                    rowsPerPageOptions={[FOLDER_LIMIT]}
                    labelRowsPerPage="Carpetas"
                    sx={{ borderTop: 1, borderColor: 'divider', mt: 1 }}
                  />
                </>
              )}
            </Box>
          </Box>

          {/* Panel derecho */}
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <RightSidebar favorites={favorites} onOpen={handleOpen} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
