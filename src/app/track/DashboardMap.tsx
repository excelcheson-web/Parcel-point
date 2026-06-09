'use client'

import { useMemo } from 'react'
import { ComposableMap, Geographies, Geography } from 'react-simple-maps'
import type { StoredWaybill } from '@/lib/types'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
const MAP_W = 800
const MAP_H = 500
const PROJ_SCALE = 147
const PROJ_CENTER_LAT = 15

// [longitude, latitude] lookup by city/location keyword
const CITY_COORDS: Record<string, [number, number]> = {
  // Africa
  'casablanca': [-7.59, 33.57], 'morocco': [-7.09, 31.79],
  'nairobi': [36.82, -1.29], 'kenya': [36.82, -1.29],
  'cairo': [31.24, 30.04], 'egypt': [30.80, 26.82],
  'johannesburg': [28.05, -26.20], 'cape town': [18.42, -33.92], 'south africa': [25.0, -29.0],
  'accra': [-0.19, 5.60], 'ghana': [-1.02, 7.95],
  'kigali': [30.06, -1.94], 'rwanda': [29.87, -1.94],
  'kinshasa': [15.27, -4.44], 'dar es salaam': [39.21, -6.79],
  'addis ababa': [38.75, 9.15], 'ethiopia': [40.49, 9.15],
  'dakar': [-17.44, 14.72], 'senegal': [-14.45, 14.50],
  'lusaka': [28.28, -15.42], 'zambia': [27.85, -13.13],
  'harare': [31.05, -17.83], 'zimbabwe': [29.15, -20.00],
  'kampala': [32.58, 0.32], 'uganda': [32.29, 1.37],
  'mombasa': [39.67, -4.05], 'entebbe': [32.45, 0.05],
  'douala': [9.70, 4.05], 'cameroon': [12.35, 5.72],
  // Europe
  'london': [-0.13, 51.51], 'heathrow': [-0.45, 51.47],
  'paris': [2.35, 48.86], 'cdg': [2.55, 49.01],
  'amsterdam': [4.90, 52.37], 'schiphol': [4.76, 52.31],
  'frankfurt': [8.68, 50.11], 'berlin': [13.41, 52.52],
  'madrid': [-3.70, 40.42], 'rome': [12.50, 41.90],
  'milan': [9.19, 45.47], 'brussels': [4.35, 50.85],
  'zurich': [8.54, 47.38], 'vienna': [16.37, 48.21],
  'stockholm': [18.07, 59.33], 'oslo': [10.75, 59.91],
  'copenhagen': [12.57, 55.68], 'athens': [23.73, 37.98],
  'lisbon': [-9.14, 38.72], 'warsaw': [21.01, 52.23],
  'prague': [14.44, 50.08], 'budapest': [19.04, 47.50],
  'hamburg': [9.99, 53.55], 'rotterdam': [4.48, 51.92],
  'istanbul': [28.98, 41.01], 'turkey': [35.24, 38.96],
  'moscow': [37.62, 55.75], 'russia': [105.32, 61.52],
  // Asia
  'shanghai': [121.47, 31.23], 'beijing': [116.41, 39.90],
  'shenzhen': [114.06, 22.54], 'guangzhou': [113.26, 23.13],
  'hong kong': [114.17, 22.32], 'hongkong': [114.17, 22.32],
  'tokyo': [139.69, 35.69], 'osaka': [135.50, 34.69],
  'singapore': [103.82, 1.35], 'singapore changi': [103.99, 1.36],
  'dubai': [55.27, 25.20], 'abu dhabi': [54.38, 24.45],
  'riyadh': [46.72, 24.71], 'jeddah': [39.19, 21.49],
  'doha': [51.53, 25.29], 'kuwait': [47.98, 29.38],
  'muscat': [58.59, 23.59], 'bahrain': [50.56, 26.22],
  'mumbai': [72.88, 19.08], 'delhi': [77.10, 28.70],
  'bangalore': [77.59, 12.97], 'chennai': [80.27, 13.08],
  'kolkata': [88.36, 22.57], 'hyderabad': [78.49, 17.39],
  'karachi': [67.01, 24.86], 'lahore': [74.36, 31.52],
  'dhaka': [90.41, 23.81], 'colombo': [79.86, 6.93],
  'bangkok': [100.50, 13.76], 'jakarta': [106.83, -6.21],
  'kuala lumpur': [101.69, 3.14], 'manila': [120.98, 14.60],
  'ho chi minh': [106.63, 10.82], 'hanoi': [105.83, 21.03],
  'seoul': [126.98, 37.57], 'taipei': [121.57, 25.03],
  'guangdong': [113.26, 23.13], 'china': [104.19, 35.86],
  'india': [78.96, 20.59], 'pakistan': [69.35, 30.38],
  'uae': [53.85, 23.42], 'saudi arabia': [45.08, 23.89],
  // Americas
  'new york': [-74.01, 40.71], 'jfk': [-73.78, 40.64],
  'los angeles': [-118.24, 34.05], 'lax': [-118.41, 33.94],
  'chicago': [-87.63, 41.88], 'houston': [-95.37, 29.76],
  'miami': [-80.19, 25.76], 'atlanta': [-84.39, 33.75],
  'dallas': [-96.80, 32.78], 'seattle': [-122.33, 47.61],
  'san francisco': [-122.42, 37.77], 'washington': [-77.04, 38.91],
  'boston': [-71.06, 42.36], 'toronto': [-79.38, 43.65],
  'montreal': [-73.57, 45.50], 'vancouver': [-123.12, 49.28],
  'mexico city': [-99.13, 19.43], 'sao paulo': [-46.63, -23.55],
  'rio de janeiro': [-43.17, -22.91], 'buenos aires': [-58.38, -34.60],
  'bogota': [-74.07, 4.71], 'lima': [-77.04, -12.05],
  'santiago': [-70.67, -33.45], 'usa': [-98.58, 39.83],
  'canada': [-96.80, 56.13], 'brazil': [-51.93, -14.24],
  // Oceania
  'sydney': [151.21, -33.87], 'melbourne': [144.96, -37.81],
  'brisbane': [153.03, -27.47], 'perth': [115.86, -31.95],
  'auckland': [174.76, -36.85], 'australia': [133.78, -25.27],
}

