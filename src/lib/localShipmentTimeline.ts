export type ShipmentMode = 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR'
export type DeliveryType = 'DOOR_TO_DOOR' | 'OFFICE_PICKUP'

export interface GeneratedTimelineEvent {
  id: string
  status: string
  location: string
  description: string
  eventTime: string
  isHold: boolean
}

export interface ShipmentTimelineInput {
  shipmentMode: ShipmentMode
  serviceType: string
  deliveryType: DeliveryType
  origin: string
  destination: string
  departureDate?: string
  estimatedDeliveryDate?: string
}

interface StageTemplate {
  status: string
  description: string
  locationRole: 'origin' | 'originHub' | 'inTransit' | 'destinationHub' | 'destination'
  hoursFromPrevious: number
}

const BASE_STAGE_TEMPLATES: Record<'AIR' | 'SEA' | 'LAND', StageTemplate[]> = {
  AIR: [
    {
      status: 'Shipment Received',
      description: 'Shipment accepted at origin operations center.',
      locationRole: 'origin',
      hoursFromPrevious: 0,
    },
    {
      status: 'Export Processing',
      description: 'Documentation review and export handling completed.',
      locationRole: 'originHub',
      hoursFromPrevious: 4,
    },
    {
      status: 'Departed Origin Airport',
      description: 'Cargo loaded and departed from origin airport.',
      locationRole: 'originHub',
      hoursFromPrevious: 8,
    },
    {
      status: 'In Transit',
      description: 'Shipment is in line-haul air transit.',
      locationRole: 'inTransit',
      hoursFromPrevious: 10,
    },
    {
      status: 'Arrived at Destination Airport',
      description: 'Cargo arrived at destination airport and unloaded.',
      locationRole: 'destinationHub',
      hoursFromPrevious: 9,
    },
    {
      status: 'Import Clearance',
      description: 'Inbound customs and destination security checks completed.',
      locationRole: 'destinationHub',
      hoursFromPrevious: 6,
    },
  ],
  SEA: [
    {
      status: 'Shipment Received',
      description: 'Container accepted at origin container yard.',
      locationRole: 'origin',
      hoursFromPrevious: 0,
    },
    {
      status: 'Port Processing',
      description: 'Container gated in and export port formalities completed.',
      locationRole: 'originHub',
      hoursFromPrevious: 18,
    },
    {
      status: 'Vessel Departed',
      description: 'Shipment departed origin port on scheduled vessel.',
      locationRole: 'originHub',
      hoursFromPrevious: 26,
    },
    {
      status: 'Ocean Transit',
      description: 'Shipment is in ocean transit toward destination port.',
      locationRole: 'inTransit',
      hoursFromPrevious: 180,
    },
    {
      status: 'Arrived at Destination Port',
      description: 'Container discharged at destination port terminal.',
      locationRole: 'destinationHub',
      hoursFromPrevious: 56,
    },
    {
      status: 'Port Clearance',
      description: 'Import documentation and release processing completed.',
      locationRole: 'destinationHub',
      hoursFromPrevious: 24,
    },
  ],
  LAND: [
    {
      status: 'Shipment Received',
      description: 'Shipment accepted at origin dispatch point.',
      locationRole: 'origin',
      hoursFromPrevious: 0,
    },
    {
      status: 'Linehaul Planned',
      description: 'Route planning and loading sequence confirmed.',
      locationRole: 'originHub',
      hoursFromPrevious: 3,
    },
    {
      status: 'Dispatched',
      description: 'Vehicle departed origin terminal.',
      locationRole: 'originHub',
      hoursFromPrevious: 5,
    },
    {
      status: 'In Transit',
      description: 'Shipment is moving through the linehaul corridor.',
      locationRole: 'inTransit',
      hoursFromPrevious: 20,
    },
    {
      status: 'Arrived at Destination Hub',
      description: 'Shipment received at destination distribution hub.',
      locationRole: 'destinationHub',
      hoursFromPrevious: 14,
    },
    {
      status: 'Final Sort',
      description: 'Final mile routing and release completed.',
      locationRole: 'destinationHub',
      hoursFromPrevious: 4,
    },
  ],
}

const ENDING_STAGE_TEMPLATES: Record<DeliveryType, StageTemplate[]> = {
  DOOR_TO_DOOR: [
    {
      status: 'Out for Delivery',
      description: 'Shipment assigned to final-mile courier for doorstep delivery.',
      locationRole: 'destination',
      hoursFromPrevious: 6,
    },
    {
      status: 'Delivered',
      description: 'Shipment delivered to consignee and delivery completed.',
      locationRole: 'destination',
      hoursFromPrevious: 4,
    },
  ],
  OFFICE_PICKUP: [
    {
      status: 'Ready for Pickup',
      description: 'Shipment is ready for consignee pickup at service office.',
      locationRole: 'destinationHub',
      hoursFromPrevious: 5,
    },
    {
      status: 'Picked Up',
      description: 'Shipment released to consignee at office pickup counter.',
      locationRole: 'destinationHub',
      hoursFromPrevious: 12,
    },
  ],
}

