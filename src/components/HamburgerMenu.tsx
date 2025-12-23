import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../services/auth.service';

export function HamburgerMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    await AuthService.signOut();
    navigate('/auth');
  };

  return (
    <div ref={menuRef} style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000
    }}>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '50px',
          height: '50px',
          backgroundColor: '#007bff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '5px',
          padding: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{
          width: '25px',
          height: '3px',
          backgroundColor: 'white',
          borderRadius: '2px',
          transition: 'all 0.3s'
        }} />
        <div style={{
          width: '25px',
          height: '3px',
          backgroundColor: 'white',
          borderRadius: '2px',
          transition: 'all 0.3s'
        }} />
        <div style={{
          width: '25px',
          height: '3px',
          backgroundColor: 'white',
          borderRadius: '2px',
          transition: 'all 0.3s'
        }} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '0',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '200px',
          overflow: 'hidden'
        }}>
          <button
            onClick={() => {
              navigate('/item-library');
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              padding: '15px 20px',
              backgroundColor: 'white',
              color: '#333',
              border: 'none',
              borderBottom: '1px solid #e0e0e0',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Item Library
          </button>
          <button
            onClick={() => {
              navigate('/settings');
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              padding: '15px 20px',
              backgroundColor: 'white',
              color: '#333',
              border: 'none',
              borderBottom: '1px solid #e0e0e0',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Settings
          </button>
          <button
            onClick={() => {
              handleSignOut();
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              padding: '15px 20px',
              backgroundColor: 'white',
              color: '#dc3545',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
