import { Box, Typography, Paper, Select, MenuItem, FormControl } from '@mui/material'
import {
  TrendingDown,
  TrendingUp,
  BarChart as BarChartIcon,
} from '@mui/icons-material'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  RadialBarChart,
  RadialBar,
} from 'recharts'

const SummaryCard = ({ title, value, change, trend, color }) => {
  const isPositive = trend === 'up'
  return (
    <Paper
      elevation={0}
      sx={{
        padding: { xs: '16px', sm: '20px', md: '24px' },
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        minHeight: { xs: '140px', sm: 'auto' },
        backgroundColor: 'transparent',
        border: '1px solid rgba(0, 0, 0, 0.08)',
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{ 
            color: '#757575', 
            marginBottom: '8px', 
            fontSize: { xs: '12px', sm: '13px', md: '14px' },
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="h4"
          sx={{ 
            color: '#424242', 
            fontWeight: 'bold', 
            marginBottom: '8px',
            fontSize: { xs: '20px', sm: '24px', md: '28px' },
          }}
        >
          {value}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {isPositive ? (
            <TrendingUp sx={{ 
              color: '#4caf50', 
              fontSize: { xs: '16px', sm: '18px' },
            }} />
          ) : (
            <TrendingDown sx={{ 
              color: '#f44336', 
              fontSize: { xs: '16px', sm: '18px' },
            }} />
          )}
          <Typography
            variant="body2"
            sx={{
              color: isPositive ? '#4caf50' : '#f44336',
              fontSize: { xs: '12px', sm: '13px', md: '14px' },
            }}
          >
            {change}
          </Typography>
        </Box>
      </Box>
      <Box
        sx={{
          width: { xs: '50px', sm: '55px', md: '60px' },
          height: { xs: '50px', sm: '55px', md: '60px' },
          borderRadius: '8px',
          backgroundColor: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginLeft: { xs: '12px', sm: '16px' },
        }}
      >
        <BarChartIcon sx={{ 
          color: color, 
          fontSize: { xs: '24px', sm: '28px', md: '32px' },
        }} />
      </Box>
    </Paper>
  )
}

const SalesChart = () => {
  const data = [
    { month: 'Jan', '2023': 15, '2024': 20 },
    { month: 'Feb', '2023': 10, '2024': 7 },
    { month: 'Mar', '2023': 15, '2024': 16 },
    { month: 'Apr', '2023': 14, '2024': 12 },
    { month: 'May', '2023': 17, '2024': 16 },
    { month: 'Jun', '2023': 21, '2024': 8 },
  ]

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
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          marginBottom: { xs: '16px', sm: '20px', md: '24px' },
          gap: { xs: 2, sm: 0 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: '#424242', 
              fontWeight: 600,
              fontSize: { xs: '14px', sm: '15px', md: '16px' },
            }}
          >
            Total de ventas
          </Typography>
          <Box
            sx={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              backgroundColor: '#757575',
              display: { xs: 'none', sm: 'block' },
            }}
          />
          <Typography
            variant="caption"
            sx={{
              color: '#757575',
              fontSize: '11px',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Arrastra para mover
          </Typography>
        </Box>
        <FormControl 
          size="small" 
          sx={{ 
            minWidth: { xs: '100%', sm: 120 },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Select defaultValue="6meses" sx={{ fontSize: '14px' }}>
            <MenuItem value="6meses">6 Meses</MenuItem>
            <MenuItem value="12meses">12 Meses</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box
        sx={{
          width: '100%',
          height: { xs: '250px', sm: '280px', md: '320px', lg: '350px' },
          minHeight: '250px',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="color2023" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7b1fa2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7b1fa2" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="color2024" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2196f3" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2196f3" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="month"
              stroke="#757575"
              tick={{ 
                fill: '#757575', 
                fontSize: 12,
              }}
              interval={0}
            />
            <YAxis
              stroke="#757575"
              tick={{ 
                fill: '#757575', 
                fontSize: 12,
              }}
              tickFormatter={(value) => `$${value}k`}
              width={50}
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
              cursor={{ stroke: '#e0e0e0', strokeWidth: 1 }}
            />
            <Legend 
              wrapperStyle={{ 
                fontSize: '14px',
                paddingTop: '20px',
              }}
              iconType="circle"
            />
            <Area
              type="monotone"
              dataKey="2023"
              stroke="#7b1fa2"
              fillOpacity={1}
              fill="url(#color2023)"
              strokeWidth={2.5}
              dot={{ fill: '#7b1fa2', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
              animationDuration={1000}
            />
            <Area
              type="monotone"
              dataKey="2024"
              stroke="#2196f3"
              fillOpacity={1}
              fill="url(#color2024)"
              strokeWidth={2.5}
              dot={{ fill: '#2196f3', r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 7, strokeWidth: 2, stroke: '#fff' }}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
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

const FinanceSummary = () => {
  const data = [
    { name: 'Usado', value: 65, fill: '#7b1fa2' },
    { name: 'Disponible', value: 35, fill: '#e0e0e0' },
  ]

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
          color: '#424242', 
          fontWeight: 600, 
          marginBottom: { xs: '16px', sm: '20px' },
          fontSize: { xs: '14px', sm: '15px', md: '16px' },
        }}
      >
        Resumen finanzas
      </Typography>
      <Box>
        <Typography
          variant="body2"
          sx={{ 
            color: '#757575', 
            marginBottom: '8px', 
            fontSize: { xs: '12px', sm: '13px', md: '14px' },
          }}
        >
          Presupuesto total
        </Typography>
        <Typography
          variant="h4"
          sx={{ 
            color: '#4caf50', 
            fontWeight: 'bold', 
            marginBottom: { xs: '16px', sm: '20px', md: '24px' },
            fontSize: { xs: '20px', sm: '24px', md: '28px' },
          }}
        >
          $50,000
        </Typography>
        <Box
          sx={{
            width: '100%',
            height: { xs: '180px', sm: '200px', md: '220px' },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                animationDuration={1000}
              >
                {data.map((entry, index) => (
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
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#7b1fa2',
              }}
            />
            <Typography variant="body2" sx={{ color: '#757575', fontSize: '12px' }}>
              Usado: 65%
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#e0e0e0',
              }}
            />
            <Typography variant="body2" sx={{ color: '#757575', fontSize: '12px' }}>
              Disponible: 35%
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  )
}

// Nueva gráfica de barras para categorías
const CategoryBarChart = () => {
  const data = [
    { name: 'Motor', ventas: 4500, color: '#2196f3' },
    { name: 'Frenos', ventas: 3200, color: '#7b1fa2' },
    { name: 'Suspensión', ventas: 2800, color: '#4caf50' },
    { name: 'Transmisión', ventas: 2100, color: '#ff9800' },
    { name: 'Eléctrico', ventas: 1800, color: '#f44336' },
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
        Ventas por Categoría
      </Typography>
      <Box
        sx={{
          width: '100%',
          height: { xs: '250px', sm: '280px', md: '320px' },
          minHeight: '250px',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#757575"
              tick={{ fill: '#757575', fontSize: 12 }}
            />
            <YAxis
              stroke="#757575"
              tick={{ fill: '#757575', fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              }}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
            />
            <Bar
              dataKey="ventas"
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
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
  ProductsTable, 
  FinanceSummary,
  CategoryBarChart,
  SalesDistributionChart,
  MonthlyTrendChart,
}

