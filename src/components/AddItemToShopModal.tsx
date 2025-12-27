import { useState, useEffect } from 'react';
import { ShopItemService } from '../services/shop-item.service';
import { ItemLibraryService } from '../services/item-library.service';
import type { ItemLibrary } from '../types/firebase';
import { Toast } from './Toast';

interface AddItemToShopModalProps {
  shopId: string;
  marketId: string;
  dmId: string;
  existingItemIds: string[]; // IDs of items already in the shop
  onClose: () => void;
  onSuccess: () => void;
}

export function AddItemToShopModal({
  shopId,
  marketId,
  dmId,
  existingItemIds,
  onClose,
  onSuccess
}: AddItemToShopModalProps) {
  const [libraryItems, setLibraryItems] = useState<ItemLibrary[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [priceForm, setPriceForm] = useState({ cp: '', sp: '', gp: '' });
  const [stock, setStock] = useState('');
  const [useUnlimitedStock, setUseUnlimitedStock] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadLibraryItems();
  }, [dmId]);

  const loadLibraryItems = async () => {
    setLoading(true);
    try {
      const items = await ItemLibraryService.getItemsByDM(dmId);
      // Filter out items already in the shop
      const availableItems = items.filter(item => !existingItemIds.includes(item.id));
      setLibraryItems(availableItems);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedItem = libraryItems.find(item => item.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItemId) {
      setError('Please select an item from your library');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Build price object from form
      const newPrice: any = {};
      const cpVal = parseInt(priceForm.cp) || 0;
      const spVal = parseInt(priceForm.sp) || 0;
      const gpVal = parseInt(priceForm.gp) || 0;

      if (cpVal > 0) newPrice.cp = cpVal;
      if (spVal > 0) newPrice.sp = spVal;
      if (gpVal > 0) newPrice.gp = gpVal;

      // Require at least one price value
      if (Object.keys(newPrice).length === 0) {
        setError('Please set at least one price value (CP, SP, or GP)');
        setSubmitting(false);
        return;
      }

      await ShopItemService.addItemToShop({
        shopId,
        marketId,
        itemLibraryId: selectedItemId,
        price: newPrice,
        stock: useUnlimitedStock ? null : (stock ? parseInt(stock) : 1)
      });

      setToast({ message: 'Item added to shop successfully!', type: 'success' });

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter items based on search and type, but always include the selected item
  const filteredItems = libraryItems.filter(item => {
    const matchesSearch =
      item.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.item.type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || item.item.type === typeFilter;
    const isSelected = item.id === selectedItemId;

    // Show if it matches both filters OR if it's the currently selected item
    return (matchesSearch && matchesType) || isSelected;
  });

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
          <h2 style={{ marginTop: 0 }}>Add Item to Shop</h2>
          <p className="text-description">
            Select an item from your library to add to this shop.
          </p>

          {loading ? (
            <div className="loading-state">
              Loading your item library...
            </div>
          ) : libraryItems.length === 0 ? (
            <div className="empty-state">
              <p>
                You have no items available to add. All your library items are already in this shop.
              </p>
              <button
                onClick={onClose}
                className="btn btn-cancel"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Search and Filter */}
                <div className="form-group-lg">
                  <label className="form-label">
                    Search & Filter Items
                  </label>
                  <div className="search-filter-group">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name..."
                      className="form-input"
                    />
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="form-select"
                    >
                      <option value="all">All Types</option>
                      <option value="weapon">Weapon</option>
                      <option value="armor">Armor</option>
                      <option value="consumable">Consumable</option>
                      <option value="tool">Tool</option>
                      <option value="magic">Magic</option>
                      <option value="gear">Gear</option>
                      <option value="treasure">Treasure</option>
                    </select>
                  </div>
                  {(searchTerm || typeFilter !== 'all') && (
                    <p className="filter-results-text">
                      Showing {filteredItems.length} of {libraryItems.length} items
                    </p>
                  )}
                </div>

                {/* Item Selection */}
                <div className="form-group-lg">
                  <label className="form-label">
                    Select Item *
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    required
                    className="form-select"
                  >
                    <option value="">Choose an item...</option>
                    {filteredItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.item.name} ({item.item.type})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Item Preview */}
                {selectedItem && (
                  <div className="item-preview">
                    <h4 style={{ margin: '0 0 10px 0' }}>{selectedItem.item.name}</h4>
                    <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                      <strong>Type:</strong> {selectedItem.item.type}
                    </p>
                    {selectedItem.item.description && (
                      <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
                        {selectedItem.item.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Price (Required) */}
                <div className="form-group-lg">
                  <label className="form-label">
                    Set Price *
                  </label>
                  <p className="text-description" style={{ margin: '0 0 10px 0' }}>
                    Enter at least one currency value
                  </p>

                  <div className="currency-group">
                    <div className="currency-input">
                    <label className="form-label-small">GP</label>
                      <input
                        type="number"
                        min="0"
                        value={priceForm.gp}
                        onChange={(e) => setPriceForm({ ...priceForm, gp: e.target.value })}
                        placeholder="0"
                        className="form-input-small"
                      />
                    </div>
                    <div className="currency-input">
                      <label className="form-label-small">SP</label>
                      <input
                        type="number"
                        min="0"
                        value={priceForm.sp}
                        onChange={(e) => setPriceForm({ ...priceForm, sp: e.target.value })}
                        placeholder="0"
                        className="form-input-small"
                      />
                    </div>
                      <div className="currency-input">
                      <label className="form-label-small">CP</label>
                      <input
                        type="number"
                        min="0"
                        value={priceForm.cp}
                        onChange={(e) => setPriceForm({ ...priceForm, cp: e.target.value })}
                        placeholder="0"
                        className="form-input-small"
                      />
                    </div>
                  </div>
                </div>

                {/* Stock */}
                <div className="form-group-lg">
                  <label className="form-checkbox-label">
                    <input
                      type="checkbox"
                      checked={useUnlimitedStock}
                      onChange={(e) => setUseUnlimitedStock(e.target.checked)}
                      className="form-checkbox"
                    />
                    <span style={{ fontWeight: 'bold' }}>Unlimited Stock</span>
                  </label>

                  {!useUnlimitedStock && (
                    <>
                      <label className="form-label">
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        min="0"
                        placeholder="Enter stock quantity"
                        className="form-input"
                      />
                    </>
                  )}
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
                    disabled={submitting || !selectedItemId}
                    className={`btn ${submitting || !selectedItemId ? 'btn-secondary' : 'btn-success'}`}
                  >
                    {submitting ? 'Adding...' : 'Add to Shop'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
}
