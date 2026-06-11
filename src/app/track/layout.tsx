import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Track Your Parcel',
  description:
    'Track your parcel with Parcel Point Logistics. Enter your waybill or tracking number to get up-to-date shipment status and delivery updates.',
  keywords: [
    'track parcel',
    'track shipment',
    'parcel tracking',
    'shipment status',
    'cargo tracking',
    'waybill lookup',
    'parcel point tracking',
  ],
  openGraph: {
    title: 'Track Your Parcel | Parcel Point Logistics',
    description:
      'Track your parcel with Parcel Point Logistics. Enter your waybill or tracking number to get up-to-date shipment status and delivery updates.',
    url: 'https://parcelpointlogistics.com/track',
  },
  twitter: {
    title: 'Track Your Parcel | Parcel Point Logistics',
    description:
      'Track your parcel with Parcel Point Logistics. Enter your waybill or tracking number to get up-to-date shipment status and delivery updates.',
  },
  alternates: {
    canonical: 'https://parcelpointlogistics.com/track',
  },
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return children
}
