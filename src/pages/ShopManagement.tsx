import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';
import { MarketService } from '../services/market.service';
import { ShopService } from '../services/shop.service';
import type { Market, FirestoreShop } from '../types/firebase';
import type { User } from 'firebase/auth';
import { Toast } from '../components/Toast';
import { CreateShopModal } from '../components/CreateShopModal';
import { EditShopModal } from '../components/EditShopModal';

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

  if (!market) {
    return null;
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
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <div>
            <h1 style={{ margin: 0 }}>Shops in {market.name}</h1>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>
              {market.description || 'Manage your shops and inventory'}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
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
            Back to Markets
          </button>
        </div>

        {/* Empty State */}
        {shops.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px',
            border: '2px dashed #ddd'
          }}>
            <h2 style={{ marginTop: 0, color: '#666' }}>No Shops Yet</h2>
            <p style={{ color: '#999', marginBottom: '30px' }}>
              Create your first shop to start adding items for players to purchase!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
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
              + Create Your First Shop
            </button>
          </div>
        ) : (
          <>
            {/* Shop List Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0 }}>Shops ({shops.length})</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
              >
                + Create New Shop
              </button>
            </div>

            {/* Shop List */}
            <div style={{ display: 'grid', gap: '20px' }}>
              {shops.map((shop) => (
                <div
                  key={shop.id}
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
                        <h3 style={{ margin: 0 }}>{shop.name}</h3>
                        <span style={{
                          padding: '3px 8px',
                          fontSize: '12px',
                          borderRadius: '3px',
                          backgroundColor: '#e7f3ff',
                          color: '#004085',
                          fontWeight: 'bold'
                        }}>
                          {shop.category}
                        </span>
                      </div>
                      <p style={{ margin: '5px 0', color: '#666' }}>{shop.description}</p>
                      {shop.shopkeeper && (
                        <p style={{ margin: '5px 0', fontSize: '14px', color: '#999' }}>
                          Shopkeeper: <strong>{shop.shopkeeper}</strong>
                        </p>
                      )}
                      <p style={{ margin: '5px 0', fontSize: '14px', color: '#999' }}>
                        Location: {shop.location}
                      </p>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '15px',
                    paddingTop: '15px',
                    borderTop: '1px solid #eee',
                    display: 'flex',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => setEditingShop(shop)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteShop(shop.id, shop.name)}
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
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

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
    </>
  );
}
