'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import { resolveTrackingRoute, type TrackingRoutePoint } from '@/lib/trackingRoute'
import { computeRuntimeTrackingState } from '@/lib/trackingAutomation'
import { COUNTRIES } from '@/lib/constants'
import {
  loadCountryGeo,
  getGeoIndexEntry,
  hasGeoDetail,
  citiesNear,
  findCity,
  type GeoCountry,
} from '@/lib/geo/geoData'
import type { StoredWaybill } from '@/lib/types'

const GEO_URL = '/world-atlas-countries.json'
const MAP_W = 800
const MAP_H = 500
const PROJ_SCALE = 147
const WORLD_CENTER_LAT = 15
const ZOOM_DURATION_MS = 850

// [longitude, latitude] fallback lookup by city/location keyword (legacy waybills
// without stored coordinates). New waybills carry exact coords, so this is a
// safety net, not the primary path.
const CITY_COORDS: Record<string, [number, number]> = {
  'casablanca': [-7.59, 33.57], 'morocco': [-7.09, 31.79],
  'nairobi': [36.82, -1.29], 'kenya': [36.82, -1.29],
  'cairo': [31.24, 30.04], 'egypt': [30.80, 26.82],
  'johannesburg': [28.05, -26.20], 'cape town': [18.42, -33.92], 'south africa': [25.0, -29.0],
  'accra': [-0.19, 5.60], 'ghana': [-1.02, 7.95],
  'lagos': [3.38, 6.52], 'nigeria': [8.68, 9.08], 'abuja': [7.49, 9.06],
  'london': [-0.13, 51.51], 'heathrow': [-0.45, 51.47],
  'paris': [2.35, 48.86], 'cdg': [2.55, 49.01],
  'amsterdam': [4.90, 52.37], 'frankfurt': [8.68, 50.11], 'berlin': [13.41, 52.52],
  'madrid': [-3.70, 40.42], 'rome': [12.50, 41.90], 'milan': [9.19, 45.47],
  'brussels': [4.35, 50.85], 'zurich': [8.54, 47.38], 'vienna': [16.37, 48.21],
  'stockholm': [18.07, 59.33], 'oslo': [10.75, 59.91], 'copenhagen': [12.57, 55.68],
  'athens': [23.73, 37.98], 'lisbon': [-9.14, 38.72], 'warsaw': [21.01, 52.23],
  'prague': [14.44, 50.08], 'budapest': [19.04, 47.50], 'istanbul': [28.98, 41.01],
  'shanghai': [121.47, 31.23], 'beijing': [116.41, 39.90], 'shenzhen': [114.06, 22.54],
  'guangzhou': [113.26, 23.13], 'hong kong': [114.17, 22.32], 'hongkong': [114.17, 22.32],
  'tokyo': [139.69, 35.69], 'osaka': [135.50, 34.69], 'singapore': [103.82, 1.35],
  'dubai': [55.27, 25.20], 'abu dhabi': [54.38, 24.45], 'riyadh': [46.72, 24.71],
  'doha': [51.53, 25.29], 'mumbai': [72.88, 19.08], 'delhi': [77.10, 28.70],
  'bangkok': [100.50, 13.76], 'jakarta': [106.83, -6.21], 'kuala lumpur': [101.69, 3.14],
  'manila': [120.98, 14.60], 'ho chi minh': [106.63, 10.82], 'hanoi': [105.83, 21.03],
  'seoul': [126.98, 37.57], 'taipei': [121.57, 25.03], 'china': [104.19, 35.86],
  'india': [78.96, 20.59], 'new york': [-74.01, 40.71], 'jfk': [-73.78, 40.64],
  'los angeles': [-118.24, 34.05], 'chicago': [-87.63, 41.88], 'houston': [-95.37, 29.76],
  'miami': [-80.19, 25.76], 'atlanta': [-84.39, 33.75], 'toronto': [-79.38, 43.65],
  'vancouver': [-123.12, 49.28], 'mexico city': [-99.13, 19.43], 'sao paulo': [-46.63, -23.55],
  'buenos aires': [-58.38, -34.60], 'bogota': [-74.07, 4.71], 'lima': [-77.04, -12.05],
  'santiago': [-70.67, -33.45], 'caracas': [-66.90, 10.48], 'sydney': [151.21, -33.87],
  'melbourne': [144.96, -37.81], 'auckland': [174.76, -36.85],
}

