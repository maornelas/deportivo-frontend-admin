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
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import DownloadIcon from '@mui/icons-material/Download'

interface Invoice {
  id: string
  client: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'overdue'
}

const invoices: Invoice[] = [
  {
    id: 'INV-001',
    client: 'David Manriquez',
    date: '2024-01-15',
    amount: 1250.0,
    status: 'paid',
  },
  {
    id: 'INV-002',
    client: 'Alberto Maldonado',
    date: '2024-01-16',
    amount: 850.0,
    status: 'pending',
  },
  {
    id: 'INV-003',
    client: 'Andres Gutierrez',
    date: '2024-01-17',
    amount: 2100.0,
    status: 'paid',
  },
  {
    id: 'INV-004',
    client: 'Valentin Morales',
    date: '2024-01-10',
    amount: 650.0,
    status: 'overdue',
  },
]

function InvoicesPage() {
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

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: '#1f2937' }}>
        Facturas
      </Typography>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID Factura</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Monto</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Estado</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
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
                    <TableCell>
                      <IconButton size="small" sx={{ color: '#6366f1' }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" sx={{ color: '#6b7280' }}>
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
    </Box>
  )
}

export default InvoicesPage

