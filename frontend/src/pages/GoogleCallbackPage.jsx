import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      // Get token from URL (backend redirects here with token)
      const token = searchParams.get('token');
      const isNewUser = searchParams.get('is_new_user') === 'true';
      const errorParam = searchParams.get('error');

      if (errorParam) {
        const errorMessages = {
          'oauth_not_configured': 'Google login is not configured yet',
          'token_exchange_failed': 'Failed to authenticate with Google',
          'userinfo_failed': 'Failed to get user info from Google',
          'oauth_request_failed': 'Connection to Google failed',
          'no_email': 'No email provided by Google account'
        };
        setError(errorMessages[errorParam] || 'Google login failed');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!token) {
        setError('Invalid callback - missing authentication token');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // Store token
        localStorage.setItem('token', token);

        // Decode token to get user info (JWT payload is base64 encoded)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = {
          id: payload.sub,
          email: payload.email
        };
        localStorage.setItem('user', JSON.stringify(user));

        // Clear onboarding flag for new users so they see onboarding
        if (isNewUser) {
          localStorage.removeItem('onboarding_completed');
          toast.success('Welcome to ExtractAI! Your account is ready.');
        } else {
          toast.success('Logged in successfully!');
        }

        // Navigate to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('Google auth error:', err);
        setError('Failed to process authentication');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <div className="space-y-4">
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground">Redirecting to login...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Completing sign in...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
