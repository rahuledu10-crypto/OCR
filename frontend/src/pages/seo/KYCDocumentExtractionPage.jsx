import SEOLandingTemplate from '../../components/SEOLandingTemplate';
import { Target, Zap, TrendingUp } from 'lucide-react';

const KYCDocumentExtractionPage = () => {
  const extractedFields = [
    { name: "Document Type", description: "Aadhaar, PAN, Passport, DL, Voter ID" },
    { name: "Full Name", description: "Name as printed on document" },
    { name: "Date of Birth", description: "DOB in standard format" },
    { name: "Address", description: "Complete address with pincode" },
    { name: "ID Number", description: "Unique identification number" },
    { name: "Expiry Date", description: "Document validity date (if applicable)" },
    { name: "Father's Name", description: "Guardian/father name (where available)" },
    { name: "Photo", description: "Extract photo for face matching" }
  ];

  const benefits = [
    { icon: Target, title: "99%+ Accuracy", description: "Accurate extraction from all major Indian ID documents" },
    { icon: Zap, title: "Under 3 Seconds", description: "Complete KYC data extraction in seconds for instant verification" },
    { icon: TrendingUp, title: "Bulk Processing", description: "Process thousands of KYC documents for onboarding automation" }
  ];

  const codeSnippet = `import requests

response = requests.post(
    "https://api.extractai.io/api/v1/extract",
    headers={"X-API-Key": "your_api_key"},
    files={"file": open("aadhaar_card.jpg", "rb")},
    data={"document_type": "kyc"}
)
print(response.json())`;

  return (
    <SEOLandingTemplate
      title="KYC Document Extraction API — ExtractAI"
      description="Automate KYC document data extraction. Extract data from Aadhaar, PAN, passports and more. Fast, accurate, secure."
      url="https://extractai.io/kyc-document-extraction"
      heroTitle="KYC Document Extraction & Automation"
      heroSubtitle="Automatically extract data from Aadhaar cards, PAN cards, passports, driving licenses, and voter IDs. Perfect for digital onboarding and identity verification."
      documentType="KYC Document"
      documentTypeSlug="kyc"
      whatIsTitle="What is KYC Document Extraction?"
      whatIsDescription="KYC (Know Your Customer) documents include government-issued IDs like Aadhaar, PAN, passports, and driving licenses. Manual verification of these documents during customer onboarding is slow and expensive. ExtractAI automates KYC data extraction while maintaining DPDPA compliance."
      extractedFields={extractedFields}
      codeSnippet={codeSnippet}
      benefits={benefits}
      ctaText="Start automating KYC verification today"
    />
  );
};

export default KYCDocumentExtractionPage;
