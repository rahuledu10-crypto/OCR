# ExtractAI Python SDK

Simple, powerful OCR for Indian documents. Extract data from Aadhaar, PAN, Driving License, Invoices, Cheques, and 15+ document types.

## Installation

```bash
pip install extractai
```

## Quick Start

```python
from extractai import ExtractAI

# Initialize client
client = ExtractAI(api_key="ocr_your_api_key")

# Extract from file
result = client.extract("aadhaar.jpg")
print(result.aadhaar_number)  # "1234 5678 9012"
print(result.name)            # "John Doe"
print(result.confidence)      # 0.95

# Extract with document type hint (faster)
result = client.extract("pan.jpg", document_type="pan")
print(result.pan_number)      # "ABCDE1234F"
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

```python
from extractai import ExtractAI
import base64

client = ExtractAI(api_key="ocr_your_api_key")

# Batch extract from files
result = client.batch_extract_files([
    "aadhaar.jpg",
    "pan.jpg", 
    "invoice.pdf"
])

print(f"Processed: {result.successful}/{result.total}")

for item in result.results:
    if item["success"]:
        print(f"{item['document_type']}: {item['extracted_data']}")
```

## Error Handling

```python
from extractai import ExtractAI, AuthenticationError, RateLimitError, UsageLimitError

client = ExtractAI(api_key="ocr_your_api_key")

try:
    result = client.extract("document.jpg")
except AuthenticationError:
    print("Invalid API key")
except RateLimitError:
    print("Too many requests, slow down")
except UsageLimitError:
    print("Monthly limit reached, upgrade plan")
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
