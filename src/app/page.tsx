'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from '@/lib/i18n/useTranslation'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ChevronRight, Globe2, Headphones, Menu, PackageCheck, ShieldCheck, X, Zap } from 'lucide-react'
import { COMPANY_CONTACT } from '@/lib/constants'

const services = [
  {
    id: 'air',
    title: 'Air Freight',
    shortDesc: 'Speed Without Compromise',
    description: 'When time is your most valuable asset, Parcel Point\'s Air Freight solutions deliver. We leverage a global network of premium air carriers to ensure your high-priority cargo reaches any destination worldwide in record time.',
    image: 'https://images.unsplash.com/photo-1571086291540-b137111fa1c7?w=800&q=80',
    iconImage: 'https://images.unsplash.com/photo-1610642372677-bcddb69f3531?w=200&q=80',
  },
  {
    id: 'ocean',
    title: 'Ocean Freight',
    shortDesc: 'Global Reach, Scalable Solutions',
    description: 'For large-scale international trade, our Ocean Freight service offers the perfect balance of cost-efficiency and reliability. Whether FCL or LCL, we provide secure transit across all major sea lanes.',
    image: 'https://images.unsplash.com/photo-1606185540834-d6e7483ee1a4?w=800&q=80',
    iconImage: 'https://images.unsplash.com/photo-1670121180530-cfcba4438038?w=200&q=80',
  },
  {
    id: 'warehouse',
    title: 'Warehousing',
    shortDesc: 'Smart Storage & Inventory Control',
    description: 'Our state-of-the-art warehousing facilities are strategic hubs for your supply chain. Climate-controlled environments and advanced IMS ensure your goods are sorted, protected, and ready for rapid distribution.',
    image: 'https://images.unsplash.com/photo-1684695749267-233af13276d0?w=800&q=80',
    iconImage: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=200&q=80',
  },
  {
    id: 'road',
    title: 'Road Freight',
    shortDesc: 'Last-Mile Precision',
    description: 'The final link in the chain is often the most critical. Our Road Freight network spans continents, providing door-to-door delivery with a fleet of modern, GPS-tracked vehicles.',
    image: 'https://images.unsplash.com/photo-1616432043562-3671ea2e5242?w=800&q=80',
    iconImage: 'https://images.unsplash.com/photo-1695222833131-54ee679ae8e5?w=200&q=80',
  },
]

const testimonials = [
  {
    id: 1,
    name: 'Amara Osei',
    role: 'Chief Executive Officer',
    company: 'Westgate Exports Ltd.',
    image: 'https://images.unsplash.com/photo-1709810529099-0ce6102692df?w=300&q=80',
    text: 'Parcel Point completely redefined how we manage cross-continental freight. Their proactive customs support and live tracking eliminated weeks of delays we once treated as inevitable.',
  },
  {
    id: 2,
    name: 'James Harrington',
    role: 'Head of Procurement',
    company: 'NovaTech Industries',
    image: 'https://images.unsplash.com/photo-1718209881007-c0ecdfc00f9d?w=300&q=80',
    text: 'We needed a logistics partner who could match the pace of our global supply chain. Parcel Point delivered — their air freight network is unmatched, and their team anticipates problems before you even need to call.',
  },
  {
    id: 3,
    name: 'Priya Nair',
    role: 'Logistics Director',
    company: 'SilkRoute Trading Co.',
    image: 'https://images.unsplash.com/photo-1581065178047-8ee15951ede6?w=300&q=80',
    text: "The warehousing solution alone transformed our distribution model. Inventory accuracy jumped 38% in the first quarter. Parcel Point isn't just a courier — they've become a core part of our operation.",
  },
  {
    id: 4,
    name: 'Rafael Mendes',
    role: 'Import Manager',
    company: 'Meridian Wholesale Group',
    image: 'https://images.unsplash.com/photo-1553642618-de0381320ff3?w=300&q=80',
    text: 'From freight documentation to final delivery, every step is handled with a level of precision I have not experienced with any other provider. International shipping finally feels effortless.',
  },
]

const heroFeatures = [
  { title: 'Secure & Reliable', description: 'End-to-end protection on every shipment', Icon: ShieldCheck },
  { title: 'Real-time Updates', description: 'Live milestone updates, globally', Icon: Zap },
  { title: 'Global Coverage', description: '200+ countries and territories', Icon: Globe2 },
  { title: '24/7 Support', description: 'Round-the-clock logistics experts', Icon: Headphones },
]

