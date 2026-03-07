import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { 
  Copy, 
  Check,
  FileText,
  Key,
  Code,
  Terminal,
  Zap,
  AlertCircle
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DocsPage = () => {
  const [copiedSection, setCopiedSection] = useState(null);

  const copyCode = (code, section) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
    toast.success('Copied to clipboard');
  };

  const codeExamples = {
    curl: `curl -X POST "${BACKEND_URL}/api/v1/extract" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_base64": "BASE64_ENCODED_IMAGE",
    "document_type": "auto"
  }'`,
    python: `import requests
import base64

# Read and encode image
with open("document.jpg", "rb") as f:
    image_base64 = base64.b64encode(f.read()).decode()

# Make API request
response = requests.post(
    "${BACKEND_URL}/api/v1/extract",
    headers={
        "X-API-Key": "YOUR_API_KEY",
        "Content-Type": "application/json"
    },
    json={
        "image_base64": image_base64,
        "document_type": "auto"  # or "aadhaar", "pan", "dl"
    }
)

result = response.json()
print(result)`,
    javascript: `const fs = require('fs');
const axios = require('axios');

// Read and encode image
const imageBuffer = fs.readFileSync('document.jpg');
const imageBase64 = imageBuffer.toString('base64');

// Make API request
const response = await axios.post(
  '${BACKEND_URL}/api/v1/extract',
  {
    image_base64: imageBase64,
    document_type: 'auto'
  },
  {
    headers: {
      'X-API-Key': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  }
);

console.log(response.data);`,
    response: `{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "document_type": "pan",
  "extracted_data": {
    "pan_number": "ABCDE1234F",
    "name": "John Doe",
    "father_name": "Richard Doe",
    "date_of_birth": "15/08/1990"
  },
  "confidence": 0.95,
  "processing_time_ms": 1250,
  "timestamp": "2024-01-15T10:30:00Z"
}`
  };

  return (
    <div data-testid="docs-page" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">API Documentation</h1>
        <p className="text-muted-foreground">Learn how to integrate the OCR extraction API</p>
      </div>

      {/* Quick Start */}
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-heading font-semibold mb-1">Quick Start</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started in 3 simple steps: Generate an API key, encode your document image in base64, 
                and make a POST request to the extraction endpoint.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">1</div>
                  <span>Create API Key</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">2</div>
                  <span>Encode Image</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">3</div>
                  <span>Make Request</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Authentication */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <Key className="w-5 h-5" />
                Authentication
              </CardTitle>
              <CardDescription>All API requests require authentication via API key</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Include your API key in the <code className="px-1.5 py-0.5 bg-muted rounded text-primary">X-API-Key</code> header 
                with every request.
              </p>
              <div className="relative">
                <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-sm font-mono">
                  <code>X-API-Key: ocr_xxxxxxxxxxxxxxxxxxx</code>
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => copyCode('X-API-Key: ocr_xxxxxxxxxxxxxxxxxxx', 'auth')}
                >
                  {copiedSection === 'auth' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Keep your API keys secure. Never expose them in client-side code or public repositories.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Extract Endpoint */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Extract Document
              </CardTitle>
              <CardDescription>POST /api/v1/extract</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Request Body</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 font-medium">Parameter</th>
                        <th className="text-left py-2 pr-4 font-medium">Type</th>
                        <th className="text-left py-2 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="py-2 pr-4 font-mono text-primary">image_base64</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2 text-muted-foreground">Base64-encoded image (required)</td>
                      </tr>
                      <tr>
                        <td className="py-2 pr-4 font-mono text-primary">document_type</td>
                        <td className="py-2 pr-4">string</td>
                        <td className="py-2 text-muted-foreground">
                          Optional. One of: <code className="text-xs">auto</code>, <code className="text-xs">aadhaar</code>, 
                          <code className="text-xs">pan</code>, <code className="text-xs">dl</code>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <Tabs defaultValue="curl" className="w-full">
                <TabsList className="bg-muted/50">
                  <TabsTrigger value="curl" data-testid="docs-curl-tab">
                    <Terminal className="w-4 h-4 mr-2" />
                    cURL
                  </TabsTrigger>
                  <TabsTrigger value="python" data-testid="docs-python-tab">
                    <Code className="w-4 h-4 mr-2" />
                    Python
                  </TabsTrigger>
                  <TabsTrigger value="javascript" data-testid="docs-js-tab">
                    <Code className="w-4 h-4 mr-2" />
                    JavaScript
                  </TabsTrigger>
                </TabsList>
                
                {['curl', 'python', 'javascript'].map((lang) => (
                  <TabsContent key={lang} value={lang}>
                    <div className="relative">
                      <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-sm font-mono max-h-80">
                        <code>{codeExamples[lang]}</code>
                      </pre>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => copyCode(codeExamples[lang], lang)}
                        data-testid={`copy-${lang}-btn`}
                      >
                        {copiedSection === lang ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Response Format */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Response Format</CardTitle>
              <CardDescription>Successful extraction returns structured data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-sm font-mono">
                  <code>{codeExamples.response}</code>
                </pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => copyCode(codeExamples.response, 'response')}
                  data-testid="copy-response-btn"
                >
                  {copiedSection === 'response' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Supported Documents */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Supported Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground mb-3">15+ document types supported</p>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-sm">ID Documents</p>
                <p className="text-xs text-muted-foreground">Aadhaar, PAN, DL, Passport, Voter ID</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-sm">Business Documents</p>
                <p className="text-xs text-muted-foreground">Invoice, PO, Challan, E-way Bill</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-sm">Financial Documents</p>
                <p className="text-xs text-muted-foreground">Cheque, Bank Statement, Salary Slip</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium text-sm">Medical & Legal</p>
                <p className="text-xs text-muted-foreground">Prescription, Lab Report, Rent Agreement</p>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Rate Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Rate limits vary by plan:
              </p>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Free</span>
                <span className="font-mono">10 req/min</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Starter</span>
                <span className="font-mono">30 req/min</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-muted-foreground">Growth</span>
                <span className="font-mono">100 req/min</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Enterprise</span>
                <span className="font-mono">500 req/min</span>
              </div>
            </CardContent>
          </Card>

          {/* Error Codes */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-heading text-lg">Error Codes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="font-mono text-destructive">401</span>
                <span className="text-muted-foreground">Invalid API key</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="font-mono text-yellow-500">402</span>
                <span className="text-muted-foreground">Usage limit exceeded</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="font-mono text-destructive">429</span>
                <span className="text-muted-foreground">Rate limit exceeded</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="font-mono text-destructive">400</span>
                <span className="text-muted-foreground">Invalid request</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-mono text-destructive">500</span>
                <span className="text-muted-foreground">Processing error</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
