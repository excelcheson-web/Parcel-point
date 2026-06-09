'use client'

'use client'

import Link from 'next/link'
import Image from 'next/image'

// Service data with detailed descriptions
const services = [
  {
    id: 'air',
    title: 'Air Freight',
    shortDesc: 'Speed Without Compromise',
    description: 'When time is your most valuable asset, Parcel Point\'s Air Freight solutions deliver. We leverage a global network of premium air carriers to ensure your high-priority cargo reaches any destination worldwide in record time. From express documents to heavy industrial machinery, we handle the complexity of customs and clearance so you don\'t have to.',
    features: [
      'Express delivery to 200+ countries',
      'Real-time flight tracking',
      'Temperature-controlled cargo options',
      'Priority handling for urgent shipments',
      'Customs clearance assistance'
    ],
    image: 'https://images.unsplash.com/photo-1571086291540-b137111fa1c7?w=800&q=80',
    iconImage: 'https://images.unsplash.com/photo-1610642372677-bcddb69f3531?w=200&q=80',
  },
  {
    id: 'ocean',
    title: 'Ocean Freight',
    shortDesc: 'Global Reach, Scalable Solutions',
    description: 'For large-scale international trade, our Ocean Freight service offers the perfect balance of cost-efficiency and reliability. Whether you require Full Container Load (FCL) or Less than Container Load (LCL), Parcel Point provides secure transit across all major sea lanes, backed by our real-time maritime tracking interface.',
    features: [
      'FCL and LCL shipping options',
      'Container tracking across all major ports',
      'Competitive rates for bulk cargo',
      'Hazardous materials handling',
      'Port-to-port and door-to-door service'
    ],
    image: 'https://images.unsplash.com/photo-1606185540834-d6e7483ee1a4?w=800&q=80',
    iconImage: 'https://images.unsplash.com/photo-1670121180530-cfcba4438038?w=200&q=80',
  },
  {
    id: 'warehouse',
    title: 'Warehousing',
    shortDesc: 'Smart Storage & Inventory Control',
    description: 'Our state-of-the-art warehousing facilities are more than just storage; they are strategic hubs for your supply chain. Featuring climate-controlled environments and advanced Inventory Management Systems (IMS), we ensure your goods are sorted, protected, and ready for rapid distribution the moment they are needed.',
    features: [
      'Climate-controlled storage facilities',
      '24/7 security monitoring',
      'Advanced inventory management systems',
      'Pick and pack services',
      'Cross-docking capabilities'
    ],
    image: 'https://images.unsplash.com/photo-1684695749267-233af13276d0?w=800&q=80',
    iconImage: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=200&q=80',
  },
  {
    id: 'road',
    title: 'Road Freight',
    shortDesc: 'Last-Mile Precision',
    description: 'The final link in the chain is often the most critical. Our Road Freight network spans continents, providing door-to-door delivery with a fleet of modern, GPS-tracked vehicles. From regional distribution to cross-border trucking, we ensure your parcel navigates the "last mile" with total transparency and safety.',
    features: [
      'Door-to-door delivery service',
      'GPS-tracked fleet',
      'Express and standard delivery options',
      'Cross-border trucking expertise',
      'Real-time delivery notifications'
    ],
    image: 'https://images.unsplash.com/photo-1616432043562-3671ea2e5242?w=800&q=80',
    iconImage: 'https://images.unsplash.com/photo-1695222833131-54ee679ae8e5?w=200&q=80',
  },
]

// Language options
const languages = [
  { code: 'EN', name: 'English' },
  { code: 'ES', name: 'Español' },
  { code: 'FR', name: 'Français' },
  { code: 'DE', name: 'Deutsch' },
  { code: 'CN', name: '中文' },
  { code: 'AR', name: 'العربية' },
]

