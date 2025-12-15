import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/" element={<Navigate to="/auth" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