function getCoords(location: string): [number, number] | null {
  if (!location) return null
  const norm = location.toLowerCase().replace(/[,]/g, ' ').replace(/\s+/g, ' ').trim()
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (norm.includes(key)) return coords
  }
  return null
}

// Manual Mercator projection matching react-simple-maps defaults
// scale=147, center=[0, PROJ_CENTER_LAT], translate=[MAP_W/2, MAP_H/2]
function project(lng: number, lat: number): [number, number] {
  const PI = Math.PI
  const rl = lng * PI / 180
  const rp = lat * PI / 180
  const rc = PROJ_CENTER_LAT * PI / 180
  const x = PROJ_SCALE * rl
  const y = -PROJ_SCALE * (Math.log(Math.tan(PI / 4 + rp / 2)) - Math.log(Math.tan(PI / 4 + rc / 2)))
  return [MAP_W / 2 + x, MAP_H / 2 + y]
}

function bezierPt(t: number, p0: [number, number], p1: [number, number], p2: [number, number]): [number, number] {
  const u = 1 - t
  return [u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]
}

function statusToProgress(status?: string): number {
  const s = (status ?? '').toLowerCase()
  if (s.includes('delivered')) return 0.97
  if (s.includes('out for delivery')) return 0.84
  if (s.includes('customs')) return 0.63
  if (s.includes('transit') || s.includes('arrived') || s.includes('dispatch')) return 0.44
  return 0.08
}

export type MapServiceType = 'AIR' | 'SEA' | 'D2D'