// ── Projection (matches react-simple-maps geoMercator with translate=[W/2,H/2]) ─
function mercY(lat: number): number {
  const clamped = Math.max(Math.min(lat, 84), -84)
  return Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360))
}

function project(lng: number, lat: number, scale: number, cLng: number, cLat: number): [number, number] {
  const x = scale * ((lng - cLng) * Math.PI) / 180
  const y = -scale * (mercY(lat) - mercY(cLat))
  return [MAP_W / 2 + x, MAP_H / 2 + y]
}

type Bbox = [number, number, number, number] // [minLng, minLat, maxLng, maxLat]

/** Compute {scale, center} that fits a bbox into the viewport with padding. */
function fitView(bbox: Bbox, pad = 0.82): { scale: number; cLng: number; cLat: number } {
  const [minLng, minLat, maxLng, maxLat] = bbox
  const cLng = (minLng + maxLng) / 2
  const cLat = (minLat + maxLat) / 2
  const widthUnit = Math.max(((maxLng - minLng) * Math.PI) / 180, 1e-4)
  const heightUnit = Math.max(mercY(maxLat) - mercY(minLat), 1e-4)
  const scale = Math.min((MAP_W * pad) / widthUnit, (MAP_H * pad) / heightUnit)
  return { scale: Math.max(PROJ_SCALE, Math.min(scale, 5200)), cLng, cLat }
}

function insideBbox(lng: number, lat: number, bbox: Bbox): boolean {
  return lng >= bbox[0] && lng <= bbox[2] && lat >= bbox[1] && lat <= bbox[3]
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const i = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  return lo === hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo)
}

/**
 * A bounding box that ignores far-flung outlier cities (e.g. US Pacific
 * territories) so huge countries still zoom to their populated mass, while
 * always keeping the delivery point in frame.
 */
function robustCountryBbox(
  provinces: { cities: { lng: number; lat: number }[] }[],
  dLng: number,
  dLat: number,
  fallback: Bbox,
): Bbox {
  const lngs: number[] = []
  const lats: number[] = []
  for (const p of provinces) for (const c of p.cities) { lngs.push(c.lng); lats.push(c.lat) }
  if (lngs.length < 8) return fallback
  lngs.sort((a, b) => a - b)
  lats.sort((a, b) => a - b)
  const m = 0.4
  return [
    Math.min(percentile(lngs, 2), dLng - m),
    Math.min(percentile(lats, 2), dLat - m),
    Math.max(percentile(lngs, 98), dLng + m),
    Math.max(percentile(lats, 98), dLat + m),
  ]
}

function finite(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function iso2FromName(name?: string | null): string | undefined {
  if (!name) return undefined
  const n = name.trim().toLowerCase()
  if (!n) return undefined
  const exact = COUNTRIES.find((c) => c.name.toLowerCase() === n)
  if (exact) return exact.code
  const partial = COUNTRIES.find((c) => n.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(n))
  return partial?.code
}

function coordsFromKeyword(point: TrackingRoutePoint): [number, number] | null {
  const candidates = [point.city, point.code, point.country, point.label, point.raw].filter(Boolean).join(' ')
  const norm = candidates.toLowerCase().replace(/[,/()]/g, ' ').replace(/\s+/g, ' ').trim()
  const tokens = norm.split(' ')
  for (const [rawKey, coords] of Object.entries(CITY_COORDS)) {
    const key = rawKey.toLowerCase()
    if (tokens.includes(key) || norm.includes(key)) return coords
  }
  return null
}

function bezierPt(t: number, p0: [number, number], p1: [number, number], p2: [number, number]): [number, number] {
  const u = 1 - t
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]
}

function statusToProgress(status?: string): number {
  const s = (status ?? '').toLowerCase()
  if (s.includes('delivered')) return 0.97
  if (s.includes('out for delivery')) return 0.84
  if (s.includes('customs') || s.includes('clearance')) return 0.63
  if (s.includes('arrived at destination') || s.includes('destination')) return 0.72
  if (s.includes('transit') || s.includes('arrived') || s.includes('dispatch') || s.includes('departed')) return 0.44
  return 0.08
}

export type MapServiceType = 'AIR' | 'SEA' | 'D2D'

