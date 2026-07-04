import { Typography } from '@mui/material'

export const pageTitleSx = {
  color: 'text.primary',
  fontWeight: 700,
  mb: 1,
  mt: { xs: 0, md: -0.5 },
  fontSize: { xs: '16px', sm: '17px', md: '18px' },
}

export default function PageTitle({ children, sx, component, ...rest }) {
  return (
    <Typography variant="subtitle1" component={component} sx={{ ...pageTitleSx, ...sx }} {...rest}>
      {children}
    </Typography>
  )
}
