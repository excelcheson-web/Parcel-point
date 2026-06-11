'use client'

import { Suspense, useCallback, useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import { COMPANY_CONTACT } from '@/lib/constants'
import type { StoredWaybill } from '@/lib/types'
import { getWaybillByNumber, getWaybillErrorMessage, normalizeWaybillLookupInput } from '@/services/waybillService'
import type { MapServiceType } from './DashboardMap'

const DashboardMap = dynamic(() => import('./DashboardMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center" style={{ background: '#071427' }}>
      <div className="w-10 h-10 rounded-full border-2 border-[#7C3AED]/20 border-t-[#A855F7] animate-spin" />
    </div>
  ),
})

const LOADING_DELAY_MS = 700
type TrackingViewState = 'empty' | 'loading' | 'notfound' | 'error' | 'success'

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function detectServiceType(waybill: StoredWaybill): MapServiceType {
  const num = (waybill.waybillNumber ?? waybill.trackingNumber ?? '').toUpperCase()
  if (num.includes('AWB') || num.includes('-AW-')) return 'AIR'
  if (num.includes('SWB') || num.includes('-SW-')) return 'SEA'
  if (num.includes('D2D') || num.includes('DTD') || num.includes('D-2-D')) return 'D2D'
  const tm = waybill.transportMode
  if (tm === 'AIR') return 'AIR'
  if (tm === 'SEA') return 'SEA'
  if (tm === 'DOOR_TO_DOOR') return 'D2D'
  return 'AIR'
}

const STATUS_STEPS = ['Created', 'In Transit', 'Customs', 'Out for Delivery', 'Delivered']

function getStep(status?: string): number {
  const s = (status ?? '').toLowerCase()
  if (s.includes('delivered')) return 4
  if (s.includes('out for delivery')) return 3
  if (s.includes('customs')) return 2
  if (s.includes('transit') || s.includes('arrived') || s.includes('dispatch')) return 1
  return 0
}

function statusStyle(status?: string) {
  const s = (status ?? '').toLowerCase()
  if (s.includes('delivered')) return { bg: 'rgba(16,185,129,0.18)', color: '#10b981' }
  if (s.includes('out for delivery')) return { bg: 'rgba(245,158,11,0.18)', color: '#f59e0b' }
  if (s.includes('hold')) return { bg: 'rgba(239,68,68,0.18)', color: '#ef4444' }
  return { bg: 'rgba(124,58,237,0.18)', color: '#A855F7' }
}

