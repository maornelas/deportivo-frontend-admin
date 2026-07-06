import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function readAppVersionFile() {
  try {
    const file = resolve(process.cwd(), 'src/config/version.js')
    const source = readFileSync(file, 'utf8')
    const versionMatch = source.match(/APP_VERSION\s*=\s*['"]([^'"]+)['"]/)
    const buildDateMatch = source.match(/APP_BUILD_DATE\s*=\s*['"]([^'"]+)['"]/)
    return {
      version: versionMatch?.[1] ?? 'v0.0.0',
      buildDate: buildDateMatch?.[1] ?? null,
    }
  } catch {
    return { version: 'v0.0.0', buildDate: null }
  }
}

function versionJsonPlugin({ appVersion, buildId, buildDate }) {
  const builtAt = buildDate ? `${buildDate}T12:00:00.000Z` : new Date().toISOString()
  const payload = () =>
    JSON.stringify(
      { version: appVersion, buildId, builtAt },
      null,
      0,
    )

  return {
    name: 'version-json',
    configureServer(server) {
      server.middlewares.use('/version.json', (_req, res) => {
        res.statusCode = 200
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
        res.end(payload())
      })
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: payload(),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget =
    env.VITE_DEV_PROXY_TARGET?.trim() || 'http://localhost:3000'

  const { version: appVersion, buildDate } = readAppVersionFile()
  const buildId = `${Date.now()}`

  return {
    plugins: [react(), versionJsonPlugin({ appVersion, buildId, buildDate })],
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_BUILD_ID': JSON.stringify(buildId),
    },
    server: {
      proxy: {
        '/api/v1': {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
  }
})
