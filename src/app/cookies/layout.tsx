import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookies Policy',
  description:
    'Learn how Parcel Point Logistics uses cookies and similar technologies to improve your browsing experience and provide personalised content.',
  keywords: ['cookies policy', 'cookie settings', 'website cookies', 'Parcel Point cookies'],
  openGraph: {
    title: 'Cookies Policy | Parcel Point Logistics',
    description:
      'Learn how Parcel Point Logistics uses cookies and similar technologies to improve your browsing experience.',
    url: 'https://parcelpointlogistics.com/cookies',
  },
  twitter: {
    title: 'Cookies Policy | Parcel Point Logistics',
    description:
      'Learn how Parcel Point Logistics uses cookies and similar technologies to improve your browsing experience.',
  },
  alternates: {
    canonical: 'https://parcelpointlogistics.com/cookies',
  },
}

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return children
}
