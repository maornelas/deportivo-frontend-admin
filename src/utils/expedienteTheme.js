/** Colores de marca del módulo expediente digital */
export const EXPEDIENTE_ACCENT = '#6B5B95'
export const EXPEDIENTE_ACCENT_HOVER = '#5A4D84'
export const HEADER_SUBTITLE = 'rgba(255,255,255,0.72)'

export function sectionHeaderBg(theme) {
  return theme.palette.mode === 'dark' ? '#21262d' : '#424242'
}

export function timelineActiveBg(theme) {
  return theme.palette.mode === 'dark' ? 'rgba(107, 91, 149, 0.28)' : '#F3EEFC'
}

export function timelineActiveBorder(theme) {
  return theme.palette.mode === 'dark' ? 'rgba(107, 91, 149, 0.55)' : '#D4C4F0'
}

export function timelineHoverBg(theme) {
  return theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#FAFAFA'
}

export function chipNeutralBg(theme) {
  return theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#F5F5F5'
}

export function chipAccentBg(theme) {
  return theme.palette.mode === 'dark' ? 'rgba(107, 91, 149, 0.35)' : '#F3EEFC'
}

export function chipBlueBg(theme) {
  return theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.2)' : '#E3F2FD'
}

export function uploadPanelBg(theme) {
  return theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#FAFAFA'
}

export function cardHoverBg(theme) {
  return theme.palette.mode === 'dark' ? 'rgba(107, 91, 149, 0.18)' : '#F3EEFC'
}

export function cardHoverShadow(theme) {
  return theme.palette.mode === 'dark'
    ? '0 6px 18px rgba(0,0,0,0.35)'
    : '0 6px 18px rgba(0,0,0,0.07)'
}
