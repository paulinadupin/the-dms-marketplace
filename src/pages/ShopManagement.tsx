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
import { EditMarketModal } from '../components/EditMarketModal';
import { ActivateMarketModal } from '../components/ActivateMarketModal';
import { LIMITS } from '../config/limits';

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
  const [editingMarket, setEditingMarket] = useState(false);
  const [activatingMarket, setActivatingMarket] = useState(false);
  const [activeMarket, setActiveMarket] = useState<Market | null>(null);

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
      const [marketData, shopsData, activeMarketData] = await Promise.all([
        MarketService.getMarket(marketId),
        ShopService.getShopsByMarket(marketId),
        MarketService.getActiveMarket(user.uid)
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
      setActiveMarket(activeMarketData);
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

  const handleDeactivateMarket = async () => {
    if (!market) return;

    try {
      await MarketService.deactivateMarket(market.id);
      setToast({ message: 'Market deactivated successfully!', type: 'success' });
      loadData();
    } catch (err: any) {
      setToast({ message: 'Failed to deactivate market: ' + err.message, type: 'error' });
    }
  };

  const handleDeleteMarket = async () => {
    if (!market) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${market.name}"?\n\n` +
      `⚠️ This will permanently DELETE:\n` +
      `- The market\n` +
      `- All shops in this market\n\n` +
      `✓ Items will be kept in your library for reuse\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await MarketService.deleteMarket(market.id);
      setToast({ message: 'Market deleted successfully!', type: 'success' });
      navigate('/dashboard');
    } catch (err: any) {
      setToast({ message: 'Failed to delete market: ' + err.message, type: 'error' });
    }
  };

  const copyShareUrl = (accessCode: string) => {
    const url = MarketService.getShareableURL(accessCode);
    navigator.clipboard.writeText(url);
    setToast({ message: 'Market URL copied to clipboard!', type: 'success' });
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
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px'
        }}>
          <div>
            <h1 style={{ margin: 0 }}>{market.name}</h1>
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
            Back
          </button>
        </div>

        {/* Market Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '15px 20px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {market.isActive ? (
              <button
                onClick={handleDeactivateMarket}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ffc107',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Deactivate Market
              </button>
            ) : activeMarket && activeMarket.id !== market.id ? (
              <button
                disabled
                title="There is already an active market in your account"
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'not-allowed',
                  fontSize: '14px',
                  opacity: 0.6
                }}
              >
                Activate Market (Blocked)
              </button>
            ) : (
              <button
                onClick={() => setActivatingMarket(true)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Activate Market
              </button>
            )}
            <button
              onClick={() => copyShareUrl(market.accessCode)}
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
              Share Market Link
            </button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setEditingMarket(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Edit Market
            </button>
            <button
              onClick={handleDeleteMarket}
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
              Delete Market
            </button>
          </div>
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
              <div>
                <h2 style={{ margin: 0 }}>Shops ({shops.length}/{LIMITS.SHOPS_PER_MARKET})</h2>
                {shops.length >= LIMITS.SHOPS_PER_MARKET && (
                  <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#dc3545' }}>
                    ⚠️ You've reached the maximum number of shops for this market
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                disabled={shops.length >= LIMITS.SHOPS_PER_MARKET}
                style={{
                  padding: '10px 20px',
                  backgroundColor: shops.length >= LIMITS.SHOPS_PER_MARKET ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: shops.length >= LIMITS.SHOPS_PER_MARKET ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  opacity: shops.length >= LIMITS.SHOPS_PER_MARKET ? 0.6 : 1
                }}
                title={shops.length >= LIMITS.SHOPS_PER_MARKET ? `Maximum of ${LIMITS.SHOPS_PER_MARKET} shops per market reached` : ''}
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
                      onClick={() => {
                        console.log('Navigating to inventory for shop:', shop.id, shop);
                        navigate(`/shop/${shop.id}/inventory`);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      Manage Inventory
                    </button>
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

      {/* Edit Market Modal */}
      {editingMarket && market && (
        <EditMarketModal
          market={market}
          onClose={() => setEditingMarket(false)}
          onSuccess={() => {
            loadData();
            setEditingMarket(false);
          }}
        />
      )}

      {/* Activate Market Modal */}
      {activatingMarket && market && (
        <ActivateMarketModal
          marketId={market.id}
          marketName={market.name}
          dmId={market.dmId}
          onClose={() => setActivatingMarket(false)}
          onSuccess={() => {
            loadData();
            setActivatingMarket(false);
          }}
        />
      )}
    </>
  );
}
