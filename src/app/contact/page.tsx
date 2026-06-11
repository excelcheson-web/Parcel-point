'use client'

import Link from 'next/link'
import Image from 'next/image'
import ContactForm from '@/components/ContactForm'
import { COMPANY_CONTACT } from '@/lib/constants'

const contactCards = [
  {
    label: 'Email Us',
    value: 'hello@parcelpoint.com',
    sub: 'We reply within 2 business hours',
    href: 'mailto:hello@parcelpoint.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#A855F7]">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  {
    label: 'Call Us',
    value: COMPANY_CONTACT.phone,
    sub: 'Available 24/7',
    href: `tel:${COMPANY_CONTACT.phonePH.replace(/\D/g, '')}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#A855F7]">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.61 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    value: 'Chat with us instantly',
    sub: 'Fastest response channel',
    href: `https://wa.me/${COMPANY_CONTACT.whatsapp}`,
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-[#25D366]">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
      </svg>
    ),
  },
  {
    label: 'Our Office',
    value: COMPANY_CONTACT.address,
    sub: 'Mon – Fri, 8am – 6pm',
    href: '#',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#A855F7]">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
]

const businessHours = [
  { day: 'Monday – Friday', hours: '8:00 AM – 6:00 PM' },
  { day: 'Saturday', hours: '9:00 AM – 3:00 PM' },
  { day: 'Sunday', hours: 'Emergency line only' },
]

export default function ContactPage() {
  return (
    <div className="mesh-gradient min-h-screen" style={{ fontFamily: '"Manrope", ui-sans-serif, system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <header className="glass-header px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-[#7C3AED]/30">
              <Image src="/parcel-point-logo.png" alt="Parcel Point Logo" fill className="object-cover" sizes="40px" priority />
            </div>
            <span className="text-xl font-bold text-white hidden sm:block">Parcel Point</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Link href="/" className="nav-link text-sm">Home</Link>
            <Link href="/about" className="nav-link text-sm">About</Link>
            <Link href="/services" className="nav-link text-sm">Services</Link>
            <Link href="/#track" className="nav-link text-sm">Track</Link>
            <Link href="/contact" className="nav-link text-sm bg-white/15 border-white/30">Contact</Link>
          </nav>
          <Link href="/" className="glass-button px-4 py-2 text-sm text-white">← Back</Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-10 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-[#7C3AED]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative text-center">
          <span className="inline-flex items-center gap-2 text-[#A855F7] text-sm font-semibold tracking-widest uppercase mb-5">
            <span className="w-8 h-px bg-[#7C3AED]" />
            Get in Touch
            <span className="w-8 h-px bg-[#7C3AED]" />
          </span>
          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-5 tracking-tight">
            We&apos;re Here to{' '}
            <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #A855F7, #7C3AED)' }}>
              Help
            </span>
          </h1>
          <p className="text-white/65 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            Have a question, need a quote, or want to track a shipment? Our team is ready to assist you — reach us through any channel below.
          </p>
        </div>
      </section>

      {/* ── Contact Cards ── */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {contactCards.map((card) => (
            <a
              key={card.label}
              href={card.href}
              target={card.href.startsWith('http') ? '_blank' : undefined}
              rel={card.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="glass-card p-6 group hover:border-[#7C3AED]/60 hover:-translate-y-1 transition-all duration-300 block"
            >
              <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                {card.icon}
              </div>
              <p className="text-[#A855F7] text-xs font-bold uppercase tracking-wider mb-1">{card.label}</p>
              <p className="text-white font-semibold text-sm mb-1 leading-snug">{card.value}</p>
              <p className="text-white/50 text-xs">{card.sub}</p>
            </a>
          ))}
        </div>
      </section>

      {/* ── Main Content: Form + Sidebar ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-8">

          {/* ─ Contact Form (wider) ─ */}
          <div className="lg:col-span-3">
            <div className="glass-panel p-8 sm:p-10 h-full">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-6 rounded-full bg-[#7C3AED]" />
                  <h2 className="text-2xl font-bold text-white">Send Us a Message</h2>
                </div>
                <p className="text-white/60 text-sm ml-3">Fill out the form and we&apos;ll get back to you within 2 hours.</p>
              </div>
              <ContactForm />
            </div>
          </div>

          {/* ─ Sidebar ─ */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Business Hours */}
            <div className="glass-panel p-7" style={{ borderColor: 'rgba(124,58,237,0.35)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#A855F7]">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <h3 className="text-white font-bold">Business Hours</h3>
              </div>
              <ul className="space-y-3">
                {businessHours.map((b) => (
                  <li key={b.day} className="flex justify-between items-center py-2 border-b border-white/8 last:border-0">
                    <span className="text-white/65 text-sm">{b.day}</span>
                    <span className="text-white text-sm font-semibold">{b.hours}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs font-semibold">24/7 emergency line available</span>
              </div>
            </div>

            {/* Quick Reach */}
            <div className="glass-panel p-7" style={{ borderColor: 'rgba(124,58,237,0.35)' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#A855F7]">
                    <path d="m3 11 19-9-9 19-2-8-8-2z"/>
                  </svg>
                </div>
                <h3 className="text-white font-bold">Quick Actions</h3>
              </div>
              <div className="space-y-3">
                <a
                  href={`https://wa.me/${COMPANY_CONTACT.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#25D366]/10 border border-[#25D366]/25 hover:bg-[#25D366]/20 hover:border-[#25D366]/50 transition-all group"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-[#25D366] shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                  </svg>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold">Chat on WhatsApp</p>
                    <p className="text-white/50 text-xs">Fastest response</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white/30 ml-auto group-hover:text-white/60 transition-colors shrink-0">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </a>

                <a
                  href="mailto:hello@parcelpoint.com"
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/25 hover:bg-[#7C3AED]/20 hover:border-[#7C3AED]/50 transition-all group"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#A855F7] shrink-0">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold">Send an Email</p>
                    <p className="text-white/50 text-xs">hello@parcelpoint.com</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white/30 ml-auto group-hover:text-white/60 transition-colors shrink-0">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </a>

                <Link
                  href="/chat"
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 hover:border-white/30 transition-all group"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-white/60 shrink-0">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <div className="min-w-0">
                    <p className="text-white text-sm font-semibold">AI Live Chat</p>
                    <p className="text-white/50 text-xs">Instant automated support</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-white/30 ml-auto group-hover:text-white/60 transition-colors shrink-0">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </Link>
              </div>
            </div>

            {/* FAQ shortcut */}
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#A855F7]">
                  <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">Have a Common Question?</p>
                <p className="text-white/50 text-xs">Browse our FAQ page for instant answers.</p>
              </div>
              <Link href="/faqs" className="text-[#A855F7] text-sm font-semibold hover:text-white transition-colors shrink-0">
                View FAQs →
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="glass-footer px-4 sm:px-6 lg:px-8 py-12 mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                  <Image src="/parcel-point-logo.png" alt="Parcel Point Logo" fill className="object-cover" sizes="40px" />
                </div>
                <span className="text-xl font-bold text-white">Parcel Point</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                Your trusted partner for global logistics and supply chain solutions.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/" className="parcelpoint-footer-link">Home</Link></li>
                <li><Link href="/about" className="parcelpoint-footer-link">About Us</Link></li>
                <li><Link href="/services" className="parcelpoint-footer-link">Services</Link></li>
                <li><Link href="/#track" className="parcelpoint-footer-link">Track Parcel</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/contact" className="parcelpoint-footer-link">Contact Us</Link></li>
                <li><Link href="/faqs" className="parcelpoint-footer-link">FAQs</Link></li>
                <li><Link href="/chat" className="parcelpoint-footer-link">Live Chat</Link></li>
                <li><Link href="/staff" className="parcelpoint-footer-link">Staff Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/terms" className="parcelpoint-footer-link">Terms &amp; Conditions</Link></li>
                <li><Link href="/privacy" className="parcelpoint-footer-link">Privacy Policy</Link></li>
                <li><Link href="/cookies" className="parcelpoint-footer-link">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/40 text-sm">© 2026 Parcel Point. All rights reserved.</p>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-white/40">Follow us:</span>
              <a href="#" className="parcelpoint-footer-link hover:text-[#A855F7]">Twitter</a>
              <a href="#" className="parcelpoint-footer-link hover:text-[#A855F7]">LinkedIn</a>
              <a href="#" className="parcelpoint-footer-link hover:text-[#A855F7]">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
