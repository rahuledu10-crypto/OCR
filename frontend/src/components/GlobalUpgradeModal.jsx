import { useUpgradeModal } from '../context/UpgradeModalContext';
import PlanUpgradeModal from './PlanUpgradeModal';

const GlobalUpgradeModal = () => {
  const { isOpen, currentPlan, closeModal } = useUpgradeModal();

  return (
    <PlanUpgradeModal 
      isOpen={isOpen}
      onClose={closeModal}
      currentPlan={currentPlan}
    />
  );
};

export default GlobalUpgradeModal;