export interface DashboardMapProps {
  waybill?: StoredWaybill | null
  state: 'empty' | 'loading' | 'notfound' | 'error' | 'success'
  serviceType?: MapServiceType
  mapView?: 'map' | 'satellite'
  zoom?: number
}

function AirVehicle() {
  return (
    <g fill="white">
      <path d="M0,-9 L5,4 L0,2 L-5,4 Z" />
      <path d="M-11,1 L-2,0 L11,1 L11,3 L-2,1 L-11,3 Z" />
      <path d="M-5,6 L-1,5 L5,6 L5,7 L-1,6 L-5,7 Z" />
    </g>
  )
}
function SeaVehicle() {
  return (
    <g fill="white">
      <path d="M-9,-2 L9,-2 L7,5 L-7,5 Z" />
      <path d="M-3,-9 L3,-9 L3,-2 L-3,-2 Z" />
      <path d="M-5,-5 L0,-7 L5,-5" fill="none" stroke="white" strokeWidth="1" />
    </g>
  )
}
function TruckVehicle() {
  return (
    <g fill="white">
      <rect x="-9" y="-5" width="12" height="7" rx="1" />
      <path d="M3,-2 L9,-2 L9,2 L3,2 Z" />
      <path d="M6,-2 L6,-5 L3,-5" fill="none" stroke="white" strokeWidth="1" />
      <circle cx="-5" cy="4" r="2" fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="7" cy="4" r="2" fill="none" stroke="white" strokeWidth="1.5" />
    </g>
  )
}

interface RouteModel {
  origin: [number, number] // [lng, lat]
  dest: [number, number]
  originCity: string
  destCity: string
  destCode?: string
  destBbox?: Bbox
  destName?: string
  deliveryLocality?: string
  // ordered path of real waypoints (lng/lat) drawn from tracking-event coords
  path: [number, number][]
  activeIndex: number
  entered: boolean
  status: string
  fallbackProgress: number
}

function pointAlongPolyline(pts: [number, number][], f: number): { pt: [number, number]; angle: number } {
  if (pts.length === 0) return { pt: [0, 0], angle: 0 }
  if (pts.length === 1) return { pt: pts[0], angle: 0 }
  const segs: number[] = []
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
    segs.push(d)
    total += d
  }
  let target = Math.max(0, Math.min(f, 1)) * total
  for (let i = 0; i < segs.length; i++) {
    if (target <= segs[i] || i === segs.length - 1) {
      const r = segs[i] ? target / segs[i] : 0
      const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r
      const y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r
      const angle = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]) * (180 / Math.PI)
      return { pt: [x, y], angle }
    }
    target -= segs[i]
  }
  return { pt: pts[pts.length - 1], angle: 0 }
}

