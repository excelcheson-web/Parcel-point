'use client'

import { useState, useCallback, useMemo } from 'react'
import { 
  SMART_DEFAULTS, 
  SKYSHIP_CONFIG, 
  generateWaybillNumber, 
  generateTrackingId,
  calculateEstimatedDelivery,
  formatWaybillDate,
  TRANSPORT_CONFIG,
  normalizeTransportMode,
} from '@/lib/constants'
import type { WaybillFormData, SmartDefaults, UserInputFields } from '@/lib/types'

type TransportMode = 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR'
type CountryOption = { code: string; name: string; city: string; airport: string }

// Initial user input state - ONLY fields user needs to fill
const initialUserInput: Partial<UserInputFields> = {
  shipperName: '',
  shipperAddress: '',
  shipperPhone: '',
  consigneeName: '',
  consigneeAddress: '',
  consigneePhone: '',
  cargoDescription: '',
  contents: '',
  totalWeight: 0,
  totalPieces: 1,
  isFragile: false,
  isExpress: false,
  isDangerousGoods: false,
  lineItems: [{ description: '', pieces: 1, weight: 0, type: 'Box' }],
  specialInstructions: '',
  baseFreight: 0,
  insurance: 0,
  airportTaxVat: 0,
  destinationDuty: 0,
  receiverCity: '',
  routeNumber: '',
  paymentStatus: 'NOT PAID',
  // Routing fields - initialized empty, will be set by country dropdowns
  portOfDeparture: '',
  portOfDestination: '',
}

function getSeaPortCode(country: CountryOption): string {
  const cityLetters = country.city.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3).padEnd(3, 'X')
  return `${country.code}${cityLetters}`
}

