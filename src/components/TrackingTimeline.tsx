import React from 'react'

export interface TrackingEvent {
  status: string
  location: string
  description: string
  eventTime: string
  isHold?: boolean
  holdReason?: string
}

interface TrackingTimelineProps {
  events: TrackingEvent[]
  activeEventIndex?: number
  isOnHold?: boolean
}

type TimelineState = 'completed' | 'current' | 'upcoming' | 'hold'

interface TimelineRow extends TrackingEvent {
  key: string
  state: TimelineState
}

function formatTimestamp(eventTime: string): string {
  const parsed = Date.parse(eventTime)
  if (Number.isNaN(parsed)) return 'Pending'

  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(parsed)
}

function getBadgeClasses(state: TimelineState): string {
  if (state === 'completed') return 'bg-emerald-500/20 text-emerald-200 border-emerald-400/50'
  if (state === 'current') return 'bg-lime-400/20 text-lime-200 border-lime-300/60'
  if (state === 'hold') return 'bg-amber-500/20 text-amber-100 border-amber-300/60'
  return 'bg-slate-500/20 text-slate-300 border-slate-400/40'
}

function getNodeClasses(state: TimelineState): string {
  if (state === 'completed') return 'border-emerald-400 bg-emerald-500 text-[#10253f]'
  if (state === 'current') return 'border-lime-300 bg-lime-300 text-[#0e2138] shadow-[0_0_0_4px_rgba(163,230,53,0.15)]'
  if (state === 'hold') return 'border-amber-300 bg-amber-300 text-[#0e2138] shadow-[0_0_0_4px_rgba(251,191,36,0.2)]'
  return 'border-slate-500 bg-[#1b3552] text-slate-300'
}

function getCardClasses(state: TimelineState): string {
  if (state === 'completed') return 'border-emerald-500/40 bg-[#16314b]'
  if (state === 'current') return 'border-lime-300/60 bg-[#1a3755]'
  if (state === 'hold') return 'border-amber-300/60 bg-[#3f341d]'
  return 'border-[#355275] bg-[#132c47]'
}

function buildTimelineRows(events: TrackingEvent[], activeEventIndex = -1, isOnHold = false): TimelineRow[] {
  return events.map((event, index) => {
    let state: TimelineState = 'upcoming'

    if (activeEventIndex >= 0) {
      if (index < activeEventIndex) {
        state = 'completed'
      } else if (index === activeEventIndex) {
        state = isOnHold ? 'hold' : 'current'
      }
    }

    return {
      ...event,
      key: `${event.status}-${event.eventTime}-${index}`,
      state,
    }
  })
}

function timelineTimestampLabel(row: TimelineRow, index: number, totalRows: number): string | null {
  const isFinalMilestone = index === totalRows - 1
  const hasReachedFinalMilestone = row.state === 'current' || row.state === 'completed'
  if (!isFinalMilestone || !hasReachedFinalMilestone) return null
  return formatTimestamp(row.eventTime)
}

export const TrackingTimeline: React.FC<TrackingTimelineProps> = ({ events, activeEventIndex = -1, isOnHold = false }) => {
  const rows = buildTimelineRows(events || [], activeEventIndex, isOnHold)

  return (
    <section className="logistics-card tracking-grid-overlay p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Tracking Timeline</h3>
        <span className="logistics-muted text-xs">Operational milestone feed</span>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-[11px]">
        <span className="tracking-legend tracking-legend-completed">Completed</span>
        <span className="tracking-legend tracking-legend-current">Current</span>
        <span className="tracking-legend tracking-legend-hold">On Hold</span>
        <span className="tracking-legend tracking-legend-upcoming">Upcoming</span>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-400/30 bg-[#132c47] px-4 py-3 text-sm text-slate-200">
          Timeline will appear once shipment milestones are available.
        </div>
      ) : (
        <ol className="relative pl-7">
          <div className="absolute left-3 top-1 bottom-1 w-px bg-linear-to-b from-lime-300/60 via-[#5f7ea5] to-[#3a5678]" />

          {rows.map((row, index) => {
            const badgeLabel = row.state === 'completed' ? 'Completed' : row.state === 'current' ? 'Current' : row.state === 'hold' ? 'On Hold' : 'Upcoming'
            const timestamp = timelineTimestampLabel(row, index, rows.length)
            return (
              <li key={row.key} className="relative mb-4 last:mb-0">
                <span
                  className={`absolute left-[-1.2rem] top-5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold ${getNodeClasses(
                    row.state
                  )}`}
                  aria-hidden="true"
                >
                  {row.state === 'completed' ? 'C' : row.state === 'current' ? 'N' : row.state === 'hold' ? 'H' : ''}
                </span>

                <article className={`rounded-xl border px-4 py-3 ${getCardClasses(row.state)}`}>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">{row.status}</p>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getBadgeClasses(row.state)}`}>
                      {badgeLabel}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#b7cde7]">{row.location}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#95adc9]">{row.description}</p>

                  {/* Hold reason banner — shown only on the held event */}
                  {row.state === 'hold' && row.holdReason && (
                    <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-amber-300/35 bg-amber-500/10 px-3 py-2.5">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" className="mt-0.5 h-4 w-4 shrink-0">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Delay Reason</p>
                        <p className="mt-0.5 text-xs font-semibold text-amber-100">{row.holdReason}</p>
                      </div>
                    </div>
                  )}

                  {/* Timestamp shown on every reached event, not only final */}
                  {(row.state === 'completed' || row.state === 'current' || row.state === 'hold') && (
                    <p className="mt-2 text-[11px] text-[#7f99b7]">{formatTimestamp(row.eventTime)}</p>
                  )}
                  {row.state === 'upcoming' && timestamp && (
                    <p className="mt-2 text-[11px] text-[#7f99b7]">ETA: {timestamp}</p>
                  )}
                </article>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
