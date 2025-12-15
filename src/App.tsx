import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/SettingsPage';
import { ShopManagement } from './pages/ShopManagement';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/market/:marketId/shops" element={<ShopManagement />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
