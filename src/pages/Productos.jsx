import { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  Paper,
  TextField,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Add as AddIcon,
  Upload as UploadIcon,
} from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'
import ModalHeader from '../components/ModalHeader'

const Productos = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [producto, setProducto] = useState({
    nombre: '',
    codigo: '',
    marca: '',
    categoria: '',
    precio: '',
    stock: '',
    descripcion: '',
  })

  const handleOpenDialog = () => {
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setProducto({
      nombre: '',
      codigo: '',
      marca: '',
      categoria: '',
      precio: '',
      stock: '',
      descripcion: '',
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProducto((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = () => {
    // Aquí iría la lógica para guardar el producto
    console.log('Producto a guardar:', producto)
    handleCloseDialog()
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Aquí iría la lógica para procesar el archivo (CSV, Excel, etc.)
      console.log('Archivo seleccionado:', file.name)
      alert(`Archivo ${file.name} seleccionado. La funcionalidad de carga masiva se implementará aquí.`)
    }
  }

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const handleSidebarClose = () => {
    setSidebarOpen(false)
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      <Box
        sx={{
          marginLeft: { xs: 0, md: '260px' },
          marginTop: { xs: 0, md: '70px' },
          width: { xs: '100%', md: 'calc(100% - 260px)' },
          padding: { xs: '16px', sm: '24px', md: '32px' },
          backgroundColor: '#fafafa',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={handleMenuClick} />
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: { xs: '24px', sm: '28px', md: '32px' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: '#424242',
              fontWeight: 'bold',
              fontSize: { xs: '24px', sm: '28px', md: '32px' },
            }}
          >
            Productos
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              component="label"
              sx={{
                textTransform: 'none',
                borderColor: '#7b1fa2',
                color: '#7b1fa2',
                '&:hover': {
                  borderColor: '#6a1b9a',
                  backgroundColor: 'rgba(123, 31, 162, 0.04)',
                },
              }}
            >
              Cargar Archivo
              <input
                type="file"
                hidden
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
              />
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{
                textTransform: 'none',
                backgroundColor: '#7b1fa2',
                '&:hover': {
                  backgroundColor: '#6a1b9a',
                },
              }}
            >
              Nuevo Producto
            </Button>
          </Box>
        </Box>

        <Paper elevation={2} sx={{ padding: { xs: '16px', sm: '24px' }, borderRadius: '12px' }}>
          <Typography
            variant="h6"
            sx={{
              color: '#424242',
              fontWeight: 'bold',
              marginBottom: '20px',
              fontSize: { xs: '18px', sm: '20px', md: '24px' },
            }}
          >
            Lista de Productos
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>
                    Código
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>
                    Nombre
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>
                    Marca
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>
                    Categoría
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>
                    Precio
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#757575' }}>
                    Stock
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ padding: '40px' }}>
                    <Typography variant="body2" sx={{ color: '#757575' }}>
                      No hay productos registrados. Agrega un nuevo producto o carga un archivo.
                    </Typography>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Dialog para agregar nuevo producto */}
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: '12px', overflow: 'hidden' } }}
        >
          <ModalHeader title="Nuevo Producto de Autopartes" onClose={handleCloseDialog} />
          <DialogContent sx={{ padding: '24px' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre del Producto"
                  name="nombre"
                  value={producto.nombre}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código"
                  name="codigo"
                  value={producto.codigo}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Marca"
                  name="marca"
                  value={producto.marca}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Categoría"
                  name="categoria"
                  value={producto.categoria}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Precio"
                  name="precio"
                  type="number"
                  value={producto.precio}
                  onChange={handleInputChange}
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Stock"
                  name="stock"
                  type="number"
                  value={producto.stock}
                  onChange={handleInputChange}
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="descripcion"
                  value={producto.descripcion}
                  onChange={handleInputChange}
                  variant="outlined"
                  multiline
                  rows={4}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px', borderTop: '1px solid #e0e0e0' }}>
            <Button
              onClick={handleCloseDialog}
              sx={{
                textTransform: 'none',
                color: '#757575',
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                textTransform: 'none',
                backgroundColor: '#7b1fa2',
                '&:hover': {
                  backgroundColor: '#6a1b9a',
                },
              }}
            >
              Guardar Producto
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  )
}

export default Productos

