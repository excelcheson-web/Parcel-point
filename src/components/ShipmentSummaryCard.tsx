import React from 'react';

interface ShipmentSummaryCardProps {
  waybillNumber: string;
  currentStatus: string;
  currentLocation: string;
  bookingDate: string;
  estimatedDeliveryDate: string;
  shipmentMode: string;
  serviceType: string;
}

export const ShipmentSummaryCard: React.FC<ShipmentSummaryCardProps> = ({
  waybillNumber,
  currentStatus,
  currentLocation,
  bookingDate,
  estimatedDeliveryDate,
  shipmentMode,
  serviceType,
}) => (
  <div className="card mb-6 p-6 bg-white/90 rounded-xl shadow-lg">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
      <div className="text-lg font-bold text-gray-800">Tracking #: {waybillNumber}</div>
      <div className="inline-block px-4 py-2 rounded-full bg-lime-100 text-lime-700 font-semibold text-base shadow">
        {currentStatus}
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-700">
      <div><span className="font-semibold">Current Location:</span> {currentLocation}</div>
      <div><span className="font-semibold">Booking Date:</span> {bookingDate}</div>
      <div><span className="font-semibold">Est. Delivery:</span> {estimatedDeliveryDate}</div>
      <div><span className="font-semibold">Shipment Mode:</span> {shipmentMode}</div>
      <div><span className="font-semibold">Service Type:</span> {serviceType}</div>
    </div>
  </div>
);
