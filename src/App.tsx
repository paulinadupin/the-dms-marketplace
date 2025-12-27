import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/SettingsPage';
import { ShopManagement } from './pages/ShopManagement';
import { ShopInventory } from './pages/ShopInventory';
import { ItemLibraryPage } from './pages/ItemLibrary';
import { PlayerNameEntry } from './pages/PlayerNameEntry';
import { PlayerMarketEntry } from './pages/PlayerMarketEntry';
import { PlayerShopsList } from './pages/PlayerShopsList';
import { PlayerShopInventory } from './pages/PlayerShopInventory';
import { PlayerMarketSummary } from './pages/PlayerMarketSummary';
import { HowToUsePage } from './pages/HowToUsePage';
import { AboutPage } from './pages/AboutPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/how-to-use" element={<HowToUsePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/item-library" element={<ItemLibraryPage />} />

        {/* Player Routes - Must come BEFORE DM routes to avoid conflicts */}
        <Route path="/player/enter/:accessCode" element={<PlayerNameEntry />} />
        <Route path="/market/:accessCode" element={<PlayerMarketEntry />} />
        <Route path="/market/:accessCode/shops" element={<PlayerShopsList />} />
        <Route path="/market/:accessCode/shop/:shopId" element={<PlayerShopInventory />} />
        <Route path="/market/:accessCode/summary" element={<PlayerMarketSummary />} />

        {/* DM Routes */}
        <Route path="/dm/market/:marketId/shops" element={<ShopManagement />} />
        <Route path="/shop/:shopId/inventory" element={<ShopInventory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
