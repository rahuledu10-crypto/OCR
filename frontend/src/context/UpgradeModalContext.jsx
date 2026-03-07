import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

const UpgradeModalContext = createContext(null);

export const useUpgradeModal = () => {
  const context = useContext(UpgradeModalContext);
  if (!context) {
    throw new Error('useUpgradeModal must be used within an UpgradeModalProvider');
  }
  return context;
};

export const UpgradeModalProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');

  const openModal = useCallback((plan = 'free') => {
    setCurrentPlan(plan);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Setup axios interceptor for 429 errors
  useState(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 429) {
          const message = error.response?.data?.detail || 'Rate limit exceeded';
          
          // Check if it's a plan limit or rate limit
          if (message.includes('plan limit') || message.includes('extraction limit') || message.includes('quota')) {
            toast.error('Plan Limit Reached', {
              description: 'Upgrade your plan to continue making extractions.',
              action: {
                label: 'Upgrade',
                onClick: () => openModal()
              }
            });
            openModal();
          } else {
            toast.error('Rate Limit Exceeded', {
              description: 'Please wait a moment before making more requests.',
            });
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  });

  return (
    <UpgradeModalContext.Provider value={{ 
      isOpen, 
      currentPlan,
      openModal, 
      closeModal 
    }}>
      {children}
    </UpgradeModalContext.Provider>
  );
};
