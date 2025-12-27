import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MarketService } from '../services/market.service';
import type { Market } from '../types/firebase';

export function PlayerNameEntry() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();

  const [playerName, setPlayerName] = useState('');
  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarket();
  }, [accessCode]);

  const loadMarket = async () => {
    if (!accessCode) {
      navigate('/', { state: { error: 'Invalid access code. Please enter a valid code and try again.' } });
      return;
    }

    try {
      const marketData = await MarketService.getMarketByAccessCode(accessCode);

      if (!marketData) {
        navigate('/', { state: { error: 'Market not found. Please check your access code and try again.' } });
        return;
      }

      // Check if market is active
      if (!marketData.isActive) {
        navigate('/', { state: { error: 'This market is currently closed. Please try again later.' } });
        return;
      }

      // Check if market has expired
      if (marketData.activeUntil && marketData.activeUntil.toMillis() <= Date.now()) {
        navigate('/', { state: { error: 'This market has expired. Please try again later.' } });
        return;
      }

      setMarket(marketData);
      setLoading(false);
    } catch (err: any) {
      navigate('/', { state: { error: 'Failed to load market. Please check your access code and try again.' } });
    }
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || !accessCode) return;

    // Store player name in localStorage
    localStorage.setItem(`player_${accessCode}_name`, playerName.trim());

    // Navigate to the market entry page (currency input)
    navigate(`/market/${accessCode}`);
  };

  if (loading || !market) {
    return (
      <div className="player-loading">
        <p>Loading market...</p>
      </div>
    );
  }

  return (
    <div className="player-entry-container">
      <div className="player-entry-card" style={{ maxWidth: '600px' }}>

        <h1 className="player-market-title">
          {market.name}
        </h1>

        {market.description && (
          <p className="player-market-description">
            {market.description}
          </p>
        )}

        <div className="divider" />

        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
          Welcome, Adventurer!
        </h2>

        <p className="text-secondary text-description">
          Before entering the marketplace, please tell us your name
        </p>

        <form onSubmit={handleContinue} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group-lg">
            <label className="form-label" style={{ textAlign: 'left' }}>
              Player Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your character name"
              autoFocus
              maxLength={30}
              className="form-input"
              style={{ padding: '1rem 1.5rem', fontSize: '1.1rem' }}
            />
          </div>

          <button
            type="submit"
            disabled={!playerName.trim()}
            className="player-enter-button"
            style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
          >
            Continue to Market
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border-light)' }}>
          <button
            onClick={() => navigate('/')}
            className="btn btn-outline"
            style={{ fontSize: '0.9rem' }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
