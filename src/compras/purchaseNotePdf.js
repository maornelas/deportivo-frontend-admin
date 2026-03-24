import { jsPDF } from 'jspdf'
import { PAYMENT_OPTIONS, STATUS_OPTIONS } from './shared'

const ACCENT = [66, 66, 66]
const GREY = [33, 33, 33]
const MUTED = [117, 117, 117]
const TABLE_BAND = [232, 232, 232]
const SECTION_BAR = [228, 228, 228]
const ROW_ALT = [245, 245, 245]
const DIVIDER = [224, 224, 224]
const PAGE_HEADER_BG = [245, 245, 245]
const PAGE_HEADER_H = 56

const PDF_STORE_ADDRESS = 'Canadá #108 Col Chapalita CP 37340 León Gte.'
const PDF_STORE_HOURS = 'Horario: Lunes a viernes 9:00 am a 2:00 pm y 3:30 a 7:00 pm.'
const PDF_FOOTER_DISCLAIMER =
  'Documento generado por El Deportivo Autopartes. Nota interna de compra a proveedor.'

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 36
const CONTENT_W = PAGE_W - MARGIN * 2
const FOOTER_BLOCK_H = 52

function fmtMoney(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n) || 0)
}

function dash(v) {
  const s = String(v ?? '').trim()
  return s || '—'
}

function purchaseFolio(id) {
  const s = String(id || '').replace(/-/g, '')
  return (s.slice(0, 8) || 'NUEVA').toUpperCase()
}

function paymentLabel(value) {
  return PAYMENT_OPTIONS.find((o) => o.value === value)?.label || dash(value)
}

function statusLabel(value) {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label || dash(value)
}

function partTypeLabel(v) {
  return v === 'GENÉRICO' ? 'Genérica' : 'Original'
}

function partConditionLabel(v) {
  return v === 'SEMINUEVO' ? 'Seminueva' : 'Nuevo'
}

function lineSubtotal(l) {
  const q = Math.max(1, parseInt(l.quantity, 10) || 1)
  return Math.round(Number(l.unitPrice || 0) * q * 100) / 100
}

function parsePurchaseDate(purchaseDate) {
  if (!purchaseDate) return new Date()
  const s = String(purchaseDate)
  const d = s.length <= 10 ? new Date(`${s}T12:00:00`) : new Date(s)
  return Number.isNaN(d.getTime()) ? new Date() : d
}

function drawFooterAnchoredBottom(doc, x, w, marginBottom) {
  const cx = x + w / 2
  const blocks = [
    { text: PDF_STORE_ADDRESS, size: 7.5, color: MUTED },
    { text: PDF_STORE_HOURS, size: 7.5, color: MUTED },
    { text: PDF_FOOTER_DISCLAIMER, size: 7.5, color: [158, 158, 158] },
  ]
  let totalH = 0
  doc.setFont('helvetica', 'normal')
  for (const b of blocks) {
    doc.setFontSize(b.size)
    const lines = doc.splitTextToSize(b.text, w)
    totalH += lines.length * (b.size * 1.15) + 4
  }
  let yy = PAGE_H - marginBottom - totalH
  for (const b of blocks) {
    doc.setFontSize(b.size)
    doc.setTextColor(...b.color)
    const lines = doc.splitTextToSize(b.text, w)
    doc.text(lines, cx, yy, { baseline: 'top', align: 'center' })
    yy += lines.length * (b.size * 1.15) + 4
  }
  doc.setTextColor(0, 0, 0)
}

function drawFullWidthSectionBar(doc, x, y, w, title) {
  const h = 18
  doc.setFillColor(...SECTION_BAR)
  doc.rect(x, y, w, h, 'F')
  doc.setDrawColor(...DIVIDER)
  doc.setLineWidth(0.35)
  doc.rect(x, y, w, h, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.8)
  doc.setTextColor(...GREY)
  doc.text(String(title).toUpperCase(), x + 8, y + 5, { baseline: 'top' })
  doc.setTextColor(0, 0, 0)
  return y + h + 8
}

