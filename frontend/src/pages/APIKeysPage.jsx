import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '../components/ui/dialog';
import { toast } from 'sonner';
import { 
  Key, 
  Plus, 
  Copy, 
  Trash2, 
  Check,
  AlertTriangle,
  Eye,
  EyeOff,
  Clock,
  Gauge
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const APIKeysPage = () => {
  const { getAuthHeaders } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(100);
  const [creating, setCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedKeyId, setCopiedKeyId] = useState(null);
  const [deleteKeyId, setDeleteKeyId] = useState(null);
  const [showFullKey, setShowFullKey] = useState({});

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await axios.get(`${API}/keys`, { headers: getAuthHeaders() });
      setApiKeys(response.data);
    } catch (error) {
      toast.error('Failed to fetch API keys');
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for your API key');
      return;
    }
    
    setCreating(true);
    try {
      const response = await axios.post(`${API}/keys`, {
        name: newKeyName,
        rate_limit: newKeyRateLimit
      }, { headers: getAuthHeaders() });
      
      setNewlyCreatedKey(response.data);
      setNewKeyName('');
      setNewKeyRateLimit(100);
      fetchApiKeys();
      toast.success('API key created successfully');
    } catch (error) {
      toast.error('Failed to create API key');
    } finally {
      setCreating(false);
    }
  };

  const revokeApiKey = async (keyId) => {
    try {
      await axios.delete(`${API}/keys/${keyId}`, { headers: getAuthHeaders() });
      fetchApiKeys();
      setDeleteKeyId(null);
      toast.success('API key revoked');
    } catch (error) {
      toast.error('Failed to revoke API key');
    }
  };

  const copyToClipboard = (text, keyId) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(keyId);
    setTimeout(() => setCopiedKeyId(null), 2000);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div data-testid="api-keys-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">Manage your API keys for accessing the OCR API</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="create-key-btn" className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create new API key</DialogTitle>
              <DialogDescription>
                Create a new API key for your application
              </DialogDescription>
            </DialogHeader>
            
            {newlyCreatedKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-accent/10 border border-accent/20 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">API key created!</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Copy your key now. You won't be able to see it again.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Your API Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={newlyCreatedKey.key} 
                      readOnly 
                      className="font-mono text-sm bg-muted"
                      data-testid="new-api-key-value"
                    />
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => copyToClipboard(newlyCreatedKey.key, 'new')}
                      data-testid="copy-new-key-btn"
                    >
                      {copiedKeyId === 'new' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    onClick={() => {
                      setNewlyCreatedKey(null);
                      setCreateDialogOpen(false);
                    }}
                    data-testid="done-btn"
                  >
                    Done
                  </Button>
                </DialogFooter>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Key Name</Label>
                  <Input
                    id="keyName"
                    placeholder="e.g., Production, Development"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    data-testid="key-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rateLimit">Rate Limit (requests/min)</Label>
                  <Input
                    id="rateLimit"
                    type="number"
                    min={1}
                    max={1000}
                    value={newKeyRateLimit}
                    onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value) || 100)}
                    data-testid="rate-limit-input"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={createApiKey} 
                    disabled={creating}
                    data-testid="confirm-create-key-btn"
                    className="bg-primary hover:bg-primary/90"
                  >
                    {creating ? 'Creating...' : 'Create Key'}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* API Keys List */}
      {apiKeys.length > 0 ? (
        <div className="space-y-4">
          {apiKeys.map((key, index) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={`bg-card/50 backdrop-blur border-border/50 ${!key.is_active ? 'opacity-60' : ''}`}>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${key.is_active ? 'bg-primary/10' : 'bg-muted'}`}>
                        <Key className={`w-5 h-5 ${key.is_active ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{key.name}</h3>
                          {!key.is_active && (
                            <span className="px-2 py-0.5 text-xs bg-destructive/10 text-destructive rounded">
                              Revoked
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="font-mono">{key.key_prefix}</span>
                          <span className="flex items-center gap-1">
                            <Gauge className="w-3 h-3" />
                            {key.rate_limit}/min
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(key.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {key.total_requests} requests
                      </span>
                      {key.is_active && (
                        <Dialog open={deleteKeyId === key.id} onOpenChange={(open) => setDeleteKeyId(open ? key.id : null)}>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive hover:text-destructive"
                              data-testid={`revoke-key-${key.id}-btn`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                Revoke API Key
                              </DialogTitle>
                              <DialogDescription>
                                Are you sure you want to revoke "{key.name}"? This action cannot be undone 
                                and any applications using this key will stop working immediately.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteKeyId(null)}>
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive" 
                                onClick={() => revokeApiKey(key.id)}
                                data-testid="confirm-revoke-btn"
                              >
                                Revoke Key
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardContent className="py-12 text-center">
            <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-heading font-semibold text-lg mb-2">No API keys yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first API key to start using the OCR API
            </p>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              data-testid="create-first-key-btn"
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create API Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Usage Instructions */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Using your API Key</CardTitle>
          <CardDescription>Include your API key in the X-API-Key header</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="p-4 bg-muted rounded-lg overflow-x-auto text-sm font-mono">
            <code>
              {`curl -X POST "${process.env.REACT_APP_BACKEND_URL}/api/v1/extract" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"image_base64": "...", "document_type": "auto"}'`}
            </code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );
};

export default APIKeysPage;
