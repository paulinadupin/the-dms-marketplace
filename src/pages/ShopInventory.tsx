import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { ShopService } from '../services/shop.service';
import { ShopItemService } from '../services/shop-item.service';
import { ItemLibraryService } from '../services/item-library.service';
import type { User } from 'firebase/auth';
import type { FirestoreShop, ShopItem, ItemLibrary } from '../types/firebase';
import { Toast } from '../components/Toast';
import { AddItemToShopModal } from '../components/AddItemToShopModal';
import { LIMITS } from '../config/limits';

export function ShopInventory() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<FirestoreShop | null>(null);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [libraryItems, setLibraryItems] = useState<ItemLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceForm, setPriceForm] = useState({ cp: '', sp: '', gp: '' });
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockForm, setStockForm] = useState({ stock: '', unlimited: false });

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((authUser) => {
      if (!authUser) {
        navigate('/auth');
        return;
      }
      setUser(authUser);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (shopId && user) {
      loadData();
    }
  }, [shopId, user]);

  const loadData = async () => {
    if (!shopId || !user) {
      console.log('Missing shopId or user:', { shopId, user: user?.uid });
      return;
    }

    console.log('Loading shop inventory for shopId:', shopId);
    setLoading(true);
    try {
      console.log('Fetching shop data...');
      const [shopData, shopItemsData, libraryItemsData] = await Promise.all([
        ShopService.getShop(shopId),
        ShopItemService.getItemsByShop(shopId),
        ItemLibraryService.getItemsByDM(user.uid)
      ]);

      console.log('Shop data received:', shopData);
      console.log('Shop items received:', shopItemsData.length);
      console.log('Library items received:', libraryItemsData.length);

      if (!shopData) {
        setToast({ message: `Shop not found with ID: ${shopId}`, type: 'error' });
        setLoading(false);
        // Don't navigate - let user see the error
        return;
      }

      setShop(shopData);
      setShopItems(shopItemsData);
      setLibraryItems(libraryItemsData);
    } catch (err: any) {
      console.error('Error loading shop inventory:', err);
      setToast({ message: `Error: ${err.message}`, type: 'error' });
      setShop(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (shopItemId: string, itemName: string) => {
    const confirmed = window.confirm(
      `Remove "${itemName}" from this shop?\n\n` +
      `This will not delete the item from your library.`
    );

    if (!confirmed) return;

    try {
      await ShopItemService.removeItemFromShop(shopItemId);
      setToast({ message: 'Item removed from shop!', type: 'success' });
      loadData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedItems(new Set()); // Clear selections when toggling mode
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === shopItems.length) {
      // Deselect all
      setSelectedItems(new Set());
    } else {
      // Select all
      setSelectedItems(new Set(shopItems.map(item => item.id)));
    }
  };

  const handleBulkRemove = async () => {
    if (selectedItems.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} from this shop?\n\n` +
      `This will not delete the items from your library.`
    );

    if (!confirmed) return;

    let successCount = 0;
    let failCount = 0;

    for (const itemId of selectedItems) {
      try {
        await ShopItemService.removeItemFromShop(itemId);
        successCount++;
      } catch (err: any) {
        failCount++;
      }
    }

    // Show results
    if (successCount > 0) {
      setToast({
        message: `Successfully removed ${successCount} item${successCount > 1 ? 's' : ''}!${failCount > 0 ? ` (${failCount} failed)` : ''}`,
        type: failCount > 0 ? 'error' : 'success'
      });
    } else {
      setToast({
        message: `Failed to remove items`,
        type: 'error'
      });
    }

    // Reset selection mode and reload
    setSelectionMode(false);
    setSelectedItems(new Set());
    loadData();
  };

  const startEditingPrice = (shopItem: ShopItem) => {
    const price = shopItem.price || { cp: 0, sp: 0, gp: 0 };
    setPriceForm({
      cp: ((price as any).cp || 0).toString(),
      sp: ((price as any).sp || 0).toString(),
      gp: ((price as any).gp || 0).toString(),
    });
    setEditingPriceId(shopItem.id);
  };

  const cancelEditingPrice = () => {
    setEditingPriceId(null);
    setPriceForm({ cp: '', sp: '', gp: '' });
  };

  const savePrice = async (shopItemId: string) => {
    try {
      // Only include currencies that have a value > 0
      const newPrice: any = {};
      const cpVal = parseInt(priceForm.cp) || 0;
      const spVal = parseInt(priceForm.sp) || 0;
      const gpVal = parseInt(priceForm.gp) || 0;

      if (cpVal > 0) newPrice.cp = cpVal;
      if (spVal > 0) newPrice.sp = spVal;
      if (gpVal > 0) newPrice.gp = gpVal;

      await ShopItemService.updateShopItem(shopItemId, { price: newPrice });
      setToast({ message: 'Price updated!', type: 'success' });
      setEditingPriceId(null);
      loadData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const startEditingStock = (shopItem: ShopItem) => {
    setStockForm({
      stock: shopItem.stock !== null ? shopItem.stock.toString() : '',
      unlimited: shopItem.stock === null
    });
    setEditingStockId(shopItem.id);
  };

  const cancelEditingStock = () => {
    setEditingStockId(null);
    setStockForm({ stock: '', unlimited: false });
  };

  const saveStock = async (shopItemId: string) => {
    try {
      const newStock = stockForm.unlimited ? null : (parseInt(stockForm.stock) || 0);

      await ShopItemService.updateShopItem(shopItemId, { stock: newStock });
      setToast({ message: 'Stock updated!', type: 'success' });
      setEditingStockId(null);
      loadData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const formatCost = (cost: any) => {
    if (!cost) return 'No cost';
    const parts = [];
    if (cost.cp) parts.push(`${cost.cp} CP`);
    if (cost.sp) parts.push(`${cost.sp} SP`);
    if (cost.gp) parts.push(`${cost.gp} GP`);
    return parts.length > 0 ? parts.join(', ') : 'No cost';
  };

  const getItemData = (shopItem: ShopItem): any => {
    if (shopItem.isIndependent && shopItem.customData) {
      return shopItem.customData;
    }
    const libraryItem = libraryItems.find(item => item.id === shopItem.itemLibraryId);
    return libraryItem?.item;
  };

  if (loading) {
    return (
      <div className="loading-container">
        Loading...
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="error-container">
        <h2>Shop not found</h2>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-primary"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-container">
        {/* Header */}
        <div className="header-container">
          <div className="header-info">
            <h1>{shop.name} - Inventory</h1>
            <p>
              {shop.description || 'Manage items in this shop'}
            </p>
          </div>
          <button
            onClick={() => navigate(`/market/${shop.marketId}/shops`)}
            className="btn btn-secondary"
          >
            Back to Shops
          </button>
        </div>

        {/* Inventory Header */}
        <div className="controls-container">
          <div>
            <h2 style={{ margin: 0 }}>Inventory ({shopItems.length}/{LIMITS.ITEMS_PER_SHOP})</h2>
            {shopItems.length >= LIMITS.ITEMS_PER_SHOP && (
              <p className="text-danger">
                ⚠️ You've reached the maximum number of items for this shop
              </p>
            )}
          </div>
          <div className="button-group">
            <button
              onClick={() => navigate('/item-library')}
              className="btn btn-primary"
            >
              Go to Item Library
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={shopItems.length >= LIMITS.ITEMS_PER_SHOP}
              title={shopItems.length >= LIMITS.ITEMS_PER_SHOP ? `Maximum of ${LIMITS.ITEMS_PER_SHOP} items per shop reached` : ''}
              className="btn btn-success"
            >
              + Add Item
            </button>
            <button
              onClick={toggleSelectionMode}
              disabled={shopItems.length === 0}
              className={`btn ${selectionMode ? 'btn-warning' : 'btn-primary'}`}
            >
              {selectionMode ? 'Cancel Selection' : 'Select'}
            </button>
          </div>
        </div>

        {/* Empty State */}
        {shopItems.length === 0 ? (
          <div className="empty-state">
            <h2>No Items Yet</h2>
            <p>
              Add items from your library to start stocking this shop!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-success btn-lg"
            >
              + Add Your First Item
            </button>
          </div>
        ) : (
          <div className="grid-container-sm">
            {shopItems.map((shopItem) => {
              const item = getItemData(shopItem);
              if (!item) return null;
              const isSelected = selectedItems.has(shopItem.id);

              return (
                <div
                  key={shopItem.id}
                  onClick={() => selectionMode && toggleItemSelection(shopItem.id)}
                  className={`card ${selectionMode ? 'card-clickable' : ''} ${isSelected ? 'card-selected' : ''} ${selectionMode ? 'card-with-checkbox' : ''}`}
                >
                  {selectionMode && (
                    <div className="card-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleItemSelection(shopItem.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div className="card-header">
                    <div className={`card-body ${selectionMode ? 'card-content-shifted' : ''}`}>
                      <div className="badge-container">
                        <h3 className="card-title">{item.name}</h3>
                        <span className="badge badge-type">
                          {item.type}
                        </span>
                        {shopItem.isIndependent && (
                          <span className="badge badge-independent">
                            Independent
                          </span>
                        )}
                      </div>
                      {editingPriceId === shopItem.id ? (
                        <div className="price-edit-form" style={{ marginTop: '8px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>CP</label>
                              <input
                                type="number"
                                min="0"
                                value={priceForm.cp}
                                onChange={(e) => setPriceForm({ ...priceForm, cp: e.target.value })}
                                style={{ width: '60px', padding: '4px' }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>SP</label>
                              <input
                                type="number"
                                min="0"
                                value={priceForm.sp}
                                onChange={(e) => setPriceForm({ ...priceForm, sp: e.target.value })}
                                style={{ width: '60px', padding: '4px' }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>GP</label>
                              <input
                                type="number"
                                min="0"
                                value={priceForm.gp}
                                onChange={(e) => setPriceForm({ ...priceForm, gp: e.target.value })}
                                style={{ width: '60px', padding: '4px' }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                savePrice(shopItem.id);
                              }}
                              className="btn btn-success btn-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditingPrice();
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className="item-price"
                          onClick={(e) => {
                            if (!selectionMode) {
                              e.stopPropagation();
                              startEditingPrice(shopItem);
                            }
                          }}
                          style={{
                            cursor: selectionMode ? 'default' : 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                            textDecoration: selectionMode ? 'none' : 'underline',
                            textDecorationStyle: 'dotted',
                            textUnderlineOffset: '3px'
                          }}
                          onMouseEnter={(e) => {
                            if (!selectionMode) {
                              e.currentTarget.style.backgroundColor = '#f0f0f0';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title={selectionMode ? '' : 'Click to edit price'}
                        >
                          <strong>Price:</strong> {formatCost(shopItem.price)}
                        </p>
                      )}
                      {editingStockId === shopItem.id ? (
                        <div className="stock-edit-form" style={{ marginTop: '8px', marginBottom: '8px' }}>
                          <div style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                              <input
                                type="checkbox"
                                checked={stockForm.unlimited}
                                onChange={(e) => setStockForm({ ...stockForm, unlimited: e.target.checked })}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span>Unlimited Stock</span>
                            </label>
                          </div>
                          {!stockForm.unlimited && (
                            <div style={{ marginBottom: '8px' }}>
                              <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>
                                Stock Quantity
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={stockForm.stock}
                                onChange={(e) => setStockForm({ ...stockForm, stock: e.target.value })}
                                placeholder="0"
                                style={{ width: '100px', padding: '4px' }}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveStock(shopItem.id);
                              }}
                              className="btn btn-success btn-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditingStock();
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p
                          className="item-stock"
                          onClick={(e) => {
                            if (!selectionMode) {
                              e.stopPropagation();
                              startEditingStock(shopItem);
                            }
                          }}
                          style={{
                            cursor: selectionMode ? 'default' : 'pointer',
                            padding: '4px',
                            borderRadius: '4px',
                            transition: 'all 0.2s',
                            textDecoration: selectionMode ? 'none' : 'underline',
                            textDecorationStyle: 'dotted',
                            textUnderlineOffset: '3px'
                          }}
                          onMouseEnter={(e) => {
                            if (!selectionMode) {
                              e.currentTarget.style.backgroundColor = '#f0f0f0';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                          title={selectionMode ? '' : 'Click to edit stock'}
                        >
                          <strong>Stock:</strong> {shopItem.stock === null ? 'Unlimited' : shopItem.stock}
                        </p>
                      )}
                      {item.description && (
                        <p className="card-description">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {!selectionMode && (
                    <div className="card-footer">
                      <button
                        onClick={() => handleRemoveItem(shopItem.id, item.name)}
                        className="btn btn-danger btn-sm"
                      >
                        Remove from Shop
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky Bottom Toolbar */}
      {selectionMode && selectedItems.size > 0 && (
        <div className="toolbar-bottom">
          <div className="toolbar-info">
            <span className="toolbar-count">
              {selectedItems.size} item{selectedItems.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="btn btn-info btn-sm"
            >
              {selectedItems.size === shopItems.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="toolbar-actions">
            <button
              onClick={handleBulkRemove}
              className="btn btn-danger"
            >
              Remove from Shop
            </button>
            <button
              onClick={toggleSelectionMode}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && user && shop && (
        <AddItemToShopModal
          shopId={shopId!}
          marketId={shop.marketId}
          dmId={user.uid}
          existingItemIds={shopItems.map(si => si.itemLibraryId)}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            loadData();
            setShowAddModal(false);
          }}
        />
      )}
    </>
  );
}
