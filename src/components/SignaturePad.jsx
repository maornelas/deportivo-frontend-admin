import { useRef, useCallback, useEffect } from 'react'
import { Box, Button, Stack } from '@mui/material'

function getPoint(canvas, e) {
  const r = canvas.getBoundingClientRect()
  const scaleX = canvas.width / r.width
  const scaleY = canvas.height / r.height
  let x
  let y
  if (e.touches && e.touches[0]) {
    x = (e.touches[0].clientX - r.left) * scaleX
    y = (e.touches[0].clientY - r.top) * scaleY
  } else {
    x = (e.clientX - r.left) * scaleX
    y = (e.clientY - r.top) * scaleY
  }
  return { x, y }
}

/**
 * Lienzo de firma táctil y mouse. dimensiones internas fijas para buena resolución en PDF.
 */
export default function SignaturePad({ width = 600, height = 200, onChange, sx }) {
  const canvasRef = useRef(null)
  const drawing = useRef(false)
  const last = useRef(null)
  const hasInk = useRef(false)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const start = useCallback((e) => {
    e.preventDefault()
    drawing.current = true
    last.current = getPoint(canvasRef.current, e)
  }, [])

  const move = useCallback((e) => {
    if (!drawing.current) return
    e.preventDefault()
    const c = canvasRef.current
    const ctx = c.getContext('2d')
    const p = getPoint(c, e)
    const prev = last.current
    ctx.beginPath()
    ctx.moveTo(prev.x, prev.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
    hasInk.current = true
  }, [])

  const end = useCallback(
    (e) => {
      if (e?.preventDefault) e.preventDefault()
      drawing.current = false
      last.current = null
      const c = canvasRef.current
      if (c && onChange) {
        onChange(hasInk.current ? c.toDataURL('image/png') : null)
      }
    },
    [onChange],
  )

  const clear = useCallback(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, c.width, c.height)
    hasInk.current = false
    if (onChange) onChange(null)
  }, [onChange])

  return (
    <Stack spacing={1} sx={sx}>
      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: '#fff',
          touchAction: 'none',
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ width: '100%', height: 'auto', display: 'block', verticalAlign: 'top' }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
          onTouchStart={start}
          onTouchMove={move}
          onTouchEnd={end}
        />
      </Box>
      <Button size="small" variant="outlined" onClick={clear}>
        Limpiar firma
      </Button>
    </Stack>
  )
}
