import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MarketService } from '../services/market.service';
import { PlayerSessionService } from '../services/player-session.service';
import type { Market } from '../types/firebase';

export function PlayerMarketEntry() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();

  const [market, setMarket] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  // Currency inputs
  const [gold, setGold] = useState('');
  const [silver, setSilver] = useState('');
  const [copper, setCopper] = useState('');

  useEffect(() => {
    loadMarket();
  }, [accessCode]);

  const loadMarket = async () => {
    if (!accessCode) {
      navigate('/', { state: { error: 'Invalid market link. Please enter a valid access code.' } });
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

  const handleEnterMarket = async () => {
    if (!market || !accessCode) return;

    const startingGold = parseInt(gold) || 0;
    const startingSilver = parseInt(silver) || 0;
    const startingCopper = parseInt(copper) || 0;

    // Get player name from localStorage
    const playerName = localStorage.getItem(`player_${accessCode}_name`) || 'Adventurer';

    try {
      // Create player session in Firebase for DM tracking
      const sessionId = await PlayerSessionService.createSession(market.id, playerName);

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
        enteredAt: Date.now(),
        sessionId: sessionId
      };

      localStorage.setItem(`player_${accessCode}_data`, JSON.stringify(playerData));

      // Navigate to shops list
      navigate(`/market/${accessCode}/shops`);
    } catch (err) {
      console.error('Failed to create player session:', err);
      // Still navigate even if session creation fails
      navigate(`/market/${accessCode}/shops`);
    }
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
