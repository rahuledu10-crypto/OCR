/**
 * JSON-LD Structured Data Component
 * Renders schema.org structured data for SEO rich snippets
 */
const JsonLd = ({ data }) => {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
};

// Organization Schema
export const OrganizationSchema = () => {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ExtractAI",
    "url": "https://extractai.io",
    "logo": "https://extractai.io/og-image.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "support@extractai.io",
      "contactType": "customer support"
    }
  };
  return <JsonLd data={data} />;
};

// SoftwareApplication Schema
export const SoftwareApplicationSchema = () => {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ExtractAI",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "INR"
    },
    "description": "AI-powered document data extraction API. Extract structured data from invoices, contracts, IDs and any document in seconds."
  };
  return <JsonLd data={data} />;
};

// WebSite Schema
export const WebSiteSchema = () => {
  const data = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ExtractAI",
    "url": "https://extractai.io"
  };
  return <JsonLd data={data} />;
};

// FAQPage Schema - accepts array of {question, answer} objects
export const FAQPageSchema = ({ faqs }) => {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
  return <JsonLd data={data} />;
};

// Generic JSON-LD component for custom schemas
export default JsonLd;
