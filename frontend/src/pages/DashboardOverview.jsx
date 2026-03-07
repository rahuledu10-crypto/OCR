import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import OnboardingFlow from '../components/OnboardingFlow';
import PlanUpgradeModal from '../components/PlanUpgradeModal';
import { 
  FileText, 
  Key, 
  TrendingUp, 
  CheckCircle2,
  XCircle,
  ArrowRight,
  Clock,
  Zap,
  CreditCard,
  AlertCircle,
  Sparkles
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DashboardOverview = () => {
  const { getAuthHeaders } = useAuth();
  const [stats, setStats] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [recentExtractions, setRecentExtractions] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes, keysRes, subRes] = await Promise.all([
          axios.get(`${API}/analytics/usage`, { headers: getAuthHeaders() }),
          axios.get(`${API}/analytics/recent?limit=5`, { headers: getAuthHeaders() }),
          axios.get(`${API}/keys`, { headers: getAuthHeaders() }),
          axios.get(`${API}/subscription`, { headers: getAuthHeaders() })
        ]);
        setStats(statsRes.data);
        setRecentExtractions(recentRes.data);
        setApiKeys(keysRes.data);
        setSubscription(subRes.data);

        // Show onboarding if user has no API keys and hasn't completed onboarding
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        if (!onboardingCompleted && keysRes.data.length === 0) {
          setShowOnboarding(true);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getAuthHeaders]);

  const statCards = [
    {
      title: 'Total Extractions',
      value: stats?.total_requests || 0,
      icon: FileText,
      color: 'text-primary'
    },
    {
      title: 'Success Rate',
      value: stats?.total_requests 
        ? `${((stats.successful_requests / stats.total_requests) * 100).toFixed(1)}%` 
        : '0%',
      icon: TrendingUp,
      color: 'text-accent'
    },
    {
      title: 'Active API Keys',
      value: apiKeys.filter(k => k.is_active).length,
      icon: Key,
      color: 'text-yellow-500'
    }
  ];

  const getDocTypeLabel = (type) => {
    const labels = {
      'aadhaar': 'Aadhaar',
      'pan': 'PAN',
      'dl': 'Driving License',
      'unknown': 'Unknown'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Refresh data
    window.location.reload();
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboarding_completed', 'true');
  };

  return (
    <div data-testid="dashboard-overview" className="space-y-6">
      {/* Onboarding Flow */}
      {showOnboarding && (
        <OnboardingFlow 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your OCR API usage and performance</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard/keys">
            <Button variant="outline" data-testid="overview-keys-btn">
              <Key className="w-4 h-4 mr-2" />
              Manage Keys
            </Button>
          </Link>
          <Link to="/dashboard/playground">
            <Button data-testid="overview-playground-btn" className="bg-primary hover:bg-primary/90">
              Try Playground
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Usage & Plan Card - Enhanced */}
      {subscription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/50 backdrop-blur border-border/50 overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-6">
                {/* Top Row: Plan Info + Usage Meter */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Plan Info */}
                  <div className="flex items-center gap-4 lg:w-1/4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-semibold text-lg">{subscription.plan_details?.name || 'Free'} Plan</span>
                        {subscription.plan === 'free' && (
                          <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-500 rounded-full">Limited</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {subscription.plan_details?.price_inr ? `₹${subscription.plan_details.price_inr}/month` : 'Free tier'}
                      </p>
                    </div>
                  </div>

                  {/* Usage Progress Bar - Enhanced */}
                  <div className="flex-1 lg:px-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Monthly Usage</span>
                      <span className="font-semibold text-foreground" data-testid="usage-counter">
                        {subscription.usage?.extractions_used || 0} / {subscription.usage?.extractions_limit || 100} extractions
                      </span>
                    </div>
                    <div className="relative">
                      <Progress 
                        value={subscription.usage?.extractions_limit ? 
                          Math.min(((subscription.usage?.extractions_used || 0) / subscription.usage.extractions_limit) * 100, 100) : 0
                        } 
                        className="h-3"
                        data-testid="usage-progress-bar"
                      />
                      {/* Usage percentage markers */}
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-muted-foreground">0%</span>
                        <span className="text-xs text-muted-foreground">50%</span>
                        <span className="text-xs text-muted-foreground">100%</span>
                      </div>
                    </div>
                    {subscription.usage?.remaining !== null && subscription.usage?.remaining <= 20 && (
                      <p className="text-xs text-yellow-500 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {subscription.usage.remaining <= 0 
                          ? 'Plan limit reached! Upgrade or add wallet funds to continue.'
                          : `Only ${subscription.usage.remaining} extractions remaining`
                        }
                      </p>
                    )}
                  </div>

                  {/* Wallet Balance */}
                  <div className="flex items-center gap-4 lg:w-auto">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Wallet Balance</p>
                      <p className="text-xl font-bold">₹{(subscription.wallet_balance || 0).toFixed(2)}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="shrink-0"
                      data-testid="add-funds-btn"
                      onClick={() => setShowUpgradeModal(true)}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Add Funds
                    </Button>
                  </div>
                </div>

                {/* Bottom Row: Upgrade CTA */}
                {(subscription.plan === 'free' || (subscription.usage?.remaining !== null && subscription.usage?.remaining <= 20)) && (
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {subscription.usage?.remaining <= 0 
                              ? 'Unlock more extractions today!'
                              : 'Get more extractions at better rates'
                            }
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Starter plan: 1,000 extractions for just ₹499/month
                          </p>
                        </div>
                      </div>
                      <Button 
                        className="bg-primary hover:bg-primary/90 shrink-0"
                        onClick={() => setShowUpgradeModal(true)}
                        data-testid="upgrade-plan-btn"
                      >
                        Upgrade Plan
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Plan Upgrade Modal */}
      <PlanUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        currentPlan={subscription?.plan || 'free'}
      />

      {/* Document Breakdown & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Document Breakdown */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Document Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.document_breakdown && Object.keys(stats.document_breakdown).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(stats.document_breakdown).map(([type, count]) => {
                  const percentage = (count / stats.total_requests) * 100;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{getDocTypeLabel(type)}</span>
                        <span className="text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No extractions yet</p>
                <Link to="/dashboard/playground">
                  <Button variant="link" className="mt-2">Try the Playground</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Recent Extractions</CardTitle>
            <Link to="/dashboard/analytics">
              <Button variant="ghost" size="sm">View all</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentExtractions.length > 0 ? (
              <div className="space-y-3">
                {recentExtractions.map((extraction) => (
                  <div 
                    key={extraction.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {extraction.success ? (
                      <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {getDocTypeLabel(extraction.document_type)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {extraction.processing_time_ms}ms
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(extraction.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8" data-testid="empty-recent-extractions">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/30 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-muted-foreground/50" />
                </div>
                <p className="font-medium text-foreground mb-1">No extractions yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Try the Playground to make your first extraction
                </p>
                <Link to="/dashboard/playground">
                  <Button variant="outline" size="sm" className="gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Go to Playground
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Guide */}
      {apiKeys.length === 0 && (
        <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Key className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-heading font-semibold mb-1">Create your first API key</h3>
                <p className="text-sm text-muted-foreground">
                  Generate an API key to start integrating OCR extraction into your application.
                </p>
              </div>
              <Link to="/dashboard/keys">
                <Button data-testid="create-first-key-btn" className="bg-primary hover:bg-primary/90 shrink-0">
                  Create API Key
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardOverview;
