import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert,
  Button,
  Divider,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import {
  Search as SearchIcon,
  Folder as FolderIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import PageTitle from '../components/PageTitle'
import { SIDEBAR_WIDTH } from '../config/layout'
import { useAuth } from '../contexts/AuthContext'
import { listExpedientes, getExpedienteFilterOptions } from '../api/expediente'
import { getBrands, getCarModelsByBrand } from '../api/products'
import { useExpedienteFavorites } from '../hooks/useExpedienteFavorites'
import ExpedienteDirectoryCard from '../components/expediente/ExpedienteDirectoryCard'
import ExpedienteDirectoryTable from '../components/expediente/ExpedienteDirectoryTable'
import ExpedienteCollapsiblePanel from '../components/expediente/ExpedienteCollapsiblePanel'
import { folderExpedienteLabel } from '../utils/expedienteDisplay'
import {
  EXPEDIENTE_ACCENT,
  EXPEDIENTE_ACCENT_HOVER,
  timelineActiveBg,
  timelineHoverBg,
  timelineActiveBorder,
} from '../utils/expedienteTheme'
import { defaultPeriodRangeYmd } from '../utils/datePeriod'

const FOLDER_LIMIT = 24
const SEARCH_HINT = 'Marca, modelo, año, siniestro, ORD, COT, proveedor, cliente…'

function buildYearOptions() {
  const current = new Date().getFullYear()
  const years = []
  for (let y = current + 1; y >= 1990; y -= 1) years.push(String(y))
  return years
}

const YEAR_OPTIONS = buildYearOptions()

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

function SearchBar({ search, onSearch, onApply, onKeyDown, loading }) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1.25, sm: 1.5 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'stretch', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 1,
        }}
      >
        <TextField
          placeholder={SEARCH_HINT}
          size="small"
          fullWidth
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          onKeyDown={onKeyDown}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            flex: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: 1.5,
              fontSize: '0.88rem',
              '&.Mui-focused fieldset': { borderColor: EXPEDIENTE_ACCENT },
            },
            '& .MuiOutlinedInput-input': {
              py: 1,
            },
          }}
        />
        <Button
          variant="contained"
          size="small"
          onClick={onApply}
          disabled={loading}
          sx={{
            bgcolor: EXPEDIENTE_ACCENT,
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
            minWidth: { xs: '100%', sm: 108 },
            whiteSpace: 'nowrap',
            '&:hover': { bgcolor: EXPEDIENTE_ACCENT_HOVER },
          }}
        >
          Consultar
        </Button>
      </Box>
    </Box>
  )
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
  const sectionLabelSx = {
    fontSize: '0.62rem',
    fontWeight: 600,
    color: 'text.secondary',
    mb: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  }
  const compactFieldSx = {
    '& .MuiInputBase-root': { fontSize: '0.75rem', minHeight: 34 },
    '& .MuiInputLabel-root': { fontSize: '0.75rem' },
    '& .MuiSelect-select': { py: 0.65 },
    '& .MuiInputBase-input': { py: 0.65 },
  }
  const compactBtnSx = {
    py: 0.55,
    minHeight: 32,
    fontSize: '0.75rem',
    textTransform: 'none',
    fontWeight: 600,
  }

  return (
    <>
      <Typography sx={sectionLabelSx}>Periodo</Typography>
      <TextField
        label="Desde"
        type="date"
        size="small"
        fullWidth
        value={startDate}
        onChange={(e) => onStartDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ ...compactFieldSx, mb: 0.75 }}
      />
      <TextField
        label="Hasta"
        type="date"
        size="small"
        fullWidth
        value={endDate}
        onChange={(e) => onEndDate(e.target.value)}
        InputLabelProps={{ shrink: true }}
        sx={{ ...compactFieldSx, mb: 1.1 }}
      />

      <Typography sx={sectionLabelSx}>Vehículo</Typography>
      <FormControl fullWidth size="small" sx={{ ...compactFieldSx, mb: 0.75 }}>
        <InputLabel id="expediente-filter-brand-label">Marca</InputLabel>
        <Select
          labelId="expediente-filter-brand-label"
          label="Marca"
          value={filterBrandId}
          onChange={(e) => onFilterBrandId(e.target.value)}
          MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}
        >
          <MenuItem value="" sx={{ fontSize: '0.78rem', py: 0.5 }}>Todas</MenuItem>
          {brands.map((b) => (
            <MenuItem key={b.id} value={b.id} sx={{ fontSize: '0.78rem', py: 0.5 }}>
              {b.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth size="small" sx={{ ...compactFieldSx, mb: 0.75 }} disabled={!filterBrandId}>
        <InputLabel id="expediente-filter-model-label">Modelo</InputLabel>
        <Select
          labelId="expediente-filter-model-label"
          label="Modelo"
          value={filterModel}
          onChange={(e) => onFilterModel(e.target.value)}
          MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}
        >
          <MenuItem value="" sx={{ fontSize: '0.78rem', py: 0.5 }}>Todos</MenuItem>
          {carModels.map((m) => (
            <MenuItem key={m.id} value={m.model} sx={{ fontSize: '0.78rem', py: 0.5 }}>
              {m.model}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl fullWidth size="small" sx={{ ...compactFieldSx, mb: 1.1 }}>
        <InputLabel id="expediente-filter-year-label">Año</InputLabel>
        <Select
          labelId="expediente-filter-year-label"
          label="Año"
          value={filterYear}
          onChange={(e) => onFilterYear(e.target.value)}
          MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}
        >
          <MenuItem value="" sx={{ fontSize: '0.78rem', py: 0.5 }}>Todos</MenuItem>
          {YEAR_OPTIONS.map((y) => (
            <MenuItem key={y} value={y} sx={{ fontSize: '0.78rem', py: 0.5 }}>{y}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography sx={sectionLabelSx}>Proveedor</Typography>
      <FormControl fullWidth size="small" sx={{ ...compactFieldSx, mb: 1.1 }}>
        <InputLabel id="expediente-filter-provider-label">Proveedor</InputLabel>
        <Select
          labelId="expediente-filter-provider-label"
          label="Proveedor"
          value={filterProvider}
          onChange={(e) => onFilterProvider(e.target.value)}
          MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}
        >
          <MenuItem value="" sx={{ fontSize: '0.78rem', py: 0.5 }}>Todos</MenuItem>
          {providers.map((p) => (
            <MenuItem key={p} value={p} sx={{ fontSize: '0.78rem', py: 0.5 }}>{p}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        fullWidth
        variant="contained"
        size="small"
        onClick={onApply}
        disabled={loading}
        sx={{
          ...compactBtnSx,
          bgcolor: EXPEDIENTE_ACCENT,
          mb: 0.65,
          '&:hover': { bgcolor: EXPEDIENTE_ACCENT_HOVER },
        }}
      >
        Aplicar periodo
      </Button>
      <Button
        fullWidth
        variant="outlined"
        size="small"
        onClick={onClear}
        disabled={loading}
        sx={{
          ...compactBtnSx,
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
    </>
  )
}

function FavoritesPanel({ favorites, onOpen, expanded, onToggle }) {
  return (
    <ExpedienteCollapsiblePanel
      title="Favoritos"
      expanded={expanded}
      onToggle={onToggle}
      count={favorites.length || undefined}
      mb={0}
    >
      {favorites.length === 0 ? (
        <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary', lineHeight: 1.45 }}>
          Marca expedientes con la estrella para verlos aquí.
        </Typography>
      ) : (
        favorites.slice(0, 8).map((fav) => (
          <Box
            key={fav.id}
            onClick={() => onOpen(fav)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              py: 0.65,
              cursor: 'pointer',
              borderRadius: 1,
              '&:hover': { bgcolor: timelineHoverBg },
            }}
          >
            <FolderIcon sx={{ fontSize: 16, color: EXPEDIENTE_ACCENT, flexShrink: 0 }} />
            <Typography
              sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'text.primary', lineHeight: 1.25 }}
              noWrap
              title={fav.label}
            >
              {fav.label}
            </Typography>
          </Box>
        ))
      )}
    </ExpedienteCollapsiblePanel>
  )
}

export default function ExpedienteDigital() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { favorites, isFavorite, toggleFavorite } = useExpedienteFavorites(user?.id)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)

  const defaultRange = defaultPeriodRangeYmd()
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
  const [periodViewMode, setPeriodViewMode] = useState('cards')
  const [filtersExpanded, setFiltersExpanded] = useState(true)
  const [favoritesExpanded, setFavoritesExpanded] = useState(true)

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
    fetchRows()
  }, [fetchRows])

  const handleApply = () => {
    setStartApplied(startDate)
    setEndApplied(endDate)
    setSearchApplied(search)
    setPage(0)
  }

  const handleClearFilters = () => {
    const range = defaultPeriodRangeYmd()
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

  const directorySubtitle = (row) => {
    if (row.clientName) return row.clientName
    if (row.orderNumber) return `NV ${row.orderNumber}`
    if (row.quotationNumber) return `COT ${row.quotationNumber}`
    return '—'
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

        <PageTitle>Expediente digital</PageTitle>

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
              lg: '172px 1fr 180px',
              xl: '182px 1fr 190px',
            },
            gap: { xs: 2, lg: 2, xl: 2.5 },
            alignItems: 'start',
          }}
        >
          {/* Filtros izquierda */}
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <ExpedienteCollapsiblePanel
              title="Filtros"
              expanded={filtersExpanded}
              onToggle={() => setFiltersExpanded((v) => !v)}
              mb={0}
            >
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
            </ExpedienteCollapsiblePanel>
          </Box>

          {/* Contenido principal */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <SearchBar
              search={search}
              onSearch={setSearch}
              onApply={handleApply}
              onKeyDown={handleKeyDown}
              loading={loading}
            />

            {/* Paneles móvil: filtros y favoritos */}
            <Box sx={{ display: { xs: 'flex', lg: 'none' }, flexDirection: 'column', gap: 0 }}>
              <ExpedienteCollapsiblePanel
                title="Filtros"
                expanded={filtersExpanded}
                onToggle={() => setFiltersExpanded((v) => !v)}
              >
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
              </ExpedienteCollapsiblePanel>
              <FavoritesPanel
                favorites={favorites}
                onOpen={handleOpen}
                expanded={favoritesExpanded}
                onToggle={() => setFavoritesExpanded((v) => !v)}
              />
            </Box>

            {/* Expedientes del periodo */}
            <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider', p: 2 }}>
              <SectionHeader
                title="Expedientes del periodo"
                action={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ToggleButtonGroup
                      size="small"
                      value={periodViewMode}
                      exclusive
                      onChange={(_, v) => {
                        if (v != null) setPeriodViewMode(v)
                      }}
                      aria-label="Vista de expedientes"
                      sx={{
                        '& .MuiToggleButton-root': {
                          py: 0.4,
                          px: 1,
                          textTransform: 'none',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderColor: 'divider',
                          color: 'text.secondary',
                          '&.Mui-selected': {
                            bgcolor: EXPEDIENTE_ACCENT,
                            color: '#fff',
                            borderColor: EXPEDIENTE_ACCENT,
                            '&:hover': { bgcolor: EXPEDIENTE_ACCENT_HOVER },
                          },
                        },
                      }}
                    >
                      <ToggleButton value="cards" aria-label="Vista carpetas">
                        <ViewModuleIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        Carpetas
                      </ToggleButton>
                      <ToggleButton value="table" aria-label="Vista tabla">
                        <ViewListIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        Tabla
                      </ToggleButton>
                    </ToggleButtonGroup>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                      {total} en total
                    </Typography>
                  </Box>
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
                  {periodViewMode === 'table' ? (
                    <ExpedienteDirectoryTable
                      rows={rows}
                      isFavorite={isFavorite}
                      onOpen={handleOpen}
                      onToggleFavorite={toggleFavorite}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: 'repeat(auto-fill, minmax(112px, 1fr))',
                          sm: 'repeat(auto-fill, minmax(118px, 1fr))',
                          lg: 'repeat(auto-fill, minmax(124px, 1fr))',
                          xl: 'repeat(auto-fill, minmax(130px, 1fr))',
                        },
                        gap: { xs: 1.25, lg: 1.4, xl: 1.5 },
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
                  )}
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

          {/* Panel derecho — solo favoritos */}
          <Box sx={{ display: { xs: 'none', lg: 'block' } }}>
            <FavoritesPanel
              favorites={favorites}
              onOpen={handleOpen}
              expanded={favoritesExpanded}
              onToggle={() => setFavoritesExpanded((v) => !v)}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
