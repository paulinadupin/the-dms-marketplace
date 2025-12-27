import { useState, useEffect } from 'react';
import { AuthService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { Toast } from '../components/Toast';
import { HamburgerMenu } from '../components/HamburgerMenu';

export function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  // Display Name Form
  const [displayName, setDisplayName] = useState('');
  const [displayNameLoading, setDisplayNameLoading] = useState(false);

  // Email Form
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete Account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((authUser) => {
      if (!authUser) {
        navigate('/auth');
        return;
      }
      setUser(authUser);
      setDisplayName(authUser.displayName || '');

      // Check if user signed in with Google
      const isGoogle = authUser.providerData.some(
        provider => provider.providerId === 'google.com'
      );
      setIsGoogleUser(isGoogle);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleUpdateDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisplayNameLoading(true);

    try {
      await AuthService.updateDisplayName(displayName);
      setToast({ message: 'Display name updated successfully!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setDisplayNameLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);

    try {
      await AuthService.updateUserEmail(newEmail, emailPassword);
      setToast({ message: 'Email updated successfully!', type: 'success' });
      setNewEmail('');
      setEmailPassword('');
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setToast({ message: 'New passwords do not match', type: 'error' });
      return;
    }

    if (newPassword.length < 6) {
      setToast({ message: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setPasswordLoading(true);

    try {
      await AuthService.updateUserPassword(currentPassword, newPassword);
      setToast({ message: 'Password updated successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteLoading(true);

    try {
      // Only pass password for non-Google users
      await AuthService.deleteAccount(isGoogleUser ? undefined : deletePassword);
      // User is automatically signed out and redirected by auth state listener
      setToast({ message: 'Account deleted successfully', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message, type: 'error' });
      setDeleteLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="auth-container">
        Loading...
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header Bar */}
      <div className="dm-header-bar">
        <button
          onClick={() => navigate('/dashboard')}
          className="dm-back-button"
          title="Back to Dashboard"
        >
          ←
        </button>
        <h1 className="dm-header-title">Account Settings</h1>
        <HamburgerMenu />
      </div>

      {/* Content */}
      <div className="settings-content">

        {/* Current Info */}
        <div className="info-box">
          <h3 style={{ marginTop: 0 }}>Current Account Info</h3>
          <p style={{ margin: '5px 0' }}>
            <strong>Display Name:</strong> {user.displayName || 'Not set'}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Email:</strong> {user.email}
          </p>
          {isGoogleUser && (
            <p className="warning-message">
              You're signed in with Google. Email and password changes must be made through your Google account.
            </p>
          )}
        </div>

        {/* Update Display Name */}
        <div className="section-card">
          <h2 style={{ marginTop: 0 }}>Change Display Name</h2>
          <form onSubmit={handleUpdateDisplayName}>
            <div className="form-group">
              <label className="form-label">
                New Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="form-input"
              />
            </div>
            <button
              type="submit"
              disabled={displayNameLoading}
              className={`btn ${displayNameLoading ? 'btn-secondary' : 'btn-primary'}`}
            >
              {displayNameLoading ? 'Updating...' : 'Update Display Name'}
            </button>
          </form>
        </div>

        {/* Update Email - Only for non-Google users */}
        {!isGoogleUser && (
          <div className="section-card">
            <h2 style={{ marginTop: 0 }}>Change Email</h2>
            <p className="text-secondary text-small" style={{ marginBottom: '15px' }}>
              You'll need to enter your current password to change your email.
            </p>
            <form onSubmit={handleUpdateEmail}>
              <div className="form-group">
                <label className="form-label">
                  New Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Current Password
                </label>
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <button
                type="submit"
                disabled={emailLoading}
                className={`btn ${emailLoading ? 'btn-secondary' : 'btn-primary'}`}
              >
                {emailLoading ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>
        )}

        {/* Update Password - Only for non-Google users */}
        {!isGoogleUser && (
          <div className="section-card">
            <h2 style={{ marginTop: 0 }}>Change Password</h2>
            <p className="text-secondary text-small" style={{ marginBottom: '15px' }}>
              You'll need to enter your current password to set a new one.
            </p>
            <form onSubmit={handleUpdatePassword}>
              <div className="form-group">
                <label className="form-label">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="form-input"
                />
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                className={`btn ${passwordLoading ? 'btn-secondary' : 'btn-primary'}`}
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Danger Zone - Delete Account */}
        <div className="danger-zone">
          <h2 style={{ marginTop: 0 }}>Danger Zone</h2>
          <p className="text-secondary text-small" style={{ marginBottom: '15px' }}>
            Once you delete your account, there is no going back. This will permanently delete:
          </p>
          <ul>
            <li>Your user profile</li>
            <li>All your markets</li>
            <li>All shops and items</li>
            <li>All associated data</li>
          </ul>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="btn btn-danger btn-large"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginTop: 0, color: 'var(--color-button-danger)' }}>Delete Account?</h2>
            <p className="text-secondary text-description">
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </p>
            <div className="danger-box">
              <strong style={{ color: 'var(--color-button-danger)' }}>Warning:</strong>
              <ul style={{ margin: '10px 0 0 20px', color: 'var(--color-text-secondary)' }}>
                <li>All markets will be deleted</li>
                <li>All shops will be deleted</li>
                <li>All items will be deleted</li>
                <li>This cannot be reversed</li>
              </ul>
            </div>
            <form onSubmit={handleDeleteAccount}>
              {!isGoogleUser && (
                <div className="form-group-lg">
                  <label className="form-label">
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    placeholder="Current password"
                    className="form-input"
                  />
                </div>
              )}
              {isGoogleUser && (
                <p className="text-secondary text-description">
                  Click the button below to permanently delete your account.
                </p>
              )}
              <div className="btn-group">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                  className="btn btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  className={`btn btn-large ${deleteLoading ? 'btn-secondary' : 'btn-danger'}`}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete Account Permanently'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
