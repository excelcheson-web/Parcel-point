'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const stats = [
  { value: '200+', label: 'Countries Served' },
  { value: '50K+', label: 'Shipments Delivered' },
  { value: '24/7', label: 'Customer Support' },
  { value: '99.8%', label: 'On-Time Delivery' },
]

const whyChoose = [
  {
    title: 'Precision Tracking',
    desc: 'Monitor every shipment with minute-by-minute accuracy through our real-time global tracking platform.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#A855F7]">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    title: 'Global Reach, Local Expertise',
    desc: 'With hubs across key international corridors, we navigate customs and regulations so you never have to.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#A855F7]">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    title: 'Adaptive Solutions',
    desc: 'From a single parcel to industrial-scale cargo, our logistics architecture scales to your exact needs.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#A855F7]">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    title: 'Security & Accountability',
    desc: 'Industry-leading safety protocols and a dedicated team of professionals protect every shipment we handle.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-[#A855F7]">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
]

const coreValues = [
  {
    title: 'Customer First',
    desc: 'Our customers are at the center of everything we do. We listen, respond, and exceed expectations.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-[#A855F7]">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    title: 'Innovation',
    desc: 'We embrace technology and new ideas to improve efficiency and stay ahead in a rapidly evolving industry.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-[#A855F7]">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      </svg>
    ),
  },
  {
    title: 'Reliability',
    desc: 'Trust is earned through consistency. We are dedicated to dependable services you can count on every time.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-[#A855F7]">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    title: 'Global Connection',
    desc: 'We connect people and businesses worldwide, creating opportunities through seamless logistics.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7 text-[#A855F7]">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
]

export default function AboutPage() {
  const { t } = useTranslation()

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
            <Link href="/" className="nav-link text-sm">{t.nav.home}</Link>
            <Link href="/about" className="nav-link text-sm bg-white/15 border-white/30">{t.nav.about}</Link>
            <Link href="/services" className="nav-link text-sm">{t.nav.services}</Link>
            <Link href="/#track" className="nav-link text-sm">{t.nav.track}</Link>
            <Link href="/contact" className="nav-link text-sm">{t.nav.contact}</Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* purple glow orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#7C3AED]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-[#A855F7] text-sm font-semibold tracking-widest uppercase mb-5">
              <span className="w-8 h-px bg-[#7C3AED]" />
              About Parcel Point
              <span className="w-8 h-px bg-[#7C3AED]" />
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6 tracking-tight">
              Delivering Trust,<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg, #A855F7, #7C3AED)' }}>
                Across Every Border
              </span>
            </h1>
            <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
              We make global shipping simple, transparent, and reliable — for businesses of every size and individuals everywhere.
            </p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.label} className="glass-card p-6 text-center">
                <p className="text-3xl sm:text-4xl font-bold text-[#A855F7] mb-1">{s.value}</p>
                <p className="text-white/60 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">

            {/* Mission */}
            <div className="glass-panel p-8 sm:p-10 flex flex-col" style={{ borderColor: 'rgba(124,58,237,0.4)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#A855F7]">
                    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                    <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
                    <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
                  </svg>
                </div>
                <span className="text-[#A855F7] text-xs font-bold uppercase tracking-widest">Our Mission</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">
                Making Global Shipping Simple & Reliable
              </h2>
              <p className="text-white/75 leading-relaxed flex-1">
                At Parcel Point, our mission is to make global shipping simple, transparent, and reliable for businesses and individuals. We are committed to connecting people, products, and opportunities through innovative logistics solutions that provide real-time visibility, dependable delivery, and exceptional customer service. Every shipment entrusted to us is handled with care, precision, and accountability.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-white/10">
                {['Simple', 'Transparent', 'Reliable'].map((tag) => (
                  <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">{tag}</span>
                ))}
              </div>
            </div>

            {/* Vision */}
            <div className="glass-panel p-8 sm:p-10 flex flex-col" style={{ borderColor: 'rgba(124,58,237,0.4)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/40 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[#A855F7]">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                    <line x1="12" y1="5" x2="12" y2="3"/><line x1="17.5" y1="6.5" x2="19" y2="5"/>
                    <line x1="21" y1="12" x2="23" y2="12"/><line x1="6.5" y1="6.5" x2="5" y2="5"/>
                  </svg>
                </div>
                <span className="text-[#A855F7] text-xs font-bold uppercase tracking-widest">Our Vision</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">
                A Trusted Global Leader in Logistics
              </h2>
              <p className="text-white/75 leading-relaxed flex-1">
                Our vision is to become a trusted global leader in logistics and parcel delivery by transforming the way shipments move across borders. We aim to build a smarter and more connected logistics network that empowers businesses to grow, supports international trade, and gives customers complete confidence in every delivery journey.
              </p>
              <div className="flex flex-wrap gap-2 mt-6 pt-5 border-t border-white/10">
                {['Global Leader', 'Smart Network', 'Customer Confidence'].map((tag) => (
                  <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full bg-[#7C3AED]/20 text-[#A855F7] border border-[#7C3AED]/30">{tag}</span>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Who We Are ── */}
      <section className="py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="glass-panel p-6 sm:p-8" style={{ borderColor: 'rgba(124,58,237,0.3)' }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 rounded-full bg-[#7C3AED]" />
              <h2 className="text-lg font-bold text-white">Who We Are</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#A855F7]"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold mb-1">Simple &amp; Reliable</p>
                  <p className="text-white/60 text-xs leading-relaxed">Global shipping made simple, transparent, and reliable for businesses and individuals.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#A855F7]"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold mb-1">Connected Worldwide</p>
                  <p className="text-white/60 text-xs leading-relaxed">Connecting people, products, and opportunities through innovative logistics with real-time visibility.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/20 border border-[#7C3AED]/30 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#A855F7]"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold mb-1">Care &amp; Accountability</p>
                  <p className="text-white/60 text-xs leading-relaxed">Every shipment handled with care, precision, and accountability — exceptional service, every time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Parcel Point ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-[#A855F7] text-xs font-bold uppercase tracking-widest mb-3">Why Us</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why Choose Parcel Point?</h2>
            <p className="text-white/60 max-w-xl mx-auto">Built for reliability, designed for growth — here&apos;s what sets us apart.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {whyChoose.map((item) => (
              <div key={item.title} className="glass-card p-6 group hover:border-[#7C3AED]/60 hover:-translate-y-1 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center mb-4 group-hover:bg-[#7C3AED]/25 transition-colors">
                  {item.icon}
                </div>
                <h3 className="text-white font-bold mb-2 text-base">{item.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Core Values ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-[#A855F7] text-xs font-bold uppercase tracking-widest mb-3">What Drives Us</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Our Core Values</h2>
            <p className="text-white/60 max-w-xl mx-auto">The principles that define every decision we make and every shipment we handle.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {coreValues.map((v) => (
              <div key={v.title} className="glass-card p-6 text-center group hover:border-[#7C3AED]/60 hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-[#7C3AED]/15 border border-[#7C3AED]/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  {v.icon}
                </div>
                <h3 className="text-white font-bold mb-2">{v.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl p-8 sm:p-14 text-center" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(91,33,182,0.4) 100%)', border: '1px solid rgba(124,58,237,0.4)' }}>
            <div className="absolute inset-0 bg-[#7C3AED]/5 backdrop-blur-sm" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Ready to Ship with Confidence?</h2>
              <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of businesses and individuals who trust Parcel Point for every delivery.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact" className="parcelpoint-button px-8 py-4 text-base font-bold inline-block text-center">
                  Get in Touch
                </Link>
                <Link href="/services" className="glass-button px-8 py-4 text-base font-semibold inline-block text-center text-white">
                  Explore Services
                </Link>
              </div>
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
