import { useEffect } from 'react';

interface PurchaseNotificationProps {
  itemName: string;
  onClose: () => void;
}

export function PurchaseNotification({ itemName, onClose }: PurchaseNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Auto-dismiss after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="purchase-notification">
      ✓ Successfully purchased {itemName}!
    </div>
  );
}
