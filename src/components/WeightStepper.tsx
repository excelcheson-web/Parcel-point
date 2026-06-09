'use client'

import { useState, useCallback } from 'react'

interface WeightStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  className?: string
}

export function WeightStepper({ 
  value, 
  onChange, 
  min = 0, 
  max = 1000, 
  step = 0.5,
  className = '' 
}: WeightStepperProps) {
  const [inputValue, setInputValue] = useState(value.toString())
  
  const handleDecrement = useCallback(() => {
    const newValue = Math.max(min, value - step)
    onChange(newValue)
    setInputValue(newValue.toString())
  }, [value, min, step, onChange])
  
  const handleIncrement = useCallback(() => {
    const newValue = Math.min(max, value + step)
    onChange(newValue)
    setInputValue(newValue.toString())
  }, [value, max, step, onChange])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    const parsed = parseFloat(newValue)
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed)
    }
  }
  
  const handleBlur = () => {
    const parsed = parseFloat(inputValue)
    if (isNaN(parsed) || parsed < min) {
      setInputValue(min.toString())
      onChange(min)
    } else if (parsed > max) {
      setInputValue(max.toString())
      onChange(max)
    } else {
      setInputValue(parsed.toString())
      onChange(parsed)
    }
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Decrement Button */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-12 h-12 min-h-[48px] flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        aria-label="Decrease weight"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      
      {/* Input Field */}
      <div className="flex-1 relative">
        <input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          min={min}
          max={max}
          step={step}
          className="w-full h-12 min-h-[48px] px-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white text-center font-mono text-lg focus:outline-none focus:border-[#7C3AED] transition-colors"
          placeholder="0.0"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm font-medium">
          kg
        </span>
      </div>
      
      {/* Increment Button */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-12 h-12 min-h-[48px] flex items-center justify-center bg-[#7C3AED]/20 backdrop-blur-sm border border-[#7C3AED]/40 rounded-xl text-[#7C3AED] hover:bg-[#7C3AED]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        aria-label="Increase weight"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  )
}

// Preset weight buttons for common values
export function WeightPresets({ 
  onSelect, 
  className = '' 
}: { 
  onSelect: (value: number) => void
  className?: string 
}) {
  const presets = [1, 5, 10, 25, 50, 100]
  
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onSelect(preset)}
          className="px-3 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-white/70 text-sm hover:bg-white/10 hover:text-white hover:border-[#7C3AED]/50 transition-all active:scale-95"
        >
          {preset} kg
        </button>
      ))}
    </div>
  )
}

export default WeightStepper
