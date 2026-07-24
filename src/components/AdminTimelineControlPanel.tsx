'use client'

import { useMemo, useState } from 'react'
import type { StoredWaybill, TrackingEventRecord } from '@/lib/types'
import {
  applyStageJump,
  computeRuntimeTrackingState,
  isTerminalStatus,
  normalizeTrackingEvents,
} from '@/lib/trackingAutomation'
import {
  getWaybillByNumber,
  getWaybillErrorMessage,
  normalizeWaybillLookupInput,
  updateWaybillTimeline,
} from '@/services/waybillService'

// ── Professional hold reason presets ──────────────────────────────────────────
const HOLD_REASON_PRESETS = [
  'Customs Examination — Goods Selected for Physical Inspection',
  'Import Documentation Hold — Supporting Documents Required',
  'Immigration Review — Entry Eligibility Under Assessment',
  'Security Screening — Cargo Selected for Enhanced Inspection',
  'Duty & Tax Assessment — Import Charges Being Calculated',
  'Quarantine Inspection — Agricultural / Health Clearance Required',
  'Regulatory Compliance Hold — Licensing or Permits Verification',
  'Prohibited Items Review — Contents Under Regulatory Assessment',
  'Port / Terminal Congestion — Awaiting Berth or Yard Availability',
  'Weather Disruption — Operations Temporarily Suspended',
  'Flight / Vessel Cancellation — Alternative Routing Arranged',
  'Payment Hold — Outstanding Charges Require Settlement',
  'Incorrect Declaration — Shipper Clarification Required',
  'Missing Airway Bill / Bill of Lading — Documentation Not Received',
  'Consignee Unavailable — Delivery Appointment Required',
] as const

interface EditableTimelineEvent extends TrackingEventRecord {
  id: string
}

function toInputDateTime(value: string): string {
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return ''
  const date = new Date(parsed)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function fromInputDateTime(value: string, fallback: string): string {
  const parsed = Date.parse(value)
  if (!value || Number.isNaN(parsed)) return fallback
  return new Date(parsed).toISOString()
}

function formatHoldDuration(ms: number): string {
  if (ms < 60_000) return 'less than a minute'
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)} min`
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)} hr`
  return `${Math.round(ms / 86_400_000)} day${Math.round(ms / 86_400_000) !== 1 ? 's' : ''}`
}

function makeEditableEvents(events: TrackingEventRecord[]): EditableTimelineEvent[] {
  return normalizeTrackingEvents(events).map((event, index) => ({
    ...event,
    id: `evt-${Date.now().toString(36)}-${index}-${Math.random().toString(36).slice(2, 7)}`,
  }))
}

function toPersistedEvents(events: EditableTimelineEvent[]): TrackingEventRecord[] {
  return events.map((event) => ({
    status: event.status.trim() || 'Status Update',
    location: event.location.trim() || 'Unknown Location',
    description: event.description.trim() || 'No description provided.',
    eventTime: event.eventTime,
    isHold: Boolean(event.isHold),
    holdReason: event.isHold ? (event.holdReason?.trim() || undefined) : undefined,
    // Preserve map coordinates so editing a timeline never breaks the route trail.
    ...(typeof event.lat === 'number' ? { lat: event.lat } : {}),
    ...(typeof event.lng === 'number' ? { lng: event.lng } : {}),
  }))
}

function stateLabel(index: number, activeIndex: number, isOnHold: boolean): 'Completed' | 'Current' | 'Upcoming' | 'On Hold' {
  if (activeIndex < 0) return 'Upcoming'
  if (index < activeIndex) return 'Completed'
  if (index === activeIndex) return isOnHold ? 'On Hold' : 'Current'
  return 'Upcoming'
}

function stateClasses(label: ReturnType<typeof stateLabel>): string {
  if (label === 'Completed') return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200'
  if (label === 'Current') return 'border-lime-300/50 bg-lime-400/10 text-lime-100'
  if (label === 'On Hold') return 'border-amber-300/60 bg-amber-400/10 text-amber-100'
  return 'border-slate-400/30 bg-[#122a43] text-slate-200'
}

