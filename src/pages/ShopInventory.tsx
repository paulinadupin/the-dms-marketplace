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

  const formatCost = (cost: any) => {
    if (!cost) return 'No cost';
    const parts = [];
    if (cost.cp) parts.push(`${cost.cp} CP`);
    if (cost.sp) parts.push(`${cost.sp} SP`);
    if (cost.gp) parts.push(`${cost.gp} GP`);
    if (cost.pp) parts.push(`${cost.pp} PP`);
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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading...
      </div>
    );
  }

  if (!shop) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <h2 style={{ color: '#666' }}>Shop not found</h2>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <div>
            <h1 style={{ margin: 0 }}>{shop.name} - Inventory</h1>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>
              {shop.description || 'Manage items in this shop'}
            </p>
          </div>
          <button
            onClick={() => navigate(`/market/${shop.marketId}/shops`)}
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
            Back to Shops
          </button>
        </div>

        {/* Inventory Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div>
            <h2 style={{ margin: 0 }}>Inventory ({shopItems.length}/{LIMITS.ITEMS_PER_SHOP})</h2>
            {shopItems.length >= LIMITS.ITEMS_PER_SHOP && (
              <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#dc3545' }}>
                ⚠️ You've reached the maximum number of items for this shop
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/item-library')}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Go to Item Library
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={shopItems.length >= LIMITS.ITEMS_PER_SHOP}
              style={{
                padding: '10px 20px',
                backgroundColor: shopItems.length >= LIMITS.ITEMS_PER_SHOP ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: shopItems.length >= LIMITS.ITEMS_PER_SHOP ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: shopItems.length >= LIMITS.ITEMS_PER_SHOP ? 0.6 : 1
              }}
              title={shopItems.length >= LIMITS.ITEMS_PER_SHOP ? `Maximum of ${LIMITS.ITEMS_PER_SHOP} items per shop reached` : ''}
            >
              + Add Item
            </button>
          </div>
        </div>

        {/* Empty State */}
        {shopItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '2px dashed #ddd'
          }}>
            <h2 style={{ marginTop: 0, color: '#666' }}>No Items Yet</h2>
            <p style={{ color: '#999', marginBottom: '30px' }}>
              Add items from your library to start stocking this shop!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              + Add Your First Item
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {shopItems.map((shopItem) => {
              const item = getItemData(shopItem);
              if (!item) return null;

              return (
                <div
                  key={shopItem.id}
                  style={{
                    padding: '20px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <h3 style={{ margin: 0 }}>{item.name}</h3>
                        <span style={{
                          padding: '3px 8px',
                          fontSize: '12px',
                          borderRadius: '3px',
                          backgroundColor: '#e7f3ff',
                          color: '#004085',
                          fontWeight: 'bold'
                        }}>
                          {item.type}
                        </span>
                        {shopItem.isIndependent && (
                          <span style={{
                            padding: '3px 8px',
                            fontSize: '12px',
                            borderRadius: '3px',
                            backgroundColor: '#fff3cd',
                            color: '#856404',
                            fontWeight: 'bold'
                          }}>
                            Independent
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '10px 0', color: '#666' }}>
                        <strong>Price:</strong> {formatCost(shopItem.price)}
                      </p>
                      <p style={{ margin: '10px 0', color: '#666' }}>
                        <strong>Stock:</strong> {shopItem.stock === null ? 'Unlimited' : shopItem.stock}
                      </p>
                      {item.description && (
                        <p style={{ margin: '10px 0', fontSize: '14px', color: '#666' }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <button
                      onClick={() => handleRemoveItem(shopItem.id, item.name)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Remove from Shop
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
