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
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          width: '50px',
          height: '50px',
          backgroundColor: '#6c757d',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5a6268'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6c757d'}
        title="Back to Dashboard"
      >
        ←
      </button>

      {/* Hamburger Menu */}
      <HamburgerMenu />

      {/* Header */}
      <div className="page-header-fullwidth">
        <div className="page-header-content" style={{ maxWidth: '800px' }}>
          <h1>Account Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>

        {/* Current Info */}
        <div style={{
          padding: '20px',
          backgroundColor: '#e7f3ff',
          borderRadius: '8px',
          marginBottom: '30px'
        }}>
          <h3 style={{ marginTop: 0 }}>Current Account Info</h3>
          <p style={{ margin: '5px 0' }}>
            <strong>Display Name:</strong> {user.displayName || 'Not set'}
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Email:</strong> {user.email}
          </p>
          {isGoogleUser && (
            <p style={{
              margin: '15px 0 0 0',
              padding: '10px',
              backgroundColor: '#fff3cd',
              borderRadius: '5px',
              fontSize: '14px',
              color: '#856404'
            }}>
              You're signed in with Google. Email and password changes must be made through your Google account.
            </p>
          )}
        </div>

        {/* Update Display Name */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0 }}>Change Display Name</h2>
          <form onSubmit={handleUpdateDisplayName}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                New Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={displayNameLoading}
              style={{
                padding: '10px 20px',
                backgroundColor: displayNameLoading ? '#6c757d' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: displayNameLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              {displayNameLoading ? 'Updating...' : 'Update Display Name'}
            </button>
          </form>
        </div>

        {/* Update Email - Only for non-Google users */}
        {!isGoogleUser && (
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{ marginTop: 0 }}>Change Email</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
              You'll need to enter your current password to change your email.
            </p>
            <form onSubmit={handleUpdateEmail}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  New Email
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={emailLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: emailLoading ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: emailLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {emailLoading ? 'Updating...' : 'Update Email'}
              </button>
            </form>
          </div>
        )}

        {/* Update Password - Only for non-Google users */}
        {!isGoogleUser && (
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h2 style={{ marginTop: 0 }}>Change Password</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
              You'll need to enter your current password to set a new one.
            </p>
            <form onSubmit={handleUpdatePassword}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={passwordLoading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: passwordLoading ? '#6c757d' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: passwordLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Danger Zone - Delete Account */}
        <div style={{
          padding: '20px',
          backgroundColor: '#fff5f5',
          border: '2px solid #dc3545',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h2 style={{ marginTop: 0, color: '#dc3545' }}>Danger Zone</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
            Once you delete your account, there is no going back. This will permanently delete:
          </p>
          <ul style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
            <li>Your user profile</li>
            <li>All your markets</li>
            <li>All shops and items</li>
            <li>All associated data</li>
          </ul>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h2 style={{ marginTop: 0, color: '#dc3545' }}>Delete Account?</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </p>
            <div style={{
              padding: '15px',
              backgroundColor: '#fff5f5',
              border: '1px solid #dc3545',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <strong style={{ color: '#dc3545' }}>Warning:</strong>
              <ul style={{ margin: '10px 0 0 20px', color: '#666' }}>
                <li>All markets will be deleted</li>
                <li>All shops will be deleted</li>
                <li>All items will be deleted</li>
                <li>This cannot be reversed</li>
              </ul>
            </div>
            <form onSubmit={handleDeleteAccount}>
              {!isGoogleUser && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Enter your password to confirm
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    placeholder="Current password"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}
              {isGoogleUser && (
                <p style={{ color: '#666', marginBottom: '20px' }}>
                  Click the button below to permanently delete your account.
                </p>
              )}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                  }}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: deleteLoading ? '#6c757d' : '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
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