export interface DashboardMapProps {
  waybill?: StoredWaybill | null
  state: 'empty' | 'loading' | 'notfound' | 'error' | 'success'
  serviceType?: MapServiceType
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

export default function DashboardMap({ waybill, state, serviceType = 'AIR' }: DashboardMapProps) {
  const routeData = useMemo(() => {
    if (!waybill) return null
    const origin = waybill.origin ?? waybill.portOfDeparture ?? ''
    const dest = waybill.destination ?? waybill.portOfDestination ?? ''
    const originC = getCoords(origin)
    const destC = getCoords(dest)
    if (!originC || !destC) return null

    const fromXY = project(originC[0], originC[1])
    const toXY = project(destC[0], destC[1])
    const dx = toXY[0] - fromXY[0]
    const dy = toXY[1] - fromXY[1]
    const dist = Math.sqrt(dx * dx + dy * dy)
    const midX = (fromXY[0] + toXY[0]) / 2
    const midY = (fromXY[1] + toXY[1]) / 2 - dist * 0.28
    const ctrl: [number, number] = [midX, midY]
    const arcPath = `M ${fromXY[0]},${fromXY[1]} Q ${midX},${midY} ${toXY[0]},${toXY[1]}`
    const progress = statusToProgress(waybill.currentStatus)
    const vehicleXY = bezierPt(progress, fromXY, ctrl, toXY)

    // Rotation angle along bezier tangent
    const t = progress
    const tx = 2 * (1 - t) * (ctrl[0] - fromXY[0]) + 2 * t * (toXY[0] - ctrl[0])
    const ty = 2 * (1 - t) * (ctrl[1] - fromXY[1]) + 2 * t * (toXY[1] - ctrl[1])
    const angle = Math.atan2(ty, tx) * (180 / Math.PI)

    return { fromXY, toXY, arcPath, vehicleXY, angle, origin, dest }
  }, [waybill])

  return (
    <div className="relative w-full h-full" style={{ background: '#071427' }}>
      <ComposableMap
        width={MAP_W}
        height={MAP_H}
        style={{ width: '100%', height: '100%' }}
        projectionConfig={{ scale: PROJ_SCALE, center: [0, PROJ_CENTER_LAT] as [number, number] }}
      >
        <defs>
          <radialGradient id="mapBgGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(124,58,237,0.07)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <pattern id="mapDotGrid" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="15" cy="15" r="0.7" fill="rgba(124,58,237,0.18)" />
          </pattern>
        </defs>

        {/* Dot-grid atmosphere */}
        <rect width={MAP_W} height={MAP_H} fill="url(#mapDotGrid)" />
        <rect width={MAP_W} height={MAP_H} fill="url(#mapBgGlow)" />

        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="#0c1d32"
                stroke="rgba(124,58,237,0.22)"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover: { fill: '#0f2540', outline: 'none' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        {/* Route arc */}
        {routeData && (
          <g>
            {/* Outer glow */}
            <path d={routeData.arcPath} fill="none" stroke="#7C3AED" strokeWidth={10} strokeLinecap="round" opacity={0.08} />
            <path d={routeData.arcPath} fill="none" stroke="#9333EA" strokeWidth={4} strokeLinecap="round" opacity={0.22} />
            {/* Animated dashes */}
            <path
              d={routeData.arcPath}
              fill="none"
              stroke="#A855F7"
              strokeWidth={1.8}
              strokeDasharray="10 5"
              strokeLinecap="round"
              className="map-route-dash"
            />
          </g>
        )}

        {/* Origin marker — green */}
        {routeData && (
          <g transform={`translate(${routeData.fromXY[0]}, ${routeData.fromXY[1]})`}>
            <circle r={16} fill="rgba(16,185,129,0.14)" className="map-marker-ring" />
            <circle r={16} fill="rgba(16,185,129,0.07)" className="map-marker-ring-delay" />
            <circle r={7} fill="rgba(16,185,129,0.9)" />
            <circle r={3} fill="white" />
          </g>
        )}

        {/* Destination marker — purple */}
        {routeData && (
          <g transform={`translate(${routeData.toXY[0]}, ${routeData.toXY[1]})`}>
            <circle r={16} fill="rgba(124,58,237,0.18)" className="map-marker-ring-delay" />
            <circle r={16} fill="rgba(124,58,237,0.09)" className="map-marker-ring" />
            <circle r={7} fill="rgba(124,58,237,0.95)" />
            <circle r={3} fill="white" />
          </g>
        )}

        {/* Vehicle icon */}
        {routeData && (
          <g transform={`translate(${routeData.vehicleXY[0]}, ${routeData.vehicleXY[1]}) rotate(${routeData.angle})`}>
            <circle r={11} fill="rgba(124,58,237,0.35)" stroke="#A855F7" strokeWidth={1} />
            <g transform="scale(0.58)">
              {serviceType === 'AIR' && <AirVehicle />}
              {serviceType === 'SEA' && <SeaVehicle />}
              {serviceType === 'D2D' && <TruckVehicle />}
            </g>
          </g>
        )}
      </ComposableMap>

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
        <div className="absolute inset-0 flex items-end justify-center pb-16 pointer-events-none">
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl"
            style={{ background: 'rgba(11,31,58,0.82)', border: '1px solid rgba(124,58,237,0.3)', backdropFilter: 'blur(12px)' }}
          >
            <div className="w-2 h-2 rounded-full bg-[#7C3AED]/60 animate-pulse" />
            <p className="text-white/55 text-xs">Route visualisation appears once a shipment is tracked</p>
          </div>
        </div>
      )}
    </div>
  )
}
