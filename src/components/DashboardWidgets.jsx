import { useState } from 'react'
import { Box, Typography, Paper, CircularProgress, FormGroup, FormControlLabel, Checkbox } from '@mui/material'
import { BarChart as BarChartIcon } from '@mui/icons-material'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

const SummaryCard = ({ title, value, color, gradientStart }) => {
  const gradientEnd = color
  const background = gradientStart
    ? `linear-gradient(135deg, ${gradientStart} 0%, ${gradientEnd} 100%)`
    : null

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        padding: { xs: '12px 14px', sm: '13px 16px', md: '14px 16px' },
        borderRadius: '11px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        minHeight: { xs: '88px', sm: '92px' },
        ...(background ? { background } : { backgroundColor: gradientEnd }),
        boxShadow: '0 3px 12px rgba(0, 0, 0, 0.09)',
        border: 'none',
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="h3"
          sx={{
            color: 'white',
            fontWeight: 700,
            fontSize: { xs: '24px', sm: '26px', md: '28px' },
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            marginBottom: '4px',
          }}
        >
          {value}
        </Typography>
        <Typography
          variant="subtitle2"
          sx={{
            color: 'rgba(255, 255, 255, 0.92)',
            fontSize: { xs: '12px', sm: '12.5px', md: '13px' },
            fontWeight: 500,
            lineHeight: 1.25,
          }}
        >
          {title}
        </Typography>
      </Box>
      <Box
        sx={{
          width: { xs: '38px', sm: '40px', md: '42px' },
          height: { xs: '38px', sm: '40px', md: '42px' },
          borderRadius: '50%',
          backgroundColor: 'rgba(255, 255, 255, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginLeft: { xs: '10px', sm: '11px' },
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.09)',
        }}
      >
        <BarChartIcon sx={{ color: color, fontSize: { xs: '21px', sm: '22px', md: '24px' } }} />
      </Box>
    </Paper>
  )
}

function formatShortDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate + 'T12:00:00')
  const day = d.getDate()
  const month = d.getMonth() + 1
  return `${day}/${month}`
}

function mapSeriesToDateMap(series = []) {
  const m = new Map()
  for (const s of series) {
    const raw = s.date ?? s.saleDate ?? ''
    if (!raw) continue
    const key = raw.slice(0, 10)
    m.set(key, Number(s.totalAmount ?? s.totalamount ?? 0))
  }
  return m
}

/** Una fila por día: ventas, gastos y compras (misma escala de fechas). */
function buildOverviewChartData(dailySales = [], dailyExpenses = [], dailyPurchases = [], startDate, endDate) {
  const ventasMap = mapSeriesToDateMap(dailySales)
  const gastosMap = mapSeriesToDateMap(dailyExpenses)
  const comprasMap = mapSeriesToDateMap(dailyPurchases)
  const result = []
  if (!startDate || !endDate) return result
  const start = new Date(startDate + 'T00:00:00.000Z')
  const end = new Date(endDate + 'T00:00:00.000Z')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10)
    result.push({
      date: dateStr,
      dateLabel: formatShortDate(dateStr),
      ventas: ventasMap.get(dateStr) ?? 0,
      gastos: gastosMap.get(dateStr) ?? 0,
      compras: comprasMap.get(dateStr) ?? 0,
    })
  }
  return result
}

function buildChannelChartData(online = [], advisor = [], startDate, endDate) {
  const om = mapSeriesToDateMap(online)
  const am = mapSeriesToDateMap(advisor)
  const result = []
  if (!startDate || !endDate) return result
  const start = new Date(startDate + 'T00:00:00.000Z')
  const end = new Date(endDate + 'T00:00:00.000Z')
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10)
    result.push({
      date: dateStr,
      dateLabel: formatShortDate(dateStr),
      online: om.get(dateStr) ?? 0,
      advisor: am.get(dateStr) ?? 0,
    })
  }
  return result
}

