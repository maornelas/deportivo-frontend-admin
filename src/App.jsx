import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventario from './pages/Inventario'
import Ventas from './pages/Ventas'
import Compras from './pages/Compras'
import Gastos from './pages/Gastos'
import Cotizacion from './pages/Cotizacion'
import Facturas from './pages/Facturas'
import Clientes from './pages/Clientes'
import Usuarios from './pages/Usuarios'
import Ayuda from './pages/Ayuda'
import Configuracion from './pages/Configuracion'
import Perfil from './pages/Perfil'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inventario"
        element={
          <ProtectedRoute>
            <Inventario />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ventas"
        element={
          <ProtectedRoute>
            <Ventas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compras"
        element={
          <ProtectedRoute>
            <Compras />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gastos"
        element={
          <ProtectedRoute>
            <Gastos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cotizacion"
        element={
          <ProtectedRoute>
            <Cotizacion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facturas"
        element={
          <ProtectedRoute>
            <Facturas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <Clientes />
          </ProtectedRoute>
        }
      />
      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <Usuarios />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ayuda"
        element={
          <ProtectedRoute>
            <Ayuda />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configuracion"
        element={
          <ProtectedRoute>
            <Configuracion />
          </ProtectedRoute>
        }
      />
      <Route
        path="/perfil"
        element={
          <ProtectedRoute>
            <Perfil />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
