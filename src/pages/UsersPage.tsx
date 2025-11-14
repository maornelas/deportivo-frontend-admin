import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  Chip,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

interface User {
  id: number
  name: string
  email: string
  role: string
  avatar: string
  status: 'active' | 'inactive'
}

const users: User[] = [
  {
    id: 1,
    name: 'Mario Lona',
    email: 'mario.lona@example.com',
    role: 'Administrador',
    avatar: 'ML',
    status: 'active',
  },
  {
    id: 2,
    name: 'Ana García',
    email: 'ana.garcia@example.com',
    role: 'Editor',
    avatar: 'AG',
    status: 'active',
  },
  {
    id: 3,
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@example.com',
    role: 'Vendedor',
    avatar: 'CR',
    status: 'active',
  },
  {
    id: 4,
    name: 'María López',
    email: 'maria.lopez@example.com',
    role: 'Vendedor',
    avatar: 'ML',
    status: 'inactive',
  },
]

function UsersPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: '#1f2937' }}>
        Usuarios
      </Typography>

      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
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
                      {user.avatar}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {user.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280' }}>
                        {user.email}
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

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={user.role}
                    size="small"
                    sx={{
                      backgroundColor: '#e0e7ff',
                      color: '#6366f1',
                      fontWeight: 500,
                    }}
                  />
                  <Chip
                    label={user.status === 'active' ? 'Activo' : 'Inactivo'}
                    size="small"
                    color={user.status === 'active' ? 'success' : 'default'}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

export default UsersPage

