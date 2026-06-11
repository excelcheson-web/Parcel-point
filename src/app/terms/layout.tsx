import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description:
    'Review the Terms and Conditions governing your use of Parcel Point Logistics services, including shipping agreements, liability limitations, and service policies.',
  keywords: ['terms and conditions', 'shipping terms', 'service agreement', 'Parcel Point terms', 'logistics terms'],
  openGraph: {
    title: 'Terms & Conditions | Parcel Point Logistics',
    description:
      'Review the Terms and Conditions governing your use of Parcel Point Logistics services, including shipping agreements, liability limitations, and service policies.',
    url: 'https://parcelpointlogistics.com/terms',
  },
  twitter: {
    title: 'Terms & Conditions | Parcel Point Logistics',
    description:
      'Review the Terms and Conditions governing your use of Parcel Point Logistics services.',
  },
  alternates: {
    canonical: 'https://parcelpointlogistics.com/terms',
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
