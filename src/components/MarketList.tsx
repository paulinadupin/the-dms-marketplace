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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    loadMarkets();
  }, [dmId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

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

  const copyAccessCode = (accessCode: string) => {
    navigator.clipboard.writeText(accessCode);
    setToast({ message: 'Access code copied to clipboard!', type: 'success' });
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
      <div className="market-loading">
        Loading markets...
      </div>
    );
  }

  if (error) {
    return (
      <div className="market-error">
        Error loading markets: {error}
      </div>
    );
  }

  // Empty State
  if (markets.length === 0) {
    return (
      <div className="market-empty-state">
        <h2 className="market-empty-title">No Markets Yet</h2>
        <p className="market-empty-text">
          Create your first market to start building shops for your campaign!
        </p>
        <button
          onClick={onCreateMarket}
          className="market-empty-button"
        >
          + Create Your First Market
        </button>
      </div>
    );
  }

  // Market List
  const isAtLimit = markets.length >= LIMITS.MARKETS_PER_DM;

  // Sort markets to show active market first
  const sortedMarkets = [...markets].sort((a, b) => {
    if (a.isActive) return -1;
    if (b.isActive) return 1;
    return 0;
  });

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div>
        <div className="market-list-header">
          <div>
            <h2 className="market-list-title">Your Markets</h2>
            {isAtLimit && (
              <p className="market-limit-warning">
                ⚠️ You've reached the maximum number of markets
              </p>
            )}
          </div>
          <button
            onClick={onCreateMarket}
            disabled={isAtLimit}
            className="btn btn-success btn-create-circle"
            title={isAtLimit ? `Maximum of ${LIMITS.MARKETS_PER_DM} markets reached` : 'Create New Market'}
          >
            +
          </button>
        </div>

        <div className="market-grid">
        {sortedMarkets.map((market) => {
          const isBlocked = !market.isActive && activeMarket && activeMarket.id !== market.id;
          const cardClassName = `market-card ${market.isActive ? 'market-card-active' : ''} ${isBlocked ? 'market-card-blocked' : ''}`;
          return (
          <div
            key={market.id}
            onClick={() => navigate(`/dm/market/${market.id}/shops`)}
            className={cardClassName}
          >
            <div className="market-card-header">
              <div className="market-card-content">
                <div className="market-title-row">
                  {editingMarketNameId === market.id ? (
                    <div className="market-title-edit-form" onClick={(e) => e.stopPropagation()}>
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
                        className="market-title-input"
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
                      className="editable-heading market-title"
                      onClick={(e) => startEditingMarketName(market, e)}
                    >
                      {market.name}
                    </h3>
                  )}
                  <span className={`market-status-badge ${market.isActive ? 'market-status-active' : 'market-status-inactive'}`}>
                    {market.isActive ? `Active (${getTimeRemaining(market.activeUntil)})` : 'Inactive'}
                  </span>
                </div>
                <p className="market-description">{market.description}</p>
                <div className="market-access-code">
                  <span>Access Code: </span>
                  <code
                    onClick={(e) => {
                      e.stopPropagation();
                      copyAccessCode(market.accessCode);
                    }}
                    className="clickable-code"
                    title="Click to copy"
                  >
                    {market.accessCode}
                  </code>
                </div>
              </div>

              {/* Kebab Menu */}
              <div className="market-kebab-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === market.id ? null : market.id);
                  }}
                  className="market-kebab-button"
                  title="More options"
                >
                  ⋮
                </button>

                {openMenuId === market.id && (
                  <div
                    className="market-kebab-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMarket(market);
                        setOpenMenuId(null);
                      }}
                      className="market-kebab-menu-item"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        deleteMarket(market.id, market.name);
                      }}
                      className="market-kebab-menu-item delete"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="market-toggle-section">
              <label className="toggle-switch" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={market.isActive}
                  disabled={!market.isActive && activeMarket && activeMarket.id !== market.id}
                  onChange={(e) => {
                    e.stopPropagation();
                    if (market.isActive) {
                      handleDeactivate(market.id);
                    } else {
                      setActivatingMarket(market);
                    }
                  }}
                  title={
                    !market.isActive && activeMarket && activeMarket.id !== market.id
                      ? "There is already an active market in your account"
                      : market.isActive
                      ? "Deactivate market"
                      : "Activate market"
                  }
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
          );
        })}
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
