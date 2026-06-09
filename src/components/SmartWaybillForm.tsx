'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSmartDefaults } from '@/hooks/useSmartDefaults'
import { AddressBookDropdown } from './AddressBookDropdown'
import { StatusToggles } from './StatusToggles'
import { LineItemsManager } from './LineItemsManager'
import { generateWaybillPDF } from './WaybillTemplate'
import { getCarrierDisplayName, COUNTRIES } from '@/lib/constants'
import type { WaybillFormData } from '@/lib/types'
import {
  type DeliveryType,
  type GeneratedTimelineEvent,
  type ShipmentTimelineInput,
  generateLocalShipmentTimeline,
} from '@/lib/localShipmentTimeline'

interface SmartWaybillFormProps {
  onGenerated?: (pdfUrl: string, waybillData: WaybillFormData) => void | Promise<void>
}

// Default line items - defined outside component to maintain stable reference
const defaultLineItems = [{ description: '', pieces: 1, weight: 0, type: 'Box' as const }]
const SERVICE_TYPE_OPTIONS = ['Standard', 'Express', 'Priority', 'Economy'] as const
const ROUTE_MODE_CODE: Record<'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR', string> = {
  AIR: 'AIR',
  SEA: 'SEA',
  LAND: 'LND',
  DOOR_TO_DOOR: 'DTD',
}
const PAYMENT_STATUS_OPTIONS = ['PAID', 'NOT PAID', 'PARTIAL PAYMENT', 'PAYMENT PENDING', 'CASH ON DELIVERY'] as const
const MODE_TERMINAL_LABEL: Record<'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR', string> = {
  AIR: 'Airport',
  SEA: 'Seaport',
  LAND: 'Land Hub',
  DOOR_TO_DOOR: 'Service Zone',
}

type TransportMode = 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR'

function getSeaPortCode(country: typeof COUNTRIES[number]): string {
  const cityLetters = country.city.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, 'X')
  return `${country.code}${cityLetters}`
}

function getModeLocationCode(country: typeof COUNTRIES[number], mode: TransportMode): string {
  switch (mode) {
    case 'AIR':
      return country.airport
    case 'SEA':
      return getSeaPortCode(country)
    case 'LAND':
      return `${country.code}-LND`
    case 'DOOR_TO_DOOR':
      return `${country.code}-DTD`
    default:
      return country.airport
  }
}

function getModeLocation(country: typeof COUNTRIES[number], mode: TransportMode): string {
  return `${country.city}/${getModeLocationCode(country, mode)}`
}

