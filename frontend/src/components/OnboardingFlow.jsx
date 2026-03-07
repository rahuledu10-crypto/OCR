import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { 
  Upload, 
  FileText, 
  Key, 
  Check, 
  ArrowRight, 
  Copy,
  Loader2,
  X
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const OnboardingFlow = ({ onComplete, onSkip }) => {
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [extractionResult, setExtractionResult] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [copied, setCopied] = useState(false);

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const keysRes = await axios.get(`${API}/keys`, { headers: getAuthHeaders() });
        if (keysRes.data && keysRes.data.length > 0) {
          // User already has API keys, skip to step 3 or complete
          setApiKey(keysRes.data[0].key);
          setStep(3);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    checkOnboarding();
  }, [getAuthHeaders]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    
    try {
      // Convert to base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.readAsDataURL(file);
      });

      // Call extraction API
      const response = await axios.post(
        `${API}/playground/extract`,
        { image_base64: base64, document_type: 'auto' },
        { headers: getAuthHeaders() }
      );

      setExtractionResult(response.data);
      setStep(2);
      toast.success('Document extracted successfully!');
    } catch (error) {
      toast.error('Failed to extract document. Try another image.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${API}/keys`,
        { name: 'My First API Key' },
        { headers: getAuthHeaders() }
      );
      
      setApiKey(response.data.key);
      setStep(3);
      toast.success('API key created!');
    } catch (error) {
      toast.error('Failed to create API key');
    } finally {
      setLoading(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success('API key copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    if (onComplete) onComplete();
    navigate('/dashboard');
  };

  const steps = [
    { number: 1, title: 'Upload a document', icon: Upload },
    { number: 2, title: 'See extraction result', icon: FileText },
    { number: 3, title: 'Get your API key', icon: Key }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <Card className="p-8 bg-card border-border/50 relative">
          {/* Skip button */}
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {steps.map((s, index) => (
              <div key={s.number} className="flex items-center">
                <div className={`flex items-center gap-2 ${step >= s.number ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step > s.number 
                      ? 'bg-primary text-white' 
                      : step === s.number 
                        ? 'bg-primary/20 text-primary border-2 border-primary' 
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-16 h-0.5 mx-2 ${step > s.number ? 'bg-primary' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Upload Document */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <h2 className="text-2xl font-bold mb-2">Upload your first document</h2>
                <p className="text-muted-foreground mb-6">
                  Try it out! Upload an Aadhaar, PAN, invoice, or any document.
                </p>
                
                <label className="block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={loading}
                  />
                  <div className={`border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all ${
                    loading ? 'border-primary bg-primary/5' : 'border-border hover:border-primary hover:bg-muted/50'
                  }`}>
                    {loading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-12 h-12 text-primary animate-spin" />
                        <p className="text-muted-foreground">Extracting data...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <Upload className="w-12 h-12 text-muted-foreground" />
                        <p className="font-medium">Click to upload or drag & drop</p>
                        <p className="text-sm text-muted-foreground">PNG, JPG, WEBP up to 10MB</p>
                      </div>
                    )}
                  </div>
                </label>
              </motion.div>
            )}

            {/* Step 2: See Result */}
            {step === 2 && extractionResult && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-2 text-center">Extraction successful!</h2>
                <p className="text-muted-foreground mb-6 text-center">
                  Here's what we found in your document:
                </p>
                
                <div className="bg-muted/30 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">Document Type</span>
                    <span className="px-3 py-1 bg-primary/20 text-primary text-sm font-medium rounded-full capitalize">
                      {extractionResult.document_type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-muted-foreground">Confidence</span>
                    <span className="text-sm font-mono">{(extractionResult.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Extracted Data</p>
                    <pre className="text-sm bg-background rounded-lg p-4 overflow-x-auto">
                      {JSON.stringify(extractionResult.extracted_data, null, 2)}
                    </pre>
                  </div>
                </div>

                <Button 
                  onClick={handleCreateApiKey} 
                  className="w-full bg-primary hover:bg-primary/90 h-12"
                  disabled={loading}
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating API Key...</>
                  ) : (
                    <>Get Your API Key <ArrowRight className="w-4 h-4 ml-2" /></>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Step 3: Get API Key */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold mb-2">You're all set!</h2>
                <p className="text-muted-foreground mb-6">
                  Copy your API key and start integrating.
                </p>
                
                {apiKey && (
                  <div className="bg-muted/30 rounded-xl p-4 mb-6">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Your API Key</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-background rounded-lg p-3 text-sm font-mono text-left overflow-hidden text-ellipsis">
                        {apiKey}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyApiKey}
                        className="shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                <div className="bg-muted/30 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm font-medium mb-2">Quick start code:</p>
                  <pre className="text-xs bg-background rounded-lg p-3 overflow-x-auto">
{`curl -X POST "https://api.extractai.in/api/v1/extract" \\
  -H "X-API-Key: ${apiKey || 'your_api_key'}" \\
  -H "Content-Type: application/json" \\
  -d '{"image_base64": "...", "document_type": "auto"}'`}
                  </pre>
                </div>

                <Button 
                  onClick={completeOnboarding} 
                  className="w-full bg-primary hover:bg-primary/90 h-12"
                >
                  Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </div>
  );
};

export default OnboardingFlow;
