import { useEffect, useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import { searchOrders } from '../api/orders'

export function salesOrderClientLabel(order) {
  if (!order) return '—'
  const company = String(order.billingCompany || '').trim()
  const name = [order.billingFirstName, order.billingLastName].filter(Boolean).join(' ').trim()
  return company || name || '—'
}

export function salesOrderOptionLabel(order) {
  if (!order) return ''
  const num = order.orderNumber || '—'
  const client = salesOrderClientLabel(order)
  const raw = order.createdAt
  const date =
    raw && !Number.isNaN(new Date(raw).getTime())
      ? new Date(raw).toLocaleDateString('es-MX')
      : ''
  return [num, client, date].filter(Boolean).join(' · ')
}

/** Objeto mínimo para el Autocomplete al cargar una compra ya vinculada */
export function salesOrderFromPurchase(p) {
  if (!p?.orderId) return null
  const client = String(p.salesOrderClient || '').trim()
  const company = client.includes(' — ') ? client.split(' — ')[0].trim() : ''
  const person = client.includes(' — ') ? client.split(' — ').slice(1).join(' — ').trim() : client
  return {
    id: p.orderId,
    orderNumber: p.salesOrderNumber || '',
    billingCompany: company,
    billingFirstName: person,
    billingLastName: '',
    createdAt: '',
  }
}

export default function PurchaseSalesOrderPicker({ value, onChange, disabled, sx }) {
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    const q = inputValue.trim()
    const seed = value?.orderNumber?.trim() || ''
    if (!q && !seed) {
      setOptions(value ? [value] : [])
      return undefined
    }
    const timer = setTimeout(async () => {
      setLoading(true)
      const res = await searchOrders({
        search: q || seed,
        limit: 25,
        page: 1,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      })
      if (!cancelled) {
        const rows = res.success && res.data?.orders ? res.data.orders : []
        if (value && !rows.some((o) => o.id === value.id)) {
          setOptions([value, ...rows])
        } else {
          setOptions(rows)
        }
        setLoading(false)
      }
    }, 320)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [inputValue, value])

  return (
    <Autocomplete
      fullWidth
      size="small"
      disabled={disabled}
      sx={{ minWidth: 0, ...sx }}
      options={options}
      loading={loading}
      value={value}
      onChange={(_, v) => onChange(v)}
      onInputChange={(_, v, reason) => {
        if (reason === 'input' || reason === 'clear') setInputValue(v)
      }}
      getOptionLabel={salesOrderOptionLabel}
      isOptionEqualToValue={(a, b) => Boolean(a?.id && b?.id && a.id === b.id)}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Nota de venta (opcional)"
          placeholder="Buscar por folio, cliente o empresa"
        />
      )}
      noOptionsText={inputValue.trim() || value ? 'Sin resultados' : 'Escribe para buscar notas'}
    />
  )
}
