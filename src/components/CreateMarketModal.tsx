import { useState } from 'react';
import { MarketService } from '../services/market.service';
import { Toast } from './Toast';

interface CreateMarketModalProps {
  dmId: string;
  currentCount: number;
  maxLimit: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateMarketModal({ dmId, currentCount, maxLimit, onClose, onSuccess }: CreateMarketModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Double-check limit
    if (currentCount >= maxLimit) {
      setError(`You've reached the maximum of ${maxLimit} markets.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const market = await MarketService.createMarket(dmId, {
        name,
        description
      });

      // Show success message
      setToast({ message: 'Market created successfully!', type: 'success' });

      // Close modal after a short delay to show toast
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
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
        backgroundColor: '#161b22',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h2 style={{ marginTop: 0 }}>Create New Market</h2>
        <p style={{ color: '#666', marginBottom: '10px' }}>
          A market represents a location in your campaign where players can shop (e.g., Waterdeep, Baldur's Gate).
        </p>
        <p style={{ color: '#999', marginBottom: '20px', fontSize: '14px' }}>
          Creating market {currentCount + 1} of {maxLimit}
        </p>

        {error && (
          <div style={{
            padding: '10px',
            marginBottom: '15px',
            backgroundColor: '#161b22',
            color: '#721c24',
            borderRadius: '5px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Market Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g., Waterdeep Market, Baldur's Gate Bazaar"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., All the shops available in the City of Splendors (optional)"
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{
            padding: '10px',
            backgroundColor: '#36404cff',
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#93a0aeff'
          }}>
            ℹ️ A unique shareable URL will be generated for your players to access this market.
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
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
              {loading ? 'Creating...' : 'Create Market'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
