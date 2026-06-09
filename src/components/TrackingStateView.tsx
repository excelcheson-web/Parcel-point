import React from 'react'

interface TrackingStateViewProps {
  state: 'empty' | 'loading' | 'notfound' | 'error' | 'success'
  children?: React.ReactNode
  notFoundMessage?: string
  errorMessage?: string
  onRetry?: () => void
}

export const TrackingStateView: React.FC<TrackingStateViewProps> = ({
  state,
  children,
  notFoundMessage,
  errorMessage,
  onRetry,
}) => {
  if (state === 'loading') {
    return (
      <div className="logistics-state-loading logistics-fade-in">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#3e5e85] border-t-lime-300" />
        <p className="logistics-subtitle mt-4 text-sm font-medium">Checking latest shipment milestones...</p>
        <div className="tracking-skeleton mt-5 mx-auto max-w-xl">
          <div className="tracking-skeleton-line h-3 w-[78%]" />
          <div className="tracking-skeleton-line h-3 w-[92%]" />
          <div className="tracking-skeleton-line h-3 w-[64%]" />
        </div>
      </div>
    )
  }

  if (state === 'notfound') {
    return (
      <div className="logistics-state-error logistics-fade-in">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-200">No Match Found</p>
        <p className="mt-2 text-base text-white">{notFoundMessage || 'Tracking number not found. Please check and try again.'}</p>
        <p className="mt-3 text-xs text-red-100/80">Check for missing characters, spacing, or outdated copy of the waybill number.</p>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="logistics-state-error logistics-fade-in">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">Tracking Temporarily Unavailable</p>
        <p className="mt-2 text-base text-white">{errorMessage || 'Unable to load tracking right now.'}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <div className="logistics-state-empty logistics-fade-in">
        <p className="logistics-muted text-sm font-semibold uppercase tracking-wide">Ready To Track</p>
        <p className="logistics-subtitle mt-2 text-base">Enter a waybill number to view shipment progress, parties, and status timeline.</p>
        <div className="mt-5 flex items-center justify-center">
          <div className="tracking-empty-pulse">
            <span className="tracking-empty-dot" />
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
