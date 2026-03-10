import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PublicDocsPage from "./pages/PublicDocsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import GoogleCallbackPage from "./pages/GoogleCallbackPage";
import OnboardingPage from "./pages/OnboardingPage";
import NotFoundPage from "./pages/NotFoundPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardOverview from "./pages/DashboardOverview";
import APIKeysPage from "./pages/APIKeysPage";
import PlaygroundPage from "./pages/PlaygroundPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import DocsPage from "./pages/DocsPage";
import SupportPage from "./pages/SupportPage";
import GlobalUpgradeModal from "./components/GlobalUpgradeModal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { UpgradeModalProvider } from "./context/UpgradeModalContext";
import "./App.css";

// Protected route that also checks onboarding status
const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check if onboarding is required and not completed
  if (requireOnboarding && !user.onboarding?.completed) {
    return <Navigate to="/onboarding" replace />;
  }
  
  return children;
};

// Onboarding route - redirect to dashboard if already completed
const OnboardingRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If onboarding already completed, go to dashboard
  if (user.onboarding?.completed) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <OnboardingPage />;
};

function App() {
  return (
    <AuthProvider>
      <UpgradeModalProvider>
        <BrowserRouter>
          <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/docs" element={<PublicDocsPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              
              {/* Onboarding route */}
              <Route path="/onboarding" element={<OnboardingRoute />} />
              
              {/* Protected dashboard routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute requireOnboarding={true}>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route index element={<DashboardOverview />} />
                <Route path="keys" element={<APIKeysPage />} />
                <Route path="playground" element={<PlaygroundPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="docs" element={<DocsPage />} />
                <Route path="support" element={<SupportPage />} />
              </Route>

              {/* 404 Catch-all route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          <Toaster position="top-right" richColors />
          <GlobalUpgradeModal />
        </BrowserRouter>
      </UpgradeModalProvider>
    </AuthProvider>
  );
}

export default App;
