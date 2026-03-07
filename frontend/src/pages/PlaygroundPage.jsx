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
  Loader2, 
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Sparkles
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PlaygroundPage = () => {
  const { getAuthHeaders } = useAuth();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [documentType, setDocumentType] = useState('auto');
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const extractDocument = async () => {
    if (!selectedFile) {
      toast.error('Please select an image first');
      return;
    }

    setExtracting(true);
    setResult(null);

    try {
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
    } catch (error) {
      toast.error('Failed to read file');
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
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
                ${previewUrl ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'}`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              data-testid="upload-area"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="file-input"
              />
              
              {previewUrl ? (
                <div className="space-y-4">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="max-h-48 mx-auto rounded-lg object-contain"
                  />
                  <p className="text-sm text-muted-foreground">{selectedFile?.name}</p>
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
                    Supports: JPG, PNG, WEBP (max 10MB)
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
                  Extracting...
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
                <p className="text-muted-foreground mt-4">Processing document...</p>
              </div>
            ) : result ? (
              result.error ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <XCircle className="w-12 h-12 text-destructive mb-4" />
                  <p className="text-destructive font-medium">Extraction Failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{result.error}</p>
                </div>
              ) : (
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
              )
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
