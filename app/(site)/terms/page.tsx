'use client'

import { BUSINESS_NAME, CONTACT_INFO, LOCATION } from '@/lib/constants'
import Card, { CardBody } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

export default function TermsPage() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-light/50 to-white py-12 md:py-16">
        <style jsx global>{`
          @keyframes shimmer {
            0% {
              background-position: -200% center;
            }
            100% {
              background-position: 200% center;
            }
          }
          .shimmer-text {
            background: linear-gradient(
              90deg,
              rgba(0, 0, 0, 1) 0%,
              rgba(0, 0, 0, 1) 40%,
              rgba(239, 195, 147, 1) 50%,
              rgba(0, 0, 0, 1) 60%,
              rgba(0, 0, 0, 1) 100%
            );
            background-size: 200% auto;
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: shimmer 4s linear infinite;
          }
        `}</style>
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="shimmer-text font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Terms of Service
            </h1>
            <p className="text-lg text-black/70">
              Last updated: November 2025
            </p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="section-padding bg-bg-primary">
        <div className="container-custom max-w-4xl">
          <Card className="!border-2 !border-mauve">
            <CardBody className="prose prose-lg max-w-none">
              <h2 className="font-display text-2xl font-bold text-black mb-4">
                Agreement to Terms
              </h2>
              <p className="text-black mb-6">
                By accessing or using the {BUSINESS_NAME} website and visiting our physical store
                location, you agree to be bound by these Terms of Service. If you do not agree to
                these terms, please do not use our website or services.
              </p>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                About Our Antique Mall
              </h2>
              <p className="text-black mb-6">
                {BUSINESS_NAME} operates as an antique mall featuring independent vendors who rent
                booth spaces. We serve as the facility operator and are not responsible for the
                individual inventory, pricing, or business practices of our independent vendors.
                Each vendor operates their own business within our facility.
              </p>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Use of Website
              </h2>
              <p className="text-black mb-4">You agree to use our website only for lawful purposes and in a way that does not:</p>
              <ul className="list-disc pl-6 text-black mb-6 space-y-2">
                <li>Violate any applicable federal, state, or local laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Harass, abuse, or harm another person</li>
                <li>Transmit any viruses, malware, or other harmful code</li>
                <li>Attempt to gain unauthorized access to our systems or networks</li>
                <li>Use automated systems to access the website without our permission</li>
              </ul>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Intellectual Property
              </h2>
              <p className="text-black mb-6">
                All content on this website, including text, graphics, logos, images, and software,
                is the property of {BUSINESS_NAME} or its content suppliers and is protected by
                copyright and intellectual property laws. You may not reproduce, distribute, modify,
                or create derivative works from any content without our express written permission.
              </p>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Purchases and Transactions
              </h2>
              <p className="text-black mb-4">
                When making purchases at {BUSINESS_NAME}:
              </p>
              <ul className="list-disc pl-6 text-black mb-6 space-y-2">
                <li>
                  <strong>All Sales Are Final:</strong> Unless otherwise required by law, all sales
                  are final. Items are sold "as-is" with no warranties expressed or implied
                </li>
                <li>
                  <strong>Independent Vendors:</strong> Each item is owned and priced by an
                  independent vendor. We facilitate the transaction but are not responsible for item
                  condition or vendor-specific policies
                </li>
                <li>
                  <strong>Pricing:</strong> Prices are determined by individual vendors and are
                  subject to change without notice. Some vendors may negotiate pricing
                </li>
                <li>
                  <strong>Payment:</strong> We accept various payment methods at our physical
                  location. Payment processing is subject to verification
                </li>
                <li>
                  <strong>Item Removal:</strong> Items may be sold or removed from the floor at any
                  time without notice
                </li>
              </ul>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Vendor Relationships
              </h2>
              <p className="text-black mb-6">
                {BUSINESS_NAME} provides booth space to independent vendors. We are not responsible
                for:
              </p>
              <ul className="list-disc pl-6 text-black mb-6 space-y-2">
                <li>The quality or condition of items sold by vendors</li>
                <li>Vendor pricing, negotiation policies, or business practices</li>
                <li>Item descriptions, historical accuracy, or provenance claims</li>
                <li>Vendor availability or individual vendor policies regarding returns or exchanges</li>
                <li>Disputes between customers and vendors regarding specific items</li>
              </ul>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Visitor Conduct and Safety
              </h2>
              <p className="text-black mb-4">
                When visiting our physical location, you agree to:
              </p>
              <ul className="list-disc pl-6 text-black mb-6 space-y-2">
                <li>Treat all merchandise, displays, and facilities with respect</li>
                <li>Supervise children at all times</li>
                <li>Follow posted safety guidelines and staff instructions</li>
                <li>Refrain from damaging, altering, or removing items without purchase</li>
                <li>Respect other shoppers, vendors, and staff</li>
                <li>Not bring prohibited items (weapons, outside food/beverages, etc.) into the facility</li>
              </ul>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Limitation of Liability
              </h2>
              <p className="text-black mb-6">
                To the fullest extent permitted by law, {BUSINESS_NAME} and its owners, employees,
                vendors, and affiliates shall not be liable for any indirect, incidental, special,
                consequential, or punitive damages arising from your use of our website or visit to
                our facility. Our total liability shall not exceed the amount paid by you, if any,
                for accessing our services.
              </p>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Disclaimer of Warranties
              </h2>
              <p className="text-black mb-6">
                Our website and services are provided "as-is" and "as available" without warranties
                of any kind, either express or implied. We do not warrant that our website will be
                uninterrupted, secure, or error-free. Items sold in our facility are sold "as-is"
                unless specific vendor warranties apply.
              </p>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Indemnification
              </h2>
              <p className="text-black mb-6">
                You agree to indemnify and hold harmless {BUSINESS_NAME}, its owners, employees,
                vendors, and affiliates from any claims, damages, losses, liabilities, and expenses
                (including legal fees) arising from your use of our website or facility, your
                violation of these terms, or your violation of any rights of another person or
                entity.
              </p>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Third-Party Links and Services
              </h2>
              <p className="text-black mb-6">
                Our website may contain links to third-party websites or services (including
                Facebook Marketplace, social media platforms, and vendor websites) that are not
                owned or controlled by {BUSINESS_NAME}. We have no control over and assume no
                responsibility for the content, privacy policies, or practices of any third-party
                websites or services.
              </p>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Privacy Policy
              </h2>
              <p className="text-black mb-6">
                Your use of our website is also governed by our Privacy Policy. Please review our{' '}
                <a href="/privacy" className="text-mauve-dark hover:text-mauve underline transition-colors font-semibold">
                  Privacy Policy
                </a>{' '}
                to understand how we collect, use, and protect your personal information.
              </p>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Modifications to Terms
              </h2>
              <p className="text-black mb-6">
                We reserve the right to modify these Terms of Service at any time. Changes will be
                effective immediately upon posting to this page with an updated "Last updated"
                date. Your continued use of our website or facility after changes are posted
                constitutes acceptance of the modified terms.
              </p>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Governing Law
              </h2>
              <p className="text-black mb-6">
                These Terms of Service shall be governed by and construed in accordance with the
                laws of the State of Georgia, without regard to its conflict of law provisions. Any
                legal action or proceeding arising under these terms shall be brought exclusively in
                the courts located in Cobb County, Georgia.
              </p>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Severability
              </h2>
              <p className="text-black mb-6">
                If any provision of these Terms of Service is found to be invalid or unenforceable,
                the remaining provisions shall continue to be valid and enforceable to the fullest
                extent permitted by law.
              </p>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Entire Agreement
              </h2>
              <p className="text-black mb-6">
                These Terms of Service, together with our Privacy Policy, constitute the entire
                agreement between you and {BUSINESS_NAME} regarding your use of our website and
                services, and supersede any prior agreements or understandings.
              </p>

              <h2 className="font-display text-2xl font-bold text-black mb-4 mt-8">
                Contact Information
              </h2>
              <p className="text-black mb-4">
                If you have questions or concerns about these Terms of Service, please contact us:
              </p>
              <div className="bg-mauve-light/30 p-6 rounded-lg border-2 border-mauve">
                <p className="text-black mb-2">
                  <strong>{BUSINESS_NAME}</strong>
                </p>
                <p className="text-black">
                  {LOCATION.address}
                  <br />
                  {LOCATION.city}, {LOCATION.state} {LOCATION.zip}
                </p>
                <p className="text-black mt-3">
                  <strong>Phone:</strong>{' '}
                  <a
                    href={`tel:${CONTACT_INFO.phone}`}
                    className="text-mauve-dark hover:text-mauve underline transition-colors"
                  >
                    {CONTACT_INFO.phone}
                  </a>
                </p>
                <p className="text-black">
                  <strong>Email:</strong>{' '}
                  <a
                    href={`mailto:${CONTACT_INFO.email}`}
                    className="text-mauve-dark hover:text-mauve underline transition-colors"
                  >
                    {CONTACT_INFO.email}
                  </a>
                </p>
              </div>

              <div className="mt-8 p-6 bg-mint-light/30 rounded-lg border-2 border-mint">
                <p className="text-sm text-black italic">
                  By using this website or visiting {BUSINESS_NAME}, you acknowledge that you have
                  read, understood, and agree to be bound by these Terms of Service.
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      </section>
    </main>
  )
}
