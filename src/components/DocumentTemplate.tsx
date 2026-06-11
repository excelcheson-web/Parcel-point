'use client'

import { useEffect } from 'react'
import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import type { DocumentConfig } from '@/lib/types'
import { getCurrencySymbolForPdf, getCurrencyWords as getSharedCurrencyWords } from '@/lib/currency'

interface Props {
  data: DocumentConfig
  onComplete?: (pdfUrl: string) => void
}

type Rgb = [number, number, number]

interface BrandTheme {
  primary: Rgb
  secondary: Rgb
  accent: Rgb
  border: Rgb
  text: Rgb
  muted: Rgb
  paper: Rgb
}

const DEFAULT_THEME: BrandTheme = {
  primary: [124, 58, 237],
  secondary: [7, 20, 39],
  accent: [248, 250, 252],
  border: [214, 222, 234],
  text: [15, 23, 42],
  muted: [100, 116, 139],
  paper: [255, 255, 255],
}

// ── COLOUR UTILITIES ──────────────────────────────────────────────────────────
function clamp(v: number): number { return Math.max(0, Math.min(255, Math.round(v))) }
function mixRgb(a: Rgb, b: Rgb, r: number): Rgb {
  return [clamp(a[0]+(b[0]-a[0])*r), clamp(a[1]+(b[1]-a[1])*r), clamp(a[2]+(b[2]-a[2])*r)]
}
function darken(c: Rgb, r: number): Rgb { return mixRgb(c, [0,0,0], r) }
function lighten(c: Rgb, r: number): Rgb { return mixRgb(c, [255,255,255], r) }
function luminance([r,g,b]: Rgb): number { return (0.2126*r + 0.7152*g + 0.0722*b) / 255 }
function contrastColor(bg: Rgb): Rgb { return luminance(bg) > 0.45 ? [10,10,10] : [255,255,255] }
function applyText(pdf: jsPDF, c: Rgb) { pdf.setTextColor(c[0],c[1],c[2]) }
function applyFill(pdf: jsPDF, c: Rgb) { pdf.setFillColor(c[0],c[1],c[2]) }
function applyDraw(pdf: jsPDF, c: Rgb) { pdf.setDrawColor(c[0],c[1],c[2]) }

function hexToRgb(hex: string | undefined, fallback: Rgb): Rgb {
  if (!hex) return fallback
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return fallback
  return [parseInt(clean.slice(0,2),16), parseInt(clean.slice(2,4),16), parseInt(clean.slice(4,6),16)]
}

function statusBadgeColors(status: string): { bg: Rgb; fg: Rgb; label: string } {
  switch (status) {
    case 'PAID':         return { bg: [16,185,129],  fg: [255,255,255], label: 'PAID' }
    case 'PENDING':      return { bg: [245,158,11],  fg: [255,255,255], label: 'PENDING' }
    case 'PART_PAYMENT': return { bg: [59,130,246],  fg: [255,255,255], label: 'PART PAID' }
    case 'FAILED':       return { bg: [239,68,68],   fg: [255,255,255], label: 'FAILED' }
    case 'REFUNDED':     return { bg: [139,92,246],  fg: [255,255,255], label: 'REFUNDED' }
    case 'CANCELLED':    return { bg: [107,114,128], fg: [255,255,255], label: 'CANCELLED' }
    default:             return { bg: [156,163,175], fg: [255,255,255], label: status }
  }
}

function toStandardReceiptTheme(base: BrandTheme): BrandTheme {
  const primary = base.primary
  const brandDark = darken(primary, luminance(primary) > 0.45 ? 0.72 : 0.42)
  return {
    primary,
    secondary: mixRgb(DEFAULT_THEME.secondary, brandDark, 0.2),
    accent: mixRgb(DEFAULT_THEME.accent, lighten(primary, 0.88), 0.45),
    border: mixRgb(DEFAULT_THEME.border, primary, 0.14),
    text: DEFAULT_THEME.text,
    muted: DEFAULT_THEME.muted,
    paper: DEFAULT_THEME.paper,
  }
}

// ── ADAPTIVE FONT SIZE ────────────────────────────────────────────────────────
function fitFontSize(pdf: jsPDF, text: string, maxW: number, startSz: number, minSz = 7): number {
  for (let sz = startSz; sz >= minSz; sz -= 0.5) {
    pdf.setFontSize(sz)
    if (pdf.getTextWidth(text) <= maxW) return sz
  }
  pdf.setFontSize(minSz)
  return minSz
}

