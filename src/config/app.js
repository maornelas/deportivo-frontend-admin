import { APP_VERSION, APP_BUILD_DATE } from './version'

/** Identificador único del build actual (cambia en cada deploy) */
export const BUILD_ID = import.meta.env.VITE_BUILD_ID || 'dev'

export { APP_VERSION, APP_BUILD_DATE }

/** Etiqueta DD/MM/YYYY de la fecha de compilación del release. */
export function getAppBuildDateLabel() {
  return formatAppDate(APP_BUILD_DATE)
}

export function formatAppDate(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(d.getTime())) return '—'
  const day = d.getDate()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}
