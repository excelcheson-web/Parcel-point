import Link from 'next/link'
import Image from 'next/image'

export default function TermsPage() {
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
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white text-high-contrast mb-3">Terms &amp; Conditions</h1>
          <div className="w-16 h-1 bg-[#7C3AED] mx-auto rounded-full"></div>
        </div>

        <div className="glass-panel-dark rounded-2xl p-8 md:p-12">
          <div className="space-y-6 text-white/80">
            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using Parcel Point services, you agree to be bound by these Terms &amp; Conditions.
                If you do not agree with any part of these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">2. Service Description</h2>
              <p className="leading-relaxed">
                Parcel Point provides global logistics and supply chain solutions including air freight,
                ocean freight, warehousing, and road transportation. We act as a facilitator between shippers
                and carriers to ensure efficient delivery of goods.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">3. User Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information for shipping</li>
                <li>Ensure all shipments comply with applicable laws and regulations</li>
                <li>Properly package and label all items for transport</li>
                <li>Pay all fees and charges as agreed upon</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">4. Liability Limitations</h2>
              <p className="leading-relaxed">
                Parcel Point liability is limited to the declared value of the shipment or the actual
                loss, whichever is less. We are not liable for delays caused by circumstances beyond our
                control including weather, customs, or carrier issues.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">5. Tracking and Updates</h2>
              <p className="leading-relaxed">
                We provide real-time tracking services. However, tracking information is dependent on
                carrier updates and may not always reflect real-time status. We strive to provide
                accurate information but cannot guarantee 100% accuracy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">6. Modifications</h2>
              <p className="leading-relaxed">
                Parcel Point reserves the right to modify these terms at any time. Continued use
                of our services after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">7. Contact Information</h2>
              <p className="leading-relaxed">
                For questions about these Terms &amp; Conditions, please contact us at:<br />
                Email: legal@parcelpoint.com<br />
                Phone: +234 800 727 2357
              </p>
            </section>

            <p className="text-sm text-white/50 pt-4 border-t border-white/10">Last updated: January 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
