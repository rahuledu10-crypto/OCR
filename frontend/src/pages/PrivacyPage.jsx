import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl">ExtractAI</span>
            </Link>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-24 pb-16 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: March 2025</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                ExtractAI Technologies Private Limited ("ExtractAI", "we", "us", or "our") is committed to protecting your privacy and the privacy of individuals whose documents you process through our Services. This Privacy Policy explains how we collect, use, store, and protect personal data in compliance with the Digital Personal Data Protection Act, 2023 (DPDPA) and the Information Technology Act, 2000.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Data Controller</h2>
              <div className="text-muted-foreground leading-relaxed">
                <p>ExtractAI Technologies Private Limited acts as the data fiduciary (controller) for account and billing data, and as a data processor for document extraction data processed on behalf of our customers.</p>
                <p className="mt-2">
                  <strong className="text-foreground">Grievance Officer:</strong><br />
                  Name: Data Protection Officer<br />
                  Email: privacy@extractai.io<br />
                  Address: Bengaluru, Karnataka, India
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Data We Collect</h2>
              <div className="text-muted-foreground leading-relaxed space-y-4">
                <div>
                  <p className="font-medium text-foreground">3.1 Account Information:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Email address (required for account creation)</li>
                    <li>Company name (optional)</li>
                    <li>Password (stored as encrypted hash)</li>
                    <li>Payment information (processed by Razorpay, not stored by us)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground">3.2 Document Data (Processed):</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Document images submitted via API</li>
                    <li>Extracted text and structured data</li>
                    <li>Document type classifications</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-foreground">3.3 Usage Data:</p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>API request logs (timestamp, endpoint, response status)</li>
                    <li>Extraction counts and success rates</li>
                    <li>IP addresses and user agent strings</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Purpose of Data Processing</h2>
              <div className="text-muted-foreground leading-relaxed">
                <p>We process personal data for the following purposes:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong className="text-foreground">Service Delivery:</strong> To provide document extraction services via our API</li>
                  <li><strong className="text-foreground">Account Management:</strong> To create, maintain, and secure your account</li>
                  <li><strong className="text-foreground">Billing:</strong> To process payments and manage subscriptions</li>
                  <li><strong className="text-foreground">Support:</strong> To respond to your queries and provide technical assistance</li>
                  <li><strong className="text-foreground">Compliance:</strong> To comply with legal obligations and regulatory requirements</li>
                  <li><strong className="text-foreground">Improvement:</strong> To improve our Services and develop new features</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Storage and Retention</h2>
              <div className="text-muted-foreground leading-relaxed space-y-4">
                <div>
                  <p className="font-medium text-foreground">5.1 Document Images:</p>
                  <p>Document images are processed in memory and <strong className="text-foreground">NOT stored</strong> on our servers. Images are immediately discarded after extraction is complete. We do not retain copies of your documents.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">5.2 Extracted Data:</p>
                  <p>Extraction results (metadata only: document type, confidence score, processing time) are stored for analytics purposes. The actual extracted PII (names, ID numbers, addresses) is returned to you via API and not stored by us unless you explicitly request logging.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">5.3 Account Data:</p>
                  <p>Account information is retained for the duration of your account plus 5 years for legal and tax compliance purposes.</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">5.4 Usage Logs:</p>
                  <p>API usage logs are retained for 90 days for debugging and analytics, then automatically deleted.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
              <div className="text-muted-foreground leading-relaxed">
                <p>We implement industry-standard security measures:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>TLS 1.3 encryption for all API communications</li>
                  <li>AES-256 encryption for data at rest</li>
                  <li>Bcrypt password hashing with salt</li>
                  <li>API key authentication with rate limiting</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Access controls and audit logging for internal systems</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Data Sharing</h2>
              <div className="text-muted-foreground leading-relaxed space-y-3">
                <p>We do not sell your personal data. We may share data with:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-foreground">Service Providers:</strong> Cloud infrastructure (AWS/GCP), payment processor (Razorpay), email service providers — bound by confidentiality agreements</li>
                  <li><strong className="text-foreground">Legal Authorities:</strong> When required by law, court order, or government regulation</li>
                  <li><strong className="text-foreground">Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with prior notice)</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Your Rights (Under DPDPA 2023)</h2>
              <div className="text-muted-foreground leading-relaxed">
                <p>As a data principal, you have the right to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong className="text-foreground">Access:</strong> Request a summary of your personal data we process</li>
                  <li><strong className="text-foreground">Correction:</strong> Request correction of inaccurate or incomplete data</li>
                  <li><strong className="text-foreground">Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements)</li>
                  <li><strong className="text-foreground">Grievance Redressal:</strong> Lodge complaints with our Grievance Officer or the Data Protection Board of India</li>
                  <li><strong className="text-foreground">Nominate:</strong> Nominate another person to exercise your rights in case of death or incapacity</li>
                </ul>
                <p className="mt-3">To exercise these rights, email privacy@extractai.io with your request. We will respond within 30 days.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Aadhaar Data Handling</h2>
              <div className="text-muted-foreground leading-relaxed">
                <p>When processing Aadhaar cards:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>We extract data from the visible face of the Aadhaar card only</li>
                  <li>We do NOT access the UIDAI database or perform Aadhaar authentication</li>
                  <li>We do NOT store Aadhaar numbers on our servers</li>
                  <li>Masked Aadhaar (showing only last 4 digits) is recommended for compliance</li>
                  <li>You are responsible for obtaining consent from Aadhaar holders before processing</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Cookies and Tracking</h2>
              <div className="text-muted-foreground leading-relaxed">
                <p>Our website uses:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong className="text-foreground">Essential Cookies:</strong> For authentication and session management</li>
                  <li><strong className="text-foreground">Analytics:</strong> PostHog for anonymous usage analytics (can be disabled)</li>
                </ul>
                <p className="mt-2">We do not use advertising cookies or cross-site tracking.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our Services are not directed at individuals under 18 years of age. We do not knowingly collect personal data from children. If you believe a child has provided us with personal data, contact us immediately at privacy@extractai.io.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our primary servers are located in India. If data is transferred outside India (e.g., for cloud backup), we ensure adequate protection through Standard Contractual Clauses or equivalent mechanisms as permitted under DPDPA.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Changes to This Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy periodically. Material changes will be notified via email or dashboard notification. The "Last updated" date at the top indicates when the policy was last revised.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Contact Us</h2>
              <div className="text-muted-foreground leading-relaxed">
                <p>For privacy-related inquiries:</p>
                <p className="mt-2">
                  <strong className="text-foreground">Data Protection Officer</strong><br />
                  ExtractAI Technologies Private Limited<br />
                  Email: privacy@extractai.io<br />
                  General Support: support@extractai.io
                </p>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivacyPage;
