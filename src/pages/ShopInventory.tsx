import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { ShopService } from '../services/shop.service';
import { ShopItemService } from '../services/shop-item.service';
import { ItemLibraryService } from '../services/item-library.service';
import { MarketService } from '../services/market.service';
import type { User } from 'firebase/auth';
import type { FirestoreShop, ShopItem, ItemLibrary, Market } from '../types/firebase';
import { Toast } from '../components/Toast';
import { AddItemToShopModal } from '../components/AddItemToShopModal';
import { LIMITS } from '../config/limits';
import { HamburgerMenu } from '../components/HamburgerMenu';
import { hasMarkdownTable } from '../utils/markdown';

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
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateSameShop, setDuplicateSameShop] = useState(true);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [allShops, setAllShops] = useState<FirestoreShop[]>([]);
  const [selectedMarketId, setSelectedMarketId] = useState('');
  const [selectedTargetShopId, setSelectedTargetShopId] = useState('');
  const [duplicating, setDuplicating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());

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

  // Click outside handler to close kebab menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.kebab-menu-container')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openMenuId]);

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

  const toggleDescriptionExpanded = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpanded = new Set(expandedDescriptions);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedDescriptions(newExpanded);
  };

  const truncateDescription = (text: string, maxLines: number = 2): { truncated: string; isTruncated: boolean } => {
    const lines = text.split('\n');
    if (lines.length <= maxLines) {
      return { truncated: text, isTruncated: false };
    }
    return {
      truncated: lines.slice(0, maxLines).join('\n'),
      isTruncated: true
    };
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

  const handleDuplicateSingleItem = async (shopItemId: string) => {
    // Set the selected item and open the duplicate modal
    setSelectedItems(new Set([shopItemId]));
    await openDuplicateModal();
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

  const openDuplicateModal = async () => {
    if (!user) return;

    try {
      // Load markets and all shops
      const [marketsData, shopsData] = await Promise.all([
        MarketService.getMarketsByDM(user.uid),
        // We'll load all shops for all markets
        Promise.resolve([]) as Promise<FirestoreShop[]>
      ]);

      setMarkets(marketsData);

      // Load shops for all markets
      const allShopsPromises = marketsData.map(market => ShopService.getShopsByMarket(market.id));
      const allShopsArrays = await Promise.all(allShopsPromises);
      const allShopsFlat = allShopsArrays.flat();

      setAllShops(allShopsFlat);
      setShowDuplicateModal(true);
      setDuplicateSameShop(true);
      setSelectedMarketId('');
      setSelectedTargetShopId('');
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDuplicate = async () => {
    if (selectedItems.size === 0) return;

    const targetShopId = duplicateSameShop ? shopId : selectedTargetShopId;

    if (!targetShopId) {
      setToast({ message: 'Please select a target shop', type: 'error' });
      return;
    }

    setDuplicating(true);

    try {
      let successCount = 0;
      let failCount = 0;

      // Get target shop to get its marketId
      const targetShop = duplicateSameShop ? shop : allShops.find(s => s.id === targetShopId);

      if (!targetShop) {
        throw new Error('Target shop not found');
      }

      for (const itemId of selectedItems) {
        try {
          const shopItem = shopItems.find(item => item.id === itemId);
          if (!shopItem) continue;

          // Duplicate with same price and stock
          await ShopItemService.addItemToShop({
            shopId: targetShopId!,
            marketId: targetShop.marketId,
            itemLibraryId: shopItem.itemLibraryId,
            price: shopItem.price,
            stock: shopItem.stock
          });

          successCount++;
        } catch (err: any) {
          failCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        setToast({
          message: `Successfully duplicated ${successCount} item${successCount > 1 ? 's' : ''}!${failCount > 0 ? ` (${failCount} failed)` : ''}`,
          type: failCount > 0 ? 'error' : 'success'
        });
      } else {
        setToast({
          message: `Failed to duplicate items`,
          type: 'error'
        });
      }

      // Close modal and reload if duplicating to same shop
      setShowDuplicateModal(false);
      if (duplicateSameShop) {
        loadData();
      }

      // Reset selection mode
      setSelectionMode(false);
      setSelectedItems(new Set());
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setDuplicating(false);
    }
  };

  const filteredShops = allShops.filter(s =>
    duplicateSameShop ? false : (selectedMarketId ? s.marketId === selectedMarketId : true)
  );

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

      // Update both stock and originalStock when manually editing
      // This sets a new baseline for stock resets
      await ShopItemService.updateShopItem(shopItemId, {
        stock: newStock,
        originalStock: newStock
      });
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

      {/* Fixed Header Bar */}
      <div className="dm-header-bar">
        <button
          onClick={() => navigate(`/dm/market/${shop.marketId}/shops`)}
          className="dm-back-button"
          title="Back to Shops"
        >
          ←
        </button>
        <h1 className="dm-header-title">{shop.name}</h1>
        <HamburgerMenu />
      </div>

      <div className="page-container">

        {/* Inventory Header */}
        <div className="controls-container">
          <div>
            <h2 style={{ margin: 0 }}>Inventory</h2>
            {shopItems.length >= LIMITS.ITEMS_PER_SHOP && (
              <p className="text-danger">
                ⚠️ You've reached the maximum number of items for this shop
              </p>
            )}
          </div>
          <div className="button-group">
            <button
              onClick={() => setShowAddModal(true)}
              disabled={shopItems.length >= LIMITS.ITEMS_PER_SHOP}
              title={shopItems.length >= LIMITS.ITEMS_PER_SHOP ? `Maximum of ${LIMITS.ITEMS_PER_SHOP} items per shop reached` : 'Add from Library'}
              className="btn btn-success btn-create-circle"
            >
              +
            </button>
            <button
              onClick={toggleSelectionMode}
              disabled={shopItems.length === 0}
              className={`btn ${selectionMode ? 'btn-warning' : 'btn-primary'}`}
            >
              {selectionMode ? 'Cancel Selection' : 'Select Items'}
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

                  {/* Kebab Menu */}
                  {!selectionMode && (
                    <div className="kebab-menu-container">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === shopItem.id ? null : shopItem.id);
                        }}
                        className="kebab-button"
                        title="Item options"
                      >
                        ⋮
                      </button>

                      {openMenuId === shopItem.id && (
                        <div className="dropdown-menu">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              handleDuplicateSingleItem(shopItem.id);
                            }}
                            className="dropdown-item"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              handleRemoveItem(shopItem.id, item.name);
                            }}
                            className="dropdown-item dropdown-item-danger"
                          >
                            Remove from shop
                          </button>
                        </div>
                      )}
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
                      {item.description && (() => {
                        const isExpanded = expandedDescriptions.has(shopItem.id);
                        const { isTruncated } = truncateDescription(item.description);

                        if (hasMarkdownTable(item.description)) {
                          return (
                            <p className="card-description" style={{ fontStyle: 'italic', color: 'var(--color-text-muted)' }}>
                              Contains table - view in item library for details
                            </p>
                          );
                        }

                        return (
                          <>
                            <p className="card-description" style={{
                              display: '-webkit-box',
                              WebkitLineClamp: isExpanded ? 'unset' : 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: isExpanded ? 'visible' : 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {item.description}
                            </p>
                            {isTruncated && (
                              <button
                                onClick={(e) => toggleDescriptionExpanded(shopItem.id, e)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--color-button-primary)',
                                  cursor: 'pointer',
                                  padding: '5px 0',
                                  fontSize: '14px',
                                  textDecoration: 'underline'
                                }}
                              >
                                {isExpanded ? 'Show Less' : 'Show More'}
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
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
              onClick={openDuplicateModal}
              className="btn btn-primary"
            >
              Duplicate
            </button>
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

      {/* Duplicate Items Modal */}
      {showDuplicateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="duplicate-modal-title">Duplicate Items to Shop</h2>
            <p className="duplicate-modal-description">
              Duplicating {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} with the same price and stock.
            </p>

            {/* Same Shop Option */}
            <div className="duplicate-checkbox-section">
              <label className="duplicate-checkbox-label">
                <input
                  type="checkbox"
                  checked={duplicateSameShop}
                  onChange={(e) => setDuplicateSameShop(e.target.checked)}
                />
                <span>Duplicate in the same shop</span>
              </label>
            </div>

            {/* Market Selection */}
            {!duplicateSameShop && (
              <>
                <div className="duplicate-form-section">
                  <label className="form-label">
                    Select Market *
                  </label>
                  <select
                    value={selectedMarketId}
                    onChange={(e) => {
                      setSelectedMarketId(e.target.value);
                      setSelectedTargetShopId(''); // Reset shop selection
                    }}
                    className="form-select"
                  >
                    <option value="">Choose a market...</option>
                    {markets.map(market => (
                      <option key={market.id} value={market.id}>
                        {market.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Shop Selection */}
                <div className="duplicate-form-section">
                  <label className="form-label">
                    Select Shop *
                  </label>
                  <select
                    value={selectedTargetShopId}
                    onChange={(e) => setSelectedTargetShopId(e.target.value)}
                    disabled={!selectedMarketId}
                    className="form-select"
                  >
                    <option value="">Choose a shop...</option>
                    {filteredShops.map(shop => (
                      <option key={shop.id} value={shop.id}>
                        {shop.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="duplicate-actions">
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicate}
                disabled={duplicating || (!duplicateSameShop && !selectedTargetShopId)}
                className="btn btn-success"
              >
                {duplicating ? 'Duplicating...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
