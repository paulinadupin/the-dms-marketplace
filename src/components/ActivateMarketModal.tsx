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
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '100%'
        }}>
          <h2 style={{ marginTop: 0 }}>Activate Market?</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            You're about to activate <strong>"{marketName}"</strong>.
          </p>

          <div style={{
            padding: '15px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '5px',
            marginBottom: '20px'
          }}>
            <strong style={{ color: '#856404' }}>Important:</strong>
            <ul style={{ margin: '10px 0 0 20px', color: '#856404' }}>
              <li><strong>Only ONE market can be active at a time</strong> per account</li>
              <li>This market will be <strong>active for 3 hours</strong></li>
              <li>To activate another market, you must deactivate this one first</li>
              <li>Players can access your market via the shareable URL during this time</li>
            </ul>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleActivate}
              disabled={loading}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Activating...' : 'Start (3 Hours)'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
