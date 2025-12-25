import { useState } from 'react';
import { ShopService } from '../services/shop.service';
import { Toast } from './Toast';
import type { ShopCategory } from '../types/shop';

interface CreateShopModalProps {
  marketId: string;
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

export function CreateShopModal({ marketId, onClose, onSuccess }: CreateShopModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<ShopCategory>('general');
  const [shopkeeper, setShopkeeper] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      await ShopService.createShop({
        marketId,
        name,
        description,
        location,
        category,
        shopkeeper,
      });

      setToast({ message: 'Shop created successfully!', type: 'success' });

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
          backgroundColor:'#161b22',
          padding: '30px',
          borderRadius: '8px',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <h2 style={{ marginTop: 0 }}>Create New Shop</h2>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            Add a new shop to this market where players can browse and purchase items.
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
                Shop Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="e.g., The Rusty Dragon Inn, Gilded Griffin Armory"
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
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ShopCategory)}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              >
                {SHOP_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Location *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                placeholder="e.g., Market Square, Castle District, Harbor Road"
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
                Shopkeeper
              </label>
              <input
                type="text"
                value={shopkeeper}
                onChange={(e) => setShopkeeper(e.target.value)}
                placeholder="e.g., Gundren Rockseeker (optional)"
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
                placeholder="Describe the shop, its atmosphere, and what it offers (optional)"
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
                {loading ? 'Creating...' : 'Create Shop'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
