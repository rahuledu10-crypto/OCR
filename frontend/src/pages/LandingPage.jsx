import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import SEO from '../components/SEO';
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
  Copy,
  Truck,
  Landmark,
  Users,
  Heart,
  Scale,
  ShoppingBag,
  Receipt,
  FileCheck,
  Stethoscope,
  Home,
  Package,
  Menu,
  X
} from 'lucide-react';

const LandingPage = () => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('logistics');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(`curl -X POST "https://api.ocrextract.io/api/v1/extract" \\
  -H "X-API-Key: your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{"image_base64": "...", "document_type": "auto"}'`);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const industries = {
    logistics: {
      name: "Logistics & Transport",
      icon: Truck,
      description: "Automate trucker KYC, POD processing and freight document digitisation",
      documents: [
        { name: "RC Certificate", fields: ["Reg. Number", "Owner Name", "Valid Upto", "Insurance"], icon: Car },
        { name: "Driving License", fields: ["DL Number", "Name", "Validity", "Vehicle Class"], icon: IdCard },
        { name: "Aadhaar Card", fields: ["UID", "Name", "DOB", "Address"], icon: IdCard },
        { name: "Proof of Delivery", fields: ["POD Number", "Date", "Receiver", "Signature"], icon: FileCheck },
        { name: "E-way Bill", fields: ["Bill Number", "From/To", "Vehicle No", "Value"], icon: Receipt },
        { name: "Freight Invoice", fields: ["Invoice No", "Amount", "GST", "Route"], icon: FileText }
      ]
    },
    banking: {
      name: "Banking & Finance",
      icon: Landmark,
      description: "Accelerate KYC, loan processing and financial document verification",
      documents: [
        { name: "PAN Card", fields: ["PAN Number", "Name", "DOB", "Father's Name"], icon: CreditCard },
        { name: "Aadhaar Card", fields: ["UID", "Name", "DOB", "Address"], icon: IdCard },
        { name: "Bank Cheque", fields: ["Cheque No", "Payee", "Amount", "IFSC"], icon: CreditCard },
        { name: "Bank Statement", fields: ["Account No", "Balance", "Transactions"], icon: FileText },
        { name: "Salary Slip", fields: ["Employee ID", "Basic", "Deductions", "Net Pay"], icon: Receipt },
        { name: "Income Tax Return", fields: ["PAN", "AY", "Total Income", "Tax Paid"], icon: FileText }
      ]
    },
    hr: {
      name: "HR & Staffing",
      icon: Users,
      description: "Speed up employee onboarding and background verification",
      documents: [
        { name: "Aadhaar Card", fields: ["UID", "Name", "DOB", "Address"], icon: IdCard },
        { name: "PAN Card", fields: ["PAN Number", "Name", "DOB"], icon: CreditCard },
        { name: "Driving License", fields: ["DL Number", "Name", "Validity"], icon: Car },
        { name: "Salary Slip", fields: ["Employee ID", "Month", "Net Salary"], icon: Receipt },
        { name: "Offer Letter", fields: ["Company", "Role", "CTC", "Join Date"], icon: FileText },
        { name: "Educational Certificate", fields: ["Degree", "University", "Year", "Grade"], icon: FileCheck }
      ]
    },
    healthcare: {
      name: "Healthcare",
      icon: Heart,
      description: "Digitise patient records and insurance claim documents instantly",
      documents: [
        { name: "Prescription", fields: ["Doctor", "Patient", "Medicines", "Dosage"], icon: Stethoscope },
        { name: "Lab Report", fields: ["Test Name", "Result", "Reference", "Date"], icon: FileText },
        { name: "Aadhaar Card", fields: ["UID", "Name", "DOB", "Address"], icon: IdCard },
        { name: "Health Insurance", fields: ["Policy No", "Member", "Coverage", "Validity"], icon: CreditCard },
        { name: "Discharge Summary", fields: ["Patient", "Diagnosis", "Treatment", "Date"], icon: FileCheck }
      ]
    },
    legal: {
      name: "Legal & Property",
      icon: Scale,
      description: "Extract structured data from legal agreements and property documents",
      documents: [
        { name: "Rent Agreement", fields: ["Landlord", "Tenant", "Rent", "Duration"], icon: Home },
        { name: "Sale Deed", fields: ["Seller", "Buyer", "Property", "Value"], icon: FileText },
        { name: "Aadhaar Card", fields: ["UID", "Name", "DOB", "Address"], icon: IdCard },
        { name: "PAN Card", fields: ["PAN Number", "Name", "DOB"], icon: CreditCard },
        { name: "Property Tax Receipt", fields: ["Property ID", "Owner", "Amount", "Year"], icon: Receipt },
        { name: "NOC Document", fields: ["Issuer", "Purpose", "Date", "Validity"], icon: FileCheck }
      ]
    },
    ecommerce: {
      name: "E-Commerce & Retail",
      icon: ShoppingBag,
      description: "Automate invoice processing and supply chain document handling",
      documents: [
        { name: "GST Invoice", fields: ["Invoice No", "GSTIN", "Items", "Total"], icon: Receipt },
        { name: "Purchase Order", fields: ["PO Number", "Vendor", "Items", "Value"], icon: Package },
        { name: "Delivery Challan", fields: ["Challan No", "Items", "Qty", "Receiver"], icon: FileCheck },
        { name: "E-way Bill", fields: ["Bill Number", "HSN", "Vehicle", "Value"], icon: Receipt },
        { name: "Credit Note", fields: ["CN Number", "Reason", "Amount", "Date"], icon: FileText },
        { name: "Debit Note", fields: ["DN Number", "Reason", "Amount", "Date"], icon: FileText }
      ]
    }
  };

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Sub-2s Response",
      description: "Production-grade latency. Process documents at scale without bottlenecks."
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Bank-Grade Security",
      description: "End-to-end encryption. Your documents are processed and immediately discarded."
    },
    {
      icon: <Code className="w-6 h-6" />,
      title: "Developer First",
      description: "RESTful API, SDKs for Python & Node.js, webhooks, and batch processing."
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "₹0",
      period: "/month",
      requests: "100 extractions",
      features: ["Aadhaar, PAN, DL supported", "API access", "Dashboard access"]
    },
    {
      name: "Starter",
      price: "₹499",
      period: "/month",
      requests: "1,000 extractions",
      features: ["All document types", "Standard support", "99.5% uptime SLA"]
    },
    {
      name: "Growth",
      price: "₹1,999",
      period: "/month",
      requests: "5,000 extractions",
      features: ["All document types", "Priority support", "99.9% uptime SLA", "Custom rate limits"],
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      requests: "Unlimited extractions",
      features: ["All document types", "24/7 dedicated support", "99.99% uptime SLA", "Custom integrations", "WhatsApp integration"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title="ExtractAI — AI-Powered Document Data Extraction | OCR API"
        description="Extract structured data from invoices, contracts, IDs and any document in seconds. Powerful OCR API with flexible pricing. Free to try."
        url="https://extractai.io/"
      />
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
              <a href="#documents" className="text-muted-foreground hover:text-foreground transition-colors">Solutions</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors">API Docs</Link>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" data-testid="nav-login-btn">Log in</Button>
              </Link>
              <Link to="/register" className="hidden sm:block">
                <Button data-testid="nav-signup-btn" className="bg-primary hover:bg-primary/90 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  Get Started
                </Button>
              </Link>
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                data-testid="mobile-menu-toggle"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-card border-t border-border"
            >
              <div className="px-4 py-4 space-y-3">
                <a 
                  href="#features" 
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a 
                  href="#documents" 
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Solutions
                </a>
                <a 
                  href="#pricing" 
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Pricing
                </a>
                <Link 
                  to="/docs" 
                  className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  API Docs
                </Link>
                <div className="pt-3 border-t border-border space-y-2">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full bg-primary hover:bg-primary/90">Get Started</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-6">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-sm font-medium text-accent">Powering document intelligence for 500+ companies</span>
            </div>
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              The API that reads
              <span className="gradient-text block">every document</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Extract structured data from IDs, invoices, cheques, and 15+ document types 
              with a single API call. Built for developers who need accuracy at scale.
            </p>
            
            {/* Stats Row */}
            <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">99.2%</p>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </div>
              <div className="w-px h-10 bg-border hidden sm:block" />
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">&lt;2s</p>
                <p className="text-sm text-muted-foreground">Response time</p>
              </div>
              <div className="w-px h-10 bg-border hidden sm:block" />
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">15+</p>
                <p className="text-sm text-muted-foreground">Document types</p>
              </div>
              <div className="w-px h-10 bg-border hidden sm:block" />
              <div className="text-center">
                <p className="text-3xl font-bold text-accent">₹0.20</p>
                <p className="text-sm text-muted-foreground">Per extraction</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" data-testid="hero-cta-btn" className="bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(99,102,241,0.4)] text-lg px-8 h-14">
                  Start Building — It's Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="https://calendly.com/rahul-extractai/30min" target="_blank" rel="noopener noreferrer">
                <Button size="lg" variant="outline" data-testid="hero-demo-btn" className="text-lg px-8 h-14">
                  Schedule a Demo
                </Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              100 free extractions • No credit card required • <Link to="/docs" className="text-primary hover:underline">Read the docs</Link>
            </p>
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

      {/* Solutions by Industry Section */}
      <section id="documents" className="py-20 px-4 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              Built For Every Industry
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Click your industry to see supported documents
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Industry Sidebar */}
            <div className="lg:col-span-4 xl:col-span-3">
              <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0">
                {Object.entries(industries).map(([key, industry]) => {
                  const IconComponent = industry.icon;
                  const isSelected = selectedIndustry === key;
                  return (
                    <motion.button
                      key={key}
                      onClick={() => setSelectedIndustry(key)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 min-w-[200px] lg:min-w-0 lg:w-full ${
                        isSelected 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' 
                          : 'bg-card/50 hover:bg-card border border-border/50 hover:border-primary/30'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-white/20' : 'bg-primary/10'
                      }`}>
                        <IconComponent className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-primary'}`} />
                      </div>
                      <span className="font-medium text-sm">{industry.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Documents Panel */}
            <div className="lg:col-span-8 xl:col-span-9">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedIndustry}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Industry Description */}
                  <div className="mb-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-muted-foreground">
                      {industries[selectedIndustry].description}
                    </p>
                  </div>

                  {/* Document Cards Grid */}
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {industries[selectedIndustry].documents.map((doc, index) => {
                      const DocIcon = doc.icon;
                      return (
                        <motion.div
                          key={doc.name}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Card className="p-4 bg-card/50 backdrop-blur border-border/50 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 h-full group">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0 group-hover:scale-110 transition-transform">
                                <DocIcon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-heading font-semibold text-sm mb-2">{doc.name}</h4>
                                <div className="flex flex-wrap gap-1.5">
                                  {doc.fields.map((field) => (
                                    <span 
                                      key={field}
                                      className="inline-block px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground"
                                    >
                                      {field}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
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
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl sm:text-5xl font-bold mb-6">
              Ready to automate document processing?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join hundreds of companies using ExtractAI to eliminate manual data entry 
              and accelerate their operations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" data-testid="cta-signup-btn" className="bg-primary hover:bg-primary/90 shadow-[0_0_30px_rgba(99,102,241,0.4)] text-lg px-10 h-14">
                  Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <a href="mailto:sales@extractai.io">
                <Button size="lg" variant="outline" className="text-lg px-10 h-14">
                  Talk to Sales
                </Button>
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              100 free extractions • No credit card required • Setup in 2 minutes
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-border/50 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="font-heading font-bold text-xl">ExtractAI</span>
              </div>
              <p className="text-muted-foreground text-sm max-w-sm">
                The document intelligence API for modern businesses. 
                Extract structured data from any document with a single API call.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><Link to="/docs" className="hover:text-foreground transition-colors">API Documentation</Link></li>
                <li><a href="#documents" className="hover:text-foreground transition-colors">Supported Documents</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="mailto:support@extractai.io" className="hover:text-foreground transition-colors">Support</a></li>
                <li><a href="mailto:sales@extractai.io" className="hover:text-foreground transition-colors">Sales</a></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                &copy; 2025 ExtractAI. All rights reserved.
              </p>
              <span className="text-muted-foreground/30 hidden sm:inline">|</span>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Terms</Link>
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">Privacy</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              Made in India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
