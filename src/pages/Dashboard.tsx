import { useEffect, useState } from 'react';
import { AuthService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { MarketList } from '../components/MarketList';
import { CreateMarketModal } from '../components/CreateMarketModal';
import { MarketService } from '../services/market.service';
import { LIMITS } from '../config/limits';
import { HamburgerMenu } from '../components/HamburgerMenu';

export function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [marketCount, setMarketCount] = useState(0);

  useEffect(() => {
    // Listen for auth state changes (handles persistence)
    const unsubscribe = AuthService.onAuthStateChange((authUser) => {
      if (!authUser) {
        navigate('/auth');
        return;
      }

      setUser(authUser);
      loadMarketCount(authUser.uid);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [navigate]);

  const loadMarketCount = async (dmId: string) => {
    try {
      const markets = await MarketService.getMarketsByDM(dmId);
      setMarketCount(markets.length);
    } catch (error) {
      console.error('Failed to load market count:', error);
    }
  };

  const handleMarketCreated = () => {
    setRefreshKey(prev => prev + 1); // Trigger refresh
    if (user) loadMarketCount(user.uid); // Update count
  };

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      {/* Hamburger Menu */}
      <HamburgerMenu />

      {/* Header */}
      <div className="page-header-fullwidth">
        <div className="page-header-content">
          <h1>DM Dashboard</h1>
          <p>Welcome, {user.displayName || user.email}!</p>
        </div>
      </div>

      {/* Content */}
      <div className="page-container">
        {/* Market List */}
        <MarketList
          key={refreshKey}
          dmId={user.uid}
          onCreateMarket={() => setShowCreateModal(true)}
          onMarketDeleted={() => loadMarketCount(user.uid)}
        />

        {/* Create Market Modal */}
        {showCreateModal && (
          <CreateMarketModal
            dmId={user.uid}
            currentCount={marketCount}
            maxLimit={LIMITS.MARKETS_PER_DM}
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleMarketCreated}
          />
        )}
      </div>
    </>
  );
}