const fmtTooltipMoney = (value) => `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

const SalesChart = ({
  dailySales = [],
  dailyExpenses = [],
  dailyPurchases = [],
  loading = false,
  startDate,
  endDate,
}) => {
  const chartData = buildOverviewChartData(dailySales, dailyExpenses, dailyPurchases, startDate, endDate)
  const [showVentas, setShowVentas] = useState(true)
  const [showGastos, setShowGastos] = useState(true)
  const [showCompras, setShowCompras] = useState(true)

  return (
    <Paper
      elevation={0}
      sx={{
        padding: { xs: '16px', sm: '20px', md: '24px' },
        borderRadius: '12px',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'transparent',
        border: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          marginBottom: { xs: '12px', sm: '16px', md: '20px' },
          gap: 2,
        }}
      >
        <Box
          className="drag-handle"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            flex: '1 1 auto',
            minWidth: 0,
            cursor: 'grab',
            pr: { lg: 1 },
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              fontSize: { xs: '14px', sm: '15px', md: '16px' },
            }}
          >
            Ventas, gastos y compras
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontSize: '11px', display: { xs: 'none', sm: 'block' } }}
          >
            Evolución diaria en el rango · Activa o desactiva cada serie · Arrastra desde aquí para mover el panel
          </Typography>
        </Box>
        <FormGroup
          row
          sx={{
            flexWrap: 'wrap',
            gap: { xs: 0.5, sm: 1 },
            flexShrink: 0,
            '& .MuiFormControlLabel-root': { mr: { xs: 1, sm: 2 } },
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={showVentas}
                onChange={(e) => setShowVentas(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                sx={{ color: '#2196f3', '&.Mui-checked': { color: '#2196f3' } }}
              />
            }
            label={<Typography variant="body2">Ventas</Typography>}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={showGastos}
                onChange={(e) => setShowGastos(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                sx={{ color: '#ef6c00', '&.Mui-checked': { color: '#ef6c00' } }}
              />
            }
            label={<Typography variant="body2">Gastos</Typography>}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={showCompras}
                onChange={(e) => setShowCompras(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                sx={{ color: '#9c27c0', '&.Mui-checked': { color: '#9c27c0' } }}
              />
            }
            label={<Typography variant="body2">Compras</Typography>}
          />
        </FormGroup>
      </Box>
      <Box
        sx={{
          width: '100%',
          height: { xs: '250px', sm: '280px', md: '320px', lg: '350px' },
          minHeight: '250px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <CircularProgress size={40} />
        ) : chartData.length === 0 ? (
          <Typography color="text.secondary">No hay datos en el rango seleccionado</Typography>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                stroke="#757575"
                tick={{ fill: '#757575', fontSize: 12 }}
                tickFormatter={formatShortDate}
                interval={Math.max(0, Math.floor(chartData.length / 15))}
              />
              <YAxis
                stroke="#757575"
                tick={{ fill: '#757575', fontSize: 12 }}
                tickFormatter={(value) => `$${Number(value).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
                formatter={(value, name) => [fmtTooltipMoney(value), name]}
                labelFormatter={(label) => label}
                cursor={{ stroke: '#e0e0e0', strokeWidth: 1 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: 8 }} />
              {showVentas && (
                <Line
                  type="monotone"
                  dataKey="ventas"
                  name="Ventas"
                  stroke="#2196f3"
                  strokeWidth={2.5}
                  dot={{ fill: '#2196f3', r: 3, strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 5 }}
                  animationDuration={800}
                />
              )}
              {showGastos && (
                <Line
                  type="monotone"
                  dataKey="gastos"
                  name="Gastos"
                  stroke="#ef6c00"
                  strokeWidth={2.5}
                  dot={{ fill: '#ef6c00', r: 3, strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 5 }}
                  animationDuration={800}
                />
              )}
              {showCompras && (
                <Line
                  type="monotone"
                  dataKey="compras"
                  name="Compras"
                  stroke="#9c27c0"
                  strokeWidth={2.5}
                  dot={{ fill: '#9c27c0', r: 3, strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 5 }}
                  animationDuration={800}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  )
}

/** Ventas diarias por canal: online vs asesor. */
const ExpensesChart = ({
  onlineData = [],
  advisorData = [],
  loading = false,
  startDate,
  endDate,
}) => {
  const chartData = buildChannelChartData(onlineData, advisorData, startDate, endDate)
  const [showOnline, setShowOnline] = useState(true)
  const [showAdvisor, setShowAdvisor] = useState(true)

  return (
    <Paper
      elevation={0}
      sx={{
        padding: { xs: '16px', sm: '20px', md: '24px' },
        borderRadius: '12px',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'transparent',
        border: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          marginBottom: { xs: '12px', sm: '16px', md: '20px' },
          gap: 2,
        }}
      >
        <Box
          className="drag-handle"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            flex: '1 1 auto',
            minWidth: 0,
            cursor: 'grab',
            pr: { lg: 1 },
            '&:active': { cursor: 'grabbing' },
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              fontSize: { xs: '14px', sm: '15px', md: '16px' },
            }}
          >
            Ventas por canal
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontSize: '11px', display: { xs: 'none', sm: 'block' } }}
          >
            Online vs asesor por día · Arrastra desde aquí para mover el panel
          </Typography>
        </Box>
        <FormGroup
          row
          sx={{ flexWrap: 'wrap', gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}
        >
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={showOnline}
                onChange={(e) => setShowOnline(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                sx={{ color: '#7b1fa2', '&.Mui-checked': { color: '#7b1fa2' } }}
              />
            }
            label={<Typography variant="body2">Online</Typography>}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={showAdvisor}
                onChange={(e) => setShowAdvisor(e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                sx={{ color: '#4caf50', '&.Mui-checked': { color: '#4caf50' } }}
              />
            }
            label={<Typography variant="body2">Asesor</Typography>}
          />
        </FormGroup>
      </Box>
      <Box
        sx={{
          width: '100%',
          height: { xs: '250px', sm: '280px', md: '320px', lg: '350px' },
          minHeight: '250px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <CircularProgress size={40} />
        ) : chartData.length === 0 ? (
          <Typography color="text.secondary">No hay datos en el rango seleccionado</Typography>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis
                dataKey="date"
                stroke="#757575"
                tick={{ fill: '#757575', fontSize: 12 }}
                tickFormatter={formatShortDate}
                interval={Math.max(0, Math.floor(chartData.length / 15))}
              />
              <YAxis
                stroke="#757575"
                tick={{ fill: '#757575', fontSize: 12 }}
                tickFormatter={(value) => `$${Number(value).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
                formatter={(value, name) => [fmtTooltipMoney(value), name]}
                labelFormatter={(label) => label}
                cursor={{ stroke: '#e0e0e0', strokeWidth: 1 }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: 8 }} />
              {showOnline && (
                <Line
                  type="monotone"
                  dataKey="online"
                  name="Online"
                  stroke="#7b1fa2"
                  strokeWidth={2.5}
                  dot={{ fill: '#7b1fa2', r: 3, strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 5 }}
                  animationDuration={800}
                />
              )}
              {showAdvisor && (
                <Line
                  type="monotone"
                  dataKey="advisor"
                  name="Asesor"
                  stroke="#4caf50"
                  strokeWidth={2.5}
                  dot={{ fill: '#4caf50', r: 3, strokeWidth: 1, stroke: '#fff' }}
                  activeDot={{ r: 5 }}
                  animationDuration={800}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  )
}

const ProductsTable = () => {
  const products = [
    {
      location: 'Nissan Versa',
      colisiones: '3746',
      siniestros: '752',
      conversion: '43%',
      total: '$19,291',
    },
  ]

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        padding: { xs: '16px', sm: '20px', md: '24px' }, 
        borderRadius: '12px',
        width: '100%',
        backgroundColor: 'transparent',
        border: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{ 
          color: '#424242', 
          fontWeight: 600, 
          marginBottom: { xs: '16px', sm: '20px' },
          fontSize: { xs: '14px', sm: '15px', md: '16px' },
        }}
      >
        Top de productos destacados
      </Typography>
      <Box sx={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  color: '#757575',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                LOCATION
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  color: '#757575',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                COLISIONES
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  color: '#757575',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                SINIESTROS
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  color: '#757575',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                CONVERSION
              </th>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px',
                  color: '#757575',
                  fontWeight: 600,
                  fontSize: '14px',
                }}
              >
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr
                key={index}
                style={{
                  borderBottom: '1px solid #f5f5f5',
                  '&:hover': { backgroundColor: '#fafafa' },
                }}
              >
                <td style={{ padding: '12px', color: '#424242' }}>
                  {product.location}
                </td>
                <td style={{ padding: '12px', color: '#424242' }}>
                  {product.colisiones}
                </td>
                <td style={{ padding: '12px', color: '#424242' }}>
                  {product.siniestros}
                </td>
                <td style={{ padding: '12px', color: '#424242' }}>
                  {product.conversion}
                </td>
                <td style={{ padding: '12px', color: '#424242', fontWeight: 600 }}>
                  {product.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>
    </Paper>
  )
}

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  refunded: 'Reembolsado',
}

const STATUS_COLORS = [
  '#2196f3',
  '#7b1fa2',
  '#4caf50',
  '#ff9800',
  '#009688',
  '#f44336',
  '#9e9e9e',
]

const FinanceSummary = ({ data = null, loading = false }) => {
  const statusOrder = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
  const getCount = (obj, key) => {
    if (!obj || typeof obj !== 'object') return 0
    const v = obj[key] ?? obj[key.charAt(0).toUpperCase() + key.slice(1)]
    return Number(v ?? 0)
  }
  const chartData =
    data && typeof data === 'object'
      ? statusOrder
          .filter((key) => getCount(data, key) > 0)
          .map((key) => ({
            name: STATUS_LABELS[key] || key,
            value: getCount(data, key),
            fill: STATUS_COLORS[statusOrder.indexOf(key) % STATUS_COLORS.length],
          }))
      : []

  return (
    <Paper
      elevation={0}
      sx={{
        padding: { xs: '16px', sm: '20px', md: '24px' },
        borderRadius: '12px',
        height: '100%',
        backgroundColor: 'transparent',
        border: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          color: 'text.primary',
          fontWeight: 600,
          marginBottom: { xs: '16px', sm: '20px', md: '24px' },
          fontSize: { xs: '14px', sm: '15px', md: '16px' },
        }}
      >
        Estatus de pedidos
      </Typography>
      <Box
        sx={{
          width: '100%',
          height: { xs: '250px', sm: '280px', md: '300px' },
          minHeight: '250px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <CircularProgress size={40} />
        ) : chartData.length === 0 ? (
          <Typography color="text.secondary">No hay pedidos en el rango seleccionado</Typography>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                animationDuration={1000}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  )
}

// Gráfica de barras: total $ por estatus (usa datos de amountByStatus)
const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
const STATUS_COLORS_BAR = ['#2196f3', '#7b1fa2', '#4caf50', '#ff9800', '#009688', '#f44336', '#9e9e9e']

function formatCurrency(value) {
  return `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const CategoryBarChart = ({ data = null, loading = false }) => {
  const getAmount = (obj, key) => {
    if (!obj || typeof obj !== 'object') return 0
    const v = obj[key] ?? obj[key.charAt(0).toUpperCase() + key.slice(1)]
    return Number(v ?? 0)
  }
  const chartData =
    data && typeof data === 'object'
      ? STATUS_ORDER.map((key) => ({
          name: STATUS_LABELS[key] || key,
          amount: getAmount(data, key),
          color: STATUS_COLORS_BAR[STATUS_ORDER.indexOf(key) % STATUS_COLORS_BAR.length],
        }))
      : []

  return (
    <Paper
      elevation={0}
      sx={{
        padding: { xs: '16px', sm: '20px', md: '24px' },
        borderRadius: '12px',
        width: '100%',
        backgroundColor: 'transparent',
        border: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Typography
        variant="subtitle1"
        sx={{
          color: 'text.primary',
          fontWeight: 600,
          marginBottom: { xs: '16px', sm: '20px', md: '24px' },
          fontSize: { xs: '14px', sm: '15px', md: '16px' },
        }}
      >
        Ventas por estatus
      </Typography>
      <Box
        sx={{
          width: '100%',
          height: { xs: '250px', sm: '280px', md: '320px' },
          minHeight: '250px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {loading ? (
          <CircularProgress size={40} />
        ) : chartData.length === 0 ? (
          <Typography color="text.secondary">No hay datos en el rango seleccionado</Typography>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="#757575"
                tick={{ fill: '#757575', fontSize: 11 }}
                interval={0}
              />
              <YAxis
                stroke="#757575"
                tick={{ fill: '#757575', fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value)}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                }}
                formatter={(value) => {
                  const num = Array.isArray(value) ? value[0] : value
                  return [formatCurrency(num), 'Total']
                }}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} animationDuration={1000}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Box>
    </Paper>
  )
}

// Gráfica de distribución de ventas
const SalesDistributionChart = () => {
  const data = [
    { name: 'Online', value: 45, fill: '#2196f3' },
    { name: 'Tienda', value: 30, fill: '#7b1fa2' },
    { name: 'Promotores', value: 25, fill: '#4caf50' },
  ]

  const COLORS = ['#2196f3', '#7b1fa2', '#4caf50']

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        padding: { xs: '16px', sm: '20px', md: '24px' }, 
        borderRadius: '12px',
        width: '100%',
        backgroundColor: 'transparent',
        border: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Typography 
        variant="subtitle1" 
        sx={{ 
          color: '#424242', 
          fontWeight: 600,
          marginBottom: { xs: '16px', sm: '20px', md: '24px' },
          fontSize: { xs: '14px', sm: '15px', md: '16px' },
        }}
      >
        Distribución de Ventas
      </Typography>
      <Box
        sx={{
          width: '100%',
          height: { xs: '250px', sm: '280px', md: '300px' },
          minHeight: '250px',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}

// Gráfica de tendencia mensual
const MonthlyTrendChart = () => {
  const data = [
    { month: 'Ene', ventas: 12000, meta: 15000 },
    { month: 'Feb', ventas: 19000, meta: 15000 },
    { month: 'Mar', ventas: 15000, meta: 15000 },
    { month: 'Abr', ventas: 18000, meta: 15000 },
    { month: 'May', ventas: 22000, meta: 15000 },
    { month: 'Jun', ventas: 25000, meta: 15000 },
  ]

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        padding: { xs: '16px', sm: '20px', md: '24px' }, 
        borderRadius: '12px',
        width: '100%',
        backgroundColor: 'transparent',
        border: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Typography 
        variant="subtitle1" 
        sx={{ 
          color: '#424242', 
          fontWeight: 600,
          marginBottom: { xs: '16px', sm: '20px', md: '24px' },
          fontSize: { xs: '14px', sm: '15px', md: '16px' },
        }}
      >
        Tendencia Mensual vs Meta
      </Typography>
      <Box
        sx={{
          width: '100%',
          height: { xs: '250px', sm: '280px', md: '320px' },
          minHeight: '250px',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="month"
              stroke="#757575"
              tick={{ fill: '#757575', fontSize: 12 }}
            />
            <YAxis
              stroke="#757575"
              tick={{ fill: '#757575', fontSize: 12 }}
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
              cursor={{ stroke: '#e0e0e0', strokeWidth: 1 }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="ventas"
              stroke="#2196f3"
              strokeWidth={3}
              dot={{ fill: '#2196f3', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
              name="Ventas"
              animationDuration={1000}
            />
            <Line
              type="monotone"
              dataKey="meta"
              stroke="#ff9800"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#ff9800', r: 4 }}
              name="Meta"
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Paper>
  )
}

export {
  SummaryCard,
  SalesChart,
  ExpensesChart,
  ProductsTable,
  FinanceSummary,
  CategoryBarChart,
  SalesDistributionChart,
  MonthlyTrendChart,
}

