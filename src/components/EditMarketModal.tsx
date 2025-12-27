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
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          <h2 style={{ marginTop: 0 }}>Edit Market</h2>
          <p className="text-description">
            Update the name and description of your market.
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group-lg">
              <label className="form-label">
                Market Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., Waterdeep Market, Baldur's Gate Bazaar"
                className="form-input"
              />
            </div>

            <div className="form-group-lg">
              <label className="form-label">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., All the shops available in the City of Splendors (optional)"
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="info-message">
              ℹ️ Access code cannot be changed: <code className="clickable-code">{market.accessCode}</code>
            </div>

            <div className="btn-group">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-cancel"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`btn ${loading ? 'btn-secondary' : 'btn-primary'}`}
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
