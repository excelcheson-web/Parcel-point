'use client'

import { useCallback, useEffect } from 'react'
import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import type { TrackingEventRecord, WaybillCurrentLocationDetails, WaybillFormData, WaybillRouteMetrics } from '@/lib/types'
import { COMPANY_CONTACT, SKYSHIP_CONFIG, normalizeTransportMode, type TransportModeKey } from '@/lib/constants'

interface WaybillTemplateProps {
  data: WaybillFormData
  onComplete?: (pdfUrl: string) => void
}

interface WaybillPdfItem {
  noOfPcs?: number
  pieces?: number
  quantity?: number
  grossWeight?: number
  weight?: number
  typeOfPkg?: string
  description?: string
  cargoDescription?: string
  value?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
}

type RGB = [number, number, number]

// ── Parcel Point brand palette ────────────────────────────────────────────────
const NAVY: RGB = [7, 20, 39]          // #071427 brand navy
const PURPLE: RGB = [124, 58, 237]     // #7C3AED brand purple
const PURPLE_SOFT: RGB = [237, 231, 252]
const INK: RGB = [26, 43, 69]          // body text
const MUTED: RGB = [90, 112, 144]      // secondary text
const BORDER: RGB = [218, 226, 239]    // hairlines
const PANEL: RGB = [246, 248, 252]     // light panel fill
const WHITE: RGB = [255, 255, 255]

// Shipment-type badge theme, color coded per transport mode
const MODE_THEME: Record<TransportModeKey, { badge: string; freight: string; color: RGB; soft: RGB; icon: string }> = {
  AIR: { badge: 'AIRWAY BILL', freight: 'AIR FREIGHT', color: [29, 78, 216], soft: [232, 240, 254], icon: 'AIR' },
  SEA: { badge: 'SEAWAY BILL', freight: 'SEA FREIGHT', color: [15, 118, 110], soft: [226, 246, 242], icon: 'SEA' },
  LAND: { badge: 'LAND WAYBILL', freight: 'LAND FREIGHT', color: [180, 83, 9], soft: [253, 240, 226], icon: 'TRK' },
  DOOR_TO_DOOR: { badge: 'DOOR TO DOOR', freight: 'DOOR TO DOOR', color: PURPLE, soft: PURPLE_SOFT, icon: 'DTD' },
}

type StatusIcon = 'transit' | 'delivered' | 'customs' | 'pending' | 'pickup' | 'delivery' | 'exception'

function statusTheme(status: string): { color: RGB; soft: RGB; icon: StatusIcon; label: string } {
  const s = (status || '').toLowerCase()
  if (s.includes('out') && s.includes('delivery')) return { color: [29, 78, 216], soft: [232, 240, 254], icon: 'delivery', label: 'Out For Delivery' }
  if (s.includes('deliver')) return { color: [21, 128, 61], soft: [226, 246, 233], icon: 'delivered', label: 'Delivered' }
  if (s.includes('delay') || s.includes('exception') || s.includes('return') || s.includes('cancel'))
    return { color: [185, 28, 28], soft: [253, 232, 232], icon: 'exception', label: 'Exception' }
  if (s.includes('customs')) return { color: [180, 83, 9], soft: [253, 240, 226], icon: 'customs', label: 'At Customs' }
  if (s.includes('hold')) return { color: [180, 83, 9], soft: [253, 240, 226], icon: 'customs', label: 'On Hold' }
  if (s.includes('pickup')) return { color: [147, 51, 234], soft: [243, 232, 255], icon: 'pickup', label: 'Pending Pickup' }
  if (s.includes('pending') || s.includes('created') || s.includes('received'))
    return { color: [51, 65, 85], soft: [238, 242, 248], icon: 'pending', label: 'Pending Pickup' }
  return { color: PURPLE, soft: PURPLE_SOFT, icon: 'transit', label: 'In Transit' }
}

// Cache for loaded images
const imageCache: Record<string, string> = {}

async function loadImageAsDataURL(url: string): Promise<string | null> {
  if (imageCache[url]) return imageCache[url]
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        imageCache[url] = result
        resolve(result)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch (e) {
    console.error('Failed to load image:', url, e)
    return null
  }
}

// Normalise an image through canvas before handing it to jsPDF.
// Always re-encodes via canvas so unusual PNG modes (palette, 16-bit) become
// standard RGBA, which jsPDF handles reliably. Also downsamples to maxPx if
// the image is larger. Falls back to the original data URL on canvas failure.
async function normalizeForPdf(dataUrl: string, maxPx = 400): Promise<string> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return dataUrl
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => {
      const ratio = Math.min(maxPx / img.naturalWidth, maxPx / img.naturalHeight, 1)
      const w = Math.round(img.naturalWidth  * ratio)
      const h = Math.round(img.naturalHeight * ratio)
      if (!w || !h) { resolve(dataUrl); return }
      const canvas = document.createElement('canvas')
      canvas.width  = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(dataUrl); return }
      ctx.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => { console.error('[WaybillPDF] canvas normalise failed for image'); resolve(dataUrl) }
    img.src = dataUrl
  })
}

function makeBarcodeDataURL(value: string): string {
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, value, {
    format: 'CODE128',
    width: 2,
    height: 48,
    displayValue: false,
    margin: 0,
    background: '#ffffff',
    lineColor: '#071427',
  })
  return canvas.toDataURL('image/png')
}

async function makeQrDataURL(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 0,
    width: 320,
    color: { dark: '#071427', light: '#ffffff' },
  })
}

// Deterministic document authenticity code derived from the waybill number
function buildVerificationId(seed: string, issueDate: Date): string {
  let h = 7
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return `PP-${issueDate.getFullYear()}-${String(h % 1000000).padStart(6, '0')}`
}

function hashHex(seed: string, length = 16): string {
  let h = 2166136261
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  let out = h.toString(16).toUpperCase().padStart(8, '0')
  while (out.length < length) {
    h = Math.imul(h ^ out.charCodeAt(out.length % out.length), 16777619) >>> 0
    out += h.toString(16).toUpperCase().padStart(8, '0')
  }
  return out.slice(0, length)
}

function buildDocumentId(seed: string, issueDate: Date): string {
  return `PP-DOC-${issueDate.getFullYear()}-${hashHex(seed, 10)}`
}

function buildVerificationCode(seed: string): string {
  const hash = hashHex(seed, 12)
  return `${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`
}

function coerceFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return value
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function formatDateShort(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDayMonth(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function formatTime(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatMoney(value: number, currency = 'USD'): string {
  const amount = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return currency === 'USD' ? `$${amount}` : `${currency} ${amount}`
}

function formatDistance(value: number | null): string {
  if (value === null) return 'Pending API'
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })} km`
}

function formatCoordinate(value: number | null): string {
  if (value === null) return 'Pending GPS'
  return value.toFixed(5)
}

function estimateVolumeCbm(items: WaybillPdfItem[], fallback: unknown): number | null {
  const direct = coerceFiniteNumber(fallback)
  if (direct !== null && direct > 0) return direct
  const total = items.reduce((sum, item) => {
    const dims = item.dimensions
    if (!dims) return sum
    const length = dims.length || 0
    const width = dims.width || 0
    const height = dims.height || 0
    if (length <= 0 || width <= 0 || height <= 0) return sum
    const pieces = item.noOfPcs || item.pieces || item.quantity || 1
    return sum + (length * width * height * pieces) / 1000000
  }, 0)
  return total > 0 ? total : null
}

function normalizeLocationDetails(location: string, data: WaybillFormData, eventTime?: string): WaybillCurrentLocationDetails {
  const supplied = data.currentLocationDetails
  const parts = location
    .split(/[\/,]/)
    .map((part) => part.trim())
    .filter(Boolean)
  return {
    facility: data.currentFacility || supplied?.facility || location || 'Pending facility scan',
    city: data.currentCity || supplied?.city || parts[0] || 'Pending city',
    stateOrProvince: data.currentStateOrProvince || supplied?.stateOrProvince || parts[2] || 'Pending state/province',
    country: data.currentCountry || supplied?.country || parts[3] || 'Pending country',
    latitude: coerceFiniteNumber(data.currentLatitude) ?? coerceFiniteNumber(supplied?.latitude) ?? undefined,
    longitude: coerceFiniteNumber(data.currentLongitude) ?? coerceFiniteNumber(supplied?.longitude) ?? undefined,
    scannedAt: data.currentLocationTimestamp || supplied?.scannedAt || eventTime,
    timezone: supplied?.timezone,
  }
}

// Pick up to `max` milestone indices, always keeping first, last and current
function sampleTimelineIndices(count: number, currentIdx: number, max = 7): number[] {
  if (count <= max) return Array.from({ length: count }, (_, i) => i)
  const picks = new Set<number>([0, count - 1, currentIdx])
  const step = (count - 1) / (max - 1)
  for (let k = 1; k < max - 1; k++) picks.add(Math.round(k * step))
  const arr = [...picks].sort((a, b) => a - b)
  while (arr.length > max) {
    let bestI = -1
    let bestGap = Infinity
    for (let i = 1; i < arr.length - 1; i++) {
      if (arr[i] === currentIdx) continue
      const gap = arr[i + 1] - arr[i - 1]
      if (gap < bestGap) {
        bestGap = gap
        bestI = i
      }
    }
    if (bestI < 0) break
    arr.splice(bestI, 1)
  }
  return arr
}

export async function generateWaybillPDF(data: WaybillFormData): Promise<string> {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true,
    floatPrecision: 16,
  })

  const pageW = 210
  const pageH = 297
  const M = 10
  const W = pageW - 2 * M

  // ── Shared drawing helpers ──────────────────────────────────────────────────
  const setFill = (c: RGB) => pdf.setFillColor(c[0], c[1], c[2])
  const setStroke = (c: RGB) => pdf.setDrawColor(c[0], c[1], c[2])
  const setText = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2])

  const clampLine = (text: string, maxWidth: number): string => {
    let t = String(text ?? '').replace(/\s+/g, ' ').trim()
    if (!t) return '—'
    if (pdf.getTextWidth(t) <= maxWidth) return t
    while (t.length > 1 && pdf.getTextWidth(`${t}…`) > maxWidth) t = t.slice(0, -1)
    return `${t}…`
  }

  const wrapClamp = (text: string, x: number, y: number, maxWidth: number, maxLines: number, lineH: number, align: 'left' | 'center' | 'right' = 'left'): number => {
    const safe = String(text ?? '').replace(/\s+/g, ' ').trim() || '—'
    const wrapped = pdf.splitTextToSize(safe, maxWidth) as string[]
    const lines = wrapped.slice(0, maxLines)
    if (wrapped.length > maxLines && lines.length > 0) {
      lines[lines.length - 1] = clampLine(`${lines[lines.length - 1]}…`, maxWidth)
    }
    lines.forEach((line, i) => pdf.text(line, x, y + i * lineH, { align }))
    return lines.length
  }

  // Section heading: purple tick + tracked navy title + hairline to the right edge
  const sectionTitle = (title: string, y: number) => {
    setFill(PURPLE)
    pdf.rect(M, y - 3.2, 1.4, 4.2, 'F')
    setText(NAVY)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8.5)
    pdf.text(title.toUpperCase(), M + 4, y, { charSpace: 0.5 })
    const titleW = pdf.getTextWidth(title.toUpperCase()) + title.length * 0.5
    setStroke(BORDER)
    pdf.setLineWidth(0.25)
    pdf.line(M + 8 + titleW, y - 1.2, pageW - M, y - 1.2)
  }

  // Label/value data cell used by the information grids
  const dataCell = (x: number, y: number, w: number, h: number, label: string, value: string, opts?: { mono?: boolean; labelColor?: RGB; fill?: RGB; valueColor?: RGB }) => {
    setFill(opts?.fill ?? WHITE)
    setStroke(BORDER)
    pdf.setLineWidth(0.25)
    pdf.rect(x, y, w, h, 'FD')
    setText(opts?.labelColor ?? MUTED)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(4.9)
    pdf.text(label.toUpperCase(), x + 2.2, y + 3.5, { charSpace: 0.25 })
    setText(opts?.valueColor ?? INK)
    pdf.setFont(opts?.mono ? 'courier' : 'helvetica', 'bold')
    pdf.setFontSize(7.2)
    pdf.text(clampLine(value, w - 4.4), x + 2.2, y + 7.6)
  }

  const drawTransportIcon = (modeKey: TransportModeKey, x: number, y: number, color: RGB = WHITE) => {
    setStroke(color)
    setFill(color)
    pdf.setLineWidth(0.55)

    if (modeKey === 'AIR') {
      pdf.line(x, y + 2.6, x + 8, y)
      pdf.line(x + 3, y + 1.6, x + 7.8, y + 3.2)
      pdf.line(x + 3.6, y + 1.5, x + 2.4, y + 5.2)
      pdf.line(x + 5.2, y + 0.9, x + 6.3, y - 1.6)
      return
    }

    if (modeKey === 'SEA') {
      pdf.line(x, y + 1.9, x + 8, y + 1.9)
      pdf.line(x + 1.1, y + 1.9, x + 2.4, y + 4)
      pdf.line(x + 2.4, y + 4, x + 6.5, y + 4)
      pdf.line(x + 6.5, y + 4, x + 7.6, y + 1.9)
      pdf.line(x + 3.5, y + 1.6, x + 3.5, y - 1.4)
      pdf.line(x + 3.5, y - 1.4, x + 5.5, y + 1.6)
      pdf.line(x + 1.1, y + 5.2, x + 2.4, y + 4.8)
      pdf.line(x + 3.2, y + 5.2, x + 4.5, y + 4.8)
      pdf.line(x + 5.4, y + 5.2, x + 6.7, y + 4.8)
      return
    }

    if (modeKey === 'LAND') {
      pdf.roundedRect(x, y - 1.2, 5.4, 3.6, 0.5, 0.5, 'S')
      pdf.line(x + 5.4, y + 0.2, x + 7.8, y + 0.2)
      pdf.line(x + 7.8, y + 0.2, x + 8.6, y + 1.4)
      pdf.line(x + 8.6, y + 1.4, x + 8.6, y + 2.4)
      pdf.circle(x + 2, y + 3, 0.8, 'S')
      pdf.circle(x + 7, y + 3, 0.8, 'S')
      return
    }

    pdf.line(x, y + 1.8, x + 4, y - 1.8)
    pdf.line(x + 4, y - 1.8, x + 8, y + 1.8)
    pdf.rect(x + 1.3, y + 1.8, 5.4, 4.1, 'S')
    pdf.rect(x + 3.2, y + 3, 1.6, 2.9, 'S')
  }

  const drawStatusIcon = (icon: StatusIcon, x: number, y: number, color: RGB) => {
    setStroke(color)
    setFill(color)
    pdf.setLineWidth(0.55)
    if (icon === 'delivered') {
      pdf.circle(x, y, 2.3, 'S')
      pdf.line(x - 1, y + 0.1, x - 0.2, y + 0.9)
      pdf.line(x - 0.2, y + 0.9, x + 1.3, y - 0.9)
      return
    }
    if (icon === 'exception') {
      pdf.circle(x, y, 2.3, 'S')
      pdf.line(x, y - 1.2, x, y + 0.3)
      pdf.circle(x, y + 1.2, 0.2, 'F')
      return
    }
    if (icon === 'customs') {
      pdf.rect(x - 1.5, y - 1.6, 3, 3.2, 'S')
      pdf.line(x - 1.5, y - 0.4, x + 1.5, y - 0.4)
      pdf.line(x - 0.5, y - 1.6, x - 0.5, y + 1.6)
      pdf.line(x + 0.5, y - 1.6, x + 0.5, y + 1.6)
      return
    }
    if (icon === 'pending' || icon === 'pickup') {
      pdf.circle(x, y, 2.3, 'S')
      pdf.line(x, y, x, y - 1.3)
      pdf.line(x, y, x + 1.1, y + 0.6)
      return
    }
    if (icon === 'delivery') {
      pdf.roundedRect(x - 2.2, y - 1.2, 3.7, 2.7, 0.4, 0.4, 'S')
      pdf.line(x + 1.5, y - 0.2, x + 2.5, y + 0.7)
      pdf.circle(x - 0.9, y + 1.8, 0.45, 'S')
      pdf.circle(x + 1.7, y + 1.8, 0.45, 'S')
      return
    }
    pdf.circle(x, y, 2.3, 'S')
    pdf.line(x - 1, y + 1.1, x + 1.2, y - 1.1)
    pdf.line(x + 1.2, y - 1.1, x + 1.2, y + 0.8)
  }

  const drawStatusPill = (x: number, y: number, status: string, maxW: number, opts?: { compact?: boolean }) => {
    const themeForStatus = statusTheme(status)
    const rawStatus = String(status || '').trim()
    const displayStatus = rawStatus.includes('_') || rawStatus === rawStatus.toUpperCase()
      ? themeForStatus.label
      : rawStatus || themeForStatus.label
    const text = clampLine(displayStatus.toUpperCase(), maxW - 12)
    const h = opts?.compact ? 6.2 : 7
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(opts?.compact ? 5.6 : 6.4)
    const w = Math.min(pdf.getTextWidth(text) + 14, maxW)
    setFill(themeForStatus.soft)
    pdf.roundedRect(x, y, w, h, h / 2, h / 2, 'F')
    drawStatusIcon(themeForStatus.icon, x + 4.3, y + h / 2, themeForStatus.color)
    setText(themeForStatus.color)
    pdf.text(text, x + 8.7, y + h / 2 + 1.2)
    return w
  }

  const drawSnapshotCell = (x: number, y: number, w: number, label: string, value: string, opts?: { mono?: boolean; fill?: RGB; valueColor?: RGB }) => {
    setFill(opts?.fill || WHITE)
    setStroke(BORDER)
    pdf.setLineWidth(0.25)
    pdf.roundedRect(x, y, w, 12.5, 1.5, 1.5, 'FD')
    setText(MUTED)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(4.9)
    pdf.text(label.toUpperCase(), x + 2.4, y + 3.6, { charSpace: 0.25 })
    setText(opts?.valueColor || NAVY)
    pdf.setFont(opts?.mono ? 'courier' : 'helvetica', 'bold')
    pdf.setFontSize(8.2)
    pdf.text(clampLine(value, w - 5), x + 2.4, y + 8.6)
  }

  const drawPanelMetric = (x: number, y: number, label: string, value: string, w: number, opts?: { mono?: boolean; valueColor?: RGB }) => {
    setText(MUTED)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(4.3)
    pdf.text(label.toUpperCase(), x, y, { charSpace: 0.2 })
    setText(opts?.valueColor || INK)
    pdf.setFont(opts?.mono ? 'courier' : 'helvetica', 'bold')
    pdf.setFontSize(5.9)
    pdf.text(clampLine(value, w), x, y + 3)
  }

  // ── Derived shipment data (all values flow from the admin dashboard) ───────
  const now = new Date()
  const mode = normalizeTransportMode(data.transportMode || data.shipmentMode)
  const theme = MODE_THEME[mode]
  const waybillNumber = String(data.waybillNumber || data.consignmentNumber || 'PP-WB-000000')
  const trackingNumber = String(data.trackingNumber || waybillNumber)
  const issueDateIso = data.dateOfIssue || data.createdAt || now.toISOString()
  const issueDate = new Date(issueDateIso)
  const origin = String(data.portOfDeparture || data.airportOfDeparture || '—')
  const destination = String(data.portOfDestination || data.airportOfDestination || '—')
  const currency = String(data.currency || 'USD')

  const events: TrackingEventRecord[] = (Array.isArray(data.trackingEvents) ? [...data.trackingEvents] : [])
    .filter((e) => e && e.eventTime)
    .sort((a, b) => Date.parse(a.eventTime) - Date.parse(b.eventTime))

  let currentIdx = -1
  events.forEach((e, i) => {
    if (Date.parse(e.eventTime) <= now.getTime()) currentIdx = i
  })
  if (currentIdx < 0) currentIdx = 0

  const currentStatus = String(data.currentStatus || events[currentIdx]?.status || data.status || 'Pending')
  const currentLocation = String(data.currentLocation || events[currentIdx]?.location || origin)
  const currentEventTime = events[currentIdx]?.eventTime
  const currentLocationDetails = normalizeLocationDetails(currentLocation, data, currentEventTime)
  const etaIso = data.estimatedArrivalDate || data.estimatedDeliveryDate || data.arrivalDate
  const sTheme = statusTheme(currentStatus)

  const routeMetrics: WaybillRouteMetrics | undefined = data.routeMetrics
  const suppliedProgress =
    coerceFiniteNumber(data.transitProgressPercent) ??
    coerceFiniteNumber(routeMetrics?.progressPercent) ??
    coerceFiniteNumber(routeMetrics?.estimatedTransitProgress)
  const eventProgress = events.length > 1
    ? currentIdx / (events.length - 1)
    : currentStatus.toLowerCase().includes('deliver')
      ? 1
      : currentStatus.toLowerCase().includes('pending') || currentStatus.toLowerCase().includes('created')
        ? 0.12
        : 0.5
  const normalizedSuppliedProgress = suppliedProgress === null
    ? null
    : suppliedProgress > 1
      ? suppliedProgress / 100
      : suppliedProgress
  const transitProgress = clampNumber(normalizedSuppliedProgress ?? eventProgress, 0, 1)
  const progressPct = Math.round(transitProgress * 100)
  const totalDistanceKm = coerceFiniteNumber(data.totalDistanceKm) ?? coerceFiniteNumber(routeMetrics?.totalDistanceKm)
  let distanceTraveledKm = coerceFiniteNumber(data.distanceTraveledKm) ?? coerceFiniteNumber(routeMetrics?.distanceTraveledKm)
  let distanceRemainingKm = coerceFiniteNumber(data.distanceRemainingKm) ?? coerceFiniteNumber(routeMetrics?.distanceRemainingKm)
  if (totalDistanceKm !== null) {
    if (distanceTraveledKm === null) distanceTraveledKm = totalDistanceKm * transitProgress
    if (distanceRemainingKm === null) distanceRemainingKm = Math.max(totalDistanceKm - distanceTraveledKm, 0)
  }

  const items = (data.items || []) as WaybillPdfItem[]
  const totalPieces = data.totalPieces || data.pieces || items.reduce((s, it) => s + (it.noOfPcs || it.pieces || it.quantity || 0), 0) || 1
  const totalWeight = data.totalWeight || data.weight || items.reduce((s, it) => s + (it.grossWeight || it.weight || 0), 0) || 0
  const declaredValue = typeof data.declaredValue === 'number' && data.declaredValue > 0
    ? data.declaredValue
    : items.reduce((s, it) => s + (it.value || 0), 0)
  const totalVolume = estimateVolumeCbm(items, data.totalVolume)
  const shipmentType = String(data.shipmentType || data.serviceTypeString || theme.freight)
  const masterWaybillNumber = String(data.masterWaybillNumber || waybillNumber)
  const childPackageCount = Array.isArray(data.childPackages)
    ? data.childPackages.length
    : Math.max(items.length - 1, 0)

  const carrierName = (String(data.issuingCarrier || '').split('/').pop() || '').trim() || SKYSHIP_CONFIG.name
  const transportRows: Array<[string, string]> =
    mode === 'AIR'
      ? [
          ['Airline', carrierName],
          ['Flight No.', String(data.flightNumber || data.carrierReference || '—')],
          ['Departure Airport', origin],
          ['Arrival Airport', destination],
        ]
      : mode === 'SEA'
        ? [
            ['Vessel Name', String(data.vesselName || `MV ${carrierName}`)],
            ['Voyage No.', String(data.voyageNumber || data.carrierReference || '—')],
            ['Port of Loading', origin],
            ['Port of Discharge', destination],
          ]
        : mode === 'LAND'
          ? [
              ['Carrier', carrierName],
              ['Route No.', String(data.routeNumber || data.carrierReference || '—')],
              ['Pickup Hub', origin],
              ['Delivery Hub', destination],
            ]
          : [
              ['Courier Partner', String(data.courierPartner || 'Parcel Point Express')],
              ['Service Level', String(data.serviceTypeString || 'Standard')],
              ['Pickup Location', origin],
              ['Delivery Location', destination],
            ]

  const generatedAtIso = data.generatedAt || data.documentAuthenticity?.generatedAt || now.toISOString()
  const generatedAtDate = new Date(generatedAtIso)
  const generatedAtDisplay = Number.isNaN(generatedAtDate.getTime())
    ? generatedAtIso
    : `${generatedAtDate.toISOString().slice(0, 10)} ${generatedAtDate.toISOString().slice(11, 16)} UTC`
  const generatedBy = String(data.generatedBy || data.documentAuthenticity?.generatedBy || data.agentName || 'Parcel Point System')
  const authSeed = `${waybillNumber}|${trackingNumber}|${issueDateIso}|${origin}|${destination}|${generatedAtIso}`
  const documentId = data.documentId || data.documentAuthenticity?.documentId || buildDocumentId(authSeed, issueDate)
  const verificationId = data.verificationId || data.documentAuthenticity?.verificationId || buildVerificationId(waybillNumber, issueDate)
  const verificationCode = data.verificationCode || data.documentAuthenticity?.verificationCode || buildVerificationCode(`${authSeed}|verification`)
  const checksumHash = data.checksumHash || data.documentAuthenticity?.checksumHash || hashHex(`${authSeed}|${verificationCode}`, 24)
  const qrVerificationCode = data.qrVerificationCode || data.documentAuthenticity?.qrVerificationCode || `QR-${hashHex(`${trackingNumber}|${verificationCode}`, 8)}`
  const digitalSeal = data.digitalSeal || data.documentAuthenticity?.digitalSeal || `SEAL-${hashHex(`${documentId}|${checksumHash}`, 12)}`
  const siteOrigin = typeof window !== 'undefined' && window.location?.origin && !window.location.origin.startsWith('file:')
    ? window.location.origin
    : 'https://parcelpoint.com'
  const trackUrl = `${siteOrigin}/track/${encodeURIComponent(trackingNumber)}?verify=${encodeURIComponent(verificationCode)}`

  // Pre-rendered graphics
  const barcodeDataUrl = makeBarcodeDataURL(trackingNumber)
  const qrDataUrl = await makeQrDataURL(trackUrl)
  const logoImage = await loadImageAsDataURL(data.logoUrl || data.senderLogoUrl || '/parcel-point-logo.png')
  const fiataRaw  = await loadImageAsDataURL('/fiata-logo.png')
  const fiataImage = fiataRaw ? await normalizeForPdf(fiataRaw, 400) : null

  // ── Page base ───────────────────────────────────────────────────────────────
  setFill(WHITE)
  pdf.rect(0, 0, pageW, pageH, 'F')

  // Subtle document watermark behind the body. It uses very light ink instead
  // of transparency so it remains stable across PDF viewers.
  setText([244, 247, 252])
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(38)
  pdf.text('PARCEL POINT', pageW / 2, 153, { align: 'center', angle: -32 })
  pdf.setFontSize(10)
  pdf.text('AUTHENTICATED DOCUMENT', pageW / 2, 166, { align: 'center', charSpace: 1.1, angle: -32 })

  // Top accent: navy band with purple underline
  setFill(NAVY)
  pdf.rect(0, 0, pageW, 1.5, 'F')
  setFill(PURPLE)
  pdf.rect(0, 1.5, pageW, 0.9, 'F')

  // ── HEADER ──────────────────────────────────────────────────────────────────
  // Logo plate (top left)
  setStroke(BORDER)
  pdf.setLineWidth(0.3)
  setFill(WHITE)
  pdf.roundedRect(M, 7, 26, 21, 2.5, 2.5, 'FD')
  if (logoImage && !logoImage.startsWith('data:image/svg')) {
    try {
      pdf.addImage(logoImage, 'PNG', M + 5, 9.5, 16, 16, undefined, 'FAST')
    } catch {
      /* monogram fallback below */
    }
  } else {
    setText(NAVY)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(13)
    pdf.text('PP', M + 13, 19.5, { align: 'center' })
  }

  // Company identity
  setText(NAVY)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(13.5)
  pdf.text('PARCEL POINT', M + 30, 13.5, { charSpace: 0.4 })
  setText(PURPLE)
  pdf.setFontSize(5.8)
  pdf.text('INTERNATIONAL LOGISTICS NETWORK', M + 30, 18, { charSpace: 0.7 })
  setText(MUTED)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6)
  pdf.text(SKYSHIP_CONFIG.address, M + 30, 22.4)
  pdf.text(`${COMPANY_CONTACT.phone}   ·   ${COMPANY_CONTACT.email}`, M + 30, 26)

  // Document title block (top right). Right-align manually because jsPDF's
  // align option ignores charSpace, which would push the text past the margin.
  setText(NAVY)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(23)
  const titleCharSpace = 1.2
  const titleW = pdf.getTextWidth('WAYBILL') + ('WAYBILL'.length - 1) * titleCharSpace
  pdf.text('WAYBILL', pageW - M - titleW, 15.5, { charSpace: titleCharSpace })

  // Color-coded shipment type badge
  pdf.setFontSize(7)
  const badgeTextW = pdf.getTextWidth(theme.badge) + theme.badge.length * 0.5
  const badgeW = badgeTextW + 18
  const badgeX = pageW - M - badgeW
  setFill(theme.color)
  pdf.roundedRect(badgeX, 18.4, badgeW, 6.2, 3.1, 3.1, 'F')
  drawTransportIcon(mode, badgeX + 4, 21.2)
  setText(WHITE)
  pdf.text(theme.badge, badgeX + 14, 22.4, { charSpace: 0.5 })

  // Shipment reference + issue date
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(8.5)
  setText(INK)
  const waybillRefDisplay = clampLine(waybillNumber, 58)
  pdf.text(waybillRefDisplay, pageW - M, 29.8, { align: 'right' })
  const refValueW = pdf.getTextWidth(waybillRefDisplay)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(5.2)
  setText(MUTED)
  pdf.text('SHIPMENT REF', pageW - M - refValueW - 6, 29.8, { align: 'right', charSpace: 0.3 })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6.5)
  setText(INK)
  const issueText = formatDateShort(issueDateIso)
  pdf.text(issueText, pageW - M, 33.6, { align: 'right' })
  const issueValueW = pdf.getTextWidth(issueText)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(5.2)
  setText(MUTED)
  pdf.text('ISSUE DATE', pageW - M - issueValueW - 6, 33.6, { align: 'right', charSpace: 0.3 })

  // Visible authenticity seal in the first viewport of the PDF.
  const sealX = M + 76
  const sealY = 29.2
  setFill([237, 231, 252])
  setStroke([196, 181, 253])
  pdf.setLineWidth(0.25)
  pdf.roundedRect(sealX, sealY, 50, 5.8, 2.9, 2.9, 'FD')
  setFill(PURPLE)
  pdf.circle(sealX + 4.5, sealY + 2.9, 1.7, 'F')
  setStroke(WHITE)
  pdf.setLineWidth(0.45)
  pdf.line(sealX + 3.7, sealY + 2.9, sealX + 4.3, sealY + 3.5)
  pdf.line(sealX + 4.3, sealY + 3.5, sealX + 5.4, sealY + 2.2)
  setText(PURPLE)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(5.4)
  pdf.text('AUTHENTICATED DOCUMENT', sealX + 8, sealY + 3.9, { charSpace: 0.35 })

  // FIATA logo — placed to the right of the authenticity seal
  if (fiataImage && !fiataImage.startsWith('data:image/svg')) {
    try {
      pdf.addImage(fiataImage, 'PNG', sealX + 54, sealY - 0.5, 20, 7, undefined, 'FAST')
    } catch (e) { console.error('[WaybillPDF] addImage fiata-logo failed:', e) }
  }

  // Navy→purple gradient divider
  const segments = 64
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1)
    pdf.setFillColor(
      Math.round(NAVY[0] + (PURPLE[0] - NAVY[0]) * t),
      Math.round(NAVY[1] + (PURPLE[1] - NAVY[1]) * t),
      Math.round(NAVY[2] + (PURPLE[2] - NAVY[2]) * t)
    )
    pdf.rect((pageW / segments) * i, 37.2, pageW / segments + 0.2, 1, 'F')
  }

  // ── TRACKING PANEL ──────────────────────────────────────────────────────────
  const trackY = 41.5
  const trackH = 30.5
  setFill(PANEL)
  setStroke(BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(M, trackY, W, trackH, 2.5, 2.5, 'FD')

  setText(MUTED)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(5.6)
  pdf.text('TRACKING NUMBER', M + 5, trackY + 5.6, { charSpace: 0.6 })
  setText(NAVY)
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(14.5)
  pdf.text(clampLine(trackingNumber, 76), M + 5, trackY + 11.8)

  // Code 128 barcode (auto-generated from the tracking number)
  setFill(WHITE)
  setStroke(BORDER)
  pdf.roundedRect(M + 4, trackY + 14, 76, 12.2, 1, 1, 'FD')
  try {
    pdf.addImage(barcodeDataUrl, 'PNG', M + 6, trackY + 15.2, 72, 9.8)
  } catch {
    /* barcode optional */
  }

  // Live status chip
  const chipX = M + 88
  setText(MUTED)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(5)
  pdf.text('SHIPMENT STATUS', chipX, trackY + 4.1, { charSpace: 0.35 })
  drawStatusPill(chipX, trackY + 5.4, currentStatus, 66)

  // Dedicated security layer
  const securityY = trackY + 13.2
  const securityW = 67
  setFill(WHITE)
  setStroke([205, 214, 229])
  pdf.setLineWidth(0.25)
  pdf.roundedRect(chipX, securityY, securityW, 16.1, 1.4, 1.4, 'FD')
  setFill(NAVY)
  pdf.roundedRect(chipX + 2, securityY + 1.4, 20.5, 3.5, 1.7, 1.7, 'F')
  setText(WHITE)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(4.1)
  pdf.text('SECURITY LAYER', chipX + 3.1, securityY + 3.8, { charSpace: 0.15 })
  setText(NAVY)
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(4.3)
  const securityRows = [
    `DOC ${documentId}`,
    `QR ${qrVerificationCode}  VERIFY ${verificationCode}`,
    `GEN ${generatedAtDisplay}`,
    `BY  ${generatedBy}`,
    `SEAL ${digitalSeal}`,
  ]
  securityRows.forEach((row, index) => {
    pdf.text(clampLine(row, securityW - 4), chipX + 2, securityY + 6.9 + index * 2.1)
  })

  // QR code (auto-generated, links to live tracking)
  const qrBoxX = pageW - M - 27.5
  setFill(WHITE)
  setStroke(BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(qrBoxX, trackY + 2.6, 22.4, 22.4, 1.5, 1.5, 'FD')
  try {
    pdf.addImage(qrDataUrl, 'PNG', qrBoxX + 1.4, trackY + 4, 19.6, 19.6)
  } catch {
    /* QR optional */
  }
  setText(NAVY)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(4.7)
  pdf.text('TRACK THIS SHIPMENT', qrBoxX + 11.2, trackY + 27.2, { align: 'center', charSpace: 0.2 })
  setText(MUTED)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(3.7)
  pdf.text('Scan to view real time tracking updates.', qrBoxX + 11.2, trackY + 29.3, { align: 'center' })

  // ── SHIPPER / RECEIVER ──────────────────────────────────────────────────────
  const partyY = 74
  const partyH = 36
  const partyW = (W - 4) / 2

  const drawParty = (x: number, title: string, tag: string, name?: string, phone?: string, email?: string, address?: string, city?: string) => {
    setFill(WHITE)
    setStroke(BORDER)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(x, partyY, partyW, partyH, 2.5, 2.5, 'FD')

    setFill(PURPLE)
    pdf.rect(x + 4, partyY + 3.6, 1.4, 4.4, 'F')
    setText(NAVY)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(8)
    pdf.text(title, x + 7.5, partyY + 7.2, { charSpace: 0.4 })
    pdf.setFontSize(5.4)
    setText(WHITE)
    const tagW = pdf.getTextWidth(tag) + 5
    setFill(NAVY)
    pdf.roundedRect(x + partyW - tagW - 4, partyY + 3.4, tagW, 4.6, 2.3, 2.3, 'F')
    setText(WHITE)
    pdf.text(tag, x + partyW - tagW / 2 - 4, partyY + 6.5, { align: 'center', charSpace: 0.3 })
    setStroke(BORDER)
    pdf.setLineWidth(0.25)
    pdf.line(x + 4, partyY + 10.6, x + partyW - 4, partyY + 10.6)

    setText(MUTED)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(4.9)
    pdf.text('COMPANY / CONTACT NAME', x + 4, partyY + 14.4, { charSpace: 0.25 })
    setText(INK)
    pdf.setFontSize(8.4)
    pdf.text(clampLine(name || '—', partyW - 8), x + 4, partyY + 18.4)

    pdf.setFontSize(4.9)
    setText(MUTED)
    pdf.text('PHONE', x + 4, partyY + 22.6, { charSpace: 0.25 })
    pdf.text('EMAIL', x + partyW / 2, partyY + 22.6, { charSpace: 0.25 })
    setText(INK)
    pdf.setFont('courier', 'bold')
    pdf.setFontSize(6.8)
    pdf.text(clampLine(phone || '—', partyW / 2 - 7), x + 4, partyY + 26)
    pdf.text(clampLine(email || '—', partyW / 2 - 7), x + partyW / 2, partyY + 26)

    setText(MUTED)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(4.9)
    pdf.text('ADDRESS', x + 4, partyY + 29.4, { charSpace: 0.25 })
    setText(INK)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(6.2)
    const fullAddress = [address, city].filter(Boolean).join(', ')
    wrapClamp(fullAddress || '—', x + 4, partyY + 32.2, partyW - 8, 2, 2.6)
  }

  drawParty(M, 'SHIPPER', 'FROM', data.shipperName || data.senderName, data.shipperPhone || data.senderPhone, data.shipperEmail, data.shipperAddress || data.senderAddress)
  drawParty(M + partyW + 4, 'RECEIVER', 'TO', data.consigneeName || data.receiverName, data.consigneePhone || data.receiverPhone || (data.receiverTelephone as string | undefined), data.consigneeEmail, data.consigneeAddress || data.receiverAddress, data.receiverCity)

  // ── PRIORITY SNAPSHOT / LOCATION INTELLIGENCE ─────────────────────────────
  sectionTitle('Priority Shipment Snapshot', 116)
  const transW = W / 4
  const snapshotY = 119
  const snapshotGap = 3
  const snapshotW = (W - snapshotGap * 3) / 4
  drawSnapshotCell(M, snapshotY, snapshotW, 'Origin', origin, { fill: theme.soft, valueColor: theme.color })
  drawSnapshotCell(M + (snapshotW + snapshotGap), snapshotY, snapshotW, 'Destination', destination, { fill: theme.soft, valueColor: theme.color })
  drawSnapshotCell(M + (snapshotW + snapshotGap) * 2, snapshotY, snapshotW, 'Shipment Status', currentStatus, { fill: sTheme.soft, valueColor: sTheme.color })
  drawSnapshotCell(M + (snapshotW + snapshotGap) * 3, snapshotY, snapshotW, 'Est. Delivery', formatDateShort(etaIso), { mono: true })

  const intelligenceY = 135
  const panelH = 21.2
  const panelW = (W - 4) / 2
  const currentPanelX = M
  const summaryPanelX = M + panelW + 4
  const currentLocationTimestamp = currentLocationDetails.scannedAt || generatedAtIso
  const locationCityLine = [
    currentLocationDetails.city,
    currentLocationDetails.stateOrProvince,
    currentLocationDetails.country,
  ].filter(Boolean).join(', ')
  const locationDateTime = `${formatDateShort(currentLocationTimestamp)} ${formatTime(currentLocationTimestamp)}`
  const latitude = coerceFiniteNumber(currentLocationDetails.latitude)
  const longitude = coerceFiniteNumber(currentLocationDetails.longitude)

  setFill(WHITE)
  setStroke(BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(currentPanelX, intelligenceY, panelW, panelH, 2, 2, 'FD')
  setFill(PURPLE)
  pdf.rect(currentPanelX + 4, intelligenceY + 3.2, 1.4, 4.2, 'F')
  setText(NAVY)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6.5)
  pdf.text('CURRENT LOCATION', currentPanelX + 7.5, intelligenceY + 6.5, { charSpace: 0.35 })
  drawPanelMetric(currentPanelX + 4, intelligenceY + 10.4, 'Current Facility', currentLocationDetails.facility || currentLocation, 41)
  drawPanelMetric(currentPanelX + 4, intelligenceY + 16, 'City / State / Country', locationCityLine || currentLocation, 41)
  drawPanelMetric(currentPanelX + 49, intelligenceY + 10.4, 'Date / Time', locationDateTime, 38, { mono: true })
  drawPanelMetric(currentPanelX + 49, intelligenceY + 16, 'Latitude / Longitude', `${formatCoordinate(latitude)} / ${formatCoordinate(longitude)}`, 38, { mono: true })

  setFill([250, 251, 254])
  setStroke(BORDER)
  pdf.roundedRect(summaryPanelX, intelligenceY, panelW, panelH, 2, 2, 'FD')
  setFill(theme.color)
  pdf.rect(summaryPanelX + 4, intelligenceY + 3.2, 1.4, 4.2, 'F')
  setText(NAVY)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6.5)
  pdf.text('PACKAGE SUMMARY', summaryPanelX + 7.5, intelligenceY + 6.5, { charSpace: 0.35 })
  drawPanelMetric(summaryPanelX + 4, intelligenceY + 10.4, 'Total Packages', `${totalPieces} pcs`, 25, { mono: true, valueColor: theme.color })
  drawPanelMetric(summaryPanelX + 33, intelligenceY + 10.4, 'Total Weight', `${Number(totalWeight).toFixed(2)} kg`, 25, { mono: true })
  drawPanelMetric(summaryPanelX + 62, intelligenceY + 10.4, 'Volume', totalVolume ? `${totalVolume.toFixed(3)} cbm` : 'Pending dims', 25, { mono: true })
  drawPanelMetric(summaryPanelX + 4, intelligenceY + 16, 'Declared Value', declaredValue > 0 ? formatMoney(declaredValue, currency) : 'Pending value', 25, { mono: true })
  drawPanelMetric(summaryPanelX + 33, intelligenceY + 16, 'Shipment Type', shipmentType, 25)
  drawPanelMetric(summaryPanelX + 62, intelligenceY + 16, 'Master / Child', `${masterWaybillNumber} / ${childPackageCount}`, 25, { mono: true })

  const transportStripY = 158.2
  transportRows.forEach(([label, value], i) => {
    dataCell(M + i * transW, transportStripY, transW, 8.5, label, value, {
      fill: theme.soft,
      labelColor: theme.color,
    })
  })

  sectionTitle('Tracking Journey', 168)
  const journeyLineY = 178.5
  const shownIdx = sampleTimelineIndices(events.length, currentIdx, 7)
  const nodeCount = Math.max(shownIdx.length, 1)
  const journeyX0 = M + 14
  const journeyX1 = pageW - M - 14
  const nodeStep = nodeCount > 1 ? (journeyX1 - journeyX0) / (nodeCount - 1) : 0

  // Base + progress line
  setStroke(BORDER)
  pdf.setLineWidth(0.9)
  pdf.line(journeyX0, journeyLineY, journeyX1, journeyLineY)
  const currentPos = shownIdx.indexOf(currentIdx)
  if (currentPos > 0) {
    setStroke(PURPLE)
    pdf.setLineWidth(0.9)
    pdf.line(journeyX0, journeyLineY, journeyX0 + nodeStep * currentPos, journeyLineY)
  }

  if (events.length === 0) {
    setText(MUTED)
    pdf.setFont('helvetica', 'italic')
    pdf.setFontSize(7)
    pdf.text('Timeline will be populated as the shipment progresses.', pageW / 2, journeyLineY + 8, { align: 'center' })
  }

  shownIdx.forEach((evIdx, i) => {
    const ev = events[evIdx]
    const x = nodeCount > 1 ? journeyX0 + nodeStep * i : pageW / 2
    const isCurrent = evIdx === currentIdx
    const isDone = evIdx < currentIdx

    if (isCurrent) {
      // Glowing purple highlight for the active stage
      setStroke([216, 200, 250])
      pdf.setLineWidth(0.5)
      pdf.circle(x, journeyLineY, 4.6, 'S')
      setStroke([186, 156, 245])
      pdf.circle(x, journeyLineY, 3.4, 'S')
      setFill(PURPLE)
      pdf.circle(x, journeyLineY, 2.3, 'F')
      setFill(WHITE)
      pdf.circle(x, journeyLineY, 0.85, 'F')
      // CURRENT flag above node
      setFill(PURPLE)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(4.6)
      const flagW = pdf.getTextWidth('CURRENT') + 4.6
      pdf.roundedRect(x - flagW / 2, journeyLineY - 9.6, flagW, 4, 2, 2, 'F')
      setText(WHITE)
      pdf.text('CURRENT', x, journeyLineY - 6.9, { align: 'center', charSpace: 0.25 })
    } else if (isDone) {
      setFill(NAVY)
      pdf.circle(x, journeyLineY, 2.05, 'F')
      setStroke(WHITE)
      pdf.setLineWidth(0.45)
      pdf.line(x - 0.95, journeyLineY + 0.05, x - 0.25, journeyLineY + 0.8)
      pdf.line(x - 0.25, journeyLineY + 0.8, x + 1.05, journeyLineY - 0.75)
    } else {
      setFill(WHITE)
      setStroke([165, 178, 200])
      pdf.setLineWidth(0.4)
      pdf.circle(x, journeyLineY, 1.9, 'FD')
    }

    if (!ev) return
    const colW = Math.min(nodeStep || 50, 30)
    setText(isCurrent ? PURPLE : isDone ? NAVY : MUTED)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(5.6)
    const used = wrapClamp(ev.status, x, journeyLineY + 6.4, colW, 2, 2.4, 'center')
    setText(MUTED)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(5)
    const metaY = journeyLineY + 6.4 + used * 2.4 + 0.6
    pdf.text(`${formatDayMonth(ev.eventTime)} · ${formatTime(ev.eventTime)}`, x, metaY, { align: 'center' })
    wrapClamp(ev.location, x, metaY + 2.5, colW, 1, 2.4, 'center')
  })

  // ── PACKAGE CONTENTS ────────────────────────────────────────────────────────
  sectionTitle('Package Contents', 202)
  const tableY = 205
  const cols = [
    { label: 'NO.', w: 9, align: 'left' as const },
    { label: 'DESCRIPTION', w: 75, align: 'left' as const },
    { label: 'TYPE', w: 22, align: 'left' as const },
    { label: 'QTY', w: 14, align: 'right' as const },
    { label: 'WEIGHT (KG)', w: 26, align: 'right' as const },
    { label: 'DECLARED VALUE', w: 44, align: 'right' as const },
  ]
  setFill([241, 244, 250])
  setStroke(BORDER)
  pdf.setLineWidth(0.25)
  pdf.rect(M, tableY, W, 5, 'FD')
  let colX = M
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(5)
  setText(NAVY)
  cols.forEach((c) => {
    pdf.text(c.label, c.align === 'right' ? colX + c.w - 2 : colX + 2, tableY + 3.4, { align: c.align, charSpace: 0.2 })
    colX += c.w
  })

  const maxRows = 3
  const rowH = 4.8
  const visibleItems = items.slice(0, maxRows)
  const overflowCount = items.length - visibleItems.length
  let rowY = tableY + 5
  const drawRow = (cells: string[], opts?: { italic?: boolean }) => {
    setStroke(BORDER)
    pdf.setLineWidth(0.2)
    pdf.line(M, rowY + rowH, M + W, rowY + rowH)
    let cx = M
    cols.forEach((c, ci) => {
      setText(INK)
      pdf.setFont(ci >= 3 ? 'courier' : 'helvetica', opts?.italic ? 'italic' : ci === 1 ? 'bold' : 'normal')
      pdf.setFontSize(6.2)
      pdf.text(clampLine(cells[ci] ?? '', c.w - 4), c.align === 'right' ? cx + c.w - 2 : cx + 2, rowY + 3.4, { align: c.align })
      cx += c.w
    })
    rowY += rowH
  }

  if (visibleItems.length === 0) {
    drawRow(['1', String(data.cargoDescription || data.packageDescription || data.contents || 'General cargo'), 'Box', String(totalPieces), Number(totalWeight).toFixed(2), declaredValue > 0 ? formatMoney(declaredValue, currency) : '—'])
  } else {
    visibleItems.forEach((it, i) => {
      drawRow([
        String(i + 1),
        String(it.description || it.cargoDescription || data.cargoDescription || '—'),
        String(it.typeOfPkg || 'Box'),
        String(it.noOfPcs || it.pieces || it.quantity || 1),
        Number(it.grossWeight || it.weight || 0).toFixed(2),
        it.value ? formatMoney(it.value, currency) : '—',
      ])
    })
    if (overflowCount > 0) drawRow(['', `+ ${overflowCount} additional item${overflowCount > 1 ? 's' : ''} — see shipment manifest`, '', '', '', ''], { italic: true })
  }
  // Totals row
  setFill(PANEL)
  pdf.rect(M, rowY, W, 5.2, 'F')
  setText(NAVY)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(5.4)
  pdf.text('TOTALS', M + 2, rowY + 3.5, { charSpace: 0.3 })
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(6)
  const qtyRight = M + cols[0].w + cols[1].w + cols[2].w + cols[3].w
  pdf.text(String(totalPieces), qtyRight - 2, rowY + 3.5, { align: 'right' })
  pdf.text(Number(totalWeight).toFixed(2), qtyRight + cols[4].w - 2, rowY + 3.5, { align: 'right' })
  pdf.text(declaredValue > 0 ? formatMoney(declaredValue, currency) : '—', M + W - 2, rowY + 3.5, { align: 'right' })

  // ── SPECIAL INSTRUCTIONS + TERMS ────────────────────────────────────────────
  const notesY = 230.5
  const notesH = 12.5
  const notesW = W * 0.58
  setFill(WHITE)
  setStroke(BORDER)
  pdf.setLineWidth(0.3)
  pdf.roundedRect(M, notesY, notesW, notesH, 2, 2, 'FD')
  setText(PURPLE)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(5.2)
  pdf.text('SPECIAL INSTRUCTIONS / DELIVERY NOTES', M + 3.5, notesY + 4, { charSpace: 0.3 })
  setText(INK)
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(6.2)
  wrapClamp(String(data.specialInstructions || data.handlingInformation || 'No special handling required.'), M + 3.5, notesY + 7.4, notesW - 7, 2, 2.7)

  const termsX = M + notesW + 4
  const termsW = W - notesW - 4
  setFill([250, 251, 254])
  pdf.roundedRect(termsX, notesY, termsW, notesH, 2, 2, 'FD')
  setText(MUTED)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(5.2)
  pdf.text('TERMS & CONDITIONS', termsX + 3.5, notesY + 4, { charSpace: 0.3 })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(4.4)
  wrapClamp(
    String(data.termsAndConditions || 'Received in apparent good order unless otherwise noted. Carriage is subject to the Parcel Point Conditions of Carriage. Liability is limited as per applicable convention or law. Claims must be filed within 14 days of delivery.'),
    termsX + 3.5,
    notesY + 7,
    termsW - 7,
    3,
    2.2
  )

  // ── SIGNATURES ──────────────────────────────────────────────────────────────
  const sigY = 244.2
  const sigH = 14.5
  const sigW = (W - 8) / 3
  const senderSig = await loadImageAsDataURL(data.senderSignatureUrl || "/SENDER'S SIGNATURE.png")
  const carrierSig = await loadImageAsDataURL('/Signature.png')
  const rawStampImg = await loadImageAsDataURL(data.officialStampUrl || '/logistics-stamp.png')
  const stampImg = rawStampImg ? await normalizeForPdf(rawStampImg, 350) : null

  const drawSignature = (x: number, label: string, img: string | null, stamp?: string | null, placeholder?: string) => {
    setFill(WHITE)
    setStroke(BORDER)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(x, sigY, sigW, sigH, 2, 2, 'FD')
    setText(MUTED)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(4.9)
    pdf.text(label, x + 3, sigY + 3.8, { charSpace: 0.3 })
    if (img && !img.startsWith('data:image/svg')) {
      try {
        pdf.addImage(img, 'PNG', x + 5, sigY + 4.6, 24, 6.6, undefined, 'FAST')
      } catch {
        /* ignore */
      }
    } else if (placeholder) {
      setText([170, 182, 202])
      pdf.setFont('helvetica', 'italic')
      pdf.setFontSize(5.6)
      pdf.text(placeholder, x + sigW / 2, sigY + 8.4, { align: 'center' })
    }
    if (stamp && !stamp.startsWith('data:image/svg')) {
      try {
        pdf.addImage(stamp, 'PNG', x + sigW - 14.5, sigY + 2.4, 12, 9.4, undefined, 'FAST')
      } catch (e) { console.error('[WaybillPDF] addImage stamp failed:', e) }
    }
    setStroke([165, 178, 200])
    pdf.setLineWidth(0.25)
    pdf.line(x + 3, sigY + 11.4, x + sigW - 3, sigY + 11.4)
    setText(MUTED)
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(4.6)
    pdf.text('Name & Signature', x + 3, sigY + 13.6)
    pdf.text(`Date: ${formatDateShort(issueDateIso)}`, x + sigW - 3, sigY + 13.6, { align: 'right' })
  }

  drawSignature(M, 'SENDER SIGNATURE', senderSig)
  drawSignature(M + sigW + 4, 'CARRIER / AGENT SIGNATURE', carrierSig, stampImg)
  drawSignature(M + (sigW + 4) * 2, 'RECEIVER SIGNATURE', null, null, 'Sign upon delivery')

  // ── FOOTER ──────────────────────────────────────────────────────────────────
  const footY = pageH - 9.5
  setFill(PURPLE)
  pdf.rect(0, footY - 0.9, pageW, 0.9, 'F')
  setFill(NAVY)
  pdf.rect(0, footY, pageW, 9.5, 'F')
  setText(WHITE)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6.4)
  pdf.text('PARCEL POINT LOGISTICS', M, footY + 2.9, { charSpace: 0.4 })
  setText([170, 182, 208])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(5.2)
  pdf.text(`${siteOrigin.replace(/^https?:\/\//, '')}   ·   ${COMPANY_CONTACT.email}   ·   ${COMPANY_CONTACT.phone}`, M, footY + 7.2)
  const generatedAt = `${now.toISOString().slice(0, 10)} ${now.toISOString().slice(11, 16)} UTC`
  setText([196, 181, 253])
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(5.4)
  pdf.text(`VERIFICATION ID ${verificationId}`, pageW - M, footY + 3.9, { align: 'right' })
  setText([170, 182, 208])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(5)
  pdf.text(`Generated ${generatedAt} · Verify at ${siteOrigin.replace(/^https?:\/\//, '')}/track`, pageW - M, footY + 7.2, { align: 'right' })

  const websiteHost = siteOrigin.replace(/^https?:\/\//, '')
  setFill(PURPLE)
  pdf.rect(0, footY - 0.9, pageW, 0.9, 'F')
  setFill(NAVY)
  pdf.rect(0, footY, pageW, 9.5, 'F')
  setText(WHITE)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(6)
  pdf.text('PARCEL POINT LOGISTICS', M, footY + 2.9, { charSpace: 0.4 })
  setText([170, 182, 208])
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(4.3)
  pdf.text(`Website: ${websiteHost}   Support: ${COMPANY_CONTACT.email}   Customer Service: ${COMPANY_CONTACT.phone}`, M, footY + 5.3)
  pdf.text('This document was generated electronically and is valid without a physical signature.', M, footY + 8.1)
  setText([196, 181, 253])
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(4.8)
  pdf.text(`VERIFICATION ID ${verificationId}`, pageW - M, footY + 2.9, { align: 'right' })
  setText([170, 182, 208])
  pdf.setFont('courier', 'bold')
  pdf.setFontSize(4)
  pdf.text(`DOC ${documentId}  HASH ${checksumHash}`, pageW - M, footY + 5.3, { align: 'right' })
  pdf.setFont('helvetica', 'normal')
  pdf.setFontSize(4)
  pdf.text(`Generated ${generatedAtDisplay}  Verify at ${websiteHost}/track`, pageW - M, footY + 8.1, { align: 'right' })

  // Generate PDF blob and URL
  const pdfBlob = pdf.output('blob')
  return URL.createObjectURL(pdfBlob)
}

// React component wrapper
export function WaybillTemplate({ data, onComplete }: WaybillTemplateProps) {
  const generatePDF = useCallback(async () => {
    try {
      const pdfUrl = await generateWaybillPDF(data)
      onComplete?.(pdfUrl)

      // Auto-download
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `waybill_${data.waybillNumber || data.consignmentNumber}.pdf`
      link.click()
    } catch (error) {
      console.error('Error generating waybill PDF:', error)
      alert('Error generating waybill. Please try again.')
    }
  }, [data, onComplete])

  // Auto-generate on mount
  useEffect(() => {
    generatePDF()
  }, [generatePDF])

  return null
}
