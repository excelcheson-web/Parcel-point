'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  loadCountryGeo,
  hasGeoDetail,
  getGeoIndexEntry,
  type GeoCountry,
  type GeoProvince,
} from '@/lib/geo/geoData'

export interface PickedLocation {
  countryCode: string
  countryName: string
  province?: string
  provinceCode?: string
  city?: string
  lat?: number
  lng?: number
  hasDetail: boolean
}

interface CountryOption {
  code: string
  name: string
  city: string
  airport: string
}

interface LocationPickerProps {
  label: string
  countries: readonly CountryOption[]
  value: PickedLocation
  onChange: (loc: PickedLocation) => void
  accent?: string
}

// ── Lightweight searchable combobox ──────────────────────────────────────────
// Renders at most MAX_VISIBLE options regardless of list size, so a 16k-city
// list never puts more than a few dozen nodes in the DOM. Selection uses
// onMouseDown to beat the input blur race.
const MAX_VISIBLE = 60

interface ComboItem {
  key: string
  label: string
  sub?: string
}

function SearchSelect({
  placeholder,
  items,
  selectedLabel,
  onSelect,
  disabled,
  emptyHint,
}: {
  placeholder: string
  items: ComboItem[]
  selectedLabel?: string
  onSelect: (key: string) => void
  disabled?: boolean
  emptyHint?: string
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.slice(0, MAX_VISIBLE)
    const out: ComboItem[] = []
    for (const it of items) {
      if (it.label.toLowerCase().includes(q) || (it.sub && it.sub.toLowerCase().includes(q))) {
        out.push(it)
        if (out.length >= MAX_VISIBLE) break
      }
    }
    return out
  }, [items, query])

  const totalMatches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items.length
    let n = 0
    for (const it of items) {
      if (it.label.toLowerCase().includes(q) || (it.sub && it.sub.toLowerCase().includes(q))) n++
    }
    return n
  }, [items, query])

  const showText = focused ? query : selectedLabel ?? ''

  return (
    <div ref={wrapRef} className="relative">
      <input
        type="text"
        value={showText}
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => { setFocused(true); setOpen(true); setQuery('') }}
        onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 120) }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white font-semibold placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition disabled:opacity-40 disabled:cursor-not-allowed"
        autoComplete="off"
      />
      {open && !disabled && (
        <div
          className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-white/20 shadow-2xl"
          style={{ background: '#0b1f3a', backdropFilter: 'blur(6px)' }}
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-white/50">{emptyHint ?? 'No matches'}</div>
          ) : (
            <>
              {filtered.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); onSelect(it.key); setOpen(false); setFocused(false) }}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm text-white/85 hover:bg-white/10"
                >
                  <span className="truncate">{it.label}</span>
                  {it.sub && <span className="shrink-0 text-[11px] text-white/40">{it.sub}</span>}
                </button>
              ))}
              {totalMatches > filtered.length && (
                <div className="px-4 py-2 text-[11px] text-white/40">
                  +{totalMatches - filtered.length} more — keep typing to narrow
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Location picker ──────────────────────────────────────────────────────────

export function LocationPicker({ label, countries, value, onChange, accent = '#7C3AED' }: LocationPickerProps) {
  // Single source of truth for loaded geo, tagged with the country it belongs to.
  // Derived `geo`/`loading` avoid synchronous setState inside the effect.
  const [loaded, setLoaded] = useState<{ code: string; geo: GeoCountry | null } | null>(null)

  const detail = hasGeoDetail(value.countryCode)

  // Lazy-load the selected country's province/city data (cached in geoData).
  useEffect(() => {
    if (!detail) return
    const code = value.countryCode
    let alive = true
    loadCountryGeo(code).then((data) => { if (alive) setLoaded({ code, geo: data }) })
    return () => { alive = false }
  }, [value.countryCode, detail])

  const geo = detail && loaded && loaded.code === value.countryCode ? loaded.geo : null
  const loading = detail && (!loaded || loaded.code !== value.countryCode)

  const selectedProvince: GeoProvince | undefined = useMemo(() => {
    if (!geo || !value.province) return undefined
    return geo.provinces.find((p) => p.name === value.province)
  }, [geo, value.province])

  const provinceItems: ComboItem[] = useMemo(() => {
    if (!geo) return []
    return geo.provinces.map((p) => ({ key: p.name, label: p.name, sub: `${p.cities.length} cities` }))
  }, [geo])

  const cityItems: ComboItem[] = useMemo(() => {
    if (!geo) return []
    if (selectedProvince) return selectedProvince.cities.map((c) => ({ key: c.name, label: c.name }))
    // No province chosen yet: allow searching every city, tagged with its province.
    const out: ComboItem[] = []
    for (const p of geo.provinces) {
      for (const c of p.cities) out.push({ key: `${p.name}::${c.name}`, label: c.name, sub: p.name })
    }
    return out
  }, [geo, selectedProvince])

  function emitCountry(code: string) {
    const c = countries.find((x) => x.code === code)
    if (!c) return
    const idx = getGeoIndexEntry(code)
    onChange({
      countryCode: code,
      countryName: c.name,
      province: undefined,
      provinceCode: undefined,
      city: undefined,
      lat: idx?.lat,
      lng: idx?.lng,
      hasDetail: hasGeoDetail(code),
    })
  }

  function emitProvince(provinceName: string) {
    const c = countries.find((x) => x.code === value.countryCode)
    const p = geo?.provinces.find((x) => x.name === provinceName)
    onChange({
      countryCode: value.countryCode,
      countryName: c?.name ?? value.countryName,
      province: provinceName,
      provinceCode: p?.code,
      city: undefined,
      lat: p?.lat ?? value.lat,
      lng: p?.lng ?? value.lng,
      hasDetail: true,
    })
  }

  function emitCity(key: string) {
    const c = countries.find((x) => x.code === value.countryCode)
    let provinceName = value.province
    let cityName = key
    if (key.includes('::')) {
      const [pn, cn] = key.split('::')
      provinceName = pn
      cityName = cn
    }
    const province = geo?.provinces.find((x) => x.name === provinceName)
    const city = province?.cities.find((x) => x.name === cityName)
    onChange({
      countryCode: value.countryCode,
      countryName: c?.name ?? value.countryName,
      province: provinceName,
      provinceCode: province?.code,
      city: cityName,
      lat: city?.lat ?? province?.lat ?? value.lat,
      lng: city?.lng ?? province?.lng ?? value.lng,
      hasDetail: true,
    })
  }

  const sortedCountries = useMemo(
    () => [...countries].sort((a, b) => a.name.localeCompare(b.name)),
    [countries],
  )

  return (
    <div className="p-3 bg-white/10 rounded-lg border border-white/20 space-y-2.5">
      <label className="block text-sm font-medium text-white/80">{label}</label>

      {/* Country */}
      <select
        value={value.countryCode}
        onChange={(e) => emitCountry(e.target.value)}
        className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white font-semibold focus:outline-none focus:ring-2 focus:ring-[#7C3AED] transition"
      >
        {sortedCountries.map((c) => (
          <option key={c.code} value={c.code} className="text-gray-900">
            {c.name}{hasGeoDetail(c.code) ? '  •  provinces & cities' : ''}
          </option>
        ))}
      </select>

      {detail ? (
        <div className="grid grid-cols-1 gap-2.5">
          <SearchSelect
            placeholder={loading ? 'Loading provinces…' : 'Search province / state…'}
            items={provinceItems}
            selectedLabel={value.province}
            onSelect={emitProvince}
            disabled={loading || !geo}
            emptyHint="No province found"
          />
          <SearchSelect
            placeholder={
              loading ? 'Loading cities…' : selectedProvince ? 'Search city / municipality…' : 'Search any city (or pick a province first)…'
            }
            items={cityItems}
            selectedLabel={value.city}
            onSelect={emitCity}
            disabled={loading || !geo}
            emptyHint="No city found"
          />
        </div>
      ) : (
        <p className="text-xs text-white/40">
          City-level selection isn&apos;t available for this country yet — the shipment routes to the country hub.
        </p>
      )}

      {/* Selection summary */}
      <p className="text-xs text-white/50">
        Destination:{' '}
        <span style={{ color: accent }} className="font-semibold">
          {[value.city, value.province, value.countryName].filter(Boolean).join(', ')}
        </span>
      </p>
    </div>
  )
}

export default LocationPicker
