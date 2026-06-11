import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Services',
  description:
    'Explore Parcel Point Logistics services — air freight, ocean freight, road transport, warehousing, and door-to-door delivery. Fast, reliable global cargo solutions.',
  keywords: [
    'air freight',
    'ocean freight',
    'road transport',
    'warehousing',
    'door-to-door delivery',
    'cargo services',
    'logistics services',
    'international freight',
  ],
  openGraph: {
    title: 'Our Services | Parcel Point Logistics',
    description:
      'Explore Parcel Point Logistics services — air freight, ocean freight, road transport, warehousing, and door-to-door delivery. Fast, reliable global cargo solutions.',
    url: 'https://parcelpointlogistics.com/services',
  },
  twitter: {
    title: 'Our Services | Parcel Point Logistics',
    description:
      'Explore Parcel Point Logistics services — air freight, ocean freight, road transport, warehousing, and door-to-door delivery. Fast, reliable global cargo solutions.',
  },
  alternates: {
    canonical: 'https://parcelpointlogistics.com/services',
  },
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children
}
