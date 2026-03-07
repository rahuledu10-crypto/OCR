/**
 * ExtractAI Node.js SDK
 * Simple, powerful OCR for Indian documents
 * 
 * Installation:
 *   npm install extractai
 * 
 * Usage:
 *   const ExtractAI = require('extractai');
 *   const client = new ExtractAI('your_api_key');
 *   const result = await client.extract('document.jpg');
 *   console.log(result.aadhaarNumber);
 */

const fs = require('fs');
const path = require('path');

class ExtractAIError extends Error {
  constructor(message, statusCode = null) {
    super(message);
    this.name = 'ExtractAIError';
    this.statusCode = statusCode;
  }
}

class AuthenticationError extends ExtractAIError {
  constructor(message = 'Invalid API key') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class RateLimitError extends ExtractAIError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

class UsageLimitError extends ExtractAIError {
  constructor(message = 'Usage limit exceeded') {
    super(message, 402);
    this.name = 'UsageLimitError';
  }
}

class ExtractionResult {
  constructor(data) {
    this.id = data.id;
    this.documentType = data.document_type;
    this.extractedData = data.extracted_data;
    this.confidence = data.confidence;
    this.processingTimeMs = data.processing_time_ms;
    
    // Map extracted data to camelCase properties
    for (const [key, value] of Object.entries(data.extracted_data || {})) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      this[camelKey] = value;
    }
  }
}

class BatchResult {
  constructor(data) {
    this.batchId = data.batch_id;
    this.total = data.total;
    this.successful = data.successful;
    this.failed = data.failed;
    this.results = data.results;
    this.processingTimeMs = data.processing_time_ms;
  }
}

class ExtractAI {
  /**
   * Create ExtractAI client
   * @param {string} apiKey - Your ExtractAI API key
   * @param {Object} options - Configuration options
   * @param {string} options.baseUrl - API base URL (default: https://api.extractai.in)
   * @param {number} options.timeout - Request timeout in ms (default: 60000)
   */
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl || 'https://api.extractai.in').replace(/\/$/, '');
    this.timeout = options.timeout || 60000;
  }

  async _makeRequest(method, endpoint, data = null) {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          'User-Agent': 'ExtractAI-NodeJS/1.0'
        },
        body: data ? JSON.stringify(data) : null,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const responseData = await response.json();
      
      if (response.status === 401) {
        throw new AuthenticationError();
      } else if (response.status === 402) {
        throw new UsageLimitError(responseData.detail || 'Usage limit exceeded');
      } else if (response.status === 429) {
        throw new RateLimitError();
      } else if (!response.ok) {
        throw new ExtractAIError(responseData.detail || 'API error', response.status);
      }
      
      return responseData;
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new ExtractAIError('Request timed out');
      }
      if (error instanceof ExtractAIError) {
        throw error;
      }
      throw new ExtractAIError(`Request failed: ${error.message}`);
    }
  }

  _fileToBase64(filePath) {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const fileBuffer = fs.readFileSync(absolutePath);
    return fileBuffer.toString('base64');
  }

  /**
   * Extract data from a document image file
   * @param {string} filePath - Path to image file (jpg, png, webp)
   * @param {string} [documentType] - Optional hint (aadhaar, pan, dl, invoice, etc.)
   * @returns {Promise<ExtractionResult>}
   */
  async extract(filePath, documentType = null) {
    const imageBase64 = this._fileToBase64(filePath);
    return this.extractBase64(imageBase64, documentType);
  }

  /**
   * Extract data from base64-encoded image
   * @param {string} imageBase64 - Base64-encoded image string
   * @param {string} [documentType] - Optional hint (aadhaar, pan, dl, invoice, etc.)
   * @returns {Promise<ExtractionResult>}
   */
  async extractBase64(imageBase64, documentType = null) {
    const data = {
      image_base64: imageBase64,
      document_type: documentType
    };
    
    const response = await this._makeRequest('POST', '/v1/extract', data);
    return new ExtractionResult(response);
  }

  /**
   * Extract data from multiple documents in a single request
   * @param {Array<{image_base64: string, document_type?: string}>} images - Array of image data
   * @param {Object} [options] - Webhook options
   * @param {string} [options.webhookUrl] - URL to receive completion webhook
   * @param {string} [options.webhookSecret] - Secret for webhook signature
   * @returns {Promise<BatchResult>}
   */
  async batchExtract(images, options = {}) {
    const data = {
      images,
      webhook_url: options.webhookUrl,
      webhook_secret: options.webhookSecret
    };
    
    const response = await this._makeRequest('POST', '/v1/batch-extract', data);
    return new BatchResult(response);
  }

  /**
   * Extract data from multiple document files
   * @param {Array<string>} filePaths - Array of file paths
   * @param {Array<string>} [documentTypes] - Optional array of document type hints
   * @returns {Promise<BatchResult>}
   */
  async batchExtractFiles(filePaths, documentTypes = []) {
    const images = filePaths.map((filePath, index) => ({
      image_base64: this._fileToBase64(filePath),
      document_type: documentTypes[index] || null
    }));
    
    return this.batchExtract(images);
  }
}

// Named exports
module.exports = ExtractAI;
module.exports.ExtractAI = ExtractAI;
module.exports.ExtractionResult = ExtractionResult;
module.exports.BatchResult = BatchResult;
module.exports.ExtractAIError = ExtractAIError;
module.exports.AuthenticationError = AuthenticationError;
module.exports.RateLimitError = RateLimitError;
module.exports.UsageLimitError = UsageLimitError;

// Quick extraction function
module.exports.extract = async function(apiKey, filePath, documentType = null) {
  const client = new ExtractAI(apiKey);
  return client.extract(filePath, documentType);
};
