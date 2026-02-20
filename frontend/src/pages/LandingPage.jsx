import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { 
  FileText, 
  Zap, 
  Shield, 
  Code, 
  ArrowRight, 
  Check,
  CreditCard,
  IdCard,
  Car,
  Copy
} from 'lucide-react';

const LandingPage = () => {
  const [copiedCode, setCopiedCode] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(`curl -X POST "https://api.ocrextract.io/api/v1/extract" \\
  -H "X-API-Key: your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"image_base64": "...", "document_type": "auto"}'`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Extract data in under 2 seconds with our optimized AI pipeline"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Enterprise Security",
      description: "SOC2 compliant with end-to-end encryption for all documents"
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Simple Integration",
      description: "RESTful API with SDKs for Python, Node.js, and more"
    }
  ];

  const documentTypes = [
    { icon: <IdCard className="w-8 h-8" />, name: "Aadhaar Card", fields: "12-digit UID, Name, DOB, Address" },
    { icon: <CreditCard className="w-8 h-8" />, name: "PAN Card", fields: "PAN Number, Name, Father's Name, DOB" },
    { icon: <Car className="w-8 h-8" />, name: "Driving License", fields: "DL Number, Name, Validity, Vehicle Class" }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$49",
      period: "/month",
      requests: "1,000 extractions",
      features: ["All document types", "Standard support", "99.5% uptime SLA"]
    },
    {
      name: "Growth",
      price: "$199",
      period: "/month",
      requests: "10,000 extractions",
      features: ["All document types", "Priority support", "99.9% uptime SLA", "Custom rate limits"],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      requests: "Unlimited extractions",
      features: ["All document types", "24/7 dedicated support", "99.99% uptime SLA", "Custom integrations", "On-premise deployment"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold text-xl">ExtractAI</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#documents" className="text-muted-foreground hover:text-foreground transition-colors">Documents</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">API Docs</a>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" data-testid="nav-login-btn">Log in</Button>
              </Link>
              <Link to="/register">
                <Button data-testid="nav-signup-btn" className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.15)_0%,transparent_50%)]" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm text-muted-foreground">Now with 99.8% extraction accuracy</span>
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Extract ID Data with
              <span className="gradient-text block">AI-Powered OCR</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Instantly extract Aadhaar, PAN, and Driving License data from images. 
              One API, all Indian ID documents, enterprise-grade accuracy.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" data-testid="hero-cta-btn" className="bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(99,102,241,0.4)] text-lg px-8">
                  Start Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/dashboard/docs">
                <Button size="lg" variant="outline" data-testid="hero-docs-btn" className="text-lg px-8">
                  View Documentation
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Code Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={copyCode}
                  data-testid="copy-code-btn"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <pre className="p-4 text-sm font-mono overflow-x-auto">
                <code className="text-muted-foreground">
                  <span className="text-accent">curl</span> -X POST <span className="text-primary">"https://api.ocrextract.io/api/v1/extract"</span> \{'\n'}
                  {'  '}-H <span className="text-primary">"X-API-Key: your_api_key"</span> \{'\n'}
                  {'  '}-H <span className="text-primary">"Content-Type: application/json"</span> \{'\n'}
                  {'  '}-d <span className="text-primary">'{`{"image_base64": "...", "document_type": "auto"}`}'</span>
                </code>
              </pre>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              Built for Developers, Trusted by Enterprises
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to integrate ID verification into your application
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-card/50 backdrop-blur border-border/50 hover:border-primary/30 transition-all duration-300 h-full">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Document Types Section */}
      <section id="documents" className="py-20 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              Supported Documents
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Extract structured data from all major Indian identity documents
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {documentTypes.map((doc, index) => (
              <motion.div
                key={doc.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 bg-card/50 backdrop-blur border-border/50 hover:border-accent/30 transition-all duration-300 group">
                  <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                    {doc.icon}
                  </div>
                  <h3 className="font-heading text-xl font-semibold mb-2">{doc.name}</h3>
                  <p className="text-sm text-muted-foreground">{doc.fields}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`p-6 bg-card/50 backdrop-blur border-border/50 h-full flex flex-col ${plan.popular ? 'border-primary ring-1 ring-primary/50' : ''}`}>
                  {plan.popular && (
                    <div className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full w-fit mb-4">
                      Most Popular
                    </div>
                  )}
                  <h3 className="font-heading text-xl font-semibold">{plan.name}</h3>
                  <div className="mt-4 mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.requests}</p>
                  <ul className="space-y-3 mb-6 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-accent" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register" className="mt-auto">
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      data-testid={`pricing-${plan.name.toLowerCase()}-btn`}
                    >
                      Get Started
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="p-12 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
                Ready to automate ID extraction?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join hundreds of companies using ExtractAI to streamline their KYC workflows.
              </p>
              <Link to="/register">
                <Button size="lg" data-testid="cta-signup-btn" className="bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(99,102,241,0.4)]">
                  Start Your Free Trial <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading font-bold">ExtractAI</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2024 ExtractAI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
