import { useState } from 'react';

interface SellItemModalProps {
  accessCode: string;
  onClose: () => void;
  onSell: () => void;
}

export function SellItemModal({ accessCode, onClose, onSell }: SellItemModalProps) {
  const [itemName, setItemName] = useState('');
  const [gold, setGold] = useState('');
  const [silver, setSilver] = useState('');
  const [copper, setCopper] = useState('');

  const handleSell = () => {
    if (!itemName.trim()) {
      alert('Please enter an item name');
      return;
    }

    const salePrice = {
      gp: parseInt(gold) || 0,
      sp: parseInt(silver) || 0,
      cp: parseInt(copper) || 0
    };

    // Check if at least some price was entered
    if (salePrice.gp === 0 && salePrice.sp === 0 && salePrice.cp === 0) {
      alert('Please enter a sale price');
      return;
    }

    // Get player data
    const playerDataStr = localStorage.getItem(`player_${accessCode}_data`);
    if (!playerDataStr) return;

    const playerData = JSON.parse(playerDataStr);

    // Add sale price to player's currency
    playerData.gold = (playerData.gold || 0) + salePrice.gp;
    playerData.silver = (playerData.silver || 0) + salePrice.sp;
    playerData.copper = (playerData.copper || 0) + salePrice.cp;

    // Add to sold items list
    const soldItems = playerData.soldItems || [];
    soldItems.push({
      name: itemName.trim(),
      price: salePrice
    });
    playerData.soldItems = soldItems;

    // Save to localStorage
    localStorage.setItem(`player_${accessCode}_data`, JSON.stringify(playerData));

    onSell();
  };

  return (
    <div className="player-modal-overlay" onClick={onClose}>
      <div className="sell-item-modal" onClick={(e) => e.stopPropagation()}>
        <button className="player-modal-close" onClick={onClose}>×</button>

        <h2>Sell an Item</h2>
        <p className="sell-item-description">
          Track items you've sold to NPCs or other players. This will add money to your currency.
        </p>

        <div className="sell-item-form">
          <div className="sell-item-input-group">
            <label htmlFor="itemName">Item Name</label>
            <input
              id="itemName"
              type="text"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g., Longsword"
              className="sell-item-input"
            />
          </div>

          <div className="sell-item-price-section">
            <label>Sale Price</label>
            <div className="sell-item-currency-inputs">
              <div className="sell-item-currency-group">
                <label htmlFor="gold">Gold</label>
                <input
                  id="gold"
                  type="number"
                  min="0"
                  value={gold}
                  onChange={(e) => setGold(e.target.value)}
                  placeholder="0"
                  className="sell-item-currency-input"
                />
              </div>
              <div className="sell-item-currency-group">
                <label htmlFor="silver">Silver</label>
                <input
                  id="silver"
                  type="number"
                  min="0"
                  value={silver}
                  onChange={(e) => setSilver(e.target.value)}
                  placeholder="0"
                  className="sell-item-currency-input"
                />
              </div>
              <div className="sell-item-currency-group">
                <label htmlFor="copper">Copper</label>
                <input
                  id="copper"
                  type="number"
                  min="0"
                  value={copper}
                  onChange={(e) => setCopper(e.target.value)}
                  placeholder="0"
                  className="sell-item-currency-input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="sell-item-actions">
          <button onClick={onClose} className="sell-item-cancel-button">
            Cancel
          </button>
          <button onClick={handleSell} className="sell-item-confirm-button">
            Confirm Sale
          </button>
        </div>
      </div>
    </div>
  );
}
