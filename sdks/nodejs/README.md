# ExtractAI Node.js SDK

Simple, powerful OCR for Indian documents. Extract data from Aadhaar, PAN, Driving License, Invoices, Cheques, and 15+ document types.

## Installation

```bash
npm install extractai
```

## Quick Start

```javascript
const ExtractAI = require('extractai');

// Initialize client
const client = new ExtractAI('ocr_your_api_key');

// Extract from file
const result = await client.extract('aadhaar.jpg');
console.log(result.aadhaarNumber);  // "1234 5678 9012"
console.log(result.name);            // "John Doe"
console.log(result.confidence);      // 0.95

// Extract with document type hint (faster)
const panResult = await client.extract('pan.jpg', 'pan');
console.log(panResult.panNumber);    // "ABCDE1234F"
```

## ES Modules

```javascript
import ExtractAI from 'extractai';

const client = new ExtractAI('ocr_your_api_key');
const result = await client.extract('document.jpg');
```

## Supported Document Types

### ID Documents
- `aadhaar` - Aadhaar Card
- `pan` - PAN Card  
- `dl` - Driving License
- `passport` - Passport
- `voter_id` - Voter ID

### Business Documents
- `invoice` - GST Invoice
- `purchase_order` - Purchase Order
- `delivery_challan` - Delivery Challan
- `eway_bill` - E-way Bill

### Financial Documents
- `cheque` - Bank Cheque
- `bank_statement` - Bank Statement
- `salary_slip` - Salary Slip

### Medical Documents
- `prescription` - Medical Prescription
- `lab_report` - Lab Report

### Property Documents
- `rent_agreement` - Rent Agreement
- `property_doc` - Property Documents

## Batch Extraction

Process multiple documents in a single request:

```javascript
const ExtractAI = require('extractai');

const client = new ExtractAI('ocr_your_api_key');

// Batch extract from files
const result = await client.batchExtractFiles([
  'aadhaar.jpg',
  'pan.jpg',
  'invoice.pdf'
]);

console.log(`Processed: ${result.successful}/${result.total}`);

for (const item of result.results) {
  if (item.success) {
    console.log(`${item.document_type}:`, item.extracted_data);
  }
}
```

## Error Handling

```javascript
const { ExtractAI, AuthenticationError, RateLimitError, UsageLimitError } = require('extractai');

const client = new ExtractAI('ocr_your_api_key');

try {
  const result = await client.extract('document.jpg');
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else if (error instanceof RateLimitError) {
    console.log('Too many requests, slow down');
  } else if (error instanceof UsageLimitError) {
    console.log('Monthly limit reached, upgrade plan');
  }
}
```

## Pricing

- **Free**: 100 extractions (one-time)
- **Starter**: ₹499/month - 1,000 extractions
- **Growth**: ₹1,999/month - 5,000 extractions  
- **Enterprise**: Custom pricing

Get your API key at [extractai.in](https://extractai.in)

## Support

- Documentation: [docs.extractai.in](https://docs.extractai.in)
- Email: support@extractai.in
