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
        <div className="hamburger-dropdown">
          <button
            onClick={() => {
              navigate('/item-library');
              setIsOpen(false);
            }}
            className="hamburger-menu-item"
          >
            Item Library
          </button>
          <button
            onClick={() => {
              navigate('/settings');
              setIsOpen(false);
            }}
            className="hamburger-menu-item"
          >
            Settings
          </button>
          <button
            onClick={() => {
              handleSignOut();
              setIsOpen(false);
            }}
            className="hamburger-menu-item danger"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
