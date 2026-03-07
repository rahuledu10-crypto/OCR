import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const GoogleCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin } = useAuth();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const sessionId = searchParams.get('session_id');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError('Google login was cancelled or failed');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (!sessionId) {
        setError('Invalid callback - missing session');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      try {
        // Exchange session_id for JWT token
        const response = await axios.post(`${API}/auth/google/session`, {
          session_id: sessionId
        });

        const { access_token, user, is_new_user } = response.data;

        // Store token and user data
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));

        // Clear onboarding flag for new users so they see onboarding
        if (is_new_user) {
          localStorage.removeItem('onboarding_completed');
          toast.success('Welcome to ExtractAI! Your account is ready.');
        } else {
          toast.success('Logged in successfully!');
        }

        // Navigate to dashboard
        navigate('/dashboard');
      } catch (err) {
        console.error('Google auth error:', err);
        setError(err.response?.data?.detail || 'Authentication failed');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, authLogin]);

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
