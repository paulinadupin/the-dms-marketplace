import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopService } from '../services/shop.service';
import { ShopItemService } from '../services/shop-item.service';
import { ItemLibraryService } from '../services/item-library.service';
import { MarketService } from '../services/market.service';
import type { FirestoreShop, ShopItem, ItemLibrary } from '../types/firebase';
import { PlayerInventoryMenu } from '../components/PlayerInventoryMenu';
import { PlayerItemDetailModal } from '../components/PlayerItemDetailModal';
import { PurchaseNotification } from '../components/PurchaseNotification';

export function PlayerShopInventory() {
  const { accessCode, shopId } = useParams<{ accessCode: string; shopId: string }>();
  const navigate = useNavigate();

  const [shop, setShop] = useState<FirestoreShop | null>(null);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [libraryItems, setLibraryItems] = useState<ItemLibrary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ shopItem: ShopItem; itemData: any } | null>(null);
  const [purchasedItemName, setPurchasedItemName] = useState<string | null>(null);

  useEffect(() => {
    loadShopAndItems();
  }, [shopId]);

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

      // Load shop items
      const items = await ShopItemService.getItemsByShop(shopId);
      setShopItems(items);

      // Load library items to get full item data using market's dmId
      const library = await ItemLibraryService.getItemsByDM(marketData.dmId);
      setLibraryItems(library);
    } catch (err: any) {
      console.error('Error loading shop:', err);
    } finally {
      setLoading(false);
    }
  };

  const getItemData = (shopItem: ShopItem) => {
    if (shopItem.isIndependent && shopItem.customData) {
      return shopItem.customData;
    }
    const libraryItem = libraryItems.find(item => item.id === shopItem.itemLibraryId);
    return libraryItem?.item;
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
      setSelectedItem({ shopItem, itemData });
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
      {/* Player Inventory Menu */}
      <PlayerInventoryMenu accessCode={accessCode!} />

      {/* Back Button */}
      <button
        onClick={handleBack}
        className="player-back-button"
        title="Back to Shops"
      >
        ←
      </button>

      <div className="player-container">
        <div className="player-header">
          <h1>{shop.name}</h1>
          {shop.description && <p>{shop.description}</p>}
          {shop.shopkeeper && <p className="player-shop-keeper">👤 Shopkeeper: {shop.shopkeeper}</p>}
        </div>

        <div className="player-items-grid">
          {shopItems.length === 0 ? (
            <div className="player-empty">
              <p>No items available in this shop.</p>
            </div>
          ) : (
            shopItems.map((shopItem) => {
              const itemData = getItemData(shopItem);
              if (!itemData) return null;

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

              return (
                <div
                  key={shopItem.id}
                  className="player-item-card"
                  onClick={() => handleItemClick(shopItem)}
                >
                  <h3>{itemData.name}</h3>
                  <p className="player-item-type">{itemData.type}</p>
                  <p className="player-item-price">{formatPrice(shopItem.price)}</p>
                  <p className="player-item-stock">{formatStock(shopItem.stock)}</p>
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
