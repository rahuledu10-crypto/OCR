import SEOLandingTemplate from '../../components/SEOLandingTemplate';
import { Target, Zap, TrendingUp } from 'lucide-react';

const ResumeExtractionPage = () => {
  const extractedFields = [
    { name: "Full Name", description: "Candidate's name" },
    { name: "Email", description: "Contact email address" },
    { name: "Phone", description: "Contact phone number" },
    { name: "Skills", description: "Technical and soft skills list" },
    { name: "Experience", description: "Work history with dates and roles" },
    { name: "Education", description: "Degrees, institutions, graduation years" },
    { name: "Certifications", description: "Professional certifications" },
    { name: "Summary", description: "Professional summary or objective" }
  ];

  const benefits = [
    { icon: Target, title: "99%+ Accuracy", description: "Accurately parse resumes in any format - PDF, Word, images" },
    { icon: Zap, title: "Under 3 Seconds", description: "Parse complete resumes instantly for real-time screening" },
    { icon: TrendingUp, title: "Bulk Processing", description: "Process thousands of resumes for high-volume recruitment" }
  ];

  const codeSnippet = `import requests

response = requests.post(
    "https://api.extractai.io/api/v1/extract",
    headers={"X-API-Key": "your_api_key"},
    files={"file": open("resume.pdf", "rb")},
    data={"document_type": "resume"}
)
print(response.json())`;

  return (
    <SEOLandingTemplate
      title="Resume & CV Data Extraction API — ExtractAI"
      description="Automatically parse resumes and CVs. Extract name, skills, experience, education in seconds. Perfect for HR teams and ATS systems."
      url="https://www.extractai.io/resume-extraction"
      heroTitle="Resume & CV Data Extraction"
      heroSubtitle="Automatically parse resumes and extract structured candidate data. Perfect for HR teams, recruitment agencies, and ATS integrations."
      documentType="Resume"
      documentTypeSlug="resume"
      whatIsTitle="What is Resume Extraction?"
      whatIsDescription="Resumes contain candidate information scattered across different formats and layouts. Manually entering this data into ATS systems is time-consuming. ExtractAI uses AI to parse any resume format and extract structured data for seamless ATS integration."
      extractedFields={extractedFields}
      codeSnippet={codeSnippet}
      benefits={benefits}
      ctaText="Start parsing resumes automatically today"
    />
  );
};

export default ResumeExtractionPage;
