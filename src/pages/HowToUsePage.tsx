import { useNavigate } from 'react-router-dom';

export function HowToUsePage() {
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
            <a href="https://github.com/paulinadupin/the-dms-marketplace/issues" target="_blank" rel="noopener noreferrer" className="landing-nav-link">Support</a>
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
      <div className="how-to-use-container">
        <div className="how-to-use-content">
          <h1 className="how-to-use-title">How to Use The DM's Marketplace</h1>

          <p className="how-to-use-intro">
            The DM's Marketplace is a tool that brings virtual shopping to your D&D sessions.
            DMs create marketplaces with shops and items, while players browse and trade in real-time.
          </p>

          {/* For Dungeon Masters Section */}
          <section className="how-to-section">
            <h2 className="how-to-section-title">For Dungeon Masters</h2>

            <div className="how-to-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Create an Account</h3>
                <p>Sign up with your email to get started. You'll use this account to manage all your marketplaces and shops.</p>
              </div>
            </div>

            <div className="how-to-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Create a Marketplace</h3>
                <p>From your dashboard, create a new marketplace for your campaign. Give it a name (like "Waterdeep Markets" or "The Bazaar of Forgotten Souls") and optionally add a description. Each marketplace gets a unique access code that you'll share with your players.</p>
              </div>
            </div>

            <div className="how-to-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Build Your Shops</h3>
                <p>Add shops to your marketplace. Each shop can have:</p>
                <ul>
                  <li>A unique name and description</li>
                  <li>A category (General Store, Blacksmith, Magic Shop, etc.)</li>
                  <li>A location within your world</li>
                  <li>A shopkeeper name for roleplay flavor</li>
                </ul>
              </div>
            </div>

            <div className="how-to-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Stock Your Shops</h3>
                <p>Add items to each shop from the item library. You can:</p>
                <ul>
                  <li>Search and filter items by name, type, rarity, and more</li>
                  <li>Set custom prices for each item</li>
                  <li>Define stock quantities (unlimited or limited)</li>
                  <li>Create custom items if the library doesn't have what you need</li>
                </ul>
              </div>
            </div>

            <div className="how-to-step">
              <div className="step-number">5</div>
              <div className="step-content">
                <h3>Share with Players</h3>
                <p>When you're ready for your session, activate the marketplace and share the access code with your players. They'll use this code to enter the marketplace and start shopping.</p>
              </div>
            </div>

            <div className="how-to-step">
              <div className="step-number">6</div>
              <div className="step-content">
                <h3>Manage During Sessions</h3>
                <p>While players shop, you can:</p>
                <ul>
                  <li>Track active player sessions in real-time</li>
                  <li>Edit shop inventory on the fly</li>
                  <li>Adjust prices and stock</li>
                  <li>Close the marketplace when the session ends</li>
                </ul>
              </div>
            </div>

            <div className="how-to-step">
              <div className="step-number">7</div>
              <div className="step-content">
                <h3>Reuse and Duplicate</h3>
                <p>Save time by duplicating shops across marketplaces or reactivating the same marketplace for future sessions. Your shops and items are saved permanently.</p>
              </div>
            </div>
          </section>

          {/* For Players Section */}
          <section className="how-to-section">
            <h2 className="how-to-section-title">For Players</h2>

            <div className="how-to-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Get the Access Code</h3>
                <p>Your DM will provide you with a unique access code for the marketplace. This is usually a short code like "abc123".</p>
              </div>
            </div>

            <div className="how-to-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Enter the Marketplace</h3>
                <p>On the home page, enter the access code your DM gave you. You'll be taken to the marketplace entry page.</p>
              </div>
            </div>

            <div className="how-to-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Enter Your Character Name</h3>
                <p>You'll be asked to enter your character name so the DM can track who's in the marketplace.</p>
              </div>
            </div>

            <div className="how-to-step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Set Your Starting Currency</h3>
                <p>Enter how much gold, silver, and copper your character has. This will be tracked as you shop. Don't worry - it's stored locally on your device, so only you can see and edit it.</p>
              </div>
            </div>

            <div className="how-to-step">
              <div className="step-number">5</div>
              <div className="step-content">
                <h3>Browse Shops</h3>
                <p>You'll see all available shops in the marketplace. Click on any shop to view its inventory, prices, and stock.</p>
              </div>
            </div>

            <div className="how-to-step">
              <div className="step-number">6</div>
              <div className="step-content">
                <h3>Buy and Sell Items</h3>
                <p>When you find an item you want:</p>
                <ul>
                  <li>Click "Buy" to purchase it - your currency will automatically update</li>
                  <li>Items are added to your inventory</li>
                  <li>You can also sell items back to shops if the DM allows it</li>
                  <li>View your full inventory anytime from the menu</li>
                </ul>
              </div>
            </div>

            <div className="how-to-step">
              <div className="step-number">7</div>
              <div className="step-content">
                <h3>Track Your Inventory</h3>
                <p>Access your inventory from the top menu to see:</p>
                <ul>
                  <li>All items you've purchased</li>
                  <li>Your current currency (gold, silver, copper)</li>
                  <li>Your shopping summary</li>
                </ul>
                <p className="how-to-note">
                  <strong>Important:</strong> Your inventory is stored in your browser. When the session ends, write down your items and currency before closing the page!
                </p>
              </div>
            </div>
          </section>

          {/* Tips Section */}
          <section className="how-to-section">
            <h2 className="how-to-section-title">Tips and Tricks</h2>

            <div className="how-to-tips">
              <div className="how-to-tip">
                <h4>For DMs:</h4>
                <ul>
                  <li>Create a marketplace template with common shops and items, then duplicate it for new campaigns</li>
                  <li>Use the item library filters to quickly find specific items</li>
                  <li>Set session time limits to automatically close the marketplace</li>
                  <li>Monitor player sessions to see who's actively shopping</li>
                </ul>
              </div>

              <div className="how-to-tip">
                <h4>For Players:</h4>
                <ul>
                  <li>Keep the marketplace page open in a separate tab during the session</li>
                  <li>Check the shopping overview to see your total spending at a glance</li>
                  <li>Remember to write down your final inventory before the session ends</li>
                  <li>If the marketplace closes unexpectedly, your inventory summary will still be available</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <div className="how-to-cta">
            <h3>Ready to get started?</h3>
            <div className="how-to-cta-buttons">
              <button onClick={() => navigate('/auth')} className="landing-btn-signup">
                Sign Up as a DM
              </button>
              <button onClick={() => navigate('/')} className="landing-btn-login">
                Enter as a Player
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-container">
          <div className="landing-footer-links">
            <a href="/privacy" className="landing-footer-link">Privacy Policy</a>
            <a href="https://github.com/paulinadupin/the-dms-marketplace" target="_blank" rel="noopener noreferrer" className="landing-footer-link">GitHub</a>
          </div>
          <div>
            © 2025 The DM's Marketplace. All rights reserved.
          </div>
        </div>
      </footer>
    </>
  );
}
