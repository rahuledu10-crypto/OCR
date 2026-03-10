import { useEffect } from 'react';

const DEFAULT_OG_IMAGE = 'https://extractai.io/og-image.png';
const SITE_NAME = 'ExtractAI';
const DEFAULT_TITLE = 'ExtractAI — AI-Powered Document Data Extraction';
const DEFAULT_DESCRIPTION = 'Extract structured data from documents with AI-powered OCR.';

/**
 * SEO Component for managing page meta tags
 * Uses direct DOM manipulation for maximum compatibility
 */
const SEO = ({ 
  title = DEFAULT_TITLE, 
  description = DEFAULT_DESCRIPTION, 
  url, 
  ogImage = DEFAULT_OG_IMAGE,
  noIndex = false 
}) => {
  const safeTitle = title ? String(title) : DEFAULT_TITLE;
  const safeDescription = description ? String(description) : DEFAULT_DESCRIPTION;
  const fullTitle = safeTitle.includes('ExtractAI') ? safeTitle : `${safeTitle} — ${SITE_NAME}`;
  
  useEffect(() => {
    // Update document title
    document.title = fullTitle;
    
    // Helper function to update or create meta tag
    const updateMeta = (selector, content, attr = 'content') => {
      let meta = document.querySelector(selector);
      if (!meta) {
        meta = document.createElement('meta');
        if (selector.includes('property=')) {
          meta.setAttribute('property', selector.match(/property="([^"]+)"/)[1]);
        } else if (selector.includes('name=')) {
          meta.setAttribute('name', selector.match(/name="([^"]+)"/)[1]);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute(attr, content);
    };
    
    // Helper function to update or create link tag
    const updateLink = (rel, href) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };
    
    // Update meta tags
    updateMeta('meta[name="description"]', safeDescription);
    updateMeta('meta[name="robots"]', noIndex ? 'noindex, nofollow' : 'index, follow');
    
    // Open Graph tags
    updateMeta('meta[property="og:type"]', 'website');
    updateMeta('meta[property="og:site_name"]', SITE_NAME);
    updateMeta('meta[property="og:title"]', fullTitle);
    updateMeta('meta[property="og:description"]', safeDescription);
    if (url) updateMeta('meta[property="og:url"]', url);
    updateMeta('meta[property="og:image"]', ogImage || DEFAULT_OG_IMAGE);
    updateMeta('meta[property="og:image:width"]', '1200');
    updateMeta('meta[property="og:image:height"]', '630');
    
    // Twitter Card tags
    updateMeta('meta[name="twitter:card"]', 'summary_large_image');
    updateMeta('meta[name="twitter:title"]', fullTitle);
    updateMeta('meta[name="twitter:description"]', safeDescription);
    updateMeta('meta[name="twitter:image"]', ogImage || DEFAULT_OG_IMAGE);
    
    // Canonical URL
    if (url) updateLink('canonical', url);
    
    // Set html lang
    document.documentElement.setAttribute('lang', 'en');
    
  }, [fullTitle, safeDescription, url, ogImage, noIndex]);
  
  return null; // This component doesn't render anything
};

export default SEO;
