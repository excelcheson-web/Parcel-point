import Link from 'next/link'
import Image from 'next/image'

export default function CookiesPage() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-white text-high-contrast mb-3">Cookie Policy</h1>
          <div className="w-16 h-1 bg-[#7C3AED] mx-auto rounded-full"></div>
        </div>

        <div className="glass-panel-dark rounded-2xl p-8 md:p-12">
          <div className="space-y-6 text-white/80">
            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">What Are Cookies</h2>
              <p className="leading-relaxed">
                Cookies are small text files that are placed on your computer or mobile device
                when you visit a website. They are widely used to make websites work more efficiently
                and provide information to the website owners.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">How We Use Cookies</h2>
              <p className="leading-relaxed mb-4">Parcel Point uses cookies for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong className="text-white">Essential Cookies:</strong> Required for the website to function properly, including tracking shipments and maintaining your session.</li>
                <li><strong className="text-white">Analytics Cookies:</strong> Help us understand how visitors interact with our website by collecting anonymous information.</li>
                <li><strong className="text-white">Preference Cookies:</strong> Remember your settings and preferences (like language selection) for a better experience.</li>
                <li><strong className="text-white">Security Cookies:</strong> Help protect your account and our services from unauthorized access.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Session Cookies</h3>
                  <p className="leading-relaxed">Temporary cookies that expire when you close your browser. These help maintain your session while using our tracking and shipping tools.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Persistent Cookies</h3>
                  <p className="leading-relaxed">Remain on your device for a set period or until you delete them. These remember your preferences and login information for convenience.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-2">Third-Party Cookies</h3>
                  <p className="leading-relaxed">Set by our analytics and security partners to help us improve our services and protect against fraud.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">Managing Cookies</h2>
              <p className="leading-relaxed mb-4">You can control and manage cookies in various ways:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Browser settings: Most browsers allow you to refuse or delete cookies</li>
                <li>Our cookie banner: You can adjust your preferences when you first visit</li>
                <li>Third-party tools: Various browser extensions can manage cookie behavior</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Please note that disabling certain cookies may affect the functionality of our
                website, particularly the tracking and shipment management features.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">Cookie Duration</h2>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Session cookies: Expire when you close your browser</li>
                <li>Preference cookies: Last up to 1 year</li>
                <li>Analytics cookies: Last up to 2 years</li>
                <li>Security cookies: Last up to 30 days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">Updates to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Cookie Policy from time to time to reflect changes in technology,
                regulations, or our business practices. Please check this page periodically for updates.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#A855F7] mb-4">Contact Us</h2>
              <p className="leading-relaxed">
                If you have questions about our Cookie Policy, please contact us:<br />
                Email: privacy@parcelpoint.com<br />
                Phone: +63 956 988 3401 (PH) | +44 839 528 4814 (UK)
              </p>
            </section>

            <p className="text-sm text-white/50 pt-4 border-t border-white/10">Last updated: January 2026</p>
          </div>
        </div>
      </div>
    </div>
  )
}
