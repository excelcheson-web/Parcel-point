'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const faqs = [
  {
    question: "How do I track my shipment?",
    answer: "You can track your shipment by entering your tracking number on our homepage. Simply type your tracking number (e.g., PP-AWB-1234-2026) in the tracking field and click 'Track'. You'll see real-time updates on your shipment's location and estimated delivery time."
  },
  {
    question: "What shipping services do you offer?",
    answer: "We offer comprehensive logistics solutions including Air Freight for time-sensitive deliveries, Ocean Freight for cost-effective large shipments, Road Freight for domestic and cross-border transport, and Warehousing with inventory management systems."
  },
  {
    question: "How long does shipping take?",
    answer: "Delivery times vary by service: Air Freight typically takes 1-3 business days, Ocean Freight takes 10-30 days depending on the route, and Road Freight varies from same-day to 5 business days based on distance. You can get specific estimates when booking your shipment."
  },
  {
    question: "What are your shipping rates?",
    answer: "Our rates depend on factors like weight, dimensions, destination, and service type. We offer competitive pricing with no hidden fees. Contact our sales team for a custom quote or use our online calculator for estimates."
  },
  {
    question: "Do you offer international shipping?",
    answer: "Yes! We provide global shipping services to over 200 countries and territories. We handle all customs documentation and clearance procedures to ensure smooth international delivery."
  },
  {
    question: "What items can I ship?",
    answer: "We handle most commercial goods, documents, and personal items. However, prohibited items include hazardous materials, illegal goods, perishables (without proper packaging), and items restricted by destination countries. Contact us if you're unsure about specific items."
  },
  {
    question: "How do I prepare my shipment?",
    answer: "Proper packaging is essential: use sturdy boxes, cushion items with bubble wrap or foam, seal packages securely with tape, and clearly label with recipient information. For fragile items, mark the package as 'FRAGILE' and use additional padding."
  },
  {
    question: "What happens if my shipment is delayed?",
    answer: "While we strive for on-time delivery, delays can occur due to weather, customs, or other factors. We provide real-time tracking updates and proactive notifications. If your shipment is significantly delayed, our customer support team will work to resolve the issue."
  },
  {
    question: "Do you provide insurance for shipments?",
    answer: "Yes, we offer shipment insurance to protect against loss or damage. Basic coverage is included, and you can purchase additional insurance for high-value items. Claims can be filed through our customer support portal."
  },
  {
    question: "How can I contact customer support?",
    answer: "Our customer support is available 24/7 via multiple channels: Live Chat on our website, email at hello@parcelpoint.com, phone at +234 800 727 2357, or through our Help Center with detailed guides and tutorials."
  }
]

export default function FAQsPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="min-h-screen mesh-gradient">
      <header className="glass-header sticky top-0 z-50 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden">
              <Image src="/parcel-point-logo.png" alt="Parcel Point Logo" fill className="object-cover" sizes="40px" priority />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">Parcel Point</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="nav-link text-sm">Home</Link>
            <Link href="/about" className="nav-link text-sm">About</Link>
            <Link href="/services" className="nav-link text-sm">Services</Link>
            <Link href="/contact" className="nav-link text-sm">Contact</Link>
          </nav>
          <Link href="/" className="glass-button px-4 py-2 text-sm text-white">← Back</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-12 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-high-contrast mb-4">Frequently Asked Questions</h1>
          <div className="w-16 h-1 bg-[#7C3AED] mx-auto rounded-full mb-4"></div>
          <p className="text-white/70 text-lg">
            Find answers to common questions about our logistics services
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="glass-panel overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <span className="text-white font-semibold text-lg pr-4">
                  {faq.question}
                </span>
                <svg
                  className={`w-6 h-6 text-[#7C3AED] shrink-0 transition-transform ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-6">
                  <p className="text-white/80 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-white/70 mb-4">Still have questions?</p>
          <Link href="/contact" className="parcelpoint-button px-8 py-3 inline-block font-bold">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  )
}