// ── RECEIPT NUMBER FROM COMPANY INITIALS ──────────────────────────────────────
export function buildReceiptNumber(companyName: string): string {
  const initials = (companyName || 'RCP').trim()
    .split(/\s+/).filter(w => /\w/.test(w)).map(w => w[0].toUpperCase()).slice(0, 4).join('') || 'RCP'
  return `${initials}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
}

// ── QR + BARCODE ──────────────────────────────────────────────────────────────
async function makeQrDataURL(text: string): Promise<string | null> {
  if (!text) return null
  try {
    return await QRCode.toDataURL(text, { width: 128, margin: 1, color: { dark: '#000000', light: '#ffffff' } })
  } catch { return null }
}

async function makeBarcodeDataURL(value: string): Promise<string | null> {
  if (!value) return null
  try {
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, value.slice(0, 40), {
      format: 'CODE128', width: 2, height: 48, displayValue: false,
      background: '#ffffff', lineColor: '#000000'
    })
    return canvas.toDataURL('image/png')
  } catch { return null }
}

// ── IMAGE LOADING ─────────────────────────────────────────────────────────────
async function loadImg(path: string): Promise<string | null> {
  if (!path) return null
  if (path.startsWith('data:image')) return path
  try {
    const res = await fetch(path)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => reject(new Error('read error'))
      reader.readAsDataURL(blob)
    })
  } catch { return null }
}

async function makeWatermark(path: string, opacity: number): Promise<string | null> {
  const src = await loadImg(path)
  if (!src) return null
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width; canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(null); return }
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.globalAlpha = opacity
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// ── LOGO-DRIVEN THEME ─────────────────────────────────────────────────────────
async function deriveTheme(
  logoPath: string | undefined,
  primaryHex?: string,
  secondaryHex?: string
): Promise<BrandTheme> {
  // Custom brand colors take priority
  if (primaryHex) {
    const primary = hexToRgb(primaryHex, DEFAULT_THEME.primary)
    const secondary = secondaryHex
      ? hexToRgb(secondaryHex, DEFAULT_THEME.secondary)
      : darken(primary, luminance(primary) > 0.45 ? 0.65 : 0.42)
    const accent = lighten(primary, 0.85)
    const border = mixRgb(primary, secondary, 0.35)
    const paper = lighten(primary, 0.93)
    const text: Rgb = [15,23,42]
    const muted: Rgb = [100,116,139]
    return { primary, secondary, accent, border, text, muted, paper }
  }
  if (!logoPath) return DEFAULT_THEME
  const src = await loadImg(logoPath)
  if (!src) return DEFAULT_THEME
  const sampled = await new Promise<Rgb | null>(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 64; canvas.height = 64
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(null); return }
      ctx.drawImage(img, 0, 0, 64, 64)
      const data = ctx.getImageData(0, 0, 64, 64).data
      const buckets = new Map<string, {count:number,r:number,g:number,b:number,sat:number}>()
      for (let i = 0; i < data.length; i += 4) {
        if (data[i+3] < 180) continue
        const r=data[i], g=data[i+1], b=data[i+2]
        if (r>245 && g>245 && b>245) continue
        if (r<15 && g<15 && b<15) continue
        const max=Math.max(r,g,b), min=Math.min(r,g,b)
        const sat = max===0 ? 0 : (max-min)/max
        const lum = luminance([r,g,b])
        if (lum < 0.07 || lum > 0.93) continue
        const key = `${Math.round(r/20)}-${Math.round(g/20)}-${Math.round(b/20)}`
        const ex = buckets.get(key)
        if (ex) { ex.count++; ex.r+=r; ex.g+=g; ex.b+=b; ex.sat+=sat }
        else buckets.set(key, {count:1, r, g, b, sat})
      }
      if (buckets.size === 0) { resolve(null); return }
      let bestKey='', bestScore=-1
      buckets.forEach((v,k) => {
        const score = v.count * (1 + (v.sat/v.count) * 1.5)
        if (score > bestScore) { bestScore=score; bestKey=k }
      })
      const sel = buckets.get(bestKey)
      if (!sel) { resolve(null); return }
      resolve([clamp(sel.r/sel.count), clamp(sel.g/sel.count), clamp(sel.b/sel.count)])
    }
    img.onerror = () => resolve(null)
    img.src = src
  })
  if (!sampled) return DEFAULT_THEME
  const primary = sampled
  const lum = luminance(primary)
  const secondary = lum > 0.45 ? darken(primary, 0.65) : darken(primary, 0.38)
  const accent = lighten(primary, 0.82)
  const border = mixRgb(primary, secondary, 0.42)
  const paper = lighten(primary, 0.94)
  const text = darken(secondary, 0.12)
  const muted = mixRgb(text, [255,255,255], 0.35)
  return { primary, secondary, accent, border, paper, text, muted }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function getCurrencySymbol(cur: string|undefined): string { return getCurrencySymbolForPdf(cur) }
function getCurrencyWords(cur: string|undefined): {major:string,minor:string} { return getSharedCurrencyWords(cur) }
function convertUnder100(n: number): string {
  const ones=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten',
    'Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
  const tens=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
  if (n<20) return ones[n]
  return n%10 ? `${tens[Math.floor(n/10)]}-${ones[n%10]}` : tens[Math.floor(n/10)]
}
function convertUnder1000(n: number): string {
  if (n<100) return convertUnder100(n)
  const rem=n%100
  return rem ? `${convertUnder100(Math.floor(n/100))} Hundred and ${convertUnder100(rem)}`
             : `${convertUnder100(Math.floor(n/100))} Hundred`
}
function integerToWords(n: number): string {
  if (n===0) return 'Zero'
  const scales=['','Thousand','Million','Billion']
  const parts: string[]=[], chunks: number[]=[]
  let rem=n, si=0
  while (rem>0) {
    const chunk=rem%1000
    if (chunk>0) {
      const w=convertUnder1000(chunk)
      parts.unshift(scales[si] ? `${w} ${scales[si]}` : w)
      chunks.unshift(chunk)
    }
    rem=Math.floor(rem/1000); si++
  }
  if (parts.length>1 && chunks[chunks.length-1]<100) {
    return `${parts.slice(0,-1).join(' ')} and ${parts[parts.length-1]}`
  }
  return parts.join(' ')
}
function numberToWords(amount: number, cur: string|undefined): string {
  const cw=getCurrencyWords(cur)
  if (!Number.isFinite(amount) || amount<0) return `Zero ${cw.major} Only`
  const major=Math.floor(amount), minor=Math.round((amount-major)*100)
  return minor>0
    ? `${integerToWords(major)} ${cw.major} and ${integerToWords(minor)} ${cw.minor} Only`
    : `${integerToWords(major)} ${cw.major} Only`
}
function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})
}
function safeWrap(pdf: jsPDF, text: string, maxW: number): string[] {
  const t = (text||'').trim() || '-'
  return pdf.splitTextToSize(t, Math.max(10, maxW)) as string[]
}

function fitLine(pdf: jsPDF, text: string, maxW: number): string {
  const clean = (text || '').trim() || '-'
  if (pdf.getTextWidth(clean) <= maxW) return clean
  const suffix = '...'
  let out = clean
  while (out.length > 1 && pdf.getTextWidth(out + suffix) > maxW) out = out.slice(0, -1)
  return `${out.trimEnd()}${suffix}`
}

function limitedLines(pdf: jsPDF, text: string, maxW: number, maxLines: number): string[] {
  const wrapped = safeWrap(pdf, text, maxW)
  const lines = wrapped.slice(0, maxLines).map((line) => fitLine(pdf, line, maxW))
  if (wrapped.length > maxLines && lines.length > 0) {
    lines[lines.length - 1] = fitLine(pdf, lines[lines.length - 1], maxW)
  }
  return lines
}

function textBlockHeight(lines: string[], lineHeight: number): number {
  return Math.max(lineHeight, lines.length * lineHeight)
}

function drawCenteredFooter(
  pdf: jsPDF,
  footerText: string,
  theme: BrandTheme,
  pw: number,
  ph: number,
  margin: number,
  fallback: string
) {
  const text = footerText || fallback
  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'italic')
  applyText(pdf, theme.muted)
  const lines = limitedLines(pdf, text, pw - margin * 2, 2)
  const lh = 3.2
  const startY = ph - 5.5 - (lines.length - 1) * lh
  pdf.text(lines, pw / 2, startY, { align: 'center' })
}
function addWatermark(pdf: jsPDF, wm: string|null, pw: number, ph: number) {
  if (!wm) return
  try { const sz=120; pdf.addImage(wm,'PNG',pw/2-sz/2,ph/2-sz/2,sz,sz) } catch {}
}
async function addLogo(pdf: jsPDF, logoData: string|null, theme: BrandTheme, lx: number, ly: number, lw: number, lh: number, companyName='') {
  if (logoData && !logoData.startsWith('data:image/svg')) {
    try { pdf.addImage(logoData, logoData.includes('png')?'PNG':'JPEG', lx, ly, lw, lh); return } catch {}
  }
  applyFill(pdf, theme.secondary)
  pdf.roundedRect(lx, ly, lw, lh, 3, 3, 'F')
  applyText(pdf, [255,255,255])
  const initials = companyName.trim().split(/\s+/).map(w=>w[0]?.toUpperCase()||'').slice(0,2).join('') || 'CO'
  fitFontSize(pdf, initials, lw-2, Math.min(lw*0.55, 14), 6)
  pdf.setFont('helvetica','bold')
  pdf.text(initials, lx+lw/2, ly+lh/2+pdf.getFontSize()*0.18, {align:'center'})
}

// ── SHARED DATA PREP ──────────────────────────────────────────────────────────
function prepareData(data: DocumentConfig) {
  const sym = getCurrencySymbol(data.currency)
  const taxRate = typeof data.taxRate==='number' ? data.taxRate : 0
  let subtotal = 0
  const items = (data.items||[]).map(item => {
    const total = item.quantity * (item.price||0)
    subtotal += total
    return { ...item, total }
  })
  const tax = subtotal * (taxRate/100)
  const grandTotal = subtotal + tax
  const paid = typeof data.paid==='number' ? data.paid : 0
  const balance = grandTotal - paid
  const companyName = (data.companyName||'Company Name').trim()
  const rcpNum = (data.receiptNumber||'').trim() || buildReceiptNumber(companyName)
  return {
    sym, taxRate, items, subtotal, tax, grandTotal, paid, balance,
    amountInWords: numberToWords(grandTotal, data.currency),
    companyName,
    companyCaption: (data.companyCaption||'').trim(),
    companyWebsite: (data.companyWebsite||'').trim(),
    companyAddress: (data.companyAddress||'').trim() || 'Not provided',
    companyPhone: (data.companyPhone||'').trim() || 'Not provided',
    companyEmail: (data.companyEmail||'').trim() || 'Not provided',
    customerName: (data.customerName||'Customer').trim() || 'Customer',
    customerPhone: (data.customerPhone||'').trim(),
    customerEmail: (data.customerEmail||'').trim(),
    customerAddress: (data.customerAddress||'').trim() || 'Not provided',
    receiptNumber: rcpNum,
    issueDate: data.dateOfIssue || formatDate(new Date()),
    paymentDate: (data.paymentDate||'').trim(),
    paymentMethod: data.paymentMethod || 'Not provided',
    transactionRef: (data.transactionReference||'').trim(),
    orderNumber: (data.orderNumber||'').trim(),
    invoiceNumber: (data.invoiceNumber||'').trim(),
    currency: data.currency || 'USD',
    notes: (data.notes||'Payment is due as agreed. Please include receipt number on all payments.').trim(),
    terms: (data.receiptTerms||'').trim(),
    memo: (data.receiptDescription||data.description||'-').trim(),
    transferMode: (data.transferMode||'Bank Transfer').trim(),
    signeeName: (data.signeeName||'Authorized Signatory').trim(),
    footerMessage: (data.footerMessage||'').trim(),
    generatedBy: (data.generatedBy||'').trim(),
    paymentStatus: (data.paymentStatus||'').trim(),
  }
}

// Draws a small payment-status badge and returns the badge height used
function drawStatusBadge(pdf: jsPDF, status: string, x: number, y: number): number {
  if (!status) return 0
  const badge = statusBadgeColors(status)
  const label = badge.label
  pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5)
  const tw = pdf.getTextWidth(label)
  const bw = tw + 8, bh = 7
  applyFill(pdf, badge.bg); pdf.roundedRect(x, y, bw, bh, 1.5, 1.5, 'F')
  applyText(pdf, badge.fg)
  pdf.text(label, x + bw/2, y + bh*0.68, {align:'center'})
  return bh + 3
}

// Shared footer with QR + barcode ─────────────────────────────────────────────
async function drawQrBarFooter(
  pdf: jsPDF, d: ReturnType<typeof prepareData>, data: DocumentConfig,
  theme: BrandTheme, m: number, cw: number, y: number
): Promise<number> {
  const pw = pdf.internal.pageSize.getWidth()
  const qrVal = d.transactionRef || d.receiptNumber
  const barVal = d.receiptNumber

  let qrImg: string | null = null
  let barImg: string | null = null
  try { qrImg = await makeQrDataURL(qrVal) } catch {}
  try { barImg = await makeBarcodeDataURL(barVal) } catch {}

  if (!qrImg && !barImg) return y

  const qrSize = 18
  const barH = 12

  if (qrImg && barImg) {
    // QR left, barcode fills rest
    try { pdf.addImage(qrImg, 'PNG', m, y, qrSize, qrSize) } catch {}
    pdf.setFontSize(5.5); applyText(pdf, theme.muted); pdf.setFont('helvetica','normal')
    pdf.text('Scan to verify', m + qrSize/2, y + qrSize + 2.5, {align:'center'})
    const barX = m + qrSize + 5, barW = cw - qrSize - 5
    try { pdf.addImage(barImg, 'PNG', barX, y + (qrSize - barH)/2, barW, barH) } catch {}
    pdf.setFontSize(5.5)
    pdf.text(barVal.slice(0,35), barX + barW/2, y + (qrSize + barH)/2 + 5, {align:'center'})
    return y + qrSize + 7
  } else if (qrImg) {
    try { pdf.addImage(qrImg, 'PNG', m, y, qrSize, qrSize) } catch {}
    pdf.setFontSize(5.5); applyText(pdf, theme.muted)
    pdf.text('Scan to verify', m + qrSize/2, y + qrSize + 2.5, {align:'center'})
    return y + qrSize + 7
  } else if (barImg) {
    try { pdf.addImage(barImg, 'PNG', m, y, cw, barH) } catch {}
    pdf.setFontSize(5.5); applyText(pdf, theme.muted)
    pdf.text(barVal.slice(0,40), pw/2, y + barH + 3, {align:'center'})
    return y + barH + 7
  }
  return y
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// FORMAT 1 — PREMIUM CORPORATE (classic)
// Accent header band · Labelled party blocks · Dark table · Status badge
// ╚══════════════════════════════════════════════════════════════════════════════╝
async function generateClassicPDF(data: DocumentConfig, theme: BrandTheme, logoData: string|null, wm: string|null): Promise<jsPDF> {
  const pdf = new jsPDF({unit:'mm', format:'a4'})
  const pw=pdf.internal.pageSize.getWidth(), ph=pdf.internal.pageSize.getHeight()
  const m=14, cw=pw-m*2
  const d=prepareData(data)

  applyFill(pdf, theme.paper); pdf.rect(0,0,pw,ph,'F')
  applyFill(pdf, theme.primary); pdf.rect(0,0,pw,2.5,'F')
  addWatermark(pdf, wm, pw, ph)

  // ── HEADER BAND ──
  const hY=6, hH=30
  applyFill(pdf, theme.accent); pdf.rect(m, hY, cw, hH, 'F')
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.rect(m, hY, cw, hH)
  applyFill(pdf, theme.primary); pdf.rect(m, hY, 4, hH, 'F')
  await addLogo(pdf, logoData, theme, m+6, hY+4, 22, 20, d.companyName)

  const nameMaxW = cw - 106
  pdf.setFont('helvetica', 'bold')
  fitFontSize(pdf, d.companyName, nameMaxW, 14, 8)
  applyText(pdf, theme.secondary)
  pdf.text(fitLine(pdf, d.companyName, nameMaxW), m+32, hY+9)

  if (d.companyCaption) {
    pdf.setFont('helvetica','italic'); pdf.setFontSize(7); applyText(pdf, theme.muted)
    pdf.text(safeWrap(pdf, d.companyCaption, nameMaxW+20).slice(0,1), m+32, hY+14)
  }

  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); applyText(pdf, theme.text)
  const contactLine = [d.companyPhone, d.companyEmail, d.companyWebsite].filter(Boolean).join('  ·  ')
  pdf.text(safeWrap(pdf, contactLine, nameMaxW+20).slice(0,1), m+32, hY+18.5)
  pdf.text(safeWrap(pdf, d.companyAddress, nameMaxW+20).slice(0,1), m+32, hY+23)

  const titleColor: Rgb = luminance(theme.primary) < 0.45 ? lighten(theme.primary, 0.15) : darken(theme.primary, 0.18)
  applyText(pdf, titleColor); pdf.setFont('helvetica','bold'); pdf.setFontSize(22)
  pdf.text('RECEIPT', pw-m-3, hY+11, {align:'right'})
  pdf.setFontSize(8); applyText(pdf, theme.text); pdf.setFont('helvetica','normal')
  pdf.text(fitLine(pdf, `No. ${d.receiptNumber}`, 58), pw-m-3, hY+18, {align:'right'})
  pdf.text(`Date: ${d.issueDate}`, pw-m-3, hY+24, {align:'right'})

  // ── PARTY BLOCKS ──
  let y=42
  const bH=44, half=cw/2
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3)
  pdf.rect(m, y, cw, bH)
  pdf.line(m+half, y, m+half, y+bH)
  applyFill(pdf, theme.secondary)
  pdf.rect(m, y, half, 8, 'F')
  pdf.rect(m+half, y, half, 8, 'F')
  applyText(pdf, contrastColor(theme.secondary)); pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5)
  pdf.text('FROM', m+4, y+5.5)
  pdf.text('BILL TO', m+half+4, y+5.5)

  const bt=y+11; applyText(pdf, theme.text); pdf.setFontSize(8)
  const lw=half-5, lx=m+4, rx=m+half+4

  pdf.setFont('helvetica','bold'); pdf.text('Company:', lx, bt)
  pdf.setFont('helvetica','normal'); pdf.text(safeWrap(pdf, d.companyName, lw-22).slice(0,1), lx+22, bt)
  pdf.setFont('helvetica','bold'); pdf.text('Address:', lx, bt+8)
  pdf.setFont('helvetica','normal'); pdf.text(safeWrap(pdf, d.companyAddress, lw-22).slice(0,2), lx+22, bt+8)
  pdf.setFont('helvetica','bold'); pdf.text('Phone:', lx, bt+17)
  pdf.setFont('helvetica','normal'); pdf.text(d.companyPhone.slice(0,28), lx+22, bt+17)
  pdf.setFont('helvetica','bold'); pdf.text('Email:', lx, bt+24)
  pdf.setFont('helvetica','normal'); pdf.text(d.companyEmail.slice(0,30), lx+22, bt+24)

  pdf.setFont('helvetica','bold'); pdf.text('Customer:', rx, bt)
  pdf.setFont('helvetica','normal'); pdf.text(safeWrap(pdf, d.customerName, lw-22).slice(0,1), rx+22, bt)
  pdf.setFont('helvetica','bold'); pdf.text('Address:', rx, bt+8)
  pdf.setFont('helvetica','normal'); pdf.text(safeWrap(pdf, d.customerAddress, lw-22).slice(0,2), rx+22, bt+8)
  if (d.customerPhone) {
    pdf.setFont('helvetica','bold'); pdf.text('Phone:', rx, bt+17)
    pdf.setFont('helvetica','normal'); pdf.text(d.customerPhone.slice(0,28), rx+22, bt+17)
  }
  if (d.customerEmail) {
    const eY = d.customerPhone ? bt+24 : bt+17
    pdf.setFont('helvetica','bold'); pdf.text('Email:', rx, eY)
    pdf.setFont('helvetica','normal'); pdf.text(d.customerEmail.slice(0,30), rx+22, eY)
  }
  if (!d.customerPhone && !d.customerEmail) {
    pdf.setFont('helvetica','bold'); pdf.text('Method:', rx, bt+17)
    pdf.setFont('helvetica','normal'); pdf.text(d.paymentMethod, rx+22, bt+17)
    pdf.setFont('helvetica','bold'); pdf.text('Currency:', rx, bt+24)
    pdf.setFont('helvetica','normal'); pdf.text(d.currency, rx+22, bt+24)
  }

  // Optional reference numbers strip
  y+=bH+3
  const refParts: string[] = []
  if (d.invoiceNumber) refParts.push(`Invoice: ${d.invoiceNumber}`)
  if (d.orderNumber) refParts.push(`Order: ${d.orderNumber}`)
  if (d.transactionRef) refParts.push(`Ref: ${d.transactionRef}`)
  if (d.paymentDate) refParts.push(`Paid: ${d.paymentDate}`)
  if (refParts.length > 0) {
    const refText = refParts.join('  |  ')
    pdf.setFontSize(7.5); pdf.setFont('helvetica','normal'); applyText(pdf, theme.text)
    const refLines = limitedLines(pdf, refText, cw-8, 2)
    const refH = 5 + textBlockHeight(refLines, 3.6)
    applyFill(pdf, lighten(theme.accent, 0.3)); pdf.rect(m, y, cw, refH, 'F')
    applyDraw(pdf, theme.border); pdf.setLineWidth(0.2); pdf.rect(m, y, cw, refH)
    pdf.text(refLines, m+4, y+5.5)
    y+=refH+2
  }

  // ── ITEMS TABLE ──
  const colW=[cw*0.5, cw*0.14, cw*0.18, cw*0.18]
  const colX=[m, m+colW[0], m+colW[0]+colW[1], m+colW[0]+colW[1]+colW[2]]

  const drawHead=(hy: number)=>{
    applyFill(pdf, theme.secondary); pdf.rect(m, hy, cw, 9, 'F')
    applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.rect(m, hy, cw, 9)
    pdf.line(colX[1],hy,colX[1],hy+9); pdf.line(colX[2],hy,colX[2],hy+9); pdf.line(colX[3],hy,colX[3],hy+9)
    applyText(pdf, contrastColor(theme.secondary)); pdf.setFont('helvetica','bold'); pdf.setFontSize(8)
    pdf.text('DESCRIPTION', colX[0]+3, hy+6)
    pdf.text('QTY',         colX[1]+3, hy+6)
    pdf.text('UNIT PRICE',  colX[2]+3, hy+6)
    pdf.text('TOTAL',       colX[3]+3, hy+6)
  }
  drawHead(y); y+=9

  d.items.forEach((item, i) => {
    if (y+9 > ph-90) {
      pdf.addPage(); applyFill(pdf, theme.paper); pdf.rect(0,0,pw,ph,'F'); y=m; drawHead(y); y+=9
    }
    if (i%2===1) { applyFill(pdf, lighten(theme.accent, 0.3)); pdf.rect(m,y,cw,9,'F') }
    applyDraw(pdf, theme.border); pdf.setLineWidth(0.2); pdf.rect(m,y,cw,9)
    pdf.line(colX[1],y,colX[1],y+9); pdf.line(colX[2],y,colX[2],y+9); pdf.line(colX[3],y,colX[3],y+9)
    applyText(pdf, theme.text); pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5)
    pdf.text(fitLine(pdf, item.description||'', colW[0]-6), colX[0]+3, y+6)
    pdf.text(String(item.quantity), colX[1]+3, y+6)
    pdf.text(`${d.sym}${(item.price||0).toFixed(2)}`, colX[2]+3, y+6)
    pdf.text(`${d.sym}${item.total.toFixed(2)}`, colX[3]+3, y+6)
    y+=9
  })
  if (d.items.length === 0) {
    applyText(pdf, theme.muted); pdf.setFont('helvetica','italic'); pdf.setFontSize(8)
    pdf.text('No line items.', m+4, y+6); y+=9
  }

  // ── TOTALS BOX ──
  y+=5
  const tw=88, tx=pw-m-tw
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.rect(tx, y, tw, 46)
  pdf.setFontSize(8.5)
  const rowT=(lbl: string, val: string, off: number, bold=false)=>{
    pdf.setFont('helvetica', bold?'bold':'normal'); applyText(pdf, theme.text)
    pdf.text(lbl, tx+4, y+off); pdf.text(val, tx+tw-4, y+off, {align:'right'})
  }
  rowT('Subtotal',   `${d.sym}${d.subtotal.toFixed(2)}`,   8)
  rowT(`VAT (${d.taxRate}%)`, `${d.sym}${d.tax.toFixed(2)}`, 16)
  rowT('Paid',       `${d.sym}${d.paid.toFixed(2)}`,        24)
  rowT('Balance',    `${d.sym}${d.balance.toFixed(2)}`,     32)
  applyDraw(pdf, theme.primary); pdf.setLineWidth(0.5); pdf.line(tx+3, y+37, tx+tw-3, y+37)
  rowT('Grand Total',`${d.sym}${d.grandTotal.toFixed(2)}`,  44, true)

  // Status badge (left of totals box)
  if (d.paymentStatus) {
    drawStatusBadge(pdf, d.paymentStatus, m, y+2)
  }

  // ── AMOUNT IN WORDS ──
  const wy=y+52
  applyFill(pdf, theme.accent); pdf.rect(m, wy, cw, 13, 'F')
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.rect(m, wy, cw, 13)
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary); pdf.setFontSize(7.5)
  pdf.text('Amount in Words:', m+3, wy+5)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(8)
  pdf.text(safeWrap(pdf, d.amountInWords, cw-6).slice(0,2), m+3, wy+9.5)

  // ── NOTES / TERMS / MEMO ──
  let notesY = wy+17
  pdf.setFont('helvetica','normal'); pdf.setFontSize(7.8)
  const noteLines = limitedLines(pdf, d.notes, cw-6, 2)
  pdf.setFontSize(7.5)
  const termLines = d.terms ? limitedLines(pdf, d.terms, cw-6, 2) : []
  pdf.setFontSize(7.8)
  const memoLines = limitedLines(pdf, d.memo, cw-6, 1)
  const notesBoxH = 12 + textBlockHeight(noteLines, 3.6) + (termLines.length ? 8 + textBlockHeight(termLines, 3.4) : 0) + 8 + textBlockHeight(memoLines, 3.6)
  if (notesY+notesBoxH > ph-42) { pdf.addPage(); applyFill(pdf, theme.paper); pdf.rect(0,0,pw,ph,'F'); notesY=m }
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.rect(m, notesY, cw, notesBoxH)
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary); pdf.setFontSize(7.5)
  let detailY = notesY+5
  pdf.text('NOTES', m+3, detailY)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(7.8)
  detailY += 5
  pdf.text(noteLines, m+3, detailY)
  detailY += textBlockHeight(noteLines, 3.6) + 4

  if (termLines.length) {
    pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary); pdf.setFontSize(7.5)
    pdf.text('TERMS', m+3, detailY)
    pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(7.5)
    detailY += 4.5
    pdf.text(termLines, m+3, detailY)
    detailY += textBlockHeight(termLines, 3.4) + 4
  }

  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary); pdf.setFontSize(7.5)
  pdf.text('MEMO', m+3, detailY)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(7.8)
  detailY += 4.5
  pdf.text(memoLines, m+3, detailY)

  const tmy = notesY+notesBoxH+4
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.2); pdf.rect(m, tmy, cw, 9)
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary); pdf.setFontSize(7.5)
  pdf.text('Mode of Transfer:', m+3, tmy+6)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text)
  pdf.text(fitLine(pdf, d.transferMode, cw-45), m+38, tmy+6)

  // ── SIGNATURE ──
  const sY = tmy+14
  applyDraw(pdf, theme.primary); pdf.setLineWidth(0.4); pdf.line(m+4, sY+12, m+54, sY+12)
  if (data.signatureUrl) {
    const sd=await loadImg(data.signatureUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', m+4, sY+1, 46, 10) } catch {}
  }
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.text); pdf.setFontSize(8.5)
  pdf.text(fitLine(pdf, d.signeeName, pw-m-36-(m+4)), m+4, sY+17)
  pdf.setFontSize(7.5); applyText(pdf, theme.muted); pdf.text('Authorized Signatory', m+4, sY+22)
  if (d.generatedBy) {
    pdf.setFontSize(7); applyText(pdf, theme.muted); pdf.text(`Generated by: ${d.generatedBy}`, m+4, sY+27)
  }
  if (data.stampUrl) {
    const sd=await loadImg(data.stampUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', pw-m-30, sY-2, 28, 28) } catch {}
  }

  // ── QR + BARCODE ──
  let qbY = sY + 32
  if (qbY > ph - 44) {
    pdf.addPage(); applyFill(pdf, theme.paper); pdf.rect(0,0,pw,ph,'F'); qbY=m
  }
  await drawQrBarFooter(pdf, d, data, theme, m, cw, qbY)

  // Footer strip
  applyFill(pdf, theme.primary); pdf.rect(0, ph-2.5, pw, 2.5, 'F')
  drawCenteredFooter(pdf, d.footerMessage, theme, pw, ph, m, 'Computer-generated document.')

  return pdf
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// FORMAT 2 — MODERN BRAND (modern)
// Bold full-width primary header · Open party columns · Accent grand total
// ╚══════════════════════════════════════════════════════════════════════════════╝
async function generateModernPDF(data: DocumentConfig, theme: BrandTheme, logoData: string|null, wm: string|null): Promise<jsPDF> {
  const pdf = new jsPDF({unit:'mm', format:'a4'})
  const pw=pdf.internal.pageSize.getWidth(), ph=pdf.internal.pageSize.getHeight()
  const m=14, cw=pw-m*2
  const d=prepareData(data)

  applyFill(pdf, [255,255,255]); pdf.rect(0,0,pw,ph,'F')
  addWatermark(pdf, wm, pw, ph)

  // ── FULL-WIDTH PRIMARY HEADER ──
  const hH=44
  applyFill(pdf, theme.secondary); pdf.rect(0,0,pw,hH,'F')
  applyFill(pdf, theme.primary); pdf.rect(0, hH-2, pw, 2, 'F')
  await addLogo(pdf, logoData, theme, m, 9, 24, 24, d.companyName)

  const headerTextColor: Rgb = [255,255,255]
  const headerSubColor: Rgb = lighten(theme.secondary, 0.72)

  applyText(pdf, headerTextColor); pdf.setFont('helvetica','bold')
  fitFontSize(pdf, d.companyName, cw-100, 15, 9)
  pdf.text(fitLine(pdf, d.companyName, cw-100), m+28, 16)

  if (d.companyCaption) {
    pdf.setFont('helvetica','italic'); pdf.setFontSize(7.5); applyText(pdf, lighten(theme.primary, 0.5))
    pdf.text(safeWrap(pdf, d.companyCaption, cw-100).slice(0,1), m+28, 21.5)
  }

  pdf.setFont('helvetica','normal'); pdf.setFontSize(7.5); applyText(pdf, headerSubColor)
  const ctLine = [d.companyPhone, d.companyEmail, d.companyWebsite].filter(Boolean).join('  ·  ')
  pdf.text(safeWrap(pdf, ctLine, cw-100).slice(0,1), m+28, d.companyCaption ? 26.5 : 22.5)
  pdf.text(safeWrap(pdf, d.companyAddress, cw-100).slice(0,1), m+28, d.companyCaption ? 31 : 27)

  applyText(pdf, [255,255,255]); pdf.setFont('helvetica','bold'); pdf.setFontSize(26)
  pdf.text('RECEIPT', pw-m-2, 21, {align:'right'})
  pdf.setFontSize(7.5); applyText(pdf, headerSubColor); pdf.setFont('helvetica','normal')
  pdf.text(fitLine(pdf, `No. ${d.receiptNumber}`, 58), pw-m-2, 28, {align:'right'})
  pdf.text(`Date: ${d.issueDate}`, pw-m-2, 33.5, {align:'right'})
  if (d.paymentDate) pdf.text(`Paid: ${d.paymentDate}`, pw-m-2, 39, {align:'right'})

  // ── PARTY SECTION ──
  let y = hH+8
  applyText(pdf, theme.primary); pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5)
  pdf.text('FROM', m, y)
  pdf.text('BILL TO', m+cw/2+4, y)
  y+=3.5
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.4)
  pdf.line(m, y, m+cw/2-4, y)
  pdf.line(m+cw/2+4, y, pw-m, y)
  y+=5

  const colW2 = cw/2-6
  pdf.setFont('helvetica','bold'); pdf.setFontSize(9); applyText(pdf, theme.text)
  pdf.text(safeWrap(pdf, d.companyName, colW2).slice(0,1), m, y)
  pdf.text(safeWrap(pdf, d.customerName, colW2).slice(0,1), m+cw/2+4, y)

  pdf.setFont('helvetica','normal'); pdf.setFontSize(8); applyText(pdf, theme.text)
  pdf.text(safeWrap(pdf, d.companyAddress, colW2).slice(0,2), m, y+5)
  pdf.text(safeWrap(pdf, d.customerAddress, colW2).slice(0,2), m+cw/2+4, y+5)

  const cpLine = [d.companyPhone, d.companyEmail].filter(Boolean).join('  ·  ')
  pdf.text(safeWrap(pdf, cpLine, colW2).slice(0,1), m, y+15)

  const custLine = [d.customerPhone, d.customerEmail].filter(Boolean).join('  ·  ')
  if (custLine) {
    pdf.text(safeWrap(pdf, custLine, colW2).slice(0,1), m+cw/2+4, y+15)
  } else {
    pdf.text(safeWrap(pdf, `Method: ${d.paymentMethod}  ·  ${d.currency}`, colW2).slice(0,1), m+cw/2+4, y+15)
  }

  // Reference numbers strip
  y += 25
  const refParts: string[] = []
  if (d.invoiceNumber) refParts.push(`Invoice: ${d.invoiceNumber}`)
  if (d.orderNumber) refParts.push(`Order: ${d.orderNumber}`)
  if (d.transactionRef) refParts.push(`Ref: ${d.transactionRef}`)
  if (d.paymentStatus) {
    const badge = statusBadgeColors(d.paymentStatus)
    applyFill(pdf, badge.bg); pdf.roundedRect(m, y-4, pdf.getTextWidth(badge.label)+8, 6, 1, 1, 'F')
    pdf.setFont('helvetica','bold'); pdf.setFontSize(7); applyText(pdf, badge.fg)
    pdf.text(badge.label, m+4, y)
  }
  if (refParts.length > 0) {
    pdf.setFontSize(7.5); pdf.setFont('helvetica','normal'); applyText(pdf, theme.muted)
    const refX = d.paymentStatus ? m+50 : m
    const refLines = limitedLines(pdf, refParts.join('  |  '), pw-m-refX, 3)
    pdf.text(refLines, refX, y)
    y += refLines.length > 1 ? 3.8 : 0
  }
  y += 5

  applyDraw(pdf, theme.primary); pdf.setLineWidth(0.9); pdf.line(m, y, pw-m, y)
  applyDraw(pdf, lighten(theme.border, 0.4)); pdf.setLineWidth(0.2); pdf.line(m, y+1.5, pw-m, y+1.5)

  // ── ITEMS TABLE ──
  y+=6
  const colW=[cw*0.5, cw*0.13, cw*0.185, cw*0.185]
  const colX=[m, m+colW[0], m+colW[0]+colW[1], m+colW[0]+colW[1]+colW[2]]

  const drawHead=(hy: number)=>{
    applyFill(pdf, [243,246,251]); pdf.rect(m, hy, cw, 9, 'F')
    applyDraw(pdf, theme.border); pdf.setLineWidth(0.25); pdf.rect(m, hy, cw, 9)
    pdf.line(colX[1],hy,colX[1],hy+9); pdf.line(colX[2],hy,colX[2],hy+9); pdf.line(colX[3],hy,colX[3],hy+9)
    applyText(pdf, theme.primary); pdf.setFont('helvetica','bold'); pdf.setFontSize(8)
    pdf.text('DESCRIPTION', colX[0]+3, hy+6)
    pdf.text('QTY',         colX[1]+3, hy+6)
    pdf.text('UNIT PRICE',  colX[2]+3, hy+6)
    pdf.text('TOTAL',       colX[3]+3, hy+6)
  }
  drawHead(y); y+=9

  d.items.forEach((item, i)=>{
    if (y+9>ph-75) { pdf.addPage(); applyFill(pdf,[255,255,255]); pdf.rect(0,0,pw,ph,'F'); y=m; drawHead(y); y+=9 }
    if (i%2===1) { applyFill(pdf, lighten(theme.accent, 0.4)); pdf.rect(m,y,cw,9,'F') }
    applyDraw(pdf, theme.border); pdf.setLineWidth(0.15); pdf.rect(m,y,cw,9)
    pdf.line(colX[1],y,colX[1],y+9); pdf.line(colX[2],y,colX[2],y+9); pdf.line(colX[3],y,colX[3],y+9)
    applyText(pdf, theme.text); pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5)
    pdf.text(fitLine(pdf, item.description||'', colW[0]-6), colX[0]+3, y+6)
    pdf.text(String(item.quantity), colX[1]+3, y+6)
    pdf.text(`${d.sym}${(item.price||0).toFixed(2)}`, colX[2]+3, y+6)
    pdf.text(`${d.sym}${item.total.toFixed(2)}`, colX[3]+3, y+6)
    y+=9
  })
  if (d.items.length===0) {
    applyText(pdf, theme.muted); pdf.setFont('helvetica','italic'); pdf.setFontSize(8)
    pdf.text('No line items.', m+4, y+6); y+=9
  }

  // ── TOTALS ──
  y+=4
  const tw=84, tx=pw-m-tw
  pdf.setFontSize(8.5)
  const rowM=(lbl: string, val: string, off: number, bold=false)=>{
    pdf.setFont('helvetica', bold?'bold':'normal'); applyText(pdf, theme.text)
    pdf.text(lbl, tx, y+off); pdf.text(val, tx+tw, y+off, {align:'right'})
  }
  rowM('Subtotal',    `${d.sym}${d.subtotal.toFixed(2)}`, 0)
  rowM(`VAT (${d.taxRate}%)`, `${d.sym}${d.tax.toFixed(2)}`, 8)
  rowM('Paid',        `${d.sym}${d.paid.toFixed(2)}`, 16)
  rowM('Balance',     `${d.sym}${d.balance.toFixed(2)}`, 24)
  applyDraw(pdf, theme.primary); pdf.setLineWidth(0.8); pdf.line(tx, y+28, tx+tw, y+28)
  applyFill(pdf, theme.secondary); pdf.rect(tx-3, y+30, tw+6, 11, 'F')
  pdf.setFont('helvetica','bold'); applyText(pdf, [255,255,255]); pdf.setFontSize(9.5)
  pdf.text('Grand Total', tx, y+37.5)
  pdf.text(`${d.sym}${d.grandTotal.toFixed(2)}`, tx+tw, y+37.5, {align:'right'})

  // Amount in words
  y+=46
  pdf.setFontSize(8); pdf.setFont('helvetica','italic'); applyText(pdf, darken(theme.text, 0.1))
  const wLines = safeWrap(pdf, `Amount in words: ${d.amountInWords}`, cw)
  pdf.text(wLines.slice(0,2), m, y)
  y += wLines.slice(0,2).length > 1 ? 12 : 6

  // ── NOTES + SIGNATURE ──
  const noteW=cw*0.55, sigW=cw*0.41, sigX=pw-m-sigW

  // Notes box with terms
  pdf.setFont('helvetica','normal'); pdf.setFontSize(7.8)
  const noteLines = limitedLines(pdf, d.notes, noteW-6, 2)
  pdf.setFontSize(7.5)
  const termLines = d.terms ? limitedLines(pdf, d.terms, noteW-6, 2) : []
  const transferLine = fitLine(pdf, d.transferMode, noteW-28)
  const notesBoxH = Math.max(
    36,
    13 + textBlockHeight(noteLines, 3.6) + (termLines.length ? 8 + textBlockHeight(termLines, 3.4) : 0) + 8
  )
  if (y+notesBoxH>ph-18) { pdf.addPage(); applyFill(pdf,[255,255,255]); pdf.rect(0,0,pw,ph,'F'); y=m }
  applyFill(pdf, lighten(theme.accent, 0.3)); pdf.rect(m, y, noteW, notesBoxH, 'F')
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.25); pdf.rect(m, y, noteW, notesBoxH)
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.primary); pdf.setFontSize(8)
  let noteY = y+6
  pdf.text('NOTES', m+3, noteY)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(7.8)
  noteY += 6
  pdf.text(noteLines, m+3, noteY)
  noteY += textBlockHeight(noteLines, 3.6) + 4
  if (termLines.length) {
    pdf.setFont('helvetica','bold'); applyText(pdf, theme.primary); pdf.setFontSize(7.5)
    pdf.text('TERMS', m+3, noteY)
    pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(7.5)
    noteY += 4.5
    pdf.text(termLines, m+3, noteY)
  }
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary); pdf.setFontSize(7.5)
  pdf.text('Transfer:', m+3, y+notesBoxH-5.5)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text)
  pdf.text(transferLine, m+22, y+notesBoxH-5.5)

  // Signature box
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.25); pdf.rect(sigX, y, sigW, notesBoxH)
  if (data.signatureUrl) {
    const sd=await loadImg(data.signatureUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', sigX+4, y+4, sigW-8, 14) } catch {}
  }
  applyDraw(pdf, theme.primary); pdf.setLineWidth(0.5); pdf.line(sigX+4, y+20, sigX+sigW-4, y+20)
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.text); pdf.setFontSize(8.5)
  pdf.text(fitLine(pdf, d.signeeName, sigW-8), sigX+4, y+26)
  pdf.setFontSize(7.5); applyText(pdf, theme.muted); pdf.text('Authorized Signatory', sigX+4, y+31)
  if (d.generatedBy) {
    pdf.setFontSize(6.5); pdf.text(`Generated by: ${d.generatedBy}`, sigX+4, y+notesBoxH-3)
  }
  if (data.stampUrl) {
    const sd=await loadImg(data.stampUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', sigX+sigW-22, y+2, 20, 20) } catch {}
  }

  // QR + barcode
  y += notesBoxH + 6
  if (y > ph - 44) {
    pdf.addPage(); applyFill(pdf,[255,255,255]); pdf.rect(0,0,pw,ph,'F'); y=m
  }
  await drawQrBarFooter(pdf, d, data, theme, m, cw, y)

  applyFill(pdf, theme.primary); pdf.rect(0, ph-1.5, pw, 1.5, 'F')
  drawCenteredFooter(pdf, d.footerMessage, theme, pw, ph, m, 'Computer-generated document.')
  return pdf
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// FORMAT 3 — LUXURY MINIMAL (minimal)
// No fills · Large RECEIPT typography · Thin ruled lines · Airy layout
// ╚══════════════════════════════════════════════════════════════════════════════╝
async function generateMinimalPDF(data: DocumentConfig, theme: BrandTheme, logoData: string|null, wm: string|null): Promise<jsPDF> {
  const pdf = new jsPDF({unit:'mm', format:'a4'})
  const pw=pdf.internal.pageSize.getWidth(), ph=pdf.internal.pageSize.getHeight()
  const m=18, cw=pw-m*2
  const d=prepareData(data)

  applyFill(pdf, [255,255,255]); pdf.rect(0,0,pw,ph,'F')
  addWatermark(pdf, wm, pw, ph)

  // ── HEADER ──
  await addLogo(pdf, logoData, theme, m, 10, 20, 20, d.companyName)

  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary)
  fitFontSize(pdf, d.companyName, cw-115, 14, 8)
  pdf.text(fitLine(pdf, d.companyName, cw-115), m+24, 17)

  if (d.companyCaption) {
    pdf.setFont('helvetica','italic'); pdf.setFontSize(7); applyText(pdf, lighten(theme.primary, 0.2))
    pdf.text(safeWrap(pdf, d.companyCaption, cw-80).slice(0,1), m+24, 22)
  }

  pdf.setFont('helvetica','normal'); pdf.setFontSize(7); applyText(pdf, theme.muted)
  const hdrContact = [d.companyPhone, d.companyEmail, d.companyWebsite, d.companyAddress]
    .filter(Boolean).join('  |  ')
  pdf.text(safeWrap(pdf, hdrContact, cw-80).slice(0,1), m+24, d.companyCaption ? 26.5 : 23.5)

  // RECEIPT — large right-aligned
  applyText(pdf, theme.primary); pdf.setFont('helvetica','bold'); pdf.setFontSize(30)
  pdf.text('RECEIPT', pw-m, 24, {align:'right'})

  // Thin rule
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.5); pdf.line(m, 34, pw-m, 34)

  // Receipt metadata
  const metaParts = [
    `No. ${d.receiptNumber}`,
    d.issueDate,
    d.paymentDate ? `Paid: ${d.paymentDate}` : '',
    d.paymentMethod,
    d.currency,
    d.invoiceNumber ? `Inv: ${d.invoiceNumber}` : '',
    d.orderNumber ? `Ord: ${d.orderNumber}` : '',
  ].filter(Boolean).join('  ·  ')
  pdf.setFontSize(7.5); applyText(pdf, theme.muted); pdf.setFont('helvetica','normal')
  pdf.text(fitLine(pdf, metaParts, d.paymentStatus ? cw-38 : cw), m, 39.5)

  // Status badge
  if (d.paymentStatus) {
    const badge = statusBadgeColors(d.paymentStatus)
    applyFill(pdf, badge.bg)
    pdf.setFont('helvetica','bold'); pdf.setFontSize(7)
    const bw = pdf.getTextWidth(badge.label) + 8
    pdf.roundedRect(pw-m-bw, 35, bw, 6, 1, 1, 'F')
    applyText(pdf, badge.fg)
    pdf.text(badge.label, pw-m-bw/2, 39, {align:'center'})
  }

  // ── PARTY SECTION ──
  let y=47
  const colW2=cw/2-5
  pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5)
  applyText(pdf, theme.secondary); pdf.text('FROM', m, y)
  applyText(pdf, theme.primary); pdf.text('BILL TO', m+cw/2+4, y)
  y+=4

  pdf.setFont('helvetica','bold'); pdf.setFontSize(9); applyText(pdf, theme.text)
  pdf.text(safeWrap(pdf, d.companyName, colW2).slice(0,1), m, y)
  pdf.text(safeWrap(pdf, d.customerName, colW2).slice(0,1), m+cw/2+4, y)

  pdf.setFont('helvetica','normal'); pdf.setFontSize(7.8); applyText(pdf, theme.text)
  pdf.text(safeWrap(pdf, d.companyAddress, colW2).slice(0,2), m, y+5)
  pdf.text(safeWrap(pdf, d.customerAddress, colW2).slice(0,2), m+cw/2+4, y+5)
  pdf.text(safeWrap(pdf, d.companyPhone, colW2).slice(0,1), m, y+17)
  const custContact = [d.customerPhone, d.customerEmail].filter(Boolean).join('  ·  ')
  pdf.text(safeWrap(pdf, custContact || `${d.paymentMethod}  ·  ${d.currency}`, colW2).slice(0,1), m+cw/2+4, y+17)

  if (d.transactionRef) {
    pdf.setFontSize(7); applyText(pdf, theme.muted)
    pdf.text(fitLine(pdf, `Ref: ${d.transactionRef}`, colW2), m+cw/2+4, y+22)
  }

  // ── ITEMS ──
  y+=28; applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.line(m, y, pw-m, y)
  y+=6
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8); applyText(pdf, theme.primary)
  const qX=pw-m-60, uX=pw-m-36
  pdf.text('DESCRIPTION', m, y)
  pdf.text('QTY', qX, y)
  pdf.text('UNIT', uX, y)
  pdf.text('TOTAL', pw-m, y, {align:'right'})
  y+=2
  applyDraw(pdf, theme.text); pdf.setLineWidth(0.6); pdf.line(m, y, pw-m, y)
  y+=5

  d.items.forEach((item, i)=>{
    if (y+8>ph-65) { pdf.addPage(); applyFill(pdf,[255,255,255]); pdf.rect(0,0,pw,ph,'F'); y=m }
    applyText(pdf, i%2===0 ? theme.text : darken(theme.text, 0.08))
    pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5)
    pdf.text(fitLine(pdf, item.description||'', qX-m-6), m, y)
    pdf.text(String(item.quantity), qX, y)
    pdf.text(`${d.sym}${(item.price||0).toFixed(2)}`, uX, y)
    pdf.text(`${d.sym}${item.total.toFixed(2)}`, pw-m, y, {align:'right'})
    applyDraw(pdf, lighten(theme.border, 0.55)); pdf.setLineWidth(0.12); pdf.line(m, y+2, pw-m, y+2)
    y+=8
  })
  if (d.items.length===0) {
    applyText(pdf, theme.muted); pdf.setFont('helvetica','italic'); pdf.setFontSize(8)
    pdf.text('No line items.', m, y); y+=8
  }

  // ── TOTALS ──
  y+=3; applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.line(m, y, pw-m, y)
  y+=5
  const totW=52, totX=pw-m-totW
  const tot=(lbl: string, val: string, bold=false)=>{
    pdf.setFont('helvetica', bold?'bold':'normal'); pdf.setFontSize(bold?9:8.5)
    applyText(pdf, bold ? theme.primary : theme.text)
    pdf.text(lbl, totX, y); pdf.text(val, pw-m, y, {align:'right'})
    y+=6
  }
  tot('Subtotal',    `${d.sym}${d.subtotal.toFixed(2)}`)
  tot(`VAT (${d.taxRate}%)`, `${d.sym}${d.tax.toFixed(2)}`)
  tot('Paid',        `${d.sym}${d.paid.toFixed(2)}`)
  tot('Balance',     `${d.sym}${d.balance.toFixed(2)}`)
  applyDraw(pdf, theme.primary); pdf.setLineWidth(0.5); pdf.line(totX, y-3, pw-m, y-3)
  tot('Grand Total', `${d.sym}${d.grandTotal.toFixed(2)}`, true)

  y+=3; pdf.setFontSize(7.5); pdf.setFont('helvetica','italic'); applyText(pdf, darken(theme.text, 0.1))
  const wLines = safeWrap(pdf, d.amountInWords, cw)
  pdf.text(wLines.slice(0,2), pw/2, y, {align:'center'})
  y += wLines.slice(0,2).length > 1 ? 12 : 7

  // ── NOTES + TERMS ──
  pdf.setFont('helvetica','normal'); pdf.setFontSize(7.8)
  const noteLines = limitedLines(pdf, d.notes, cw*0.65, 2)
  pdf.setFontSize(7.5)
  const termLines = d.terms ? limitedLines(pdf, d.terms, cw*0.65, 2) : []
  const detailH = 9 + textBlockHeight(noteLines, 3.6) + (termLines.length ? 8 + textBlockHeight(termLines, 3.4) : 0) + 8
  if (y+detailH>ph-40) { pdf.addPage(); applyFill(pdf,[255,255,255]); pdf.rect(0,0,pw,ph,'F'); y=m }
  pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5); applyText(pdf, theme.secondary)
  pdf.text('Notes', m, y)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(7.8)
  y += 5
  pdf.text(noteLines, m, y)
  y += textBlockHeight(noteLines, 3.6) + 4

  if (termLines.length) {
    pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5); applyText(pdf, theme.secondary)
    pdf.text('Terms', m, y)
    pdf.setFont('helvetica','normal'); applyText(pdf, theme.muted); pdf.setFontSize(7.5)
    y += 4.5
    pdf.text(termLines, m, y)
    y += textBlockHeight(termLines, 3.4) + 4
  }

  pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5); applyText(pdf, theme.secondary)
  pdf.text('Transfer:', m, y)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text)
  pdf.text(fitLine(pdf, d.transferMode, cw-30), m+20, y)

  // ── SIGNATURE ──
  y+=28
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3)
  pdf.setLineDashPattern([2,1.5], 0)
  pdf.line(m, y, m+54, y)
  pdf.setLineDashPattern([], 0)
  if (data.signatureUrl) {
    const sd=await loadImg(data.signatureUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', m, y-12, 50, 11) } catch {}
  }
  pdf.setFontSize(8.5); pdf.setFont('helvetica','normal'); applyText(pdf, theme.text)
  pdf.text(fitLine(pdf, d.signeeName, cw-34), m, y+5)
  pdf.setFontSize(7); applyText(pdf, theme.muted); pdf.text('Authorized Signatory', m, y+10)
  if (d.generatedBy) {
    pdf.setFontSize(6.5); pdf.text(`Generated by: ${d.generatedBy}`, m, y+16)
  }
  if (data.stampUrl) {
    const sd=await loadImg(data.stampUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', pw-m-26, y-14, 24, 24) } catch {}
  }

  // QR + barcode
  y += d.generatedBy ? 22 : 16
  if (y > ph-44) {
    pdf.addPage(); applyFill(pdf,[255,255,255]); pdf.rect(0,0,pw,ph,'F'); y=m
  }
  await drawQrBarFooter(pdf, d, data, theme, m, cw, y)

  drawCenteredFooter(pdf, d.footerMessage, theme, pw, ph, m, 'Computer-generated document.')
  return pdf
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// FORMAT 4 — COMPACT POS STYLE (executive)
// Narrow 76mm thermal receipt strip, centered on A4
// Logo centered · Items compact · QR + barcode at bottom
// ╚══════════════════════════════════════════════════════════════════════════════╝
async function generateCompactPosPDF(data: DocumentConfig, theme: BrandTheme, logoData: string|null, _wm: string|null): Promise<jsPDF> {
  void _wm
  const pdf = new jsPDF({unit:'mm', format:'a4'})
  const pw=pdf.internal.pageSize.getWidth(), ph=pdf.internal.pageSize.getHeight()
  const d=prepareData(data)

  applyFill(pdf, [255,255,255]); pdf.rect(0,0,pw,ph,'F')

  // Narrow receipt strip: 76mm wide, centered
  const rw = 76
  const rx = (pw - rw) / 2   // left edge ≈ 67mm

  // Faint receipt paper background
  applyFill(pdf, [252,251,249]); pdf.rect(rx-3, 8, rw+6, ph-16, 'F')
  applyDraw(pdf, [210,205,200]); pdf.setLineWidth(0.25); pdf.rect(rx-3, 8, rw+6, ph-16)

  let y = 18
  const cx = rx + rw / 2

  // Helper: thin dashed rule across the strip
  const dRule = (yy: number, dashed=false) => {
    applyDraw(pdf, [190,185,180]); pdf.setLineWidth(0.3)
    if (dashed) pdf.setLineDashPattern([1.5,1], 0)
    pdf.line(rx+2, yy, rx+rw-2, yy)
    if (dashed) pdf.setLineDashPattern([], 0)
  }
  const newReceiptPage = () => {
    pdf.addPage()
    applyFill(pdf, [255,255,255]); pdf.rect(0,0,pw,ph,'F')
    applyFill(pdf, [252,251,249]); pdf.rect(rx-3, 8, rw+6, ph-16, 'F')
    applyDraw(pdf, [210,205,200]); pdf.setLineWidth(0.25); pdf.rect(rx-3, 8, rw+6, ph-16)
    y = 18
  }
  const ensureSpace = (needed: number) => {
    if (y + needed > ph - 12) newReceiptPage()
  }

  // ── LOGO ──
  if (logoData) {
    try { pdf.addImage(logoData, logoData.includes('png')?'PNG':'JPEG', cx-10, y, 20, 20); y+=23 } catch {
      // fallback below
    }
  }
  if (!logoData || y === 18) {
    applyFill(pdf, theme.secondary); pdf.roundedRect(cx-8, y, 16, 16, 2, 2, 'F')
    applyText(pdf, [255,255,255]); pdf.setFont('helvetica','bold'); pdf.setFontSize(9)
    const initials = d.companyName.trim().split(/\s+/).map(w=>w[0]?.toUpperCase()||'').slice(0,2).join('')||'CO'
    pdf.text(initials, cx, y+10.5, {align:'center'})
    y+=19
  }

  // ── COMPANY NAME ──
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary)
  pdf.setFontSize(8.5)
  const companyLines = limitedLines(pdf, d.companyName, rw-4, 2)
  pdf.text(companyLines, cx, y, {align:'center'})
  y += companyLines.length*3.8 + 1.5

  if (d.companyCaption) {
    pdf.setFont('helvetica','italic'); pdf.setFontSize(7); applyText(pdf, theme.muted)
    pdf.text(safeWrap(pdf, d.companyCaption, rw-4).slice(0,1), cx, y, {align:'center'})
    y+=4
  }

  // Contact
  const ctLine = [d.companyPhone, d.companyEmail].filter(v=>v&&v!=='Not provided').join('  ·  ')
  if (ctLine) {
    pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5); applyText(pdf, theme.muted)
    pdf.text(safeWrap(pdf, ctLine, rw-4).slice(0,1), cx, y, {align:'center'})
    y+=3.5
  }
  if (d.companyWebsite) {
    pdf.setFontSize(6); applyText(pdf, theme.primary)
    pdf.text(fitLine(pdf, d.companyWebsite, rw-4), cx, y, {align:'center'})
    y+=3.5
  }
  if (d.companyAddress && d.companyAddress !== 'Not provided') {
    pdf.setFontSize(6.5); applyText(pdf, theme.muted)
    const al = safeWrap(pdf, d.companyAddress, rw-4).slice(0,2)
    pdf.text(al, cx, y, {align:'center'})
    y += al.length*3.5
  }

  y+=2; dRule(y); y+=5

  // ── RECEIPT TITLE ──
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.primary)
  fitFontSize(pdf, 'RECEIPT', rw-4, 14, 10)
  pdf.text('RECEIPT', cx, y, {align:'center'})
  y+=6

  // ── RECEIPT METADATA ──
  pdf.setFontSize(7.5)
  const metaRows: [string, string][] = [
    ['No.', d.receiptNumber],
    ['Date', d.issueDate],
    ...(d.paymentDate ? [['Paid On', d.paymentDate] as [string,string]] : []),
    ...(d.invoiceNumber ? [['Invoice', d.invoiceNumber] as [string,string]] : []),
    ...(d.orderNumber ? [['Order', d.orderNumber] as [string,string]] : []),
    ...(d.transactionRef ? [['Ref', d.transactionRef] as [string,string]] : []),
    ['Method', d.paymentMethod],
    ['Currency', d.currency],
    ...(d.transferMode ? [['Transfer', d.transferMode] as [string,string]] : []),
  ]
  metaRows.forEach(([lbl, val]) => {
    pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary)
    pdf.text(lbl, rx+3, y)
    pdf.setFont('helvetica','normal'); applyText(pdf, theme.text)
    pdf.text(fitLine(pdf, String(val), rw-24), rx+rw-3, y, {align:'right'})
    y+=4.5
  })

  dRule(y); y+=5

  // ── CUSTOMER SECTION ──
  pdf.setFont('helvetica','bold'); pdf.setFontSize(6.5); applyText(pdf, theme.muted)
  pdf.text('BILL TO', rx+3, y); y+=3.5
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); applyText(pdf, theme.secondary)
  const customerLines = limitedLines(pdf, d.customerName, rw-6, 2)
  pdf.text(customerLines, rx+3, y)
  y+=customerLines.length*3.8+1
  if (d.customerAddress && d.customerAddress !== 'Not provided') {
    pdf.setFont('helvetica','normal'); pdf.setFontSize(7); applyText(pdf, theme.text)
    const al = safeWrap(pdf, d.customerAddress, rw-6).slice(0,2)
    pdf.text(al, rx+3, y); y+=al.length*3.5+1
  }
  const custContact = [d.customerPhone, d.customerEmail].filter(Boolean).join('  ·  ')
  if (custContact) {
    pdf.setFontSize(6.5); applyText(pdf, theme.muted)
    pdf.text(safeWrap(pdf, custContact, rw-6).slice(0,1), rx+3, y); y+=4
  }

  dRule(y); y+=5

  // ── ITEMS ──
  pdf.setFont('helvetica','bold'); pdf.setFontSize(7); applyText(pdf, theme.primary)
  pdf.text('ITEM', rx+3, y)
  pdf.text('QTY', rx+rw*0.58, y, {align:'center'})
  pdf.text('TOTAL', rx+rw-3, y, {align:'right'})
  y+=2.5
  applyDraw(pdf, theme.secondary); pdf.setLineWidth(0.6); pdf.line(rx+2, y, rx+rw-2, y)
  y+=4

  d.items.forEach(item => {
    pdf.setFont('helvetica','normal'); pdf.setFontSize(8)
    const descLines = limitedLines(pdf, item.description||'', rw*0.42, 2)
    const rowH = (descLines.length > 1 ? 8 : 5) + (item.price ? 3.5 : 0) + 3
    ensureSpace(rowH + 2)
    applyText(pdf, theme.text)
    pdf.text(descLines, rx+3, y)
    pdf.text(String(item.quantity), rx+rw*0.58, y, {align:'center'})
    pdf.text(`${d.sym}${item.total.toFixed(2)}`, rx+rw-3, y, {align:'right'})
    if (item.price) {
      pdf.setFontSize(6.5); applyText(pdf, theme.muted)
      pdf.text(`${d.sym}${item.price.toFixed(2)} each`, rx+3, y+descLines.length*3.8)
    }
    y += (descLines.length > 1 ? 8 : 5) + (item.price ? 3.5 : 0)
    dRule(y-1)
    y+=3
  })

  if (d.items.length === 0) {
    applyText(pdf, theme.muted); pdf.setFont('helvetica','italic'); pdf.setFontSize(8)
    pdf.text('No items.', cx, y, {align:'center'}); y+=8
  }

  // ── TOTALS ──
  y+=2
  ensureSpace(42)
  pdf.setFontSize(7.5)
  const posRow = (lbl: string, val: string, bold=false, accent=false) => {
    pdf.setFont('helvetica', bold?'bold':'normal')
    pdf.setFontSize(bold ? 9.5 : 7.5)
    applyText(pdf, accent ? theme.primary : (bold ? theme.secondary : theme.text))
    pdf.text(lbl, rx+3, y)
    pdf.text(val, rx+rw-3, y, {align:'right'})
    y+=bold ? 5.5 : 4
  }
  posRow('Subtotal', `${d.sym}${d.subtotal.toFixed(2)}`)
  if (d.taxRate > 0) posRow(`Tax (${d.taxRate}%)`, `${d.sym}${d.tax.toFixed(2)}`)
  y+=1
  applyDraw(pdf, theme.secondary); pdf.setLineWidth(0.8); pdf.line(rx+2, y, rx+rw-2, y); y+=1
  pdf.setLineWidth(0.4); pdf.line(rx+2, y, rx+rw-2, y); y+=4
  posRow('TOTAL', `${d.sym}${d.grandTotal.toFixed(2)}`, true, true)
  posRow('Paid',    `${d.sym}${d.paid.toFixed(2)}`)
  posRow('Balance', `${d.sym}${d.balance.toFixed(2)}`)

  // Status badge
  if (d.paymentStatus) {
    const badge = statusBadgeColors(d.paymentStatus)
    pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5)
    const bw = pdf.getTextWidth(badge.label) + 8
    applyFill(pdf, badge.bg); pdf.roundedRect(rx+3, y, bw, 7, 1.5, 1.5, 'F')
    applyText(pdf, badge.fg); pdf.text(badge.label, rx+3+bw/2, y+4.8, {align:'center'})
    y+=11
  }

  dRule(y); y+=5

  // Amount in words
  pdf.setFont('helvetica','italic'); pdf.setFontSize(6.5); applyText(pdf, theme.text)
  const wLines = safeWrap(pdf, d.amountInWords, rw-6)
  ensureSpace(wLines.slice(0,3).length*3.5+8)
  pdf.text(wLines.slice(0,3), cx, y, {align:'center'})
  y+=wLines.slice(0,3).length*3.5+3

  // ── NOTES & TERMS ──
  if (d.notes) {
    pdf.setFont('helvetica','normal'); pdf.setFontSize(7)
    const nl = limitedLines(pdf, d.notes, rw-6, 3)
    ensureSpace(nl.length*3.5+8)
    pdf.setFont('helvetica','bold'); pdf.setFontSize(7); applyText(pdf, theme.secondary)
    pdf.text('Notes:', rx+3, y); y+=3.5
    pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(7)
    pdf.text(nl, rx+3, y); y+=nl.length*3.5+2
  }
  if (d.terms) {
    pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5)
    const tl = limitedLines(pdf, d.terms, rw-6, 3)
    ensureSpace(tl.length*3+8)
    pdf.setFont('helvetica','bold'); pdf.setFontSize(6.5); applyText(pdf, theme.secondary)
    pdf.text('Terms:', rx+3, y); y+=3
    pdf.setFont('helvetica','normal'); applyText(pdf, theme.muted); pdf.setFontSize(6.5)
    pdf.text(tl, rx+3, y); y+=tl.length*3+3
  }

  dRule(y, true); y+=6

  // ── SIGNATURE ──
  ensureSpace(44)
  if (data.signatureUrl) {
    const sd=await loadImg(data.signatureUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', cx-18, y, 36, 10); y+=11 } catch {}
  }
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3)
  pdf.setLineDashPattern([1.5,1], 0)
  pdf.line(rx+8, y, rx+rw-8, y)
  pdf.setLineDashPattern([], 0)
  y+=4
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8); applyText(pdf, theme.secondary)
  const signerLines = limitedLines(pdf, d.signeeName, rw-6, 2)
  pdf.text(signerLines, cx, y, {align:'center'})
  y+=signerLines.length*3.8+1
  pdf.setFont('helvetica','normal'); pdf.setFontSize(6.5); applyText(pdf, theme.muted)
  pdf.text('Authorized Signatory', cx, y, {align:'center'})
  if (d.generatedBy) {
    y+=4; pdf.setFontSize(6); pdf.text(fitLine(pdf, `Generated by: ${d.generatedBy}`, rw-6), cx, y, {align:'center'})
  }
  if (data.stampUrl) {
    const sd=await loadImg(data.stampUrl)
    if (sd) { y+=4; ensureSpace(22); try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', cx-9, y, 18, 18); y+=20 } catch {} }
  } else y+=5

  dRule(y); y+=7

  // ── QR + BARCODE (centered in strip) ──
  const qrVal = d.transactionRef || d.receiptNumber
  const barVal = d.receiptNumber
  let qrImg: string|null=null, barImg: string|null=null
  try { qrImg = await makeQrDataURL(qrVal) } catch {}
  try { barImg = await makeBarcodeDataURL(barVal) } catch {}

  if (qrImg) {
    const qrSize=24
    ensureSpace(qrSize+10)
    pdf.addImage(qrImg, 'PNG', cx-qrSize/2, y, qrSize, qrSize)
    pdf.setFontSize(6); applyText(pdf, theme.muted); pdf.setFont('helvetica','normal')
    pdf.text('Scan to verify', cx, y+qrSize+3, {align:'center'})
    y+=qrSize+7
  }
  if (barImg) {
    const barW=rw-12, barH=14
    ensureSpace(barH+10)
    try { pdf.addImage(barImg, 'PNG', rx+6, y, barW, barH) } catch {}
    pdf.setFontSize(6); applyText(pdf, theme.muted)
    pdf.text(fitLine(pdf, barVal, rw-12), cx, y+barH+3.5, {align:'center'})
    y+=barH+7
  }

  // Footer
  const footerText = d.footerMessage || 'Thank you for your business!'
  pdf.setFont('helvetica','italic'); pdf.setFontSize(7); applyText(pdf, theme.muted)
  const footerLines = limitedLines(pdf, footerText, rw-6, 2)
  ensureSpace(footerLines.length*3.4+8)
  pdf.text(footerLines, cx, y, {align:'center'}); y+=footerLines.length*3.4+2
  pdf.setFontSize(6); pdf.text('Computer-generated document', cx, y, {align:'center'})

  return pdf
}

// ╔══════════════════════════════════════════════════════════════════════════════╗
// MAIN ENTRY POINT
// ╚══════════════════════════════════════════════════════════════════════════════╝
async function generateReceiptPDF(data: DocumentConfig, onComplete?: (url: string) => void): Promise<string> {
  const theme = toStandardReceiptTheme(
    await deriveTheme(data.logoUrl, data.primaryColor, data.secondaryColor)
  )
  const logoData = await loadImg(data.logoUrl||'')
  const wm = data.logoUrl ? await makeWatermark(data.logoUrl, 0.04) : null
  const format = data.receiptFormat || 'classic'

  let pdf: jsPDF
  switch (format) {
    case 'modern':    pdf = await generateModernPDF(data, theme, logoData, wm); break
    case 'minimal':   pdf = await generateMinimalPDF(data, theme, logoData, wm); break
    case 'executive': pdf = await generateCompactPosPDF(data, theme, logoData, wm); break
    default:          pdf = await generateClassicPDF(data, theme, logoData, wm); break
  }

  const pdfBlob = pdf.output('blob')
  const pdfUrl = URL.createObjectURL(pdfBlob)
  onComplete?.(pdfUrl)
  return pdfUrl
}

export function DocumentTemplate({ data, onComplete }: Props) {
  useEffect(() => { void generateReceiptPDF(data, onComplete) }, [data, onComplete])
  return null
}

export async function generateDocumentPDF(data: DocumentConfig): Promise<string> {
  return generateReceiptPDF(data)
}

export default generateDocumentPDF
