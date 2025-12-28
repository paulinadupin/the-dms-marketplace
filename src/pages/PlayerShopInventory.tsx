import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopService } from '../services/shop.service';
import { ShopItemService } from '../services/shop-item.service';
import { MarketService } from '../services/market.service';
import { SessionStockService } from '../services/session-stock.service';
import type { FirestoreShop, ShopItem, SessionStock } from '../types/firebase';
import { PlayerInventoryMenu } from '../components/PlayerInventoryMenu';
import { PlayerItemDetailModal } from '../components/PlayerItemDetailModal';
import { PurchaseNotification } from '../components/PurchaseNotification';

export function PlayerShopInventory() {
  const { accessCode, shopId } = useParams<{ accessCode: string; shopId: string }>();
  const navigate = useNavigate();

  const [shop, setShop] = useState<FirestoreShop | null>(null);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [sessionStock, setSessionStock] = useState<Map<string, number | null>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ shopItem: ShopItem; itemData: any; currentStock: number | null | undefined } | null>(null);
  const [purchasedItemName, setPurchasedItemName] = useState<string | null>(null);

  useEffect(() => {
    loadShopAndItems();
  }, [shopId]);

  // Monitor market status - kick players out if market is deactivated
  useEffect(() => {
    const checkMarketStatus = async () => {
      if (!accessCode) return;

      try {
        const marketData = await MarketService.getMarketByAccessCode(accessCode);

        if (!marketData || !marketData.isActive) {
          // Market closed or deleted - redirect to summary
          navigate(`/market/${accessCode}/summary`);
          return;
        }

        // Check if market expired
        if (marketData.activeUntil && marketData.activeUntil.toMillis() <= Date.now()) {
          navigate(`/market/${accessCode}/summary`);
        }
      } catch (error) {
        console.error('Error checking market status:', error);
      }
    };

    const interval = setInterval(checkMarketStatus, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, [accessCode, navigate]);

  const loadShopAndItems = async () => {
    if (!shopId || !accessCode) return;

    setLoading(true);
    try {
      // Load shop
      const shopData = await ShopService.getShop(shopId);
      if (!shopData) {
        setLoading(false);
        return;
      }

      setShop(shopData);

      // Load market to get dmId
      const marketData = await MarketService.getMarketByAccessCode(accessCode);
      if (!marketData) {
        setLoading(false);
        return;
      }

      // Load shop items (they contain all item data via customData)
      const items = await ShopItemService.getItemsByShop(shopId);
      setShopItems(items);

      // Load session stock for this market
      const sessionStockData = await SessionStockService.getMarketSessionStock(marketData.id);
      const stockMap = new Map<string, number | null>();
      sessionStockData.forEach((stock: SessionStock) => {
        stockMap.set(stock.shopItemId, stock.currentStock);
      });
      setSessionStock(stockMap);
    } catch (err: any) {
      console.error('Error loading shop:', err);
    } finally {
      setLoading(false);
    }
  };

  const getItemData = (shopItem: ShopItem) => {
    // Use embedded customData (always available for new items, may be null for old items)
    return shopItem.customData || null;
  };

  const canAffordItem = (shopItem: ShopItem): boolean => {
    // Get player's current currency from localStorage
    const playerDataStr = localStorage.getItem(`player_${accessCode}_data`);
    if (!playerDataStr || !shopItem.price) return false;

    const playerData = JSON.parse(playerDataStr);

    // Convert everything to copper for comparison
    const playerCopper = (playerData.gold * 100) + (playerData.silver * 10) + playerData.copper;
    const priceCopper = ((shopItem.price.gp || 0) * 100) + ((shopItem.price.sp || 0) * 10) + (shopItem.price.cp || 0);

    return playerCopper >= priceCopper;
  };

  const isItemInStock = (shopItem: ShopItem): boolean => {
    const currentStock = sessionStock.has(shopItem.id)
      ? sessionStock.get(shopItem.id)
      : shopItem.stock;

    // Unlimited stock (null) is always in stock
    if (currentStock === null) return true;

    return currentStock > 0;
  };

  const canPurchaseItem = (shopItem: ShopItem): boolean => {
    return canAffordItem(shopItem) && isItemInStock(shopItem);
  };

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

  const handleItemClick = (shopItem: ShopItem) => {
    const itemData = getItemData(shopItem);
    if (itemData) {
      const currentStock = sessionStock.has(shopItem.id)
        ? sessionStock.get(shopItem.id)
        : shopItem.stock;
      setSelectedItem({ shopItem, itemData, currentStock });
    }
  };

  const handleBack = () => {
    navigate(`/market/${accessCode}/shops`);
  };

  if (loading) {
    return (
      <div className="player-loading">
        <p>Loading shop...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="player-error">
        <h1>Shop not found</h1>
      </div>
    );
  }

  return (
    <>
      {/* Fixed Header Bar */}
      <div className="player-header-bar">
        <button
          onClick={handleBack}
          className="player-back-button"
          title="Back to Shops"
        >
          ←
        </button>
        <h1 className="player-header-title">{shop.name}</h1>
        <PlayerInventoryMenu accessCode={accessCode!} />
      </div>

      <div className="player-container">
        <div className="player-header">
          {shop.description && <p>{shop.description}</p>}
          {shop.shopkeeper && <p className="player-shop-keeper">👤 Shopkeeper: {shop.shopkeeper}</p>}
        </div>

        <div className="player-items-grid">
          {shopItems.length === 0 ? (
            <div className="player-empty">
              <p>No items available in this shop.</p>
            </div>
          ) : (
            // Sort items: purchasable items first, then unavailable ones
            [...shopItems].sort((a, b) => {
              const canPurchaseA = canPurchaseItem(a);
              const canPurchaseB = canPurchaseItem(b);
              if (canPurchaseA && !canPurchaseB) return -1;
              if (!canPurchaseA && canPurchaseB) return 1;
              return 0;
            }).map((shopItem) => {
              const itemData = getItemData(shopItem);
              if (!itemData) {
                // Fallback for items without customData (old items)
                return (
                  <div key={shopItem.id} className="player-item-card">
                    <div className="player-item-content">
                      <h3 className="player-item-name">Item Data Unavailable</h3>
                      <p className="player-item-price">{formatPrice(shopItem.price)}</p>
                      <p style={{fontSize: '12px', color: '#999'}}>Contact the DM to refresh this item</p>
                    </div>
                  </div>
                );
              }

              // Get key feature based on item type
              let keyFeature = '';
              switch (itemData.type) {
                case 'weapon':
                  if (itemData.damage) {
                    keyFeature = `${itemData.damage.dice} ${itemData.damage.type}`;
                  }
                  break;
                case 'armor':
                  if (itemData.armorClass) {
                    keyFeature = `AC ${itemData.armorClass}`;
                  }
                  break;
                case 'consumable':
                  if (itemData.effect) {
                    keyFeature = itemData.effect;
                  }
                  break;
                case 'magic':
                  if (itemData.rarity) {
                    keyFeature = itemData.rarity;
                  }
                  break;
                case 'tool':
                  if (itemData.toolType) {
                    keyFeature = itemData.toolType;
                  }
                  break;
                // gear and treasure have no key feature
              }

              // Get current session stock for this item
              const currentStock = sessionStock.has(shopItem.id)
                ? sessionStock.get(shopItem.id)
                : shopItem.stock;

              // Check if player can purchase this item
              const canPurchase = canPurchaseItem(shopItem);

              return (
                <div
                  key={shopItem.id}
                  className={`player-item-card ${!canPurchase ? 'player-item-unavailable' : ''}`}
                  onClick={() => handleItemClick(shopItem)}
                >
                  {/* Item Image */}
                  {itemData.imageUrl && (
                    <div className="card-image-container">
                      <img
                        src={itemData.imageUrl}
                        alt={itemData.name}
                        className="card-image"
                        loading="lazy"
                        onError={(e) => {
                          const container = e.currentTarget.parentElement;
                          if (container) container.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <h3>{itemData.name}</h3>
                  <p className="player-item-type">{itemData.type}</p>
                  <p className="player-item-price">{formatPrice(shopItem.price)}</p>
                  <p className="player-item-stock">{formatStock(currentStock)}</p>
                  {keyFeature && (
                    <p className="player-item-feature">{keyFeature}</p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <PlayerItemDetailModal
          shopItem={selectedItem.shopItem}
          itemData={selectedItem.itemData}
          currentStock={selectedItem.currentStock}
          accessCode={accessCode!}
          onClose={() => setSelectedItem(null)}
          onPurchase={(itemName: string) => {
            loadShopAndItems(); // Reload to update stock
            setSelectedItem(null);
            setPurchasedItemName(itemName); // Show notification
          }}
        />
      )}

      {/* Purchase Notification */}
      {purchasedItemName && (
        <PurchaseNotification
          itemName={purchasedItemName}
          onClose={() => setPurchasedItemName(null)}
        />
      )}
    </>
  );
}
