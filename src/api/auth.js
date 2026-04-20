const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL
  if (url) return url.replace(/\/$/, '')
  return 'http://localhost:3000/api/v1'
}

/**
 * Login para el panel de administración.
 * El rol va en la cabecera `X-Login-Role` para no chocar con APIs cuyo DTO solo permite email/contraseña en el body.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
 */
export async function login({ email, password }) {
  const baseUrl = getBaseUrl()
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Login-Role': 'admin',
    },
    body: JSON.stringify({
      email: email.trim(),
      password,
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    return {
      success: false,
      error: body.message || body.error || `Error ${res.status}`,
    }
  }
  if (!body.success || !body.data) {
    return {
      success: false,
      error: body.message || 'Error al iniciar sesión',
    }
  }
  return { success: true, data: body.data }
}
