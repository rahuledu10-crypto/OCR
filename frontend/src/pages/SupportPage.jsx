import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { 
  HelpCircle, 
  Mail, 
  BookOpen, 
  Send,
  Loader2,
  Key,
  FileText,
  BarChart3,
  CreditCard,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: "How do I get my API key?",
    answer: "Go to the API Keys page in your dashboard, click 'Create New Key', give it a name, and your key will be generated. Copy it immediately as it's only shown once.",
    icon: Key
  },
  {
    question: "What documents are supported?",
    answer: "ExtractAI supports 17+ document types including Aadhaar, PAN, Driving License, Passport, Voter ID, Invoices, Cheques, Bank Statements, and more.",
    icon: FileText
  },
  {
    question: "How is usage calculated?",
    answer: "Each successful document extraction counts as one usage. Failed extractions don't count. Free tier includes 100 one-time extractions.",
    icon: BarChart3
  },
  {
    question: "How do I upgrade my plan?",
    answer: "Click the 'Upgrade Plan' button on your dashboard. Select your preferred plan and complete the payment. Your new limits activate immediately.",
    icon: CreditCard
  }
];

const SupportPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    
    // Simulated submission
    setTimeout(() => {
      toast.success('Message sent successfully!', {
        description: "We'll get back to you within 24 hours."
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setLoading(false);
    }, 1500);
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="space-y-8" data-testid="support-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-primary" />
          Support & Help
        </h1>
        <p className="text-muted-foreground mt-1">
          Get help with ExtractAI or contact our support team
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="bg-background/50"
                      data-testid="support-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@company.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="bg-background/50"
                      data-testid="support-email-input"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="How can we help?"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className="bg-background/50"
                    data-testid="support-subject-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    name="message"
                    placeholder="Describe your issue or question..."
                    value={formData.message}
                    onChange={handleInputChange}
                    className="bg-background/50 min-h-[120px]"
                    data-testid="support-message-input"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading}
                  data-testid="support-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Support Options */}
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Email Support</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      support@extractai.io
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Documentation</p>
                    <Link 
                      to="/dashboard/docs" 
                      className="text-primary text-sm hover:underline mt-1 inline-block"
                    >
                      View API Docs
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {FAQ_ITEMS.map((faq, index) => (
                <div 
                  key={index}
                  className="border border-border/50 rounded-lg overflow-hidden"
                  data-testid={`faq-item-${index}`}
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <faq.icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-sm">{faq.question}</span>
                    </div>
                    {expandedFaq === index ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </button>
                  {expandedFaq === index && (
                    <div className="px-4 pb-4 pt-0">
                      <p className="text-sm text-muted-foreground pl-11">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SupportPage;