function getModeLocationCode(country: CountryOption, mode: TransportMode): string {
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

function formatModeLocation(country: CountryOption, mode: TransportMode): string {
  return `${country.city}/${getModeLocationCode(country, mode)}`
}

function randomDigits(length: number): string {
  let output = ''
  for (let i = 0; i < length; i += 1) {
    output += Math.floor(Math.random() * 10).toString()
  }
  return output
}

type CarrierProfile = {
  carrierName: string
  transportCode: string
  carrierReference: string
}

function getCarrierProfileForMode(mode: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR'): CarrierProfile {
  switch (mode) {
    case 'AIR': {
      const airCarriers = [
        { name: 'Emirates SkyCargo', designator: 'EK', awbPrefix: '176' },
        { name: 'Lufthansa Cargo', designator: 'LH', awbPrefix: '020' },
        { name: 'Air France KLM Cargo', designator: 'AF', awbPrefix: '057' },
        { name: 'Cathay Pacific Cargo', designator: 'CX', awbPrefix: '160' },
        { name: 'Qatar Airways Cargo', designator: 'QR', awbPrefix: '157' },
        { name: 'Turkish Cargo', designator: 'TK', awbPrefix: '235' },
        { name: 'British Airways World Cargo', designator: 'BA', awbPrefix: '125' },
        { name: 'Singapore Airlines Cargo', designator: 'SQ', awbPrefix: '618' },
      ] as const
      const selected = airCarriers[Math.floor(Math.random() * airCarriers.length)]
      return {
        carrierName: selected.name,
        transportCode: `${selected.awbPrefix}-${randomDigits(8)}`,
        carrierReference: `${selected.designator}${randomDigits(3)}-${randomDigits(4)}`,
      }
    }
    case 'SEA': {
      const seaCarriers = [
        { name: 'Maersk Line', scac: 'MAEU' },
        { name: 'MSC', scac: 'MSCU' },
        { name: 'CMA CGM', scac: 'CMDU' },
        { name: 'Hapag-Lloyd', scac: 'HLCU' },
        { name: 'Ocean Network Express', scac: 'ONEY' },
        { name: 'COSCO Shipping', scac: 'COSU' },
      ] as const
      const selected = seaCarriers[Math.floor(Math.random() * seaCarriers.length)]
      return {
        carrierName: selected.name,
        transportCode: selected.scac,
        carrierReference: `${selected.scac}${randomDigits(7)}`,
      }
    }
    case 'LAND':
      return {
        carrierName: 'Land Transport Partner',
        transportCode: `ROAD-${randomDigits(4)}`,
        carrierReference: `ROAD-${randomDigits(6)}`,
      }
    case 'DOOR_TO_DOOR':
      return {
        carrierName: 'Door to Door Service',
        transportCode: `DTD-${randomDigits(4)}`,
        carrierReference: `DTD-${randomDigits(6)}`,
      }
    default:
      return {
        carrierName: 'Parcel Point',
        transportCode: SKYSHIP_CONFIG.iataCode,
        carrierReference: SMART_DEFAULTS.carrierReference,
      }
  }
}

// Generate complete smart defaults based on transport mode
export function generateSmartDefaults(
  mode: TransportMode = 'AIR',
  destination?: string,
  departureCountry?: CountryOption,
  destinationCountry?: CountryOption
): SmartDefaults {
  const now = new Date()
  const departureDate = formatWaybillDate(now)
  const estimatedArrival = calculateEstimatedDelivery(departureDate, mode, destination)
  const carrierProfile = getCarrierProfileForMode(mode)
  
  // Use provided countries or defaults
  const departureCity = departureCountry?.city || SMART_DEFAULTS.airportOfDeparture
  const departureCode = departureCountry ? getModeLocationCode(departureCountry, mode) : SMART_DEFAULTS.airportOfDepartureCode
  const destinationCity = destinationCountry?.city || destination || SMART_DEFAULTS.defaultDestination
  const destinationCode = destinationCountry
    ? getModeLocationCode(destinationCountry, mode)
    : destination
    ? getLocationCode(destination, mode)
    : SMART_DEFAULTS.defaultDestinationCode
  
  return {
    // System Generated Identifiers
    waybillNumber: generateWaybillNumber(mode),
    trackingNumber: generateTrackingId(mode),
    consignmentNumber: `PP-${Date.now().toString(36).toUpperCase()}`,
    
    // Auto-filled Dates
    dateOfIssue: departureDate,
    departureDate: departureDate,
    estimatedArrivalDate: formatWaybillDate(estimatedArrival),
    
    // Auto-filled Carrier Info - DYNAMIC based on transport mode
    issuingCarrier: `Parcel Point / ${carrierProfile.carrierName}`,
    carrierReference: carrierProfile.carrierReference,
    iataCode: carrierProfile.transportCode,
    agentName: SMART_DEFAULTS.agentName,
    agentCity: departureCity,
    
    // Auto-filled Location Info - DYNAMIC based on country selection
    airportOfDeparture: `${departureCity}/${departureCode}`,
    airportOfDepartureCode: departureCode,
    airportOfDestination: `${destinationCity}/${destinationCode}`,
    airportOfDestinationCode: destinationCode,
    
    // Auto-filled Service Info
    serviceType: SMART_DEFAULTS.defaultServiceType,
    transportMode: mode,
    currency: SMART_DEFAULTS.defaultCurrency,
    
    // Auto-filled Terms
    termsAndConditions: SMART_DEFAULTS.termsAndConditions,
    handlingInformation: SMART_DEFAULTS.defaultHandlingInfo,
    
    // System Metadata
    createdAt: now.toISOString(),
    status: SMART_DEFAULTS.defaultStatus,
  }
}

// Helper to get airport code from destination name
function getLocationCode(destination: string, mode: TransportMode): string {
  const codeMap: Record<string, string> = {
    'london': 'LHR',
    'new york': 'JFK',
    'los angeles': 'LAX',
    'dubai': 'DXB',
    'lagos': 'LOS',
    'abuja': 'ABV',
    'accra': 'ACC',
    'nairobi': 'NBO',
    'johannesburg': 'JNB',
    'paris': 'CDG',
    'amsterdam': 'AMS',
    'frankfurt': 'FRA',
    'istanbul': 'IST',
    'doha': 'DOH',
    'singapore': 'SIN',
    'hong kong': 'HKG',
    'tokyo': 'NRT',
    'sydney': 'SYD',
  }
  
  const normalized = destination.toLowerCase().trim()
  const airportCode = codeMap[normalized] || 'XXX'
  if (mode === 'AIR') return airportCode
  if (mode === 'SEA') return `ZZ${airportCode.slice(0, 3)}`
  if (mode === 'LAND') return `ZZ-LND`
  return `ZZ-DTD`
}

// Hook for managing smart defaults
export function useSmartDefaults(
  mode: TransportMode = 'AIR',
  departureCountry?: CountryOption,
  destinationCountry?: CountryOption
) {
  const safeMode = normalizeTransportMode(mode) as TransportMode

  // Generate smart defaults on initialization with country info
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaults>(() => 
    generateSmartDefaults(safeMode, undefined, departureCountry, destinationCountry)
  )
  
  // User input state - ONLY the fields user needs to fill
  const [userInput, setUserInput] = useState<Partial<UserInputFields>>(initialUserInput)
  
  // Update transport mode and regenerate defaults
  const updateTransportMode = useCallback((newMode: TransportMode) => {
    setSmartDefaults(generateSmartDefaults(newMode, userInput.destinationOverride, departureCountry, destinationCountry))
  }, [userInput.destinationOverride, departureCountry, destinationCountry])
  
  // Update user input fields
  const updateUserInput = useCallback(<K extends keyof UserInputFields>(
    field: K, 
    value: UserInputFields[K]
  ) => {
    setUserInput(prev => ({ ...prev, [field]: value }))
    
    // If destination changes, update airport code
    if (field === 'destinationOverride' && typeof value === 'string') {
      setSmartDefaults(prev => ({
        ...prev,
        airportOfDestination: value,
        airportOfDestinationCode: getLocationCode(value, prev.transportMode),
        // Recalculate estimated arrival based on new destination
        estimatedArrivalDate: formatWaybillDate(
          calculateEstimatedDelivery(prev.departureDate, prev.transportMode, value)
        ),
      }))
    }
  }, [setUserInput, setSmartDefaults])
  
  // Regenerate waybill number (if user wants a new one)
  const regenerateWaybillNumber = useCallback(() => {
    setSmartDefaults((prev) => {
      const carrierProfile = getCarrierProfileForMode(prev.transportMode)
      return {
      ...prev,
      waybillNumber: generateWaybillNumber(prev.transportMode),
      trackingNumber: generateTrackingId(prev.transportMode),
      carrierReference: carrierProfile.carrierReference,
      iataCode: carrierProfile.transportCode,
      }
    })
  }, [])
  
  // Combine smart defaults with user input for complete form data
  const completeFormData: WaybillFormData = useMemo(() => {
    // Determine departure and destination - STRICTLY use user input only, no fallbacks to defaults
    // This ensures dashboard selections are the only source of truth
    const departure = userInput.portOfDeparture || (departureCountry ? formatModeLocation(departureCountry, smartDefaults.transportMode) : '')
    const destination = userInput.portOfDestination || (destinationCountry ? formatModeLocation(destinationCountry, smartDefaults.transportMode) : '')
    
    return {
      // Smart defaults (system generated)
      ...smartDefaults,
      
      // User input - Updated field names to match output
      shipperName: userInput.shipperName,
      shipperAddress: userInput.shipperAddress,
      shipperPhone: userInput.shipperPhone,
      consigneeName: userInput.consigneeName,
      consigneeAddress: userInput.consigneeAddress,
      consigneePhone: userInput.consigneePhone,
      cargoDescription: userInput.cargoDescription,
      contents: userInput.cargoDescription, // Alias for PDF output
      totalWeight: userInput.totalWeight,
      totalPieces: userInput.totalPieces,
      isFragile: userInput.isFragile,
      isExpress: userInput.isExpress,
      isDangerousGoods: userInput.isDangerousGoods,
      specialInstructions: userInput.specialInstructions,
      
      // Routing Information - User selected departure/destination (PRIORITY)
      portOfDeparture: departure,
      portOfDestination: destination,
      airportOfDeparture: departure, // Mirror for PDF compatibility
      airportOfDestination: destination, // Mirror for PDF compatibility
      
      // Line Items for PDF
      items: userInput.lineItems?.map(item => ({
        noOfPcs: item.pieces,
        typeOfPkg: item.type,
        description: item.description,
        grossWeight: item.weight,
        dimensions: item.dimensions || { length: 0, width: 0, height: 0 }
      })) || [],
      
      // Charges & Fees
      baseFreight: userInput.baseFreight,
      insurance: userInput.insurance,
      airportTaxVat: userInput.airportTaxVat,
      destinationDuty: userInput.destinationDuty,
      
      // Legacy field mappings for compatibility
      senderName: userInput.shipperName,
      senderAddress: userInput.shipperAddress,
      senderPhone: userInput.shipperPhone,
      receiverName: userInput.consigneeName,
      receiverAddress: userInput.consigneeAddress,
      receiverTelephone: userInput.consigneePhone,
      receiverCity: userInput.receiverCity,
      routeNumber: userInput.routeNumber,
      paymentStatus: userInput.paymentStatus || 'NOT PAID',
      packageDescription: userInput.cargoDescription, // Legacy alias
      weight: userInput.totalWeight,
      pieces: userInput.totalPieces,
      numberOfPieces: userInput.totalPieces, // Legacy alias
      
      // Legacy serviceType structure
      serviceType: {
        diplomaticCourier: false,
        domestic: smartDefaults.transportMode === 'LAND',
        worldMail: smartDefaults.transportMode === 'AIR',
        repairReturn: false,
        doorToDoor: smartDefaults.transportMode === 'DOOR_TO_DOOR',
      },
      
      // Company Logo
      logoUrl: SKYSHIP_CONFIG.logo,
      senderLogoUrl: SKYSHIP_CONFIG.logo,
      
      // Additional metadata
      transportMode: smartDefaults.transportMode,
      waybillNumber: smartDefaults.waybillNumber,
      trackingNumber: smartDefaults.trackingNumber,
      consignmentNumber: smartDefaults.consignmentNumber,
      departureDate: smartDefaults.departureDate,
      arrivalDate: smartDefaults.estimatedArrivalDate,
      status: smartDefaults.status,
    }
  }, [smartDefaults, userInput, departureCountry, destinationCountry])
  
  // Reset all data
  const reset = useCallback(() => {
    setSmartDefaults(generateSmartDefaults(safeMode, undefined, departureCountry, destinationCountry))
    setUserInput(initialUserInput)
  }, [safeMode, departureCountry, destinationCountry])
  
  // Check if required fields are filled
  const isValid = useMemo(() => {
    return !!(
      userInput.shipperName &&
      userInput.shipperAddress &&
      userInput.shipperPhone &&
      userInput.consigneeName &&
      userInput.consigneeAddress &&
      userInput.consigneePhone &&
      userInput.cargoDescription &&
      userInput.totalWeight &&
      userInput.totalWeight > 0
    )
  }, [userInput])
  
  return {
    // Smart defaults (read-only system generated data)
    smartDefaults,
    
    // User input (editable)
    userInput,
    updateUserInput,
    
    // Actions
    updateTransportMode,
    regenerateWaybillNumber,
    reset,
    
    // Combined data for form submission
    completeFormData,
    
    // Validation
    isValid,
    
    // Transport config
    transportConfig: TRANSPORT_CONFIG[safeMode],
  }
}

// Hook for address book functionality
export function useAddressBook() {
  // In a real app, this would fetch from localStorage or API
  const [savedAddresses, setSavedAddresses] = useState<Array<{
    id: string
    name: string
    address: string
    phone: string
    type: 'shipper' | 'consignee'
  }>>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('parcelpoint_address_book')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return []
        }
      }
    }
    return []
  })
  
  const saveAddress = useCallback((address: {
    name: string
    address: string
    phone: string
    type: 'shipper' | 'consignee'
  }) => {
    const newAddress = {
      id: `addr_${Date.now()}`,
      ...address,
    }
    
    setSavedAddresses(prev => {
      const updated = [...prev, newAddress]
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('parcelpoint_address_book', JSON.stringify(updated))
      }
      return updated
    })
    
    return newAddress.id
  }, [])
  
  const deleteAddress = useCallback((id: string) => {
    setSavedAddresses(prev => {
      const updated = prev.filter(addr => addr.id !== id)
      if (typeof window !== 'undefined') {
        localStorage.setItem('parcelpoint_address_book', JSON.stringify(updated))
      }
      return updated
    })
  }, [])
  
  const getAddressesByType = useCallback((type: 'shipper' | 'consignee') => {
    return savedAddresses.filter(addr => addr.type === type)
  }, [savedAddresses])
  
  return {
    savedAddresses,
    saveAddress,
    deleteAddress,
    getAddressesByType,
  }
}

export default useSmartDefaults
