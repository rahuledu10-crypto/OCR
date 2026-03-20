import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { 
  Upload, 
  FileImage, 
  FileText,
  Loader2, 
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PlaygroundPage = () => {
  const { getAuthHeaders } = useAuth();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [documentType, setDocumentType] = useState('auto');
  const [mergePdfResults, setMergePdfResults] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [expandedPages, setExpandedPages] = useState({});

  const isValidFileType = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    return validTypes.includes(file.type);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isValidFileType(file)) {
        toast.error('Supported formats: JPG, PNG, PDF');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      
      const isPdfFile = file.type === 'application/pdf';
      setSelectedFile(file);
      setIsPdf(isPdfFile);
      setPreviewUrl(isPdfFile ? null : URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!isValidFileType(file)) {
        toast.error('Supported formats: JPG, PNG, PDF');
        return;
      }
      
      const isPdfFile = file.type === 'application/pdf';
      setSelectedFile(file);
      setIsPdf(isPdfFile);
      setPreviewUrl(isPdfFile ? null : URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const extractDocument = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setExtracting(true);
    setResult(null);

    try {
      if (isPdf) {
        // PDF extraction - use FormData with query params for merge
        const formData = new FormData();
        formData.append('file', selectedFile);
        if (documentType !== 'auto') {
          formData.append('document_type', documentType);
        }

        // Build URL with query params
        const params = new URLSearchParams();
        if (mergePdfResults) {
          params.append('merge', 'true');
        }
        const url = `${API}/playground/extract/pdf${params.toString() ? '?' + params.toString() : ''}`;

        const response = await axios.post(url, formData, {
          headers: {
            ...getAuthHeaders(),
            'Content-Type': 'multipart/form-data'
          }
        });
        
        setResult({ ...response.data, isPdfResult: true });
        toast.success(`PDF extracted successfully! ${response.data.pages_successful}/${response.data.total_pages} pages processed.`);
      } else {
        // Image extraction - use base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result.split(',')[1];
          
          try {
            const response = await axios.post(`${API}/playground/extract`, {
              image_base64: base64,
              document_type: documentType === 'auto' ? null : documentType
            }, { headers: getAuthHeaders() });
            
            setResult(response.data);
            toast.success('Document extracted successfully!');
          } catch (error) {
            const errorMessage = error.response?.data?.detail || 'Extraction failed';
            toast.error(errorMessage);
            setResult({ error: errorMessage });
          } finally {
            setExtracting(false);
          }
        };
        reader.readAsDataURL(selectedFile);
        return; // Early return - setExtracting handled in reader.onload
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Extraction failed';
      toast.error(errorMessage);
      setResult({ error: errorMessage });
    } finally {
      setExtracting(false);
    }
  };

  const copyResult = () => {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  const resetPlayground = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsPdf(false);
    setResult(null);
    setExpandedPages({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const togglePageExpand = (pageNum) => {
    setExpandedPages(prev => ({
      ...prev,
      [pageNum]: !prev[pageNum]
    }));
  };

  // Known document types - these get green tags, unknown gets orange
  const knownDocumentTypes = [
    'aadhaar', 'pan', 'dl', 'driving_license', 'passport', 'voter_id',
    'invoice', 'purchase_order', 'delivery_challan', 'eway_bill',
    'cheque', 'bank_statement', 'salary_slip',
    'rent_agreement', 'property_doc',
    'prescription', 'lab_report',
    'gst_registration', 'gst_registration_annexure_b', 'gst_certificate',
    'itr', 'form_16', 'balance_sheet', 'profit_loss'
  ];

  const isKnownDocType = (docType) => {
    if (!docType) return false;
    return knownDocumentTypes.includes(docType.toLowerCase()) || docType.toLowerCase() !== 'unknown';
  };

  const formatDocType = (docType) => {
    if (!docType) return 'UNKNOWN';
    return docType.toUpperCase().replace(/_/g, ' ');
  };

  const renderPdfResult = () => {
    if (!result || !result.isPdfResult) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* PDF Status */}
        <div className="flex items-center gap-4 p-3 bg-accent/10 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-accent" />
          <div className="flex-1">
            <p className="font-medium text-sm">PDF Processed Successfully</p>
            <p className="text-xs text-muted-foreground">
              {result.pages_successful}/{result.total_pages} pages • {result.credits_consumed} credits used
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {result.processing_time_ms}ms
          </div>
        </div>

        {/* Merged Data (if available) */}
        {result.merged_data && Object.keys(result.merged_data).length > 0 && (
          <div className="space-y-3">
            <Label className="text-muted-foreground">Merged Data (All Pages)</Label>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  isKnownDocType(result.merged_data.document_type)
                    ? 'text-primary bg-primary/10'
                    : 'text-orange-600 bg-orange-500/10'
                }`}>
                  {formatDocType(result.merged_data.document_type) || 'DOCUMENT'}
                </span>
                <span className="text-xs text-muted-foreground">
                  from {result.merged_data.source_pages} pages
                </span>
              </div>
              {result.merged_data.data && Object.entries(result.merged_data.data).map(([key, value]) => (
                <div 
                  key={key}
                  className="flex items-start justify-between p-2 bg-background/50 rounded"
                >
                  <span className="text-sm text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-mono text-right max-w-[60%] break-all">
                    {typeof value === 'object' ? JSON.stringify(value, null, 1) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Page-by-Page Results */}
        <div className="space-y-3">
          <Label className="text-muted-foreground">Page-by-Page Results</Label>
          <div className="space-y-2">
            {result.pages?.map((page) => (
              <div 
                key={page.page_number}
                className={`border rounded-lg overflow-hidden ${
                  page.success ? 'border-border' : 'border-destructive/50'
                }`}
              >
                <div 
                  className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
                  onClick={() => togglePageExpand(page.page_number)}
                >
                  <div className="flex items-center gap-3">
                    {expandedPages[page.page_number] ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-sm">Page {page.page_number}</span>
                    {page.success ? (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isKnownDocType(page.document_type) 
                          ? 'bg-accent/20 text-accent' 
                          : 'bg-orange-500/20 text-orange-600'
                      }`}>
                        {formatDocType(page.document_type)}
                      </span>
                    ) : (
                      <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                        FAILED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {page.confidence && (
                      <span>{(page.confidence * 100).toFixed(0)}%</span>
                    )}
                    <span>{page.processing_time_ms}ms</span>
                  </div>
                </div>
                
                {expandedPages[page.page_number] && (
                  <div className="p-3 border-t border-border/50">
                    {page.success ? (
                      <div className="space-y-2">
                        {page.extracted_data && Object.entries(page.extracted_data).map(([key, value]) => (
                          <div 
                            key={key}
                            className="flex items-start justify-between p-2 bg-muted/20 rounded text-sm"
                          >
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="font-mono text-right max-w-[60%] break-all">
                              {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-destructive">{page.error}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Raw JSON */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Raw Response</Label>
          <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-xs font-mono max-h-48">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </motion.div>
    );
  };

  const renderImageResult = () => {
    if (!result || result.isPdfResult) return null;

    if (result.error) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <XCircle className="w-12 h-12 text-destructive mb-4" />
          <p className="text-destructive font-medium">Extraction Failed</p>
          <p className="text-sm text-muted-foreground mt-1">{result.error}</p>
        </div>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        {/* Status */}
        <div className="flex items-center gap-4 p-3 bg-accent/10 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-accent" />
          <div className="flex-1">
            <p className="font-medium text-sm">Successfully extracted</p>
            <p className="text-xs text-muted-foreground">
              {result.document_type?.toUpperCase()} • {result.confidence ? `${(result.confidence * 100).toFixed(0)}% confidence` : 'Unknown confidence'}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {result.processing_time_ms}ms
          </div>
        </div>

        {/* Extracted Data */}
        <div className="space-y-3">
          <Label className="text-muted-foreground">Extracted Fields</Label>
          {result.extracted_data && Object.keys(result.extracted_data).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(result.extracted_data).map(([key, value]) => (
                <div 
                  key={key}
                  className="flex items-start justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <span className="text-sm text-muted-foreground capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-mono text-right max-w-[60%] break-all">
                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No data extracted</p>
          )}
        </div>

        {/* Raw JSON */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Raw Response</Label>
          <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-xs font-mono max-h-48">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </motion.div>
    );
  };

  return (
    <div data-testid="playground-page" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold">API Playground</h1>
        <p className="text-muted-foreground">Test the OCR extraction API with your documents</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Upload Document</CardTitle>
            <CardDescription>Upload any document - ID cards, invoices, cheques, prescriptions & more</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${selectedFile ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              data-testid="upload-area"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="file-input"
              />
              
              {selectedFile ? (
                <div className="space-y-4">
                  {isPdf ? (
                    <div className="w-20 h-20 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-10 h-10 text-primary" />
                    </div>
                  ) : (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-48 mx-auto rounded-lg object-contain"
                    />
                  )}
                  <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
                  {isPdf && (
                    <p className="text-xs text-primary">PDF file selected</p>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetPlayground();
                    }}
                    data-testid="change-file-btn"
                  >
                    Change file
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Drop your document here</p>
                    <p className="text-sm text-muted-foreground">or click to browse</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Supported formats: JPG, PNG, PDF (max 50MB)
                  </p>
                </div>
              )}
            </div>

            {/* Document Type Selection */}
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger data-testid="document-type-select">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  <SelectItem disabled className="font-semibold text-muted-foreground">— ID Documents —</SelectItem>
                  <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                  <SelectItem value="pan">PAN Card</SelectItem>
                  <SelectItem value="dl">Driving License</SelectItem>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="voter_id">Voter ID</SelectItem>
                  <SelectItem disabled className="font-semibold text-muted-foreground">— Business Documents —</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="purchase_order">Purchase Order</SelectItem>
                  <SelectItem value="delivery_challan">Delivery Challan</SelectItem>
                  <SelectItem value="eway_bill">E-way Bill</SelectItem>
                  <SelectItem disabled className="font-semibold text-muted-foreground">— Financial Documents —</SelectItem>
                  <SelectItem value="cheque">Bank Cheque</SelectItem>
                  <SelectItem value="bank_statement">Bank Statement</SelectItem>
                  <SelectItem value="salary_slip">Salary Slip</SelectItem>
                  <SelectItem disabled className="font-semibold text-muted-foreground">— Property & Legal —</SelectItem>
                  <SelectItem value="rent_agreement">Rent Agreement</SelectItem>
                  <SelectItem value="property_doc">Property Document</SelectItem>
                  <SelectItem disabled className="font-semibold text-muted-foreground">— Medical Documents —</SelectItem>
                  <SelectItem value="prescription">Prescription</SelectItem>
                  <SelectItem value="lab_report">Lab Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* PDF Options */}
            {isPdf && (
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <input
                  type="checkbox"
                  id="merge-results"
                  checked={mergePdfResults}
                  onChange={(e) => setMergePdfResults(e.target.checked)}
                  className="rounded border-border"
                />
                <Label htmlFor="merge-results" className="text-sm cursor-pointer">
                  Merge results from all pages
                </Label>
              </div>
            )}

            {/* Extract Button */}
            <Button
              className="w-full bg-primary hover:bg-primary/90"
              disabled={!selectedFile || extracting}
              onClick={extractDocument}
              data-testid="extract-btn"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isPdf ? 'Processing PDF...' : 'Extracting...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Extract Data
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading text-lg">Extraction Result</CardTitle>
              <CardDescription>Structured data extracted from your document</CardDescription>
            </div>
            {result && !result.error && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={copyResult}
                data-testid="copy-result-btn"
              >
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                Copy
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {extracting ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-muted" />
                  <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-t-primary animate-spin" />
                </div>
                <p className="text-muted-foreground mt-4">
                  {isPdf ? 'Processing PDF pages...' : 'Processing document...'}
                </p>
              </div>
            ) : result ? (
              result.isPdfResult ? renderPdfResult() : renderImageResult()
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <FileImage className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Upload a document to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlaygroundPage;
