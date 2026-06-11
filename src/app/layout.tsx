import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/LanguageContext";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const BASE_URL = 'https://parcelpointlogistics.com'
const OG_IMAGE = '/parcel-point-hero-logistics.png'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Parcel Point Logistics | Global Shipping and Parcel Tracking',
    template: '%s | Parcel Point Logistics',
  },
  description:
    'Track parcels in real time, manage international shipments, and access reliable logistics services worldwide with Parcel Point Logistics.',
  keywords: [
    'parcel tracking',
    'international shipping',
    'global logistics',
    'freight services',
    'shipping company',
    'cargo delivery',
    'air freight',
    'ocean freight',
    'parcel point logistics',
  ],
  authors: [{ name: 'Parcel Point Logistics', url: BASE_URL }],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: 'website',
    siteName: 'Parcel Point Logistics',
    url: BASE_URL,
    title: 'Parcel Point Logistics | Global Shipping and Parcel Tracking',
    description:
      'Track parcels in real time, manage international shipments, and access reliable logistics services worldwide with Parcel Point Logistics.',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Parcel Point Logistics' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Parcel Point Logistics | Global Shipping and Parcel Tracking',
    description:
      'Track parcels in real time, manage international shipments, and access reliable logistics services worldwide with Parcel Point Logistics.',
    images: [OG_IMAGE],
  },
  alternates: {
    canonical: BASE_URL,
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Parcel Point Logistics',
  url: BASE_URL,
  logo: `${BASE_URL}/parcel-point-logo.png`,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+63-956-988-3401',
      contactType: 'customer service',
      areaServed: 'PH',
      availableLanguage: 'English',
    },
    {
      '@type': 'ContactPoint',
      telephone: '+44-839-528-4814',
      contactType: 'customer service',
      areaServed: 'GB',
      availableLanguage: 'English',
    },
  ],
  email: 'hello@parcelpoint.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '42 Harbor Avenue',
    addressLocality: 'London',
    addressCountry: 'GB',
    addressRegion: 'England',
  },
  sameAs: [],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Parcel Point Logistics',
  url: BASE_URL,
  description:
    'Track parcels in real time, manage international shipments, and access reliable logistics services worldwide.',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/track/{search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${spaceGrotesk.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="parcel-point-theme min-h-full flex flex-col" suppressHydrationWarning>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
