import { useState } from 'react';
import { MarketService } from '../services/market.service';
import { Toast } from './Toast';
import type { Market } from '../types/firebase';

interface EditMarketModalProps {
  market: Market;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditMarketModal({ market, onClose, onSuccess }: EditMarketModalProps) {
  const [name, setName] = useState(market.name);
  const [description, setDescription] = useState(market.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      await MarketService.updateMarket(market.id, {
        name,
        description
      });

      // Show success message
      setToast({ message: 'Market updated successfully!', type: 'success' });

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
        <h2 style={{ marginTop: 0 }}>Edit Market</h2>
        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
          Update the name and description of your market.
        </p>

        {error && (
          <div style={{
            padding: '10px',
            marginBottom: '15px',
            backgroundColor: '#f8d7da',
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
            backgroundColor: '#2f3947ff',
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#b0c2d5ff'
          }}>
            Access code cannot be changed: <code style={{ backgroundColor: '#4e5f77ff', padding: '2px 6px', borderRadius: '3px' }}>{market.accessCode}</code>
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
                backgroundColor: loading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Updating...' : 'Update Market'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
