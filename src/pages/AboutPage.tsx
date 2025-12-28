import { useNavigate } from 'react-router-dom';

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <>
      {/* Navigation Bar */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <div className="landing-nav-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
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

      {/* Main Content */}
      <div className="about-container">
        <div className="about-content">
          <h1 className="about-title">About The DM's Marketplace</h1>

          {/* Mission Section */}
          <section className="about-section">
            <h2 className="about-section-title">Our Mission</h2>
            <p className="about-text">
              The DM's Marketplace was created to solve a simple problem: managing shopping sessions in D&D campaigns can be chaotic, time-consuming, and often slows down the game.
            </p>
            <p className="about-text">
              We wanted to give Dungeon Masters a tool that makes running shops and marketplaces effortless, while giving players an engaging, interactive way to browse and buy items without disrupting the flow of the session.
            </p>
          </section>

          {/* Story Section */}
          <section className="about-section">
            <h2 className="about-section-title">The Story Behind It</h2>
            <p className="about-text">
              Every DM knows the struggle: players want to explore shops, compare prices, and manage their inventory, but traditional pen-and-paper methods can bog down the game. Tracking who has what, how much gold everyone spent, and what's in stock becomes a logistical nightmare.
            </p>
            <p className="about-text">
              The DM's Marketplace was born from this frustration. We wanted a digital solution that would:
            </p>
            <ul className="about-list">
              <li>Let players browse shops independently during sessions</li>
              <li>Automatically track currency and inventory</li>
              <li>Give DMs full control without micromanaging every transaction</li>
              <li>Work seamlessly in both in-person and online sessions</li>
              <li>Be simple enough to set up in minutes, not hours</li>
            </ul>
          </section>

          {/* Support Section */}
          <section className="about-section">
            <h2 className="about-section-title">Report Issues</h2>
            <p className="about-text">
              Found a bug or have a suggestion? We'd love to hear from you. Please report any issues or feedback on our GitHub Issues page.
            </p>
            <div className="about-cta">
              <a
                href="https://github.com/paulinadupin/the-dms-marketplace/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="about-github-button"
              >
                Report an Issue
              </a>
            </div>
          </section>

          {/* Final CTA */}
          <div className="about-final-cta">
            <h3>Ready to Transform Your Shopping Sessions?</h3>
            <p>Join DMs who are already using The DM's Marketplace to bring their campaigns to life.</p>
            <button onClick={() => navigate('/auth')} className="landing-btn-signup">
              Get Started
            </button>
          </div>
        </div>
      </div>

    </>
  );
}
