import { useEffect, useState } from 'react';
import { AuthService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { MarketList } from '../components/MarketList';
import { CreateMarketModal } from '../components/CreateMarketModal';
import { MarketService } from '../services/market.service';

const MARKET_LIMIT = 10;

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

  const handleSignOut = async () => {
    await AuthService.signOut();
    navigate('/auth');
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div>
          <h1 style={{ margin: 0 }}>DM Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: '#666' }}>
            Welcome, {user.displayName || user.email}!
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/settings')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Settings
          </button>
          <button
            onClick={handleSignOut}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

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
          maxLimit={MARKET_LIMIT}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleMarketCreated}
        />
      )}
    </div>
  );
}