export default function DashboardMap({ waybill, state, serviceType = 'AIR', mapView = 'map', zoom = 1 }: DashboardMapProps) {
  const isSatellite = mapView === 'satellite'

  // ── Resolve everything about the route from the waybill ────────────────────
  const model = useMemo<RouteModel | null>(() => {
    if (!waybill) return null
    const route = resolveTrackingRoute(waybill)
    const runtime = computeRuntimeTrackingState(waybill.trackingEvents ?? [])

    const destCode = (waybill.destCountryCode || iso2FromName(route.entry.country))?.toUpperCase()
    const destIdx = getGeoIndexEntry(destCode)

    const resolveOrigin = (): [number, number] | null => {
      if (finite(waybill.originLng) && finite(waybill.originLat)) return [waybill.originLng, waybill.originLat]
      const kw = coordsFromKeyword(route.departure)
      if (kw) return kw
      const idx = getGeoIndexEntry(iso2FromName(route.departure.country))
      return idx ? [idx.lng, idx.lat] : null
    }
    const resolveDest = (): [number, number] | null => {
      if (finite(waybill.destLng) && finite(waybill.destLat)) return [waybill.destLng, waybill.destLat]
      const kw = coordsFromKeyword(route.entry)
      if (kw) return kw
      return destIdx ? [destIdx.lng, destIdx.lat] : null
    }

    const origin = resolveOrigin()
    const dest = resolveDest()
    if (!origin || !dest) return null

    // Ordered real-city path from event coordinates (city-by-city trail).
    const evs = runtime.events
    const path: [number, number][] = []
    for (const e of evs) {
      if (finite(e.lng) && finite(e.lat)) {
        const last = path[path.length - 1]
        if (!last || Math.abs(last[0] - e.lng) > 1e-4 || Math.abs(last[1] - e.lat) > 1e-4) {
          path.push([e.lng, e.lat])
        }
      }
    }

    const destBbox: Bbox | undefined = destIdx?.bbox

    // Has the parcel entered the destination country?
    const activeEvent = runtime.activeEventIndex >= 0 ? evs[runtime.activeEventIndex] : undefined
    const activeInDest =
      !!activeEvent && finite(activeEvent.lng) && finite(activeEvent.lat) && !!destBbox &&
      insideBbox(activeEvent.lng, activeEvent.lat, destBbox)
    const status = (runtime.currentStatus || waybill.currentStatus || '').toLowerCase()
    const statusInDest =
      /arrived at destination|destination (airport|port|hub)|import|clearance|customs|out for delivery|delivered|final sort|ready for pickup|picked up|final mile/.test(status)
    const entered = Boolean(destBbox) && (activeInDest || statusInDest)

    // Map active event index onto the path (path skips coord-less events).
    let activeIndex = path.length - 1
    if (activeEvent && finite(activeEvent.lng) && finite(activeEvent.lat)) {
      const idx = path.findIndex((p) => Math.abs(p[0] - activeEvent.lng!) < 1e-4 && Math.abs(p[1] - activeEvent.lat!) < 1e-4)
      if (idx >= 0) activeIndex = idx
    }

    return {
      origin,
      dest,
      originCity: route.departure.city || 'Origin',
      destCity: waybill.destCity || route.entry.city || 'Destination',
      destCode,
      destBbox,
      destName: destIdx?.name || route.entry.country,
      deliveryLocality: (waybill.deliveryLocality as string | undefined) || (waybill.receiverCity as string | undefined) || waybill.destCity,
      path,
      activeIndex,
      entered,
      status,
      fallbackProgress: statusToProgress(runtime.currentStatus || waybill.currentStatus),
    }
  }, [waybill])

  // ── Lazy-load destination country geo ONLY once the parcel has entered ──────
  // Tagged with its country code so `destGeo` can be derived (no sync setState).
  const [loadedGeo, setLoadedGeo] = useState<{ code: string; geo: GeoCountry | null } | null>(null)
  useEffect(() => {
    if (!model?.entered || !model.destCode || !hasGeoDetail(model.destCode)) return
    const code = model.destCode
    let alive = true
    loadCountryGeo(code).then((geo) => { if (alive) setLoadedGeo({ code, geo }) })
    return () => { alive = false }
  }, [model?.entered, model?.destCode])
  const destGeo = model?.entered && loadedGeo && loadedGeo.code === model.destCode ? loadedGeo.geo : null
  // Zoom into the country only once its geo is loaded, so the whole overview →
  // country transition happens as a single, clean animation.
  const zoomedIn = Boolean(model?.entered && destGeo)

  // ── Animated camera (scale + geographic center) ────────────────────────────
  const [view, setView] = useState({ scale: PROJ_SCALE, cLng: 0, cLat: WORLD_CENTER_LAT })
  const viewRef = useRef({ scale: PROJ_SCALE, cLng: 0, cLat: WORLD_CENTER_LAT })
  const rafRef = useRef<number | undefined>(undefined)

  // Target camera derived from state.
  const target = useMemo(() => {
    const userZoom = Math.max(0.6, Math.min(zoom || 1, 2.4))
    if (!model) return { scale: PROJ_SCALE * userZoom, cLng: 0, cLat: WORLD_CENTER_LAT }
    if (zoomedIn && destGeo) {
      const bbox = robustCountryBbox(destGeo.provinces, model.dest[0], model.dest[1], model.destBbox ?? destGeo.bbox)
      const fit = fitView(bbox)
      return { scale: fit.scale * userZoom, cLng: fit.cLng, cLat: fit.cLat }
    }
    // Route overview: frame both endpoints.
    const bbox: Bbox = [
      Math.min(model.origin[0], model.dest[0]),
      Math.min(model.origin[1], model.dest[1]),
      Math.max(model.origin[0], model.dest[0]),
      Math.max(model.origin[1], model.dest[1]),
    ]
    const fit = fitView(bbox, 0.55)
    const scale = Math.min(fit.scale, PROJ_SCALE * 2.4) * userZoom
    return { scale: Math.max(PROJ_SCALE * 0.9, scale), cLng: fit.cLng, cLat: fit.cLat }
  }, [model, zoom, zoomedIn, destGeo])

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    const start = { ...viewRef.current }

    // Snap instantly for reduced-motion users or negligible changes — avoids
    // needless per-frame map re-projection (matters most on low-end phones).
    const prefersReduced =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const bigChange =
      Math.abs(start.scale - target.scale) > 1 ||
      Math.abs(start.cLng - target.cLng) > 0.02 ||
      Math.abs(start.cLat - target.cLat) > 0.02
    if (prefersReduced || !bigChange) {
      rafRef.current = requestAnimationFrame(() => {
        viewRef.current = { ...target }
        setView({ ...target })
      })
      return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
    }

    const t0 = performance.now()
    let last = 0
    const ease = (t: number) => 1 - Math.pow(1 - t, 3)
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / ZOOM_DURATION_MS)
      // Throttle state updates to ~33fps so the whole map isn't re-projected on
      // every single animation frame — keeps the zoom smooth on mobile GPUs.
      if (now - last >= 30 || p >= 1) {
        last = now
        const e = ease(p)
        const next = {
          scale: start.scale + (target.scale - start.scale) * e,
          cLng: start.cLng + (target.cLng - start.cLng) * e,
          cLat: start.cLat + (target.cLat - start.cLat) * e,
        }
        viewRef.current = next
        setView(next)
      }
      if (p < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target])

  // ── Geometry for arc + vehicle in the current projected frame ──────────────
  const geom = useMemo(() => {
    if (!model) return null
    const proj = (lng: number, lat: number): [number, number] => project(lng, lat, view.scale, view.cLng, view.cLat)
    const fromXY = proj(model.origin[0], model.origin[1])
    let toXY = proj(model.dest[0], model.dest[1])
    const same = Math.abs(fromXY[0] - toXY[0]) < 1 && Math.abs(fromXY[1] - toXY[1]) < 1
    if (same) toXY = [fromXY[0] + 36, fromXY[1] - 26]
    const dx = toXY[0] - fromXY[0], dy = toXY[1] - fromXY[1]
    const dist = Math.hypot(dx, dy)
    const midX = (fromXY[0] + toXY[0]) / 2
    const midY = (fromXY[1] + toXY[1]) / 2 - Math.max(dist * 0.26, same ? 38 : 0)
    const ctrl: [number, number] = [midX, midY]
    const arcPath = `M ${fromXY[0]},${fromXY[1]} Q ${midX},${midY} ${toXY[0]},${toXY[1]}`

    // Multi-city trail when we have real event coordinates.
    const pathXY = model.path.map((p) => proj(p[0], p[1]))
    let vehicleXY: [number, number]
    let angle = 0
    if (pathXY.length >= 2) {
      const i = Math.max(0, Math.min(model.activeIndex, pathXY.length - 1))
      vehicleXY = pathXY[i]
      const ref = i < pathXY.length - 1 ? pathXY[i + 1] : pathXY[i - 1]
      const sign = i < pathXY.length - 1 ? 1 : -1
      angle = Math.atan2((ref[1] - vehicleXY[1]) * sign, (ref[0] - vehicleXY[0]) * sign) * (180 / Math.PI)
    } else {
      const t = model.fallbackProgress
      vehicleXY = bezierPt(t, fromXY, ctrl, toXY)
      const tx = 2 * (1 - t) * (ctrl[0] - fromXY[0]) + 2 * t * (toXY[0] - ctrl[0])
      const ty = 2 * (1 - t) * (ctrl[1] - fromXY[1]) + 2 * t * (toXY[1] - ctrl[1])
      angle = Math.atan2(ty, tx) * (180 / Math.PI)
    }

    // Traveled vs remaining trail segments.
    const traveled = pathXY.slice(0, Math.max(1, model.activeIndex + 1))
    const toPathD = (pts: [number, number][]) => (pts.length ? 'M ' + pts.map((p) => `${p[0]},${p[1]}`).join(' L ') : '')

    return { fromXY, toXY, arcPath, vehicleXY, angle, pathXY, traveledD: toPathD(traveled), fullPathD: toPathD(pathXY) }
  }, [model, view])

  // ── Province + city markers (only meaningful once entered & geo loaded) ─────
  const markers = useMemo(() => {
    if (!model?.entered || !destGeo) return null
    const proj = (lng: number, lat: number): [number, number] => project(lng, lat, view.scale, view.cLng, view.cLat)
    const [dLng, dLat] = model.dest
    // Province labels: all when few, else the nearest ~26 to the delivery point.
    const withDist = destGeo.provinces
      .map((p) => ({ p, d: Math.hypot(p.lng - dLng, p.lat - dLat) }))
      .sort((a, b) => a.d - b.d)
    const labelCount = destGeo.provinces.length <= 34 ? destGeo.provinces.length : 26
    const labelled = new Set(withDist.slice(0, labelCount).map((x) => x.p.name))
    const provinces = destGeo.provinces.map((p) => {
      const [x, y] = proj(p.lng, p.lat)
      return { name: p.name, x, y, label: labelled.has(p.name) }
    })
    const cities = citiesNear(destGeo, dLat, dLng, 55).map((c) => {
      const [x, y] = proj(c.lng, c.lat)
      return { name: c.name, x, y }
    })
    return { provinces, cities }
  }, [model, destGeo, view])

  // ── Local delivery leg: gateway hub → real intermediate cities → delivery ───
  const localLeg = useMemo(() => {
    if (!model?.entered || !destGeo || !model.destCode) return null
    const proj = (lng: number, lat: number): [number, number] => project(lng, lat, view.scale, view.cLng, view.cLat)

    // Country gateway hub (its primary city), else country centroid.
    const hubName = COUNTRIES.find((c) => c.code === model.destCode)?.city
    const hubHit = hubName ? findCity(destGeo, hubName) : undefined
    const hub: [number, number] = hubHit ? [hubHit.city.lng, hubHit.city.lat] : [destGeo.lng, destGeo.lat]
    const delivery = model.dest

    const legLngLat: [number, number][] = [hub]
    const dxl = delivery[0] - hub[0]
    const dyl = delivery[1] - hub[1]
    const segLen2 = dxl * dxl + dyl * dyl
    if (segLen2 > 4e-3) {
      // Pick up to 2 real cities that lie roughly between hub and delivery.
      const cand: { c: { lng: number; lat: number }; t: number; pd: number }[] = []
      for (const p of destGeo.provinces) {
        for (const c of p.cities) {
          const t = ((c.lng - hub[0]) * dxl + (c.lat - hub[1]) * dyl) / segLen2
          if (t <= 0.22 || t >= 0.82) continue
          const projx = hub[0] + t * dxl
          const projy = hub[1] + t * dyl
          cand.push({ c, t, pd: Math.hypot(c.lng - projx, c.lat - projy) })
        }
      }
      cand.sort((a, b) => a.pd - b.pd)
      cand.slice(0, 2).sort((a, b) => a.t - b.t).forEach((pk) => legLngLat.push([pk.c.lng, pk.c.lat]))
      legLngLat.push(delivery)
    }

    const pts = legLngLat.map((p) => proj(p[0], p[1]))
    const s = model.status
    let f = 0.32
    if (s.includes('delivered')) f = 1
    else if (s.includes('out for delivery') || s.includes('final mile') || s.includes('final sort')) f = 0.66
    else if (s.includes('ready for pickup') || s.includes('picked up')) f = 0.92
    else if (s.includes('customs') || s.includes('clearance') || s.includes('import')) f = 0.16

    const { pt: vehicle, angle } = pointAlongPolyline(pts, f)
    const toD = (a: [number, number][]) => (a.length ? 'M ' + a.map((p) => `${p[0]},${p[1]}`).join(' L ') : '')

    // Traveled portion up to the vehicle for the solid green segment.
    const traveledPts: [number, number][] = []
    if (pts.length >= 2) {
      const total = pts.slice(1).reduce((acc, p, i) => acc + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0)
      let target = f * total
      traveledPts.push(pts[0])
      for (let i = 0; i < pts.length - 1; i++) {
        const d = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
        if (target >= d) { traveledPts.push(pts[i + 1]); target -= d } else {
          const r = d ? target / d : 0
          traveledPts.push([pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r])
          break
        }
      }
    }

    return { fullD: toD(pts), traveledD: toD(traveledPts), vehicle, angle, hasLeg: pts.length >= 2 }
  }, [model, destGeo, view])

  const showRoute = state === 'success' && !!model && !!geom

  return (
    <div
      className="relative w-full h-full"
      style={{ background: isSatellite ? '#08120f' : '#071427' }}
      data-map-view={mapView}
      data-map-zoom={view.scale.toFixed(0)}
      data-map-entered={model?.entered ? 'true' : 'false'}
    >
      <ComposableMap
        width={MAP_W}
        height={MAP_H}
        style={{ width: '100%', height: '100%' }}
        projectionConfig={{ scale: view.scale, center: [view.cLng, view.cLat] as [number, number] }}
      >
        <defs>
          <radialGradient id="mapBgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(124,58,237,0.07)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <pattern id="mapDotGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="0.7" fill={isSatellite ? 'rgba(34,197,94,0.14)' : 'rgba(124,58,237,0.18)'} />
          </pattern>
        </defs>

        <rect width={MAP_W} height={MAP_H} fill="url(#mapDotGrid)" />
        <rect width={MAP_W} height={MAP_H} fill="url(#mapBgGlow)" />

        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const isDest =
                zoomedIn &&
                typeof geo.properties === 'object' &&
                geo.properties !== null &&
                iso2FromName((geo.properties as { name?: string }).name) === model?.destCode
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isDest ? (isSatellite ? '#1d3a2a' : '#122a49') : isSatellite ? '#15291f' : '#0c1d32'}
                  stroke={isDest ? '#7C3AED' : isSatellite ? 'rgba(74,222,128,0.18)' : 'rgba(124,58,237,0.22)'}
                  strokeWidth={isDest ? 1 : 0.5}
                  style={{
                    default: { outline: 'none' },
                    hover: { fill: isSatellite ? '#1b3627' : '#0f2540', outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              )
            })
          }
        </Geographies>

        {/* Province + city markers within the destination country */}
        {showRoute && markers && (
          <g>
            {markers.provinces.map((p) => (
              <g key={`prov-${p.name}`}>
                <circle cx={p.x} cy={p.y} r={2.4} fill="rgba(168,85,247,0.55)" />
                {p.label && (
                  <text x={p.x} y={p.y - 5} textAnchor="middle" fill="rgba(214,230,246,0.75)" fontSize={7.5} fontWeight={600}>
                    {p.name}
                  </text>
                )}
              </g>
            ))}
            {markers.cities.map((c, i) => (
              <circle key={`city-${i}-${c.name}`} cx={c.x} cy={c.y} r={1.5} fill="rgba(125,211,252,0.6)" />
            ))}
          </g>
        )}

        {/* Route arc (world/overview leg) */}
        {showRoute && geom && !zoomedIn && (
          <g>
            <path d={geom.arcPath} fill="none" stroke="#7C3AED" strokeWidth={10} strokeLinecap="round" opacity={0.08} />
            <path d={geom.arcPath} fill="none" stroke="#9333EA" strokeWidth={4} strokeLinecap="round" opacity={0.22} />
            <path d={geom.arcPath} fill="none" stroke="#A855F7" strokeWidth={1.8} strokeDasharray="10 5" strokeLinecap="round" className="map-route-dash" />
          </g>
        )}

        {/* Real city-by-city trail (only before entering — long-haul legs) */}
        {showRoute && geom && !zoomedIn && geom.pathXY.length >= 2 && (
          <g>
            <path d={geom.fullPathD} fill="none" stroke="#A855F7" strokeWidth={1.6} strokeDasharray="7 5" strokeLinecap="round" opacity={0.4} className="map-route-dash" />
            {geom.traveledD && (
              <path d={geom.traveledD} fill="none" stroke="#10b981" strokeWidth={2.4} strokeLinecap="round" opacity={0.85} />
            )}
          </g>
        )}

        {/* Local delivery leg: gateway → real intermediate cities → delivery */}
        {showRoute && zoomedIn && localLeg?.hasLeg && (
          <g>
            <path d={localLeg.fullD} fill="none" stroke="#A855F7" strokeWidth={2} strokeDasharray="6 4" strokeLinecap="round" opacity={0.45} className="map-route-dash" />
            {localLeg.traveledD && (
              <path d={localLeg.traveledD} fill="none" stroke="#10b981" strokeWidth={3} strokeLinecap="round" opacity={0.9} />
            )}
          </g>
        )}

        {/* Origin marker */}
        {showRoute && geom && !zoomedIn && (
          <g transform={`translate(${geom.fromXY[0]}, ${geom.fromXY[1]})`}>
            <circle r={16} fill="rgba(16,185,129,0.14)" className="map-marker-ring" />
            <circle r={7} fill="rgba(16,185,129,0.9)" />
            <circle r={3} fill="white" />
            <text x={0} y={-20} textAnchor="middle" fill="#d1fae5" fontSize={10} fontWeight={700}>{model.originCity}</text>
          </g>
        )}

        {/* Destination / delivery pinpoint */}
        {showRoute && geom && (
          <g transform={`translate(${geom.toXY[0]}, ${geom.toXY[1]})`}>
            <circle r={16} fill="rgba(124,58,237,0.18)" className="map-marker-ring-delay" />
            <circle r={16} fill="rgba(124,58,237,0.09)" className="map-marker-ring" />
            {/* teardrop pinpoint */}
            <path d="M0,6 C-7,-3 -6,-12 0,-14 C6,-12 7,-3 0,6 Z" fill="#7C3AED" stroke="white" strokeWidth={1} />
            <circle cx={0} cy={-8} r={2.6} fill="white" />
            <text x={0} y={-20} textAnchor="middle" fill="#ede9fe" fontSize={11} fontWeight={800}>{model.destCity}</text>
            {zoomedIn && model.deliveryLocality && model.deliveryLocality !== model.destCity && (
              <text x={0} y={18} textAnchor="middle" fill="rgba(214,230,246,0.85)" fontSize={8} fontWeight={600}>{model.deliveryLocality}</text>
            )}
          </g>
        )}

        {/* Vehicle — long-haul (overview) */}
        {showRoute && geom && !zoomedIn && (
          <g transform={`translate(${geom.vehicleXY[0]}, ${geom.vehicleXY[1]}) rotate(${geom.angle})`}>
            <circle r={11} fill="rgba(124,58,237,0.35)" stroke="#A855F7" strokeWidth={1} />
            <g transform="scale(0.58)">
              {serviceType === 'AIR' && <AirVehicle />}
              {serviceType === 'SEA' && <SeaVehicle />}
              {serviceType === 'D2D' && <TruckVehicle />}
            </g>
          </g>
        )}

        {/* Vehicle — final delivery leg (final-mile courier approaching the door) */}
        {showRoute && zoomedIn && localLeg && (
          <g transform={`translate(${localLeg.vehicle[0]}, ${localLeg.vehicle[1]}) rotate(${localLeg.angle})`}>
            <circle r={10} fill="rgba(16,185,129,0.32)" stroke="#10b981" strokeWidth={1} />
            <g transform="scale(0.52)"><TruckVehicle /></g>
          </g>
        )}
      </ComposableMap>

      {/* Entered-country banner */}
      {showRoute && model.entered && (
        <div className="absolute left-3 bottom-3 z-10 hidden sm:block pointer-events-none">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(11,31,58,0.85)', border: '1px solid rgba(124,58,237,0.4)', backdropFilter: 'blur(10px)' }}
          >
            <span className="w-2 h-2 rounded-full bg-[#A855F7] animate-pulse" />
            <p className="text-white/80 text-[11px] font-semibold">
              Arrived in {model.destName} — final delivery to {model.destCity}
            </p>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {state === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(7,20,39,0.75)' }}>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-2 border-[#7C3AED]/25 border-t-[#A855F7] animate-spin mx-auto mb-3" />
            <p className="text-white/50 text-sm">Locating shipment…</p>
          </div>
        </div>
      )}

      {/* Empty / not found overlay hint */}
      {(state === 'empty' || state === 'notfound' || state === 'error') && (
        <div className="absolute inset-x-3 bottom-4 z-10 hidden justify-center pointer-events-none sm:inset-x-6 sm:flex lg:bottom-16">
          <div
            className="flex max-w-[min(100%,28rem)] items-center gap-3 px-4 py-3 rounded-2xl sm:px-5"
            style={{ background: 'rgba(11,31,58,0.82)', border: '1px solid rgba(124,58,237,0.3)', backdropFilter: 'blur(12px)' }}
          >
            <div className="w-2 h-2 rounded-full bg-[#7C3AED]/60 animate-pulse" />
            <p className="text-white/55 text-xs leading-snug">Route visualisation appears once a shipment is tracked</p>
          </div>
        </div>
      )}
    </div>
  )
}
