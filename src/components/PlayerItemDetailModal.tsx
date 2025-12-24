import { useState } from 'react';
import { SessionStockService } from '../services/session-stock.service';
import { PlayerSessionService } from '../services/player-session.service';
import type { ShopItem } from '../types/firebase';

interface PlayerItemDetailModalProps {
  shopItem: ShopItem;
  itemData: any;
  currentStock: number | null | undefined;
  accessCode: string;
  onClose: () => void;
  onPurchase: (itemName: string) => void;
}

export function PlayerItemDetailModal({
  shopItem,
  itemData,
  currentStock,
  accessCode,
  onClose,
  onPurchase
}: PlayerItemDetailModalProps) {
  const [purchasing, setPurchasing] = useState(false);

  // Check if item is out of stock
  const isOutOfStock = currentStock !== null && currentStock !== undefined && currentStock <= 0;

  const formatPrice = (price: any) => {
    if (!price) return 'Free';
    const parts = [];
    if (price.gp > 0) parts.push(`${price.gp} GP`);
    if (price.sp > 0) parts.push(`${price.sp} SP`);
    if (price.cp > 0) parts.push(`${price.cp} CP`);
    return parts.length > 0 ? parts.join(', ') : 'Free';
  };

  const formatStock = (stock: number | null) => {
    if (stock === null) return 'Unlimited';
    return `${stock} in stock`;
  };

  const canAfford = () => {
    // Get player's current currency from localStorage
    const playerDataStr = localStorage.getItem(`player_${accessCode}_data`);
    if (!playerDataStr || !shopItem.price) return false;

    const playerData = JSON.parse(playerDataStr);

    // Convert everything to copper for comparison
    const playerCopper = (playerData.gold * 100) + (playerData.silver * 10) + playerData.copper;
    const priceCopper = ((shopItem.price.gp || 0) * 100) + ((shopItem.price.sp || 0) * 10) + (shopItem.price.cp || 0);

    return playerCopper >= priceCopper;
  };

  const handlePurchase = async () => {
    // Double check stock before purchasing
    if (isOutOfStock) {
      alert('This item is out of stock');
      return;
    }

    setPurchasing(true);
    try {
      // Get player data from localStorage
      const playerDataStr = localStorage.getItem(`player_${accessCode}_data`);
      if (!playerDataStr) {
        alert('Error: Player data not found');
        setPurchasing(false);
        return;
      }

      const playerData = JSON.parse(playerDataStr);

      // Calculate total price in copper
      const priceInCopper = ((shopItem.price?.gp || 0) * 100) +
                           ((shopItem.price?.sp || 0) * 10) +
                           (shopItem.price?.cp || 0);

      // Calculate player's total currency in copper
      const playerCopperTotal = (playerData.gold * 100) +
                                (playerData.silver * 10) +
                                playerData.copper;

      // Deduct price
      const remainingCopper = playerCopperTotal - priceInCopper;

      // Convert back to GP/SP/CP
      const newGold = Math.floor(remainingCopper / 100);
      const newSilver = Math.floor((remainingCopper % 100) / 10);
      const newCopper = remainingCopper % 10;

      // Add item to inventory with full details
      const inventory = playerData.inventory || [];
      const existingItemIndex = inventory.findIndex((item: any) => item.name === itemData.name);

      if (existingItemIndex >= 0) {
        // Item exists, increase quantity and add to total spent
        inventory[existingItemIndex].quantity += 1;
        const existingSpent = inventory[existingItemIndex].totalSpent || { gp: 0, sp: 0, cp: 0 };
        inventory[existingItemIndex].totalSpent = {
          gp: (existingSpent.gp || 0) + (shopItem.price?.gp || 0),
          sp: (existingSpent.sp || 0) + (shopItem.price?.sp || 0),
          cp: (existingSpent.cp || 0) + (shopItem.price?.cp || 0)
        };
      } else {
        // New item, add to inventory with full data
        inventory.push({
          name: itemData.name,
          type: itemData.type,
          quantity: 1,
          details: itemData, // Store full item details
          totalSpent: {
            gp: shopItem.price?.gp || 0,
            sp: shopItem.price?.sp || 0,
            cp: shopItem.price?.cp || 0
          }
        });
      }

      // Update player data
      playerData.gold = newGold;
      playerData.silver = newSilver;
      playerData.copper = newCopper;
      playerData.inventory = inventory;

      // Save to localStorage
      localStorage.setItem(`player_${accessCode}_data`, JSON.stringify(playerData));

      // Update session stock in Firestore (if not unlimited)
      if (shopItem.stock !== null) {
        await SessionStockService.decreaseStock(shopItem.marketId, shopItem.id, 1);
      }

      // Log transaction for DM tracking
      if (playerData.sessionId) {
        try {
          await PlayerSessionService.addTransaction(
            playerData.sessionId,
            'buy',
            itemData.name,
            1
          );
        } catch (err) {
          console.error('Failed to log transaction:', err);
          // Don't fail the purchase if transaction logging fails
        }
      }

      // Show success notification and reload
      onPurchase(itemData.name); // This will reload the shop inventory and show notification
    } catch (err: any) {
      console.error('Purchase error:', err);
      alert('Failed to purchase item: ' + err.message);
    } finally {
      setPurchasing(false);
    }
  };

  // Render item properties based on type
  const renderItemProperties = () => {
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

  return (
    <div className="player-modal-overlay" onClick={onClose}>
      <div className="player-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="player-modal-close" onClick={onClose}>×</button>

        <h2>{itemData.name}</h2>
        <p className="player-item-type">{itemData.type}</p>

        <div className="player-modal-section">
          <h3>Price & Availability</h3>
          <p><strong>Price:</strong> {formatPrice(shopItem.price)}</p>
          <p><strong>Stock:</strong> {formatStock(shopItem.stock)}</p>
        </div>

        {itemData.description && (
          <div className="player-modal-section">
            <h3>Description</h3>
            <p>{itemData.description}</p>
          </div>
        )}

        {renderItemProperties().length > 0 && (
          <div className="player-modal-section">
            <h3>Properties</h3>
            {renderItemProperties()}
          </div>
        )}

        <div className="player-modal-actions">
          <button
            onClick={handlePurchase}
            disabled={purchasing || !canAfford() || isOutOfStock}
            className="player-purchase-button"
            title={isOutOfStock ? "Out of stock" : !canAfford() ? "You don't have enough money" : "Purchase this item"}
          >
            {purchasing ? "Purchasing..." : isOutOfStock ? "Out of Stock" : !canAfford() ? "Can't Afford" : "Purchase Item"}
          </button>
        </div>
      </div>
    </div>
  );
}
