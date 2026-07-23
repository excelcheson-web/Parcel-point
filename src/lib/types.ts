/**
 * Represents the status of a shipment at any given time.
 */
export type WaybillStatus = 'Pending' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'Cancelled' | 'Returned';

/**
 * Basic contact information for parties involved in the shipment.
 */
interface ContactInfo {
  name: string;
  phoneNumber: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Individual item entries within the shipment.
 */
interface ShipmentItem {
  description: string;
  quantity: number;
  weightKg: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'cm' | 'in';
  };
  value?: number;
  currency?: string;
}

/**
 * The primary Waybill structure.
 */
export interface Waybill {
  waybillNumber: string; // Unique tracking identifier
  orderReference?: string; // Internal order ID or SKU
  createdDate: string; // ISO 8601 format
  status: WaybillStatus;
  
  sender: ContactInfo;
  receiver: ContactInfo;
  
  items: ShipmentItem[];
  
  totalWeight: number;
  totalVolume?: number;
  shippingService: 'Standard' | 'Express' | 'Overnight';
  
  notes?: string;
  requiresSignature: boolean;
}

// Dimensions table item for waybill
export interface WaybillItem {
  noOfPcs: number;
  typeOfPkg: 'Box' | 'Pallet' | 'Carton' | 'Crate' | 'Bag' | 'Other';
  description: string;
  grossWeight: number; // in KG
  value?: number; // declared value of this line item
  dimensions: {
    length: number;
    width: number;
    height: number;
  }; // in CM
}

export interface WaybillCurrentLocationDetails {
  facility?: string;
  city?: string;
  stateOrProvince?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  scannedAt?: string;
  timezone?: string;
}

export interface WaybillDocumentAuthenticity {
  documentId?: string;
  verificationId?: string;
  verificationCode?: string;
  qrVerificationCode?: string;
  checksumHash?: string;
  digitalSeal?: string;
  generatedAt?: string;
  generatedBy?: string;
}

export interface WaybillRouteMetrics {
  progressPercent?: number;
  totalDistanceKm?: number;
  distanceTraveledKm?: number;
  distanceRemainingKm?: number;
  estimatedTransitProgress?: number;
}

export interface WaybillPackageRecord {
  packageId?: string;
  parentWaybillNumber?: string;
  trackingNumber?: string;
  description?: string;
  pieces?: number;
  weight?: number;
  status?: string;
}

export interface WaybillIntegrationReadiness {
  liveGps?: {
    provider?: string;
    deviceId?: string;
    latitude?: number;
    longitude?: number;
    lastPingAt?: string;
  };
  warehouseScans?: TrackingEventRecord[];
  customsScans?: TrackingEventRecord[];
  carrierIntegration?: {
    provider?: string;
    externalTrackingId?: string;
    lastSyncedAt?: string;
  };
  flightIntegration?: {
    airlineCode?: string;
    flightNumber?: string;
    departureAirport?: string;
    arrivalAirport?: string;
    scheduledDeparture?: string;
    scheduledArrival?: string;
  };
  vesselIntegration?: {
    carrierScac?: string;
    vesselName?: string;
    voyageNumber?: string;
    portOfLoading?: string;
    portOfDischarge?: string;
    eta?: string;
  };
}

// Smart Defaults - Auto-generated system data
export interface SmartDefaults {
  // System Generated Identifiers
  waybillNumber: string;
  trackingNumber: string;
  consignmentNumber: string;
  
  // Auto-filled Dates
  dateOfIssue: string;
  departureDate: string;
  estimatedArrivalDate: string;
  
  // Auto-filled Carrier Info
  issuingCarrier: string;
  carrierReference: string;
  iataCode: string;
  agentName: string;
  agentCity: string;
  
  // Auto-filled Location Info
  airportOfDeparture: string;
  airportOfDepartureCode: string;
  airportOfDestination: string;
  airportOfDestinationCode: string;
  
  // Auto-filled Service Info
  serviceType: string;
  transportMode: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR';
  currency: string;
  
  // Auto-filled Terms
  termsAndConditions: string;
  handlingInformation: string;
  
  // System Metadata
  createdAt: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
}

// User Input Only - Fields that require manual entry
export interface UserInputFields {
  // Shipper Information (REQUIRED)
  shipperName: string;
  shipperAddress: string;
  shipperPhone: string;
  shipperEmail?: string;
  
  // Consignee Information (REQUIRED)
  consigneeName: string;
  consigneeAddress: string;
  consigneePhone: string;
  consigneeEmail?: string;
  
  // Package Information (REQUIRED) - Description of Goods
  cargoDescription: string;  // Matches PDF output "Description of Goods"
  contents: string;           // Alias for cargoDescription
  totalWeight: number;
  totalPieces: number;        // Changed from numberOfPieces to match output
  
