import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function PlayerMarketSummary() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();

  const [playerData, setPlayerData] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    loadPlayerData();
  }, [accessCode]);

  const loadPlayerData = () => {
    if (!accessCode) return;

    const playerDataStr = localStorage.getItem(`player_${accessCode}_data`);
    if (playerDataStr) {
      setPlayerData(JSON.parse(playerDataStr));
    }
  };

  const formatCurrency = (gold: number, silver: number, copper: number) => {
    const parts = [];
    if (gold > 0) parts.push(`${gold} GP`);
    if (silver > 0) parts.push(`${silver} SP`);
    if (copper > 0) parts.push(`${copper} CP`);
    return parts.length > 0 ? parts.join(', ') : '0 CP';
  };

  const calculateSpent = () => {
    if (!playerData || !playerData.startingCurrency) return { gold: 0, silver: 0, copper: 0 };

    const startingCopper =
      (playerData.startingCurrency.gold * 100) +
      (playerData.startingCurrency.silver * 10) +
      playerData.startingCurrency.copper;

    const currentCopper =
      (playerData.gold * 100) +
      (playerData.silver * 10) +
      playerData.copper;

    const spentCopper = startingCopper - currentCopper;

    return {
      gold: Math.floor(spentCopper / 100),
      silver: Math.floor((spentCopper % 100) / 10),
      copper: spentCopper % 10
    };
  };

  const handleFinish = () => {
    // Clear player data for this market
    if (accessCode) {
      localStorage.removeItem(`player_${accessCode}_data`);
      localStorage.removeItem(`player_${accessCode}_name`);
    }
    // Navigate to home page
    navigate('/', { replace: true });
  };

  const renderItemProperties = (itemData: any) => {
    const properties: JSX.Element[] = [];

    // Common properties
    if (itemData.rarity) {
      properties.push(<p key="rarity"><strong>Rarity:</strong> {itemData.rarity}</p>);
    }

    // Type-specific properties
    switch (itemData.type) {
      case 'weapon':
        if (itemData.damage) {
          properties.push(
            <p key="damage"><strong>Damage:</strong> {itemData.damage.dice} {itemData.damage.type}</p>
          );
        }
        if (itemData.weaponType) {
          properties.push(<p key="weaponType"><strong>Weapon Type:</strong> {itemData.weaponType}</p>);
        }
        if (itemData.properties && itemData.properties.length > 0) {
          properties.push(
            <p key="properties"><strong>Properties:</strong> {itemData.properties.join(', ')}</p>
          );
        }
        break;

      case 'armor':
        if (itemData.armorClass) {
          properties.push(<p key="ac"><strong>Armor Class:</strong> {itemData.armorClass}</p>);
        }
        if (itemData.armorType) {
          properties.push(<p key="armorType"><strong>Armor Type:</strong> {itemData.armorType}</p>);
        }
        if (itemData.stealthDisadvantage) {
          properties.push(<p key="stealth"><strong>Stealth:</strong> Disadvantage</p>);
        }
        break;

      case 'consumable':
        if (itemData.consumableType) {
          properties.push(<p key="consumableType"><strong>Type:</strong> {itemData.consumableType}</p>);
        }
        if (itemData.duration) {
          properties.push(<p key="duration"><strong>Duration:</strong> {itemData.duration}</p>);
        }
        break;

      case 'magic':
        if (itemData.requiresAttunement) {
          properties.push(<p key="attunement"><strong>Requires Attunement:</strong> Yes</p>);
        }
        if (itemData.charges) {
          properties.push(<p key="charges"><strong>Charges:</strong> {itemData.charges}</p>);
        }
        break;
    }

    if (itemData.weight) {
      properties.push(<p key="weight"><strong>Weight:</strong> {itemData.weight} lbs</p>);
    }

    return properties;
  };

  if (!playerData) {
    return (
      <div className="shopping-summary-container">
        <div className="shopping-summary-card">
          <h1>No Shopping Data Found</h1>
          <button onClick={() => navigate('/')} className="summary-home-button">
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const spent = calculateSpent();
  const inventory = playerData.inventory || [];
  const soldItems = playerData.soldItems || [];

  return (
    <div className="shopping-summary-container">
      <div className="shopping-summary-card">
        <div className="summary-icon">🏪</div>

        <h1 className="summary-title">Market Closed</h1>
        <p className="summary-subtitle">
          Thank you for shopping, {playerData.name}!
        </p>

        <div className="summary-divider" />

        {/* Currency Summary */}
        <div className="summary-section">
          <h2>Currency</h2>
          <div className="summary-currency-grid">
            <div className="summary-currency-item">
              <span className="summary-label">Started With:</span>
              <span className="summary-value">
                {formatCurrency(
                  playerData.startingCurrency?.gold || 0,
                  playerData.startingCurrency?.silver || 0,
                  playerData.startingCurrency?.copper || 0
                )}
              </span>
            </div>
            <div className="summary-currency-item">
              <span className="summary-label">Remaining:</span>
              <span className="summary-value">
                {formatCurrency(playerData.gold, playerData.silver, playerData.copper)}
              </span>
            </div>
            <div className="summary-currency-item highlight">
              <span className="summary-label">Total Spent:</span>
              <span className="summary-value">
                {formatCurrency(spent.gold, spent.silver, spent.copper)}
              </span>
            </div>
          </div>
        </div>

        {/* Purchased Items */}
        {inventory.length > 0 && (
          <>
            <div className="summary-divider" />
            <div className="summary-section">
              <h2>Items Purchased ({inventory.length})</h2>
              <div className="summary-items-list">
                {inventory.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="summary-item clickable"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="summary-item-header">
                      <span className="summary-item-name">{item.name}</span>
                      <span className="summary-item-quantity">x{item.quantity}</span>
                    </div>
                    <div className="summary-item-details">
                      <span className="summary-item-type">{item.type}</span>
                      {item.totalSpent && (
                        <span className="summary-item-cost">
                          Cost: {formatCurrency(
                            item.totalSpent.gp || 0,
                            item.totalSpent.sp || 0,
                            item.totalSpent.cp || 0
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Sold Items */}
        {soldItems.length > 0 && (
          <>
            <div className="summary-divider" />
            <div className="summary-section">
              <h2>Items Sold ({soldItems.length})</h2>
              <div className="summary-items-list">
                {soldItems.map((item: any, index: number) => (
                  <div key={index} className="summary-item sold">
                    <div className="summary-item-header">
                      <span className="summary-item-name">{item.name}</span>
                    </div>
                    <div className="summary-item-details">
                      <span className="summary-item-cost">
                        Sold for: {formatCurrency(
                          item.price?.gp || 0,
                          item.price?.sp || 0,
                          item.price?.cp || 0
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* No Activity */}
        {inventory.length === 0 && soldItems.length === 0 && (
          <>
            <div className="summary-divider" />
            <div className="summary-section">
              <p className="summary-no-activity">No purchases or sales were made.</p>
            </div>
          </>
        )}

        <div className="summary-divider" />

        <button onClick={handleFinish} className="summary-finish-button">
          Finish & Return Home
        </button>

        {/* Item Detail Modal */}
        {selectedItem && selectedItem.details && (
          <div className="player-modal-overlay" onClick={() => setSelectedItem(null)}>
            <div className="player-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="player-modal-close" onClick={() => setSelectedItem(null)}>×</button>

              <h2>{selectedItem.details.name}</h2>
              <p className="player-item-type">{selectedItem.details.type}</p>

              {selectedItem.details.description && (
                <div className="player-modal-section">
                  <h3>Description</h3>
                  <p>{selectedItem.details.description}</p>
                </div>
              )}

              {renderItemProperties(selectedItem.details).length > 0 && (
                <div className="player-modal-section">
                  <h3>Properties</h3>
                  {renderItemProperties(selectedItem.details)}
                </div>
              )}

              <div className="player-modal-section">
                <h3>Purchase Info</h3>
                <p><strong>Quantity:</strong> {selectedItem.quantity}</p>
                {selectedItem.totalSpent && (
                  <p>
                    <strong>Total Spent:</strong>{' '}
                    {formatCurrency(
                      selectedItem.totalSpent.gp || 0,
                      selectedItem.totalSpent.sp || 0,
                      selectedItem.totalSpent.cp || 0
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