function fmt(val?: string | null): string {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDT(val?: string | null): string {
  if (!val) return '—'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Icons ──────────────────────────────────────────────────────────────────

function PlaneIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" />
    </svg>
  )
}
function ShipIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M2 20h20M5 20L3 12h18L19 20M5 12L8 4h8l3 8M12 4V2" />
    </svg>
  )
}
function TruckIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="1" y="3" width="15" height="13" /><path d="M16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}
function SearchIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  )
}
function ClockIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function GlobeIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
    </svg>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function TrackContent({ initialId }: { initialId: string }) {
  const normalizedInitial = normalizeWaybillLookupInput(initialId)
  const [query, setQuery] = useState(normalizedInitial)
  const [state, setState] = useState<TrackingViewState>('empty')
  const [result, setResult] = useState<StoredWaybill | null>(null)
  const [searchedValue, setSearchedValue] = useState(normalizedInitial)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSearch = useCallback(async (value: string, skipDelay = false) => {
    const norm = normalizeWaybillLookupInput(value)
    if (!norm) {
      setState('empty')
      setResult(null)
      setErrorMessage(null)
      setSearchedValue('')
      return
    }
    setSearchedValue(norm)
    setState('loading')
    setResult(null)
    setErrorMessage(null)

    // Update URL to clean /track/{id} format without triggering navigation
    if (typeof window !== 'undefined') {
      const targetPath = '/track/' + encodeURIComponent(norm)
      if (window.location.pathname !== targetPath) {
        window.history.pushState(null, '', targetPath)
      }
    }

    if (!skipDelay) await wait(LOADING_DELAY_MS)
    try {
      const found = await getWaybillByNumber(norm)
      if (found) {
        setResult(found)
        setState('success')
      } else {
        setState('notfound')
      }
    } catch (err) {
      console.error(err)
      setErrorMessage(getWaybillErrorMessage(err, 'tracking lookup'))
      setState('error')
    }
  }, [])

  // Auto-submit when initialId is provided (direct URL visit)
  useEffect(() => {
    if (!normalizedInitial) return
    const timer = window.setTimeout(() => {
      void handleSearch(normalizedInitial, true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [normalizedInitial, handleSearch])

  const serviceType = useMemo<MapServiceType>(
    () => (result ? detectServiceType(result) : 'AIR'),
    [result],
  )

  const step = result ? getStep(result.currentStatus) : 0
  const sstyle = statusStyle(result?.currentStatus)
  const sortedEvents = useMemo(
    () => [...(result?.trackingEvents ?? [])].sort((a, b) => new Date(b.eventTime).getTime() - new Date(a.eventTime).getTime()),
    [result],
  )

  const whatsappHref = `https://wa.me/${COMPANY_CONTACT.whatsapp}`

  return (
    <div
      className="flex flex-col min-h-screen lg:h-screen lg:overflow-hidden bg-[#071427]"
      style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif' }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header
        className="shrink-0 px-4 sm:px-6 py-3 z-50 sticky top-0"
        style={{
          background: 'rgba(7,20,39,0.96)',
          borderBottom: '1px solid rgba(124,58,237,0.22)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden" style={{ boxShadow: '0 0 12px rgba(124,58,237,0.35)' }}>
              <Image src="/parcel-point-logo.png" alt="Parcel Point" fill className="object-cover" sizes="36px" priority />
            </div>
            <span className="text-lg font-bold text-white hidden sm:block tracking-tight">Parcel Point</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            <Link href="/" className="nav-link text-sm">Home</Link>
            <Link href="/about" className="nav-link text-sm">About</Link>
            <Link href="/services" className="nav-link text-sm">Services</Link>
            <Link href="/track" className="nav-link text-sm" style={{ background: 'rgba(124,58,237,0.2)', borderColor: 'rgba(124,58,237,0.45)' }}>Track</Link>
            <Link href="/contact" className="nav-link text-sm">Contact</Link>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-white/50 text-xs font-semibold">Tracking Service Online</span>
            </div>
            <Link href="/" className="glass-button px-3 py-1.5 text-sm text-white hidden sm:inline-flex items-center gap-1">
              <span>←</span> <span>Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── MAIN SPLIT ──────────────────────────────────────────────────────── */}
      <main className="flex flex-col lg:flex-row flex-1 lg:overflow-hidden lg:min-h-0">

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <aside
          className="w-full lg:w-96 xl:w-[420px] shrink-0 flex flex-col gap-3.5 p-4 lg:p-5 overflow-y-auto"
          style={{ borderRight: '1px solid rgba(124,58,237,0.16)', background: 'rgba(7,20,39,0.99)' }}
        >

          {/* SEARCH CARD */}
          <div
            className="rounded-2xl p-4 shrink-0"
            style={{ background: 'rgba(11,31,58,0.95)', border: '1px solid rgba(124,58,237,0.28)' }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.2)' }}>
                <SearchIcon className="w-3.5 h-3.5 text-[#A855F7]" />
              </div>
              <h1 className="text-white text-sm font-bold tracking-tight">Track Shipment</h1>
            </div>
            <p className="text-white/40 text-[11px] leading-relaxed mb-3 pl-9">
              Track shipments across air, sea, and door-to-door freight within the Parcel Point network.
            </p>

            {/* Search input row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void handleSearch(query) }}
                placeholder="e.g. PP-AWB-1234-2026"
                className="flex-1 px-3.5 py-2.5 rounded-xl text-white text-sm outline-none min-w-0 placeholder:text-white/30"
                style={{
                  background: 'rgba(7,20,39,0.95)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.65)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)' }}
              />
              <button
                onClick={() => void handleSearch(query)}
                disabled={state === 'loading'}
                className="shrink-0 px-4 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-all hover:scale-[1.03] active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}
              >
                {state === 'loading' ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" opacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : 'Track'}
              </button>
            </div>
            <p className="mt-2 text-white/25 text-[10px]">PP-AWB · PP-SWB · PP-D2D format</p>
          </div>

          {/* ── SUCCESS: SHIPMENT STATUS ── */}
          {state === 'success' && result && (
            <div
              className="rounded-2xl p-4 dashboard-fade-up"
              style={{ background: 'rgba(11,31,58,0.95)', border: '1px solid rgba(124,58,237,0.22)' }}
            >
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wide"
                  style={{ background: sstyle.bg, color: sstyle.color }}
                >
                  {result.currentStatus ?? 'Unknown Status'}
                </span>
                <span className="text-white/30 text-[10px] font-mono tracking-wider">{result.waybillNumber}</span>
              </div>

              {/* Current location */}
              <div className="mb-4 px-0.5">
                <p className="text-white/40 text-[10px] uppercase tracking-widest mb-0.5">Last confirmed location</p>
                <p className="text-white text-sm font-semibold leading-snug">
                  {result.currentLocation ?? result.destination ?? '—'}
                </p>
              </div>

              {/* 5-step progress bar */}
              <div className="relative flex items-center mb-7">
                {STATUS_STEPS.map((label, i) => (
                  <div key={i} className="flex-1 flex items-center">
                    <div className="flex flex-col items-center relative">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500"
                        style={{
                          background: i <= step ? 'linear-gradient(135deg, #7C3AED, #5B21B6)' : 'rgba(255,255,255,0.07)',
                          border: i === step ? '2px solid #A855F7' : '2px solid transparent',
                          boxShadow: i === step ? '0 0 10px rgba(168,85,247,0.55)' : 'none',
                        }}
                      >
                        {i < step ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" className="w-2.5 h-2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : i === step ? (
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        )}
                      </div>
                      <span
                        className="absolute top-6 text-[8.5px] font-semibold whitespace-nowrap text-center leading-none"
                        style={{ color: i <= step ? '#A855F7' : 'rgba(255,255,255,0.25)' }}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className="flex-1 h-px mx-0.5 transition-all duration-700"
                        style={{ background: i < step ? '#7C3AED' : 'rgba(255,255,255,0.1)' }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* ETA */}
              {(result.estimatedDeliveryDate ?? result.estimatedArrivalDate) && (
                <div
                  className="flex items-center justify-between text-xs px-3 py-2 rounded-xl mb-3"
                  style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.18)' }}
                >
                  <span className="text-white/45 flex items-center gap-1.5">
                    <ClockIcon className="w-3 h-3 text-[#A855F7]" /> Est. Delivery
                  </span>
                  <span className="text-[#A855F7] font-bold">{fmt(result.estimatedDeliveryDate ?? result.estimatedArrivalDate)}</span>
                </div>
              )}

              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  ['Mode', result.transportMode?.replace(/_/g, ' ') ?? serviceType],
                  ['Service', serviceType === 'AIR' ? 'Airway Bill' : serviceType === 'SEA' ? 'Seaway Bill' : 'Door to Door'],
                  ['Origin', result.origin ?? result.portOfDeparture ?? '—'],
                  ['Destination', result.destination ?? result.portOfDestination ?? '—'],
                  ['Shipper', result.senderName ?? result.shipperName ?? '—'],
                  ['Receiver', result.receiverName ?? result.consigneeName ?? '—'],
                  ['Weight', result.totalWeight ? `${result.totalWeight} kg` : result.weight ? `${result.weight} kg` : '—'],
                  ['Booked', fmt(result.bookingDate ?? result.dateOfIssue ?? result.createdAt)],
                ] as [string, string][]).map(([label, value]) => (
                  <div
                    key={label}
                    className="px-2.5 py-1.5 rounded-xl"
                    style={{ background: 'rgba(7,20,39,0.8)', border: '1px solid rgba(255,255,255,0.055)' }}
                  >
                    <p className="text-[9px] uppercase tracking-wide text-white/35 mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-white/85 leading-snug truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SUCCESS: SERVICE TYPE CARDS ── */}
          {state === 'success' && result && (
            <div className="shrink-0 dashboard-fade-up" style={{ animationDelay: '60ms' }}>
              <p className="text-white/30 text-[9px] uppercase tracking-widest mb-2 pl-1">Service Type</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: 'AIR' as MapServiceType, abbr: 'AWB', label: 'Airway Bill', Icon: PlaneIcon },
                  { id: 'SEA' as MapServiceType, abbr: 'SWB', label: 'Seaway Bill', Icon: ShipIcon },
                  { id: 'D2D' as MapServiceType, abbr: 'D2D', label: 'Door to Door', Icon: TruckIcon },
                ]).map(t => {
                  const active = serviceType === t.id
                  return (
                    <div
                      key={t.id}
                      className="rounded-xl p-3 text-center transition-all duration-300"
                      style={{
                        background: active ? 'rgba(124,58,237,0.2)' : 'rgba(11,31,58,0.8)',
                        border: `1px solid ${active ? 'rgba(124,58,237,0.55)' : 'rgba(255,255,255,0.07)'}`,
                        boxShadow: active ? '0 0 16px rgba(124,58,237,0.22)' : 'none',
                      }}
                    >
                      <div className="flex justify-center mb-1.5" style={{ color: active ? '#A855F7' : 'rgba(255,255,255,0.3)' }}>
                        <t.Icon className="w-5 h-5" />
                      </div>
                      <p className="text-white text-[11px] font-bold mb-0.5">{t.abbr}</p>
                      <p className="text-[9px] leading-tight" style={{ color: active ? 'rgba(168,85,247,0.7)' : 'rgba(255,255,255,0.3)' }}>{t.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── NOT FOUND ── */}
          {state === 'notfound' && (
            <div
              className="rounded-2xl p-5 text-center dashboard-fade-up"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)' }}
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-white/80 text-sm font-semibold mb-1">Tracking number not found.</p>
              <p className="text-white/40 text-xs leading-relaxed mb-4">
                <span className="text-white/60 font-mono">{searchedValue}</span> does not match any shipment in our records. Please check the number and try again.
              </p>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[#25D366] text-xs font-bold transition-all hover:scale-105"
                style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)' }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
                Ask Support on WhatsApp
              </a>
            </div>
          )}

          {/* ── ERROR ── */}
          {state === 'error' && (
            <div
              className="rounded-2xl p-5 text-center dashboard-fade-up"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)' }}
            >
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-5 h-5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <p className="text-white/80 text-sm font-semibold mb-1">Tracking number not found.</p>
              <p className="text-white/40 text-xs leading-relaxed mb-4">
                We could not find a shipment matching <span className="text-white/60 font-mono">{searchedValue}</span>. Please verify the tracking number and try again. If you believe this is an error, contact Parcel Point Logistics support.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => void handleSearch(searchedValue, true)}
                  className="text-xs font-bold px-4 py-2 rounded-xl text-white transition-all hover:scale-105"
                  style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.4)' }}
                >
                  Try Again
                </button>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl text-[#25D366] transition-all hover:scale-105"
                  style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)' }}
                >
                  Contact Support
                </a>
              </div>
            </div>
          )}

          {/* ── EMPTY: HOW IT WORKS ── */}
          {state === 'empty' && (
            <div className="space-y-3 mt-1">
              <p className="text-white/28 text-[9px] uppercase tracking-widest pl-1">Quick guide</p>
              {[
                { n: '1', t: 'Enter your waybill number', d: 'Paste or type your PP tracking number in the field above.' },
                { n: '2', t: 'Search our records', d: 'We look up your shipment in the Parcel Point logistics network.' },
                { n: '3', t: 'View full route details', d: 'See the route on the map, milestones, and estimated delivery date.' },
              ].map(item => (
                <div
                  key={item.n}
                  className="flex gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(11,31,58,0.65)', border: '1px solid rgba(255,255,255,0.055)' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-[#A855F7] shrink-0"
                    style={{ background: 'rgba(124,58,237,0.18)' }}
                  >
                    {item.n}
                  </div>
                  <div>
                    <p className="text-white text-xs font-semibold mb-0.5">{item.t}</p>
                    <p className="text-white/40 text-[11px] leading-relaxed">{item.d}</p>
                  </div>
                </div>
              ))}

              {/* Support block */}
              <div
                className="rounded-xl p-4 mt-1"
                style={{ background: 'rgba(124,58,237,0.09)', border: '1px solid rgba(124,58,237,0.2)' }}
              >
                <p className="text-white/65 text-xs font-semibold mb-1">Need assistance?</p>
                <p className="text-white/35 text-[11px] leading-relaxed mb-3">
                  If your waybill doesn&apos;t appear, our team can look it up directly.
                </p>
                <div className="flex gap-2">
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[#25D366] text-xs font-bold"
                    style={{ background: 'rgba(37,211,102,0.09)', border: '1px solid rgba(37,211,102,0.22)' }}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                    WhatsApp
                  </a>
                  <Link
                    href="/contact"
                    className="flex-1 flex items-center justify-center py-2 rounded-xl text-white/55 text-xs font-semibold"
                    style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid rgba(255,255,255,0.09)' }}
                  >
                    Contact Us
                  </Link>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ── RIGHT PANEL: MAP ─────────────────────────────────────────────── */}
        <div className="flex-1 relative min-h-72 lg:min-h-0 overflow-hidden">

          {/* Map fills entire right panel */}
          <DashboardMap waybill={result} state={state} serviceType={serviceType} />

          {/* Map / Satellite toggle + controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
            {/* View toggle */}
            <div
              className="flex rounded-xl overflow-hidden text-[11px] font-bold"
              style={{ border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(11,31,58,0.8)', backdropFilter: 'blur(12px)' }}
            >
              <button
                className="px-3 py-1.5 transition-colors"
                style={{ background: 'rgba(124,58,237,0.3)', color: '#A855F7' }}
              >
                Map
              </button>
              <button
                className="px-3 py-1.5 transition-colors text-white/35 hover:text-white/60"
              >
                Satellite
              </button>
            </div>
            {/* Zoom & fullscreen */}
            {['+', '−', '⊠'].map(sym => (
              <button
                key={sym}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-sm font-bold text-white/50 transition-all hover:text-white hover:scale-110"
                style={{ background: 'rgba(11,31,58,0.75)', border: '1px solid rgba(124,58,237,0.18)', backdropFilter: 'blur(12px)' }}
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Location popup — top-left overlay */}
          {state === 'success' && result && (
            <div className="absolute top-4 left-4 pointer-events-none z-20 dashboard-fade-up" style={{ animationDelay: '100ms' }}>
              <div
                className="px-3.5 py-2.5 rounded-2xl"
                style={{
                  background: 'rgba(11,31,58,0.9)',
                  border: '1px solid rgba(124,58,237,0.35)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                  maxWidth: '210px',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#A855F7]">Last Known Location</span>
                </div>
                <p className="text-white text-sm font-semibold leading-snug truncate">
                  {result.currentLocation ?? result.destination ?? 'In Transit'}
                </p>
                <p className="text-white/35 text-[10px] mt-0.5">Last confirmed location</p>
              </div>
            </div>
          )}

          {/* Bottom overlay: Journey timeline + Route card */}
          {state === 'success' && result && (
            <div
              className="absolute bottom-0 left-0 right-0 flex gap-3 p-4 z-20 dashboard-fade-up"
              style={{ animationDelay: '180ms' }}
            >
              {/* Journey Timeline */}
              <div
                className="flex-1 min-w-0 rounded-2xl p-4 pointer-events-auto"
                style={{
                  background: 'rgba(11,31,58,0.92)',
                  border: '1px solid rgba(124,58,237,0.22)',
                  backdropFilter: 'blur(18px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  maxWidth: '56%',
                }}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <ClockIcon className="w-3.5 h-3.5 text-[#A855F7] shrink-0" />
                  <span className="text-white text-[11px] font-bold uppercase tracking-wide">Shipment Journey</span>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                  {sortedEvents.length > 0 ? sortedEvents.slice(0, 6).map((ev, i) => (
                    <div key={i} className="flex gap-2.5">
                      <div className="flex flex-col items-center shrink-0">
                        <div
                          className="w-2 h-2 rounded-full mt-0.5 shrink-0"
                          style={{ background: i === 0 ? '#A855F7' : 'rgba(255,255,255,0.2)', boxShadow: i === 0 ? '0 0 6px rgba(168,85,247,0.5)' : 'none' }}
                        />
                        {i < Math.min(sortedEvents.length - 1, 5) && (
                          <div className="w-px mt-0.5 bg-white/10 flex-1" style={{ minHeight: '10px' }} />
                        )}
                      </div>
                      <div className="pb-1 min-w-0">
                        <p className="text-xs font-semibold leading-snug" style={{ color: i === 0 ? 'white' : 'rgba(255,255,255,0.5)' }}>
                          {ev.status}
                          {ev.isHold && <span className="ml-1.5 text-amber-400 text-[9px] font-bold">⏸ HOLD</span>}
                        </p>
                        <p className="text-[10px] text-white/30 truncate">{ev.location} · {fmtDT(ev.eventTime)}</p>
                        {ev.isHold && ev.holdReason && (
                          <p className="mt-0.5 text-[10px] font-medium text-amber-300/80 leading-snug truncate">{ev.holdReason}</p>
                        )}
                      </div>
                    </div>
                  )) : (
                    <p className="text-white/30 text-[11px]">No timeline events recorded yet.</p>
                  )}
                </div>
              </div>

              {/* Route Card */}
              <div
                className="shrink-0 rounded-2xl p-4 pointer-events-auto flex flex-col"
                style={{
                  background: 'rgba(11,31,58,0.92)',
                  border: '1px solid rgba(124,58,237,0.22)',
                  backdropFilter: 'blur(18px)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  width: '190px',
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <GlobeIcon className="w-3.5 h-3.5 text-[#A855F7] shrink-0" />
                  <span className="text-white text-[11px] font-bold uppercase tracking-wide">Route</span>
                </div>

                {/* Origin */}
                <div className="flex gap-2 mb-2">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-0.5" />
                    <div className="w-px flex-1 bg-[#7C3AED]/30 my-0.5" style={{ minHeight: '18px' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-wide text-white/30">Origin</p>
                    <p className="text-white text-[11px] font-semibold leading-snug truncate">
                      {result.origin ?? result.portOfDeparture ?? '—'}
                    </p>
                  </div>
                </div>

                {/* Service label */}
                <div className="ml-3 mb-2">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold text-[#A855F7]"
                    style={{ background: 'rgba(124,58,237,0.14)' }}
                  >
                    {serviceType === 'AIR' && <PlaneIcon className="w-3 h-3" />}
                    {serviceType === 'SEA' && <ShipIcon className="w-3 h-3" />}
                    {serviceType === 'D2D' && <TruckIcon className="w-3 h-3" />}
                    {serviceType}
                  </span>
                </div>

                {/* Destination */}
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#7C3AED] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[9px] uppercase tracking-wide text-white/30">Destination</p>
                    <p className="text-white text-[11px] font-semibold leading-snug truncate">
                      {result.destination ?? result.portOfDestination ?? '—'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => { void navigator.clipboard?.writeText(result.waybillNumber) }}
                  className="mt-auto pt-3 w-full py-1.5 rounded-xl text-[11px] font-semibold text-[#A855F7] transition-all hover:text-white active:scale-95"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.28)' }}
                >
                  Copy Tracking No.
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── TRUST FOOTER ─────────────────────────────────────────────────────── */}
      <footer
        className="shrink-0 px-4 sm:px-6 py-4"
        style={{ borderTop: '1px solid rgba(124,58,237,0.18)', background: 'rgba(7,20,39,0.98)' }}
      >
        <div className="max-w-6xl mx-auto space-y-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/35">
            <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
              <Image src="/parcel-point-logo.png" alt="Parcel Point Logistics" width={22} height={22} className="rounded-md opacity-60" />
              <div>
                <span className="font-semibold text-white/55">Parcel Point Logistics</span>
                <span className="mx-2 opacity-40">·</span>
                <span>Parcel Point House, 42 Harbor Avenue, London, United Kingdom</span>
                <span className="mx-2 opacity-40">·</span>
                <a href="mailto:hello@parcelpoint.com" className="text-[#A855F7]/70 hover:text-[#A855F7] transition-colors">hello@parcelpoint.com</a>
              </div>
            </div>
            <nav className="flex items-center gap-4 shrink-0">
              <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
              <Link href="/cookies" className="hover:text-white/60 transition-colors">Cookies</Link>
              <Link href="/contact" className="hover:text-white/60 transition-colors">Contact &amp; Support</Link>
            </nav>
          </div>
          <p className="text-center sm:text-left text-[10px] text-white/20">
            &copy; {new Date().getFullYear()} Parcel Point Logistics. All rights reserved. &mdash; IATA Agent Code PPX-42710
          </p>
          <p className="text-center sm:text-left text-[10px] text-white/25 mt-1">
            Tracking information is provided based on shipment records available within the Parcel Point logistics network.
          </p>
        </div>
      </footer>
    </div>
  )
}

export function TrackPageFallback() {
  return (
    <div
      className="flex flex-col min-h-screen bg-[#071427]"
      style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif' }}
    >
      <header
        className="px-4 sm:px-6 py-3 sticky top-0 z-50"
        style={{ background: 'rgba(7,20,39,0.96)', borderBottom: '1px solid rgba(124,58,237,0.22)', backdropFilter: 'blur(20px)' }}
      >
        <Link href="/" className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden">
            <Image src="/parcel-point-logo.png" alt="Parcel Point" fill className="object-cover" sizes="36px" priority />
          </div>
          <span className="text-lg font-bold text-white hidden sm:block">Parcel Point</span>
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-[#7C3AED]/25 border-t-[#A855F7] animate-spin mx-auto mb-3" />
          <p className="text-white/45 text-sm">Loading tracking…</p>
        </div>
      </div>
    </div>
  )
}
