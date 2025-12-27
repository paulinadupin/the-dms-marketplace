import { useState } from 'react';
import { MarketService } from '../services/market.service';
import { Toast } from './Toast';

interface ActivateMarketModalProps {
  marketId: string;
  marketName: string;
  dmId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ActivateMarketModal({ marketId, marketName, dmId, onClose, onSuccess }: ActivateMarketModalProps) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleActivate = async () => {
    setLoading(true);

    try {
      await MarketService.activateMarket(marketId, dmId);
      setToast({ message: 'Market activated successfully!', type: 'success' });

      // Close modal after a short delay
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
      setLoading(false);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="activate-modal-overlay">
        <div className="activate-modal-content">
          <h2 className="activate-modal-title">Activate Market?</h2>
          <p className="activate-modal-description">
            You're about to activate <strong>"{marketName}"</strong>.
          </p>

          <div className="activate-modal-warning">
            <strong className="activate-modal-warning-title">Important:</strong>
            <ul className="activate-modal-warning-list">
              <li><strong>Only ONE market can be active at a time</strong> per account</li>
              <li>This market will be <strong>active for 3 hours</strong></li>
              <li>Players can access your market via the access code during this time</li>
            </ul>
          </div>

          <div className="activate-modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="activate-modal-cancel-button"
            >
              Cancel
            </button>
            <button
              onClick={handleActivate}
              disabled={loading}
              className="activate-modal-confirm-button"
            >
              {loading ? 'Activating...' : 'Start (3 Hours)'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
