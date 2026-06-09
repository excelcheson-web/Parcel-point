import React from 'react'
import { normalizeWaybill } from '@/lib/waybillNormalization'
import { computeRuntimeTrackingState } from '@/lib/trackingAutomation'
import type { StoredWaybill } from '@/lib/types'
import { TrackingTimeline, type TrackingEvent } from './TrackingTimeline'
import { ShipmentRouteMap } from './ShipmentRouteMap'

interface TrackingResultProps {
  waybill: StoredWaybill
  layout?: 'horizontal' | 'vertical'
}

function statusBadgeClass(status: string): string {
  const value = status.toLowerCase()
  if (value.includes('hold')) return 'bg-amber-500/20 text-amber-100 border-amber-300/60'
  if (value.includes('deliver')) return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/60'
  if (value.includes('out for delivery')) return 'bg-amber-500/20 text-amber-200 border-amber-300/60'
  if (value.includes('transit') || value.includes('dispatch') || value.includes('arrived')) {
    return 'bg-lime-500/20 text-lime-100 border-lime-300/60'
  }
  return 'bg-slate-500/20 text-slate-200 border-slate-400/60'
}

function formatDateValue(value: string): string {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return value

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed)
}

function Field({ label, value }: { label: string; value: string | number | null }) {
  const display = value === null || value === '' ? 'Not available' : String(value)
  return (
    <div className="logistics-card-soft tracking-lift px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[#87a3c2]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#e2ebf7] break-words">{display}</p>
    </div>
  )
}

function PartyCard({
  title,
  name,
  phone,
  address,
}: {
  title: string
  name: string
  phone: string
  address: string
}) {
  return (
    <article className="logistics-card-soft tracking-lift p-4">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <div className="mt-3 space-y-2 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#87a3c2]">Name</p>
          <p className="text-[#e2ebf7]">{name}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#87a3c2]">Phone</p>
          <p className="text-[#e2ebf7]">{phone}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-[#87a3c2]">Address</p>
          <p className="text-[#e2ebf7]">{address}</p>
        </div>
      </div>
    </article>
  )
}

export const TrackingResult: React.FC<TrackingResultProps> = ({ waybill, layout = 'horizontal' }) => {
  if (!waybill) return null

  const data = normalizeWaybill(waybill)
  const runtime = computeRuntimeTrackingState(data.trackingEvents)
  const runtimeEvents = runtime.events as TrackingEvent[]
  const activeEvent = runtime.activeEventIndex >= 0 ? runtime.events[runtime.activeEventIndex] : null
  const currentStatus = runtime.currentStatus || data.currentStatus
  const currentLocation = runtime.currentLocation || data.currentLocation
  const transportCodeLabel = data.shipmentMode.toUpperCase().includes('SEA') ? 'SCAC Code' : 'IATA / Carrier Code'
  const wrapClass = layout === 'vertical' ? 'grid grid-cols-1 gap-6' : 'grid grid-cols-1 xl:grid-cols-12 gap-6'
  const leftClass = layout === 'vertical' ? '' : 'xl:col-span-7'
  const rightClass = layout === 'vertical' ? '' : 'xl:col-span-5'

  return (
    <section className={`${wrapClass} tracking-section-gap`}>
      <div className={`space-y-6 ${leftClass}`}>
        <article className="logistics-card tracking-grid-overlay p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="logistics-muted text-xs uppercase tracking-[0.2em]">Shipment Summary</p>
              <h2 className="logistics-title mt-2 text-xl">Tracking {data.trackingNumber}</h2>
              <p className="logistics-subtitle mt-1 text-sm">
                {data.origin} to {data.destination}
              </p>
            </div>

            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusBadgeClass(currentStatus)}`}>
              {currentStatus}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Waybill Number" value={data.waybillNumber} />
            <Field label="Current Location" value={currentLocation} />
            <Field label="Booked On" value={formatDateValue(data.bookingDate)} />
            <Field label="Estimated Delivery" value={formatDateValue(data.estimatedDeliveryDate)} />
          </div>

          <div className="mt-5 rounded-xl border border-lime-300/30 bg-lime-400/10 p-4">
            <p className="text-xs uppercase tracking-wide text-lime-200">Current Status Highlight</p>
            <p className="mt-1 text-sm font-semibold text-white">{activeEvent?.status || currentStatus}</p>
            <p className="text-sm text-[#d7e4f6]">{activeEvent?.location || currentLocation}</p>
            <p className="mt-1 text-xs text-[#b8cae1]">
              {activeEvent ? formatDateValue(activeEvent.eventTime) : formatDateValue(data.lastUpdated)}
            </p>
          </div>
        </article>

        <TrackingTimeline events={runtimeEvents} activeEventIndex={runtime.activeEventIndex} isOnHold={runtime.isOnHold} />
        <ShipmentRouteMap
          origin={data.origin}
          destination={data.destination}
          currentLocation={currentLocation}
          events={runtimeEvents}
          activeEventIndex={runtime.activeEventIndex}
        />
      </div>

      <div className={`space-y-6 ${rightClass}`}>
        <article className="logistics-card tracking-grid-overlay p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-white">Shipment Details</h3>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Shipment Mode" value={data.shipmentMode} />
            <Field label="Service Type" value={data.serviceType} />
            <Field label={transportCodeLabel} value={data.iataCode} />
            <Field label="Carrier Reference" value={data.carrierReference} />
            <Field label="Payment Status" value={data.paymentStatus} />
            <Field label="Last Updated" value={formatDateValue(data.lastUpdated)} />
            <Field label="Description" value={data.parcelDescription} />
            <Field label="Dimensions" value={data.dimensions} />
            <Field label="Weight" value={data.weight} />
            <Field label="Quantity / Pieces" value={data.quantity ?? data.totalPieces} />
          </div>
        </article>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
          <PartyCard title="Sender / Shipper" name={data.senderName} phone={data.senderPhone} address={data.senderAddress} />
          <PartyCard
            title="Consignee / Receiver"
            name={data.receiverName}
            phone={data.receiverPhone}
            address={data.receiverAddress}
          />
        </div>
      </div>
    </section>
  )
}
