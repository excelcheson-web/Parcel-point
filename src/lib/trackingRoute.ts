import { COUNTRIES } from '@/lib/constants'
import type { StoredWaybill } from '@/lib/types'

export interface TrackingRoutePoint {
  raw: string
  label: string
  city?: string
  country?: string
  code?: string
}

export interface TrackingRoute {
  departure: TrackingRoutePoint
  entry: TrackingRoutePoint
  summary: string
  isDomestic: boolean
  isSameCity: boolean
}

function cleanText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/\s+/g, ' ').trim()
}

function pickFirst(...values: unknown[]): string {
  for (const value of values) {
    const text = cleanText(value)
    if (text) return text
  }
  return ''
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim()
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function matchKnownCountry(raw: string) {
  const normalized = normalize(raw)
  return COUNTRIES.find((country) => {
    const city = normalize(country.city)
    const name = normalize(country.name)
    const airport = normalize(country.airport)
    const code = normalize(country.code)
    return (
      normalized.includes(city) ||
      normalized.includes(name) ||
      normalized.split(' ').includes(airport) ||
      normalized.split(' ').includes(code)
    )
  })
}

function extractCode(raw: string): string | undefined {
  const slashCode = raw.match(/\/\s*([A-Z0-9]{3,5})\b/i)?.[1]
  if (slashCode) return slashCode.toUpperCase()
  const airport = COUNTRIES.find((country) => normalize(raw).split(' ').includes(country.airport.toLowerCase()))
  return airport?.airport
}

function fallbackCity(raw: string): string {
  const afterDash = raw.includes(' - ') ? raw.split(' - ').pop() || raw : raw
  const firstPart = afterDash.split(/[\/,]/)[0]?.trim() || raw
  return titleCase(firstPart.replace(/\b(origin|destination|air|sea|land|hub|port|airport|terminal|facility)\b/gi, '').trim() || firstPart)
}

export function resolveRoutePoint(rawValue: string, fallback = 'Not available'): TrackingRoutePoint {
  const raw = cleanText(rawValue) || fallback
  const known = matchKnownCountry(raw)
  const code = extractCode(raw)

  if (known) {
    const normalized = normalize(raw)
    const rawCity = fallbackCity(raw)
    const matchedKnownCityOrCode =
      normalized.includes(normalize(known.city)) ||
      normalized.split(' ').includes(normalize(known.airport)) ||
      normalized.split(' ').includes(normalize(known.code))
    const city = matchedKnownCityOrCode || normalize(rawCity) === normalize(known.name)
      ? known.city
      : rawCity
    const label = `${city}, ${known.name}${code ? ` (${code})` : ''}`
    return {
      raw,
      label,
      city,
      country: known.name,
      code: code || known.airport,
    }
  }

  const city = fallbackCity(raw)
  const label = code ? `${city} (${code})` : city
  return { raw, label, city, code }
}

export function resolveTrackingRoute(waybill: StoredWaybill): TrackingRoute {
  const departureRaw = pickFirst(
    waybill.portOfDeparture,
    waybill.airportOfDeparture,
    waybill.origin,
    waybill.senderAddress,
    waybill.shipperAddress,
  )
  const entryRaw = pickFirst(
    waybill.portOfDestination,
    waybill.airportOfDestination,
    waybill.destination,
    waybill.receiverAddress,
    waybill.consigneeAddress,
  )

  const departure = resolveRoutePoint(departureRaw, 'Departure point pending')
  const entry = resolveRoutePoint(entryRaw, 'Point of entry pending')
  const isDomestic = Boolean(departure.country && entry.country && departure.country === entry.country)
  const isSameCity = Boolean(
    departure.city &&
    entry.city &&
    normalize(departure.city) === normalize(entry.city) &&
    (!departure.country || !entry.country || departure.country === entry.country)
  )
  const routeLabel = `${departure.label} to ${entry.label}`
  const summary = isSameCity
    ? `Local delivery: ${routeLabel}`
    : isDomestic
      ? `Domestic delivery: ${routeLabel}`
      : `International route: ${routeLabel}`

  return { departure, entry, summary, isDomestic, isSameCity }
}
