import { useState, useEffect } from 'react';
import { AuthService } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'signin' | 'signup';

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange((user) => {
      if (user) {
        navigate('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await AuthService.registerDM(email, password, displayName);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await AuthService.signIn(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      await AuthService.signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await AuthService.sendPasswordReset(resetEmail);
      setResetSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetEmail('');
    setResetSent(false);
    setError('');
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-icon">⚔️</div>
          <h1 className="auth-title">The DM's Marketplace</h1>
          <p className="auth-subtitle">
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new DM account'}
          </p>
        </div>

        <div className="auth-divider" />

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            onClick={() => setMode('signin')}
            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            padding: 'var(--spacing-sm)',
            marginBottom: 'var(--spacing-md)',
            backgroundColor: 'rgba(218, 54, 51, 0.15)',
            color: 'var(--gh-danger-fg)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            border: '1px solid var(--gh-danger-emphasis)'
          }}>
            {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={mode === 'signup' ? handleEmailSignUp : handleEmailSignIn} className="auth-form">
          {mode === 'signup' && (
            <div className="auth-input-group">
              <label className="auth-label">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Dungeon Master Dave"
                className="auth-input"
              />
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="dm@example.com"
              className="auth-input"
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Min. 6 characters"
              minLength={6}
              className="auth-input"
            />
          </div>

          {mode === 'signin' && (
            <div className="auth-forgot-password">
              <a
                onClick={() => setShowForgotPassword(true)}
                className="auth-forgot-link"
              >
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: 'var(--spacing-lg) 0',
          color: 'var(--gh-fg-muted)'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--gh-border-default)' }} />
          <span style={{ padding: '0 var(--spacing-sm)', fontSize: '12px' }}>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--gh-border-default)' }} />
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="auth-google-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        {/* Back to Home */}
        <div className="auth-back-section">
          <button
            onClick={() => navigate('/')}
            className="auth-back-btn"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="auth-modal-overlay" onClick={closeForgotPassword}>
          <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={closeForgotPassword}>×</button>

            <h2 className="auth-modal-title">Reset Password</h2>

            {resetSent ? (
              <>
                <div style={{
                  padding: 'var(--spacing-md)',
                  backgroundColor: 'rgba(35, 134, 54, 0.15)',
                  color: 'var(--gh-success-fg)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 'var(--spacing-lg)',
                  border: '1px solid var(--gh-success-emphasis)'
                }}>
                  Password reset email sent! Check your inbox and follow the instructions.
                </div>
                <button
                  onClick={closeForgotPassword}
                  className="auth-submit-btn"
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handlePasswordReset} className="auth-modal-form">
                <p className="auth-modal-text">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {error && (
                  <div style={{
                    padding: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-md)',
                    backgroundColor: 'rgba(218, 54, 51, 0.15)',
                    color: 'var(--gh-danger-fg)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    border: '1px solid var(--gh-danger-emphasis)'
                  }}>
                    {error}
                  </div>
                )}

                <div className="auth-input-group">
                  <label className="auth-label">
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="dm@example.com"
                    className="auth-input"
                  />
                </div>

                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    style={{
                      flex: 1,
                      padding: 'var(--spacing-sm) var(--spacing-md)',
                      backgroundColor: 'var(--gh-btn-bg)',
                      color: 'var(--gh-fg-default)',
                      border: '1px solid var(--gh-border-default)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '600',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="auth-submit-btn"
                    style={{ flex: 1 }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
