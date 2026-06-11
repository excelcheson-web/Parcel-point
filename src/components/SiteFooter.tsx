import Link from 'next/link'
import Image from 'next/image'

export default function SiteFooter() {
  return (
    <footer className="glass-footer px-4 sm:px-6 lg:px-8 py-12 mt-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">

          {/* Brand + contact */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden">
                <Image src="/parcel-point-logo.png" alt="Parcel Point Logistics" fill className="object-cover" sizes="40px" />
              </div>
              <span className="text-xl font-bold text-white">Parcel Point Logistics</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed mb-3">
              Your trusted partner for global freight and supply chain solutions.
            </p>
            <address className="not-italic text-white/40 text-xs leading-relaxed">
              Parcel Point House<br />
              42 Harbor Avenue<br />
              London, United Kingdom
            </address>
            <a
              href="mailto:hello@parcelpoint.com"
              className="inline-block mt-2 text-xs text-[#A855F7]/80 hover:text-[#A855F7] transition-colors"
            >
              hello@parcelpoint.com
            </a>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/"        className="parcelpoint-footer-link">Home</Link></li>
              <li><Link href="/about"   className="parcelpoint-footer-link">About Us</Link></li>
              <li><Link href="/services" className="parcelpoint-footer-link">Services</Link></li>
              <li><Link href="/track"   className="parcelpoint-footer-link">Track Parcel</Link></li>
              <li><Link href="/contact" className="parcelpoint-footer-link">Contact Us</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/faqs"  className="parcelpoint-footer-link">FAQs</Link></li>
              <li><Link href="/chat"  className="parcelpoint-footer-link">Live Chat</Link></li>
              <li>
                <a href="mailto:hello@parcelpoint.com" className="parcelpoint-footer-link">
                  hello@parcelpoint.com
                </a>
              </li>
              <li>
                <a href="https://wa.me/639569883401" target="_blank" rel="noopener noreferrer" className="parcelpoint-footer-link">
                  WhatsApp Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms"   className="parcelpoint-footer-link">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy" className="parcelpoint-footer-link">Privacy Policy</Link></li>
              <li><Link href="/cookies" className="parcelpoint-footer-link">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} Parcel Point Logistics. All rights reserved.
          </p>
          <p className="text-white/30 text-xs">
            Registered logistics operator &mdash; IATA Agent Code PPX-42710
          </p>
        </div>
      </div>
    </footer>
  )
}
