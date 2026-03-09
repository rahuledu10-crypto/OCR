import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ProfileCompletionModal from '../components/ProfileCompletionModal';

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(true);
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      // Get token from URL (backend redirects here with token)
      const token = searchParams.get('token');
      const isNewUser = searchParams.get('is_new_user') === 'true';
      const errorParam = searchParams.get('error');

      console.log('[GoogleCallback] Received params:', { token: token ? 'present' : 'missing', isNewUser, errorParam });

      if (errorParam) {
        const errorMessages = {
          'oauth_not_configured': 'Google login is not configured yet',
          'token_exchange_failed': 'Failed to authenticate with Google',
          'userinfo_failed': 'Failed to get user info from Google',
          'oauth_request_failed': 'Connection to Google failed',
          'no_email': 'No email provided by Google account'
        };
        setError(errorMessages[errorParam] || 'Google login failed');
        toast.error(errorMessages[errorParam] || 'Google login failed');
        setIsProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!token) {
        console.error('[GoogleCallback] No token in URL');
        setError('Invalid callback - missing authentication token');
        setIsProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        console.log('[GoogleCallback] Logging in with token...');
        
        // Use AuthContext to login with the token
        const user = await loginWithToken(token);
        
        if (!user) {
          throw new Error('Failed to fetch user data');
        }

        console.log('[GoogleCallback] Login successful, user:', user.email, 'isNewUser:', isNewUser);

        // Handle new user - show profile completion modal
        if (isNewUser) {
          localStorage.removeItem('onboarding_completed');
          setIsProcessing(false);
          setShowProfileModal(true);
          return; // Don't navigate yet, wait for profile completion
        }
        
        // Existing user - welcome back and go to dashboard
        toast.success('Welcome back!', {
          description: `Logged in as ${user.email}`
        });
        
        console.log('[GoogleCallback] Redirecting to dashboard...');
        navigate('/dashboard', { replace: true });
        
      } catch (err) {
        console.error('[GoogleCallback] Error:', err);
        setError('Failed to process authentication');
        toast.error('Authentication failed. Please try again.');
        setIsProcessing(false);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, loginWithToken]);

  const handleProfileComplete = () => {
    setShowProfileModal(false);
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-destructive font-medium">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </div>
        ) : isProcessing ? (
          <div className="space-y-4">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Completing sign in...</p>
            <p className="text-xs text-muted-foreground/60">Please wait while we set up your account</p>
          </div>
        ) : null}
      </div>
      
      {/* Profile Completion Modal for new Google users */}
      <ProfileCompletionModal 
        isOpen={showProfileModal} 
        onComplete={handleProfileComplete}
      />
    </div>
  );
};

export default GoogleCallbackPage;
