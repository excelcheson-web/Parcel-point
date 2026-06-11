import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQs',
  description:
    'Find answers to frequently asked questions about Parcel Point Logistics — shipping, tracking, customs, packaging, insurance, and more.',
  keywords: [
    'shipping FAQ',
    'logistics FAQ',
    'parcel questions',
    'freight questions',
    'tracking help',
    'customs clearance FAQ',
  ],
  openGraph: {
    title: 'FAQs | Parcel Point Logistics',
    description:
      'Find answers to frequently asked questions about Parcel Point Logistics — shipping, tracking, customs, packaging, insurance, and more.',
    url: 'https://parcelpointlogistics.com/faqs',
  },
  twitter: {
    title: 'FAQs | Parcel Point Logistics',
    description:
      'Find answers to frequently asked questions about Parcel Point Logistics — shipping, tracking, customs, packaging, insurance, and more.',
  },
  alternates: {
    canonical: 'https://parcelpointlogistics.com/faqs',
  },
}

export default function FaqsLayout({ children }: { children: React.ReactNode }) {
  return children
}