  // Line Items (Multiple packages)
  lineItems: {
    description: string;
    pieces: number;
    weight: number;
    type: 'Box' | 'Pallet' | 'Carton' | 'Crate' | 'Bag' | 'Other';
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  }[];
  
  // Optional Enhancements
  isFragile: boolean;
  isExpress: boolean;
  isDangerousGoods: boolean;  // For dangerous goods checkbox
  specialInstructions?: string;
  
  // Charges & Fees (NEW - Added to match PDF output)
  baseFreight: number;      // Base freight charge
  insurance: number;        // Insurance charge
  airportTaxVat: number;    // Airport tax/VAT
  destinationDuty: number;  // Destination duty
  declaredValue?: number;   // Declared customs value of the shipment
  
  // Optional Override (user can change auto-filled values if needed)
  destinationOverride?: string;
  departureDateOverride?: string;
  
  // Routing Information (Optional - can be set via country dropdowns)
  portOfDeparture?: string;
  portOfDestination?: string;
  
  // Additional Fields for PDF Output
  receiverCity?: string;
  routeNumber?: string;
  paymentStatus?: 'PAID' | 'NOT PAID' | 'PARTIAL PAYMENT' | 'PAYMENT PENDING' | 'CASH ON DELIVERY';
}

// Waybill form data interface - PRIMARY (flexible for both legacy and new usage)
export interface WaybillFormData {
  // === CORE IDENTIFIERS (Auto-generated) ===
  waybillNumber?: string;
  trackingNumber?: string;
  consignmentNumber?: string;
  
  // === SENDER INFORMATION (User Input) ===
  senderAccountNo?: string;
  senderName?: string;
  senderAddress?: string;
  senderPhone?: string;
  shipperName?: string;
  shipperAddress?: string;
  shipperPhone?: string;
  shipperEmail?: string;
  
  // === RECEIVER INFORMATION (User Input) ===
  receiverName?: string;
  receiverAddress?: string;
  receiverTelephone?: string;
  receiverPhone?: string;
  receiverCity?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  consigneePhone?: string;
  consigneeEmail?: string;
  
  // === PACKAGE INFORMATION (User Input) ===
  packageDescription?: string;
  cargoDescription?: string;
  contents?: string;
  totalWeight?: number;
  weight?: number;
  dimensions?: string;
  numberOfPieces?: number;
  pieces?: number;
  isFragile?: boolean;
  isExpress?: boolean;
  specialInstructions?: string;
  
  // === LOGISTICS INFORMATION (Auto-filled / User Override) ===
  accountNumber?: string;
  carrierReference?: string;
  transportMode?: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR';
  issuingCarrier?: string;
  iataCode?: string;
  agentName?: string;
  agentCity?: string;
  
  // === ROUTING INFORMATION (Auto-filled / User Override) ===
  portOfDeparture?: string;
  portOfDestination?: string;
  airportOfDeparture?: string;
  airportOfDestination?: string;
  routeNumber?: string;

  // === PRECISE GEO (origin + final delivery) — drives map zoom & pinpoint ===
  originCity?: string;
  originProvince?: string;
  originCountryCode?: string; // ISO2
  originLat?: number;
  originLng?: number;
  destCity?: string;
  destProvince?: string;
  destCountryCode?: string; // ISO2
  destLat?: number;
  destLng?: number;
  deliveryLocality?: string; // finer locality/address line shown at the pinpoint
  toCode?: string;
  byFirstCarrier?: string;
  firstCarrier?: string;
  routing?: string;
  flightNumber?: string;
  vesselName?: string;
  voyageNumber?: string;
  courierPartner?: string;
  
  // === DATES (Auto-filled / User Override) ===
  departureDate?: string;
  arrivalDate?: string;
  dateOfIssue?: string;
  estimatedArrivalDate?: string;
  estimatedDeliveryDate?: string;
  createdAt?: string;
  
  // === SERVICE TYPE (Legacy structure) ===
  serviceType?: {
    diplomaticCourier: boolean;
    domestic: boolean;
    worldMail: boolean;
    repairReturn: boolean;
    doorToDoor: boolean;
  };
  serviceTypeString?: string;
  
  // === DIMENSIONS TABLE (Legacy) ===
  items?: WaybillItem[];
  totalPieces?: number;
  totalGrossWeight?: number;
  
  // === FINANCIALS ===
  currency?: string;
  insurance?: number;
  airportTaxVat?: number;
  destinationDuty?: number;
  baseFreight?: number;
  currencyTotal?: number;
  declaredValue?: number;
  
  // === HANDLING INFORMATION ===
  handlingInformation?: string;
  isDangerousGoods?: boolean;
  dangerousGoodsDetails?: string;
  termsAndConditions?: string;
  
  // === SIGNATURES ===
  senderSignatureUrl?: string;
  officialStampUrl?: string;
  
