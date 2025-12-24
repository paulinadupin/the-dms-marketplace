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
      <div className="player-error">
        <h1>{error || 'This Market is Closed'}</h1>
        <p>Please check your access code and try again.</p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '2rem',
            padding: '0.8rem 2rem',
            backgroundColor: '#4ecdc4',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '600px',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: '3rem',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        textAlign: 'center',
        color: '#f0f0f0'
      }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem'
        }}>
          ⚔️
        </div>

        <h1 style={{
          fontSize: '2rem',
          marginBottom: '0.5rem',
          color: '#4ecdc4'
        }}>
          {market.name}
        </h1>

        {market.description && (
          <p style={{
            fontSize: '1rem',
            color: '#b0b0b0',
            marginBottom: '2rem'
          }}>
            {market.description}
          </p>
        )}

        <div style={{
          height: '1px',
          backgroundColor: 'rgba(78, 205, 196, 0.3)',
          margin: '2rem 0'
        }} />

        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '1rem',
          color: '#f0f0f0'
        }}>
          Welcome, Adventurer!
        </h2>

        <p style={{
          fontSize: '1rem',
          color: '#b0b0b0',
          marginBottom: '2rem'
        }}>
          Before entering the marketplace, please tell us your name
        </p>

        <form onSubmit={handleContinue} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          <div>
            <label style={{
              display: 'block',
              textAlign: 'left',
              marginBottom: '0.5rem',
              color: '#b0b0b0',
              fontSize: '0.9rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Player Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your character name"
              autoFocus
              maxLength={30}
              style={{
                width: '100%',
                padding: '1rem 1.5rem',
                fontSize: '1.1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#f0f0f0',
                border: '2px solid rgba(78, 205, 196, 0.3)',
                borderRadius: '8px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#4ecdc4';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(78, 205, 196, 0.3)';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </div>

          {/* Avatar Selection - Placeholder for future feature */}
          <div style={{
            padding: '1.5rem',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(78, 205, 196, 0.2)',
            textAlign: 'center'
          }}>
            <p style={{
              margin: 0,
              color: '#b0b0b0',
              fontSize: '0.9rem'
            }}>
                Avatar selection coming soon!
            </p>
          </div>

          <button
            type="submit"
            disabled={!playerName.trim()}
            style={{
              padding: '1rem 2rem',
              backgroundColor: playerName.trim() ? '#4ecdc4' : '#666',
              color: playerName.trim() ? '#1a1a2e' : '#999',
              border: 'none',
              borderRadius: '8px',
              cursor: playerName.trim() ? 'pointer' : 'not-allowed',
              fontSize: '1.1rem',
              fontWeight: '700',
              transition: 'all 0.2s',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}
            onMouseEnter={(e) => {
              if (playerName.trim()) {
                e.currentTarget.style.backgroundColor = '#45b8af';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (playerName.trim()) {
                e.currentTarget.style.backgroundColor = '#4ecdc4';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            Continue to Market
          </button>
        </form>

        <div style={{
          marginTop: '2rem',
          paddingTop: '2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              color: '#888',
              border: '1px solid #888',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f0f0f0';
              e.currentTarget.style.borderColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#888';
              e.currentTarget.style.borderColor = '#888';
            }}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
