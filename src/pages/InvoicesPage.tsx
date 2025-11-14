import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  Paper,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DownloadIcon from '@mui/icons-material/Download'
import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'

interface Invoice {
  id: string
  client: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
  description?: string
  items?: Array<{
    product: string
    quantity: number
    price: number
  }>
  paymentMethod?: string
  dueDate?: string
}

const invoices: Invoice[] = [
  {
    id: 'INV-001',
    client: 'David Manriquez',
    date: '2024-01-15',
    amount: 1250.0,
    status: 'paid',
    description: 'Factura por compra de refacciones para vehículo Nissan Versa 2020',
    items: [
      { product: 'Kit de Frenos Delanteros', quantity: 1, price: 245.0 },
      { product: 'Aceite Motor 5W-30', quantity: 2, price: 45.0 },
      { product: 'Filtro de Aire', quantity: 1, price: 78.0 },
    ],
    paymentMethod: 'Tarjeta de Crédito',
    dueDate: '2024-01-15',
  },
  {
    id: 'INV-002',
    client: 'Alberto Maldonado',
    date: '2024-01-16',
    amount: 850.0,
    status: 'pending',
    description: 'Factura pendiente de pago por servicios de mantenimiento',
    items: [
      { product: 'Batería 12V 60Ah', quantity: 1, price: 125.0 },
      { product: 'Limpiaparabrisas Premium', quantity: 2, price: 12.0 },
    ],
    paymentMethod: 'Transferencia Bancaria',
    dueDate: '2024-01-30',
  },
  {
    id: 'INV-003',
    client: 'Andres Gutierrez',
    date: '2024-01-17',
    amount: 2100.0,
    status: 'paid',
    description: 'Factura por compra mayorista de autopartes',
    items: [
      { product: 'Llanta Aleación 19"', quantity: 4, price: 589.0 },
    ],
    paymentMethod: 'Efectivo',
    dueDate: '2024-01-17',
  },
  {
    id: 'INV-004',
    client: 'Valentin Morales',
    date: '2024-01-10',
    amount: 650.0,
    status: 'overdue',
    description: 'Factura vencida por servicios de reparación',
    items: [
      { product: 'Discos de Embrague', quantity: 1, price: 189.0 },
      { product: 'Aceite Motor 5W-30', quantity: 1, price: 45.0 },
    ],
    paymentMethod: 'Tarjeta de Débito',
    dueDate: '2024-01-20',
  },
]

