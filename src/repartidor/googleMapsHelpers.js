const MAPS_SCRIPT_ID = 'deportivo-google-maps-js'

export function loadGoogleMaps(apiKey, libraries = '') {
  if (!apiKey?.trim()) {
    return Promise.reject(new Error('Falta VITE_GOOGLE_MAPS_API_KEY'))
  }
  if (typeof window !== 'undefined' && window.google?.maps?.Map) {
    return Promise.resolve()
  }
  const libParam = libraries ? `&libraries=${encodeURIComponent(libraries)}` : ''
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(MAPS_SCRIPT_ID)
    if (existing) {
      const wait = () => {
        if (window.google?.maps?.Map) {
          resolve()
          return
        }
        window.setTimeout(wait, 50)
      }
      wait()
      return
    }
    const s = document.createElement('script')
    s.id = MAPS_SCRIPT_ID
    s.async = true
    s.defer = true
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey.trim())}${libParam}`
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('No se pudo cargar Google Maps'))
    document.head.appendChild(s)
  })
}

export function geocodeAddress(address) {
  const q = String(address || '').trim()
  if (!q) return Promise.reject(new Error('Escribe una dirección'))
  const geocoder = new window.google.maps.Geocoder()
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address: q, region: 'mx' }, (results, status) => {
      if (status === 'OK' && results?.[0]?.geometry?.location) {
        const loc = results[0].geometry.location
        resolve({
          lat: loc.lat(),
          lng: loc.lng(),
          formattedAddress: results[0].formatted_address || q,
        })
        return
      }
      reject(new Error('No se encontró esa dirección en el mapa'))
    })
  })
}

export function reverseGeocode(lat, lng) {
  const geocoder = new window.google.maps.Geocoder()
  return new Promise((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results?.[0]) {
        resolve(results[0].formatted_address || '')
        return
      }
      reject(new Error('No se pudo obtener la dirección del punto'))
    })
  })
}
