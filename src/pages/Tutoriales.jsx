import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SIDEBAR_WIDTH } from '../config/layout'
import { getAdminTutorialVideos } from '../config/tutorialVideos'
import {
  Box,
  Typography,
  Paper,
  Card,
  CardActionArea,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Grid,
  Alert,
} from '@mui/material'
import { Close as CloseIcon, OndemandVideo as VideoIcon } from '@mui/icons-material'
import Sidebar from '../components/Sidebar'
import Header from '../components/Header'

export default function Tutoriales() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const videos = useMemo(() => getAdminTutorialVideos(), [])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(null)
  const videoRef = useRef(null)

  const closeDialog = useCallback(() => {
    const el = videoRef.current
    if (el) {
      try {
        el.pause()
        el.currentTime = 0
      } catch {
        /* ignore */
      }
    }
    setOpen(false)
    setActive(null)
  }, [])

  const openVideo = useCallback((v) => {
    setActive(v)
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open || !active) return
    const t = window.setTimeout(() => {
      const el = videoRef.current
      if (el) {
        el.play().catch(() => {
          /* autoplay puede bloquearse; el usuario pulsa play */
        })
      }
    }, 150)
    return () => window.clearTimeout(t)
  }, [open, active])

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box',
          marginTop: { xs: 0, md: '70px' },
          pt: { xs: 2, sm: 3, md: 4 },
          pr: { xs: 2, sm: 3, md: 4 },
          pb: { xs: 2, sm: 3, md: 4 },
          pl: { xs: 2, sm: 3, md: `${SIDEBAR_WIDTH + 32}px` },
          backgroundColor: '#fafafa',
          minHeight: { xs: '100vh', md: 'calc(100vh - 70px)' },
        }}
      >
        <Header onMenuClick={() => setSidebarOpen((o) => !o)} />
        <Typography variant="h4" sx={{ color: '#424242', fontWeight: 'bold', mb: 1 }}>
          Tutoriales
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
          Videos de ayuda para el equipo. La reproducción es solo en el navegador; se oculta la opción de descarga en
          los controles compatibles (no impide copiar la URL desde herramientas de desarrollo).
        </Typography>

        {videos.length === 0 ? (
          <Alert severity="info" sx={{ maxWidth: 720 }}>
            Aún no hay tutoriales configurados. Añade en tu archivo <code>.env</code> la variable{' '}
            <code>VITE_ADMIN_TUTORIAL_VIDEOS_JSON</code> con un JSON: lista de objetos con{' '}
            <code>title</code>, <code>src</code> (URL HTTPS del video en S3) y opcionalmente <code>description</code>.
            Reinicia <code>npm run dev</code> tras cambiar el entorno.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {videos.map((v) => (
              <Grid item xs={12} sm={6} md={4} key={v.id}>
                <Card variant="outlined" sx={{ height: '100%', borderRadius: 2 }}>
                  <CardActionArea onClick={() => openVideo(v)} sx={{ height: '100%', alignItems: 'stretch' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                        <VideoIcon sx={{ color: 'primary.main', mt: 0.25 }} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                            {v.title}
                          </Typography>
                          {v.description ? (
                            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
                              {v.description}
                            </Typography>
                          ) : (
                            <Typography variant="body2" color="primary" sx={{ fontWeight: 600 }}>
                              Ver video
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog
          open={open}
          onClose={closeDialog}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: { sx: { borderRadius: 2 } },
          }}
        >
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
            <Typography component="span" variant="h6" fontWeight={700} sx={{ pr: 2 }}>
              {active?.title || 'Tutorial'}
            </Typography>
            <IconButton aria-label="Cerrar" onClick={closeDialog} edge="end" size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ pt: 0 }}>
            {active?.description ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {active.description}
              </Typography>
            ) : null}
            {active?.src ? (
              <Paper
                elevation={0}
                variant="outlined"
                sx={{
                  borderRadius: 1,
                  overflow: 'hidden',
                  bgcolor: '#000',
                  lineHeight: 0,
                }}
                onContextMenu={(e) => e.preventDefault()}
              >
                <video
                  ref={videoRef}
                  key={active.src}
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  playsInline
                  preload="metadata"
                  style={{ width: '100%', maxHeight: '70vh', display: 'block' }}
                >
                  <source src={active.src} type="video/mp4" />
                  Tu navegador no reproduce video HTML5.
                </video>
              </Paper>
            ) : null}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
              Uso interno: no distribuir el archivo. La descarga directa desde el reproductor está deshabilitada cuando el
              navegador lo permite.
            </Typography>
          </DialogContent>
        </Dialog>
      </Box>
    </Box>
  )
}