function InvoicesPage() {
  const [open, setOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoicesList, setInvoicesList] = useState<Invoice[]>(invoices)
  const [formData, setFormData] = useState({
    client: '',
    date: '',
    amount: '',
    status: 'pending' as 'paid' | 'pending' | 'overdue',
    description: '',
    paymentMethod: '',
    dueDate: '',
    pdfFile: null as File | null,
    xmlFile: null as File | null,
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'overdue':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagada'
      case 'pending':
        return 'Pendiente'
      case 'overdue':
        return 'Vencida'
      default:
        return status
    }
  }

  const handleOpen = () => {
    setOpen(true)
    setFormData({
      client: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      status: 'pending',
      description: '',
      paymentMethod: '',
      dueDate: '',
      pdfFile: null,
      xmlFile: null,
    })
  }

  const handleClose = () => {
    setOpen(false)
    setFormData({
      client: '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      status: 'pending',
      description: '',
      paymentMethod: '',
      dueDate: '',
      pdfFile: null,
      xmlFile: null,
    })
  }

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setDetailOpen(true)
  }

  const handleCloseDetail = () => {
    setDetailOpen(false)
    setSelectedInvoice(null)
  }

  const handleStatusChange = (newStatus: 'paid' | 'pending' | 'overdue') => {
    if (selectedInvoice) {
      const updatedInvoices = invoicesList.map((inv) =>
        inv.id === selectedInvoice.id ? { ...inv, status: newStatus } : inv
      )
      setInvoicesList(updatedInvoices)
      setSelectedInvoice({ ...selectedInvoice, status: newStatus })
    }
  }

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    const newInvoice: Invoice = {
      id: `INV-${String(invoicesList.length + 1).padStart(3, '0')}`,
      client: formData.client,
      date: formData.date,
      amount: parseFloat(formData.amount),
      status: formData.status,
      description: formData.description,
      paymentMethod: formData.paymentMethod,
      dueDate: formData.dueDate,
    }
    setInvoicesList([...invoicesList, newInvoice])
    handleClose()
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Facturas
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpen}
          sx={{
            backgroundColor: '#E74C3C',
            '&:hover': {
              backgroundColor: '#D92323',
            },
          }}
        >
          Nueva Factura
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>ID Factura</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Monto</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoicesList.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    onClick={() => handleInvoiceClick(invoice)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: '#f5f5f5',
                      },
                    }}
                  >
                    <TableCell>{invoice.id}</TableCell>
                    <TableCell>{invoice.client}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(invoice.status)}
                        color={getStatusColor(invoice.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <IconButton size="small" sx={{ color: '#2196F3' }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" sx={{ color: 'text.secondary' }}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para nueva factura */}
      <Dialog open={open} onClose={() => {}} maxWidth="md" fullWidth disableEscapeKeyDown>
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pr: 1,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Nueva Factura
          </Typography>
          <IconButton
            onClick={handleClose}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Cliente"
              fullWidth
              required
              value={formData.client}
              onChange={(e) => handleChange('client', e.target.value)}
            />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha"
                  type="date"
                  fullWidth
                  required
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Fecha de Vencimiento"
                  type="date"
                  fullWidth
                  value={formData.dueDate}
                  onChange={(e) => handleChange('dueDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Monto"
                  type="number"
                  fullWidth
                  required
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={formData.status}
                    label="Estado"
                    onChange={(e) => handleChange('status', e.target.value)}
                  >
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="paid">Pagada</MenuItem>
                    <MenuItem value="overdue">Vencida</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <TextField
              label="Método de Pago"
              fullWidth
              value={formData.paymentMethod}
              onChange={(e) => handleChange('paymentMethod', e.target.value)}
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
              Documentos
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    border: '1px dashed #E0E0E0',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: formData.pdfFile ? '#f5f5f5' : '#ffffff',
                    '&:hover': {
                      borderColor: '#E74C3C',
                      backgroundColor: '#FFF5F5',
                    },
                  }}
                >
                  <input
                    accept=".pdf"
                    style={{ display: 'none' }}
                    id="pdf-upload"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleChange('pdfFile', file)
                      }
                    }}
                  />
                  <label htmlFor="pdf-upload">
                    <Button
                      component="span"
                      variant="outlined"
                      fullWidth
                      sx={{
                        borderColor: '#E0E0E0',
                        color: 'text.secondary',
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#E74C3C',
                          backgroundColor: '#FFF5F5',
                        },
                      }}
                    >
                      {formData.pdfFile ? formData.pdfFile.name : 'Cargar PDF'}
                    </Button>
                  </label>
                  {formData.pdfFile && (
                    <Typography variant="caption" sx={{ color: '#8BC34A', display: 'block', mt: 1 }}>
                      ✓ Archivo cargado
                    </Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    border: '1px dashed #E0E0E0',
                    borderRadius: 1,
                    p: 2,
                    textAlign: 'center',
                    backgroundColor: formData.xmlFile ? '#f5f5f5' : '#ffffff',
                    '&:hover': {
                      borderColor: '#E74C3C',
                      backgroundColor: '#FFF5F5',
                    },
                  }}
                >
                  <input
                    accept=".xml"
                    style={{ display: 'none' }}
                    id="xml-upload"
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleChange('xmlFile', file)
                      }
                    }}
                  />
                  <label htmlFor="xml-upload">
                    <Button
                      component="span"
                      variant="outlined"
                      fullWidth
                      sx={{
                        borderColor: '#E0E0E0',
                        color: 'text.secondary',
                        textTransform: 'none',
                        '&:hover': {
                          borderColor: '#E74C3C',
                          backgroundColor: '#FFF5F5',
                        },
                      }}
                    >
                      {formData.xmlFile ? formData.xmlFile.name : 'Cargar XML'}
                    </Button>
                  </label>
                  {formData.xmlFile && (
                    <Typography variant="caption" sx={{ color: '#8BC34A', display: 'block', mt: 1 }}>
                      ✓ Archivo cargado
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.client || !formData.date || !formData.amount}
            sx={{
              backgroundColor: '#E74C3C',
              '&:hover': {
                backgroundColor: '#D92323',
              },
            }}
          >
            Crear Factura
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para detalle de factura */}
      <Dialog
        open={detailOpen}
        onClose={() => {}}
        maxWidth="md"
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pr: 1,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Detalle de Factura
          </Typography>
          <IconButton
            onClick={handleCloseDetail}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Box>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {selectedInvoice.id}
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedInvoice.status)}
                    color={getStatusColor(selectedInvoice.status) as any}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                {selectedInvoice.description && (
                  <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                    {selectedInvoice.description}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    <strong>Cliente:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.primary', fontWeight: 500 }}>
                    {selectedInvoice.client}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    <strong>Fecha:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'text.primary' }}>
                    {selectedInvoice.date}
                  </Typography>
                </Grid>
                {selectedInvoice.dueDate && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                      <strong>Fecha de Vencimiento:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.primary' }}>
                      {selectedInvoice.dueDate}
                    </Typography>
                  </Grid>
                )}
                {selectedInvoice.paymentMethod && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                      <strong>Método de Pago:</strong>
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'text.primary' }}>
                      {selectedInvoice.paymentMethod}
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    <strong>Monto Total:</strong>
                  </Typography>
                  <Typography variant="h5" sx={{ color: '#E74C3C', fontWeight: 700 }}>
                    ${selectedInvoice.amount.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>

              {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                    Productos
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600, color: 'text.primary' }}>Producto</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Cantidad
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Precio Unitario
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'text.primary' }}>
                            Total
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedInvoice.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.product}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">${item.price.toFixed(2)}</TableCell>
                            <TableCell align="right">
                              ${(item.quantity * item.price).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}

              <Divider sx={{ my: 3 }} />

              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: 'text.primary' }}>
                  Cambiar Estado
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Nuevo Estado</InputLabel>
                  <Select
                    value={selectedInvoice.status}
                    label="Nuevo Estado"
                    onChange={(e) =>
                      handleStatusChange(e.target.value as 'paid' | 'pending' | 'overdue')
                    }
                    sx={{
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E0E0E0' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#AAAAAA' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E74C3C' },
                    }}
                  >
                    <MenuItem value="pending">Pendiente</MenuItem>
                    <MenuItem value="paid">Pagada</MenuItem>
                    <MenuItem value="overdue">Vencida</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleCloseDetail}
            variant="contained"
            sx={{
              backgroundColor: '#E74C3C',
              '&:hover': {
                backgroundColor: '#D92323',
              },
            }}
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default InvoicesPage
