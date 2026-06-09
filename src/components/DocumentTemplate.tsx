'use client'

import { useEffect } from 'react'
import jsPDF from 'jspdf'
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

// â”€â”€â”€ COLOUR UTILITIES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ ADAPTIVE FONT SIZE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function fitFontSize(pdf: jsPDF, text: string, maxW: number, startSz: number, minSz = 7): number {
  for (let sz = startSz; sz >= minSz; sz -= 0.5) {
    pdf.setFontSize(sz)
    if (pdf.getTextWidth(text) <= maxW) return sz
  }
  pdf.setFontSize(minSz)
  return minSz
}

// â”€â”€â”€ RECEIPT NUMBER FROM COMPANY INITIALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function buildReceiptNumber(companyName: string): string {
  const initials = (companyName || 'RCP').trim()
    .split(/\s+/).filter(w => /\w/.test(w)).map(w => w[0].toUpperCase()).slice(0, 4).join('') || 'RCP'
  return `${initials}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
}

// â”€â”€â”€ IMAGE LOADING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ LOGO-DRIVEN THEME DERIVATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function deriveTheme(logoPath: string | undefined): Promise<BrandTheme> {
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

// â”€â”€â”€ HELPERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getCurrencySymbol(cur: string|undefined): string {
  return getCurrencySymbolForPdf(cur)
}
function getCurrencyWords(cur: string|undefined): {major:string,minor:string} {
  return getSharedCurrencyWords(cur)
}
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
// Safe text wrap â€” always returns at least 1 element
function safeWrap(pdf: jsPDF, text: string, maxW: number): string[] {
  const t = (text||'').trim() || '-'
  return pdf.splitTextToSize(t, Math.max(10, maxW)) as string[]
}
function addWatermark(pdf: jsPDF, wm: string|null, pw: number, ph: number) {
  if (!wm) return
  try { const sz=120; pdf.addImage(wm,'PNG',pw/2-sz/2,ph/2-sz/2,sz,sz) } catch {}
}
async function addLogo(pdf: jsPDF, logoData: string|null, theme: BrandTheme, lx: number, ly: number, lw: number, lh: number, companyName='') {
  if (logoData && !logoData.startsWith('data:image/svg')) {
    try { pdf.addImage(logoData, logoData.includes('png')?'PNG':'JPEG', lx, ly, lw, lh); return } catch {}
  }
  // Fallback: company initials box
  applyFill(pdf, theme.secondary)
  pdf.roundedRect(lx, ly, lw, lh, 3, 3, 'F')
  applyText(pdf, [255,255,255])
  const initials = companyName.trim().split(/\s+/).map(w=>w[0]?.toUpperCase()||'').slice(0,2).join('') || 'CO'
  fitFontSize(pdf, initials, lw-2, Math.min(lw*0.55, 14), 6)
  pdf.setFont('helvetica','bold')
  pdf.text(initials, lx+lw/2, ly+lh/2+pdf.getFontSize()*0.18, {align:'center'})
}

// â”€â”€â”€ SHARED DATA PREP â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
    companyAddress: (data.companyAddress||'').trim() || 'Not provided',
    companyPhone: (data.companyPhone||'').trim() || 'Not provided',
    companyEmail: (data.companyEmail||'').trim() || 'Not provided',
    customerName: (data.customerName||'Customer').trim() || 'Customer',
    customerAddress: (data.customerAddress||'').trim() || 'Not provided',
    receiptNumber: rcpNum,
    issueDate: data.dateOfIssue || formatDate(new Date()),
    paymentMethod: data.paymentMethod || 'Not provided',
    currency: data.currency || 'USD',
    notes: (data.notes||'Payment is due as agreed. Please include receipt number on all payments.').trim(),
    memo: (data.receiptDescription||data.description||'-').trim(),
    transferMode: (data.transferMode||'Bank Transfer').trim(),
    signeeName: (data.signeeName||'Authorized Signatory').trim(),
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FORMAT 1 â€” CLASSIC
// Accent header band Â· Labelled party blocks Â· Dark table Â· Notes Â· Sign
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function generateClassicPDF(data: DocumentConfig, theme: BrandTheme, logoData: string|null, wm: string|null): Promise<jsPDF> {
  const pdf = new jsPDF({unit:'mm', format:'a4'})
  const pw=pdf.internal.pageSize.getWidth(), ph=pdf.internal.pageSize.getHeight()
  const m=14, cw=pw-m*2  // cw=182
  const d=prepareData(data)

  // Paper background
  applyFill(pdf, theme.paper); pdf.rect(0,0,pw,ph,'F')
  // Top accent stripe 2.5mm
  applyFill(pdf, theme.primary); pdf.rect(0,0,pw,2.5,'F')
  addWatermark(pdf, wm, pw, ph)

  // â”€â”€ HEADER BAND (y=6, h=30) â”€â”€
  const hY=6, hH=30
  applyFill(pdf, theme.accent); pdf.rect(m, hY, cw, hH, 'F')
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.rect(m, hY, cw, hH)
  // Left colour stripe
  applyFill(pdf, theme.primary); pdf.rect(m, hY, 4, hH, 'F')

  await addLogo(pdf, logoData, theme, m+6, hY+4, 22, 20, d.companyName)

  // Company name â€” adaptive size
  const nameMaxW = cw - 106  // reserve 100mm for RECEIPT side
  pdf.setFont('helvetica', 'bold')
  fitFontSize(pdf, d.companyName, nameMaxW, 14, 8)
  applyText(pdf, theme.secondary)
  pdf.text(d.companyName, m+32, hY+10)

  // Contact line
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); applyText(pdf, theme.text)
  const contactLine = `${d.companyPhone}  Â·  ${d.companyEmail}`
  pdf.text(safeWrap(pdf, contactLine, nameMaxW+20).slice(0,1), m+32, hY+15.5)

  // Address â€” 1 line max
  pdf.setFontSize(7.5); applyText(pdf, theme.text)
  pdf.text(safeWrap(pdf, d.companyAddress, nameMaxW+20).slice(0,1), m+32, hY+21)

  // RECEIPT label â€” right side of header
  const titleColor: Rgb = luminance(theme.primary) < 0.45 ? lighten(theme.primary, 0.15) : darken(theme.primary, 0.18)
  applyText(pdf, titleColor); pdf.setFont('helvetica','bold'); pdf.setFontSize(22)
  pdf.text('RECEIPT', pw-m-3, hY+11, {align:'right'})
  pdf.setFontSize(8); applyText(pdf, theme.text); pdf.setFont('helvetica','normal')
  pdf.text(`No. ${d.receiptNumber}`, pw-m-3, hY+18, {align:'right'})
  pdf.text(`Date: ${d.issueDate}`, pw-m-3, hY+24, {align:'right'})

  // â”€â”€ PARTY BLOCKS (y=42, h=44) â”€â”€
  let y=42
  const bH=44, half=cw/2
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3)
  pdf.rect(m, y, cw, bH)
  pdf.line(m+half, y, m+half, y+bH)
  // Dark label headers
  applyFill(pdf, theme.secondary)
  pdf.rect(m, y, half, 8, 'F')
  pdf.rect(m+half, y, half, 8, 'F')
  applyText(pdf, contrastColor(theme.secondary)); pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5)
  pdf.text('FROM', m+4, y+5.5)
  pdf.text('BILL TO', m+half+4, y+5.5)

  const bt=y+11; applyText(pdf, theme.text); pdf.setFontSize(8)
  const lw=half-5, lx=m+4, rx=m+half+4

  // Left column â€” FROM
  pdf.setFont('helvetica','bold'); pdf.text('Company:', lx, bt)
  pdf.setFont('helvetica','normal')
  pdf.text(safeWrap(pdf, d.companyName, lw-22).slice(0,1), lx+22, bt)
  pdf.setFont('helvetica','bold'); pdf.text('Address:', lx, bt+8)
  pdf.setFont('helvetica','normal')
  pdf.text(safeWrap(pdf, d.companyAddress, lw-22).slice(0,2), lx+22, bt+8)
  pdf.setFont('helvetica','bold'); pdf.text('Phone:', lx, bt+17)
  pdf.setFont('helvetica','normal'); pdf.text(d.companyPhone.slice(0,28), lx+22, bt+17)
  pdf.setFont('helvetica','bold'); pdf.text('Email:', lx, bt+24)
  pdf.setFont('helvetica','normal'); pdf.text(d.companyEmail.slice(0,30), lx+22, bt+24)

  // Right column â€” BILL TO
  pdf.setFont('helvetica','bold'); pdf.text('Customer:', rx, bt)
  pdf.setFont('helvetica','normal')
  pdf.text(safeWrap(pdf, d.customerName, lw-22).slice(0,1), rx+22, bt)
  pdf.setFont('helvetica','bold'); pdf.text('Address:', rx, bt+8)
  pdf.setFont('helvetica','normal')
  pdf.text(safeWrap(pdf, d.customerAddress, lw-22).slice(0,2), rx+22, bt+8)
  pdf.setFont('helvetica','bold'); pdf.text('Method:', rx, bt+17)
  pdf.setFont('helvetica','normal'); pdf.text(d.paymentMethod, rx+22, bt+17)
  pdf.setFont('helvetica','bold'); pdf.text('Currency:', rx, bt+24)
  pdf.setFont('helvetica','normal'); pdf.text(d.currency, rx+22, bt+24)

  // â”€â”€ ITEMS TABLE â”€â”€
  y=92
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
    if (y+9 > ph-85) {
      pdf.addPage(); applyFill(pdf, theme.paper); pdf.rect(0,0,pw,ph,'F'); y=m; drawHead(y); y+=9
    }
    if (i%2===1) { applyFill(pdf, lighten(theme.accent, 0.3)); pdf.rect(m,y,cw,9,'F') }
    applyDraw(pdf, theme.border); pdf.setLineWidth(0.2); pdf.rect(m,y,cw,9)
    pdf.line(colX[1],y,colX[1],y+9); pdf.line(colX[2],y,colX[2],y+9); pdf.line(colX[3],y,colX[3],y+9)
    applyText(pdf, theme.text); pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5)
    // Clip description to fit column width
    const descLines = safeWrap(pdf, item.description||'', colW[0]-6)
    pdf.text(descLines.slice(0,1), colX[0]+3, y+6)
    pdf.text(String(item.quantity), colX[1]+3, y+6)
    pdf.text(`${d.sym}${(item.price||0).toFixed(2)}`, colX[2]+3, y+6)
    pdf.text(`${d.sym}${item.total.toFixed(2)}`, colX[3]+3, y+6)
    y+=9
  })

  if (d.items.length === 0) {
    applyText(pdf, theme.muted); pdf.setFont('helvetica','italic'); pdf.setFontSize(8)
    pdf.text('No line items.', m+4, y+6); y+=9
  }

  // â”€â”€ TOTALS BOX â”€â”€
  y+=5
  const tw=88, tx=pw-m-tw
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.rect(tx, y, tw, 46)
  pdf.setFontSize(8.5)
  const rowT=(lbl: string, val: string, off: number, bold=false)=>{
    pdf.setFont('helvetica', bold?'bold':'normal'); applyText(pdf, theme.text)
    pdf.text(lbl, tx+4, y+off)
    pdf.text(val, tx+tw-4, y+off, {align:'right'})
  }
  rowT('Subtotal',    `${d.sym}${d.subtotal.toFixed(2)}`,   8)
  rowT(`VAT (${d.taxRate}%)`, `${d.sym}${d.tax.toFixed(2)}`, 16)
  rowT('Paid',        `${d.sym}${d.paid.toFixed(2)}`,        24)
  rowT('Balance',     `${d.sym}${d.balance.toFixed(2)}`,     32)
  applyDraw(pdf, theme.primary); pdf.setLineWidth(0.5); pdf.line(tx+3, y+37, tx+tw-3, y+37)
  rowT('Grand Total', `${d.sym}${d.grandTotal.toFixed(2)}`,  44, true)

  // â”€â”€ AMOUNT IN WORDS â”€â”€
  const wy=y+52
  applyFill(pdf, theme.accent); pdf.rect(m, wy, cw, 13, 'F')
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.rect(m, wy, cw, 13)
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary); pdf.setFontSize(7.5)
  pdf.text('Amount in Words:', m+3, wy+5)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(8)
  const wordLines = safeWrap(pdf, d.amountInWords, cw-6)
  pdf.text(wordLines.slice(0,2), m+3, wy+9.5)

  // â”€â”€ NOTES / MEMO â”€â”€
  let notesY = wy+17
  if (notesY+28 > ph-38) { pdf.addPage(); applyFill(pdf, theme.paper); pdf.rect(0,0,pw,ph,'F'); notesY=m }
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.rect(m, notesY, cw, 28)
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary); pdf.setFontSize(7.5)
  pdf.text('NOTES / TERMS', m+3, notesY+5)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(7.8)
  pdf.text(safeWrap(pdf, d.notes, cw-6).slice(0,2), m+3, notesY+10)

  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary); pdf.setFontSize(7.5)
  pdf.text('MEMO', m+3, notesY+20)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(7.8)
  pdf.text(safeWrap(pdf, d.memo, cw-6).slice(0,1), m+3, notesY+25)

  // Transfer mode row
  const tmy = notesY+32
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.2); pdf.rect(m, tmy, cw, 9)
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary); pdf.setFontSize(7.5)
  pdf.text('Mode of Transfer:', m+3, tmy+6)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text)
  pdf.text(safeWrap(pdf, d.transferMode, cw-45).slice(0,1), m+38, tmy+6)

  // â”€â”€ SIGNATURE â”€â”€
  const sY = tmy+14
  applyDraw(pdf, theme.primary); pdf.setLineWidth(0.4); pdf.line(m+4, sY+12, m+54, sY+12)
  if (data.signatureUrl) {
    const sd=await loadImg(data.signatureUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', m+4, sY+1, 46, 10) } catch {}
  }
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.text); pdf.setFontSize(8.5)
  pdf.text(d.signeeName, m+4, sY+17)
  pdf.setFontSize(7.5); applyText(pdf, theme.muted); pdf.text('Authorized Signatory', m+4, sY+22)

  if (data.stampUrl) {
    const sd=await loadImg(data.stampUrl)
    if (sd) try {
      const sx=pw-m-30, sy=sY-2
      pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', sx, sy, 28, 28)
      pdf.setFontSize(7); applyText(pdf, theme.muted); pdf.text('Company Stamp', sx+14, sy+32, {align:'center'})
    } catch {}
  }

  // Footer stripe
  applyFill(pdf, theme.primary); pdf.rect(0, ph-2.5, pw, 2.5, 'F')
  pdf.setFontSize(7); pdf.setFont('helvetica','italic'); applyText(pdf, theme.muted)
  pdf.text('Computer-generated document â€” Classic Format.', pw/2, ph-5, {align:'center'})

  return pdf
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FORMAT 2 â€” MODERN
// Bold full-width primary header Â· Open party columns Â· Accent grand total
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function generateModernPDF(data: DocumentConfig, theme: BrandTheme, logoData: string|null, wm: string|null): Promise<jsPDF> {
  const pdf = new jsPDF({unit:'mm', format:'a4'})
  const pw=pdf.internal.pageSize.getWidth(), ph=pdf.internal.pageSize.getHeight()
  const m=14, cw=pw-m*2
  const d=prepareData(data)

  applyFill(pdf, [255,255,255]); pdf.rect(0,0,pw,ph,'F')
  addWatermark(pdf, wm, pw, ph)

  // â”€â”€ FULL-WIDTH PRIMARY HEADER (h=42) â”€â”€
  const hH=42
  applyFill(pdf, theme.secondary); pdf.rect(0,0,pw,hH,'F')
  // Darker accent stripe at bottom of header
  applyFill(pdf, theme.primary); pdf.rect(0, hH-2, pw, 2, 'F')

  await addLogo(pdf, logoData, theme, m, 9, 24, 24, d.companyName)

  const headerTextColor: Rgb = [255,255,255]
  const headerSubColor: Rgb = lighten(theme.secondary, 0.72)

  applyText(pdf, headerTextColor); pdf.setFont('helvetica','bold')
  fitFontSize(pdf, d.companyName, cw-100, 15, 9)
  pdf.text(d.companyName, m+28, 17)

  pdf.setFont('helvetica','normal'); pdf.setFontSize(7.5); applyText(pdf, headerSubColor)
  pdf.text(safeWrap(pdf, `${d.companyPhone}  Â·  ${d.companyEmail}`, cw-100).slice(0,1), m+28, 22.5)
  pdf.text(safeWrap(pdf, d.companyAddress, cw-100).slice(0,1), m+28, 27.5)

  // RECEIPT label right
  applyText(pdf, [255,255,255]); pdf.setFont('helvetica','bold'); pdf.setFontSize(26)
  pdf.text('RECEIPT', pw-m-2, 20, {align:'right'})
  pdf.setFontSize(7.5); applyText(pdf, headerSubColor); pdf.setFont('helvetica','normal')
  pdf.text(`No. ${d.receiptNumber}`, pw-m-2, 26.5, {align:'right'})
  pdf.text(`Date: ${d.issueDate}`, pw-m-2, 32, {align:'right'})

  // â”€â”€ PARTY SECTION (open, no boxes) â”€â”€
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

  // Contact / payment info
  const cpLine = safeWrap(pdf, `${d.companyPhone}  Â·  ${d.companyEmail}`, colW2)
  pdf.text(cpLine.slice(0,1), m, y+15)
  pdf.text(safeWrap(pdf, `Method: ${d.paymentMethod}  Â·  ${d.currency}`, colW2).slice(0,1), m+cw/2+4, y+15)

  // Bold primary divider
  y+=24
  applyDraw(pdf, theme.primary); pdf.setLineWidth(0.9); pdf.line(m, y, pw-m, y)
  applyDraw(pdf, lighten(theme.border, 0.4)); pdf.setLineWidth(0.2); pdf.line(m, y+1.5, pw-m, y+1.5)

  // â”€â”€ ITEMS TABLE â”€â”€
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
    if (y+9>ph-72) { pdf.addPage(); applyFill(pdf,[255,255,255]); pdf.rect(0,0,pw,ph,'F'); y=m; drawHead(y); y+=9 }
    if (i%2===1) { applyFill(pdf, lighten(theme.accent, 0.4)); pdf.rect(m,y,cw,9,'F') }
    applyDraw(pdf, theme.border); pdf.setLineWidth(0.15); pdf.rect(m,y,cw,9)
    pdf.line(colX[1],y,colX[1],y+9); pdf.line(colX[2],y,colX[2],y+9); pdf.line(colX[3],y,colX[3],y+9)
    applyText(pdf, theme.text); pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5)
    pdf.text(safeWrap(pdf, item.description||'', colW[0]-6).slice(0,1), colX[0]+3, y+6)
    pdf.text(String(item.quantity), colX[1]+3, y+6)
    pdf.text(`${d.sym}${(item.price||0).toFixed(2)}`, colX[2]+3, y+6)
    pdf.text(`${d.sym}${item.total.toFixed(2)}`, colX[3]+3, y+6)
    y+=9
  })

  if (d.items.length===0) {
    applyText(pdf, theme.muted); pdf.setFont('helvetica','italic'); pdf.setFontSize(8)
    pdf.text('No line items.', m+4, y+6); y+=9
  }

  // â”€â”€ TOTALS â”€â”€
  y+=4
  const tw=84, tx=pw-m-tw
  pdf.setFontSize(8.5)
  const rowM=(lbl: string, val: string, off: number, bold=false)=>{
    pdf.setFont('helvetica', bold?'bold':'normal'); applyText(pdf, theme.text)
    pdf.text(lbl, tx, y+off)
    pdf.text(val, tx+tw, y+off, {align:'right'})
  }
  rowM('Subtotal',    `${d.sym}${d.subtotal.toFixed(2)}`, 0)
  rowM(`VAT (${d.taxRate}%)`, `${d.sym}${d.tax.toFixed(2)}`, 8)
  rowM('Paid',        `${d.sym}${d.paid.toFixed(2)}`, 16)
  rowM('Balance',     `${d.sym}${d.balance.toFixed(2)}`, 24)
  applyDraw(pdf, theme.primary); pdf.setLineWidth(0.8); pdf.line(tx, y+28, tx+tw, y+28)
  // Filled grand total
  applyFill(pdf, theme.secondary); pdf.rect(tx-3, y+30, tw+6, 11, 'F')
  pdf.setFont('helvetica','bold'); applyText(pdf, [255,255,255]); pdf.setFontSize(9.5)
  pdf.text('Grand Total', tx, y+37.5)
  pdf.text(`${d.sym}${d.grandTotal.toFixed(2)}`, tx+tw, y+37.5, {align:'right'})

  // Amount in words
  y+=46
  pdf.setFontSize(8); pdf.setFont('helvetica','italic'); applyText(pdf, darken(theme.text, 0.1))
  const wLines = safeWrap(pdf, `â–¸  ${d.amountInWords}`, cw)
  pdf.text(wLines.slice(0,2), m, y)
  y += wLines.slice(0,2).length > 1 ? 12 : 6

  // â”€â”€ NOTES + SIGNATURE â”€â”€
  const noteW=cw*0.55, sigW=cw*0.41, sigX=pw-m-sigW
  if (y+32>ph-14) { pdf.addPage(); applyFill(pdf,[255,255,255]); pdf.rect(0,0,pw,ph,'F'); y=m }
  // Notes box
  applyFill(pdf, lighten(theme.accent, 0.3)); pdf.rect(m, y, noteW, 32, 'F')
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.25); pdf.rect(m, y, noteW, 32)
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.primary); pdf.setFontSize(8)
  pdf.text('NOTES', m+3, y+6)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(8)
  pdf.text(safeWrap(pdf, d.notes, noteW-6).slice(0,2), m+3, y+12)
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary); pdf.setFontSize(7.5)
  pdf.text('Transfer:', m+3, y+26.5)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text)
  pdf.text(safeWrap(pdf, d.transferMode, noteW-28).slice(0,1), m+22, y+26.5)

  // Signature box
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.25); pdf.rect(sigX, y, sigW, 32)
  if (data.signatureUrl) {
    const sd=await loadImg(data.signatureUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', sigX+4, y+4, sigW-8, 14) } catch {}
  }
  applyDraw(pdf, theme.primary); pdf.setLineWidth(0.5); pdf.line(sigX+4, y+20, sigX+sigW-4, y+20)
  pdf.setFont('helvetica','bold'); applyText(pdf, theme.text); pdf.setFontSize(8.5)
  pdf.text(d.signeeName, sigX+4, y+26)
  pdf.setFontSize(7.5); applyText(pdf, theme.muted); pdf.text('Authorized Signatory', sigX+4, y+31)
  if (data.stampUrl) {
    const sd=await loadImg(data.stampUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', sigX+sigW-22, y+2, 20, 20) } catch {}
  }

  // Footer
  applyFill(pdf, theme.primary); pdf.rect(0, ph-1.5, pw, 1.5, 'F')
  pdf.setFontSize(7); pdf.setFont('helvetica','italic'); applyText(pdf, theme.muted)
  pdf.text('Computer-generated document â€” Modern Format.', pw/2, ph-5, {align:'center'})
  return pdf
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FORMAT 3 â€” MINIMAL
// No fills Â· Large RECEIPT typography Â· Thin ruled lines Â· Airy layout
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function generateMinimalPDF(data: DocumentConfig, theme: BrandTheme, logoData: string|null, wm: string|null): Promise<jsPDF> {
  const pdf = new jsPDF({unit:'mm', format:'a4'})
  const pw=pdf.internal.pageSize.getWidth(), ph=pdf.internal.pageSize.getHeight()
  const m=18, cw=pw-m*2
  const d=prepareData(data)

  applyFill(pdf, [255,255,255]); pdf.rect(0,0,pw,ph,'F')
  addWatermark(pdf, wm, pw, ph)

  // â”€â”€ HEADER (logo + company name, single line) â”€â”€
  await addLogo(pdf, logoData, theme, m, 10, 20, 20, d.companyName)

  pdf.setFont('helvetica','bold'); applyText(pdf, theme.secondary)
  fitFontSize(pdf, d.companyName, cw-110, 14, 8)
  pdf.text(d.companyName, m+24, 18)

  pdf.setFont('helvetica','normal'); pdf.setFontSize(7); applyText(pdf, theme.muted)
  const hdrContact = safeWrap(pdf, `${d.companyPhone}  |  ${d.companyEmail}  |  ${d.companyAddress}`, cw-80)
  pdf.text(hdrContact.slice(0,1), m+24, 23.5)

  // RECEIPT â€” large, right-aligned
  applyText(pdf, theme.primary); pdf.setFont('helvetica','bold'); pdf.setFontSize(30)
  pdf.text('RECEIPT', pw-m, 24, {align:'right'})

  // Thin rule
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.5); pdf.line(m, 34, pw-m, 34)

  // Receipt metadata below rule
  pdf.setFontSize(7.5); applyText(pdf, theme.muted); pdf.setFont('helvetica','normal')
  pdf.text(`No. ${d.receiptNumber}  Â·  ${d.issueDate}  Â·  ${d.paymentMethod}  Â·  ${d.currency}`, m, 39.5)

  // â”€â”€ PARTY SECTION â”€â”€
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
  pdf.text(safeWrap(pdf, `${d.paymentMethod}  Â·  ${d.currency}`, colW2).slice(0,1), m+cw/2+4, y+17)

  // Thin rule
  y+=26; applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.line(m, y, pw-m, y)

  // â”€â”€ ITEMS (header underline only) â”€â”€
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
    if (y+8>ph-58) { pdf.addPage(); applyFill(pdf,[255,255,255]); pdf.rect(0,0,pw,ph,'F'); y=m }
    applyText(pdf, i%2===0 ? theme.text : darken(theme.text, 0.08))
    pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5)
    pdf.text(safeWrap(pdf, item.description||'', qX-m-4).slice(0,1), m, y)
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

  // â”€â”€ TOTALS (right-aligned plain text) â”€â”€
  y+=3; applyDraw(pdf, theme.border); pdf.setLineWidth(0.3); pdf.line(m, y, pw-m, y)
  y+=5
  const totW=52, totX=pw-m-totW
  const tot=(lbl: string, val: string, bold=false)=>{
    pdf.setFont('helvetica', bold?'bold':'normal'); pdf.setFontSize(bold?9:8.5)
    applyText(pdf, bold ? theme.primary : theme.text)
    pdf.text(lbl, totX, y)
    pdf.text(val, pw-m, y, {align:'right'})
    y+=6
  }
  tot('Subtotal',    `${d.sym}${d.subtotal.toFixed(2)}`)
  tot(`VAT (${d.taxRate}%)`, `${d.sym}${d.tax.toFixed(2)}`)
  tot('Paid',        `${d.sym}${d.paid.toFixed(2)}`)
  tot('Balance',     `${d.sym}${d.balance.toFixed(2)}`)
  applyDraw(pdf, theme.primary); pdf.setLineWidth(0.5); pdf.line(totX, y-3, pw-m, y-3)
  tot('Grand Total', `${d.sym}${d.grandTotal.toFixed(2)}`, true)

  // Amount in words â€” italic centered
  y+=3; pdf.setFontSize(7.5); pdf.setFont('helvetica','italic'); applyText(pdf, darken(theme.text, 0.1))
  const wLines = safeWrap(pdf, d.amountInWords, cw)
  pdf.text(wLines.slice(0,2), pw/2, y, {align:'center'})
  y += wLines.slice(0,2).length > 1 ? 12 : 7

  // â”€â”€ NOTES + TRANSFER â”€â”€
  if (y+26>ph-32) { pdf.addPage(); applyFill(pdf,[255,255,255]); pdf.rect(0,0,pw,ph,'F'); y=m }
  pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5); applyText(pdf, theme.secondary)
  pdf.text('Notes', m, y)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text); pdf.setFontSize(7.8)
  pdf.text(safeWrap(pdf, d.notes, cw*0.65).slice(0,2), m, y+5)

  pdf.setFont('helvetica','bold'); pdf.setFontSize(7.5); applyText(pdf, theme.secondary)
  pdf.text('Transfer:', m, y+18)
  pdf.setFont('helvetica','normal'); applyText(pdf, theme.text)
  pdf.text(safeWrap(pdf, d.transferMode, cw-30).slice(0,1), m+20, y+18)

  // â”€â”€ SIGNATURE (dashed line) â”€â”€
  y+=26
  applyDraw(pdf, theme.border); pdf.setLineWidth(0.3)
  pdf.setLineDashPattern([2,1.5], 0)
  pdf.line(m, y, m+54, y)
  pdf.setLineDashPattern([], 0)
  if (data.signatureUrl) {
    const sd=await loadImg(data.signatureUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', m, y-12, 50, 11) } catch {}
  }
  pdf.setFontSize(8.5); pdf.setFont('helvetica','normal'); applyText(pdf, theme.text)
  pdf.text(d.signeeName, m, y+5)
  pdf.setFontSize(7); applyText(pdf, theme.muted); pdf.text('Authorized Signatory', m, y+10)
  if (data.stampUrl) {
    const sd=await loadImg(data.stampUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', pw-m-26, y-14, 24, 24) } catch {}
  }

  // Footer
  pdf.setFontSize(7); pdf.setFont('helvetica','italic'); applyText(pdf, theme.muted)
  pdf.text('Computer-generated document â€” Minimal Format.', pw/2, ph-8, {align:'center'})
  return pdf
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// FORMAT 4 â€” EXECUTIVE
// Dark header Â· Primary accent bars Â· Premium warm paper Â· Formal typography
// All colors fully logo-driven â€” primary = accent, secondary = header dark
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function generateExecutivePDF(data: DocumentConfig, theme: BrandTheme, logoData: string|null, wm: string|null): Promise<jsPDF> {
  const pdf = new jsPDF({unit:'mm', format:'a4'})
  const pw=pdf.internal.pageSize.getWidth(), ph=pdf.internal.pageSize.getHeight()
  const m=14, cw=pw-m*2
  const d=prepareData(data)

  // Ensure HEADER is always dark enough for white text
  const lumSec = luminance(theme.secondary)
  const HEADER: Rgb = lumSec < 0.35 ? theme.secondary : darken(theme.secondary, 0.55)
  const ACCENT = theme.primary   // logo-driven accent (dynamic!)
  const PAPER: Rgb = lighten(theme.paper, 0.3)  // soft tinted paper

  applyFill(pdf, PAPER); pdf.rect(0,0,pw,ph,'F')
  addWatermark(pdf, wm, pw, ph)

  // â”€â”€ DARK HEADER (h=46) â”€â”€
  const hH=46
  applyFill(pdf, HEADER); pdf.rect(0,0,pw,hH,'F')
  // Top + bottom accent bars
  applyFill(pdf, ACCENT); pdf.rect(0,0,pw,2,'F')
  applyFill(pdf, ACCENT); pdf.rect(0,hH-2,pw,2,'F')

  // Logo in white inset box
  applyFill(pdf, [255,255,255]); pdf.roundedRect(m+2, 7, 30, 30, 3, 3, 'F')
  await addLogo(pdf, logoData, theme, m+4, 9, 26, 26, d.companyName)

  // Company info (white text)
  applyText(pdf, [255,255,255]); pdf.setFont('helvetica','bold')
  fitFontSize(pdf, d.companyName, cw-104, 16, 9)
  pdf.text(d.companyName, m+36, 18)
  pdf.setFont('helvetica','normal'); pdf.setFontSize(7.5); applyText(pdf, lighten(HEADER, 0.72))
  pdf.text(safeWrap(pdf, `${d.companyPhone}  Â·  ${d.companyEmail}`, cw-104).slice(0,1), m+36, 24)
  pdf.text(safeWrap(pdf, d.companyAddress, cw-104).slice(0,1), m+36, 29.5)

  // RECEIPT â€” in accent color, top right
  applyText(pdf, ACCENT); pdf.setFont('helvetica','bold'); pdf.setFontSize(26)
  pdf.text('RECEIPT', pw-m-2, 22, {align:'right'})
  pdf.setFontSize(7.5); applyText(pdf, lighten(HEADER, 0.72)); pdf.setFont('helvetica','normal')
  pdf.text(`No. ${d.receiptNumber}`, pw-m-2, 29, {align:'right'})
  pdf.text(`Date: ${d.issueDate}`, pw-m-2, 34.5, {align:'right'})

  // â”€â”€ PARTY BLOCKS (y=52, h=42) â”€â”€
  let y = hH+6
  const half=cw/2
  const PARTY_BG: Rgb = lighten(theme.paper, 0.2)
  const PARTY_TEXT: Rgb = HEADER

  // FROM
  applyFill(pdf, PARTY_BG); pdf.rect(m, y, half-3, 42, 'F')
  applyDraw(pdf, ACCENT); pdf.setLineWidth(0.5); pdf.rect(m, y, half-3, 42)
  applyFill(pdf, HEADER); pdf.rect(m, y, half-3, 8, 'F')
  applyText(pdf, ACCENT); pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5)
  pdf.text('FROM', m+4, y+5.5)

  const pfw = half-8
  applyText(pdf, PARTY_TEXT); pdf.setFont('helvetica','bold'); pdf.setFontSize(9)
  pdf.text(safeWrap(pdf, d.companyName, pfw).slice(0,1), m+3, y+14)
  pdf.setFont('helvetica','normal'); pdf.setFontSize(7.8); applyText(pdf, HEADER)
  pdf.text(safeWrap(pdf, d.companyAddress, pfw).slice(0,2), m+3, y+19.5)
  pdf.text(safeWrap(pdf, d.companyPhone, pfw).slice(0,1), m+3, y+30)
  pdf.text(safeWrap(pdf, d.companyEmail, pfw).slice(0,1), m+3, y+35.5)

  // BILL TO
  applyFill(pdf, PARTY_BG); pdf.rect(m+half+3, y, half-3, 42, 'F')
  applyDraw(pdf, ACCENT); pdf.setLineWidth(0.5); pdf.rect(m+half+3, y, half-3, 42)
  applyFill(pdf, HEADER); pdf.rect(m+half+3, y, half-3, 8, 'F')
  applyText(pdf, ACCENT); pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5)
  pdf.text('BILL TO', m+half+7, y+5.5)

  applyText(pdf, PARTY_TEXT); pdf.setFont('helvetica','bold'); pdf.setFontSize(9)
  pdf.text(safeWrap(pdf, d.customerName, pfw).slice(0,1), m+half+6, y+14)
  pdf.setFont('helvetica','normal'); pdf.setFontSize(7.8); applyText(pdf, HEADER)
  pdf.text(safeWrap(pdf, d.customerAddress, pfw).slice(0,2), m+half+6, y+19.5)
  pdf.text(`Method: ${d.paymentMethod}`, m+half+6, y+30)
  pdf.text(`Currency: ${d.currency}`, m+half+6, y+35.5)

  // Accent divider
  y+=48; applyDraw(pdf, ACCENT); pdf.setLineWidth(1); pdf.line(m, y, pw-m, y)
  applyDraw(pdf, lighten(ACCENT, 0.45)); pdf.setLineWidth(0.2); pdf.line(m, y+1.5, pw-m, y+1.5)

  // â”€â”€ ITEMS TABLE â”€â”€
  y+=6
  const colW=[cw*0.5, cw*0.13, cw*0.185, cw*0.185]
  const colX=[m, m+colW[0], m+colW[0]+colW[1], m+colW[0]+colW[1]+colW[2]]
  const lastColBg: Rgb = lighten(ACCENT, 0.78)

  const drawHead=(hy: number)=>{
    applyFill(pdf, HEADER); pdf.rect(m, hy, cw, 10, 'F')
    applyFill(pdf, darken(ACCENT, 0.1)); pdf.rect(colX[3], hy, colW[3], 10, 'F')
    applyDraw(pdf, ACCENT); pdf.setLineWidth(0.45); pdf.rect(m, hy, cw, 10)
    pdf.line(colX[1],hy,colX[1],hy+10); pdf.line(colX[2],hy,colX[2],hy+10); pdf.line(colX[3],hy,colX[3],hy+10)
    applyText(pdf, contrastColor(HEADER)); pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5)
    pdf.text('DESCRIPTION', colX[0]+3, hy+7)
    pdf.text('QTY',         colX[1]+3, hy+7)
    pdf.text('UNIT PRICE',  colX[2]+3, hy+7)
    applyText(pdf, contrastColor(darken(ACCENT, 0.1)))
    pdf.text('TOTAL',       colX[3]+3, hy+7)
  }
  drawHead(y); y+=10

  d.items.forEach((item, i)=>{
    if (y+10>ph-78) { pdf.addPage(); applyFill(pdf, PAPER); pdf.rect(0,0,pw,ph,'F'); y=m; drawHead(y); y+=10 }
    const rowBg: Rgb = i%2===0 ? lighten(PAPER, 0.4) : PARTY_BG
    applyFill(pdf, rowBg); pdf.rect(m, y, cw, 10, 'F')
    applyFill(pdf, lastColBg); pdf.rect(colX[3], y, colW[3], 10, 'F')
    applyDraw(pdf, lighten(ACCENT, 0.6)); pdf.setLineWidth(0.15); pdf.rect(m,y,cw,10)
    pdf.line(colX[1],y,colX[1],y+10); pdf.line(colX[2],y,colX[2],y+10); pdf.line(colX[3],y,colX[3],y+10)
    applyText(pdf, HEADER); pdf.setFont('helvetica','normal'); pdf.setFontSize(8.5)
    pdf.text(safeWrap(pdf, item.description||'', colW[0]-6).slice(0,1), colX[0]+3, y+7)
    pdf.text(String(item.quantity), colX[1]+3, y+7)
    pdf.text(`${d.sym}${(item.price||0).toFixed(2)}`, colX[2]+3, y+7)
    applyText(pdf, darken(ACCENT, 0.3))
    pdf.text(`${d.sym}${item.total.toFixed(2)}`, colX[3]+3, y+7)
    y+=10
  })

  if (d.items.length===0) {
    applyText(pdf, theme.muted); pdf.setFont('helvetica','italic'); pdf.setFontSize(8)
    pdf.text('No line items.', m+4, y+7); y+=10
  }

  // â”€â”€ TOTALS â”€â”€
  y+=6; const tw=92, tx=pw-m-tw
  pdf.setFontSize(8.5)
  const rowE=(lbl: string, val: string, off: number, accent=false)=>{
    pdf.setFont('helvetica', accent?'bold':'normal')
    applyText(pdf, accent ? ACCENT : HEADER)
    pdf.text(lbl, tx, y+off)
    pdf.text(val, tx+tw, y+off, {align:'right'})
  }
  rowE('Subtotal',    `${d.sym}${d.subtotal.toFixed(2)}`, 0)
  rowE(`VAT (${d.taxRate}%)`, `${d.sym}${d.tax.toFixed(2)}`, 8)
  rowE('Paid',        `${d.sym}${d.paid.toFixed(2)}`, 16)
  rowE('Balance',     `${d.sym}${d.balance.toFixed(2)}`, 24)
  applyDraw(pdf, ACCENT); pdf.setLineWidth(0.6); pdf.line(tx, y+28, tx+tw, y+28)
  // Premium boxed grand total
  applyFill(pdf, HEADER); pdf.rect(tx-3, y+30, tw+6, 13, 'F')
  applyDraw(pdf, ACCENT); pdf.setLineWidth(0.6); pdf.rect(tx-3, y+30, tw+6, 13)
  pdf.setFont('helvetica','bold'); pdf.setFontSize(10); applyText(pdf, ACCENT)
  pdf.text('Grand Total', tx, y+39)
  pdf.text(`${d.sym}${d.grandTotal.toFixed(2)}`, tx+tw, y+39, {align:'right'})

  // Amount in words
  y+=50; pdf.setFontSize(7.8); pdf.setFont('helvetica','italic'); applyText(pdf, darken(HEADER, 0.1))
  const wLines = safeWrap(pdf, `â¬¥  ${d.amountInWords}`, cw)
  pdf.text(wLines.slice(0,2), pw/2, y, {align:'center'})
  y += wLines.slice(0,2).length > 1 ? 12 : 7

  // â”€â”€ NOTES + SIGNATURE â”€â”€
  if (y+34>ph-22) { pdf.addPage(); applyFill(pdf, PAPER); pdf.rect(0,0,pw,ph,'F'); y=m }
  const nw=cw*0.55, sw=cw-nw-4, sx=pw-m-sw

  // Notes box
  applyFill(pdf, PARTY_BG); pdf.rect(m, y, nw, 34, 'F')
  applyDraw(pdf, ACCENT); pdf.setLineWidth(0.35); pdf.rect(m, y, nw, 34)
  applyFill(pdf, HEADER); pdf.rect(m, y, nw, 9, 'F')
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8); applyText(pdf, ACCENT)
  pdf.text('NOTES & TERMS', m+3, y+6)
  pdf.setFont('helvetica','normal'); pdf.setFontSize(7.8); applyText(pdf, HEADER)
  pdf.text(safeWrap(pdf, d.notes, nw-6).slice(0,2), m+3, y+13.5)
  pdf.setFont('helvetica','bold'); applyText(pdf, HEADER); pdf.setFontSize(7.5)
  pdf.text('Transfer:', m+3, y+27)
  pdf.setFont('helvetica','normal'); applyText(pdf, HEADER)
  pdf.text(safeWrap(pdf, d.transferMode, nw-26).slice(0,1), m+21, y+27)

  // Signature box
  applyFill(pdf, PARTY_BG); pdf.rect(sx, y, sw, 34, 'F')
  applyDraw(pdf, ACCENT); pdf.setLineWidth(0.35); pdf.rect(sx, y, sw, 34)
  if (data.signatureUrl) {
    const sd=await loadImg(data.signatureUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', sx+4, y+4, sw-8, 13) } catch {}
  }
  applyDraw(pdf, ACCENT); pdf.setLineWidth(0.5); pdf.line(sx+4, y+20, sx+sw-4, y+20)
  pdf.setFont('helvetica','bold'); pdf.setFontSize(8.5); applyText(pdf, HEADER)
  pdf.text(d.signeeName, sx+4, y+27)
  pdf.setFontSize(7.5); applyText(pdf, darken(HEADER, 0.15)); pdf.text('Authorized Signatory', sx+4, y+32)
  if (data.stampUrl) {
    const sd=await loadImg(data.stampUrl)
    if (sd) try { pdf.addImage(sd, sd.includes('png')?'PNG':'JPEG', sx+sw-22, y+2, 18, 18) } catch {}
  }

  // Accent footer bar
  applyFill(pdf, HEADER); pdf.rect(0, ph-7, pw, 7, 'F')
  applyFill(pdf, ACCENT); pdf.rect(0, ph-7, pw, 1.5, 'F')
  pdf.setFontSize(7); pdf.setFont('helvetica','italic'); applyText(pdf, lighten(HEADER, 0.65))
  pdf.text('Official computer-generated document â€” Executive Format.', pw/2, ph-3.5, {align:'center'})
  return pdf
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MAIN ENTRY POINT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function generateReceiptPDF(data: DocumentConfig, onComplete?: (url: string) => void): Promise<string> {
  const theme = toStandardReceiptTheme(await deriveTheme(data.logoUrl))
  const logoData = await loadImg(data.logoUrl||'')
  const wm = data.logoUrl ? await makeWatermark(data.logoUrl, 0.04) : null
  const format = data.receiptFormat || 'classic'

  let pdf: jsPDF
  switch (format) {
    case 'modern':    pdf = await generateModernPDF(data, theme, logoData, wm); break
    case 'minimal':   pdf = await generateMinimalPDF(data, theme, logoData, wm); break
    case 'executive': pdf = await generateExecutivePDF(data, theme, logoData, wm); break
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
