/**
 * Códigos de permiso de acción (tabla `permissions`, columna `code`).
 * Deben coincidir con la migración `1755010000000-SeedAdminSectionActionPermissions`.
 */
export const ACTION = {
  INVENTARIO_CREAR_PRODUCTO: 'action.inventario.crear_producto',
  INVENTARIO_EDITAR_PRODUCTO: 'action.inventario.editar_producto',
  INVENTARIO_ELIMINAR_PRODUCTO: 'action.inventario.eliminar_producto',

  COTIZACIONES_CREAR: 'action.cotizaciones.crear',
  COTIZACIONES_EDITAR: 'action.cotizaciones.editar',
  COTIZACIONES_ELIMINAR: 'action.cotizaciones.eliminar',

  VENTAS_DETALLE_ORDEN: 'action.ventas.detalle_orden',
  VENTAS_CAMBIAR_ESTADO_ORDEN: 'action.ventas.cambiar_estado_orden',

  COMPRAS_CREAR: 'action.compras.crear',
  COMPRAS_EDITAR: 'action.compras.editar',
  COMPRAS_ELIMINAR: 'action.compras.eliminar',

  GASTOS_CREAR: 'action.gastos.crear',
  GASTOS_EDITAR: 'action.gastos.editar',
  GASTOS_ELIMINAR: 'action.gastos.eliminar',

  CLIENTES_CREAR: 'action.clientes.crear',
  CLIENTES_EDITAR: 'action.clientes.editar',
  CLIENTES_ELIMINAR: 'action.clientes.eliminar',

  USUARIOS_CREAR: 'action.usuarios.crear',
  USUARIOS_EDITAR: 'action.usuarios.editar',
  USUARIOS_ELIMINAR: 'action.usuarios.eliminar',

  CATALOGOS_MARCA_CREAR: 'action.catalogos.marca_crear',
  CATALOGOS_MARCA_EDITAR: 'action.catalogos.marca_editar',
  CATALOGOS_MARCA_ELIMINAR: 'action.catalogos.marca_eliminar',
  CATALOGOS_MODELO_CREAR: 'action.catalogos.modelo_crear',
  CATALOGOS_MODELO_EDITAR: 'action.catalogos.modelo_editar',
  CATALOGOS_MODELO_ELIMINAR: 'action.catalogos.modelo_eliminar',
  CATALOGOS_TIPO_GASTO_CREAR: 'action.catalogos.tipo_gasto_crear',
  CATALOGOS_TIPO_GASTO_EDITAR: 'action.catalogos.tipo_gasto_editar',
  CATALOGOS_TIPO_GASTO_ELIMINAR: 'action.catalogos.tipo_gasto_eliminar',

  ROLES_CREAR: 'action.roles.crear',
  ROLES_EDITAR: 'action.roles.editar',
  ROLES_ELIMINAR: 'action.roles.eliminar',
  ROLES_GUARDAR_PERMISOS: 'action.roles.guardar_permisos',
}
