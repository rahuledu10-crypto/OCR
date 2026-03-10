import SEOLandingTemplate from '../../components/SEOLandingTemplate';
import { Target, Zap, TrendingUp } from 'lucide-react';

const LorryReceiptExtractionPage = () => {
  const extractedFields = [
    { name: "LR Number", description: "Unique lorry receipt/bilty number" },
    { name: "LR Date", description: "Date of consignment booking" },
    { name: "Consignor", description: "Sender name and address" },
    { name: "Consignee", description: "Receiver name and address" },
    { name: "Origin", description: "Pickup location/city" },
    { name: "Destination", description: "Delivery location/city" },
    { name: "Weight", description: "Total weight of consignment" },
    { name: "Freight Amount", description: "Transportation charges" }
  ];

  const benefits = [
    { icon: Target, title: "99%+ Accuracy", description: "Accurately extract data from handwritten and printed lorry receipts" },
    { icon: Zap, title: "Under 3 Seconds", description: "Process LR documents instantly for real-time tracking updates" },
    { icon: TrendingUp, title: "Bulk Processing", description: "Process thousands of LRs daily for logistics automation" }
  ];

  const codeSnippet = `import requests

response = requests.post(
    "https://api.extractai.io/api/v1/extract",
    headers={"X-API-Key": "your_api_key"},
    files={"file": open("lorry_receipt.pdf", "rb")},
    data={"document_type": "lorry_receipt"}
)
print(response.json())`;

  return (
    <SEOLandingTemplate
      title="Lorry Receipt & Bilty Data Extraction — ExtractAI"
      description="Extract LR numbers, consignor, consignee, freight details from lorry receipts and bilty documents automatically."
      url="https://www.extractai.io/lorry-receipt-extraction"
      heroTitle="Lorry Receipt & Bilty Extraction"
      heroSubtitle="Automatically extract LR numbers, consignor/consignee details, freight amounts, and tracking information from lorry receipts and bilty documents."
      documentType="Lorry Receipt"
      documentTypeSlug="lorry-receipt"
      whatIsTitle="What is Lorry Receipt (LR/Bilty) Extraction?"
      whatIsDescription="Lorry receipts (LR) or bilty documents are essential shipping documents in Indian logistics. They contain consignment details, freight charges, and tracking information. Manual data entry from thousands of LRs daily is a major bottleneck for logistics companies. ExtractAI automates this process entirely."
      extractedFields={extractedFields}
      codeSnippet={codeSnippet}
      benefits={benefits}
      ctaText="Start extracting lorry receipt data today"
    />
  );
};

export default LorryReceiptExtractionPage;
