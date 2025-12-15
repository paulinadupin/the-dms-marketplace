import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '15px',
      backgroundColor: type === 'success' ? '#d4edda' : '#f8d7da',
      color: type === 'success' ? '#155724' : '#721c24',
      borderRadius: '5px',
      zIndex: 9999
    }}>
      {message}
    </div>
  );
}
