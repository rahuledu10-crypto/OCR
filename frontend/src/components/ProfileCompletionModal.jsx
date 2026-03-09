import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Loader2, Building2, Sparkles } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

const ProfileCompletionModal = ({ isOpen, onComplete }) => {
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const { token, loginWithToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!companyName.trim()) {
      toast.error('Please enter your company name');
      return;
    }

    setLoading(true);
    
    try {
      await axios.patch(
        `${API}/api/users/me/complete-profile`,
        { company_name: companyName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh user data in context
      await loginWithToken(token);
      
      toast.success('Profile completed!', {
        description: 'Your account is now ready to use.'
      });
      
      onComplete();
    } catch (error) {
      console.error('Profile completion error:', error);
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">Welcome to ExtractAI!</DialogTitle>
          <DialogDescription className="text-center">
            One quick step to complete your account setup
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="company-name" className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Company Name
            </Label>
            <Input
              id="company-name"
              type="text"
              placeholder="e.g., Acme Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              autoFocus
              data-testid="profile-company-input"
              className="bg-background"
            />
            <p className="text-xs text-muted-foreground">
              This helps us personalize your experience and invoices
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading}
            data-testid="profile-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Complete Setup'
            )}
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            You have <span className="text-primary font-medium">100 free extractions</span> ready to use!
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionModal;
