import { useState, useEffect } from 'react';

interface InfoBannerProps {
  storageKey: string;
  message: string;
}

export function InfoBanner({ storageKey, message }: InfoBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = localStorage.getItem(storageKey);
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="info-banner">
      <div className="info-banner-content">
        <span className="info-banner-icon">ℹ</span>
        <p className="info-banner-message">{message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="info-banner-close"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
