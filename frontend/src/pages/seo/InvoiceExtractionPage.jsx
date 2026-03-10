import SEOLandingTemplate from '../../components/SEOLandingTemplate';
import { Target, Zap, TrendingUp } from 'lucide-react';

const InvoiceExtractionPage = () => {
  const extractedFields = [
    { name: "Invoice Number", description: "Unique invoice identifier" },
    { name: "Invoice Date", description: "Date of invoice" },
    { name: "Vendor Name", description: "Seller/vendor company name" },
    { name: "Vendor Address", description: "Complete vendor address" },
    { name: "Line Items", description: "Products/services with quantities" },
    { name: "Subtotal", description: "Pre-tax total amount" },
    { name: "Tax Amount", description: "Applicable tax amounts" },
    { name: "Total Amount", description: "Final payable amount" }
  ];

  const benefits = [
    { icon: Target, title: "99%+ Accuracy", description: "Accurately extract from any invoice format or layout" },
    { icon: Zap, title: "Under 3 Seconds", description: "Process invoices instantly for accounts payable automation" },
    { icon: TrendingUp, title: "Bulk Processing", description: "Process thousands of invoices for AP automation" }
  ];

  const codeSnippet = `import requests

response = requests.post(
    "https://api.extractai.io/api/v1/extract",
    headers={"X-API-Key": "your_api_key"},
    files={"file": open("invoice.pdf", "rb")},
    data={"document_type": "invoice"}
)
print(response.json())`;

  return (
    <SEOLandingTemplate
      title="Invoice Data Extraction API — ExtractAI"
      description="Extract invoice numbers, line items, totals and vendor details from any invoice format automatically."
      url="https://extractai.io/invoice-extraction"
      heroTitle="Invoice Data Extraction"
      heroSubtitle="Automatically extract invoice numbers, line items, tax amounts, and vendor details from any invoice format. Perfect for accounts payable automation."
      documentType="Invoice"
      documentTypeSlug="invoice"
      whatIsTitle="What is Invoice Extraction?"
      whatIsDescription="Invoices come in countless formats from different vendors. Manually entering invoice data for accounts payable is slow and error-prone. ExtractAI uses AI to understand any invoice layout and extract structured data for seamless ERP integration."
      extractedFields={extractedFields}
      codeSnippet={codeSnippet}
      benefits={benefits}
      ctaText="Start extracting invoice data today"
    />
  );
};

export default InvoiceExtractionPage;
