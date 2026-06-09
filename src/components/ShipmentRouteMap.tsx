import React from 'react'
import type { TrackingEvent } from './TrackingTimeline'

interface ShipmentRouteMapProps {
  origin: string
  destination: string
  currentLocation: string
  events: TrackingEvent[]
  activeEventIndex?: number
}

function safeLabel(value: string, fallback: string): string {
  const trimmed = (value || '').trim()
  return trimmed || fallback
}

function progressFromEvents(events: TrackingEvent[], activeEventIndex = -1): number {
  if (!events.length) return 0
  if (activeEventIndex < 0) return 0.05
  const maxIndex = Math.max(events.length - 1, 1)
  return Math.min(Math.max(activeEventIndex / maxIndex, 0), 1)
}

export const ShipmentRouteMap: React.FC<ShipmentRouteMapProps> = ({ origin, destination, currentLocation, events, activeEventIndex = -1 }) => {
  const from = safeLabel(origin, 'Origin')
  const to = safeLabel(destination, 'Destination')
  const current = safeLabel(currentLocation, from)
  const progress = progressFromEvents(events, activeEventIndex)
  const dotX = 18 + progress * 64
  const progressPct = Math.round(progress * 100)

  return (
    <section className="logistics-card tracking-grid-overlay p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Shipment Route Map</h3>
        <span className="text-xs text-[#7C3AED]">Live route view</span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-[#3e5e85] bg-[radial-gradient(circle_at_top_right,#123a5f_0%,#0c2339_45%,#08192d_100%)] p-4">
        <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(157,196,0,0.18)_1px,transparent_1px),linear-gradient(to_bottom,rgba(157,196,0,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative z-10">
          <div className="mb-3 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-[#a7bfd8]">
            <span>{from}</span>
            <span>{to}</span>
          </div>

          <div className="relative h-12">
            <div className="absolute left-[8%] right-[8%] top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-[#7C3AED]/40 via-[#7C3AED] to-[#7C3AED]/40" />
            <div className="absolute left-[8%] top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#7C3AED] bg-[#071427]" />
            <div className="absolute right-[8%] top-1/2 h-3 w-3 translate-x-1/2 -translate-y-1/2 rounded-full border border-[#7C3AED] bg-[#071427]" />

            <div
              className="absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-[#071427] bg-[#7C3AED] shadow-[0_0_0_6px_rgba(157,196,0,0.2)]"
              style={{ left: `${dotX}%` }}
              aria-hidden="true"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="rounded-lg border border-[#3e5e85] bg-[#0d2439]/80 px-3 py-2 text-xs text-[#d8e6f6]">
              <span className="text-[#7C3AED]">Current location:</span> {current}
            </div>
            <div className="rounded-lg border border-[#3e5e85] bg-[#0d2439]/80 px-3 py-2 text-xs text-[#d8e6f6]">
              <span className="text-[#7C3AED]">Route progress:</span> {progressPct}%
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ShipmentRouteMap
