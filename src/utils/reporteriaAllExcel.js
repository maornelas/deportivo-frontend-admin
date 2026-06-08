import ExcelJS from 'exceljs'
import { getSalesReport, getVentasAsesorNames, getIncomeStatement } from '../api/salesReports'
import { getExpenseGastosReport } from '../api/expenses'
import { buildVentasTotals, enrichVentasLines } from './ventasReportTotals'
import { addVentasWorksheet, downloadExcelWorkbook } from './ventasReportExcel'

const BORDER_THIN = { style: 'thin', color: { argb: 'FF9E9E9E' } }
const BORDER_GRID = {
  top: BORDER_THIN,
  left: BORDER_THIN,
  bottom: BORDER_THIN,
  right: BORDER_THIN,
}

function ventasReportTitle(startDateStr, endDateStr, scope) {
  const scopeLabel = scope === 'foraneo' ? 'FORÁNEAS' : 'LOCALES'
  if (!startDateStr || !endDateStr) return `VENTAS ${scopeLabel}`
  const y1 = startDateStr.slice(0, 4)
  const m1 = parseInt(startDateStr.slice(5, 7), 10)
  const y2 = endDateStr.slice(0, 4)
  const m2 = parseInt(endDateStr.slice(5, 7), 10)
  if (y1 === y2 && m1 === m2) {
    const d = new Date(parseInt(y1, 10), m1 - 1, 15)
    const mes = d.toLocaleDateString('es-MX', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())
    return `VENTAS ${scopeLabel} ${mes} del ${y1}`
  }
  return `VENTAS ${scopeLabel} ${startDateStr} al ${endDateStr}`
}

function comisionesReportTitle(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 'COMISIONES TODOS LOS ASESORES'
  const y1 = startDateStr.slice(0, 4)
  const m1 = parseInt(startDateStr.slice(5, 7), 10)
  const y2 = endDateStr.slice(0, 4)
  const m2 = parseInt(endDateStr.slice(5, 7), 10)
  if (y1 === y2 && m1 === m2) {
    const d = new Date(parseInt(y1, 10), m1 - 1, 15)
    const mes = d.toLocaleDateString('es-MX', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())
    return `COMISIONES TODOS LOS ASESORES ${mes} DEL ${y1}`
  }
  return `COMISIONES TODOS LOS ASESORES ${startDateStr} AL ${endDateStr}`
}

function gastosReportTitle(startDateStr, endDateStr) {
  if (!startDateStr || !endDateStr) return 'GASTOS'
  const y1 = startDateStr.slice(0, 4)
  const m1 = parseInt(startDateStr.slice(5, 7), 10)
  const y2 = endDateStr.slice(0, 4)
  const m2 = parseInt(endDateStr.slice(5, 7), 10)
  if (y1 === y2 && m1 === m2) {
    const d = new Date(parseInt(y1, 10), m1 - 1, 15)
    const mes = d.toLocaleDateString('es-MX', { month: 'long' }).replace(/^\w/, (c) => c.toUpperCase())
    return `GASTOS ${mes} ${y1}`
  }
  return `GASTOS ${startDateStr} al ${endDateStr}`
}

function moneyNumber(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isNaN(n) ? null : n
}

