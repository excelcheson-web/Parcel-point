// Regenerates the province/city geo data used by the location picker and the
// tracking map. This is a DEV-ONLY maintenance script — it is never imported by
// the app and adds nothing to the bundle.
//
// Source: dr5hn/countries-states-cities-database (nested JSON).
// Usage:
//   1) Download the nested dataset once:
//        https://raw.githubusercontent.com/dr5hn/countries-states-cities-database/master/json/countries+states+cities.json
//      (~46 MB) and save it somewhere, e.g. ./tmp/csc.json
//   2) node scripts/generate-geo-data.mjs ./tmp/csc.json
//
// Outputs:
//   public/geo/{iso2}.json   — lazy-loaded per-country province+city data
//   src/lib/geo/geoIndex.ts  — small bundled index (names + bounding boxes)
//
// To add/remove countries, edit TARGETS below and re-run.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROJECT = path.resolve(__dirname, '..')
const PUB_DIR = path.join(PROJECT, 'public', 'geo')
const LIB_DIR = path.join(PROJECT, 'src', 'lib', 'geo')

// The 6 named countries + all East/SE/South Asia.
const TARGETS = [
  'PH', 'ID', 'MY', 'US', 'CA', 'VE',
  'CN', 'JP', 'KR', 'TW', 'HK', 'MO', 'MN',
  'TH', 'VN', 'SG', 'MM', 'KH', 'LA', 'BN', 'TL',
  'IN', 'PK', 'BD', 'LK', 'NP', 'BT', 'MV', 'AF',
]

const input = process.argv[2]
if (!input || !fs.existsSync(input)) {
  console.error('Provide the path to countries+states+cities.json — see the header of this file.')
  process.exit(1)
}

const num = (v) => { const n = typeof v === 'number' ? v : parseFloat(v); return Number.isFinite(n) ? n : null }
const r4 = (n) => Math.round(n * 1e4) / 1e4
const bad = (lat, lng) => lat === null || lng === null || (Math.abs(lat) < 1e-6 && Math.abs(lng) < 1e-6)

const data = JSON.parse(fs.readFileSync(input, 'utf8'))
fs.mkdirSync(PUB_DIR, { recursive: true })
fs.mkdirSync(LIB_DIR, { recursive: true })

const index = []
for (const iso2 of TARGETS) {
  const c = data.find((x) => x.iso2 === iso2)
  if (!c) { console.warn('MISSING', iso2); continue }
  const cLat = num(c.latitude), cLng = num(c.longitude)
  let minLat = Infinity, minLng = Infinity, maxLat = -Infinity, maxLng = -Infinity
  const provinces = []

  for (const s of (c.states || [])) {
    const cities = []
    const seen = new Set()
    for (const ct of (s.cities || [])) {
      const lat = num(ct.latitude), lng = num(ct.longitude)
      if (bad(lat, lng)) continue
      const name = (ct.name || '').trim()
      if (!name || seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())
      cities.push({ name, lat: r4(lat), lng: r4(lng) })
      minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat)
      minLng = Math.min(minLng, lng); maxLng = Math.max(maxLng, lng)
    }
    cities.sort((a, b) => a.name.localeCompare(b.name))
    let pLat = num(s.latitude), pLng = num(s.longitude)
    if (bad(pLat, pLng)) {
      if (cities.length) { pLat = cities.reduce((a, x) => a + x.lat, 0) / cities.length; pLng = cities.reduce((a, x) => a + x.lng, 0) / cities.length }
      else { pLat = cLat; pLng = cLng }
    }
    provinces.push({ name: (s.name || '').trim() || iso2, code: (s.iso2 || s.iso3166_2 || '').toString().replace(/^.*-/, '') || undefined, lat: r4(pLat), lng: r4(pLng), cities })
  }

  if (provinces.length === 0) {
    const cap = (c.capital || c.name || iso2).trim()
    provinces.push({ name: c.name, code: iso2, lat: r4(cLat), lng: r4(cLng), cities: bad(cLat, cLng) ? [] : [{ name: cap, lat: r4(cLat), lng: r4(cLng) }] })
    if (!bad(cLat, cLng)) { minLat = maxLat = cLat; minLng = maxLng = cLng }
  }
  provinces.sort((a, b) => a.name.localeCompare(b.name))

  let bbox
  if (minLat === Infinity) bbox = [r4(cLng - 2), r4(cLat - 2), r4(cLng + 2), r4(cLat + 2)]
  else {
    const padLat = Math.max((maxLat - minLat) * 0.06, 0.25)
    const padLng = Math.max((maxLng - minLng) * 0.06, 0.25)
    bbox = [r4(minLng - padLng), r4(minLat - padLat), r4(maxLng + padLng), r4(maxLat + padLat)]
  }

  const cityCount = provinces.reduce((a, p) => a + p.cities.length, 0)
  fs.writeFileSync(path.join(PUB_DIR, iso2.toLowerCase() + '.json'), JSON.stringify({ iso2, name: c.name, lat: r4(cLat), lng: r4(cLng), bbox, provinces }))
  index.push({ iso2, name: c.name, lat: r4(cLat), lng: r4(cLng), bbox, provinces: provinces.length, cities: cityCount })
  console.log(`${iso2} ${c.name}: ${provinces.length} provinces, ${cityCount} cities`)
}

index.sort((a, b) => a.name.localeCompare(b.name))
const ts = `// AUTO-GENERATED from dr5hn/countries-states-cities-database. Do not edit by hand.
// Regenerate with: node scripts/generate-geo-data.mjs <countries+states+cities.json>
// Bundled country index (names + bounding boxes). Per-country province/city data
// is lazy-loaded from /geo/{iso2}.json — never bundled.

export interface GeoCountryIndexEntry {
  iso2: string
  name: string
  lat: number
  lng: number
  /** [minLng, minLat, maxLng, maxLat] */
  bbox: [number, number, number, number]
  provinces: number
  cities: number
}

export const GEO_COUNTRY_INDEX: GeoCountryIndexEntry[] = ${JSON.stringify(index, null, 0)}

export const GEO_COUNTRY_CODES: ReadonlySet<string> = new Set(GEO_COUNTRY_INDEX.map((c) => c.iso2))
`
fs.writeFileSync(path.join(LIB_DIR, 'geoIndex.ts'), ts)
console.log(`\nDone: ${index.length} countries, ${index.reduce((a, c) => a + c.cities, 0)} cities.`)