function safeLocation(value: string, fallback: string): string {
  const trimmed = value.trim()
  return trimmed || fallback
}

function resolveBaseMode(shipmentMode: ShipmentMode, serviceType: string): 'AIR' | 'SEA' | 'LAND' {
  if (shipmentMode === 'AIR' || shipmentMode === 'SEA' || shipmentMode === 'LAND') return shipmentMode

  const normalizedService = serviceType.trim().toLowerCase()
  if (normalizedService.includes('air') || normalizedService.includes('priority') || normalizedService.includes('express')) return 'AIR'
  if (normalizedService.includes('sea') || normalizedService.includes('ocean') || normalizedService.includes('vessel')) return 'SEA'
  return 'LAND'
}

function resolveServiceMultiplier(serviceType: string): number {
  const normalized = serviceType.trim().toLowerCase()
  if (normalized.includes('priority') || normalized.includes('express') || normalized.includes('urgent')) return 0.78
  if (normalized.includes('economy') || normalized.includes('deferred') || normalized.includes('standard')) return 1.2
  return 1
}

function resolveStageLocation(
  role: StageTemplate['locationRole'],
  origin: string,
  destination: string,
  shipmentMode: 'AIR' | 'SEA' | 'LAND'
): string {
  if (role === 'origin') return origin
  if (role === 'destination') return destination
  if (role === 'inTransit') {
    if (shipmentMode === 'AIR') return 'International Air Corridor'
    if (shipmentMode === 'SEA') return 'International Sea Lane'
    return 'Regional Linehaul Route'
  }
  if (role === 'originHub') {
    if (shipmentMode === 'AIR') return `Origin Air Hub - ${origin}`
    if (shipmentMode === 'SEA') return `Origin Port Hub - ${origin}`
    return `Origin Land Hub - ${origin}`
  }
  if (shipmentMode === 'AIR') return `Destination Air Hub - ${destination}`
  if (shipmentMode === 'SEA') return `Destination Port Hub - ${destination}`
  return `Destination Land Hub - ${destination}`
}

function asDate(value?: string): Date {
  if (!value) return new Date()
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return new Date()
  return new Date(parsed)
}

function asTimestamp(value?: string): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  if (Number.isNaN(parsed)) return null
  return parsed
}

function buildEventId(index: number): string {
  return `evt-${index + 1}-${Date.now().toString(36)}`
}

export function generateLocalShipmentTimeline(input: ShipmentTimelineInput): GeneratedTimelineEvent[] {
  const origin = safeLocation(input.origin, 'Origin Facility')
  const destination = safeLocation(input.destination, 'Destination Facility')
  const baseMode = resolveBaseMode(input.shipmentMode, input.serviceType)
  const speedMultiplier = resolveServiceMultiplier(input.serviceType)

  const template = [...BASE_STAGE_TEMPLATES[baseMode], ...ENDING_STAGE_TEMPLATES[input.deliveryType]]

  const startDate = asDate(input.departureDate)
  const startMs = startDate.getTime()
  const estimatedDeliveryMs = asTimestamp(input.estimatedDeliveryDate)

  let elapsedMs = 0
  const cumulativeMs = template.map((stage, index) => {
    if (index === 0) return 0
    const offsetHours = Math.max(0, stage.hoursFromPrevious * speedMultiplier)
    elapsedMs += offsetHours * 60 * 60 * 1000
    return elapsedMs
  })

  const baseTotalMs = cumulativeMs[cumulativeMs.length - 1] || 0
  const useEstimatedWindow =
    estimatedDeliveryMs !== null &&
    estimatedDeliveryMs > startMs &&
    baseTotalMs > 0
  const targetWindowMs = useEstimatedWindow ? estimatedDeliveryMs - startMs : 0

  return template.map((stage, index) => {
    let eventMs = startMs + Math.round(cumulativeMs[index] || 0)
    if (useEstimatedWindow) {
      const ratio = (cumulativeMs[index] || 0) / baseTotalMs
      eventMs = startMs + Math.round(targetWindowMs * ratio)
      if (index === template.length - 1) {
        eventMs = estimatedDeliveryMs!
      }
    }

    return {
      id: buildEventId(index),
      status: stage.status,
      location: resolveStageLocation(stage.locationRole, origin, destination, baseMode),
      description: stage.description,
      eventTime: new Date(eventMs).toISOString(),
      isHold: false,
    }
  })
}
