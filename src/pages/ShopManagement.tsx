import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { MarketService } from '../services/market.service';
import { ShopService } from '../services/shop.service';
import { ShopItemService } from '../services/shop-item.service';
import type { Market, FirestoreShop } from '../types/firebase';
import type { User } from 'firebase/auth';
import { Toast } from '../components/Toast';
import { CreateShopModal } from '../components/CreateShopModal';
import { EditShopModal } from '../components/EditShopModal';
import { LIMITS } from '../config/limits';
import { HamburgerMenu } from '../components/HamburgerMenu';

export function ShopManagement() {
  const { marketId } = useParams<{ marketId: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [market, setMarket] = useState<Market | null>(null);
  const [shops, setShops] = useState<FirestoreShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingShop, setEditingShop] = useState<FirestoreShop | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedShops, setSelectedShops] = useState<Set<string>>(new Set());
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateSameMarket, setDuplicateSameMarket] = useState(true);
  const [allMarkets, setAllMarkets] = useState<Market[]>([]);
  const [selectedTargetMarketId, setSelectedTargetMarketId] = useState('');
  const [duplicating, setDuplicating] = useState(false);
  const [editingShopNameId, setEditingShopNameId] = useState<string | null>(null);
  const [shopNameForm, setShopNameForm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
    if (marketId && user) {
      loadData();
    }
  }, [marketId, user]);

  const loadData = async () => {
    if (!marketId || !user) return;

    setLoading(true);
    try {
      const [marketData, shopsData] = await Promise.all([
        MarketService.getMarket(marketId),
        ShopService.getShopsByMarket(marketId)
      ]);

      if (!marketData) {
        setToast({ message: 'Market not found', type: 'error' });
        navigate('/dashboard');
        return;
      }

      // Verify ownership
      if (marketData.dmId !== user.uid) {
        setToast({ message: 'You do not have permission to manage this market', type: 'error' });
        navigate('/dashboard');
        return;
      }

      setMarket(marketData);
      setShops(shopsData);

      // Auto-migrate items to populate customData for player access (runs once per load)
      console.log('Running migration for market:', marketId);
      ShopItemService.migrateItemsWithCustomData(marketId)
        .then(() => console.log('Migration completed'))
        .catch((err) => console.error('Migration failed:', err));
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShop = async (shopId: string, shopName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${shopName}"?\n\n` +
      `⚠️ This will delete the shop but NOT its items.\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await ShopService.deleteShop(shopId);
      setToast({ message: 'Shop deleted successfully!', type: 'success' });
      loadData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const startEditingShopName = (shop: FirestoreShop) => {
    setShopNameForm(shop.name);
    setEditingShopNameId(shop.id);
  };

  const cancelEditingShopName = () => {
    setEditingShopNameId(null);
    setShopNameForm('');
  };

  const saveShopName = async (shopId: string) => {
    if (!shopNameForm.trim()) {
      setToast({ message: 'Shop name cannot be empty', type: 'error' });
      return;
    }

    try {
      await ShopService.updateShop(shopId, { name: shopNameForm.trim() });
      setToast({ message: 'Shop name updated!', type: 'success' });
      setEditingShopNameId(null);
      loadData();
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedShops(new Set());
  };

  const toggleShopSelection = (shopId: string) => {
    const newSelected = new Set(selectedShops);
    if (newSelected.has(shopId)) {
      newSelected.delete(shopId);
    } else {
      newSelected.add(shopId);
    }
    setSelectedShops(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedShops.size === shops.length) {
      setSelectedShops(new Set());
    } else {
      setSelectedShops(new Set(shops.map(shop => shop.id)));
    }
  };

  const openDuplicateModal = async () => {
    if (!user) return;

    try {
      const marketsData = await MarketService.getMarketsByDM(user.uid);
      setAllMarkets(marketsData);
      setShowDuplicateModal(true);
      setDuplicateSameMarket(true);
      setSelectedTargetMarketId('');
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDuplicateShops = async () => {
    if (selectedShops.size === 0) return;

    const targetMarketId = duplicateSameMarket ? marketId : selectedTargetMarketId;

    if (!targetMarketId) {
      setToast({ message: 'Please select a target market', type: 'error' });
      return;
    }

    setDuplicating(true);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const shopId of selectedShops) {
        try {
          const shop = shops.find(s => s.id === shopId);
          if (!shop) continue;

          // Create new shop - only add " (Copy)" suffix if duplicating in same market
          const newShopData = {
            marketId: targetMarketId,
            name: duplicateSameMarket ? `${shop.name} (Copy)` : shop.name,
            description: shop.description,
            location: shop.location,
            category: shop.category,
            shopkeeper: shop.shopkeeper,
            tags: shop.tags || []
          };

          const newShop = await ShopService.createShop(newShopData);

          // Get all items in the original shop
          const shopItems = await ShopItemService.getItemsByShop(shopId);

          // Duplicate all items to the new shop
          for (const item of shopItems) {
            await ShopItemService.addItemToShop({
              shopId: newShop.id,
              marketId: targetMarketId,
              itemLibraryId: item.itemLibraryId,
              price: item.price,
              stock: item.stock
            });
          }

          successCount++;
        } catch (err: any) {
          failCount++;
        }
      }

      if (successCount > 0) {
        setToast({
          message: `Successfully duplicated ${successCount} shop${successCount > 1 ? 's' : ''}!${failCount > 0 ? ` (${failCount} failed)` : ''}`,
          type: failCount > 0 ? 'error' : 'success'
        });
      } else {
        setToast({
          message: `Failed to duplicate shops`,
          type: 'error'
        });
      }

      setShowDuplicateModal(false);
      if (duplicateSameMarket) {
        loadData();
      }

      setSelectionMode(false);
      setSelectedShops(new Set());
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setDuplicating(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedShops.size === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedShops.size} shop${selectedShops.size > 1 ? 's' : ''}?\n\n` +
      `⚠️ This will delete the shops but NOT their items.\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    let successCount = 0;
    let failCount = 0;

    for (const shopId of selectedShops) {
      try {
        await ShopService.deleteShop(shopId);
        successCount++;
      } catch (err: any) {
        failCount++;
      }
    }

    if (successCount > 0) {
      setToast({
        message: `Successfully deleted ${successCount} shop${successCount > 1 ? 's' : ''}!${failCount > 0 ? ` (${failCount} failed)` : ''}`,
        type: failCount > 0 ? 'error' : 'success'
      });
    } else {
      setToast({
        message: `Failed to delete shops`,
        type: 'error'
      });
    }

    setSelectionMode(false);
    setSelectedShops(new Set());
    loadData();
  };

  if (loading) {
    return (
      <div className="loading-container">
        Loading...
      </div>
    );
  }

  if (!market) {
    return null;
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Fixed Header Bar */}
      <div className="dm-header-bar">
        <button
          onClick={() => navigate('/dashboard')}
          className="dm-back-button"
          title="Back to Dashboard"
        >
          ←
        </button>
        <h1 className="dm-header-title">{market.name}</h1>
        <HamburgerMenu />
      </div>

      <div className="page-container">

        {/* Empty State */}
        {shops.length === 0 ? (
          <div className="empty-state">
            <h2>No Shops Yet</h2>
            <p>
              Create your first shop to start adding items for players to purchase!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-btn-success btn-lg"
            >
              + Create Your First Shop
            </button>
          </div>
        ) : (
          <>
            {/* Shop List Header */}
            <div className="controls-container">
              <div>
                <h2 style={{ margin: 0 }}>Shops</h2>
                {shops.length >= LIMITS.SHOPS_PER_MARKET && (
                  <p className="text-danger">
                    ⚠️ You've reached the maximum number of shops for this market
                  </p>
                )}
              </div>
              <div className="button-group">
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={shops.length >= LIMITS.SHOPS_PER_MARKET}
                  className="btn btn-success btn-create-circle"
                  title={shops.length >= LIMITS.SHOPS_PER_MARKET ? `Maximum of ${LIMITS.SHOPS_PER_MARKET} shops per market reached` : 'Create New Shop'}
                >
                  +
                </button>
                <button
                  onClick={toggleSelectionMode}
                  disabled={shops.length === 0}
                  className={`btn ${selectionMode ? 'btn-warning' : 'btn-primary'}`}
                >
                  {selectionMode ? 'Cancel Selection' : 'Select'}
                </button>
              </div>
            </div>

            {/* Shop List */}
            <div className="grid-container">
              {shops.map((shop) => {
                const isSelected = selectedShops.has(shop.id);
                return (
                <div
                  key={shop.id}
                  onClick={() => selectionMode ? toggleShopSelection(shop.id) : navigate(`/shop/${shop.id}/inventory`)}
                  className={`card ${selectionMode ? 'card-clickable' : ''} ${isSelected ? 'card-selected' : ''} ${selectionMode ? 'card-with-checkbox' : ''}`}
                >
                  {selectionMode && (
                    <div className="card-checkbox">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleShopSelection(shop.id)}
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
                          setOpenMenuId(openMenuId === shop.id ? null : shop.id);
                        }}
                        className="kebab-button"
                        title="Shop options"
                      >
                        ⋮
                      </button>

                      {openMenuId === shop.id && (
                        <div className="dropdown-menu">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingShop(shop);
                              setOpenMenuId(null);
                            }}
                            className="dropdown-item"
                          >
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                              handleDeleteShop(shop.id, shop.name);
                            }}
                            className="dropdown-item dropdown-item-danger"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="card-header">
                    <div className={`card-body ${selectionMode ? 'card-content-shifted' : ''}`}>
                      <div>
                        {editingShopNameId === shop.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                            <input
                              type="text"
                              value={shopNameForm}
                              onChange={(e) => setShopNameForm(e.target.value)}
                              style={{
                                fontSize: '1.17em',
                                fontWeight: 'bold',
                                padding: '4px 8px',
                                border: '2px solid #007bff',
                                borderRadius: '4px',
                                width: '300px'
                              }}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') saveShopName(shop.id);
                                if (e.key === 'Escape') cancelEditingShopName();
                              }}
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveShopName(shop.id);
                              }}
                              className="btn btn-success btn-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditingShopName();
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="badge-container">
                            <h3
                              className="editable-heading card-title"
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditingShopName(shop);
                              }}
                              title="Click to edit shop name"
                            >
                              {shop.name}
                            </h3>
                            <span className="badge badge-type">
                              {shop.category}
                            </span>
                          </div>
                        )}
                        <p className="card-description">{shop.description}</p>
                        {shop.shopkeeper && (
                          <p className="item-details">
                            Shopkeeper: <strong>{shop.shopkeeper}</strong>
                          </p>
                        )}
                        <p className="item-details">
                          Location: {shop.location}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </>
        )}
      </div>

      {/* Sticky Bottom Toolbar */}
      {selectionMode && selectedShops.size > 0 && (
        <div className="toolbar-bottom">
          <div className="toolbar-info">
            <span className="toolbar-count">
              {selectedShops.size} shop{selectedShops.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="btn btn-info btn-sm"
            >
              {selectedShops.size === shops.length ? 'Deselect All' : 'Select All'}
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
              onClick={handleBulkDelete}
              className="btn btn-danger"
            >
              Delete Selected
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

      {/* Create Shop Modal */}
      {showCreateModal && (
        <CreateShopModal
          marketId={marketId!}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadData();
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Edit Shop Modal */}
      {editingShop && (
        <EditShopModal
          shop={editingShop}
          onClose={() => setEditingShop(null)}
          onSuccess={() => {
            loadData();
            setEditingShop(null);
          }}
        />
      )}

      {/* Duplicate Shops Modal */}
      {showDuplicateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginTop: 0 }}>Duplicate Shops to Market</h2>
            <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>
              Duplicating {selectedShops.size} shop{selectedShops.size > 1 ? 's' : ''} with all items, prices, and stock.
              {duplicateSameMarket && (selectedShops.size > 1 ? ' Each shop will be named with " (Copy)" suffix.' : ' Shop will be named with " (Copy)" suffix.')}
            </p>

            {/* Same Market Option */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={duplicateSameMarket}
                  onChange={(e) => setDuplicateSameMarket(e.target.checked)}
                />
                <span>Duplicate in the same market</span>
              </label>
            </div>

            {/* Market Selection */}
            {!duplicateSameMarket && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Select Market *
                </label>
                <select
                  value={selectedTargetMarketId}
                  onChange={(e) => setSelectedTargetMarketId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Choose a market...</option>
                  {allMarkets.map(market => (
                    <option key={market.id} value={market.id}>
                      {market.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowDuplicateModal(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicateShops}
                disabled={duplicating || (!duplicateSameMarket && !selectedTargetMarketId)}
                className="btn btn-success"
                style={{
                  flex: 1,
                  cursor: (duplicating || (!duplicateSameMarket && !selectedTargetMarketId)) ? 'not-allowed' : 'pointer',
                  opacity: (duplicating || (!duplicateSameMarket && !selectedTargetMarketId)) ? 0.6 : 1
                }}
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
