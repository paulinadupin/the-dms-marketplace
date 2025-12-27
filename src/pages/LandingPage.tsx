import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Toast } from '../components/Toast';

export function LandingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [accessCode, setAccessCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's an error message from navigation state
    if (location.state?.error) {
      setErrorMessage(location.state.error);
      // Clear the error from location state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim()) {
      navigate(`/player/enter/${accessCode.trim()}`);
    }
  };

  return (
    <>
      {errorMessage && (
        <Toast
          message={errorMessage}
          type="error"
          onClose={() => setErrorMessage(null)}
        />
      )}

      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-nav-logo">
            {/* <span className="landing-nav-logo-icon">⚔️</span> */}
            The DM's Marketplace
          </div>

          <div className="landing-nav-links">
            <a href="/" className="landing-nav-link">Home</a>
            <a href="/how-to-use" className="landing-nav-link">How to Use</a>
            <a href="/about" className="landing-nav-link">About Us</a>
            <a href="https://github.com/paulinadupin/the-dms-marketplace" target="_blank" rel="noopener noreferrer" className="landing-nav-link">GitHub</a>
          </div>

          <div className="landing-nav-buttons">
            <button
              onClick={() => navigate('/auth')}
              className="landing-btn-login"
            >
              Log In
            </button>
            <button
              onClick={() => navigate('/auth')}
              className="landing-btn-signup"
            >
              Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="landing-hero">
        <div className="landing-hero-container">
          <h1 className="landing-hero-title">
            Welcome to The DM's Marketplace
          </h1>

          <p className="landing-hero-subtitle">
            Create and manage virtual shops for your D&D campaigns. Players can browse, buy, and sell items in real-time during your sessions.
          </p>

          {/* Stats Section - Placeholder
          <div className="landing-stats">
            <div>
              <div className="landing-stat-number">1,234</div>
              <div className="landing-stat-label">Active Markets</div>
            </div>
            <div>
              <div className="landing-stat-number">5,678</div>
              <div className="landing-stat-label">Items Traded</div>
            </div>
            <div>
              <div className="landing-stat-number">890</div>
              <div className="landing-stat-label">Happy DMs</div>
            </div>
          </div> */}

          {/* Access Code Input Section */}
          <div className="landing-access-section">
            <h2 className="landing-access-title">
              Join a Market
            </h2>
            <p className="landing-access-subtitle">
              Enter the access code provided by your DM to join their marketplace
            </p>

            <form onSubmit={handleAccessCodeSubmit} className="landing-access-form">
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toLowerCase())}
                placeholder="Enter Access Code"
                className="landing-access-input"
              />
              <button
                type="submit"
                disabled={!accessCode.trim()}
                className="landing-access-button"
              >
                Enter Market
              </button>
            </form>
          </div>

          <div className="landing-access-hint">
            Don't have an access code? Ask your Dungeon Master!
          </div>
        </div>
      </div>

    </>
  );
}
