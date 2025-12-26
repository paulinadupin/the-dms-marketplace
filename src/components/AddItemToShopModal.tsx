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
          maxWidth: '700px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <h2 style={{ marginTop: 0 }}>Add Item to Shop</h2>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
            Select an item from your library to add to this shop.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              Loading your item library...
            </div>
          ) : libraryItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                You have no items available to add. All your library items are already in this shop.
              </p>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <>
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
                {/* Search and Filter */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Search & Filter Items
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name..."
                      style={{
                        flex: 2,
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                    />
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
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
                    <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#666' }}>
                      Showing {filteredItems.length} of {libraryItems.length} items
                    </p>
                  )}
                </div>

                {/* Item Selection */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Select Item *
                  </label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
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
                  <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '5px',
                    border: '1px solid #dee2e6'
                  }}>
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
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Set Price *
                  </label>
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666' }}>
                    Enter at least one currency value
                  </p>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold' }}>CP</label>
                      <input
                        type="number"
                        min="0"
                        value={priceForm.cp}
                        onChange={(e) => setPriceForm({ ...priceForm, cp: e.target.value })}
                        placeholder="0"
                        style={{ width: '70px', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold' }}>SP</label>
                      <input
                        type="number"
                        min="0"
                        value={priceForm.sp}
                        onChange={(e) => setPriceForm({ ...priceForm, sp: e.target.value })}
                        placeholder="0"
                        style={{ width: '70px', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 'bold' }}>GP</label>
                      <input
                        type="number"
                        min="0"
                        value={priceForm.gp}
                        onChange={(e) => setPriceForm({ ...priceForm, gp: e.target.value })}
                        placeholder="0"
                        style={{ width: '70px', padding: '8px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '14px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Stock */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                    <input
                      type="checkbox"
                      checked={useUnlimitedStock}
                      onChange={(e) => setUseUnlimitedStock(e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    <span style={{ fontWeight: 'bold' }}>Unlimited Stock</span>
                  </label>

                  {!useUnlimitedStock && (
                    <>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Stock Quantity
                      </label>
                      <input
                        type="number"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        min="0"
                        placeholder="Enter stock quantity"
                        style={{
                          width: '100%',
                          padding: '10px',
                          border: '1px solid #ddd',
                          borderRadius: '5px',
                          fontSize: '14px'
                        }}
                      />
                    </>
                  )}
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
                    disabled={submitting || !selectedItemId}
                    style={{
                      flex: 1,
                      padding: '10px',
                      backgroundColor: submitting || !selectedItemId ? '#6c757d' : '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: submitting || !selectedItemId ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 'bold'
                    }}
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
