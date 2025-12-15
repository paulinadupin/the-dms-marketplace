import { useEffect, useState } from 'react';
import { MarketService } from '../services/market.service';
import type { Market } from '../types/firebase';
import { Toast } from './Toast';
import { EditMarketModal } from './EditMarketModal';
import { ActivateMarketModal } from './ActivateMarketModal';

interface MarketListProps {
  dmId: string;
  onCreateMarket: () => void;
  onMarketDeleted?: () => void;
}

const MARKET_LIMIT = 10;

export function MarketList({ dmId, onCreateMarket, onMarketDeleted }: MarketListProps) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [activatingMarket, setActivatingMarket] = useState<Market | null>(null);
  const [activeMarket, setActiveMarket] = useState<Market | null>(null);

  useEffect(() => {
    loadMarkets();
  }, [dmId]);

  const loadMarkets = async () => {
    setLoading(true);
    setError('');

    try {
      const fetchedMarkets = await MarketService.getMarketsByDM(dmId);
      setMarkets(fetchedMarkets);

      // Get currently active market
      const active = await MarketService.getActiveMarket(dmId);
      setActiveMarket(active);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyShareUrl = (accessCode: string) => {
    const url = MarketService.getShareableURL(accessCode);
    navigator.clipboard.writeText(url);
    setToast({ message: 'Market URL copied to clipboard!', type: 'success' });
  };

  const handleDeactivate = async (marketId: string) => {
    try {
      await MarketService.deactivateMarket(marketId);
      setToast({ message: 'Market deactivated successfully!', type: 'success' });
      loadMarkets(); // Refresh list
    } catch (err: any) {
      setToast({ message: 'Failed to deactivate market: ' + err.message, type: 'error' });
    }
  };

  const getTimeRemaining = (activeUntil: any): string => {
    if (!activeUntil) return '';

    const now = Date.now();
    const expiresAt = activeUntil.toMillis();
    const remaining = expiresAt - now;

    if (remaining <= 0) return 'Expired';

    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const deleteMarket = async (marketId: string, marketName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${marketName}"?\n\n` +
      `⚠️ This will DELETE the market but NOT its shops and items.\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await MarketService.deleteMarket(marketId);
      loadMarkets(); // Refresh list
      onMarketDeleted?.(); // Update count in parent
      setToast({ message: 'Market deleted successfully!', type: 'success' });
    } catch (err: any) {
      setToast({ message: 'Failed to delete market: ' + err.message, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        Loading markets...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '5px'
      }}>
        Error loading markets: {error}
      </div>
    );
  }

  // Empty State
  if (markets.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '60px 20px',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        border: '2px dashed #ddd'
      }}>
        <h2 style={{ marginTop: 0, color: '#666' }}>No Markets Yet</h2>
        <p style={{ color: '#999', marginBottom: '30px' }}>
          Create your first market to start building shops for your campaign!
        </p>
        <button
          onClick={onCreateMarket}
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
          + Create Your First Market
        </button>
      </div>
    );
  }

  // Market List
  const isAtLimit = markets.length >= MARKET_LIMIT;

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h2 style={{ margin: 0 }}>Your Markets ({markets.length}/{MARKET_LIMIT})</h2>
          {isAtLimit && (
            <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#dc3545' }}>
              ⚠️ You've reached the maximum number of markets
            </p>
          )}
        </div>
        <button
          onClick={onCreateMarket}
          disabled={isAtLimit}
          style={{
            padding: '10px 20px',
            backgroundColor: isAtLimit ? '#6c757d' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isAtLimit ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            opacity: isAtLimit ? 0.6 : 1
          }}
          title={isAtLimit ? `Maximum of ${MARKET_LIMIT} markets reached` : ''}
        >
          + Create New Market
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {markets.map((market) => (
          <div
            key={market.id}
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
                  <h3 style={{ margin: 0 }}>{market.name}</h3>
                  <span style={{
                    padding: '3px 8px',
                    fontSize: '12px',
                    borderRadius: '3px',
                    backgroundColor: market.isActive ? '#d4edda' : '#f8d7da',
                    color: market.isActive ? '#155724' : '#721c24',
                    fontWeight: 'bold'
                  }}>
                    {market.isActive ? `Active (${getTimeRemaining(market.activeUntil)})` : 'Inactive'}
                  </span>
                </div>
                <p style={{ margin: '5px 0', color: '#666' }}>{market.description}</p>
                <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#999' }}>
                  Access Code: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 6px', borderRadius: '3px' }}>{market.accessCode}</code>
                </p>
                {!market.isActive && activeMarket && activeMarket.id !== market.id && (
                  <p style={{
                    margin: '10px 0 0 0',
                    fontSize: '13px',
                    color: '#856404',
                    backgroundColor: '#fff3cd',
                    padding: '8px',
                    borderRadius: '4px'
                  }}>
                    ⚠️ Cannot activate: <strong>"{activeMarket.name}"</strong> is currently active
                  </p>
                )}
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
                📋 Copy Share URL
              </button>
              {market.isActive ? (
                // This market is active - show deactivate button
                <button
                  onClick={() => handleDeactivate(market.id)}
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
                  Deactivate
                </button>
              ) : activeMarket && activeMarket.id !== market.id ? (
                // Another market is active - show disabled button with tooltip
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
                  Activate (Blocked)
                </button>
              ) : (
                // No market is active - show activate button
                <button
                  onClick={() => setActivatingMarket(market)}
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
                  Activate
                </button>
              )}
              <button
                onClick={() => setEditingMarket(market)}
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
                Edit
              </button>
              <button
                onClick={() => deleteMarket(market.id, market.name)}
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
    </div>

    {/* Edit Market Modal */}
    {editingMarket && (
      <EditMarketModal
        market={editingMarket}
        onClose={() => setEditingMarket(null)}
        onSuccess={() => {
          loadMarkets(); // Refresh list
          setEditingMarket(null);
        }}
      />
    )}

    {/* Activate Market Modal */}
    {activatingMarket && (
      <ActivateMarketModal
        marketId={activatingMarket.id}
        marketName={activatingMarket.name}
        dmId={dmId}
        onClose={() => setActivatingMarket(null)}
        onSuccess={() => {
          loadMarkets(); // Refresh list
          setActivatingMarket(null);
        }}
      />
    )}
    </>
  );
}
