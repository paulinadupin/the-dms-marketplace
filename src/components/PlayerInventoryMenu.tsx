import { useState, useRef, useEffect } from 'react';
import { SellItemModal } from './SellItemModal';
import { InventoryItemDetailModal } from './InventoryItemDetailModal';

interface PlayerInventoryMenuProps {
  accessCode: string;
  onInventoryChange?: () => void;
}

export function PlayerInventoryMenu({ accessCode, onInventoryChange }: PlayerInventoryMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playerData, setPlayerData] = useState<any>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPlayerData();
  }, [accessCode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadPlayerData = () => {
    const dataStr = localStorage.getItem(`player_${accessCode}_data`);
    if (dataStr) {
      setPlayerData(JSON.parse(dataStr));
    }
  };

  // Reload data when menu opens to get latest
  const handleToggle = () => {
    if (!isOpen) {
      loadPlayerData();
    }
    setIsOpen(!isOpen);
  };

  if (!playerData) {
    return null;
  }

  return (
    <div ref={menuRef} className="player-inventory-menu">
      {/* Hamburger Button */}
      <button
        onClick={handleToggle}
        className="hamburger-button"
        title="View Your Inventory"
      >
        <div />
        <div />
        <div />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="player-inventory-panel">
          {/* Sell Item Button - Top right of dropdown */}
          <button
            onClick={() => {
              setShowSellModal(true);
              setIsOpen(false);
            }}
            className="player-sell-item-button-dropdown"
            title="Sell an Item"
          >
            Sell Item
          </button>

          <h3>Your Inventory</h3>

          {/* Currency */}
          <div className="player-inventory-section">
            <h4>Currency</h4>
            <p>Gold: {playerData.gold || 0} GP</p>
            <p>Silver: {playerData.silver || 0} SP</p>
            <p>Copper: {playerData.copper || 0} CP</p>
          </div>

          {/* Purchased Items */}
          <div className="player-inventory-section">
            <h4>Purchased Items</h4>
            {playerData.inventory && playerData.inventory.length > 0 ? (
              <div className="player-inventory-items-grid">
                {playerData.inventory.map((item: any, index: number) => {
                  const totalSpent = item.totalSpent || { gp: 0, sp: 0, cp: 0 };
                  const spentText = [];
                  if (totalSpent.gp > 0) spentText.push(`${totalSpent.gp} GP`);
                  if (totalSpent.sp > 0) spentText.push(`${totalSpent.sp} SP`);
                  if (totalSpent.cp > 0) spentText.push(`${totalSpent.cp} CP`);
                  const displaySpent = spentText.length > 0 ? `-${spentText.join(', ')}` : 'Free';

                  return (
                    <div
                      key={index}
                      className="player-inventory-item-card"
                      onClick={() => {
                        setSelectedItem(item);
                        setIsOpen(false);
                      }}
                    >
                      <strong>{item.name}</strong>
                      <p className="player-inventory-item-type">{item.type} (×{item.quantity})</p>
                      <p className="player-inventory-item-spent">{displaySpent}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="player-inventory-empty">No items yet</p>
            )}
          </div>

          {/* Sold Items */}
          {playerData.soldItems && playerData.soldItems.length > 0 && (
            <div className="player-inventory-section">
              <h4>Sold Items</h4>
              <ul className="player-inventory-items">
                {playerData.soldItems.map((item: any, index: number) => (
                  <li key={index}>
                    <strong>{item.name}</strong> - Sold for{' '}
                    {item.price.gp > 0 && `${item.price.gp} GP`}
                    {item.price.sp > 0 && ` ${item.price.sp} SP`}
                    {item.price.cp > 0 && ` ${item.price.cp} CP`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="player-inventory-hint">
            💡 Write this down on your character sheet!
          </div>
        </div>
      )}

      {/* Sell Item Modal */}
      {showSellModal && (
        <SellItemModal
          accessCode={accessCode}
          onClose={() => setShowSellModal(false)}
          onSell={() => {
            loadPlayerData();
            setShowSellModal(false);
            onInventoryChange?.(); // Notify parent to refresh shop inventory
          }}
        />
      )}

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
