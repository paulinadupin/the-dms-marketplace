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
    <div ref={menuRef} className="hamburger-menu">
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hamburger-button"
      >
        <div />
        <div />
        <div />
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
              backgroundColor: '#161b22',
              color: '#b4b4b4ff',
              border: 'none',
              borderBottom: '1px solid #e0e0e0',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2f3947ff'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#161b22'}
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
              backgroundColor: '#161b22',
              color: '#bebbbbff',
              border: 'none',
              borderBottom: '1px solid #e0e0e0',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2f3947ff'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#161b22'}
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
              backgroundColor: '#161b22',
              color: '#dc3545',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              textAlign: 'left',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2f3947ff'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#161b22'}
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