function addGastosWorksheet(wb, { title, gastosData }) {
  const ws = wb.addWorksheet('Gastos', { views: [{ showGridLines: true }] })
  const headers = ['Fecha', 'Folio', 'Empleado', 'Concepto', 'Proveedor', 'Monto', 'Monto neto']

  ws.mergeCells('A1:G1')
  const titleCell = ws.getCell('A1')
  titleCell.value = title
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6A1B9A' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 28

  const headerRow = ws.getRow(2)
  headers.forEach((h, i) => {
    const c = headerRow.getCell(i + 1)
    c.value = h
    c.font = { bold: true }
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB3B' } }
    c.border = BORDER_GRID
  })

  const moneyFmt = '"$"#,##0.00'
  let r = 3
  const groups = gastosData?.groups || []
  if (!groups.length) {
    ws.mergeCells(`A${r}:G${r}`)
    ws.getCell(`A${r}`).value = 'Sin filas en el rango seleccionado.'
    ws.getCell(`A${r}`).alignment = { horizontal: 'center' }
  } else {
    for (const g of groups) {
      ws.mergeCells(`A${r}:G${r}`)
      const cat = ws.getRow(r).getCell(1)
      cat.value = g.category
      cat.font = { bold: true }
      cat.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE1BEE7' } }
      cat.border = BORDER_GRID
      r += 1
      for (const row of g.lines || []) {
        const dataRow = ws.getRow(r)
        const vals = [
          row.expenseDate || '—',
          row.expenseNumber || '—',
          row.employeeOrUnit || '—',
          row.concept || '—',
          row.supplier || '—',
          moneyNumber(row.lineSubtotal),
          moneyNumber(row.netLineSubtotal),
        ]
        vals.forEach((val, i) => {
          const cell = dataRow.getCell(i + 1)
          cell.border = BORDER_GRID
          if (i >= 5) {
            if (val != null) {
              cell.value = val
              cell.numFmt = moneyFmt
            } else {
              cell.value = '—'
            }
            cell.alignment = { horizontal: 'right' }
          } else {
            cell.value = val
          }
        })
        r += 1
      }
      const subRow = ws.getRow(r)
      ws.mergeCells(`A${r}:E${r}`)
      subRow.getCell(1).value = `Subtotal ${g.category}`
      subRow.getCell(1).font = { bold: true }
      subRow.getCell(1).alignment = { horizontal: 'right' }
      ;[g.subtotalMonto, g.subtotalMontoNeto].forEach((val, i) => {
        const cell = subRow.getCell(6 + i)
        cell.value = moneyNumber(val)
        cell.numFmt = moneyFmt
        cell.alignment = { horizontal: 'right' }
        cell.font = { bold: true }
        cell.border = BORDER_GRID
      })
      r += 1
    }
    const totalRow = ws.getRow(r)
    ws.mergeCells(`A${r}:E${r}`)
    totalRow.getCell(1).value = 'TOTAL'
    totalRow.getCell(1).font = { bold: true }
    totalRow.getCell(1).alignment = { horizontal: 'right' }
    totalRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCE93D8' } }
    ;[gastosData.totalMonto, gastosData.totalMontoNeto].forEach((val, i) => {
      const cell = totalRow.getCell(6 + i)
      cell.value = moneyNumber(val)
      cell.numFmt = moneyFmt
      cell.alignment = { horizontal: 'right' }
      cell.font = { bold: true }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCE93D8' } }
      cell.border = BORDER_GRID
    })
  }

  ws.columns = [
    { width: 12 },
    { width: 14 },
    { width: 22 },
    { width: 28 },
    { width: 22 },
    { width: 14 },
    { width: 14 },
  ]
}

function addIncomeWorksheet(wb, { startDate, endDate, incomeData }) {
  const ws = wb.addWorksheet('Estado resultados', { views: [{ showGridLines: true }] })
  ws.mergeCells('A1:B1')
  const titleCell = ws.getCell('A1')
  titleCell.value = `ESTADO DE RESULTADOS ${startDate} al ${endDate}`
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6A1B9A' } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 28

  const moneyFmt = '"$"#,##0.00'
  const rows = [
    ['GASTOS DIVERSOS', incomeData?.gastosDiversos],
    ['SUELDOS', incomeData?.sueldos],
    ['TOTAL DE COMPRA', incomeData?.totalCompra],
    ['TOTAL DE BONOS', incomeData?.totalBonos],
    ['TOTAL DE COMISIONES', incomeData?.totalComisiones],
    ['TOTAL DE VENTA', incomeData?.totalVenta],
    ['UTILIDAD BRUTA', incomeData?.utilidadBruta],
    ['UTILIDAD NETA', incomeData?.utilidadNeta],
  ]

  rows.forEach(([label, val], i) => {
    const row = ws.getRow(i + 3)
    const labelCell = row.getCell(1)
    labelCell.value = label
    labelCell.font = { bold: true }
    labelCell.border = BORDER_GRID
    const valCell = row.getCell(2)
    if (val != null) {
      valCell.value = moneyNumber(val)
      valCell.numFmt = moneyFmt
    } else {
      valCell.value = '—'
    }
    valCell.alignment = { horizontal: 'right' }
    valCell.border = BORDER_GRID
    if (label.startsWith('UTILIDAD')) {
      valCell.font = { bold: true, color: { argb: 'FF2E7D32' } }
    }
  })

  ws.getColumn(1).width = 28
  ws.getColumn(2).width = 18
}

