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
- `/productos` - Productos (pendiente)
- `/facturas` - Facturas (pendiente)
- `/clientes` - Clientes (pendiente)
- `/chat` - Chat Room (pendiente)
- `/envios` - Envíos (pendiente)
- `/ayuda` - Centro de Ayuda (pendiente)
- `/configuracion` - Configuración (pendiente)

## Próximos Pasos

Las siguientes pantallas están listas para ser implementadas según el menú lateral:
- Productos
- Facturas
- Clientes
- Chat Room
- Envíos
- Centro de Ayuda
- Configuración