  // === COMPANY LOGO ===
  logoUrl?: string;
  senderLogoUrl?: string;
  
  // === TRACKING INTEGRATION ===
  status?: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  currentStatus?: string;
  paymentStatus?: string;
  deliveredDate?: string;
  shipmentMode?: string;
  deliveryType?: 'DOOR_TO_DOOR' | 'OFFICE_PICKUP';
  currentLocation?: string;
  trackingEvents?: TrackingEventRecord[];
  transitHistory?: TransitEvent[];

  // === SECURITY / AUTHENTICITY LAYER ===
  documentId?: string;
  verificationId?: string;
  verificationCode?: string;
  qrVerificationCode?: string;
  checksumHash?: string;
  digitalSeal?: string;
  generatedAt?: string;
  generatedBy?: string;
  documentAuthenticity?: WaybillDocumentAuthenticity;

  // === CURRENT LOCATION / ROUTE INTELLIGENCE ===
  currentLocationDetails?: WaybillCurrentLocationDetails;
  currentFacility?: string;
  currentCity?: string;
  currentStateOrProvince?: string;
  currentCountry?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  currentLocationTimestamp?: string;
  routeMetrics?: WaybillRouteMetrics;
  transitProgressPercent?: number;
  totalDistanceKm?: number;
  distanceTraveledKm?: number;
  distanceRemainingKm?: number;

  // === PACKAGE HIERARCHY ===
  shipmentType?: string;
  masterWaybillNumber?: string;
  childPackages?: WaybillPackageRecord[];

  // === FUTURE API READINESS ===
  integrationReadiness?: WaybillIntegrationReadiness;
  liveGps?: WaybillIntegrationReadiness['liveGps'];
  warehouseScans?: TrackingEventRecord[];
  customsScans?: TrackingEventRecord[];
  carrierIntegration?: WaybillIntegrationReadiness['carrierIntegration'];
  flightIntegration?: WaybillIntegrationReadiness['flightIntegration'];
  vesselIntegration?: WaybillIntegrationReadiness['vesselIntegration'];
  
  // === LEGACY COMPATIBILITY ===
  // Allow any additional fields for backward compatibility
  [key: string]: unknown;
}

// Legacy waybill form data interface - FOR TYPE SAFETY IN LEGACY COMPONENTS
export interface LegacyWaybillFormData extends Required<Pick<WaybillFormData, 
  'senderAccountNo' | 'senderName' | 'senderAddress' |
  'receiverName' | 'receiverAddress' | 'receiverTelephone' |
  'waybillNumber' | 'accountNumber' | 'carrierReference' | 'transportMode' |
  'portOfDeparture' | 'portOfDestination' | 'routeNumber' |
  'items' | 'totalPieces' | 'totalGrossWeight' |
  'departureDate' | 'arrivalDate' | 'serviceType' |
  'senderSignatureUrl' | 'officialStampUrl' | 'consignmentNumber' | 'createdAt'
>> {
  serviceType: {
    diplomaticCourier: boolean;
    domestic: boolean;
    worldMail: boolean;
    repairReturn: boolean;
    doorToDoor: boolean;
  };
}

// Transit event for tracking
export interface TransitEvent {
  date: string;
  location: string;
  status: string;
  description: string;
}

// Simplified Waybill Data for Admin Dashboard
export interface SimplifiedWaybillData {
  // User Input Only
  shipper: {
    name: string;
    address: string;
    phone: string;
  };
  consignee: {
    name: string;
    address: string;
    phone: string;
  };
  package: {
    description: string;
    weight: number;
    pieces: number;
    isFragile: boolean;
    isExpress: boolean;
  };
  
  // System Generated (Auto-filled)
  waybillNumber: string;
  trackingNumber: string;
  date: string;
  carrier: string;
  origin: string;
  destination: string;
  estimatedDelivery: string;
  
  // Optional
  specialInstructions?: string;
}

