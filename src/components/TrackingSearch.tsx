import React, { useEffect, useState } from 'react'

interface TrackingSearchProps {
  onSearch: (waybillNumber: string) => void
  loading: boolean
  initialValue?: string
  autoSubmitOnMount?: boolean
}

const normalizeLookup = (value: string) => value.trim().replace(/\s+/g, '').toUpperCase()

export const TrackingSearch: React.FC<TrackingSearchProps> = ({ onSearch, loading, initialValue = '', autoSubmitOnMount = false }) => {
  const [input, setInput] = useState(initialValue)

  useEffect(() => {
    setInput(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (!autoSubmitOnMount) return
    const value = normalizeLookup(initialValue)
    if (!value) return
    onSearch(value)
  }, [autoSubmitOnMount, initialValue, onSearch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = normalizeLookup(input)
    if (value) onSearch(value)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <label htmlFor="tracking-search-input" className="logistics-label mb-2 block">
        Waybill or Tracking Number
      </label>
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <div className="tracking-input-wrap flex-1">
          <span className="tracking-input-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-4.2-4.2m1.7-4.3a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
          </span>
          <input
            id="tracking-search-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. AWB-45281109"
            className="logistics-input-control flex-1 px-4 py-3 pl-10 text-base"
            disabled={loading}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <button
          type="submit"
          className="logistics-btn-primary px-7 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
          disabled={loading}
        >
          {loading ? 'Tracking...' : 'Track Shipment'}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-[#8eaac9]">Tip: paste the complete waybill number for fastest result matching.</p>
    </form>
  )
}
