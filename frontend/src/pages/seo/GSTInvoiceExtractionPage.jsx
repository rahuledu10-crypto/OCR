import SEOLandingTemplate from '../../components/SEOLandingTemplate';
import { Target, Zap, TrendingUp } from 'lucide-react';

const GSTInvoiceExtractionPage = () => {
  const extractedFields = [
    { name: "GSTIN", description: "Seller and buyer GST identification numbers" },
    { name: "Invoice Number", description: "Unique invoice reference number" },
    { name: "Invoice Date", description: "Date of invoice generation" },
    { name: "HSN Code", description: "Harmonized System of Nomenclature codes" },
    { name: "Taxable Amount", description: "Pre-tax amount for each line item" },
    { name: "CGST", description: "Central GST amount" },
    { name: "SGST/IGST", description: "State/Integrated GST amount" },
    { name: "Total Amount", description: "Final invoice total with taxes" }
  ];

  const benefits = [
    { icon: Target, title: "99%+ Accuracy", description: "AI-powered extraction ensures highly accurate data capture from GST invoices of any format" },
    { icon: Zap, title: "Under 3 Seconds", description: "Extract all fields from a GST invoice in less than 3 seconds via API" },
    { icon: TrendingUp, title: "Bulk Processing", description: "Process thousands of GST invoices simultaneously for GST filing and reconciliation" }
  ];

  const codeSnippet = `import requests

response = requests.post(
    "https://api.extractai.io/api/v1/extract",
    headers={"X-API-Key": "your_api_key"},
    files={"file": open("gst_invoice.pdf", "rb")},
    data={"document_type": "gst_invoice"}
)
print(response.json())`;

  return (
    <SEOLandingTemplate
      title="GST Invoice Data Extraction API — ExtractAI"
      description="Automatically extract GSTIN, invoice numbers, HSN codes, tax amounts from GST invoices. Fast, accurate OCR API. Free to try."
      url="https://www.extractai.io/gst-invoice-extraction"
      heroTitle="GST Invoice Data Extraction"
      heroSubtitle="Automatically extract GSTIN, HSN codes, tax amounts, and all line items from GST invoices. Perfect for GST filing, reconciliation, and accounting automation."
      documentType="GST Invoice"
      documentTypeSlug="gst-invoice"
      whatIsTitle="What is GST Invoice Extraction?"
      whatIsDescription="GST invoices contain critical tax information including GSTIN numbers, HSN codes, CGST, SGST, and IGST amounts. Manually entering this data for GST returns and reconciliation is time-consuming and error-prone. ExtractAI automates the entire process, extracting all fields accurately in seconds."
      extractedFields={extractedFields}
      codeSnippet={codeSnippet}
      benefits={benefits}
      ctaText="Start extracting GST invoice data today"
    />
  );
};

export default GSTInvoiceExtractionPage;