export interface DocumentConfig {
  companyName: string;
  logoUrl: string;
  type: 'RECEIPT' | 'WAYBILL';
  items: { description: string; quantity: number; price?: number }[];
  origin: string;
  destination: string;
  trackingNumber: string;
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  // New professional fields
  receiptNumber?: string;
  dateOfIssue?: string;
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'POS' | 'Credit Card';
  currency?: 'USD' | 'EUR' | 'GBP' | 'CHF' | 'SEK' | 'NOK' | 'DKK' | 'PLN' | 'CZK' | 'JPY' | 'CNY' | 'INR' | 'KRW' | 'SGD' | 'HKD' | 'CAD' | 'MXN' | 'BRL' | 'ARS' | 'CLP' | 'PHP';
  signatureUrl?: string;
  applyStamp?: boolean;
  notes?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  customerName?: string;
  customerAddress?: string;
  taxRate?: number;
  paid?: number;
  balance?: number;
  description?: string; // NEW: Receipt description/memo
  transferMode?: string; // NEW: Mode of transfer (e.g., Bank Transfer - Wire)
  receiptDescription?: string; // NEW: Detailed receipt description
  signeeName?: string;
  stampUrl?: string;
  receiptFormat?: 'classic' | 'modern' | 'minimal' | 'executive';
  // Extended business branding
  companyCaption?: string;
  companyWebsite?: string;
  primaryColor?: string;
  secondaryColor?: string;
  // Extended customer info
  customerPhone?: string;
  customerEmail?: string;
  // Extended receipt identifiers
  paymentDate?: string;
  transactionReference?: string;
  orderNumber?: string;
  invoiceNumber?: string;
  // Payment status badge
  paymentStatus?: 'PAID' | 'PENDING' | 'PART_PAYMENT' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  // Separate terms from notes
  receiptTerms?: string;
  // Footer and generation info
  footerMessage?: string;
  generatedBy?: string;
  // Waybill specific data
  waybillData?: WaybillFormData;
}

// Unified tracking event shape stored in Firestore
export interface TrackingEventRecord {
  status: string;
  location: string;
  description: string;
  eventTime: string;
  isHold?: boolean;
  holdReason?: string; // Structured hold reason (e.g. "Customs Examination — Goods Under Inspection")
  // Optional precise coordinates of where this scan happened. When present the
  // map traces the true city-by-city path instead of guessing from the label.
  lat?: number;
  lng?: number;
}

// Firestore waybill document shape (supports both old and new fields)
export interface StoredWaybill extends Omit<Partial<WaybillFormData>, 'serviceType'> {
  waybillNumber: string;
  trackingNumber?: string;

  senderName?: string;
  senderPhone?: string;
  senderAddress?: string;
  shipperName?: string;
  shipperPhone?: string;
  shipperAddress?: string;

  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  consigneeName?: string;
  consigneePhone?: string;
  consigneeAddress?: string;

  origin?: string;
  destination?: string;
  portOfDeparture?: string;
  portOfDestination?: string;

  // Precise geo (origin + final delivery) — drives map zoom & pinpoint
  originCity?: string;
  originProvince?: string;
  originCountryCode?: string;
  originLat?: number;
  originLng?: number;
  destCity?: string;
  destProvince?: string;
  destCountryCode?: string;
  destLat?: number;
  destLng?: number;
  deliveryLocality?: string;
  receiverCity?: string;

  shipmentMode?: string;
  transportMode?: 'AIR' | 'SEA' | 'LAND' | 'DOOR_TO_DOOR';
  serviceType?: string | WaybillFormData['serviceType'];
  serviceTypeString?: string;

  parcelDescription?: string;
  cargoDescription?: string;
  packageDescription?: string;
  quantity?: number;
  pieces?: number;
  totalPieces?: number;
  weight?: number;
  totalWeight?: number;
  dimensions?: string;
  specialInstructions?: string;

  currentStatus?: string;
  currentLocation?: string;
  paymentStatus?: string;
  bookingDate?: string;
  estimatedDeliveryDate?: string;
  estimatedArrivalDate?: string;
  deliveredDate?: string;

  createdAt?: string;
  updatedAt?: string;
  dateOfIssue?: string;

  trackingEvents?: TrackingEventRecord[];
  deliveryType?: 'DOOR_TO_DOOR' | 'OFFICE_PICKUP';
  timelineOnHold?: boolean;

  documentId?: string;
  verificationId?: string;
  verificationCode?: string;
  qrVerificationCode?: string;
  checksumHash?: string;
  digitalSeal?: string;
  generatedAt?: string;
  generatedBy?: string;
  documentAuthenticity?: WaybillDocumentAuthenticity;

  currentLocationDetails?: WaybillCurrentLocationDetails;
  currentFacility?: string;
  currentCity?: string;
  currentStateOrProvince?: string;
  currentCountry?: string;
  currentLatitude?: number;
  currentLongitude?: number;
  currentLocationTimestamp?: string;
  routeMetrics?: WaybillRouteMetrics;
  transitProgressPercent?: number;
  totalDistanceKm?: number;
  distanceTraveledKm?: number;
  distanceRemainingKm?: number;

  shipmentType?: string;
  masterWaybillNumber?: string;
  childPackages?: WaybillPackageRecord[];

  integrationReadiness?: WaybillIntegrationReadiness;
  liveGps?: WaybillIntegrationReadiness['liveGps'];
  warehouseScans?: TrackingEventRecord[];
  customsScans?: TrackingEventRecord[];
  carrierIntegration?: WaybillIntegrationReadiness['carrierIntegration'];
  flightIntegration?: WaybillIntegrationReadiness['flightIntegration'];
  vesselIntegration?: WaybillIntegrationReadiness['vesselIntegration'];
}
