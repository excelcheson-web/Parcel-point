import type { StoredWaybill, TrackingEventRecord } from '@/lib/types'

export interface RuntimeTrackingState {
  events: TrackingEventRecord[]
  activeEventIndex: number
  reachedEventIndex: number
  holdEventIndex: number
  isOnHold: boolean
  holdReason: string
  currentStatus: string
  currentLocation: string
}

function normalizeEventTime(eventTime: string, fallbackTime: string): string {
  const parsed = Date.parse(eventTime || '')
  if (Number.isNaN(parsed)) return fallbackTime
  return new Date(parsed).toISOString()
}

export function normalizeTrackingEvents(events: TrackingEventRecord[], fallbackLocation = 'Origin Facility'): TrackingEventRecord[] {
  const now = new Date().toISOString()
  const unique = new Map<string, TrackingEventRecord>()

  events.forEach((event, index) => {
    const normalized: TrackingEventRecord = {
      status: (event.status || 'Status Update').trim() || 'Status Update',
      location: (event.location || fallbackLocation).trim() || fallbackLocation,
      description: (event.description || 'No description provided.').trim() || 'No description provided.',
      eventTime: normalizeEventTime(event.eventTime, now),
      isHold: Boolean(event.isHold),
      holdReason: event.isHold ? (event.holdReason?.trim() || undefined) : undefined,
    }

    const key = `${normalized.status}|${normalized.location}|${normalized.description}|${normalized.eventTime}|${normalized.isHold ? '1' : '0'}|${index}`
    unique.set(key, normalized)
  })

  return Array.from(unique.values()).sort((a, b) => Date.parse(a.eventTime) - Date.parse(b.eventTime))
}

export function computeRuntimeTrackingState(events: TrackingEventRecord[], now: Date = new Date()): RuntimeTrackingState {
  const normalized = normalizeTrackingEvents(events)
  if (normalized.length === 0) {
    return {
      events: [],
      activeEventIndex: -1,
      reachedEventIndex: -1,
      holdEventIndex: -1,
      isOnHold: false,
      holdReason: '',
      currentStatus: 'Shipment Created',
      currentLocation: 'Origin Facility',
    }
  }

  const nowMs = now.getTime()
  let reachedEventIndex = -1
  normalized.forEach((event, index) => {
    if (Date.parse(event.eventTime) <= nowMs) {
      reachedEventIndex = index
    }
  })

  const holdEventIndex = normalized.findIndex((event) => event.isHold)
  const hasReachedAny = reachedEventIndex >= 0
  let activeEventIndex = hasReachedAny ? reachedEventIndex : 0
  let isOnHold = false

  if (holdEventIndex >= 0 && reachedEventIndex >= holdEventIndex) {
    activeEventIndex = holdEventIndex
    isOnHold = true
  }

  const activeEvent = normalized[activeEventIndex] || normalized[0]
  const baseStatus = activeEvent?.status || 'Shipment Created'
  const holdEvent = holdEventIndex >= 0 ? normalized[holdEventIndex] : null
  const holdReason = (isOnHold && holdEvent?.holdReason) ? holdEvent.holdReason : ''

  return {
    events: normalized,
    activeEventIndex,
    reachedEventIndex,
    holdEventIndex,
    isOnHold,
    holdReason,
    currentStatus: isOnHold ? `${baseStatus} (On Hold)` : baseStatus,
    currentLocation: activeEvent?.location || 'Origin Facility',
  }
}

export function applyRuntimeToWaybill(waybill: StoredWaybill, now: Date = new Date()): StoredWaybill {
  const fallbackLocation = waybill.origin || waybill.portOfDeparture || 'Origin Facility'
  const runtime = computeRuntimeTrackingState(
    normalizeTrackingEvents(Array.isArray(waybill.trackingEvents) ? waybill.trackingEvents : [], fallbackLocation),
    now
  )

  const deliveredReached =
    runtime.activeEventIndex >= 0 &&
    runtime.activeEventIndex === runtime.events.length - 1 &&
    !runtime.isOnHold &&
    runtime.currentStatus.toLowerCase().includes('delivered')

  return {
    ...waybill,
    trackingEvents: runtime.events,
    currentStatus: runtime.currentStatus,
    currentLocation: runtime.currentLocation,
    timelineOnHold: runtime.isOnHold,
    ...(deliveredReached && { deliveredDate: runtime.events[runtime.activeEventIndex].eventTime }),
  }
}