/**
 * Sub-tabla 2 columnas (etiqueta | valor), estilo cotización.
 */
function drawMinimalTwoColumnTable(doc, x, y, w, subsectionTitle, rows, labelColRatio = 0.38) {
  const labelW = Math.floor(w * labelColRatio)
  const valueW = w - labelW
  const padX = 5
  const padY = 2
  const subBandH = 12
  const bodyFontSize = 6.2
  let cursor = y

  const drawSubBand = (title) => {
    doc.setFillColor(...TABLE_BAND)
    doc.rect(x, cursor, w, subBandH, 'F')
    doc.setDrawColor(...DIVIDER)
    doc.setLineWidth(0.25)
    doc.rect(x, cursor, w, subBandH, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(6.4)
    doc.setTextColor(...GREY)
    doc.text(String(title).toUpperCase(), x + 4, cursor + 3, { baseline: 'top' })
    doc.setTextColor(0, 0, 0)
    cursor += subBandH + 2
  }

  drawSubBand(subsectionTitle)

  let idx = 0
  for (const row of rows) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(bodyFontSize)
    const labelLines = doc.splitTextToSize(row.label, labelW - padX * 2)
    const valueLines = doc.splitTextToSize(row.value || '—', valueW - padX * 2)
    const lh = labelLines.length * bodyFontSize * 1.2
    const vh = valueLines.length * bodyFontSize * 1.2
    const rowH = Math.max(9, lh, vh) + padY * 2

    if (cursor + rowH > PAGE_H - FOOTER_BLOCK_H - 80) {
      doc.addPage()
      cursor = MARGIN
      drawSubBand(`${subsectionTitle} (cont.)`)
    }

    const fill = idx % 2 === 0 ? ROW_ALT : [255, 255, 255]
    doc.setFillColor(...fill)
    doc.rect(x, cursor, w, rowH, 'F')

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(bodyFontSize)
    doc.setTextColor(...GREY)
    doc.text(labelLines, x + padX, cursor + padY, { baseline: 'top' })
    doc.text(valueLines, x + labelW + padX, cursor + padY, { baseline: 'top' })
    doc.setTextColor(0, 0, 0)
    cursor += rowH

    doc.setDrawColor(...DIVIDER)
    doc.setLineWidth(0.35)
    doc.line(x, cursor, x + w, cursor)
    idx += 1
  }

  return cursor
}

/**
 * Genera y descarga el PDF de nota de compra (formato alineado a cotización).
 * @param {object} purchase — objeto guardado en contexto (id, providerName, purchaseDate, items, …)
 * @param {{ subtotal: number, tax: number, total: number }} totals
 * @param {{ registeredByDisplayName?: string }} [options]
 */
