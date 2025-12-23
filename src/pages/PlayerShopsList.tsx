import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MarketService } from '../services/market.service';
import { ShopService } from '../services/shop.service';
import type { Market, FirestoreShop } from '../types/firebase';
import { PlayerInventoryMenu } from '../components/PlayerInventoryMenu';
import { ShoppingOverviewModal } from '../components/ShoppingOverviewModal';

export function PlayerShopsList() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();

  const [market, setMarket] = useState<Market | null>(null);
  const [shops, setShops] = useState<FirestoreShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExpirationWarning, setShowExpirationWarning] = useState(false);
  const [showOverview, setShowOverview] = useState(false);

  useEffect(() => {
    loadMarketAndShops();
    const interval = setInterval(checkExpiration, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [accessCode]);

  const loadMarketAndShops = async () => {
    if (!accessCode) {
      setError('Invalid market link');
      setLoading(false);
      return;
    }

    try {
      const marketData = await MarketService.getMarketByAccessCode(accessCode);

      if (!marketData) {
        setError('This Market is Closed');
        setLoading(false);
        return;
      }

      // Check if market is active and not expired
      if (!marketData.isActive || (marketData.activeUntil && marketData.activeUntil.toMillis() <= Date.now())) {
        // Market expired - show inventory summary
        navigate(`/market/${accessCode}/summary`);
        return;
      }

      setMarket(marketData);

      // Load shops
      const shopsData = await ShopService.getShopsByMarket(marketData.id);
      setShops(shopsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load market');
    } finally {
      setLoading(false);
    }
  };

  const checkExpiration = () => {
    if (!market || !market.activeUntil) return;

    const timeRemaining = market.activeUntil.toMillis() - Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // Show warning if less than 5 minutes remaining
    if (timeRemaining > 0 && timeRemaining <= fiveMinutes && !showExpirationWarning) {
      setShowExpirationWarning(true);
    }

    // Market expired - redirect to summary
    if (timeRemaining <= 0) {
      navigate(`/market/${accessCode}/summary`);
    }
  };

  const handleShopClick = (shopId: string) => {
    navigate(`/market/${accessCode}/shop/${shopId}`);
  };

  if (loading) {
    return (
      <div className="player-loading">
        <p>Loading shops...</p>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="player-error">
        <h1>{error || 'This Market is Closed'}</h1>
      </div>
    );
  }

  return (
    <>
      {/* Player Inventory Menu */}
      <PlayerInventoryMenu accessCode={accessCode!} />

      {/* Shopping Overview Button */}
      <button
        onClick={() => setShowOverview(true)}
        className="shopping-overview-button"
        title="View Shopping Overview"
      >
        Shopping Overview
      </button>

      {/* Expiration Warning */}
      {showExpirationWarning && (
        <div className="player-expiration-warning">
          ⚠️ The market is closing in 5 minutes! Please start writing down your inventory.
        </div>
      )}

      <div className="player-container">
        <div className="player-header">
          <h1>{market.name}</h1>
          {market.description && <p>{market.description}</p>}
        </div>

        <div className="player-shops-grid">
          {shops.length === 0 ? (
            <div className="player-empty">
              <p>No shops available in this market yet.</p>
            </div>
          ) : (
            shops.map((shop) => (
              <div
                key={shop.id}
                className="player-shop-card"
                onClick={() => handleShopClick(shop.id)}
              >
                <h2>{shop.name}</h2>
                {shop.category && (
                  <p className="player-shop-category">{shop.category}</p>
                )}
                {shop.description && (
                  <p className="player-shop-description">{shop.description}</p>
                )}
                {shop.location && (
                  <p className="player-shop-location">📍 {shop.location}</p>
                )}
                {shop.shopkeeper && (
                  <p className="player-shop-keeper">👤 {shop.shopkeeper}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shopping Overview Modal */}
      {showOverview && (
        <ShoppingOverviewModal
          accessCode={accessCode!}
          onClose={() => setShowOverview(false)}
        />
      )}
    </>
  );
}
