import type { StoredWaybill } from '@/lib/types'

const MOCK_WAYBILLS: StoredWaybill[] = [
  {
    waybillNumber: 'AWB-45281109',
    trackingNumber: 'AWB-45281109',
    senderName: 'Atlas BioChem Ltd.',
    senderPhone: '+1 206 555 0199',
    senderAddress: '901 Harbor Ave, Seattle, WA, USA',
    receiverName: 'Northline Medical Supplies',
    receiverPhone: '+44 20 7946 0848',
    receiverAddress: '24 Dockside Road, London, United Kingdom',
    origin: 'Seattle, USA',
    destination: 'London, UK',
    shipmentMode: 'AIR',
    serviceTypeString: 'Priority Air Freight',
    paymentStatus: 'Prepaid',
    parcelDescription: 'Temperature-safe laboratory consumables',
    quantity: 6,
    weight: 128.5,
    dimensions: '6 crates (120 x 80 x 95 cm each)',
    specialInstructions: 'Keep dry and upright during transfer.',
    currentStatus: 'In Transit',
    currentLocation: 'Reykjavik Air Cargo Hub',
    bookingDate: '2026-03-30T07:35:00Z',
    estimatedDeliveryDate: '2026-04-05T15:00:00Z',
    createdAt: '2026-03-30T07:35:00Z',
    updatedAt: '2026-04-03T03:20:00Z',
    trackingEvents: [
      {
        status: 'Shipment Received',
        location: 'Seattle Cargo Facility',
        description: 'Shipment accepted and security screening completed.',
        eventTime: '2026-03-30T07:35:00Z',
      },
      {
        status: 'Shipment Created',
        location: 'Seattle Cargo Facility',
        description: 'Waybill generated and documentation validated.',
        eventTime: '2026-03-30T08:10:00Z',
      },
      {
        status: 'Processing',
        location: 'Seattle Cargo Facility',
        description: 'Cargo sorted and prepared for departure loading.',
        eventTime: '2026-03-30T10:55:00Z',
      },
      {
        status: 'Dispatched',
        location: 'Seattle-Tacoma International Airport',
        description: 'Shipment departed origin airport.',
        eventTime: '2026-03-31T01:40:00Z',
      },
      {
        status: 'In Transit',
        location: 'Reykjavik Air Cargo Hub',
        description: 'Cargo transferred to connecting flight.',
        eventTime: '2026-04-03T03:20:00Z',
      },
    ],
  },
  {
    waybillNumber: 'SWB-88917422',
    trackingNumber: 'SWB-88917422',
    senderName: 'Helios Auto Parts GmbH',
    senderPhone: '+49 40 555 0123',
    senderAddress: '7 Speicherstadt, Hamburg, Germany',
    receiverName: 'Pacific Drive Industries',
    receiverPhone: '+1 310 555 0421',
    receiverAddress: '390 Marina Way, Long Beach, CA, USA',
    origin: 'Hamburg, Germany',
    destination: 'Long Beach, USA',
    shipmentMode: 'SEA',
    serviceTypeString: 'Ocean Consolidated',
    paymentStatus: 'Collect',
    parcelDescription: 'Containerized vehicle drive assemblies',
    quantity: 42,
    weight: 9340,
    dimensions: '1 x 40ft container',
    specialInstructions: 'Handle as heavy machinery.',
    currentStatus: 'Arrived at Destination Hub',
    currentLocation: 'Port of Long Beach',
    bookingDate: '2026-03-15T12:00:00Z',
    estimatedDeliveryDate: '2026-04-07T17:00:00Z',
    createdAt: '2026-03-15T12:00:00Z',
    updatedAt: '2026-04-02T22:40:00Z',
    trackingEvents: [
      {
        status: 'Shipment Received',
        location: 'Hamburg Inland Depot',
        description: 'Container received and sealed.',
        eventTime: '2026-03-15T12:00:00Z',
      },
      {
        status: 'Processing',
        location: 'Port of Hamburg',
        description: 'Export customs and vessel allocation complete.',
        eventTime: '2026-03-16T08:15:00Z',
      },
      {
        status: 'Dispatched',
        location: 'Port of Hamburg',
        description: 'Vessel departed origin port.',
        eventTime: '2026-03-17T05:40:00Z',
      },
      {
        status: 'In Transit',
        location: 'Pacific Ocean Route',
        description: 'Shipment is on scheduled marine transit.',
        eventTime: '2026-03-28T16:20:00Z',
      },
      {
        status: 'Arrived at Destination Hub',
        location: 'Port of Long Beach',
        description: 'Container discharged and awaiting final clearance.',
        eventTime: '2026-04-02T22:40:00Z',
      },
    ],
  },
  {
    waybillNumber: 'DTD-00459217',
    trackingNumber: 'DTD-00459217',
    senderName: 'Kigali Fine Coffee Exporters',
    senderPhone: '+250 788 555 300',
    senderAddress: '11 KN Avenue, Kigali, Rwanda',
    receiverName: 'Nordic Specialty Roasters',
    receiverPhone: '+46 8 555 7001',
    receiverAddress: '42 Sodermalm Street, Stockholm, Sweden',
    origin: 'Kigali, Rwanda',
    destination: 'Stockholm, Sweden',
    shipmentMode: 'DOOR_TO_DOOR',
    serviceTypeString: 'Door-to-Door Express',
    paymentStatus: 'Prepaid',
    parcelDescription: 'Premium coffee bean samples',
    quantity: 12,
    weight: 245,
    dimensions: '12 cartons (40 x 30 x 28 cm each)',
    specialInstructions: 'Do not expose to moisture.',
    currentStatus: 'Out for Delivery',
    currentLocation: 'Stockholm City Distribution Center',
    bookingDate: '2026-04-01T06:20:00Z',
    estimatedDeliveryDate: '2026-04-03T14:30:00Z',
    createdAt: '2026-04-01T06:20:00Z',
    updatedAt: '2026-04-03T08:05:00Z',
    trackingEvents: [
      {
        status: 'Shipment Received',
        location: 'Kigali Pickup Point',
        description: 'Packages collected from sender premises.',
        eventTime: '2026-04-01T06:20:00Z',
      },
      {
        status: 'Shipment Created',
        location: 'Kigali Operations Center',
        description: 'Shipment profile created and manifested.',
        eventTime: '2026-04-01T06:55:00Z',
      },
      {
        status: 'Dispatched',
        location: 'Kigali International Airport',
        description: 'Shipment dispatched for destination region.',
        eventTime: '2026-04-01T11:45:00Z',
      },
      {
        status: 'In Transit',
        location: 'Copenhagen Transit Hub',
        description: 'Linehaul completed and handed to destination carrier.',
        eventTime: '2026-04-02T15:10:00Z',
      },
      {
        status: 'Arrived at Destination Hub',
        location: 'Stockholm Gateway',
        description: 'Shipment received at destination gateway.',
        eventTime: '2026-04-03T02:25:00Z',
      },
      {
        status: 'Out for Delivery',
        location: 'Stockholm City Distribution Center',
        description: 'Courier en route to final consignee address.',
        eventTime: '2026-04-03T08:05:00Z',
      },
    ],
  },
]

function normalizeTrackingKey(value: string): string {
  return value.trim().toUpperCase()
}

export function getMockWaybillByTrackingNumber(trackingNumber: string): StoredWaybill | null {
  const lookup = normalizeTrackingKey(trackingNumber)
  if (!lookup) return null

  const match = MOCK_WAYBILLS.find((item) => {
    return (
      normalizeTrackingKey(item.waybillNumber || '') === lookup ||
      normalizeTrackingKey(item.trackingNumber || '') === lookup
    )
  })

  return match ?? null
}

export function listMockTrackingNumbers(): string[] {
  return MOCK_WAYBILLS.map((item) => item.trackingNumber || item.waybillNumber)
}
