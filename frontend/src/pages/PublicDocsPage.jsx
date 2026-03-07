import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  FileText, 
  Copy, 
  Check,
  ArrowRight,
  Code,
  Terminal,
  Zap
} from 'lucide-react';

const PublicDocsPage = () => {
  const [copiedCode, setCopiedCode] = useState(null);

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const curlExample = `curl -X POST "https://api.extractai.io/api/v1/extract" \\
  -H "X-API-Key: your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_base64": "your_base64_image",
    "document_type": "auto"
  }'`;

  const pythonExample = `from extractai import ExtractAI

client = ExtractAI(api_key="your_api_key")

# Extract from file
result = client.extract("aadhaar.jpg")
print(result.aadhaar_number)  # "1234 5678 9012"
print(result.name)            # "John Doe"
print(result.confidence)      # 0.95`;

  const nodeExample = `const ExtractAI = require('extractai');

const client = new ExtractAI('your_api_key');

// Extract from file
const result = await client.extract('aadhaar.jpg');
console.log(result.aadhaarNumber);  // "1234 5678 9012"
console.log(result.name);            // "John Doe"`;

  const responseExample = `{
  "id": "ext_abc123",
  "document_type": "aadhaar",
  "extracted_data": {
    "aadhaar_number": "1234 5678 9012",
    "name": "John Doe",
    "date_of_birth": "01/01/1990",
    "gender": "Male",
    "address": "123 Main St, Mumbai"
  },
  "confidence": 0.95,
  "processing_time_ms": 1250
}`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-bold text-xl">ExtractAI</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-primary hover:bg-primary/90">Get API Key</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="font-heading text-4xl sm:text-5xl font-bold mb-4">
              API Documentation
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to integrate ExtractAI into your application
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-2">
                <a href="#quickstart" className="block px-4 py-2 rounded-lg hover:bg-muted text-sm font-medium">
                  Quick Start
                </a>
                <a href="#authentication" className="block px-4 py-2 rounded-lg hover:bg-muted text-sm text-muted-foreground">
                  Authentication
                </a>
                <a href="#extract" className="block px-4 py-2 rounded-lg hover:bg-muted text-sm text-muted-foreground">
                  Extract Endpoint
                </a>
                <a href="#batch" className="block px-4 py-2 rounded-lg hover:bg-muted text-sm text-muted-foreground">
                  Batch Processing
                </a>
                <a href="#documents" className="block px-4 py-2 rounded-lg hover:bg-muted text-sm text-muted-foreground">
                  Document Types
                </a>
                <a href="#sdks" className="block px-4 py-2 rounded-lg hover:bg-muted text-sm text-muted-foreground">
                  SDKs
                </a>
                <a href="#errors" className="block px-4 py-2 rounded-lg hover:bg-muted text-sm text-muted-foreground">
                  Error Codes
                </a>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3 space-y-12">
              {/* Quick Start */}
              <section id="quickstart">
                <h2 className="font-heading text-2xl font-bold mb-4">Quick Start</h2>
                <p className="text-muted-foreground mb-6">
                  Get started with ExtractAI in under 2 minutes. Sign up, get your API key, and make your first extraction.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">1</div>
                    <div>
                      <p className="font-medium">Create an account</p>
                      <p className="text-sm text-muted-foreground">Sign up for free and get 100 extractions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">2</div>
                    <div>
                      <p className="font-medium">Get your API key</p>
                      <p className="text-sm text-muted-foreground">Generate an API key from your dashboard.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold shrink-0">3</div>
                    <div>
                      <p className="font-medium">Make your first request</p>
                      <p className="text-sm text-muted-foreground">Use the code below to extract data from a document.</p>
                    </div>
                  </div>
                </div>

                <Card className="mt-6 bg-zinc-900 border-zinc-800">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">cURL</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyCode(curlExample, 'curl')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedCode === 'curl' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="text-green-400">{curlExample}</code>
                  </pre>
                </Card>
              </section>

              {/* Authentication */}
              <section id="authentication">
                <h2 className="font-heading text-2xl font-bold mb-4">Authentication</h2>
                <p className="text-muted-foreground mb-6">
                  All API requests require authentication using your API key. Include it in the <code className="px-1.5 py-0.5 bg-muted rounded text-sm">X-API-Key</code> header.
                </p>
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="pt-6">
                    <pre className="text-sm overflow-x-auto">
                      <code>X-API-Key: ocr_your_api_key_here</code>
                    </pre>
                  </CardContent>
                </Card>
              </section>

              {/* Extract Endpoint */}
              <section id="extract">
                <h2 className="font-heading text-2xl font-bold mb-4">Extract Endpoint</h2>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-green-500/20 text-green-500 text-xs font-mono rounded">POST</span>
                  <code className="text-sm">/api/v1/extract</code>
                </div>
                
                <h3 className="font-semibold mt-6 mb-2">Request Body</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4">Parameter</th>
                        <th className="text-left py-2 pr-4">Type</th>
                        <th className="text-left py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono">image_base64</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2">Base64-encoded image (required)</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono">document_type</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2">Type hint: aadhaar, pan, invoice, etc. (optional, default: auto)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="font-semibold mt-6 mb-2">Response</h3>
                <Card className="bg-zinc-900 border-zinc-800">
                  <pre className="p-4 overflow-x-auto text-sm">
                    <code className="text-blue-400">{responseExample}</code>
                  </pre>
                </Card>
              </section>

              {/* Document Types */}
              <section id="documents">
                <h2 className="font-heading text-2xl font-bold mb-4">Supported Document Types</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">ID Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <ul className="space-y-1">
                        <li><code className="text-xs bg-muted px-1 rounded">aadhaar</code> - Aadhaar Card</li>
                        <li><code className="text-xs bg-muted px-1 rounded">pan</code> - PAN Card</li>
                        <li><code className="text-xs bg-muted px-1 rounded">dl</code> - Driving License</li>
                        <li><code className="text-xs bg-muted px-1 rounded">passport</code> - Passport</li>
                        <li><code className="text-xs bg-muted px-1 rounded">voter_id</code> - Voter ID</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Business Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <ul className="space-y-1">
                        <li><code className="text-xs bg-muted px-1 rounded">invoice</code> - GST Invoice</li>
                        <li><code className="text-xs bg-muted px-1 rounded">purchase_order</code> - Purchase Order</li>
                        <li><code className="text-xs bg-muted px-1 rounded">delivery_challan</code> - Delivery Challan</li>
                        <li><code className="text-xs bg-muted px-1 rounded">eway_bill</code> - E-way Bill</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Financial Documents</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <ul className="space-y-1">
                        <li><code className="text-xs bg-muted px-1 rounded">cheque</code> - Bank Cheque</li>
                        <li><code className="text-xs bg-muted px-1 rounded">bank_statement</code> - Bank Statement</li>
                        <li><code className="text-xs bg-muted px-1 rounded">salary_slip</code> - Salary Slip</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Medical & Legal</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <ul className="space-y-1">
                        <li><code className="text-xs bg-muted px-1 rounded">prescription</code> - Prescription</li>
                        <li><code className="text-xs bg-muted px-1 rounded">lab_report</code> - Lab Report</li>
                        <li><code className="text-xs bg-muted px-1 rounded">rent_agreement</code> - Rent Agreement</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </section>

              {/* SDKs */}
              <section id="sdks">
                <h2 className="font-heading text-2xl font-bold mb-4">SDKs</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Code className="w-4 h-4" /> Python
                    </h3>
                    <Card className="bg-zinc-900 border-zinc-800">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                        <span className="text-sm text-muted-foreground">pip install extractai</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyCode(pythonExample, 'python')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedCode === 'python' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <pre className="p-4 overflow-x-auto text-sm">
                        <code className="text-yellow-400">{pythonExample}</code>
                      </pre>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Code className="w-4 h-4" /> Node.js
                    </h3>
                    <Card className="bg-zinc-900 border-zinc-800">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
                        <span className="text-sm text-muted-foreground">npm install extractai</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => copyCode(nodeExample, 'node')}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {copiedCode === 'node' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <pre className="p-4 overflow-x-auto text-sm">
                        <code className="text-green-400">{nodeExample}</code>
                      </pre>
                    </Card>
                  </div>
                </div>
              </section>

              {/* Error Codes */}
              <section id="errors">
                <h2 className="font-heading text-2xl font-bold mb-4">Error Codes</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4">Code</th>
                        <th className="text-left py-2 pr-4">Status</th>
                        <th className="text-left py-2">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted-foreground">
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-red-500">401</td>
                        <td className="py-2 pr-4">Unauthorized</td>
                        <td className="py-2">Invalid or missing API key</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-yellow-500">402</td>
                        <td className="py-2 pr-4">Payment Required</td>
                        <td className="py-2">Usage limit exceeded. Upgrade plan or add wallet balance.</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-red-500">429</td>
                        <td className="py-2 pr-4">Too Many Requests</td>
                        <td className="py-2">Rate limit exceeded. Slow down your requests.</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-red-500">400</td>
                        <td className="py-2 pr-4">Bad Request</td>
                        <td className="py-2">Invalid request body or parameters</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-red-500">500</td>
                        <td className="py-2 pr-4">Server Error</td>
                        <td className="py-2">Processing error. Try again or contact support.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* CTA */}
              <Card className="p-8 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <div className="text-center">
                  <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                  <h3 className="font-heading text-2xl font-bold mb-2">Ready to get started?</h3>
                  <p className="text-muted-foreground mb-6">Create your free account and get 100 extractions instantly.</p>
                  <Link to="/register">
                    <Button size="lg" className="bg-primary hover:bg-primary/90">
                      Get Your API Key <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PublicDocsPage;
