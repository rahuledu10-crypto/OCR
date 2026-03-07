declare module 'extractai' {
  export interface ExtractionResultData {
    id: string;
    documentType: string;
    extractedData: Record<string, any>;
    confidence: number;
    processingTimeMs: number;
    [key: string]: any;
  }

  export interface BatchResultData {
    batchId: string;
    total: number;
    successful: number;
    failed: number;
    results: Array<{
      index: number;
      success: boolean;
      document_type?: string;
      extracted_data?: Record<string, any>;
      confidence?: number;
      error?: string;
    }>;
    processingTimeMs: number;
  }

  export class ExtractionResult implements ExtractionResultData {
    id: string;
    documentType: string;
    extractedData: Record<string, any>;
    confidence: number;
    processingTimeMs: number;
    [key: string]: any;
    
    constructor(data: any);
  }

  export class BatchResult implements BatchResultData {
    batchId: string;
    total: number;
    successful: number;
    failed: number;
    results: Array<{
      index: number;
      success: boolean;
      document_type?: string;
      extracted_data?: Record<string, any>;
      confidence?: number;
      error?: string;
    }>;
    processingTimeMs: number;
    
    constructor(data: any);
  }

  export class ExtractAIError extends Error {
    statusCode: number | null;
    constructor(message: string, statusCode?: number);
  }

  export class AuthenticationError extends ExtractAIError {
    constructor(message?: string);
  }

  export class RateLimitError extends ExtractAIError {
    constructor(message?: string);
  }

  export class UsageLimitError extends ExtractAIError {
    constructor(message?: string);
  }

  export interface ExtractAIOptions {
    baseUrl?: string;
    timeout?: number;
  }

  export interface BatchExtractOptions {
    webhookUrl?: string;
    webhookSecret?: string;
  }

  export type DocumentType = 
    | 'aadhaar' 
    | 'pan' 
    | 'dl' 
    | 'passport' 
    | 'voter_id'
    | 'invoice'
    | 'purchase_order'
    | 'delivery_challan'
    | 'eway_bill'
    | 'cheque'
    | 'bank_statement'
    | 'salary_slip'
    | 'rent_agreement'
    | 'property_doc'
    | 'prescription'
    | 'lab_report'
    | 'auto';

  export default class ExtractAI {
    constructor(apiKey: string, options?: ExtractAIOptions);
    
    extract(filePath: string, documentType?: DocumentType | null): Promise<ExtractionResult>;
    extractBase64(imageBase64: string, documentType?: DocumentType | null): Promise<ExtractionResult>;
    batchExtract(
      images: Array<{ image_base64: string; document_type?: string }>,
      options?: BatchExtractOptions
    ): Promise<BatchResult>;
    batchExtractFiles(
      filePaths: string[],
      documentTypes?: string[]
    ): Promise<BatchResult>;
  }

  export function extract(
    apiKey: string,
    filePath: string,
    documentType?: DocumentType | null
  ): Promise<ExtractionResult>;
}
