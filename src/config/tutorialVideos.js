/**
 * Tutoriales en video (URLs servidas desde S3 u otro HTTPS).
 *
 * Configuración: variable de entorno `VITE_ADMIN_TUTORIAL_VIDEOS_JSON` con un JSON array, por ejemplo:
 * [{"title":"Inventario","description":"Cómo dar de alta productos","src":"https://tu-bucket.s3.../tutorial.mp4"}]
 */

function safeVideosFromEnv() {
  const raw =
    import.meta.env.VITE_ADMIN_TUTORIAL_VIDEOS_JSON || import.meta.env.VITE_ADMIN_TUTORIAL_VIDEOS || ''
  const s = String(raw).trim()
  if (!s) return []
  try {
    const data = JSON.parse(s)
    if (!Array.isArray(data)) return []
    return data
      .map((item, i) => ({
        id: item?.id != null ? String(item.id) : `tutorial-${i}`,
        title: String(item?.title || `Tutorial ${i + 1}`).trim() || `Tutorial ${i + 1}`,
        description: item?.description != null ? String(item.description).trim() : '',
        src: String(item?.src || '').trim(),
      }))
      .filter((v) => v.src && /^https?:\/\//i.test(v.src))
  } catch {
    return []
  }
}

/** @returns {{ id: string, title: string, description: string, src: string }[]} */
export function getAdminTutorialVideos() {
  return safeVideosFromEnv()
}
