import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { pathRequiresModule, firstAccessiblePathFromRbac } from './config/adminModules'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Inventario from './pages/Inventario'
import Ventas from './pages/Ventas'
import Compras from './pages/Compras'
import CompraDetalle from './pages/CompraDetalle'
import CompraRegistrar from './pages/CompraRegistrar'
import Gastos from './pages/Gastos'
import Cotizaciones from './pages/Cotizaciones'
import CotizacionEditor from './pages/CotizacionEditor'
import Clientes from './pages/Clientes'
import Usuarios from './pages/Usuarios'
import Catalogos from './pages/Catalogos'
import Perfil from './pages/Perfil'
import Roles from './pages/Roles'
import Historial from './pages/Historial'
import Notificaciones from './pages/Notificaciones'
import Reporteria from './pages/Reporteria'
import RepartidorEntregas from './pages/RepartidorEntregas'
import EntregasRepartidor from './pages/EntregasRepartidor'
import Tutoriales from './pages/Tutoriales'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user, canViewPath } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (pathRequiresModule(location.pathname) && !canViewPath(location.pathname)) {
    const fallback = user?.rbac ? firstAccessiblePathFromRbac(user.rbac) : '/perfil'
    return <Navigate to={fallback} replace />
  }
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
        path="/compras/nueva"
        element={
          <ProtectedRoute>
            <CompraRegistrar />
          </ProtectedRoute>
        }
      />
      <Route
        path="/compras/:id"
        element={
          <ProtectedRoute>
            <CompraDetalle />
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
        path="/entregas"
        element={
          <ProtectedRoute>
            <EntregasRepartidor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/historial"
        element={
          <ProtectedRoute>
            <Historial />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notificaciones"
        element={
          <ProtectedRoute>
            <Notificaciones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reporteria"
        element={
          <ProtectedRoute>
            <Reporteria />
          </ProtectedRoute>
        }
      />
      <Route
        path="/repartidor"
        element={
          <ProtectedRoute>
            <RepartidorEntregas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cotizaciones"
        element={
          <ProtectedRoute>
            <Cotizaciones />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cotizaciones/:id"
        element={
          <ProtectedRoute>
            <CotizacionEditor />
          </ProtectedRoute>
        }
      />
      <Route path="/cotizacion" element={<Navigate to="/cotizaciones" replace />} />
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
        path="/catalogos"
        element={
          <ProtectedRoute>
            <Catalogos />
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute>
            <Roles />
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
      <Route
        path="/tutoriales"
        element={
          <ProtectedRoute>
            <Tutoriales />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
