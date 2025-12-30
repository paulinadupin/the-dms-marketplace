import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarketService } from '../services/market.service';
import { PlayerSessionService } from '../services/player-session.service';
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
  const [expandedActivityMarketId, setExpandedActivityMarketId] = useState<string | null>(null);
  const [playerSessions, setPlayerSessions] = useState<Map<string, any[]>>(new Map());

  useEffect(() => {
    loadMarkets();
  }, [dmId]);

  // Subscribe to player sessions for expanded market
  useEffect(() => {
    if (!expandedActivityMarketId) return;

    const unsubscribe = PlayerSessionService.subscribeToMarketSessions(
      expandedActivityMarketId,
      (sessions) => {
        setPlayerSessions(prev => new Map(prev).set(expandedActivityMarketId, sessions));
      }
    );

    return () => unsubscribe();
  }, [expandedActivityMarketId]);

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

      // Clear player sessions from state
      setPlayerSessions(prev => {
        const newMap = new Map(prev);
        newMap.delete(marketId);
        return newMap;
      });

      // Close dropdown if this market was expanded
      if (expandedActivityMarketId === marketId) {
        setExpandedActivityMarketId(null);
      }

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
      <div className="loading-container">
        Loading markets...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading markets</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Empty State
  if (markets.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Markets Yet</h2>
        <p>
          Create your first market to start building shops for your campaign!
        </p>
        <button
          onClick={onCreateMarket}
          className="btn btn-success btn-lg"
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
        <div className="controls-container">
          <div>
            <h2 style={{ margin: 0 }}>Your Markets</h2>
            {isAtLimit && (
              <p className="text-danger">
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

        <div className="grid-container">
        {sortedMarkets.map((market) => {
          const isBlocked = !market.isActive && activeMarket && activeMarket.id !== market.id;
          const isExpanded = expandedActivityMarketId === market.id;
          const cardClassName = `card card-clickable ${market.isActive ? 'market-card-active' : ''} ${isBlocked ? 'market-card-blocked' : ''} ${isExpanded ? 'market-card-expanded' : ''}`;
          return (
          <div
            key={market.id}
            onClick={() => navigate(`/dm/market/${market.id}/shops`)}
            className={cardClassName}
          >
            <div className="market-card-main-content">
            <div className="card-header">
              <div className="card-body">
                <div className="badge-container">
                  {editingMarketNameId === market.id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }} onClick={(e) => e.stopPropagation()}>
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
                          border: '2px solid var(--color-button-primary)',
                          borderRadius: '4px',
                          width: '300px'
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
                      className="editable-heading card-title"
                      onClick={(e) => startEditingMarketName(market, e)}
                    >
                      {market.name}
                    </h3>
                  )}
                  <span className={`badge ${market.isActive ? 'badge-success' : 'badge-secondary'}`}>
                    {market.isActive ? `Active (${getTimeRemaining(market.activeUntil)})` : 'Inactive'}
                  </span>
                </div>
                <p className="card-description">{market.description}</p>
                <div className="item-details">
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
              <div className="kebab-menu-container">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === market.id ? null : market.id);
                  }}
                  className="kebab-button"
                  title="More options"
                >
                  ⋮
                </button>

                {openMenuId === market.id && (
                  <div
                    className="dropdown-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingMarket(market);
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
                        deleteMarket(market.id, market.name);
                      }}
                      className="dropdown-item dropdown-item-danger"
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

              {market.isActive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedActivityMarketId(
                      expandedActivityMarketId === market.id ? null : market.id
                    );
                  }}
                  className="market-activity-toggle"
                  title="Toggle player activity"
                >
                  <span className={`market-activity-triangle ${expandedActivityMarketId === market.id ? 'expanded' : ''}`}>
                    ▼
                  </span>
                  Player Activity
                </button>
              )}
            </div>
            </div>

            {/* Player Activity Dropdown */}
            {market.isActive && expandedActivityMarketId === market.id && (
              <div className="market-activity-dropdown" onClick={(e) => e.stopPropagation()}>
                {(() => {
                  const sessions = playerSessions.get(market.id) || [];

                  if (sessions.length === 0) {
                    return (
                      <div className="player-activity-empty">
                        <p>No players have entered this market yet.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="player-activity-list">
                      {sessions.map((session) => (
                        <div key={session.id} className="player-activity-item">
                          <div className="player-activity-header">
                            <div className="player-name">
                              👤 {session.playerName}
                            </div>
                            <div className="player-time">
                              Entered: {(() => {
                                if (!session.enteredAt) return '';
                                const date = session.enteredAt.toDate();
                                return date.toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              })()}
                            </div>
                          </div>
                          <div className="player-transactions">
                            <strong>Activity:</strong>{' '}
                            <span className="transaction-text">
                              {PlayerSessionService.formatTransactions(session.transactions)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
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
