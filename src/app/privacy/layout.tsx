import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Read the Parcel Point Logistics Privacy Policy to understand how we collect, use, and protect your personal information when you use our shipping and logistics services.',
  keywords: ['privacy policy', 'data protection', 'personal information', 'Parcel Point privacy'],
  openGraph: {
    title: 'Privacy Policy | Parcel Point Logistics',
    description:
      'Read the Parcel Point Logistics Privacy Policy to understand how we collect, use, and protect your personal information when you use our shipping and logistics services.',
    url: 'https://parcelpointlogistics.com/privacy',
  },
  twitter: {
    title: 'Privacy Policy | Parcel Point Logistics',
    description:
      'Read the Parcel Point Logistics Privacy Policy to understand how we collect, use, and protect your personal information.',
  },
  alternates: {
    canonical: 'https://parcelpointlogistics.com/privacy',
  },
}

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children
}
