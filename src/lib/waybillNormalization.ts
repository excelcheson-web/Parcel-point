import type { StoredWaybill, TrackingEventRecord } from '@/lib/types'

export interface NormalizedWaybill {
  raw: StoredWaybill
  waybillNumber: string
  trackingNumber: string
  currentStatus: string
  currentLocation: string
  bookingDate: string
  estimatedDeliveryDate: string
  deliveredDate: string
  shipmentMode: string
  serviceType: string
  paymentStatus: string
  senderName: string
  senderPhone: string
  senderAddress: string
  shipperName: string
  origin: string
  receiverName: string
  receiverPhone: string
  receiverAddress: string
  consigneeName: string
  destination: string
  parcelDescription: string
  cargoDescription: string
  packageDescription: string
  quantity: number | null
  weight: number | null
  dimensions: string
  specialInstructions: string
  dateOfIssue: string
  estimatedArrivalDate: string
  totalPieces: number | null
  totalWeight: number | null
  routeNumber: string
  iataCode: string
  carrierReference: string
  lastUpdated: string
  trackingEvents: TrackingEventRecord[]
  additionalFields: Record<string, string>
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

function normalizeCandidate(value: unknown): string {
  const normalized = asString(value)
  if (!normalized) return ''

  const lowered = normalized.toLowerCase()
  const placeholders = new Set([
    'unknown',
    'not provided',
    'not available',
    'n/a',
    'na',
    'null',
    'undefined',
    '-',
  ])

  return placeholders.has(lowered) ? '' : normalized
}

function pickFirst(...values: unknown[]): string {
  for (const value of values) {
    const candidate = normalizeCandidate(value)
    if (candidate) return candidate
  }
  return ''
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeServiceType(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    const service = value as Record<string, unknown>
    if (service.doorToDoor) return 'Door to Door'
    if (service.worldMail) return 'World Mail'
    if (service.domestic) return 'Domestic'
    if (service.diplomaticCourier) return 'Diplomatic Courier'
    if (service.repairReturn) return 'Repair Return'
  }
  return ''
}

function normalizeTrackingEvents(raw: StoredWaybill): TrackingEventRecord[] {
  const events = Array.isArray(raw.trackingEvents) ? raw.trackingEvents : []
  const fallbackTransit = Array.isArray(raw.transitHistory) ? raw.transitHistory : []

  const mappedTransit = fallbackTransit.map((event) => ({
    status: asString(event?.status) || 'In Transit',
    location: asString(event?.location) || 'Unknown Location',
    description: asString(event?.description) || '',
    eventTime: asString((event as unknown as { eventTime?: unknown })?.eventTime) || asString(event?.date),
    isHold: false,
  }))

  const combined = [...events, ...mappedTransit]
    .filter((event) => asString(event?.status) !== '' || asString(event?.eventTime) !== '')
    .map((event) => ({
      status: asString(event?.status) || 'Status Update',
      location: asString(event?.location) || 'Unknown Location',
      description: asString(event?.description) || 'No description provided',
      eventTime: asString(event?.eventTime) || new Date(0).toISOString(),
      isHold: Boolean(event?.isHold),
    }))

  combined.sort((a, b) => {
    const timeA = Date.parse(a.eventTime)
    const timeB = Date.parse(b.eventTime)
    const safeA = Number.isNaN(timeA) ? 0 : timeA
    const safeB = Number.isNaN(timeB) ? 0 : timeB
    return safeA - safeB
  })

  return combined
}

export function normalizeWaybill(raw: StoredWaybill): NormalizedWaybill {
  const trackingEvents = normalizeTrackingEvents(raw)
  const lastEvent = trackingEvents.length > 0 ? trackingEvents[trackingEvents.length - 1] : null

  const waybillNumber = pickFirst(raw.waybillNumber, raw.trackingNumber)
  const trackingNumber = pickFirst(raw.trackingNumber, waybillNumber)

  const currentStatus = pickFirst(raw.currentStatus, lastEvent?.status, raw.status) || 'Not available'
  const currentLocation = pickFirst(raw.currentLocation, lastEvent?.location, raw.origin, raw.portOfDeparture) || 'Not available'

  const bookingDate = pickFirst(raw.bookingDate, raw.dateOfIssue, raw.createdAt) || 'Not available'
  const estimatedDeliveryDate = pickFirst(raw.estimatedDeliveryDate, raw.estimatedArrivalDate, raw.arrivalDate) || 'Not available'
  const deliveredDate = pickFirst(raw.deliveredDate) || 'Not available'

  const shipmentMode = pickFirst(raw.shipmentMode, raw.transportMode) || 'Not available'
  const serviceType = pickFirst(raw.serviceTypeString, normalizeServiceType(raw.serviceType), asString(raw.serviceType)) || 'Not available'
  const paymentStatus = pickFirst(raw.paymentStatus) || 'NOT PAID'

  const senderName = pickFirst(raw.senderName, raw.shipperName) || 'Not available'
  const senderPhone = pickFirst(raw.senderPhone, raw.shipperPhone, raw.receiverTelephone) || 'Not available'
  const senderAddress = pickFirst(raw.senderAddress, raw.shipperAddress) || 'Not available'
  const shipperName = pickFirst(raw.shipperName, raw.senderName) || 'Not available'
  // Required order: portOfDeparture -> origin -> senderAddress -> shipperAddress
  const origin = pickFirst(raw.portOfDeparture, raw.origin, raw.senderAddress, raw.shipperAddress) || 'Not available'

  const receiverName = pickFirst(raw.receiverName, raw.consigneeName) || 'Not available'
  const receiverPhone = pickFirst(raw.receiverPhone, raw.consigneePhone, raw.receiverTelephone) || 'Not available'
  const receiverAddress = pickFirst(raw.receiverAddress, raw.consigneeAddress) || 'Not available'
  const consigneeName = pickFirst(raw.consigneeName, raw.receiverName) || 'Not available'
  // Required order: portOfDestination -> destination -> receiverAddress -> consigneeAddress
  const destination = pickFirst(raw.portOfDestination, raw.destination, raw.receiverAddress, raw.consigneeAddress) || 'Not available'

  const parcelDescription = pickFirst(raw.parcelDescription, raw.cargoDescription, raw.packageDescription, raw.contents) || 'Not available'
  const cargoDescription = pickFirst(raw.cargoDescription, raw.parcelDescription, raw.packageDescription) || 'Not available'
  const packageDescription = pickFirst(raw.packageDescription, raw.parcelDescription, raw.cargoDescription) || 'Not available'

  const quantity = asNumber(raw.quantity) ?? asNumber(raw.totalPieces) ?? asNumber(raw.pieces) ?? asNumber(raw.numberOfPieces)
  const weight = asNumber(raw.weight) ?? asNumber(raw.totalWeight)
  const dimensions = pickFirst(raw.dimensions) || 'Not available'
  const specialInstructions = pickFirst(raw.specialInstructions) || 'Not available'

  const dateOfIssue = pickFirst(raw.dateOfIssue) || 'Not available'
  const estimatedArrivalDate = pickFirst(raw.estimatedArrivalDate, raw.estimatedDeliveryDate) || 'Not available'
  const totalPieces = asNumber(raw.totalPieces) ?? asNumber(raw.pieces) ?? asNumber(raw.quantity)
  const totalWeight = asNumber(raw.totalWeight) ?? asNumber(raw.weight)
  const routeNumber = pickFirst(raw.routeNumber) || 'Not available'
  const iataCode = pickFirst(raw.iataCode) || 'Not available'
  const carrierReference = pickFirst(raw.carrierReference) || 'Not available'

  const lastUpdated = pickFirst(raw.updatedAt, raw.createdAt) || 'Not available'

  const excludedKeys = new Set([
    'trackingEvents', 'transitHistory', 'waybillNumber', 'trackingNumber', 'currentStatus', 'currentLocation',
    'bookingDate', 'estimatedDeliveryDate', 'deliveredDate', 'shipmentMode', 'transportMode', 'serviceType',
    'serviceTypeString', 'paymentStatus', 'senderName', 'senderPhone', 'senderAddress', 'shipperName',
    'shipperPhone', 'shipperAddress', 'receiverName', 'receiverPhone', 'receiverTelephone', 'receiverAddress',
    'consigneeName', 'consigneePhone', 'consigneeAddress', 'origin', 'portOfDeparture', 'airportOfDeparture',
    'destination', 'portOfDestination', 'airportOfDestination', 'parcelDescription', 'cargoDescription',
    'packageDescription', 'contents', 'quantity', 'totalPieces', 'pieces', 'numberOfPieces', 'weight',
    'totalWeight', 'dimensions', 'specialInstructions', 'dateOfIssue', 'estimatedArrivalDate', 'routeNumber',
    'iataCode', 'carrierReference',
    'createdAt', 'updatedAt', 'status'
  ])

  const additionalFields: Record<string, string> = {}
  Object.entries(raw).forEach(([key, value]) => {
    if (excludedKeys.has(key)) return
    if (value === null || value === undefined) return
    if (typeof value === 'object') return
    const normalized = asString(value)
    if (normalized === '') return
    additionalFields[key] = normalized
  })

  return {
    raw,
    waybillNumber: waybillNumber || 'Not available',
    trackingNumber: trackingNumber || 'Not available',
    currentStatus,
    currentLocation,
    bookingDate,
    estimatedDeliveryDate,
    deliveredDate,
    shipmentMode,
    serviceType,
    paymentStatus,
    senderName,
    senderPhone,
    senderAddress,
    shipperName,
    origin,
    receiverName,
    receiverPhone,
    receiverAddress,
    consigneeName,
    destination,
    parcelDescription,
    cargoDescription,
    packageDescription,
    quantity,
    weight,
    dimensions,
    specialInstructions,
    dateOfIssue,
    estimatedArrivalDate,
    totalPieces,
    totalWeight,
    routeNumber,
    iataCode,
    carrierReference,
    lastUpdated,
    trackingEvents,
    additionalFields,
  }
}
