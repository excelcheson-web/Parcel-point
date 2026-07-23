// Client-side lazy loader for per-country province/city geo data.
//
// Performance contract: the heavy province/city payloads live as static files
// under /public/geo/{iso2}.json and are fetched ONLY on demand (when a country
// is selected in the form, or is the destination of a tracked shipment). They
// are never part of the app bundle. Only the small GEO_COUNTRY_INDEX is bundled.

import { GEO_COUNTRY_INDEX, GEO_COUNTRY_CODES, type GeoCountryIndexEntry } from './geoIndex'

export type { GeoCountryIndexEntry }
export { GEO_COUNTRY_INDEX, GEO_COUNTRY_CODES }

export interface GeoCity {
  name: string
  lat: number
  lng: number
}

export interface GeoProvince {
  name: string
  code?: string
  lat: number
  lng: number
  cities: GeoCity[]
}

export interface GeoCountry {
  iso2: string
  name: string
  lat: number
  lng: number
  /** [minLng, minLat, maxLng, maxLat] */
  bbox: [number, number, number, number]
  provinces: GeoProvince[]
}

/** True when a country has full province + city drill-down data available. */
export function hasGeoDetail(iso2?: string | null): boolean {
  return !!iso2 && GEO_COUNTRY_CODES.has(iso2.toUpperCase())
}

export function getGeoIndexEntry(iso2?: string | null): GeoCountryIndexEntry | undefined {
  if (!iso2) return undefined
  const code = iso2.toUpperCase()
  return GEO_COUNTRY_INDEX.find((c) => c.iso2 === code)
}

const cache = new Map<string, Promise<GeoCountry | null>>()

/**
 * Lazily fetch (and cache) a country's province/city data. Resolves to null for
 * countries without geo detail or on any network/parse failure — callers must
 * degrade gracefully (the app never blocks on this).
 */
export function loadCountryGeo(iso2?: string | null): Promise<GeoCountry | null> {
  const code = (iso2 || '').toUpperCase()
  if (!GEO_COUNTRY_CODES.has(code)) return Promise.resolve(null)
  const existing = cache.get(code)
  if (existing) return existing

  const promise: Promise<GeoCountry | null> =
    typeof fetch === 'undefined'
      ? Promise.resolve(null)
      : fetch(`/geo/${code.toLowerCase()}.json`)
          .then((res) => (res.ok ? (res.json() as Promise<GeoCountry>) : null))
          .catch(() => null)

  // Do not cache a rejected/failed promise so a later attempt can retry.
  const guarded = promise.catch(() => null)
  guarded.then((value) => {
    if (value === null) cache.delete(code)
  })
  cache.set(code, guarded)
  return guarded
}

function norm(value: string): string {
  // NFD splits accented letters into base + combining mark; the [^a-z0-9] strip
  // then drops the marks, so "Cebú" and "Cebu" normalize identically.
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** Find a province within a loaded country by (fuzzy) name. */
export function findProvince(country: GeoCountry, provinceName?: string | null): GeoProvince | undefined {
  if (!provinceName) return undefined
  const target = norm(provinceName)
  if (!target) return undefined
  return (
    country.provinces.find((p) => norm(p.name) === target) ||
    country.provinces.find((p) => norm(p.name).includes(target) || target.includes(norm(p.name)))
  )
}

/** Find a city (optionally scoped to a province) within a loaded country by name. */
export function findCity(
  country: GeoCountry,
  cityName?: string | null,
  provinceName?: string | null,
): { province: GeoProvince; city: GeoCity } | undefined {
  if (!cityName) return undefined
  const target = norm(cityName)
  if (!target) return undefined

  const scoped = provinceName ? findProvince(country, provinceName) : undefined
  const search = scoped ? [scoped] : country.provinces

  for (const province of search) {
    const exact = province.cities.find((c) => norm(c.name) === target)
    if (exact) return { province, city: exact }
  }
  for (const province of search) {
    const partial = province.cities.find((c) => norm(c.name).includes(target) || target.includes(norm(c.name)))
    if (partial) return { province, city: partial }
  }
  // Fall back to searching all provinces if a province scope missed.
  if (scoped) return findCity(country, cityName, null)
  return undefined
}

function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const la1 = (aLat * Math.PI) / 180
  const la2 = (bLat * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)))
}

/**
 * Return up to `limit` cities across the country nearest to a point — used to
 * render a sensible, capped set of city markers around the delivery locality
 * without flooding the SVG with thousands of dots.
 */
export function citiesNear(country: GeoCountry, lat: number, lng: number, limit = 40): GeoCity[] {
  const all: GeoCity[] = []
  for (const p of country.provinces) {
    for (const c of p.cities) all.push(c)
  }
  return all
    .map((c) => ({ c, d: haversineKm(lat, lng, c.lat, c.lng) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, limit)
    .map((x) => x.c)
}
