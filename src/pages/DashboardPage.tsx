import { useState } from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
} from '@mui/material'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { LineChart } from '@mui/x-charts/LineChart'
import { PieChart } from '@mui/x-charts/PieChart'
import { BarChart } from '@mui/x-charts/BarChart'

function DashboardPage() {
  const [chartOrder, setChartOrder] = useState(['sales', 'brands', 'categories', 'topProducts'])
  const [kpiOrder, setKpiOrder] = useState(['autopartes', 'internet', 'promotores', 'total', 'devoluciones'])
  const [draggedChart, setDraggedChart] = useState<string | null>(null)
  const [draggedKpi, setDraggedKpi] = useState<string | null>(null)

  const handleDragStart = (chartId: string) => {
    setDraggedChart(chartId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetChartId: string) => {
    if (!draggedChart || draggedChart === targetChartId) return

    const newOrder = [...chartOrder]
    const draggedIndex = newOrder.indexOf(draggedChart)
    const targetIndex = newOrder.indexOf(targetChartId)

    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedChart)

    setChartOrder(newOrder)
    setDraggedChart(null)
  }

  const handleDragEnd = () => {
    setDraggedChart(null)
    setDraggedKpi(null)
  }

  const handleKpiDragStart = (kpiId: string) => {
    setDraggedKpi(kpiId)
  }

  const handleKpiDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleKpiDrop = (targetKpiId: string) => {
    if (!draggedKpi || draggedKpi === targetKpiId) return

    const newOrder = [...kpiOrder]
    const draggedIndex = newOrder.indexOf(draggedKpi)
    const targetIndex = newOrder.indexOf(targetKpiId)

    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedKpi)

    setKpiOrder(newOrder)
    setDraggedKpi(null)
  }

  // Datos para la gráfica de pastel de marcas
  const brandData = [
    { id: 0, value: 35, label: 'Brandix', color: '#E8A5A5' },
    { id: 1, value: 25, label: 'Premium Parts', color: '#F5D5A5' },
    { id: 2, value: 20, label: 'Mobil', color: '#B5E5B5' },
    { id: 3, value: 12, label: 'K&N', color: '#A5C5E5' },
    { id: 4, value: 8, label: 'Otros', color: '#D5D5D5' },
  ]

  // Datos para ventas por categoría
  const categoryData = [
    { category: 'Frenos', ventas: 12500 },
    { category: 'Motor', ventas: 9800 },
    { category: 'Llantas y Ruedas', ventas: 15200 },
    { category: 'Lubricantes', ventas: 6800 },
    { category: 'Filtros', ventas: 5400 },
    { category: 'Baterías', ventas: 7200 },
    { category: 'Accesorios', ventas: 4100 },
    { category: 'Transmisión', ventas: 8900 },
  ]

  // Datos para productos más vendidos
  const topProductsData = [
    { product: 'Kit de Frenos Delanteros', ventas: 245 },
    { product: 'Aceite Motor 5W-30', ventas: 189 },
    { product: 'Llanta Aleación 19"', ventas: 156 },
    { product: 'Batería 12V 60Ah', ventas: 134 },
    { product: 'Filtro de Aire Alto Flujo', ventas: 98 },
  ]

  const renderChart = (chartId: string) => {
    if (chartId === 'sales') {
      return (
        <Card
          draggable
          onDragStart={() => handleDragStart('sales')}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('sales')}
          onDragEnd={handleDragEnd}
          sx={{
            height: '100%',
            width: '100%',
            maxWidth: '100%',
            cursor: 'move',
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DragIndicatorIcon sx={{ color: '#AAAAAA', fontSize: 20, cursor: 'grab' }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#333333' }}>
                  Total de ventas
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 0.5,
                  border: '1px solid #E0E0E0',
                  borderRadius: 1,
                  cursor: 'pointer',
                }}
              >
                <Typography variant="body2" sx={{ color: '#555555' }}>
                  6 Meses
                </Typography>
              </Box>
            </Box>
            <Box sx={{ height: 300, width: '100%', overflow: 'hidden' }}>
              <LineChart
                width={undefined}
                height={300}
                series={[
                  {
                    data: [15, 10, 15, 14, 15, 20],
                    label: '2023',
                    area: true,
                    color: '#F5D5A5',
                  },
                  {
                    data: [20, 10, 15, 12, 15, 5],
                    label: '2024',
                    area: true,
                    color: '#E8A5A5',
                  },
                ]}
                xAxis={[
                  {
                    data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    scaleType: 'point',
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    max: 25,
                    valueFormatter: (value) => `$${value}k`,
                  },
                ]}
                sx={{ width: '100%', maxWidth: '100%' }}
              />
            </Box>
          </CardContent>
        </Card>
      )
    }

    if (chartId === 'brands') {
      return (
        <Card
          draggable
          onDragStart={() => handleDragStart('brands')}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('brands')}
          onDragEnd={handleDragEnd}
          sx={{
            height: '100%',
            width: '100%',
            maxWidth: '100%',
            cursor: 'move',
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 3,
              }}
            >
              <DragIndicatorIcon sx={{ color: '#AAAAAA', fontSize: 20, cursor: 'grab' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#333333' }}>
                Marcas más vendidas
              </Typography>
            </Box>
            <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
              <PieChart
                series={[
                  {
                    data: brandData,
                    innerRadius: 60,
                    outerRadius: 120,
                    paddingAngle: 2,
                    cornerRadius: 5,
                  },
                ]}
                width={600}
                height={300}
                slotProps={{
                  legend: {
                    direction: 'column',
                    position: { vertical: 'middle', horizontal: 'right' },
                    padding: 0,
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      )
    }

    if (chartId === 'categories') {
      return (
        <Card
          draggable
          onDragStart={() => handleDragStart('categories')}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('categories')}
          onDragEnd={handleDragEnd}
          sx={{
            height: '100%',
            width: '100%',
            maxWidth: '100%',
            cursor: 'move',
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 3,
              }}
            >
              <DragIndicatorIcon sx={{ color: '#AAAAAA', fontSize: 20, cursor: 'grab' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#333333' }}>
                Ventas por Categoría
              </Typography>
            </Box>
            <Box sx={{ height: 300, width: '100%', overflow: 'hidden' }}>
              <BarChart
                xAxis={[
                  {
                    id: 'barCategories',
                    data: categoryData.map((item) => item.category),
                    scaleType: 'band',
                  },
                ]}
                series={[
                  {
                    data: categoryData.map((item) => item.ventas),
                    color: '#E8A5A5',
                  },
                ]}
                width={undefined}
                height={300}
                yAxis={[
                  {
                    scaleType: 'linear',
                    valueFormatter: (value) => `$${(value / 1000).toFixed(1)}k`,
                  },
                ]}
                sx={{ width: '100%', maxWidth: '100%' }}
              />
            </Box>
          </CardContent>
        </Card>
      )
    }

    if (chartId === 'topProducts') {
      return (
        <Card
          draggable
          onDragStart={() => handleDragStart('topProducts')}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop('topProducts')}
          onDragEnd={handleDragEnd}
          sx={{
            height: '100%',
            width: '100%',
            maxWidth: '100%',
            cursor: 'move',
            '&:hover': {
              boxShadow: 4,
            },
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 3,
              }}
            >
              <DragIndicatorIcon sx={{ color: '#AAAAAA', fontSize: 20, cursor: 'grab' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#333333' }}>
                Productos Más Vendidos
              </Typography>
            </Box>
            <Box sx={{ height: 300, width: '100%', overflow: 'hidden' }}>
              <BarChart
                layout="horizontal"
                yAxis={[
                  {
                    id: 'barProducts',
                    data: topProductsData.map((item) => item.product),
                    scaleType: 'band',
                  },
                ]}
                xAxis={[
                  {
                    scaleType: 'linear',
                    valueFormatter: (value) => `${value} unidades`,
                  },
                ]}
                series={[
                  {
                    data: topProductsData.map((item) => item.ventas),
                    color: '#F5D5A5',
                  },
                ]}
                width={undefined}
                height={300}
                sx={{ width: '100%', maxWidth: '100%' }}
              />
            </Box>
          </CardContent>
        </Card>
      )
    }

    return null
  }

  const renderKpi = (kpiId: string) => {
    const kpiData: Record<string, any> = {
      autopartes: {
        title: 'Autoparte vendidas',
        value: '1.1K',
        trend: 'down',
        percentage: '13.8%',
        color: '#A5C5E5',
        data: [20, 30, 25, 35, 30, 40, 35],
      },
      internet: {
        title: 'Ventas por internet',
        value: '2453',
        trend: 'up',
        percentage: '13.8%',
        color: '#F5D5A5',
        data: [15, 25, 20, 30, 25, 35, 30],
      },
      promotores: {
        title: 'Ventas por promotores',
        value: '$39K',
        trend: 'down',
        percentage: '13.8%',
        color: '#B5E5B5',
        data: [25, 35, 30, 40, 35, 45, 40],
      },
      total: {
        title: 'Ventas Total',
        value: '$125K',
        trend: 'up',
        percentage: '8.2%',
        color: '#E8A5A5',
        data: [100, 110, 105, 115, 120, 125, 130],
      },
      devoluciones: {
        title: 'Total de devoluciones',
        value: '$3.2K',
        trend: 'down',
        percentage: '5.1%',
        color: '#FFD5A5',
        data: [4, 3.5, 3.8, 3.2, 3.5, 3.0, 3.2],
      },
    }

    const kpi = kpiData[kpiId]
    if (!kpi) return null

    return (
      <Grid item xs={6} sm={4} md={2} key={kpiId}>
        <Card
          draggable
          onDragStart={() => handleKpiDragStart(kpiId)}
          onDragOver={handleKpiDragOver}
          onDrop={() => handleKpiDrop(kpiId)}
          onDragEnd={handleDragEnd}
          sx={{
            cursor: 'move',
            '&:hover': {
              boxShadow: 2,
            },
          }}
        >
          <CardContent sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
              <Typography
                variant="body1"
                sx={{ color: '#555555', fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.2 }}
              >
                {kpi.title}
              </Typography>
              <DragIndicatorIcon sx={{ color: '#AAAAAA', fontSize: 14, cursor: 'grab' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: '#333333', fontSize: '1.25rem' }}>
              {kpi.value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.75 }}>
              {kpi.trend === 'up' ? (
                <TrendingUpIcon sx={{ color: '#8BC34A', fontSize: 14 }} />
              ) : (
                <TrendingDownIcon sx={{ color: '#E74C3C', fontSize: 14 }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  color: kpi.trend === 'up' ? '#8BC34A' : '#E74C3C',
                  fontSize: '0.7rem',
                }}
              >
                {kpi.trend === 'up' ? '↑' : '↓'} {kpi.percentage}
              </Typography>
            </Box>
            <Box sx={{ height: 24 }}>
              <LineChart
                width={200}
                height={24}
                series={[
                  {
                    data: kpi.data,
                    area: false,
                    showMark: false,
                    color: kpi.color,
                  },
                ]}
                xAxis={[{ data: [1, 2, 3, 4, 5, 6, 7] }]}
                sx={{
                  '& .MuiLineElement-root': {
                    strokeWidth: 1.5,
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    )
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: '#333333' }}>
        Dashboard
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpiOrder.map((kpiId) => renderKpi(kpiId))}
      </Grid>

      {/* Charts Section - Draggable */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr', md: 'repeat(2, 1fr)' },
          gap: 3,
          width: '100%',
        }}
      >
        {chartOrder.map((chartId) => (
          <Box key={chartId} sx={{ width: '100%' }}>
            {renderChart(chartId)}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

export default DashboardPage
