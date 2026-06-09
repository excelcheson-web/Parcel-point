'use client'

import { useState } from 'react'
import { useAddressBook } from '@/hooks/useSmartDefaults'

interface AddressBookDropdownProps {
  type: 'shipper' | 'consignee'
  onSelect: (name: string, address: string, phone: string) => void
  className?: string
}

export function AddressBookDropdown({ type, onSelect, className = '' }: AddressBookDropdownProps) {
  const { getAddressesByType, saveAddress } = useAddressBook()
  const [isOpen, setIsOpen] = useState(false)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [newAddress, setNewAddress] = useState({ name: '', address: '', phone: '' })
  
  const addresses = getAddressesByType(type)
  
  const handleSelect = (name: string, address: string, phone: string) => {
    onSelect(name, address, phone)
    setIsOpen(false)
  }
  
  const handleSaveNew = () => {
    if (newAddress.name && newAddress.address && newAddress.phone) {
      saveAddress({ ...newAddress, type })
      setShowSaveForm(false)
      setNewAddress({ name: '', address: '', phone: '' })
    }
  }
  
  return (
    <div className={`relative ${className}`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white text-sm font-medium hover:bg-white/20 transition-all flex items-center justify-between min-h-[48px]"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#7C3AED]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {type === 'shipper' ? 'Previous Shippers' : 'Previous Consignees'}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#071427]/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden">
          {addresses.length > 0 ? (
            <div className="max-h-48 overflow-y-auto">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="px-4 py-3 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-0 transition-colors"
                  onClick={() => handleSelect(addr.name, addr.address, addr.phone)}
                >
                  <div className="text-white font-medium text-sm">{addr.name}</div>
                  <div className="text-white/60 text-xs truncate">{addr.address}</div>
                  <div className="text-[#7C3AED] text-xs">{addr.phone}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-white/60 text-sm text-center">
              No saved {type === 'shipper' ? 'shippers' : 'consignees'} yet
            </div>
          )}
          
          {/* Save New Address Option */}
          {!showSaveForm ? (
            <button
              type="button"
              onClick={() => setShowSaveForm(true)}
              className="w-full px-4 py-3 bg-[#7C3AED]/20 text-[#7C3AED] text-sm font-medium hover:bg-[#7C3AED]/30 transition-colors border-t border-white/10"
            >
              + Save Current {type === 'shipper' ? 'Shipper' : 'Consignee'}
            </button>
          ) : (
            <div className="p-3 space-y-2 border-t border-white/10 bg-white/5">
              <input
                type="text"
                placeholder="Name"
                value={newAddress.name}
                onChange={(e) => setNewAddress(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#7C3AED]"
              />
              <input
                type="text"
                placeholder="Address"
                value={newAddress.address}
                onChange={(e) => setNewAddress(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#7C3AED]"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={newAddress.phone}
                onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/40 focus:outline-none focus:border-[#7C3AED]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveNew}
                  className="flex-1 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-semibold hover:bg-[#A855F7] transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowSaveForm(false)}
                  className="flex-1 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressBookDropdown
