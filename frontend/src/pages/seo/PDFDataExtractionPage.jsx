import SEOLandingTemplate from '../../components/SEOLandingTemplate';
import { Target, Zap, TrendingUp } from 'lucide-react';

const PDFDataExtractionPage = () => {
  const extractedFields = [
    { name: "Custom Fields", description: "Define your own extraction schema" },
    { name: "Tables", description: "Extract tabular data as structured arrays" },
    { name: "Key-Value Pairs", description: "Extract labeled data automatically" },
    { name: "Text Blocks", description: "Extract specific text sections" },
    { name: "Dates", description: "All dates in standardized format" },
    { name: "Numbers", description: "Currency, percentages, quantities" },
    { name: "Signatures", description: "Detect signature presence" },
    { name: "Metadata", description: "PDF properties and page count" }
  ];

  const benefits = [
    { icon: Target, title: "99%+ Accuracy", description: "AI understands any PDF layout and structure" },
    { icon: Zap, title: "Under 3 Seconds", description: "Extract data from multi-page PDFs in seconds" },
    { icon: TrendingUp, title: "Bulk Processing", description: "Process thousands of PDFs with custom schemas" }
  ];

  const codeSnippet = `import requests

response = requests.post(
    "https://api.extractai.io/api/v1/extract",
    headers={"X-API-Key": "your_api_key"},
    files={"file": open("document.pdf", "rb")},
    data={"document_type": "custom"}
)
print(response.json())`;

  return (
    <SEOLandingTemplate
      title="PDF Data Extraction API — ExtractAI"
      description="Extract structured data from any PDF document using AI. Custom schema, fast API, supports all PDF formats."
      url="https://www.extractai.io/pdf-data-extraction"
      heroTitle="PDF Data Extraction API"
      heroSubtitle="Extract structured data from any PDF document using AI. Define custom extraction schemas or let our AI automatically identify and extract key information."
      documentType="PDF Document"
      documentTypeSlug="pdf"
      whatIsTitle="What is PDF Data Extraction?"
      whatIsDescription="PDFs are the most common document format in business, but extracting data from them is challenging. Traditional OCR fails with complex layouts. ExtractAI uses advanced AI to understand document structure and extract exactly the data you need, regardless of PDF format or complexity."
      extractedFields={extractedFields}
      codeSnippet={codeSnippet}
      benefits={benefits}
      ctaText="Start extracting PDF data today"
    />
  );
};

export default PDFDataExtractionPage;
