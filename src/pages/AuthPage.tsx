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
        <h1 className="text-center" style={{ marginBottom: '10px' }}>
          The DM's Marketplace
        </h1>
        <p className="text-center text-secondary" style={{ marginBottom: '30px' }}>
          {mode === 'signin' ? 'Sign in to your account' : 'Create a new DM account'}
        </p>

        {/* Tabs */}
        <div className="tab-group">
          <button
            onClick={() => setMode('signin')}
            className={`tab-btn ${mode === 'signin' ? 'tab-btn-active' : ''}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`tab-btn ${mode === 'signup' ? 'tab-btn-active' : ''}`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form onSubmit={mode === 'signup' ? handleEmailSignUp : handleEmailSignIn}>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="Dungeon Master Dave"
                className="form-input"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="dm@example.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Min. 6 characters"
              minLength={6}
              className="form-input"
            />
          </div>

          {mode === 'signin' && (
            <div className="text-right form-group">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="btn-ghost"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`btn btn-block btn-large ${loading ? 'btn-secondary' : 'btn-primary'}`}
          >
            {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="divider">
          <span>OR</span>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="btn-google"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0 }}>Reset Password</h2>

            {resetSent ? (
              <>
                <div className="success-message" style={{ padding: '15px' }}>
                  Password reset email sent! Check your inbox and follow the instructions.
                </div>
                <button
                  onClick={closeForgotPassword}
                  className="btn btn-primary btn-block"
                >
                  Close
                </button>
              </>
            ) : (
              <form onSubmit={handlePasswordReset}>
                <p className="text-secondary text-description">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {error && (
                  <div className="error-message">
                    {error}
                  </div>
                )}

                <div className="form-group-lg">
                  <label className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="dm@example.com"
                    className="form-input"
                  />
                </div>

                <div className="btn-group">
                  <button
                    type="button"
                    onClick={closeForgotPassword}
                    className="btn btn-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`btn ${loading ? 'btn-secondary' : 'btn-primary'}`}
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
