'use client'

import { useCallback, useMemo } from 'react'

export interface LineItem {
  description: string
  pieces: number
  weight: number
  type: 'Box' | 'Pallet' | 'Carton' | 'Crate' | 'Bag' | 'Other'
  dimensions?: {
    length: number
    width: number
    height: number
  }
}

interface LineItemsManagerProps {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
}

const packageTypes: LineItem['type'][] = ['Box', 'Pallet', 'Carton', 'Crate', 'Bag', 'Other']

// Default empty item
const defaultItem: LineItem = { description: '', pieces: 1, weight: 0, type: 'Box' }

export function LineItemsManager({ items, onChange }: LineItemsManagerProps) {
  // Ensure at least one item exists - use memoized value
  const localItems = useMemo(() => 
    items.length > 0 ? items : [defaultItem],
    [items]
  )

  const addItem = useCallback(() => {
    onChange([
      ...localItems,
      { description: '', pieces: 1, weight: 0, type: 'Box' }
    ])
  }, [localItems, onChange])

  const removeItem = useCallback((index: number) => {
    if (localItems.length > 1) {
      onChange(localItems.filter((_, i) => i !== index))
    }
  }, [localItems, onChange])

  const updateItem = useCallback(<K extends keyof LineItem,>(index: number, field: K, value: LineItem[K]) => {
    const newItems = [...localItems]
    newItems[index] = { ...newItems[index], [field]: value }
    onChange(newItems)
  }, [localItems, onChange])

  // Calculate totals - memoized
  const totalPieces = useMemo(() => 
    localItems.reduce((sum, item) => sum + (item.pieces || 0), 0),
    [localItems]
  )
  
  const totalWeight = useMemo(() => 
    localItems.reduce((sum, item) => sum + (item.weight || 0), 0),
    [localItems]
  )

  return (
    <div className="space-y-4">
      {/* Line Items List */}
      <div className="space-y-3">
        {localItems.map((item, index) => (
          <div 
            key={index} 
            className="p-3 bg-white/10 rounded-lg border border-white/20 space-y-3"
          >
            {/* Item Header with Number */}
            <div className="flex justify-between items-center">
              <span className="text-[#7C3AED] font-bold text-sm">Item #{index + 1}</span>
              {localItems.length > 1 && (
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Remove
                </button>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-white/60 mb-1">
                Description *
              </label>
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-white/20 rounded-lg bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
                placeholder="Enter item description"
              />
            </div>

            {/* Pieces, Weight, Type Row */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-white/60 mb-1">
                  Pieces
                </label>
                <input
                  type="number"
                  min="1"
                  value={item.pieces}
                  onChange={(e) => updateItem(index, 'pieces', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 text-sm border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={item.weight}
                  onChange={(e) => updateItem(index, 'weight', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">
                  Type
                </label>
                <select
                  value={item.type}
                  onChange={(e) => updateItem(index, 'type', e.target.value as LineItem['type'])}
                  className="w-full px-3 py-2 text-sm border border-white/20 rounded-lg bg-white/10 text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
                >
                  {packageTypes.map(type => (
                    <option key={type} value={type} className="text-gray-900">
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Item Button */}
      <button
        onClick={addItem}
        className="w-full py-2 px-4 rounded-lg border-2 border-dashed border-[#7C3AED]/50 text-[#7C3AED] hover:bg-[#7C3AED]/10 hover:border-[#7C3AED] transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Add Another Item
      </button>

      {/* Totals Summary */}
      <div className="p-3 bg-[#7C3AED]/20 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-[#7C3AED] text-sm font-bold">Total Pieces:</span>
          <span className="text-[#7C3AED] font-mono font-bold">{totalPieces}</span>
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-[#7C3AED] text-sm font-bold">Total Weight:</span>
          <span className="text-[#7C3AED] font-mono font-bold">{totalWeight.toFixed(2)} kg</span>
        </div>
      </div>
    </div>
  )
}

export default LineItemsManager
