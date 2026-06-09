'use client'

interface StatusTogglesProps {
  isFragile: boolean
  isExpress: boolean
  onFragileChange: (value: boolean) => void
  onExpressChange: (value: boolean) => void
  className?: string
}

export function StatusToggles({ 
  isFragile, 
  isExpress, 
  onFragileChange, 
  onExpressChange,
  className = '' 
}: StatusTogglesProps) {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {/* Fragile Toggle */}
      <label className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isFragile 
          ? 'bg-red-500/20 border-red-500/50' 
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}>
        <input
          type="checkbox"
          checked={isFragile}
          onChange={(e) => onFragileChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
          isFragile ? 'bg-red-500 text-white' : 'bg-white/10 text-white/50'
        }`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <span className={`text-sm font-semibold ${isFragile ? 'text-red-400' : 'text-white/70'}`}>
          Fragile
        </span>
        <span className="text-xs text-white/40 mt-1 text-center">
          Handle with care
        </span>
        {isFragile && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </label>

      {/* Express Toggle */}
      <label className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
        isExpress 
          ? 'bg-[#7C3AED]/20 border-[#7C3AED]/50' 
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}>
        <input
          type="checkbox"
          checked={isExpress}
          onChange={(e) => onExpressChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
          isExpress ? 'bg-[#7C3AED] text-white' : 'bg-white/10 text-white/50'
        }`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className={`text-sm font-semibold ${isExpress ? 'text-[#7C3AED]' : 'text-white/70'}`}>
          Express
        </span>
        <span className="text-xs text-white/40 mt-1 text-center">
          Priority delivery
        </span>
        {isExpress && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-[#7C3AED] rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </label>
    </div>
  )
}

// Individual toggle component for reuse
export function StatusToggle({
  checked,
  onChange,
  icon,
  label,
  description,
  className = ''
}: {
  checked: boolean
  onChange: (value: boolean) => void
  icon: React.ReactNode
  label: string
  description?: string
  className?: string
}) {
  return (
    <label className={`relative flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
      checked 
        ? 'bg-white/10 border-white/30' 
        : 'bg-white/5 border-white/10 hover:bg-white/10'
    } ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      
      {/* Toggle Switch */}
      <div className={`relative w-14 h-8 rounded-full transition-colors ${
        checked ? 'bg-[#7C3AED]' : 'bg-white/20'
      }`}>
        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-6' : ''
        }`} />
      </div>
      
      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
        checked ? 'bg-[#7C3AED]/20 text-[#7C3AED]' : 'bg-white/10 text-white/50'
      }`}>
        {icon}
      </div>
      
      {/* Text */}
      <div className="flex-1">
        <span className={`block font-semibold ${checked ? 'text-white' : 'text-white/70'}`}>
          {label}
        </span>
        {description && (
          <span className="text-xs text-white/40">{description}</span>
        )}
      </div>
    </label>
  )
}

export default StatusToggles
