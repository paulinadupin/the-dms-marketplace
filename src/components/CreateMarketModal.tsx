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
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '500px' }}>
          <h2 style={{ marginTop: 0 }}>Create New Market</h2>
          <p className="text-description" style={{ marginBottom: '10px' }}>
            A market represents a location in your campaign where players can shop (e.g., Waterdeep, Baldur's Gate).
          </p>
          <p className="text-muted" style={{ marginBottom: '20px' }}>
            Creating market {currentCount + 1} of {maxLimit}
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
              ℹ️ A unique shareable URL will be generated for your players to access this market.
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
                className={`btn ${loading ? 'btn-secondary' : 'btn-success'}`}
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
