import { useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Pagination,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import InstagramIcon from '@mui/icons-material/Instagram'
import TwitterIcon from '@mui/icons-material/Twitter'
import FacebookIcon from '@mui/icons-material/Facebook'
import EmailIcon from '@mui/icons-material/Email'

interface Client {
  id: number
  name: string
  location: string
  mobile: string
  avatar: string
}

const clients: Client[] = [
  {
    id: 1,
    name: 'David Manriquez',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'DM',
  },
  {
    id: 2,
    name: 'Alberto Maldonado',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'AM',
  },
  {
    id: 3,
    name: 'Andres Gutierrez',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'AG',
  },
  {
    id: 4,
    name: 'Valentin Morales',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'VM',
  },
  {
    id: 5,
    name: 'Antonio Fuentes',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'AF',
  },
  {
    id: 6,
    name: 'Federico Saldaña',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'FS',
  },
  {
    id: 7,
    name: 'Nicolás Herrera',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'NH',
  },
  {
    id: 8,
    name: 'Marcelo Toledo',
    location: 'México',
    mobile: '871.567.4877',
    avatar: 'MT',
  },
]

function ClientsPage() {
  const [tabValue, setTabValue] = useState(0)

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#1f2937' }}>
        Clientes
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab
            label="Cliente"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              '&.Mui-selected': {
                color: '#6366f1',
              },
            }}
          />
          <Tab
            label="Agencias"
            sx={{
              textTransform: 'none',
              fontWeight: 500,
              '&.Mui-selected': {
                color: '#6366f1',
              },
            }}
          />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {clients.map((client) => (
          <Grid item xs={12} sm={6} key={client.id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 56,
                        height: 56,
                        bgcolor: '#6366f1',
                        fontSize: '1.25rem',
                        fontWeight: 600,
                      }}
                    >
                      {client.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {client.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {client.location}
                      </Typography>
                    </Box>
                  </Box>
                  <Box>
                    <IconButton size="small" sx={{ color: '#6b7280' }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" sx={{ color: '#ef4444' }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ color: '#6b7280', mb: 2 }}>
                  Mobile: {client.mobile}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton size="small" sx={{ color: '#e1306c' }}>
                    <InstagramIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#1da1f2' }}>
                    <TwitterIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#1877f2' }}>
                    <FacebookIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#6b7280' }}>
                    <EmailIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Pagination count={5} page={1} color="primary" />
      </Box>
    </Box>
  )
}

export default ClientsPage

