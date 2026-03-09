import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { 
  X, 
  Check, 
  Zap, 
  Crown,
  Rocket,
  Building2,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = process.env.REACT_APP_BACKEND_URL;

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '₹0',
    period: 'forever',
    extractions: '100 one-time',
    rateLimit: '10/min',
    icon: Zap,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10',
    features: [
      'Aadhaar, PAN, DL supported',
      'API access',
      'Dashboard access'
    ],
    popular: false,
    current: false
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 499,
    priceLabel: '₹499',
    period: '/month',
    extractions: '1,000/month',
    rateLimit: '30/min',
    icon: Rocket,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    features: [
      'All 17+ document types',
      'Standard support',
      '99.5% uptime SLA',
      'Batch processing'
    ],
    popular: false,
    current: false
  },
  {
    id: 'growth',
    name: 'Growth',
    price: 1999,
    priceLabel: '₹1,999',
    period: '/month',
    extractions: '5,000/month',
    rateLimit: '100/min',
    icon: Crown,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    features: [
      'All 17+ document types',
      'Priority support',
      '99.9% uptime SLA',
      'Custom rate limits',
      'Webhooks'
    ],
    popular: true,
    current: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceLabel: 'Custom',
    period: '',
    extractions: 'Unlimited',
    rateLimit: '500/min',
    icon: Building2,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    features: [
      'All 17+ document types',
      '24/7 dedicated support',
      '99.99% uptime SLA',
      'Custom integrations',
      'WhatsApp integration',
      'On-premise option'
    ],
    popular: false,
    current: false
  }
];

const PlanUpgradeModal = ({ isOpen, onClose, currentPlan = 'free' }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleSubscribe = async (planId) => {
    if (planId === currentPlan) {
      toast.info("You're already on this plan");
      return;
    }

    if (planId === 'free') {
      toast.info("You're already on the free plan");
      return;
    }

    if (planId === 'enterprise') {
      // Open email for enterprise
      window.location.href = 'mailto:sales@extractai.io?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    setLoading(true);
    setSelectedPlan(planId);

    try {
      // Step 1: Create order on backend
      const orderResponse = await axios.post(
        `${API}/api/subscription/create-order`,
        { plan: planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const orderData = orderResponse.data;
      console.log('[Payment] Order created:', orderData);

      // Step 2: Open Razorpay checkout
      const options = {
        key: orderData.razorpay_key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'ExtractAI',
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan Subscription`,
        order_id: orderData.order_id,
        handler: async function (response) {
          console.log('[Payment] Razorpay response:', response);
          
          try {
            // Step 3: Verify payment on backend
            const verifyResponse = await axios.post(
              `${API}/api/subscription/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planId
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            console.log('[Payment] Verification response:', verifyResponse.data);
            
            toast.success('Payment Successful!', {
              description: verifyResponse.data.message
            });
            
            // Reload the page to refresh user data
            window.location.reload();
          } catch (verifyError) {
            console.error('[Payment] Verification failed:', verifyError);
            toast.error('Payment verification failed', {
              description: 'Please contact support if amount was deducted.'
            });
          }
        },
        prefill: {
          email: user?.email || '',
          contact: ''
        },
        notes: {
          plan: planId
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: function () {
            console.log('[Payment] Checkout dismissed');
            setLoading(false);
            setSelectedPlan(null);
          }
        }
      };

      // Check if Razorpay is loaded
      if (typeof window.Razorpay === 'undefined') {
        throw new Error('Razorpay SDK not loaded');
      }

      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response) {
        console.error('[Payment] Payment failed:', response.error);
        toast.error('Payment Failed', {
          description: response.error.description || 'Please try again.'
        });
        setLoading(false);
        setSelectedPlan(null);
      });
      
      razorpay.open();

    } catch (error) {
      console.error('[Payment] Error:', error);
      toast.error('Failed to initiate payment', {
        description: error.response?.data?.detail || error.message || 'Please try again.'
      });
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const plansWithCurrent = PLANS.map(plan => ({
    ...plan,
    current: plan.id === currentPlan
  }));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-card rounded-2xl border border-border shadow-2xl"
          data-testid="plan-upgrade-modal"
        >
          {/* Header */}
          <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 className="font-heading text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Upgrade Your Plan
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the plan that fits your needs
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
              data-testid="close-upgrade-modal"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Plans Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plansWithCurrent.map((plan, index) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative rounded-xl border-2 p-5 transition-all ${
                    plan.popular 
                      ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' 
                      : plan.current
                        ? 'border-accent/50 bg-accent/5'
                        : 'border-border hover:border-muted-foreground/30'
                  }`}
                  data-testid={`plan-card-${plan.id}`}
                >
                  {/* Popular Badge */}
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 text-xs font-semibold bg-primary text-white rounded-full">
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Current Badge */}
                  {plan.current && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 text-xs font-semibold bg-accent text-white rounded-full">
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Plan Icon & Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg ${plan.bgColor} flex items-center justify-center`}>
                      <plan.icon className={`w-5 h-5 ${plan.color}`} />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.extractions}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.priceLabel}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 mb-5">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.color}`} />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                    <li className="flex items-start gap-2 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.color}`} />
                      <span className="text-muted-foreground">{plan.rateLimit} rate limit</span>
                    </li>
                  </ul>

                  {/* Subscribe Button */}
                  <Button
                    className={`w-full ${
                      plan.current 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                        : plan.popular 
                          ? 'bg-primary hover:bg-primary/90' 
                          : 'bg-muted hover:bg-muted/80 text-foreground'
                    }`}
                    disabled={plan.current || (loading && selectedPlan === plan.id)}
                    onClick={() => handleSubscribe(plan.id)}
                    data-testid={`subscribe-${plan.id}-btn`}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : plan.current ? (
                      'Current Plan'
                    ) : plan.id === 'enterprise' ? (
                      'Contact Sales'
                    ) : (
                      'Subscribe'
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Pay-as-you-go info */}
            <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground text-center">
                <span className="font-medium text-foreground">Pay-as-you-go:</span>{' '}
                When you exceed your plan limit, extractions are charged at ₹0.20 each from your wallet balance.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PlanUpgradeModal;
