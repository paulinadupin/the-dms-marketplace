import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { InventoryItemDetailModal } from './InventoryItemDetailModal';

interface ShoppingOverviewModalProps {
  accessCode: string;
  onClose: () => void;
}

export function ShoppingOverviewModal({ accessCode, onClose }: ShoppingOverviewModalProps) {
  const navigate = useNavigate();
  const [playerData, setPlayerData] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    loadPlayerData();
  }, [accessCode]);

  const loadPlayerData = () => {
    const dataStr = localStorage.getItem(`player_${accessCode}_data`);
    if (dataStr) {
      setPlayerData(JSON.parse(dataStr));
    }
  };

  const handleEndSession = () => {
    const confirmed = window.confirm(
      'Are you sure you want to end your shopping session? You will return to the market entry page.'
    );

    if (confirmed) {
      navigate(`/market/${accessCode}`);
    }
  };

  if (!playerData) {
    return null;
  }

  const inventory = playerData.inventory || [];

  return (
    <div className="player-modal-overlay" onClick={onClose}>
      <div className="shopping-overview-modal" onClick={(e) => e.stopPropagation()}>
        <button className="player-modal-close" onClick={onClose}>×</button>

        <h2>Shopping Overview</h2>

        {/* Remaining Currency Section */}
        <div className="shopping-overview-section">
          <h3>Current Currency</h3>
          {playerData.startingCurrency && (
            <p className="shopping-overview-starting-currency">
              Started with: {playerData.startingCurrency.gold || 0} GP, {playerData.startingCurrency.silver || 0} SP, {playerData.startingCurrency.copper || 0} CP
            </p>
          )}
          <div className="shopping-overview-currency">
            <p><strong>{playerData.gold || 0}</strong> Gold</p>
            <p><strong>{playerData.silver || 0}</strong> Silver</p>
            <p><strong>{playerData.copper || 0}</strong> Copper</p>
          </div>
        </div>

        {/* Inventory Section */}
        <div className="shopping-overview-section">
          <h3>Purchased Items</h3>
          {inventory.length === 0 ? (
            <p className="shopping-overview-empty">No items purchased yet.</p>
          ) : (
            <div className="shopping-overview-items">
              {inventory.map((item: any, index: number) => {
                const totalSpent = item.totalSpent || { gp: 0, sp: 0, cp: 0 };
                const spentText = [];
                if (totalSpent.gp > 0) spentText.push(`${totalSpent.gp} GP`);
                if (totalSpent.sp > 0) spentText.push(`${totalSpent.sp} SP`);
                if (totalSpent.cp > 0) spentText.push(`${totalSpent.cp} CP`);
                const displaySpent = spentText.length > 0 ? spentText.join(', ') : 'Free';

                return (
                  <div
                    key={index}
                    className="shopping-overview-item shopping-overview-item-clickable"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="shopping-overview-item-header">
                      <h4>{item.name}</h4>
                      <span className="shopping-overview-quantity">-{displaySpent}</span>
                    </div>
                    <p className="shopping-overview-item-type">{item.type} (×{item.quantity})</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sold Items Section */}
        {playerData.soldItems && playerData.soldItems.length > 0 && (
          <div className="shopping-overview-section">
            <h3>Sold Items</h3>
            <div className="shopping-overview-items">
              {playerData.soldItems.map((item: any, index: number) => (
                <div key={index} className="shopping-overview-item">
                  <div className="shopping-overview-item-header">
                    <h4>{item.name}</h4>
                    <span className="shopping-overview-quantity">
                      +{item.price.gp > 0 && `${item.price.gp}GP`}
                      {item.price.sp > 0 && ` ${item.price.sp}SP`}
                      {item.price.cp > 0 && ` ${item.price.cp}CP`}
                    </span>
                  </div>
                  <p className="shopping-overview-item-type">Sold to merchant</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* End Session Button */}
        <div className="shopping-overview-actions">
          <button
            onClick={handleEndSession}
            className="shopping-overview-end-button"
          >
            End Shopping Session
          </button>
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <InventoryItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}
