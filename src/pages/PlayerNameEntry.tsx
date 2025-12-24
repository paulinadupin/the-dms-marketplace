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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMarket();
  }, [accessCode]);

  const loadMarket = async () => {
    if (!accessCode) {
      setError('Invalid access code');
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

      // Check if market is active
      if (!marketData.isActive) {
        setError('This Market is Closed');
        setLoading(false);
        return;
      }

      // Check if market has expired
      if (marketData.activeUntil && marketData.activeUntil.toMillis() <= Date.now()) {
        setError('This Market is Closed');
        setLoading(false);
        return;
      }

      setMarket(marketData);
    } catch (err: any) {
      setError(err.message || 'Failed to load market');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="player-loading">
        <p>Loading market...</p>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="player-entry-error-container">
        <div>
          <h1 className="player-entry-error-title">{error || 'This Market is Closed'}</h1>
          <p className="player-entry-error-text">Please check your access code and try again.</p>
          <button
            onClick={() => navigate('/')}
            className="player-entry-error-button"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="player-entry-container">
      <div className="player-entry-card">
        <h1 className="player-entry-market-title">
          {market.name}
        </h1>

        {market.description && (
          <p className="player-entry-market-description">
            {market.description}
          </p>
        )}

        <div className="player-entry-divider" />

        <h2 className="player-entry-welcome-title">
          Welcome, Adventurer!
        </h2>

        <p className="player-entry-welcome-text">
          Before entering the marketplace, please tell us your name
        </p>

        <form onSubmit={handleContinue} className="player-entry-form">
          <div>
            <label className="player-entry-input-label">
              Player Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your character name"
              autoFocus
              maxLength={30}
              className="player-entry-input"
            />
          </div>

          {/* Avatar Selection - Placeholder for future feature */}
          <div className="player-entry-avatar-placeholder">
            <p className="player-entry-avatar-text">
              🎨 Avatar selection coming soon!
            </p>
          </div>

          <button
            type="submit"
            disabled={!playerName.trim()}
            className="player-entry-submit-button"
          >
            Continue to Market
          </button>
        </form>

        <div className="player-entry-footer">
          <button
            onClick={() => navigate('/')}
            className="player-entry-back-button"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