export function AdminTimelineControlPanel() {
  const [lookupValue, setLookupValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastLookupAttempt, setLastLookupAttempt] = useState('')
  const [loadedWaybill, setLoadedWaybill] = useState<StoredWaybill | null>(null)
  const [events, setEvents] = useState<EditableTimelineEvent[]>([])
  const [jumpIndex, setJumpIndex] = useState(0)

  const runtime = useMemo(() => computeRuntimeTrackingState(events), [events])
  const hasLoadedWaybill = loadedWaybill !== null
  const safeJumpIndex = Math.min(Math.max(jumpIndex, 0), Math.max(events.length - 1, 0))
  const holdMissingReason = events.some((event) => event.isHold && !(event.holdReason ?? '').trim())

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadWaybill = async (rawValue: string) => {
    const query = normalizeWaybillLookupInput(rawValue)
    if (!query) {
      setError('Enter a waybill number to load timeline control.')
      return
    }
    setLastLookupAttempt(query)
    setIsLoading(true)
    setFeedback(null)
    setError(null)
    try {
      const waybill = await getWaybillByNumber(query)
      if (!waybill) {
        setLoadedWaybill(null)
        setEvents([])
        setError(`No waybill found for "${query}".`)
        return
      }
      const sourceEvents =
        Array.isArray(waybill.trackingEvents) && waybill.trackingEvents.length > 0
          ? waybill.trackingEvents
          : [
              {
                status: waybill.currentStatus || 'Shipment Created',
                location: waybill.currentLocation || waybill.origin || 'Origin Facility',
                description: 'Initial tracking event created from waybill status.',
                eventTime: waybill.createdAt || new Date().toISOString(),
                isHold: Boolean(waybill.timelineOnHold),
                holdReason: waybill.timelineOnHold ? '' : undefined,
              },
            ]
      setLoadedWaybill(waybill)
      setLookupValue(waybill.waybillNumber || query)
      setEvents(makeEditableEvents(sourceEvents))
      setJumpIndex(Math.max(computeRuntimeTrackingState(sourceEvents).activeEventIndex, 0))
      setFeedback(`Loaded waybill ${waybill.waybillNumber}. You can now control its timeline.`)
    } catch (loadError) {
      console.error(loadError)
      setLoadedWaybill(null)
      setEvents([])
      setError(getWaybillErrorMessage(loadError, 'waybill lookup'))
    } finally {
      setIsLoading(false)
    }
  }

  // ── Event editing ──────────────────────────────────────────────────────────

  const updateEvent = (id: string, field: 'status' | 'location' | 'description' | 'eventTime' | 'holdReason', value: string) => {
    setEvents((prev) =>
      prev.map((event) => {
        if (event.id !== id) return event
        if (field === 'eventTime') return { ...event, eventTime: fromInputDateTime(value, event.eventTime) }
        return { ...event, [field]: value }
      })
    )
  }

  // Apply hold: mark event + clear future holds so only one hold is active
  const applyHold = (id: string, reason = '') => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id
          ? { ...event, isHold: true, holdReason: reason }
          : { ...event, isHold: false, holdReason: undefined }
      )
    )
  }

  // Release hold only — future event times stay as-is
  const releaseHold = (id: string) => {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === id ? { ...event, isHold: false, holdReason: undefined } : event
      )
    )
  }

  // Release hold AND shift all subsequent events forward by hold duration (now − holdEventTime)
  const releaseAndReschedule = (id: string) => {
    setEvents((prev) => {
      const idx = prev.findIndex((e) => e.id === id)
      if (idx < 0) return prev
      const holdMs = Date.parse(prev[idx].eventTime)
      const shiftMs = Number.isNaN(holdMs) ? 0 : Math.max(0, Date.now() - holdMs)
      return prev.map((event, i) => {
        if (i < idx) return event
        if (i === idx) return { ...event, isHold: false, holdReason: undefined }
        // Shift future events forward
        const t = Date.parse(event.eventTime)
        return {
          ...event,
          eventTime: Number.isNaN(t) ? event.eventTime : new Date(t + shiftMs).toISOString(),
        }
      })
    })
  }

  const clearAllHolds = () => {
    setEvents((prev) => prev.map((event) => ({ ...event, isHold: false, holdReason: undefined })))
  }

  // ── Move the shipment to any stage ─────────────────────────────────────────
  // Stamps the chosen stage "now", back-dates earlier stages and reschedules
  // later ones with their original spacing, so tracking keeps advancing.
  const jumpToStage = (index: number) => {
    const target = events[index]
    if (!target) return
    const jumped = applyStageJump(toPersistedEvents(events), index)
    setEvents(makeEditableEvents(jumped))
    setJumpIndex(Math.min(index, Math.max(jumped.length - 1, 0)))
    setError(null)
    setFeedback(
      isTerminalStatus(target.status)
        ? `Shipment moved to "${target.status}". The timeline is now complete and will not advance further. Save to publish.`
        : `Shipment moved to "${target.status}". Remaining stages were rescheduled and will continue automatically. Save to publish.`
    )
  }

  // Pause at whatever stage is currently live.
  const pauseNow = () => {
    const index = runtime.activeEventIndex >= 0 ? runtime.activeEventIndex : 0
    const target = events[index]
    if (!target) return
    applyHold(target.id, '')
    setError(null)
    setFeedback(`Timeline paused at "${target.status}". Select a hold reason below — it is required before saving.`)
  }

  const addEventAfter = (index: number) => {
    setEvents((prev) => {
      const reference = prev[index]
      const baseTime = Date.parse(reference?.eventTime || '')
      const safeTime = Number.isNaN(baseTime) ? Date.now() : baseTime
      const newEvent: EditableTimelineEvent = {
        id: `evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        status: 'Manual Update',
        location: reference?.location || loadedWaybill?.destination || 'Destination Facility',
        description: 'Manual milestone inserted by admin.',
        eventTime: new Date(safeTime + 3 * 60 * 60 * 1000).toISOString(),
        isHold: false,
      }
      const next = [...prev]
      next.splice(index + 1, 0, newEvent)
      return next
    })
  }

  const removeEvent = (id: string) => {
    setEvents((prev) => (prev.length <= 1 ? prev : prev.filter((event) => event.id !== id)))
  }

  const moveEvent = (index: number, direction: -1 | 1) => {
    setEvents((prev) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= prev.length) return prev
      const next = [...prev]
      const [event] = next.splice(index, 1)
      next.splice(nextIndex, 0, event)
      return next
    })
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!loadedWaybill) return
    if (events.length === 0) {
      setError('Timeline must have at least one event before saving.')
      return
    }
    if (holdMissingReason) {
      setError('A paused stage needs a hold reason before saving — customers see this on the tracking page.')
      return
    }
    setIsSaving(true)
    setFeedback(null)
    setError(null)
    try {
      const updated = await updateWaybillTimeline(loadedWaybill.waybillNumber, toPersistedEvents(events))
      if (!updated) {
        setError('Waybill could not be updated. Please reload and try again.')
        return
      }
      setLoadedWaybill(updated)
      setEvents(makeEditableEvents(updated.trackingEvents || []))
      setFeedback(`Timeline saved for ${updated.waybillNumber}. Changes are now live on the tracking portal.`)
    } catch (saveError) {
      console.error(saveError)
      setError(getWaybillErrorMessage(saveError, 'timeline save'))
    } finally {
      setIsSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <section className="mt-8 rounded-2xl border border-white/15 bg-white/5 p-4 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Timeline Control</h3>
          <p className="text-xs text-white/60">
            Load a waybill, edit milestones, apply holds with reasons, then save. Changes reflect live on the tracking portal.
          </p>
        </div>
      </div>

      {/* Lookup */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={lookupValue}
          onChange={(e) => setLookupValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void loadWaybill(lookupValue) }}
          placeholder="Enter waybill number to load"
          className="logistics-input-control flex-1 px-4 py-3"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={() => void loadWaybill(lookupValue)}
          disabled={isLoading}
          className="admin-action-secondary rounded-xl px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? 'Loading…' : 'Load Waybill'}
        </button>
      </div>

      {feedback && <p className="mt-3 text-sm text-emerald-200">{feedback}</p>}
      {error && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-red-200">{error}</p>
          {!isLoading && lastLookupAttempt && !hasLoadedWaybill && (
            <button
              type="button"
              onClick={() => void loadWaybill(lastLookupAttempt)}
              className="rounded-md border border-red-200/50 px-3 py-1 text-xs font-semibold text-red-100 hover:bg-red-500/10"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {hasLoadedWaybill && (
        <div className="mt-6 space-y-4">

          {/* Runtime preview */}
          <div className="rounded-xl border border-white/15 bg-[#0f2740] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7C3AED]">Runtime Preview</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-white lg:grid-cols-4">
              <div>
                <p className="text-xs text-white/50">Current Status</p>
                <p className="mt-0.5 font-semibold">{runtime.currentStatus}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Current Location</p>
                <p className="mt-0.5 font-semibold">{runtime.currentLocation}</p>
              </div>
              <div>
                <p className="text-xs text-white/50">Hold Status</p>
                <p className={`mt-0.5 font-semibold ${runtime.isOnHold ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {runtime.isOnHold ? '⏸ Active Hold' : '▶ Running'}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/50">Progress</p>
                <p className="mt-0.5 font-semibold">
                  {Math.max(runtime.reachedEventIndex + 1, 0)} / {runtime.events.length} milestones reached
                </p>
              </div>
            </div>
            {runtime.isOnHold && runtime.holdReason && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2.5">
                <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" className="mt-0.5 h-4 w-4 shrink-0">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Active Hold Reason</p>
                  <p className="mt-0.5 text-xs font-semibold text-amber-100">{runtime.holdReason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Move shipment to any stage */}
          <div className="rounded-xl border border-[#7C3AED]/35 bg-[#0f2740] p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#7C3AED]">Move Shipment To Stage</p>
            <p className="mt-1 text-xs leading-relaxed text-white/55">
              Jump the shipment to any milestone. Earlier stages are back-dated and later stages are
              rescheduled with their original spacing, so tracking keeps advancing on its own from there.
              Choosing a delivered stage stops the timeline permanently.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <select
                value={safeJumpIndex}
                onChange={(e) => setJumpIndex(Number(e.target.value))}
                className="logistics-input-control flex-1 px-3 py-2 text-sm"
              >
                {events.map((event, index) => (
                  <option key={event.id} value={index}>
                    {index + 1}. {event.status}{isTerminalStatus(event.status) ? '  — stops timeline' : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => jumpToStage(safeJumpIndex)}
                className="admin-action-secondary shrink-0 rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Move to this stage
              </button>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap gap-2">
            {!runtime.isOnHold && (
              <button
                type="button"
                onClick={pauseNow}
                className="rounded-lg border border-amber-300/40 bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 transition-colors"
              >
                ⏸ Pause Timeline Now
              </button>
            )}
            {runtime.isOnHold && (
              <button
                type="button"
                onClick={() => {
                  if (runtime.holdEventIndex >= 0) {
                    const holdEvent = events[runtime.holdEventIndex]
                    if (holdEvent) releaseAndReschedule(holdEvent.id)
                  }
                }}
                className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 transition-colors"
              >
                ▶ Release Hold &amp; Reschedule Timeline
              </button>
            )}
            <button
              type="button"
              onClick={clearAllHolds}
              className="rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Clear All Holds
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="admin-action-primary rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving…' : 'Save Timeline Changes'}
            </button>
            {holdMissingReason && (
              <p className="w-full text-xs font-semibold text-amber-300">
                ⚠ Add a hold reason to the paused stage before saving — customers see it on the tracking page.
              </p>
            )}
          </div>

          {/* Timeline events */}
          <div className="space-y-3">
            {events.map((event, index) => {
              const label = stateLabel(index, runtime.activeEventIndex, runtime.isOnHold)
              const holdDurationMs = event.isHold ? Math.max(0, Date.now() - Date.parse(event.eventTime)) : 0

              return (
                <article key={event.id} className={`rounded-xl border p-3 ${stateClasses(label)}`}>
                  {/* Event header */}
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
                      {event.isHold && (
                        <span className="rounded-full border border-amber-300/50 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-200">
                          ⏸ HOLD ACTIVE
                          {holdDurationMs > 60_000 && ` · ${formatHoldDuration(holdDurationMs)}`}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {/* Hold controls */}
                      {!event.isHold ? (
                        <button
                          type="button"
                          onClick={() => applyHold(event.id, '')}
                          className="rounded-md border border-amber-300/40 bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/20"
                        >
                          ⏸ Apply Hold
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => releaseAndReschedule(event.id)}
                            className="rounded-md border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/20"
                          >
                            ▶ Release &amp; Reschedule
                          </button>
                          <button
                            type="button"
                            onClick={() => releaseHold(event.id)}
                            className="rounded-md border border-white/25 px-2 py-1 text-[11px] font-semibold hover:bg-white/10"
                          >
                            Release Only
                          </button>
                        </>
                      )}

                      {/* Reorder / edit controls */}
                      <button type="button" onClick={() => moveEvent(index, -1)} disabled={index === 0}
                        className="rounded-md border border-white/30 px-2 py-1 text-[11px] font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">
                        ↑
                      </button>
                      <button type="button" onClick={() => moveEvent(index, 1)} disabled={index === events.length - 1}
                        className="rounded-md border border-white/30 px-2 py-1 text-[11px] font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40">
                        ↓
                      </button>
                      <button type="button" onClick={() => addEventAfter(index)}
                        className="rounded-md border border-white/30 px-2 py-1 text-[11px] font-semibold hover:bg-white/10">
                        + Add Below
                      </button>
                      <button type="button" onClick={() => removeEvent(event.id)} disabled={events.length <= 1}
                        className="rounded-md border border-red-300/40 px-2 py-1 text-[11px] font-semibold text-red-100 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40">
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Hold reason picker — shown only when hold is active on this event */}
                  {event.isHold && (
                    <div className="mb-3 rounded-lg border border-amber-300/30 bg-amber-500/8 p-3">
                      <label className="mb-1.5 block text-xs font-bold text-amber-200 uppercase tracking-wide">
                        Hold Reason <span className="text-amber-300/60 font-normal normal-case">(required for customer visibility)</span>
                      </label>
                      <select
                        value={HOLD_REASON_PRESETS.includes(event.holdReason as typeof HOLD_REASON_PRESETS[number]) ? event.holdReason : '__custom__'}
                        onChange={(e) => {
                          if (e.target.value !== '__custom__') updateEvent(event.id, 'holdReason', e.target.value)
                          else updateEvent(event.id, 'holdReason', '')
                        }}
                        className="logistics-input-control w-full px-3 py-2 text-sm"
                      >
                        <option value="">— Select a reason —</option>
                        {HOLD_REASON_PRESETS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                        <option value="__custom__">Custom reason…</option>
                      </select>
                      {/* Custom reason input */}
                      {event.holdReason !== undefined && !HOLD_REASON_PRESETS.includes(event.holdReason as typeof HOLD_REASON_PRESETS[number]) && event.holdReason !== '' && (
                        <input
                          type="text"
                          value={event.holdReason}
                          onChange={(e) => updateEvent(event.id, 'holdReason', e.target.value)}
                          placeholder="Describe the hold reason…"
                          className="logistics-input-control mt-2 w-full px-3 py-2 text-sm"
                        />
                      )}
                      {(!event.holdReason || event.holdReason === '') && (
                        <input
                          type="text"
                          value={event.holdReason ?? ''}
                          onChange={(e) => updateEvent(event.id, 'holdReason', e.target.value)}
                          placeholder="Describe the hold reason…"
                          className="logistics-input-control mt-2 w-full px-3 py-2 text-sm"
                        />
                      )}
                    </div>
                  )}

                  {/* Event fields */}
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/70">Status Label</label>
                      <input type="text" value={event.status}
                        onChange={(e) => updateEvent(event.id, 'status', e.target.value)}
                        className="logistics-input-control w-full px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/70">Location</label>
                      <input type="text" value={event.location}
                        onChange={(e) => updateEvent(event.id, 'location', e.target.value)}
                        className="logistics-input-control w-full px-3 py-2 text-sm" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="mb-1 block text-xs font-medium text-white/70">Description</label>
                      <textarea value={event.description}
                        onChange={(e) => updateEvent(event.id, 'description', e.target.value)}
                        rows={2} className="logistics-input-control w-full resize-none px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-white/70">Timestamp</label>
                      <input type="datetime-local" value={toInputDateTime(event.eventTime)}
                        onChange={(e) => updateEvent(event.id, 'eventTime', e.target.value)}
                        className="logistics-input-control w-full px-3 py-2 text-sm" />
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminTimelineControlPanel
