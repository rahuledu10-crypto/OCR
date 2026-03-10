import SEOLandingTemplate from '../../components/SEOLandingTemplate';
import { Target, Zap, TrendingUp } from 'lucide-react';

const BankStatementExtractionPage = () => {
  const extractedFields = [
    { name: "Account Number", description: "Bank account number" },
    { name: "Bank Name", description: "Name of the banking institution" },
    { name: "Account Holder", description: "Name on the account" },
    { name: "Statement Period", description: "Start and end dates" },
    { name: "Opening Balance", description: "Balance at period start" },
    { name: "Closing Balance", description: "Balance at period end" },
    { name: "Transactions", description: "Date, description, debit, credit" },
    { name: "Total Credits/Debits", description: "Sum of all transactions" }
  ];

  const benefits = [
    { icon: Target, title: "99%+ Accuracy", description: "Accurate extraction from all major Indian bank statement formats" },
    { icon: Zap, title: "Under 3 Seconds", description: "Extract complete transaction history in seconds" },
    { icon: TrendingUp, title: "Bulk Processing", description: "Process months of statements for loan underwriting and analysis" }
  ];

  const codeSnippet = `import requests

response = requests.post(
    "https://api.extractai.io/api/v1/extract",
    headers={"X-API-Key": "your_api_key"},
    files={"file": open("bank_statement.pdf", "rb")},
    data={"document_type": "bank_statement"}
)
print(response.json())`;

  return (
    <SEOLandingTemplate
      title="Bank Statement Data Extraction API — ExtractAI"
      description="Extract transactions, balances and account details from bank statements automatically. Supports all Indian bank formats."
      url="https://www.extractai.io/bank-statement-extraction"
      heroTitle="Bank Statement Data Extraction"
      heroSubtitle="Automatically extract transactions, balances, and account details from bank statements. Supports all major Indian banks including SBI, HDFC, ICICI, Axis, and more."
      documentType="Bank Statement"
      documentTypeSlug="bank-statement"
      whatIsTitle="What is Bank Statement Extraction?"
      whatIsDescription="Bank statements contain transaction history, balances, and account information critical for loan underwriting, financial analysis, and accounting. Manually extracting this data is tedious and error-prone. ExtractAI processes statements from all Indian banks automatically."
      extractedFields={extractedFields}
      codeSnippet={codeSnippet}
      benefits={benefits}
      ctaText="Start extracting bank statement data today"
    />
  );
};

export default BankStatementExtractionPage;