const howItWorks = [
  {
    step: '01',
    title: 'Book Online',
    description: 'Schedule your shipment in minutes via our portal. Upload documents, set preferences, and get an instant quote.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>
      </svg>
    ),
  },
  {
    step: '02',
    title: 'We Collect',
    description: 'Our team picks up cargo from your premises, handling packaging inspection and all documentation.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    step: '03',
    title: 'Global Transit',
    description: 'Your shipment moves through our verified network with live tracking updates at every checkpoint.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
  },
  {
    step: '04',
    title: 'Delivered',
    description: 'Your shipment arrives on time. Digital proof of delivery and instant confirmation sent immediately.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
]

const techFeatures = [
  { title: 'Live GPS Tracking', desc: 'Sub-minute position updates on every active shipment' },
  { title: 'AI Route Optimisation', desc: 'Dynamic re-routing around delays and disruptions' },
  { title: 'Auto Customs Filing', desc: 'Digital documentation cleared before cargo lands' },
  { title: 'Instant Alerts', desc: 'Proactive notifications on milestones and exceptions' },
  { title: 'Secure Documentation', desc: 'Encrypted digital waybills and certificates of origin' },
  { title: 'Analytics Dashboard', desc: 'Real-time visibility across your full logistics portfolio' },
]

export default function Home() {
  const whatsappHref = `https://wa.me/${COMPANY_CONTACT.whatsapp}`
  const router = useRouter()
  const { t } = useTranslation()
  const [trackingNumber, setTrackingNumber] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showAllValues, setShowAllValues] = useState(false)

  const coreValues = [
    t.identity.values.customerFirst,
    t.identity.values.reliability,
    t.identity.values.transparency,
    t.identity.values.innovation,
    t.identity.values.integrity,
    t.identity.values.excellence,
    t.identity.values.globalConnection,
  ]

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const val = String(formData.get('trackingNumber') || trackingNumber).trim()
    if (val) router.push(`/track/${val}`)
  }

  return (
    <div className="pp-home-page min-h-screen relative">

      {/* ── HEADER (unchanged) ───────────────────────────────────────────── */}
      <header className="pp-home-header fixed top-0 left-0 right-0 z-50">
        <div className="pp-home-nav mx-auto flex items-center justify-between">
          <Link href="/" className="pp-brand-lockup flex items-center gap-3 shrink-0">
            <div className="pp-brand-mark relative overflow-hidden shrink-0">
              <Image src="/parcel-point-logo.png" alt="Parcel Point Logo" fill className="object-contain" sizes="56px" priority />
            </div>
            <span className="pp-brand-name whitespace-nowrap">Parcel Point</span>
          </Link>

          <nav className="pp-desktop-nav hidden md:flex items-center">
            <Link href="/" className="pp-home-nav-link pp-home-nav-link-active">{t.nav.home}</Link>
            <Link href="/about" className="pp-home-nav-link">{t.nav.about}</Link>
            <a href="#services" className="pp-home-nav-link">{t.nav.services}</a>
            <Link href="/track" className="pp-home-nav-link">{t.nav.track}</Link>
            <a href="/contact" className="pp-home-nav-link">{t.nav.contact}</a>
          </nav>

          <div className="pp-home-actions flex items-center">
            <LanguageSwitcher />
            <div className="pp-user-avatar">IA</div>
            <button className="pp-mobile-menu-button md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle mobile menu" aria-expanded={mobileMenuOpen}>
              {mobileMenuOpen ? <X className="h-6 w-6 text-white" /> : <Menu className="h-6 w-6 text-white" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 md:hidden" onClick={() => setMobileMenuOpen(false)} />
            <div className="pp-mobile-nav-panel md:hidden mx-3 mt-2 p-4 relative z-50">
              <nav className="flex flex-col gap-2">
                <Link href="/" className="pp-home-nav-link pp-home-nav-link-active py-3" onClick={() => setMobileMenuOpen(false)}>{t.nav.home}</Link>
                <Link href="/about" className="pp-home-nav-link py-3" onClick={() => setMobileMenuOpen(false)}>{t.nav.about}</Link>
                <a href="#services" className="pp-home-nav-link py-3" onClick={() => setMobileMenuOpen(false)}>{t.nav.services}</a>
                <Link href="/track" className="pp-home-nav-link py-3" onClick={() => setMobileMenuOpen(false)}>{t.nav.track}</Link>
                <a href="/contact" className="pp-home-nav-link py-3" onClick={() => setMobileMenuOpen(false)}>{t.nav.contact}</a>
                <div className="border-t border-white/20 pt-2 mt-2">
                  <span className="text-white/60 text-xs uppercase tracking-wider mb-2 block">Language</span>
                  <LanguageSwitcher />
                </div>
              </nav>
            </div>
          </>
        )}
      </header>

      {/* ── HERO (unchanged) ─────────────────────────────────────────────── */}
      <section id="track" className="pp-hero relative overflow-hidden">
        <div className="pp-hero-art" aria-hidden="true">
          <Image src="/parcel-point-hero-logistics.png" alt="" fill priority className="object-cover" sizes="100vw" />
        </div>
        <div className="pp-hero-overlay" aria-hidden="true" />
        <div className="pp-hero-grid-overlay" aria-hidden="true" />

        <div className="pp-hero-shell relative z-10 mx-auto">
          <div className="pp-hero-copy">
            <div className="pp-hero-eyebrow">
              <Globe2 className="h-5 w-5" aria-hidden="true" />
              <span>Global Reach. Reliable Delivery.</span>
            </div>
            <h1 className="pp-hero-title">
              <span>{t.hero.title1}</span>
              <span>{t.hero.title2}</span>
            </h1>
            <p className="pp-hero-subtitle">{t.hero.description}</p>

            <form onSubmit={handleTrack} className="pp-tracking-card">
              <div className="pp-tracking-heading">
                <div className="pp-tracking-icon">
                  <PackageCheck className="h-6 w-6" aria-hidden="true" />
                </div>
                <div>
                  <label className="pp-tracking-label" htmlFor="homepage-tracking-number">Track your shipment</label>
                  <p>Get real-time status on any active shipment</p>
                </div>
              </div>
              <div className="pp-tracking-row">
                <input
                  id="homepage-tracking-number"
                  name="trackingNumber"
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder={t.hero.placeholder}
                  className="pp-track-input"
                />
                <button type="submit" className="pp-track-button">
                  <span>{t.hero.trackButton}</span>
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <p className="pp-tracking-examples">{t.hero.example}</p>
            </form>
          </div>

          <div className="pp-live-card" aria-hidden="true">
            <span className="pp-live-dot" />
            <span>Real-time Tracking</span>
          </div>
        </div>

        <div className="pp-feature-strip relative z-10 mx-auto">
          {heroFeatures.map(({ title, description, Icon }) => (
            <div className="pp-feature-item" key={title}>
              <div className="pp-feature-icon"><Icon className="h-6 w-6" aria-hidden="true" /></div>
              <div><h3>{title}</h3><p>{description}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS STRIP ──────────────────────────────────────────────────── */}
      <section className="relative py-12 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'linear-gradient(135deg, rgba(124,58,237,0.07) 0%, transparent 60%, rgba(168,85,247,0.04) 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {[
              { value: '50K+', label: 'Shipments Delivered', sub: 'Globally per year', Icon: PackageCheck },
              { value: '200+', label: 'Countries Served', sub: 'Worldwide network', Icon: Globe2 },
              { value: '99.7%', label: 'On-Time Delivery', sub: 'Industry-leading rate', Icon: ShieldCheck },
              { value: '24/7', label: 'Expert Support', sub: 'Always available', Icon: Headphones },
            ].map(({ value, label, sub, Icon }, i) => (
              <div key={i} className="flex flex-col items-center text-center px-4 sm:px-8 py-8 gap-3" style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.25)' }}>
                  <Icon className="h-5 w-5 text-[#A855F7]" />
                </div>
                <p className="text-3xl sm:text-4xl font-black text-white tabular-nums">{value}</p>
                <div>
                  <p className="text-sm font-semibold text-white/80">{label}</p>
                  <p className="text-xs text-white/40 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <section id="services" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor" className="absolute -top-8 -right-12 w-64 h-64 text-white/[0.025] rotate-12">
            <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
          </svg>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
            <div>
              <span className="inline-flex items-center gap-2 text-[#A855F7] text-xs font-bold uppercase tracking-widest mb-3">
                <span className="w-6 h-px bg-[#7C3AED]" />
                What We Offer
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">{t.services.title}</h2>
              <p className="text-white/55 text-base mt-3 max-w-lg">{t.services.subtitle}</p>
            </div>
            <Link href="/services" className="parcelpoint-button px-6 py-3 shrink-0 self-start sm:self-auto text-sm font-semibold">
              {t.services.viewAll}
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((service, i) => (
              <Link
                key={service.id}
                href="/services"
                className="group relative rounded-2xl overflow-hidden cursor-pointer block"
                style={{ height: '320px', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #04111f 0%, rgba(4,17,31,0.55) 45%, transparent 100%)' }} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'rgba(124,58,237,0.12)' }} />

                <div className="absolute top-4 right-4 text-5xl font-black leading-none select-none" style={{ color: 'rgba(255,255,255,0.08)' }}>0{i + 1}</div>

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="relative w-10 h-10 mb-3 rounded-lg overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.5)', background: 'rgba(0,0,0,0.4)' }}>
                    <Image src={service.iconImage} alt="" fill className="object-cover opacity-80" sizes="40px" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    {((t.services as unknown) as Record<string, { title: string }>)[service.id]?.title || service.title}
                  </h3>
                  <p className="text-[#A855F7] text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all duration-300">
                    {((t.services as unknown) as Record<string, { shortDesc: string }>)[service.id]?.shortDesc || service.shortDesc}
                    <ChevronRight className="h-3 w-3 shrink-0" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(124,58,237,0.07) 0%, transparent 70%)' }} />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 text-[#A855F7] text-xs font-bold uppercase tracking-widest mb-3">
              <span className="w-6 h-px bg-[#7C3AED]" />
              Simplified Process
              <span className="w-6 h-px bg-[#7C3AED]" />
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">How It Works</h2>
            <p className="text-white/55 text-lg mt-4 max-w-lg mx-auto">From booking to doorstep — four steps, zero guesswork.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* connector line */}
            <div className="hidden lg:block absolute top-8 left-[calc(12.5%+2rem)] right-[calc(12.5%+2rem)] h-px pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.5) 20%, rgba(124,58,237,0.5) 80%, transparent)' }} />

            {howItWorks.map(({ step, title, description, icon }) => (
              <div key={step} className="relative flex flex-col items-center text-center gap-4 group">
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[#A855F7] transition-all duration-300 group-hover:scale-105" style={{ background: 'rgba(12,30,53,1)', border: '1px solid rgba(124,58,237,0.35)', boxShadow: '0 0 0 0 rgba(124,58,237,0)' }}>
                    {icon}
                  </div>
                  <span className="absolute -top-2 -right-2 text-[10px] font-black px-1.5 py-0.5 rounded-full font-mono" style={{ background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.4)', color: '#A855F7' }}>{step}</span>
                </div>
                <div>
                  <h3 className="text-white font-bold text-base mb-2">{title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TECHNOLOGY FEATURES ──────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(160deg, rgba(124,58,237,0.09) 0%, transparent 55%)' }} />
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">

            {/* Left copy */}
            <div>
              <span className="inline-flex items-center gap-2 text-[#A855F7] text-xs font-bold uppercase tracking-widest mb-4">
                <span className="w-6 h-px bg-[#7C3AED]" />
                Built for Modern Logistics
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-5 leading-tight">
                Technology That<br />Keeps Cargo Moving
              </h2>
              <p className="text-white/55 text-lg mb-10 leading-relaxed">
                Intelligent routing, real-time data, and automated compliance eliminate friction at every step of the supply chain.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {techFeatures.map(({ title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.4)' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#A855F7" strokeWidth="2.5" className="w-3 h-3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{title}</p>
                      <p className="text-white/45 text-xs mt-0.5 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/track" className="parcelpoint-button mt-10 px-7 py-3.5 inline-flex items-center gap-2 text-sm font-bold">
                See Live Tracking <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Right — mock tracking UI */}
            <div className="relative">
              <div className="absolute -inset-8 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, transparent 65%)' }} />
              <div className="relative rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.22)', background: 'rgba(7,18,37,0.95)', backdropFilter: 'blur(20px)' }}>
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                  <span className="ml-3 text-[11px] font-mono text-white/25">parcelpoint.com/track</span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Waybill row */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-white/35 uppercase tracking-wider mb-0.5">Waybill</p>
                      <p className="text-white font-bold font-mono text-sm">PP-AWB-20241107</p>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(163,230,53,0.12)', border: '1px solid rgba(163,230,53,0.3)', color: '#a3e635' }}>In Transit</span>
                  </div>

                  {/* Route progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] text-white/35">
                      <span>Singapore, SG</span>
                      <span>London, UK</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                      <div className="h-full w-3/5 rounded-full" style={{ background: 'linear-gradient(90deg, #7C3AED, #A855F7)', boxShadow: '0 0 8px rgba(168,85,247,0.5)' }} />
                    </div>
                    <p className="text-[10px] text-white/30 text-right">~60% complete</p>
                  </div>

                  {/* Timeline items */}
                  <div className="space-y-2.5 pt-1">
                    {[
                      { time: '09:42', location: 'Singapore Changi, SG', done: true },
                      { time: '14:15', location: 'Dubai Logistics Hub, UAE', done: true },
                      { time: '22:30', location: 'Dubai Airport, UAE', done: false },
                      { time: '06:00 +1', location: 'Heathrow Airport, UK', done: false },
                    ].map(({ time, location, done }) => (
                      <div key={time} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: done ? '#A855F7' : 'rgba(255,255,255,0.18)', boxShadow: done ? '0 0 5px rgba(168,85,247,0.6)' : 'none' }} />
                        <p className="flex-1 text-xs font-medium truncate" style={{ color: done ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)' }}>{location}</p>
                        <p className="text-[10px] font-mono shrink-0" style={{ color: done ? '#A855F7' : 'rgba(255,255,255,0.2)' }}>{time}</p>
                      </div>
                    ))}
                  </div>

                  {/* Live indicator */}
                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                    </span>
                    <span className="text-[10px] text-white/35">Live position updated 23s ago</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── COMPANY IDENTITY ─────────────────────────────────────────────── */}
      <section id="identity" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
          <svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="0.5" className="absolute -bottom-16 -right-16 w-96 h-96 text-white/[0.03]">
            <circle cx="100" cy="100" r="90"/>
            <ellipse cx="100" cy="100" rx="50" ry="90"/>
            <ellipse cx="100" cy="100" rx="90" ry="50"/>
            <line x1="10" y1="100" x2="190" y2="100"/>
            <line x1="100" y1="10" x2="100" y2="190"/>
          </svg>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-[#A855F7] text-xs font-bold uppercase tracking-widest mb-3">
              <span className="w-6 h-px bg-[#7C3AED]" />
              Our Identity
              <span className="w-6 h-px bg-[#7C3AED]" />
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.identity.title}</h2>
            <p className="text-white/55 text-base max-w-xl mx-auto">{t.identity.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            <div className="company-identity-card flex flex-col">
              <div className="identity-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
              </div>
              <h3 className="identity-heading">{t.identity.mission.title}</h3>
              <p className="identity-text flex-1">{t.identity.mission.text}</p>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                {['Simple', 'Transparent', 'Reliable'].map((tag) => (
                  <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A855F7' }}>{tag}</span>
                ))}
              </div>
            </div>

            <div className="company-identity-card flex flex-col">
              <div className="identity-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <h3 className="identity-heading">{t.identity.vision.title}</h3>
              <p className="identity-text flex-1">{t.identity.vision.text}</p>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
                {['Global Leader', 'Smart Network', 'Trusted Delivery'].map((tag) => (
                  <span key={tag} className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#A855F7' }}>{tag}</span>
                ))}
              </div>
            </div>

            <div className="company-identity-card flex flex-col">
              <div className="identity-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 3h12l4 6-10 13L2 9l4-6z"/>
                </svg>
              </div>
              <h3 className="identity-heading">{t.identity.values.title}</h3>
              <ul className="core-values-list flex-1">
                {coreValues.slice(0, 3).map((v, i) => <li key={i}>{v}</li>)}
                {showAllValues && coreValues.slice(3).map((v, i) => <li key={i + 3}>{v}</li>)}
              </ul>
              <button onClick={() => setShowAllValues(!showAllValues)} className="mt-4 pt-4 border-t border-white/10 text-sm font-semibold text-[#A855F7] hover:text-white transition-colors flex items-center gap-1 w-full">
                <span>{showAllValues ? 'Show less' : `Show ${coreValues.length - 3} more values`}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-4 h-4 transition-transform ${showAllValues ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS GRID ────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 text-[#A855F7] text-xs font-bold uppercase tracking-widest mb-3">
              <span className="w-6 h-px bg-[#7C3AED]" />
              Client Voices
              <span className="w-6 h-px bg-[#7C3AED]" />
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.testimonials.title}</h2>
            <p className="text-white/55 text-base max-w-xl mx-auto">{t.testimonials.subtitle}</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="relative p-6 sm:p-8 rounded-2xl overflow-hidden group transition-colors duration-300" style={{ background: 'rgba(10,24,46,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                <div className="absolute top-4 right-5 text-7xl font-serif leading-none select-none pointer-events-none" style={{ color: 'rgba(124,58,237,0.1)' }}>&ldquo;</div>

                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-[#A855F7]">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>

                <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-6 italic">&ldquo;{testimonial.text}&rdquo;</p>

                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ border: '2px solid rgba(124,58,237,0.4)' }}>
                    <Image src={testimonial.image} alt={testimonial.name} fill className="object-cover" sizes="40px" style={{ filter: 'grayscale(80%)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{testimonial.name}</p>
                    <p className="text-white/40 text-xs truncate">{testimonial.role} · {testimonial.company}</p>
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.22)', color: '#A855F7' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/></svg>
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 100% 80% at 50% 120%, rgba(124,58,237,0.2) 0%, transparent 65%)' }} />
        <div className="max-w-5xl mx-auto relative">
          <div className="relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center" style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.28) 0%, rgba(91,33,182,0.42) 50%, rgba(124,58,237,0.18) 100%)', border: '1px solid rgba(124,58,237,0.38)' }}>
            {/* Grid texture overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-25" style={{ backgroundImage: 'linear-gradient(rgba(124,58,237,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.18) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            <div className="relative">
              <div className="inline-flex items-center gap-2 text-[#A855F7] text-xs font-bold uppercase tracking-widest mb-6 px-4 py-1.5 rounded-full" style={{ border: '1px solid rgba(124,58,237,0.35)', background: 'rgba(124,58,237,0.12)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
                Start Shipping Today
              </div>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-5 leading-tight">{t.cta.title}</h2>
              <p className="text-white/60 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">{t.cta.subtitle}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/about" className="parcelpoint-button px-10 py-4 text-base font-bold inline-flex items-center justify-center gap-2">
                  {t.cta.learnMore} <ChevronRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="glass-button px-10 py-4 text-base font-semibold inline-flex items-center justify-center text-white">
                  {t.cta.contactSales}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FLOATING BUTTONS ─────────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer"
          className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg shadow-[#25D366]/30 hover:scale-110 transition-transform duration-300"
          title="Chat on WhatsApp">
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </a>
        <Link href="/chat"
          className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-[#7C3AED]/30 hover:scale-110 transition-transform duration-300"
          style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}
          title="Live Chat">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </Link>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer id="contact" className="glass-footer py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden shadow-lg shadow-[#7C3AED]/30">
                  <Image src="/parcel-point-logo.png" alt="Parcel Point Logo" fill className="object-cover" sizes="64px" />
                </div>
                <span className="text-xl font-bold text-white">Parcel Point</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">{t.footer.companyDesc}</p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.quickLinks}</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-white/60 hover:text-white text-sm transition">{t.footer.about}</Link></li>
                <li><a href="#services" className="text-white/60 hover:text-white text-sm transition">{t.footer.services}</a></li>
                <li><a href="#track" className="text-white/60 hover:text-white text-sm transition">{t.footer.trackParcel}</a></li>
                <li><Link href="/contact" className="text-white/60 hover:text-white text-sm transition">{t.footer.getQuote}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.support}</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-white/60 hover:text-white text-sm transition">{t.footer.helpCenter}</Link></li>
                <li><Link href="/contact" className="text-white/60 hover:text-white text-sm transition">{t.footer.contactUs}</Link></li>
                <li><Link href="/faqs" className="text-white/60 hover:text-white text-sm transition">{t.footer.faqs}</Link></li>
                <li><Link href="/chat" className="text-white/60 hover:text-white text-sm transition">{t.footer.liveChat}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2">
                <li><Link href="/terms" className="text-white/60 hover:text-white text-sm transition">{t.footer.terms}</Link></li>
                <li><Link href="/privacy" className="text-white/60 hover:text-white text-sm transition">{t.footer.privacy}</Link></li>
                <li><Link href="/cookies" className="text-white/60 hover:text-white text-sm transition">{t.footer.cookies}</Link></li>
                <li><Link href="/staff" className="text-white/60 hover:text-white text-sm transition">{t.footer.staffPortal}</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">{t.footer.rights}</p>
            <div className="flex gap-4">
              <a href="#" className="text-white/50 hover:text-white transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-white/50 hover:text-white transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href="#" className="text-white/50 hover:text-white transition">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}
