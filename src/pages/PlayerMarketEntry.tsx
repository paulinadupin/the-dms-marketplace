import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MarketService } from '../services/market.service';
import type { Market } from '../types/firebase';

export function PlayerMarketEntry() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();

  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Currency inputs
  const [gold, setGold] = useState('0');
  const [silver, setSilver] = useState('0');
  const [copper, setCopper] = useState('0');

  useEffect(() => {
    loadMarket();
  }, [accessCode]);

  const loadMarket = async () => {
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

  const handleEnterMarket = () => {
    if (!market || !accessCode) return;

    const startingGold = parseInt(gold) || 0;
    const startingSilver = parseInt(silver) || 0;
    const startingCopper = parseInt(copper) || 0;

    // Get player name from localStorage
    const playerName = localStorage.getItem(`player_${accessCode}_name`) || 'Adventurer';

    // Save player's starting currency to localStorage
    const playerData = {
      name: playerName,
      gold: startingGold,
      silver: startingSilver,
      copper: startingCopper,
      startingCurrency: {
        gold: startingGold,
        silver: startingSilver,
        copper: startingCopper
      },
      inventory: [],
      marketId: market.id,
      accessCode: accessCode,
      enteredAt: Date.now()
    };

    localStorage.setItem(`player_${accessCode}_data`, JSON.stringify(playerData));

    // Navigate to shops list
    navigate(`/market/${accessCode}/shops`);
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
      <div className="player-error">
        <h1>{error || 'This Market is Closed'}</h1>
        <p>Please check your link and try again.</p>
      </div>
    );
  }

  return (
    <div className="player-entry-container">
      <div className="player-entry-card">
        <h1 className="player-market-title">{market.name}</h1>

        {market.description && (
          <p className="player-market-description">{market.description}</p>
        )}

        <div className="player-currency-section">
          <h2>Your Starting Currency</h2>
          <p className="player-currency-hint">Enter how much gold, silver, and copper you have:</p>

          <div className="player-currency-inputs">
            <div className="player-currency-input-group">
              <label>Gold (GP)</label>
              <input
                type="number"
                min="0"
                value={gold}
                onChange={(e) => setGold(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="player-currency-input-group">
              <label>Silver (SP)</label>
              <input
                type="number"
                min="0"
                value={silver}
                onChange={(e) => setSilver(e.target.value)}
                placeholder="0"
              />
            </div>

            <div className="player-currency-input-group">
              <label>Copper (CP)</label>
              <input
                type="number"
                min="0"
                value={copper}
                onChange={(e) => setCopper(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleEnterMarket}
          className="player-enter-button"
        >
          Enter Market
        </button>
      </div>
    </div>
  );
}
