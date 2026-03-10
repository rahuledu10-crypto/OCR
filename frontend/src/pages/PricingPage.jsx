import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import SEO from '../components/SEO';
import { FAQPageSchema } from '../components/JsonLd';
import { 
  FileText, 
  Check, 
  ArrowRight,
  Zap,
  Shield,
  Headphones,
  MessageCircle
} from 'lucide-react';

const pricingPlans = [
  {
    name: "Free",
    price: "₹0",
    period: "/month",
    requests: "100 extractions",
    description: "Perfect for trying out ExtractAI",
    features: [
      "Aadhaar, PAN, DL supported",
      "API access",
      "Dashboard access",
      "Community support",
      "Standard rate limits"
    ],
    cta: "Start Free",
    href: "/register"
  },
  {
    name: "Starter",
    price: "₹499",
    period: "/month",
    requests: "1,000 extractions",
    description: "For small businesses and freelancers",
    features: [
      "All document types",
      "Email support",
      "99.5% uptime SLA",
      "Higher rate limits",
      "Webhook notifications"
    ],
    cta: "Get Started",
    href: "/register"
  },
  {
    name: "Growth",
    price: "₹1,999",
    period: "/month",
    requests: "5,000 extractions",
    description: "For growing teams and agencies",
    features: [
      "All document types",
      "Priority support",
      "99.9% uptime SLA",
      "Custom rate limits",
      "Batch processing",
      "Analytics dashboard"
    ],
    popular: true,
    cta: "Get Started",
    href: "/register"
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    requests: "Unlimited extractions",
    description: "For large organizations",
    features: [
      "All document types",
      "24/7 dedicated support",
      "99.99% uptime SLA",
      "Custom integrations",
      "WhatsApp integration",
      "On-premise deployment",
      "SLA & DPA agreements"
    ],
    cta: "Contact Sales",
    href: "mailto:sales@extractai.io?subject=Enterprise%20Plan%20Inquiry"
  }
];

const faqs = [
  {
    question: "What counts as an extraction?",
    answer: "Each API call to extract data from a document counts as one extraction. A single document with multiple pages still counts as one extraction."
  },
  {
    question: "Can I change plans anytime?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences."
  },
  {
    question: "What happens if I exceed my limit?",
    answer: "You'll receive a notification when you're approaching your limit. You can either upgrade your plan or purchase additional extractions at pay-as-you-go rates."
  },
  {
    question: "Do unused extractions roll over?",
    answer: "Monthly extractions do not roll over. However, Enterprise customers can negotiate custom terms that may include rollover credits."
  },
  {
    question: "Is there a free trial for paid plans?",
    answer: "Yes! All paid plans come with a 14-day free trial. No credit card required to start."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, UPI, net banking, and wire transfers for Enterprise customers. All payments are processed securely via Razorpay."
  }
];

const PricingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="Pricing — ExtractAI | Flexible Plans for Every Scale"
        description="Simple pricing for document extraction. Free tier available. Starter at ₹499/mo, Pro at ₹1999/mo. Scale as you grow."
        url="https://extractai.io/pricing"
      />
      
      {/* JSON-LD Structured Data for FAQs */}
      <FAQPageSchema faqs={faqs} />

      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl">ExtractAI</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link to="/#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link to="/#documents" className="text-muted-foreground hover:text-foreground transition-colors">Solutions</Link>
            <Link to="/pricing" className="text-foreground font-medium">Pricing</Link>
            <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors">API Docs</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" data-testid="pricing-login-btn">Log in</Button>
            </Link>
            <Link to="/register">
              <Button data-testid="pricing-signup-btn">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              Simple, transparent pricing
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Pay only for what you use
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free with 100 extractions. Upgrade as your needs grow. 
              No hidden fees, no long-term contracts.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="h-full"
              >
                <Card className={`p-6 bg-card/50 backdrop-blur border-border/50 h-full flex flex-col relative ${plan.popular ? 'border-primary ring-2 ring-primary/50 shadow-[0_0_40px_rgba(99,102,241,0.15)]' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-4">
                    <h3 className="font-heading text-xl font-semibold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  </div>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 pb-6 border-b border-border/50">{plan.requests}</p>
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.name === 'Enterprise' ? (
                    <a href={plan.href} className="mt-auto">
                      <Button 
                        className="w-full"
                        variant="outline"
                        data-testid={`pricing-${plan.name.toLowerCase()}-btn`}
                      >
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </a>
                  ) : (
                    <Link to={plan.href} className="mt-auto">
                      <Button 
                        className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90 shadow-lg' : ''}`}
                        variant={plan.popular ? 'default' : 'outline'}
                        data-testid={`pricing-${plan.name.toLowerCase()}-btn`}
                      >
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 px-4 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">Secure & Compliant</h3>
              <p className="text-sm text-muted-foreground">DPDPA 2023 compliant. Your data is never stored or used for training.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Headphones className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">World-Class Support</h3>
              <p className="text-sm text-muted-foreground">Get help when you need it. Email, chat, or dedicated support based on your plan.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold">99.9% Uptime</h3>
              <p className="text-sm text-muted-foreground">Built for reliability. Our infrastructure ensures your extractions never stop.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Everything you need to know about our pricing</p>
          </motion.div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start with 100 free extractions. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(99,102,241,0.3)] text-lg px-8 h-12" data-testid="pricing-cta-signup">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <a href="https://calendly.com/rahul-extractai/30min" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" className="text-lg px-8 h-12" data-testid="pricing-cta-demo">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Talk to Sales
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold">ExtractAI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/docs" className="hover:text-foreground transition-colors">API Docs</Link>
            <a href="mailto:support@extractai.io" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 ExtractAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage;