/**
 * Descarga un Excel con todas las pestañas de reportería para el rango de fechas.
 * @param {{ startDate: string, endDate: string }} range
 */
export async function downloadReporteriaAllExcel({ startDate, endDate }) {
  if (!startDate || !endDate) {
    return { success: false, error: 'Selecciona fecha inicio y fin.' }
  }

  const [localesR, foraneasR, gastosR, incomeR, advisorsR] = await Promise.all([
    getSalesReport({ kind: 'ventas_detalle', startDate, endDate, salesChannel: 'local' }),
    getSalesReport({ kind: 'ventas_detalle', startDate, endDate, salesChannel: 'foraneo' }),
    getExpenseGastosReport({ startDate, endDate }),
    getIncomeStatement({ startDate, endDate }),
    getVentasAsesorNames({ startDate, endDate }),
  ])

  const errors = []
  if (!localesR.success) errors.push(localesR.error || 'Ventas locales')
  if (!foraneasR.success) errors.push(foraneasR.error || 'Ventas foráneas')
  if (!gastosR.success) errors.push(gastosR.error || 'Gastos')
  if (!incomeR.success) errors.push(incomeR.error || 'Estado de resultados')
  if (errors.length) return { success: false, error: errors.join(' · ') }

  const advisorNames = Array.isArray(advisorsR.data?.advisorNames) ? advisorsR.data.advisorNames : []
  const comisionesResults = await Promise.all(
    advisorNames.map((name) =>
      getSalesReport({
        kind: 'ventas_detalle',
        startDate,
        endDate,
        advisorName: name,
      }),
    ),
  )

  const comisionesLines = enrichVentasLines(
    comisionesResults.flatMap((r) => (r.success ? r.data?.lines || [] : [])),
  )

  const wb = new ExcelJS.Workbook()
  const localesLines = enrichVentasLines(localesR.data?.lines || [])
  const foraneasLines = enrichVentasLines(foraneasR.data?.lines || [])

  addVentasWorksheet(wb, {
    sheetName: 'Ventas locales',
    title: ventasReportTitle(startDate, endDate, 'local'),
    lines: localesLines,
    totals: buildVentasTotals(localesLines),
  })
  addVentasWorksheet(wb, {
    sheetName: 'Ventas foraneas',
    title: ventasReportTitle(startDate, endDate, 'foraneo'),
    lines: foraneasLines,
    totals: buildVentasTotals(foraneasLines),
  })
  addVentasWorksheet(wb, {
    sheetName: 'Comisiones',
    title: comisionesReportTitle(startDate, endDate),
    lines: comisionesLines,
    totals: buildVentasTotals(comisionesLines),
    titleColor: 'FF00897B',
  })
  addGastosWorksheet(wb, {
    title: gastosReportTitle(startDate, endDate),
    gastosData: gastosR.data,
  })
  addIncomeWorksheet(wb, {
    startDate,
    endDate,
    incomeData: incomeR.data,
  })

  const filename = `reporteria_completa_${startDate}_${endDate}.xlsx`
  await downloadExcelWorkbook(wb, filename)
  return { success: true }
}
