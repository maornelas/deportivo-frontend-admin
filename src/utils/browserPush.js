/**
 * Muestra una notificación nativa del navegador si el usuario ya concedió permiso.
 * No solicita permiso automáticamente (evita prompts intrusivos).
 */
export function showBrowserNotificationIfAllowed(title, body) {
  if (typeof window === 'undefined') return
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    // eslint-disable-next-line no-new
    new Notification(title, { body: body || '', lang: 'es-MX' })
  } catch {
    // Ignorar entornos que bloquean Notification (p. ej. iframe sin permiso)
  }
}
