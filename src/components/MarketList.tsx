import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketService } from '../services/market.service';
import type { Market } from '../types/firebase';
import { Toast } from './Toast';
import { EditMarketModal } from './EditMarketModal';
import { ActivateMarketModal } from './ActivateMarketModal';
import { LIMITS } from '../config/limits';

interface MarketListProps {
  dmId: string;
  onCreateMarket: () => void;
  onMarketDeleted?: () => void;
}

export function MarketList({ dmId, onCreateMarket, onMarketDeleted }: MarketListProps) {
  const navigate = useNavigate();
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [activatingMarket, setActivatingMarket] = useState<Market | null>(null);
  const [activeMarket, setActiveMarket] = useState<Market | null>(null);
  const [editingMarketNameId, setEditingMarketNameId] = useState<string | null>(null);
  const [marketNameForm, setMarketNameForm] = useState('');

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
      `⚠️ This will permanently DELETE:\n` +
      `- The market\n` +
      `- All shops in this market\n\n` +
      `✓ Items will be kept in your library for reuse\n\n` +
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

  const startEditingMarketName = (market: Market, e: React.MouseEvent) => {
    e.stopPropagation();
    setMarketNameForm(market.name);
    setEditingMarketNameId(market.id);
  };

  const cancelEditingMarketName = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMarketNameId(null);
    setMarketNameForm('');
  };

  const saveMarketName = async (marketId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!marketNameForm.trim()) {
      setToast({ message: 'Market name cannot be empty', type: 'error' });
      return;
    }

    try {
      await MarketService.updateMarket(marketId, { name: marketNameForm.trim() });
      setToast({ message: 'Market name updated!', type: 'success' });
      setEditingMarketNameId(null);
      setMarketNameForm('');
      loadMarkets();
    } catch (err: any) {
      setToast({ message: 'Failed to update market name: ' + err.message, type: 'error' });
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
  const isAtLimit = markets.length >= LIMITS.MARKETS_PER_DM;

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
          <h2 style={{ margin: 0 }}>Your Markets ({markets.length}/{LIMITS.MARKETS_PER_DM})</h2>
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
          title={isAtLimit ? `Maximum of ${LIMITS.MARKETS_PER_DM} markets reached` : ''}
        >
          + Create New Market
        </button>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {markets.map((market) => (
          <div
            key={market.id}
            onClick={() => navigate(`/dm/market/${market.id}/shops`)}
            style={{
              padding: '20px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  {editingMarketNameId === market.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={marketNameForm}
                        onChange={(e) => setMarketNameForm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveMarketName(market.id, e as any);
                          } else if (e.key === 'Escape') {
                            cancelEditingMarketName(e as any);
                          }
                        }}
                        autoFocus
                        style={{
                          fontSize: '1.17em',
                          fontWeight: 'bold',
                          padding: '4px 8px',
                          border: '2px solid #007bff',
                          borderRadius: '4px',
                          minWidth: '200px'
                        }}
                      />
                      <button
                        onClick={(e) => saveMarketName(market.id, e)}
                        className="btn btn-sm btn-success"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditingMarketName}
                        className="btn btn-sm btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <h3
                      className="editable-heading"
                      style={{ margin: 0 }}
                      onClick={(e) => startEditingMarketName(market, e)}
                    >
                      {market.name}
                    </h3>
                  )}
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
              {market.isActive ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeactivate(market.id);
                  }}
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
                <button
                  disabled
                  onClick={(e) => e.stopPropagation()}
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivatingMarket(market);
                  }}
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
                onClick={(e) => {
                  e.stopPropagation();
                  copyShareUrl(market.accessCode);
                }}
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
