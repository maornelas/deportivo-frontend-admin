# Deportivo Frontend Admin

Portal administrativo para EL DEPORTIVO desarrollado con React, Vite y Material UI.

## Características

- ✅ Página de Login con diseño moderno
- ✅ Dashboard completo con métricas y gráficos
- ✅ Sidebar de navegación con menú lateral
- ✅ Header con búsqueda y notificaciones
- ✅ Widgets de resumen (tarjetas, gráficos, tablas)
- ✅ Routing configurado con React Router
- ✅ Diseño responsive

## Tecnologías

- **React 19** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **Material UI (MUI)** - Componentes de UI
- **React Router** - Navegación
- **Recharts** - Gráficos y visualizaciones

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Build

```bash
npm run build
```

## Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Sidebar.jsx     # Barra lateral de navegación
│   ├── Header.jsx      # Barra superior con búsqueda
│   └── DashboardWidgets.jsx  # Widgets del dashboard
├── pages/              # Páginas principales
│   ├── Login.jsx       # Página de inicio de sesión
│   └── Dashboard.jsx   # Página principal del dashboard
├── App.jsx             # Componente principal con routing
└── main.jsx            # Punto de entrada
```

## Rutas

- `/login` - Página de inicio de sesión
- `/dashboard` - Dashboard principal
- `/inventario` - Inventario de piezas
- `/catalogos` - Catálogo de marcas y modelos de auto (brands / car_models)
- `/clientes` - Clientes
- (otras rutas según menú lateral)
