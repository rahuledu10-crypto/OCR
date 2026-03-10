import SEOLandingTemplate from '../../components/SEOLandingTemplate';
import { Target, Zap, TrendingUp } from 'lucide-react';

const AadhaarExtractionPage = () => {
  const extractedFields = [
    { name: "Aadhaar Number", description: "12-digit unique ID number" },
    { name: "Full Name", description: "Name as on Aadhaar card" },
    { name: "Date of Birth", description: "DOB in standard format" },
    { name: "Gender", description: "Male/Female/Other" },
    { name: "Address", description: "Complete address with pincode" },
    { name: "Father's Name", description: "S/O or D/O name" },
    { name: "QR Code Data", description: "Signed XML data from QR" },
    { name: "Photo", description: "Profile photo for face match" }
  ];

  const benefits = [
    { icon: Target, title: "99%+ Accuracy", description: "Accurate extraction from both physical and e-Aadhaar" },
    { icon: Zap, title: "Under 3 Seconds", description: "Extract and verify Aadhaar data instantly" },
    { icon: TrendingUp, title: "Bulk Processing", description: "Process thousands of Aadhaar cards for mass verification" }
  ];

  const codeSnippet = `import requests

response = requests.post(
    "https://api.extractai.io/api/v1/extract",
    headers={"X-API-Key": "your_api_key"},
    files={"file": open("aadhaar_card.jpg", "rb")},
    data={"document_type": "aadhaar"}
)
print(response.json())`;

  return (
    <SEOLandingTemplate
      title="Aadhaar Card Data Extraction API — ExtractAI"
      description="Extract name, DOB, address and Aadhaar number from Aadhaar cards instantly. Secure, DPDPA compliant."
      url="https://extractai.io/aadhaar-extraction"
      heroTitle="Aadhaar Card Data Extraction"
      heroSubtitle="Automatically extract Aadhaar number, name, DOB, address, and QR code data from Aadhaar cards. Secure, DPDPA compliant, and UIDAI guidelines compatible."
      documentType="Aadhaar Card"
      documentTypeSlug="aadhaar"
      whatIsTitle="What is Aadhaar Extraction?"
      whatIsDescription="Aadhaar cards are India's primary identity document with over 1.3 billion holders. Manual data entry from Aadhaar cards during KYC is slow and prone to errors. ExtractAI extracts all fields including QR code data for instant verification while maintaining DPDPA compliance."
      extractedFields={extractedFields}
      codeSnippet={codeSnippet}
      benefits={benefits}
      ctaText="Start extracting Aadhaar data today"
    />
  );
};

export default AadhaarExtractionPage;
