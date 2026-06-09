import React from 'react';

interface ShipmentDetailsCardProps {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  origin: string;
  destination: string;
  parcelDescription: string;
  quantity: number;
  weight: number;
  dimensions: string;
  paymentStatus: string;
  specialInstructions?: string;
}

export const ShipmentDetailsCard: React.FC<ShipmentDetailsCardProps> = ({
  senderName,
  senderPhone,
  senderAddress,
  receiverName,
  receiverPhone,
  receiverAddress,
  origin,
  destination,
  parcelDescription,
  quantity,
  weight,
  dimensions,
  paymentStatus,
  specialInstructions,
}) => (
  <div className="card p-6 bg-white/90 rounded-xl shadow mb-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <div className="font-semibold mb-1">Sender</div>
        <div>{senderName}</div>
        <div className="text-xs text-gray-500">{senderPhone}</div>
        <div className="text-xs text-gray-500 mb-2">{senderAddress}</div>
        <div className="font-semibold mb-1">Origin</div>
        <div>{origin}</div>
      </div>
      <div>
        <div className="font-semibold mb-1">Receiver</div>
        <div>{receiverName}</div>
        <div className="text-xs text-gray-500">{receiverPhone}</div>
        <div className="text-xs text-gray-500 mb-2">{receiverAddress}</div>
        <div className="font-semibold mb-1">Destination</div>
        <div>{destination}</div>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-sm">
      <div><span className="font-semibold">Parcel:</span> {parcelDescription}</div>
      <div><span className="font-semibold">Quantity:</span> {quantity}</div>
      <div><span className="font-semibold">Weight:</span> {weight}</div>
      <div><span className="font-semibold">Dimensions:</span> {dimensions}</div>
      <div><span className="font-semibold">Payment Status:</span> {paymentStatus}</div>
      {specialInstructions && <div><span className="font-semibold">Special Instructions:</span> {specialInstructions}</div>}
    </div>
  </div>
);