// SVG Icons
const Icons = {
  shipper: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  consignee: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  package: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
  air: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
  sea: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  land: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  doorToDoor: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  lightning: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  spinner: (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

export function SmartWaybillForm({ onGenerated }: SmartWaybillFormProps) {
  // Transport mode selection
  const [transportMode, setTransportMode] = useState<TransportMode>('AIR')
  
  // Country selections
  const [departureCountry, setDepartureCountry] = useState<typeof COUNTRIES[number]>(COUNTRIES[0])
  const [destinationCountry, setDestinationCountry] = useState<typeof COUNTRIES[number]>(COUNTRIES[4])
  
  // Smart defaults hook - pass country info for dynamic departure/destination
  const {
    smartDefaults,
    userInput,
    updateUserInput,
    updateTransportMode,
    regenerateWaybillNumber,
    completeFormData,
    isValid,
    transportConfig
  } = useSmartDefaults(transportMode, departureCountry, destinationCountry)

  // Get dynamic carrier display name
  const carrierDisplayName = useMemo(() => {
    return getCarrierDisplayName(transportMode)
  }, [transportMode])

  const transportCodeLabel = useMemo(() => {
    if (transportMode === 'SEA') return 'SCAC Code'
    if (transportMode === 'AIR') return 'IATA AWB Prefix'
    return 'Carrier Code'
  }, [transportMode])
  const terminalLabel = MODE_TERMINAL_LABEL[transportMode]
  const routeSymbol = transportMode === 'SEA' ? 'SHIP' : transportMode === 'LAND' ? 'TRUCK' : transportMode === 'DOOR_TO_DOOR' ? 'DOOR' : 'AIR'

  const autoRouteNumber = useMemo(() => {
    const modeCode = ROUTE_MODE_CODE[transportMode]
    const departureCode = getModeLocationCode(departureCountry, transportMode) || 'DEP'
    const destinationCode = getModeLocationCode(destinationCountry, transportMode) || 'DST'
    const waybillSuffix = (smartDefaults.waybillNumber || 'AUTO').replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase() || 'AUTO'
    return `RT-${modeCode}-${departureCode}-${destinationCode}-${waybillSuffix}`
  }, [departureCountry, destinationCountry, smartDefaults.waybillNumber, transportMode])

  // Local state for UI
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null)
  const [serviceType, setServiceType] = useState<(typeof SERVICE_TYPE_OPTIONS)[number]>('Standard')
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('DOOR_TO_DOOR')
  const [projectedTimeline, setProjectedTimeline] = useState<GeneratedTimelineEvent[]>(() =>
    generateLocalShipmentTimeline({
      shipmentMode: transportMode,
      serviceType: 'Standard',
      deliveryType: 'DOOR_TO_DOOR',
      origin: getModeLocation(departureCountry, transportMode),
      destination: getModeLocation(destinationCountry, transportMode),
      departureDate: smartDefaults.dateOfIssue,
      estimatedDeliveryDate: smartDefaults.estimatedArrivalDate,
    })
  )

  const buildTimelineInput = useCallback(
    (overrides: Partial<ShipmentTimelineInput> = {}): ShipmentTimelineInput => ({
      shipmentMode: overrides.shipmentMode || transportMode,
      serviceType: overrides.serviceType || serviceType,
      deliveryType: overrides.deliveryType || deliveryType,
      origin: overrides.origin || userInput.portOfDeparture || getModeLocation(departureCountry, transportMode),
      destination: overrides.destination || userInput.portOfDestination || getModeLocation(destinationCountry, transportMode),
      departureDate: overrides.departureDate || smartDefaults.dateOfIssue,
      estimatedDeliveryDate: overrides.estimatedDeliveryDate || smartDefaults.estimatedArrivalDate,
    }),
    [
      deliveryType,
      departureCountry,
      destinationCountry,
      serviceType,
      smartDefaults.dateOfIssue,
      smartDefaults.estimatedArrivalDate,
      transportMode,
      userInput.portOfDeparture,
      userInput.portOfDestination,
    ]
  )

  const regenerateProjectedTimeline = useCallback((overrides: Partial<ShipmentTimelineInput> = {}) => {
    const next = generateLocalShipmentTimeline(buildTimelineInput(overrides))
    setProjectedTimeline(next)
  }, [buildTimelineInput])

  useEffect(() => {
    regenerateProjectedTimeline({
      departureDate: smartDefaults.dateOfIssue,
      estimatedDeliveryDate: smartDefaults.estimatedArrivalDate,
    })
  }, [regenerateProjectedTimeline, smartDefaults.dateOfIssue, smartDefaults.estimatedArrivalDate])

  // Handle transport mode change
  const handleTransportModeChange = (mode: TransportMode) => {
    setTransportMode(mode)
    updateTransportMode(mode)
    const nextOrigin = getModeLocation(departureCountry, mode)
    const nextDestination = getModeLocation(destinationCountry, mode)
    updateUserInput('portOfDeparture', nextOrigin)
    updateUserInput('portOfDestination', nextDestination)

    const syncedDeliveryType: DeliveryType = mode === 'DOOR_TO_DOOR' ? 'DOOR_TO_DOOR' : deliveryType
    if (mode === 'DOOR_TO_DOOR' && deliveryType !== 'DOOR_TO_DOOR') {
      setDeliveryType('DOOR_TO_DOOR')
    }
    regenerateProjectedTimeline({ shipmentMode: mode, deliveryType: syncedDeliveryType, origin: nextOrigin, destination: nextDestination })
  }

  // Handle country changes
  const handleDepartureChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode)
    if (country) {
      const nextOrigin = getModeLocation(country, transportMode)
      setDepartureCountry(country)
      // Update the smart defaults with new departure info
      updateUserInput('portOfDeparture', nextOrigin)
      regenerateProjectedTimeline({ origin: nextOrigin })
    }
  }

  const handleDestinationChange = (countryCode: string) => {
    const country = COUNTRIES.find(c => c.code === countryCode)
    if (country) {
      const nextDestination = getModeLocation(country, transportMode)
      setDestinationCountry(country)
      // Update the smart defaults with new destination info
      updateUserInput('portOfDestination', nextDestination)
      regenerateProjectedTimeline({ destination: nextDestination })
    }
  }

  const handleServiceTypeChange = (value: (typeof SERVICE_TYPE_OPTIONS)[number]) => {
    setServiceType(value)
    regenerateProjectedTimeline({ serviceType: value })
  }

  const handleDeliveryTypeChange = (value: DeliveryType) => {
    setDeliveryType(value)
    regenerateProjectedTimeline({ deliveryType: value })
  }

  // Generate waybill
  const handleGenerate = async () => {
    if (!isValid) {
      alert('Please fill in all required fields: Shipper info, Consignee info, and Description')
      return
    }

    setIsGenerating(true)
    try {
      const timelineForWaybill = generateLocalShipmentTimeline(
        buildTimelineInput({
          origin: completeFormData.portOfDeparture || getModeLocation(departureCountry, transportMode),
          destination: completeFormData.portOfDestination || getModeLocation(destinationCountry, transportMode),
          departureDate: completeFormData.dateOfIssue || completeFormData.departureDate || smartDefaults.dateOfIssue,
          estimatedDeliveryDate: completeFormData.estimatedArrivalDate || completeFormData.estimatedDeliveryDate,
        })
      )

      setProjectedTimeline(timelineForWaybill)

      const localTimelineForWaybill = timelineForWaybill.map((event) => ({
        status: event.status,
        location: event.location,
        description: event.description,
        eventTime: event.eventTime,
        isHold: event.isHold,
      }))

      const waybillData: WaybillFormData = {
        ...completeFormData,
        paymentStatus: userInput.paymentStatus || 'NOT PAID',
        routeNumber: autoRouteNumber,
        serviceTypeString: serviceType,
        deliveryType,
        trackingEvents: localTimelineForWaybill,
      }
      const pdfUrl = await generateWaybillPDF(waybillData)
      
      setGeneratedPdfUrl(pdfUrl)
      setShowPreview(true)
      if (onGenerated) {
        await onGenerated(pdfUrl, waybillData)
      }
      
      // Auto-download
      const link = document.createElement('a')
      link.href = pdfUrl
      link.download = `waybill_${waybillData.waybillNumber}.pdf`
      link.click()
      
      alert(`Waybill ${waybillData.waybillNumber} generated successfully!`)
    } catch (error) {
      console.error('Error generating waybill:', error)
      const message = error instanceof Error ? error.message : 'Error generating waybill. Please try again.'
      alert(message)
    } finally {
      setIsGenerating(false)
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Get transport icon
  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'AIR': return Icons.air
      case 'SEA': return Icons.sea
      case 'LAND': return Icons.land
      case 'DOOR_TO_DOOR': return Icons.doorToDoor
      default: return Icons.air
    }
  }

  return (
    <div className="space-y-6">
      {/* Transport Mode Selection */}
      <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Transport Mode
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['AIR', 'SEA', 'LAND', 'DOOR_TO_DOOR'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleTransportModeChange(mode)}
              className={`px-3 py-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                transportMode === mode
                  ? 'bg-[#071427] text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {getTransportIcon(mode)}
              <span className="hidden sm:inline">{mode === 'DOOR_TO_DOOR' ? 'Door to Door' : mode}</span>
              <span className="sm:hidden">{mode === 'DOOR_TO_DOOR' ? 'DTD' : mode}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Estimated delivery: <span className="font-semibold text-[#071427]">{transportConfig.baseTransitDays} days</span> | Speed: {transportConfig.avgSpeedKmh} km/h
        </p>
      </div>

      {/* Auto-Generated Info Display */}
      <div className="p-4 rounded-2xl bg-[#071427] border-2 border-[#7C3AED] shadow-lg">
        <h4 className="text-sm font-bold text-[#7C3AED] mb-3 flex items-center gap-2 uppercase tracking-wide">
          {Icons.lightning}
          Auto-Generated Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
            <span className="text-gray-300 font-medium">Waybill Number:</span>
            <span className="font-mono text-[#7C3AED] font-bold">{smartDefaults.waybillNumber}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
            <span className="text-gray-300 font-medium">Date:</span>
            <span className="text-white font-semibold">{formatDate(smartDefaults.dateOfIssue)}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg md:col-span-2">
            <span className="text-gray-300 font-medium">Carrier:</span>
            <span className="text-white font-semibold text-right">{carrierDisplayName}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
            <span className="text-gray-300 font-medium">{transportCodeLabel}:</span>
            <span className="font-mono text-white font-semibold">{smartDefaults.iataCode}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg">
            <span className="text-gray-300 font-medium">Status:</span>
            <span className="text-[#7C3AED] font-bold uppercase">{smartDefaults.status}</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg md:col-span-2">
            <span className="text-gray-300 font-medium">Payment Status:</span>
            <select
              value={userInput.paymentStatus || 'NOT PAID'}
              onChange={(e) => updateUserInput('paymentStatus', e.target.value as typeof PAYMENT_STATUS_OPTIONS[number])}
              className="w-56 rounded-lg border border-white/30 bg-white/20 px-3 py-1 text-right text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED]"
            >
              {PAYMENT_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option} className="text-gray-900">
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-between items-center p-2 bg-white/10 rounded-lg md:col-span-2">
            <span className="text-gray-300 font-medium">Route Number:</span>
            <span className="rounded-lg border border-white/30 bg-white/20 px-3 py-1 font-mono font-semibold text-white">
              {autoRouteNumber}
            </span>
          </div>
        </div>
        
        <button
          onClick={regenerateWaybillNumber}
          className="mt-3 text-xs text-[#7C3AED] hover:text-[#A855F7] underline flex items-center gap-1"
        >
          {Icons.refresh} Regenerate Waybill Number
        </button>
      </div>

      {/* Routing & Destination Section */}
      <div className="p-4 rounded-2xl bg-[#071427] border-2 border-[#7C3AED] shadow-lg">
        <h4 className="text-lg font-semibold text-[#7C3AED] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] text-[10px] font-bold">ROUTE</span>
          Routing & Destination
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Departure Country */}
          <div className="p-3 bg-white/10 rounded-lg border border-white/20">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Departure Country / {terminalLabel}
            </label>
            <select
              value={departureCountry.code}
              onChange={(e) => handleDepartureChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white font-semibold focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code} className="text-gray-900">
                  {country.name} ({country.city} - {getModeLocationCode(country, transportMode)})
                </option>
              ))}
            </select>
            <p className="text-xs text-white/50 mt-2">
              Selected: <span className="text-[#7C3AED]">{getModeLocation(departureCountry, transportMode)}</span>
            </p>
          </div>

          {/* Destination Country */}
          <div className="p-3 bg-white/10 rounded-lg border border-white/20">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Destination Country / {terminalLabel}
            </label>
            <select
              value={destinationCountry.code}
              onChange={(e) => handleDestinationChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white font-semibold focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
            >
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code} className="text-gray-900">
                  {country.name} ({country.city} - {getModeLocationCode(country, transportMode)})
                </option>
              ))}
            </select>
            <p className="text-xs text-white/50 mt-2">
              Selected: <span className="text-[#7C3AED]">{getModeLocation(destinationCountry, transportMode)}</span>
            </p>
          </div>
        </div>

        {/* Route Preview */}
        <div className="mt-4 p-3 bg-[#7C3AED]/10 rounded-lg border border-[#7C3AED]/30">
          <div className="flex items-center justify-center gap-4 text-sm">
            <div className="text-center">
              <span className="block text-[#7C3AED] font-bold text-lg">{departureCountry.city}</span>
              <span className="text-white/60 text-xs">{departureCountry.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[#7C3AED] text-xs font-semibold">{routeSymbol}</span>
              <div className="w-16 h-0.5 bg-[#7C3AED]/50"></div>
              <span className="text-white/40">-&gt;</span>
              <div className="w-16 h-0.5 bg-[#7C3AED]/50"></div>
              <span className="text-[#7C3AED] text-xs font-semibold">{routeSymbol}</span>
            </div>
            
            <div className="text-center">
              <span className="block text-[#7C3AED] font-bold text-lg">{destinationCountry.city}</span>
              <span className="text-white/60 text-xs">{destinationCountry.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipper Information */}
      <div className="p-4 rounded-2xl bg-[#071427] border-2 border-[#7C3AED] shadow-lg">
        <h4 className="text-lg font-semibold text-[#7C3AED] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] text-[10px] font-bold">SHIP</span>
          Shipper (FROM)
        </h4>
        
        {/* Address Book Dropdown */}
        <div className="mb-4">
          <AddressBookDropdown
            type="shipper"
            onSelect={(name, address, phone) => {
              updateUserInput('shipperName', name)
              updateUserInput('shipperAddress', address)
              updateUserInput('shipperPhone', phone)
            }}
            className="mb-3"
          />
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Shipper Name *
            </label>
            <input
              type="text"
              value={userInput.shipperName || ''}
              onChange={(e) => updateUserInput('shipperName', e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
              placeholder="Enter shipper/company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Shipper Address
            </label>
            <textarea
              value={userInput.shipperAddress || ''}
              onChange={(e) => updateUserInput('shipperAddress', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition resize-none"
              placeholder="Full address including city, state, postal code, country"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Shipper Phone
            </label>
            <input
              type="tel"
              value={userInput.shipperPhone || ''}
              onChange={(e) => updateUserInput('shipperPhone', e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
              placeholder="+234 800 727 2357"
            />
          </div>
        </div>
      </div>

      {/* Consignee Information */}
      <div className="p-4 rounded-2xl bg-[#071427] border-2 border-[#7C3AED] shadow-lg">
        <h4 className="text-lg font-semibold text-[#7C3AED] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] text-[10px] font-bold">CONS</span>
          Consignee (TO)
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Consignee Name *
            </label>
            <input
              type="text"
              value={userInput.consigneeName || ''}
              onChange={(e) => updateUserInput('consigneeName', e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
              placeholder="Enter consignee/recipient name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Consignee Address
            </label>
            <textarea
              value={userInput.consigneeAddress || ''}
              onChange={(e) => updateUserInput('consigneeAddress', e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition resize-none"
              placeholder="Full address including city, state, postal code, country"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Consignee Phone
            </label>
            <input
              type="tel"
              value={userInput.consigneePhone || ''}
              onChange={(e) => updateUserInput('consigneePhone', e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
              placeholder="+234 800 727 2357"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Receiver City
            </label>
            <input
              type="text"
              value={userInput.receiverCity || ''}
              onChange={(e) => updateUserInput('receiverCity', e.target.value)}
              className="w-full px-4 py-3 min-h-[48px] border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
              placeholder="e.g., London, New York, Singapore"
            />
          </div>
        </div>
      </div>

      {/* Description of Goods - Line Items */}
      <div className="p-4 rounded-2xl bg-[#071427] border-2 border-[#7C3AED] shadow-lg">
        <h4 className="text-lg font-semibold text-[#7C3AED] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] text-[10px] font-bold">ITEMS</span>
          Description of Goods
        </h4>
        
        <div className="space-y-4">
          {/* Line Items Manager */}
          <LineItemsManager
            items={userInput.lineItems || defaultLineItems}
            onChange={useCallback((items) => {
              // Update line items
              updateUserInput('lineItems', items)
              // Sync total pieces and weight for validation
              const totalPieces = items.reduce((sum, item) => sum + (item.pieces || 0), 0)
              const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0)
              const cargoDescription = items.map(item => item.description).filter(Boolean).join(', ')
              
              updateUserInput('totalPieces', totalPieces)
              updateUserInput('totalWeight', totalWeight)
              updateUserInput('cargoDescription', cargoDescription || items[0]?.description || '')
            }, [updateUserInput])}
          />
          
          {/* Status Toggles */}
          <div className="pt-2 border-t border-white/20">
            <label className="block text-sm font-medium text-white/80 mb-2">
              Special Handling
            </label>
            <StatusToggles
              isFragile={userInput.isFragile || false}
              isExpress={userInput.isExpress || false}
              onFragileChange={(value) => updateUserInput('isFragile', value)}
              onExpressChange={(value) => updateUserInput('isExpress', value)}
            />
          </div>
        </div>
      </div>

      {/* Charges & Fees Section - Matches PDF Output */}
      <div className="p-4 rounded-2xl bg-[#071427] border-2 border-[#7C3AED] shadow-lg">
        <h4 className="text-lg font-semibold text-[#7C3AED] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] text-[10px] font-bold">FEES</span>
          Charges & Fees (USD)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Base Freight
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={userInput.baseFreight || 0}
              onChange={(e) => updateUserInput('baseFreight', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 min-h-[48px] border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Insurance
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={userInput.insurance || 0}
              onChange={(e) => updateUserInput('insurance', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 min-h-[48px] border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Airport Tax/VAT
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={userInput.airportTaxVat || 0}
              onChange={(e) => updateUserInput('airportTaxVat', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 min-h-[48px] border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">
              Destination Duty
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={userInput.destinationDuty || 0}
              onChange={(e) => updateUserInput('destinationDuty', parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 min-h-[48px] border border-white/20 rounded-xl bg-white/10 text-white placeholder-white/40 focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED] transition"
              placeholder="0.00"
            />
          </div>
        </div>
        
        {/* Total Calculation */}
        <div className="mt-4 p-3 bg-[#7C3AED]/20 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[#7C3AED] font-bold">TOTAL CHARGES:</span>
            <span className="text-[#7C3AED] font-mono font-bold text-lg">
              ${((userInput.baseFreight || 0) + (userInput.insurance || 0) + (userInput.airportTaxVat || 0) + (userInput.destinationDuty || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Shipment Totals - Preview */}
      <div className="p-4 rounded-2xl bg-[#071427] border-2 border-[#7C3AED] shadow-lg">
        <h4 className="text-lg font-semibold text-[#7C3AED] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED] text-[10px] font-bold">TOTAL</span>
          Shipment Totals
        </h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-white/10 rounded-lg">
            <span className="text-gray-400 text-sm">Total Pieces:</span>
            <p className="text-white font-bold text-lg">{userInput.totalPieces || 1}</p>
          </div>
          <div className="p-3 bg-white/10 rounded-lg">
            <span className="text-gray-400 text-sm">Total Weight:</span>
            <p className="text-white font-bold text-lg">{(userInput.totalWeight || 0).toFixed(2)} KG</p>
          </div>
        </div>
      </div>

      {/* Local Timeline Preview (Compact) */}
      <div className="p-4 rounded-2xl bg-[#071427] border-2 border-[#7C3AED] shadow-lg">
        <h4 className="text-lg font-semibold text-[#7C3AED] mb-4 flex items-center gap-2 uppercase tracking-wide">
          <span className="w-8 h-8 rounded-full bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED]">Preview</span>
          Projected Timeline
        </h4>

        <p className="text-xs text-white/70 mb-4">
          Local projection is compact to keep this dashboard short. Full timeline details and control appear below after loading an existing waybill number.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-sm text-white/80 mb-1">Service Type</label>
            <select
              value={serviceType}
              onChange={(e) => handleServiceTypeChange(e.target.value as (typeof SERVICE_TYPE_OPTIONS)[number])}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED]"
            >
              {SERVICE_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option} className="text-gray-900">
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-white/80 mb-1">Delivery Type</label>
            <select
              value={deliveryType}
              onChange={(e) => handleDeliveryTypeChange(e.target.value as DeliveryType)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:ring-2 focus:ring-[#7C3AED] focus:border-[#7C3AED]"
            >
              <option value="DOOR_TO_DOOR" className="text-gray-900">Door to Door</option>
              <option value="OFFICE_PICKUP" className="text-gray-900">Office Pickup</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => regenerateProjectedTimeline()}
              className="w-full px-3 py-2 rounded-lg bg-[#7C3AED] text-white font-semibold hover:bg-[#A855F7] transition"
            >
              Regenerate Timeline
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-white/60">Milestones</p>
            <p className="mt-1 text-sm font-semibold text-white">{projectedTimeline.length}</p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-white/60">Start</p>
            <p className="mt-1 text-sm font-semibold text-white">{projectedTimeline[0]?.status || 'N/A'}</p>
          </div>
          <div className="rounded-lg border border-white/20 bg-white/10 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-white/60">End</p>
            <p className="mt-1 text-sm font-semibold text-white">{projectedTimeline[projectedTimeline.length - 1]?.status || 'N/A'}</p>
          </div>
        </div>

        <p className="mt-3 text-xs text-white/60">
          For full event details, load a generated waybill number in <span className="text-[#7C3AED] font-semibold">Existing Waybill Timeline Control</span>.
        </p>
      </div>

      {/* Terms & Conditions */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <h4 className="text-sm font-semibold text-white/80 mb-2">Terms & Conditions</h4>
        <p className="text-xs text-white/50 leading-relaxed">
          {smartDefaults.termsAndConditions}
        </p>
      </div>

      {/* Sticky Generate Button (Mobile) */}
      <div className="sticky bottom-4 z-50 md:relative md:bottom-auto">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !isValid}
          className="w-full py-4 px-6 min-h-[56px] rounded-xl font-bold text-lg transition-all bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] text-white shadow-lg hover:shadow-xl hover:from-[#A855F7] hover:to-[#4C1D95] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Generate Waybill
            </>
          )}
        </button>
      </div>

      {/* Preview Section */}
      {showPreview && generatedPdfUrl && (
        <div className="mt-6 p-4 rounded-2xl bg-white/10 border border-white/20">
          <h4 className="text-lg font-semibold text-white mb-3">Generated Waybill Preview</h4>
          <div className="overflow-x-auto rounded-lg border border-white/20">
            <iframe
              src={generatedPdfUrl}
              className="w-full h-96 bg-white"
              title="Waybill Preview"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <a
              href={generatedPdfUrl}
              download={`waybill_${smartDefaults.waybillNumber}.pdf`}
              className="flex-1 py-3 px-4 rounded-xl bg-[#7C3AED] text-white font-semibold text-center hover:bg-[#A855F7] transition"
            >
              Download PDF
            </a>
            <button
              onClick={() => window.open(generatedPdfUrl, '_blank')}
              className="flex-1 py-3 px-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition"
            >
              Open in New Tab
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartWaybillForm


