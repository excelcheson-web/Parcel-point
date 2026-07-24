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
      ...(typeof event.lat === 'number' && Number.isFinite(event.lat) ? { lat: event.lat } : {}),
      ...(typeof event.lng === 'number' && Number.isFinite(event.lng) ? { lng: event.lng } : {}),
    }

    const key = `${normalized.status}|${normalized.location}|${normalized.description}|${normalized.eventTime}|${normalized.isHold ? '1' : '0'}|${index}`
    unique.set(key, normalized)
  })

  return Array.from(unique.values()).sort((a, b) => Date.parse(a.eventTime) - Date.parse(b.eventTime))
}

/** Terminal stages end the journey — nothing is ever scheduled after them. */
export function isTerminalStatus(status?: string): boolean {
  const s = (status ?? '').toLowerCase()
  return s.includes('delivered') || s.includes('picked up')
}

const DEFAULT_STAGE_GAP_MS = 4 * 60 * 60 * 1000

/**
 * Move a shipment to an arbitrary stage of its timeline.
 *
 * The chosen stage is stamped "now"; earlier stages are back-dated and later
 * stages are scheduled into the future, both preserving the original spacing
 * between milestones — so the shipment keeps advancing on its own from there.
 *
 * Any active hold is cleared (moving it means it is running again). If the
 * chosen stage is terminal (Delivered / Picked Up) nothing is scheduled after
 * it and any later stages are dropped, so the timeline stops immediately.
 */
export function applyStageJump(
  events: TrackingEventRecord[],
  targetIndex: number,
  now: Date = new Date(),
): TrackingEventRecord[] {
  const normalized = normalizeTrackingEvents(events)
  if (normalized.length === 0) return normalized

  const idx = Math.min(Math.max(targetIndex, 0), normalized.length - 1)
  const nowMs = now.getTime()

  // Original spacing between consecutive milestones.
  const gaps = normalized.map((event, i) => {
    if (i === 0) return 0
    const prev = Date.parse(normalized[i - 1].eventTime)
    const current = Date.parse(event.eventTime)
    const delta = current - prev
    return Number.isFinite(delta) && delta > 0 ? delta : DEFAULT_STAGE_GAP_MS
  })

  // Terminal stage => drop anything after it so it can never advance further.
  const list = isTerminalStatus(normalized[idx].status) ? normalized.slice(0, idx + 1) : normalized

  const times = new Array<number>(list.length)
  times[idx] = nowMs
  for (let i = idx - 1; i >= 0; i -= 1) times[i] = times[i + 1] - (gaps[i + 1] || DEFAULT_STAGE_GAP_MS)
  for (let i = idx + 1; i < list.length; i += 1) times[i] = times[i - 1] + (gaps[i] || DEFAULT_STAGE_GAP_MS)

  return list.map((event, i) => ({
    ...event,
    eventTime: new Date(times[i]).toISOString(),
    isHold: false,
    holdReason: undefined,
  }))
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

