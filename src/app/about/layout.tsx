import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Learn about Parcel Point Logistics — our mission, values, and global team dedicated to delivering reliable international shipping and freight services across 200+ countries.',
  keywords: [
    'about Parcel Point Logistics',
    'logistics company',
    'international freight company',
    'global shipping experts',
    'about us',
  ],
  openGraph: {
    title: 'About Us | Parcel Point Logistics',
    description:
      'Learn about Parcel Point Logistics — our mission, values, and global team dedicated to delivering reliable international shipping and freight services across 200+ countries.',
    url: 'https://parcelpointlogistics.com/about',
  },
  twitter: {
    title: 'About Us | Parcel Point Logistics',
    description:
      'Learn about Parcel Point Logistics — our mission, values, and global team dedicated to delivering reliable international shipping and freight services across 200+ countries.',
  },
  alternates: {
    canonical: 'https://parcelpointlogistics.com/about',
  },
}

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children
}
