import ExcelJS from 'exceljs'
import { resolveLineUtilidad } from './ventasReportTotals'

const HEADERS = [
  'SINIESTRO',
  'UNIDAD',
  'CONCEPTO',
  'CANAL DE VENTA',
  'PROVEEDOR',
  'MONTO',
  'MONTO NETO',
  'SEGURO',
  'SEGURO NETO',
  'UTILIDAD',
  'VENDEDOR',
  'STATUS',
]

const BORDER_THIN = { style: 'thin', color: { argb: 'FF9E9E9E' } }
const BORDER_GRID = {
  top: BORDER_THIN,
  left: BORDER_THIN,
  bottom: BORDER_THIN,
  right: BORDER_THIN,
}

function moneyNumber(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

function statusFill(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'LIBERADO') return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8E6C9' } }
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCDD2' } }
}

function statusFont(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'LIBERADO') return { bold: true, color: { argb: 'FF1B5E20' } }
  return { bold: true, color: { argb: 'FFB71C1C' } }
}

/**
 * @param {{
 *   title: string,
 *   lines: Array<Record<string, unknown>>,
 *   filename: string,
 *   totals?: { monto: number, montoNeto: number, seguro: number, seguroNeto: number, utilidad: number } | null,
 * }} opts
 */
export async function downloadVentasExcel({ title, lines, filename, totals = null }) {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet('Ventas', { views: [{ showGridLines: true }] })

  ws.mergeCells('A1:L1')
  const titleCell = ws.getCell('A1')
  titleCell.value = title
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF57C00' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 28

  const headerRow = ws.getRow(2)
  headerRow.height = 22
  HEADERS.forEach((h, i) => {
    const c = headerRow.getCell(i + 1)
    c.value = h
    c.font = { bold: true, color: { argb: 'FF000000' } }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } }
    c.border = BORDER_GRID
    c.alignment = { vertical: 'middle', wrapText: true }
  })

  const moneyFmt = '"$"#,##0.00'
  let r = 3
  if (!lines.length) {
    const row = ws.getRow(r)
    ws.mergeCells(`A${r}:L${r}`)
    const c = row.getCell(1)
    c.value = 'Sin filas en el rango seleccionado.'
    c.alignment = { horizontal: 'center' }
    c.border = BORDER_GRID
    r += 1
  } else {
    for (const line of lines) {
      const row = ws.getRow(r)
      const cells = [
        line.siniestro || '—',
        line.unidad || '—',
        line.concepto || '—',
        line.canalVenta || '—',
        line.proveedor || '—',
        moneyNumber(line.monto),
        moneyNumber(line.montoNeto),
        moneyNumber(line.seguro),
        moneyNumber(line.seguroNeto),
        moneyNumber(resolveLineUtilidad(line.monto, line.seguro) ?? line.utilidad),
        line.vendedor || '—',
        line.status || '—',
      ]
      cells.forEach((val, i) => {
        const col = i + 1
        const cell = row.getCell(col)
        cell.border = BORDER_GRID
        if (i >= 5 && i <= 9) {
          if (val != null) {
            cell.value = val
            cell.numFmt = moneyFmt
            cell.alignment = { horizontal: 'right' }
          } else {
            cell.value = '—'
            cell.alignment = { horizontal: 'right' }
          }
        } else if (i === 11) {
          cell.value = val
          cell.fill = statusFill(line.status)
          cell.font = statusFont(line.status)
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
        } else {
          cell.value = val
          cell.alignment = { vertical: 'middle', wrapText: i === 2 }
        }
        if (i === 9 && val != null) {
          const neg = val < 0
          cell.font = { bold: true, color: { argb: neg ? 'FFC62828' : 'FF2E7D32' } }
        }
      })
      r += 1
    }
    if (totals) {
      const row = ws.getRow(r)
      ws.mergeCells(`A${r}:E${r}`)
      const label = row.getCell(1)
      label.value = 'TOTAL'
      label.font = { bold: true }
      label.alignment = { horizontal: 'right', vertical: 'middle' }
      label.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCE93D8' } }
      label.border = BORDER_GRID
      ;['monto', 'montoNeto', 'seguro', 'seguroNeto', 'utilidad'].forEach((key, i) => {
        const col = 6 + i
        const cell = row.getCell(col)
        cell.value = totals[key]
        cell.numFmt = moneyFmt
        cell.alignment = { horizontal: 'right' }
        cell.font = { bold: true }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCE93D8' } }
        cell.border = BORDER_GRID
        if (key === 'utilidad' && totals.utilidad != null) {
          const neg = totals.utilidad < 0
          cell.font = { bold: true, color: { argb: neg ? 'FFC62828' : 'FF2E7D32' } }
        }
      })
      ws.mergeCells(`K${r}:L${r}`)
      const tail = row.getCell(11)
      tail.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCE93D8' } }
      tail.border = BORDER_GRID
      r += 1
    }
  }

  ws.columns = [
    { width: 14 },
    { width: 28 },
    { width: 42 },
    { width: 16 },
    { width: 26 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 14 },
    { width: 12 },
  ]

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
