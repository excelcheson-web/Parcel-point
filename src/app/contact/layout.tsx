import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with Parcel Point Logistics. Our team is available 24/7 to assist with shipping inquiries, freight quotes, tracking support, and customer service.',
  keywords: [
    'contact Parcel Point',
    'logistics support',
    'shipping inquiry',
    'freight quote',
    'customer service',
    'logistics helpline',
  ],
  openGraph: {
    title: 'Contact Us | Parcel Point Logistics',
    description:
      'Get in touch with Parcel Point Logistics. Our team is available 24/7 to assist with shipping inquiries, freight quotes, tracking support, and customer service.',
    url: 'https://parcelpointlogistics.com/contact',
  },
  twitter: {
    title: 'Contact Us | Parcel Point Logistics',
    description:
      'Get in touch with Parcel Point Logistics. Our team is available 24/7 to assist with shipping inquiries, freight quotes, tracking support, and customer service.',
  },
  alternates: {
    canonical: 'https://parcelpointlogistics.com/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children
}
