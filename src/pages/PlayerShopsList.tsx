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
    const interval = setInterval(checkExpiration, 3000); // Check every 3 seconds for instant kicks
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

  const checkExpiration = async () => {
    if (!accessCode) return;

    try {
      // Fetch current market status from database
      const marketData = await MarketService.getMarketByAccessCode(accessCode);

      if (!marketData) {
        // Market deleted - redirect to summary
        navigate(`/market/${accessCode}/summary`);
        return;
      }

      // Check if market was deactivated by DM
      if (!marketData.isActive) {
        // Market closed by DM - redirect to summary
        navigate(`/market/${accessCode}/summary`);
        return;
      }

      // Check if market expired due to time limit
      if (marketData.activeUntil) {
        const timeRemaining = marketData.activeUntil.toMillis() - Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        // Show warning if less than 5 minutes remaining
        if (timeRemaining > 0 && timeRemaining <= fiveMinutes && !showExpirationWarning) {
          setShowExpirationWarning(true);
        }

        // Market expired - redirect to summary
        if (timeRemaining <= 0) {
          navigate(`/market/${accessCode}/summary`);
        }
      }
    } catch (error) {
      console.error('Error checking market status:', error);
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
      {/* Fixed Header Bar */}
      <div className="player-header-bar">
        <button
          onClick={() => setShowOverview(true)}
          className="shopping-overview-button"
          title="View Shopping Overview"
        >
        𖠩
        </button>
        <h1 className="player-header-title">{market.name}</h1>
        <PlayerInventoryMenu accessCode={accessCode!} />
      </div>

      {/* Expiration Warning */}
      {showExpirationWarning && (
        <div className="player-expiration-warning">
          ⚠️ The market is closing in 5 minutes! Please start writing down your inventory.
        </div>
      )}

      <div className="player-container">
        <div className="player-header">
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
