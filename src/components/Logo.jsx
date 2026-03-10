import { Box } from '@mui/material'

const Logo = ({ variant = 'light', imageSrc = null, size = 'normal' }) => {
  const isLight = variant === 'light'
  const carColor = isLight ? '#ffc107' : '#d4af37'
  const textColor = isLight ? 'white' : 'white'
  const subtitleColor = isLight ? '#ffc107' : '#d4af37'
  const imageSx =
    size === 'small'
      ? { maxWidth: '100px', width: 100, height: 'auto', marginBottom: '12px' }
      : size === 'large'
        ? { maxWidth: '280px', width: '100%', height: 'auto', marginBottom: '20px' }
        : { maxWidth: '100%', height: 'auto', marginBottom: '20px' }

  // Si se proporciona una imagen, usar esa en lugar del SVG
  if (imageSrc) {
    return (
      <Box sx={{ textAlign: 'center' }}>
        <Box component="img" src={imageSrc} alt="EL DEPORTIVO AUTOPARTES" sx={imageSx} />
      </Box>
    )
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      {/* Car Silhouette SVG */}
      <Box
        sx={{
          width: '140px',
          height: '90px',
          margin: '0 auto 20px',
          position: 'relative',
        }}
      >
        <svg
          width="140"
          height="90"
          viewBox="0 0 140 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Car body outline */}
          <path
            d="M20 50 L25 45 L30 40 L40 38 L50 35 L60 33 L70 32 L80 33 L90 35 L100 38 L110 40 L115 45 L120 50 L120 60 L115 65 L110 68 L100 70 L90 72 L80 73 L70 72 L60 70 L50 68 L40 65 L35 60 L30 55 L25 50 Z"
            fill="black"
            stroke={carColor}
            strokeWidth="2.5"
          />
          {/* Car window */}
          <path
            d="M50 40 L70 38 L80 40 L85 45 L80 50 L70 48 L50 50 Z"
            fill="black"
            stroke={carColor}
            strokeWidth="1.5"
          />
          {/* Wheels */}
          <circle cx="45" cy="65" r="8" fill="black" stroke={carColor} strokeWidth="2" />
          <circle cx="95" cy="65" r="8" fill="black" stroke={carColor} strokeWidth="2" />
          {/* Wheel details */}
          <circle cx="45" cy="65" r="4" fill={carColor} />
          <circle cx="95" cy="65" r="4" fill={carColor} />
        </svg>
      </Box>

      {/* EL DEPORTIVO Text */}
      <Box
        component="h1"
        sx={{
          color: textColor,
          fontSize: { xs: '28px', md: '36px' },
          fontWeight: 'bold',
          letterSpacing: '3px',
          margin: 0,
          marginBottom: '8px',
          textTransform: 'uppercase',
          fontFamily: 'sans-serif',
        }}
      >
        EL DEPORTIVO
      </Box>

      {/* White line */}
      <Box
        sx={{
          width: '220px',
          height: '2px',
          background: textColor,
          margin: '0 auto 12px',
        }}
      />

      {/* AUTOPARTES Text */}
      <Box
        component="h2"
        sx={{
          color: subtitleColor,
          fontSize: { xs: '16px', md: '20px' },
          fontWeight: 400,
          letterSpacing: '2px',
          margin: 0,
          textTransform: 'uppercase',
          fontFamily: 'sans-serif',
        }}
      >
        AUTOPARTES
      </Box>
    </Box>
  )
}

export default Logo

