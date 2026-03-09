import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { 
  User, 
  Building2, 
  Code2, 
  Users, 
  FileText,
  Loader2,
  Sparkles
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

const USER_TYPES = [
  {
    id: 'personal',
    label: 'Personal use',
    description: 'Managing my own documents',
    icon: User,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500'
  },
  {
    id: 'business',
    label: 'My business',
    description: 'For company operations',
    icon: Building2,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500'
  },
  {
    id: 'builder',
    label: 'Building a product',
    description: 'Integrating via API',
    icon: Code2,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500'
  },
  {
    id: 'agency',
    label: 'Client work',
    description: 'Agency or freelance',
    icon: Users,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500'
  }
];

const TEAM_SIZES = [
  { value: 'solo', label: 'Just me' },
  { value: '2-10', label: '2-10 people' },
  { value: '11-50', label: '11-50 people' },
  { value: '51-200', label: '51-200 people' },
  { value: '200+', label: '200+ people' }
];

const USE_CASES = [
  { id: 'id_documents', label: 'ID documents (Aadhaar, PAN, DL, Passport)' },
  { id: 'invoices', label: 'Invoices & receipts' },
  { id: 'bank_statements', label: 'Bank statements & cheques' },
  { id: 'contracts', label: 'Contracts & agreements' },
  { id: 'other', label: 'Other documents' }
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { token, user, loginWithToken } = useAuth();
  
  const [userType, setUserType] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [buildingDescription, setBuildingDescription] = useState('');
  const [useCases, setUseCases] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pre-fill company name if already exists
  useEffect(() => {
    if (user?.company_name) {
      setCompanyName(user.company_name);
    }
  }, [user]);

  const handleUseCaseToggle = (caseId) => {
    setUseCases(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const handleSubmit = async () => {
    if (!userType) {
      toast.error('Please select how you\'ll use ExtractAI');
      return;
    }

    setLoading(true);

    try {
      const onboardingData = {
        user_type: userType,
        company_name: (userType === 'business' || userType === 'agency') ? companyName.trim() || null : null,
        team_size: (userType === 'business' || userType === 'agency') ? teamSize || null : null,
        building_description: userType === 'builder' ? buildingDescription.trim() || null : null,
        primary_use_cases: useCases.length > 0 ? useCases : null
      };

      await axios.post(
        `${API}/api/users/me/onboarding`,
        onboardingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh user data
      await loginWithToken(token);

      // Personalized success message
      const messages = {
        personal: 'Great! Your dashboard is ready.',
        business: `Welcome${companyName ? `, ${companyName}` : ''}! Let's get started.`,
        builder: 'Awesome! Your API key is waiting in the dashboard.',
        agency: 'Perfect! Manage all your client extractions from one place.'
      };

      toast.success(messages[userType] || 'Welcome to ExtractAI!');
      navigate('/dashboard', { replace: true });

    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const showCompanyFields = userType === 'business' || userType === 'agency';
  const showBuilderFields = userType === 'builder';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.1)_0%,transparent_50%)]" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl relative"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mb-2">
            One quick question
          </h1>
          <p className="text-muted-foreground">
            Help us personalize your experience
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-card/50 backdrop-blur border border-border/50 rounded-2xl p-6 sm:p-8 space-y-8">
          
          {/* User Type Selection */}
          <div className="space-y-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              I'm using ExtractAI for...
              <span className="text-destructive">*</span>
            </Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {USER_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = userType === type.id;
                
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setUserType(type.id)}
                    data-testid={`user-type-${type.id}`}
                    className={`
                      relative p-4 rounded-xl border-2 text-left transition-all
                      ${isSelected 
                        ? `${type.borderColor} ${type.bgColor}` 
                        : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                        ${isSelected ? type.bgColor : 'bg-muted'}
                      `}>
                        <Icon className={`w-5 h-5 ${isSelected ? type.color : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <div className={`font-medium ${isSelected ? 'text-foreground' : ''}`}>
                          {type.label}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {type.description}
                        </div>
                      </div>
                    </div>
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`absolute top-3 right-3 w-5 h-5 rounded-full ${type.bgColor} flex items-center justify-center`}
                      >
                        <div className={`w-2 h-2 rounded-full ${type.color.replace('text-', 'bg-')}`} />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Conditional: Company/Agency Fields */}
          {showCompanyFields && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-2"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name" className="text-sm">
                    {userType === 'agency' ? 'Agency/Business name' : 'Company name'}
                    <span className="text-muted-foreground ml-1">(optional)</span>
                  </Label>
                  <Input
                    id="company-name"
                    placeholder={userType === 'agency' ? 'e.g., Acme Solutions' : 'e.g., Acme Inc.'}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    data-testid="onboarding-company-name"
                    className="bg-background/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="team-size" className="text-sm">
                    Team size
                    <span className="text-muted-foreground ml-1">(optional)</span>
                  </Label>
                  <Select value={teamSize} onValueChange={setTeamSize}>
                    <SelectTrigger 
                      id="team-size" 
                      data-testid="onboarding-team-size"
                      className="bg-background/50"
                    >
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Conditional: Builder Fields */}
          {showBuilderFields && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2 pt-2"
            >
              <Label htmlFor="building" className="text-sm">
                What are you building?
                <span className="text-muted-foreground ml-1">(optional)</span>
              </Label>
              <Input
                id="building"
                placeholder="e.g., A fintech app for invoice processing"
                value={buildingDescription}
                onChange={(e) => setBuildingDescription(e.target.value)}
                data-testid="onboarding-building"
                className="bg-background/50"
              />
            </motion.div>
          )}

          {/* Use Cases - Multi-select */}
          {userType && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4 pt-2"
            >
              <Label className="text-sm">
                What will you extract most?
                <span className="text-muted-foreground ml-1">(optional, select all that apply)</span>
              </Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {USE_CASES.map((useCase) => (
                  <label
                    key={useCase.id}
                    className={`
                      flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                      ${useCases.includes(useCase.id) 
                        ? 'border-primary/50 bg-primary/5' 
                        : 'border-border hover:border-muted-foreground/30'
                      }
                    `}
                  >
                    <Checkbox
                      checked={useCases.includes(useCase.id)}
                      onCheckedChange={() => handleUseCaseToggle(useCase.id)}
                      data-testid={`usecase-${useCase.id}`}
                    />
                    <span className="text-sm">{useCase.label}</span>
                  </label>
                ))}
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <div className="pt-4">
            <Button
              onClick={handleSubmit}
              disabled={!userType || loading}
              className="w-full h-12 text-base"
              data-testid="onboarding-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Setting up...
                </>
              ) : (
                'Continue to Dashboard'
              )}
            </Button>
            
            <p className="text-center text-xs text-muted-foreground mt-4">
              You can update these preferences anytime in Settings
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingPage;