export default function ServicesPage() {
  return (
    <div className="mesh-gradient min-h-screen">
      {/* Header & Navigation */}
      <header className="glass-header fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden">
              <Image src="/parcel-point-logo.png" alt="Parcel Point Logo" fill className="object-cover" sizes="40px" priority />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-white text-high-contrast">
              Parcel Point
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className="nav-link text-sm">Home</Link>
            <Link href="/about" className="nav-link text-sm">About Us</Link>
            <Link href="/services" className="nav-link text-sm bg-white/20">Services</Link>
            <Link href="/track" className="nav-link text-sm">Track Parcel</Link>
            <Link href="/contact" className="nav-link text-sm">Contact</Link>
          </nav>

          {/* Language Switcher */}
          <div className="flex items-center gap-3">
            <select className="language-switcher">
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code} className="text-gray-900">
                  {lang.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white text-high-contrast mb-6">
            Our Services
          </h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto">
            Comprehensive logistics solutions tailored to your business needs. 
            From air freight to last-mile delivery, we have you covered.
          </p>
        </div>
      </section>

      {/* Services List */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          {services.map((service, index) => (
            <div 
              key={service.id}
              className={`glass-card overflow-hidden ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}
            >
              <div className="grid md:grid-cols-2 gap-0">
                {/* Image */}
                <div className="relative h-64 md:h-auto min-h-[300px]">
                  <Image
                    src={service.image}
                    alt={service.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent md:bg-gradient-to-r md:from-black/60 md:to-transparent" />
                  <div className="absolute bottom-6 left-6">
                    <div className="relative w-16 h-16 mb-3 rounded-xl overflow-hidden border-2 border-[#7C3AED]">
                      <Image
                        src={service.iconImage}
                        alt={service.title}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                    <h2 className="text-3xl font-bold text-white">{service.title}</h2>
                    <p className="text-[#A855F7] font-semibold">{service.shortDesc}</p>
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <p className="text-white/90 text-lg leading-relaxed mb-8">
                    {service.description}
                  </p>
                  
                  <h3 className="text-[#A855F7] font-semibold mb-4">Key Features:</h3>
                  <ul className="space-y-3">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3 text-white/80">
                        <span className="text-[#A855F7] text-xl">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-8">
                    <Link 
                      href="/contact"
                      className="parcelpoint-button px-8 py-3 inline-block text-center"
                    >
                      Get a Quote
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="hero-glass p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white text-high-contrast mb-4">
              Need a Custom Solution?
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-2xl mx-auto">
              Our logistics experts can design a tailored solution for your unique business requirements.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="parcelpoint-button px-8 py-4 text-lg font-semibold inline-block"
              >
                Contact Our Team
              </Link>
              <Link
                href="/"
                className="glass-button px-8 py-4 text-lg font-semibold inline-block"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-footer py-12 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                  <Image src="/parcel-point-logo.png" alt="Parcel Point Logo" fill className="object-cover" sizes="40px" />
                </div>
                <span className="text-xl font-bold text-white">Parcel Point</span>
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                Your trusted partner for global logistics and supply chain solutions.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link href="/" className="parcelpoint-footer-link text-sm">Home</Link></li>
                <li><Link href="/about" className="parcelpoint-footer-link text-sm">About Us</Link></li>
                <li><Link href="/services" className="parcelpoint-footer-link text-sm">Services</Link></li>
                <li><Link href="/track" className="parcelpoint-footer-link text-sm">Track Parcel</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="parcelpoint-footer-link text-sm">Help Center</a></li>
                <li><Link href="/contact" className="parcelpoint-footer-link text-sm">Contact Us</Link></li>
                <li><a href="#" className="parcelpoint-footer-link text-sm">FAQs</a></li>
                <li><a href="#" className="parcelpoint-footer-link text-sm">Live Chat</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="parcelpoint-footer-link text-sm">Terms & Conditions</a></li>
                <li><a href="#" className="parcelpoint-footer-link text-sm">Privacy Policy</a></li>
                <li><a href="#" className="parcelpoint-footer-link text-sm">Cookie Policy</a></li>
                <li><Link href="/staff" className="parcelpoint-footer-link text-sm">Staff Portal</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-white/50 text-sm">
              © 2026 Parcel Point. All rights reserved.
            </p>
            <div className="flex gap-4">
              <span className="text-white/50 text-sm">Follow us:</span>
              <a href="#" className="text-[#A855F7] hover:text-white transition">Twitter</a>
              <a href="#" className="text-[#A855F7] hover:text-white transition">LinkedIn</a>
              <a href="#" className="text-[#A855F7] hover:text-white transition">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
