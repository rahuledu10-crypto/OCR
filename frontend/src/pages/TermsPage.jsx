import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import SEO from '../components/SEO';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Terms of Service — ExtractAI"
        description="ExtractAI terms of service. Read our terms before using the platform."
        url="https://www.extractai.io/terms"
      />
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
          <h1 className="font-heading text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: March 2025</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing or using ExtractAI's document extraction API services ("Services"), you agree to be bound by these Terms of Service. ExtractAI is operated by ExtractAI Technologies Private Limited, a company registered under the laws of India. If you do not agree to these terms, please do not use our Services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                ExtractAI provides optical character recognition (OCR) and document data extraction services via API. Our Services enable automated extraction of structured data from identity documents, financial documents, and other supported document types for business verification and KYC compliance purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <div className="text-muted-foreground leading-relaxed space-y-3">
                <p>To access our Services, you must create an account and provide accurate, complete information. You are responsible for:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Maintaining the confidentiality of your API keys and account credentials</li>
                  <li>All activities that occur under your account</li>
                  <li>Notifying us immediately of any unauthorized use of your account</li>
                  <li>Ensuring your use complies with all applicable laws and regulations</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use Policy</h2>
              <div className="text-muted-foreground leading-relaxed space-y-3">
                <p>You agree NOT to use our Services to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Process documents without proper authorization from the document owner</li>
                  <li>Engage in identity theft, fraud, or any illegal activity</li>
                  <li>Violate any person's privacy rights or data protection laws</li>
                  <li>Circumvent usage limits or rate limiting mechanisms</li>
                  <li>Reverse engineer, decompile, or attempt to extract source code</li>
                  <li>Resell or redistribute our Services without authorization</li>
                  <li>Upload malware, viruses, or malicious content</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Pricing and Payment</h2>
              <div className="text-muted-foreground leading-relaxed space-y-3">
                <p><strong className="text-foreground">5.1 Subscription Plans:</strong> We offer monthly subscription plans with varying extraction limits. Plan details and pricing are available on our website.</p>
                <p><strong className="text-foreground">5.2 Pay-As-You-Go:</strong> Extractions beyond your plan limit are charged at ₹0.20 per extraction from your wallet balance.</p>
                <p><strong className="text-foreground">5.3 Payment Processing:</strong> Payments are processed through Razorpay. All prices are in Indian Rupees (INR) and inclusive of applicable taxes.</p>
                <p><strong className="text-foreground">5.4 Billing Cycle:</strong> Subscriptions are billed monthly from the date of activation. Usage limits reset at the start of each billing cycle.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Refund Policy</h2>
              <div className="text-muted-foreground leading-relaxed space-y-3">
                <p><strong className="text-foreground">6.1 Subscription Refunds:</strong> Subscription fees are non-refundable once the billing cycle has begun. You may cancel your subscription at any time, but no prorated refunds will be provided.</p>
                <p><strong className="text-foreground">6.2 Wallet Balance:</strong> Unused wallet balance can be refunded within 30 days of the last top-up, minus any extractions used. Refund requests must be submitted via email to billing@extractai.io.</p>
                <p><strong className="text-foreground">6.3 Service Issues:</strong> If you experience service outages or technical issues that prevent usage, contact support for credit consideration on a case-by-case basis.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Service Level Agreement</h2>
              <div className="text-muted-foreground leading-relaxed space-y-3">
                <p>We strive to maintain high availability:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Free Plan: Best-effort availability, no SLA</li>
                  <li>Starter Plan: 99.5% uptime SLA</li>
                  <li>Growth Plan: 99.9% uptime SLA</li>
                  <li>Enterprise Plan: 99.99% uptime SLA with dedicated support</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                ExtractAI retains all rights, title, and interest in our Services, including all software, algorithms, APIs, documentation, and trademarks. You retain ownership of all documents you process through our Services. We claim no intellectual property rights over your data.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, ExtractAI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities. Our total liability shall not exceed the amount paid by you in the twelve (12) months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Compliance with Indian Law</h2>
              <div className="text-muted-foreground leading-relaxed space-y-3">
                <p>Our Services comply with applicable Indian laws including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Information Technology Act, 2000 and IT Rules</li>
                  <li>Digital Personal Data Protection Act, 2023</li>
                  <li>RBI KYC Guidelines (where applicable)</li>
                  <li>UIDAI Aadhaar Authentication Regulations</li>
                </ul>
                <p>These Terms shall be governed by the laws of India, and disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may suspend or terminate your access to our Services immediately if you violate these Terms, engage in fraudulent activity, or fail to pay applicable fees. Upon termination, your right to use the Services ceases immediately, and we may delete your account data in accordance with our data retention policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may modify these Terms at any time. Material changes will be notified via email or dashboard notification at least 30 days before taking effect. Continued use of our Services after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
              <div className="text-muted-foreground leading-relaxed">
                <p>For questions about these Terms, contact us at:</p>
                <p className="mt-2">
                  <strong className="text-foreground">ExtractAI Technologies Private Limited</strong><br />
                  Email: legal@extractai.io<br />
                  Support: support@extractai.io
                </p>
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsPage;