export function downloadPurchaseNotePdf(purchase, totals, options = {}) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter', compress: true })
  const folio = purchaseFolio(purchase.id)
  const fechaLarga = parsePurchaseDate(purchase.purchaseDate).toLocaleDateString('es-MX', {
    dateStyle: 'long',
  })
  const registeredBy = dash(
    (options.registeredByDisplayName || '').trim() ||
      [purchase.registeredByFirstName, purchase.registeredByLastName].filter(Boolean).join(' '),
  )

  const vehBrand = dash(purchase.vehicleBrand)
  const vehModel = dash(purchase.vehicleModel)
  const vehYear = dash(purchase.vehicleYear)

  const compraRows = [
    { label: 'Fecha de compra', value: fechaLarga },
    { label: 'Método de pago', value: paymentLabel(purchase.paymentMethod) },
    { label: 'Estado', value: statusLabel(purchase.status) },
    { label: 'Registró', value: registeredBy },
  ]
  const proveedorRows = [
    { label: 'Proveedor', value: dash(purchase.providerName) },
    { label: 'Notas', value: (purchase.notes || '').trim() || '—' },
    { label: 'Comprobante (archivo)', value: dash(purchase.receiptFileName) },
  ]
  const vehRows = [
    { label: 'Marca', value: vehBrand },
    { label: 'Modelo', value: vehModel },
    { label: 'Año', value: vehYear },
  ]

  doc.setFillColor(...PAGE_HEADER_BG)
  doc.rect(0, 0, PAGE_W, PAGE_HEADER_H, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...GREY)
  doc.text('EL DEPORTIVO', MARGIN, 22, { baseline: 'top' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text('AUTOPARTES', MARGIN, 38, { baseline: 'top' })
  doc.setTextColor(0, 0, 0)

  const rightX = PAGE_W - MARGIN
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(...GREY)
  doc.text('NOTA DE COMPRA', rightX, 9, { align: 'right', baseline: 'top' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text('Folio', rightX, 22, { align: 'right', baseline: 'top' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...GREY)
  doc.text(folio, rightX, 31, { align: 'right', baseline: 'top' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text(`Fecha: ${fechaLarga}`, rightX, 42, { align: 'right', baseline: 'top' })
  doc.setTextColor(0, 0, 0)

  let y = PAGE_HEADER_H + 10

  y = drawFullWidthSectionBar(doc, MARGIN, y, CONTENT_W, 'Datos de la compra')

  const colGap = 8
  const colW = Math.floor((CONTENT_W - 2 * colGap) / 3)
  const xCompra = MARGIN
  const xProv = MARGIN + colW + colGap
  const xVeh = MARGIN + 2 * (colW + colGap)

  const yBlockStart = y
  const yCompra = drawMinimalTwoColumnTable(doc, xCompra, yBlockStart, colW, 'Compra', compraRows)
  const yProv = drawMinimalTwoColumnTable(doc, xProv, yBlockStart, colW, 'Proveedor', proveedorRows)
  const yVeh = drawMinimalTwoColumnTable(doc, xVeh, yBlockStart, colW, 'Vehículo', vehRows)
  y = Math.max(yCompra, yProv, yVeh) + 10

  y = drawFullWidthSectionBar(doc, MARGIN, y, CONTENT_W, 'Piezas adquiridas')

  const tableLeft = MARGIN
  const tableRight = PAGE_W - MARGIN
  const wProd = 200
  const wSku = 72
  const wTipo = 58
  const wEst = 52
  const wCant = 36
  const wUnit = 54
  const wSub = 54
  const xProd = tableLeft
  const xSku = xProd + wProd
  const xTipo = xSku + wSku
  const xEst = xTipo + wTipo
  const xCant = xEst + wEst
  const xUnit = xCant + wCant
  const xSub = xUnit + wUnit

  const drawItemsHeader = (yy) => {
    const headerH = 15
    doc.setFillColor(...TABLE_BAND)
    doc.rect(tableLeft, yy, tableRight - tableLeft, headerH, 'F')
    doc.setDrawColor(...DIVIDER)
    doc.setLineWidth(0.35)
    doc.rect(tableLeft, yy, tableRight - tableLeft, headerH, 'S')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5.9)
    doc.setTextColor(...GREY)
    const hy = yy + 4
    doc.text('PRODUCTO', xProd + 3, hy, { baseline: 'top' })
    doc.text('SKU', xSku + 2, hy, { baseline: 'top' })
    doc.text('TIPO', xTipo + 1, hy, { width: wTipo - 2, align: 'center', baseline: 'top' })
    doc.text('ESTADO', xEst + 1, hy, { width: wEst - 2, align: 'center', baseline: 'top' })
    doc.text('CANT.', xCant, hy, { width: wCant, align: 'center', baseline: 'top' })
    doc.text('P. UNIT.', xUnit + 1, hy, { width: wUnit - 2, align: 'right', baseline: 'top' })
    doc.text('SUBTOTAL', xSub + 1, hy, { width: wSub - 2, align: 'right', baseline: 'top' })
    doc.setTextColor(0, 0, 0)
    return yy + headerH
  }

  y = drawItemsHeader(y)

  const items = purchase.items || []
  let rowIndex = 0
  for (const it of items) {
    const name = String(it.productName || '').trim().slice(0, 120)
    const sku = String(it.sku || '').trim() || '—'
    const tipo = partTypeLabel(it.partType)
    const estado = partConditionLabel(it.partCondition)
    const qty = String(Math.max(1, parseInt(it.quantity, 10) || 1))
    const unit = fmtMoney(it.unitPrice)
    const sub = fmtMoney(lineSubtotal(it))

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.2)
    doc.setTextColor(...GREY)
    const hName = doc.splitTextToSize(name, wProd - 6).length * 6.2 * 1.15
    const rowH = Math.max(12, hName) + 4

    if (y + rowH > PAGE_H - FOOTER_BLOCK_H - 100) {
      doc.addPage()
      y = MARGIN
      y = drawFullWidthSectionBar(doc, MARGIN, y, CONTENT_W, 'Piezas adquiridas (cont.)')
      y = drawItemsHeader(y)
    }

    const fill = rowIndex % 2 === 0 ? ROW_ALT : [255, 255, 255]
    doc.setFillColor(...fill)
    doc.rect(tableLeft, y - 2, tableRight - tableLeft, rowH + 2, 'F')

    doc.setFontSize(6.5)
    const nameLines = doc.splitTextToSize(name, wProd - 6)
    doc.text(nameLines, xProd + 3, y, { baseline: 'top' })
    doc.setFontSize(6.2)
    doc.text(sku, xSku + 2, y, { width: wSku - 4, baseline: 'top' })
    doc.text(tipo, xTipo + 1, y, { width: wTipo - 2, align: 'center', baseline: 'top' })
    doc.text(estado, xEst + 1, y, { width: wEst - 2, align: 'center', baseline: 'top' })
    doc.text(qty, xCant, y, { width: wCant, align: 'center', baseline: 'top' })
    doc.text(unit, xUnit + 1, y, { width: wUnit - 2, align: 'right', baseline: 'top' })
    doc.text(sub, xSub + 1, y, { width: wSub - 2, align: 'right', baseline: 'top' })
    doc.setTextColor(0, 0, 0)
    y += rowH

    doc.setDrawColor(...DIVIDER)
    doc.setLineWidth(0.35)
    doc.line(tableLeft, y, tableRight, y)
    rowIndex += 1
  }

  y += 8
  const totalsNeeded = 118
  if (y + totalsNeeded + FOOTER_BLOCK_H > PAGE_H - MARGIN) {
    doc.addPage()
    y = MARGIN
  }

  y = drawFullWidthSectionBar(doc, MARGIN, y, CONTENT_W, 'Resumen')

  const totalsW = 220
  const totalsX = tableRight - totalsW
  y += 4
  doc.setDrawColor(...DIVIDER)
  doc.setLineWidth(0.35)
  doc.roundedRect(totalsX - 8, y - 4, totalsW + 8, 82, 2, 2, 'S')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...MUTED)
  doc.text('Subtotal:', totalsX, y, { width: 90, align: 'right', baseline: 'top' })
  doc.setTextColor(...GREY)
  doc.text(fmtMoney(totals.subtotal), totalsX + 96, y, { width: totalsW - 104, align: 'right', baseline: 'top' })
  y += 13
  doc.setTextColor(...MUTED)
  doc.text('IVA (16%):', totalsX, y, { width: 90, align: 'right', baseline: 'top' })
  doc.setTextColor(...GREY)
  doc.text(fmtMoney(totals.tax), totalsX + 96, y, { width: totalsW - 104, align: 'right', baseline: 'top' })
  y += 16
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10.5)
  doc.setTextColor(...ACCENT)
  doc.text('Total:', totalsX, y, { width: 90, align: 'right', baseline: 'top' })
  doc.text(fmtMoney(totals.total), totalsX + 96, y, { width: totalsW - 104, align: 'right', baseline: 'top' })
  doc.setTextColor(0, 0, 0)

  drawFooterAnchoredBottom(doc, MARGIN, CONTENT_W, MARGIN)

  const safeFile = `nota-compra-${folio}`.replace(/[^\w.-]+/g, '_')
  doc.save(`${safeFile}.pdf`)
}
