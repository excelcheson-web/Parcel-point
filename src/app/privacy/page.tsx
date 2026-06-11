import Link from 'next/link'
import Image from 'next/image'

export default function PrivacyPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-white text-high-contrast mb-3">Privacy Policy</h1>
          <div className="w-16 h-1 bg-[#7C3AED] mx-auto rounded-full"></div>
        </div>

        <div className="glass-panel-dark rounded-2xl p-8 md:p-12">
          <div className="space-y-6 text-white/80">
            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">1. Information We Collect</h2>
              <p className="leading-relaxed mb-4">Parcel Point collects information necessary to provide our logistics services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contact information (name, email, phone, address)</li>
                <li>Shipment details and tracking numbers</li>
                <li>Payment and billing information</li>
                <li>Business information for corporate accounts</li>
                <li>Usage data and analytics</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">2. How We Use Your Information</h2>
              <p className="leading-relaxed mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Process and track your shipments</li>
                <li>Communicate shipping updates and notifications</li>
                <li>Provide customer support</li>
                <li>Improve our services and user experience</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">3. Data Security</h2>
              <p className="leading-relaxed">
                We implement industry-standard security measures to protect your data including
                encryption, secure servers, and access controls. Your tracking information
                is protected and only accessible to authorized personnel and you.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">4. Data Sharing</h2>
              <p className="leading-relaxed mb-4">We only share your information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Shipping carriers and logistics partners (necessary for delivery)</li>
                <li>Service providers who assist our operations</li>
                <li>Legal authorities when required by law</li>
              </ul>
              <p className="leading-relaxed mt-4">We do not sell your personal information to third parties.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">5. Cookies and Tracking</h2>
              <p className="leading-relaxed">
                We use cookies and similar technologies to enhance your experience, remember
                your preferences, and analyze website traffic. You can control cookie settings
                through your browser preferences.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">6. Your Rights</h2>
              <p className="leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">7. Contact Us</h2>
              <p className="leading-relaxed">
                For privacy-related questions or requests, contact our Data Protection Officer:<br />
                Email: privacy@parcelpoint.com<br />
                Phone: +63 956 988 3401 (PH) | +44 839 528 4814 (UK)<br />
                Address: Parcel Point House, 42 Harbor Avenue
              </p>
            </section>

            <p className="text-sm text-white/50 pt-4 border-t border-white/10">Last updated: January 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
