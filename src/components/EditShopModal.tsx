import { useState } from 'react';
import { ShopService } from '../services/shop.service';
import { Toast } from './Toast';
import type { FirestoreShop } from '../types/firebase';
import type { ShopCategory } from '../types/shop';

interface EditShopModalProps {
  shop: FirestoreShop;
  onClose: () => void;
  onSuccess: () => void;
}

const SHOP_CATEGORIES: { value: ShopCategory; label: string }[] = [
  { value: 'general', label: 'General Store' },
  { value: 'blacksmith', label: 'Blacksmith' },
  { value: 'armorer', label: 'Armorer' },
  { value: 'fletcher', label: 'Fletcher (Bows & Arrows)' },
  { value: 'leatherworker', label: 'Leatherworker' },
  { value: 'magic', label: 'Magic Shop' },
  { value: 'alchemist', label: 'Alchemist' },
  { value: 'trinket', label: 'Trinket Shop' },
  { value: 'tavern', label: 'Tavern' },
  { value: 'temple', label: 'Temple' },
  { value: 'market', label: 'Market Stall' },
  { value: 'toolshop', label: 'Tool Shop' },
  { value: 'library', label: 'Library' },
  { value: 'guildhall', label: 'Guild Hall' },
  { value: 'inn', label: 'Inn' },
  { value: 'stable', label: 'Stable' },
  { value: 'other', label: 'Other' },
];

export function EditShopModal({ shop, onClose, onSuccess }: EditShopModalProps) {
  const [name, setName] = useState(shop.name);
  const [description, setDescription] = useState(shop.description);
  const [location, setLocation] = useState(shop.location);
  const [category, setCategory] = useState<ShopCategory>(shop.category);
  const [shopkeeper, setShopkeeper] = useState(shop.shopkeeper || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      await ShopService.updateShop(shop.id, {
        name,
        description,
        location,
        category,
        shopkeeper,
      });

      setToast({ message: 'Shop updated successfully!', type: 'success' });

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
        <div className="modal-content" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
          <h2 style={{ marginTop: 0 }}>Edit Shop</h2>
          <p className="text-description">
            Update the shop details.
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group-lg">
              <label className="form-label">
                Shop Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., The Rusty Dragon Inn, Gilded Griffin Armory"
                className="form-input"
              />
            </div>

            <div className="form-group-lg">
              <label className="form-label">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ShopCategory)}
                required
                className="form-select"
              >
                {SHOP_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group-lg">
              <label className="form-label">
                Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                placeholder="e.g., Market Square, Castle District, Harbor Road"
                className="form-input"
              />
            </div>

            <div className="form-group-lg">
              <label className="form-label">
                Shopkeeper
              </label>
              <input
                type="text"
                value={shopkeeper}
                onChange={(e) => setShopkeeper(e.target.value)}
                placeholder="e.g., Gundren Rockseeker (optional)"
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
                placeholder="Describe the shop, its atmosphere, and what it offers (optional)"
                rows={3}
                className="form-textarea"
              />
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
                {loading ? 'Updating...' : 'Update Shop'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
